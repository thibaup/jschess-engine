const fs = require("fs");
const vm = require("vm");
const { spawn } = require("child_process");

const DEFAULT_FENS = [
  "6bk/6p1/7p/7P/4Q3/2q1nPP1/4B2K/4r1NR w - - 5 51",
  "6bk/4Q1p1/7p/8/7P/r1q2PP1/4BK1R/4n1N1 w - - 3 44",
  "r4rk1/2qnbpp1/b1p2n1p/p1Pp4/3PpN2/PBN1P3/3B1PPP/R2QK2R w KQ - 1 17"
];

const DEFAULT_STOCKFISH = "stockfish";

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    depth: 22,
    timeMs: 20000,
    stockfish: process.env.STOCKFISH_PATH || DEFAULT_STOCKFISH,
    fens: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--depth" && args[i + 1]) {
      options.depth = parseInt(args[++i], 10);
    } else if (arg === "--time" && args[i + 1]) {
      options.timeMs = parseInt(args[++i], 10);
    } else if (arg === "--stockfish" && args[i + 1]) {
      options.stockfish = args[++i];
    } else if (arg === "--fen" && args[i + 1]) {
      options.fens.push(args[++i]);
    } else if (arg === "--fen-file" && args[i + 1]) {
      const fenFile = args[++i];
      const lines = fs.readFileSync(fenFile, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const fen = line.trim();
        if (fen.length > 0 && !fen.startsWith("#")) {
          options.fens.push(fen);
        }
      }
    }
  }

  if (!Number.isFinite(options.depth) || options.depth < 1) options.depth = 22;
  if (!Number.isFinite(options.timeMs) || options.timeMs < 50) options.timeMs = 20000;
  if (options.fens.length === 0) options.fens = DEFAULT_FENS.slice(0);
  return options;
}

function makeDomStub() {
  const stateStore = Object.create(null);
  function makeStub(selector) {
    return {
      length: 0,
      click() { return this; },
      change() { return this; },
      on() { return this; },
      ajaxComplete() { return this; },
      remove() { return this; },
      append() { return this; },
      empty() { return this; },
      css() { return this; },
      attr() { return this; },
      removeClass() { return this; },
      addClass() { return this; },
      find() { return this; },
      each() { return this; },
      offset() { return { left: 0, top: 0 }; },
      val(value) {
        const key = selector + "::val";
        if (typeof value === "undefined") return stateStore[key] || "";
        stateStore[key] = String(value);
        return this;
      },
      text(value) {
        const key = selector + "::text";
        if (typeof value === "undefined") return stateStore[key] || "";
        stateStore[key] = String(value);
        return this;
      }
    };
  }

  global.window = { innerWidth: 1200, console };
  global.document = { documentElement: { clientWidth: 1200 } };
  global.$ = function(selector) {
    if (typeof selector === "function") return makeStub("__ready__");
    return makeStub(String(selector));
  };
  $.trim = (value) => String(value).trim();
  $.now = () => Date.now();
  $.ajax = function() {};
}

function bootstrapEngine() {
  makeDomStub();
  vm.runInThisContext(fs.readFileSync("js/all.js", "utf8"), { filename: "js/all.js" });
  InitFilesRanksBrd();
  InitAttacks();
  InitSq120To64();
  InitPst();
  InitHashKeys();
  InitTT(64);
  InitBoardVars();
  InitMvvLva();
  EvalInit();
  GameController.BookLoaded = BOOL.FALSE;
  EngineSettings.skillLevel = 9;
}

function runEngineFen(fen, depth, timeMs) {
  if (ParseFen(fen) !== BOOL.TRUE) {
    throw new Error("Engine failed to parse FEN: " + fen);
  }
  InitTT(64);
  srch_depth = depth;
  srch_time = timeMs;
  const started = Date.now();
  const result = SearchPosition({
    useBook: false,
    fastPlay: true,
    renderAnalysis: false,
    multiPvCount: 1,
    adaptiveTime: false
  });
  const elapsed = Date.now() - started;
  return {
    best: PrMove(result.bestMove),
    score: result.bestScore,
    depth: result.depth,
    nodes: result.nodes,
    timeMs: elapsed,
    nps: elapsed > 0 ? Math.round((result.nodes * 1000) / elapsed) : 0,
    pv: result.pvLine || ""
  };
}

function parseScoreFromInfo(infoLine) {
  if (!infoLine) return null;
  const cpMatch = infoLine.match(/\bscore\s+cp\s+(-?\d+)/);
  if (cpMatch) return parseInt(cpMatch[1], 10);
  const mateMatch = infoLine.match(/\bscore\s+mate\s+(-?\d+)/);
  if (mateMatch) {
    const mate = parseInt(mateMatch[1], 10);
    return mate > 0 ? (100000 - Math.abs(mate)) : (-100000 + Math.abs(mate));
  }
  return null;
}

function normalizeScoreForMover(score, pliesPlayed) {
  if (typeof score !== "number") return null;
  return (pliesPlayed & 1) ? -score : score;
}

function isUciMove(moveText) {
  return typeof moveText === "string" && /^[a-h][1-8][a-h][1-8][nbrq]?$/.test(moveText);
}

function promotionPieceFromChar(promoChar, side) {
  if (!promoChar) return PIECES.EMPTY;
  switch (String(promoChar).toLowerCase()) {
    case "q": return side === COLOURS.WHITE ? PIECES.wQ : PIECES.bQ;
    case "r": return side === COLOURS.WHITE ? PIECES.wR : PIECES.bR;
    case "b": return side === COLOURS.WHITE ? PIECES.wB : PIECES.bB;
    case "n": return side === COLOURS.WHITE ? PIECES.wN : PIECES.bN;
    default: return PIECES.EMPTY;
  }
}

function parseUciMoveInternal(uciMove) {
  if (!isUciMove(uciMove)) return NOMOVE;
  const from = SqFromAlg(uciMove.slice(0, 2));
  const to = SqFromAlg(uciMove.slice(2, 4));
  if (from === SQUARES.NO_SQ || to === SQUARES.NO_SQ) return NOMOVE;
  const side = brd_side;
  const promoChar = uciMove.length > 4 ? uciMove[4] : "";
  const promoPiece = promotionPieceFromChar(promoChar, side);

  GenerateMoves();
  for (let i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    const move = brd_moveList[i];
    if (FROMSQ(move) !== from || TOSQ(move) !== to) continue;
    const promoted = PROMOTED(move);
    if (promoPiece === PIECES.EMPTY) {
      if (promoted === PIECES.EMPTY) return move;
      continue;
    }
    if (promoted === promoPiece) return move;
  }
  return NOMOVE;
}

function fenAfterMove(fen, uciMove) {
  if (ParseFen(fen) !== BOOL.TRUE) {
    throw new Error("Engine failed to parse FEN for follow-up eval");
  }
  const move = parseUciMoveInternal(uciMove);
  if (move === NOMOVE) {
    throw new Error("Could not parse legal move: " + uciMove);
  }
  if (MakeMove(move) !== BOOL.TRUE) {
    throw new Error("MakeMove rejected move: " + uciMove);
  }
  return BoardToFen();
}

function createStockfish(path) {
  const proc = spawn(path, [], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stderr.on("data", (data) => {
    const text = String(data || "");
    if (text.trim().length > 0) {
      console.error(text.trim());
    }
  });
  return proc;
}

function waitForLine(proc, predicate, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Stockfish timeout"));
    }, timeoutMs);

    function onData(chunk) {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const raw = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        const line = raw.trim();
        if (!line) continue;
        if (predicate(line)) {
          cleanup();
          resolve(line);
          return;
        }
      }
    }

    function onExit(code) {
      cleanup();
      reject(new Error("Stockfish exited with code " + code));
    }

    function cleanup() {
      clearTimeout(timer);
      proc.stdout.off("data", onData);
      proc.off("exit", onExit);
    }

    proc.stdout.on("data", onData);
    proc.on("exit", onExit);
  });
}

async function initStockfish(proc) {
  proc.stdin.write("uci\n");
  await waitForLine(proc, (line) => line === "uciok", 30000);
  proc.stdin.write("setoption name Threads value 1\n");
  proc.stdin.write("setoption name Hash value 64\n");
  proc.stdin.write("isready\n");
  await waitForLine(proc, (line) => line === "readyok", 30000);
}

async function runStockfishFen(proc, fen, depth) {
  let lastInfo = "";
  const onData = (chunk) => {
    const lines = chunk.toString("utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith("info depth ")) {
        lastInfo = line;
      }
    }
  };

  proc.stdout.on("data", onData);
  proc.stdin.write("ucinewgame\n");
  proc.stdin.write("isready\n");
  await waitForLine(proc, (line) => line === "readyok", 30000);
  proc.stdin.write("position fen " + fen + "\n");
  proc.stdin.write("go depth " + depth + "\n");
  const bestMoveLine = await waitForLine(proc, (line) => line.startsWith("bestmove "), 120000);
  proc.stdout.off("data", onData);
  return {
    best: bestMoveLine.replace(/^bestmove\s+/, "").split(/\s+/)[0],
    info: lastInfo,
    score: parseScoreFromInfo(lastInfo)
  };
}

async function evaluateMoveWithStockfish(proc, rootFen, moveText, depth) {
  if (!isUciMove(moveText)) {
    return {
      move: moveText,
      valid: false,
      reason: "invalid_uci"
    };
  }
  try {
    const followFen = fenAfterMove(rootFen, moveText);
    const stockfish = await runStockfishFen(proc, followFen, depth);
    return {
      move: moveText,
      valid: true,
      fen: followFen,
      stockfish,
      scoreForOriginalSide: normalizeScoreForMover(stockfish.score, 1)
    };
  } catch (err) {
    return {
      move: moveText,
      valid: false,
      reason: err && err.message ? err.message : String(err)
    };
  }
}

async function main() {
  const options = parseArgs(process.argv);
  bootstrapEngine();

  const sf = createStockfish(options.stockfish);
  try {
    await initStockfish(sf);
    for (const fen of options.fens) {
      const engine = runEngineFen(fen, options.depth, options.timeMs);
      const stockfish = await runStockfishFen(sf, fen, options.depth);
      const afterEngineMove = await evaluateMoveWithStockfish(sf, fen, engine.best, options.depth);
      const afterStockfishBestMove = await evaluateMoveWithStockfish(sf, fen, stockfish.best, options.depth);

      let engineRegretVsSfBestCp = null;
      if (
        afterEngineMove &&
        afterStockfishBestMove &&
        typeof afterEngineMove.scoreForOriginalSide === "number" &&
        typeof afterStockfishBestMove.scoreForOriginalSide === "number"
      ) {
        engineRegretVsSfBestCp =
          afterStockfishBestMove.scoreForOriginalSide - afterEngineMove.scoreForOriginalSide;
      }

      let engineDropVsRootCp = null;
      if (
        typeof stockfish.score === "number" &&
        afterEngineMove &&
        typeof afterEngineMove.scoreForOriginalSide === "number"
      ) {
        engineDropVsRootCp = stockfish.score - afterEngineMove.scoreForOriginalSide;
      }

      console.log(JSON.stringify({
        fen,
        engine,
        stockfish,
        postMove: {
          afterEngineMove,
          afterStockfishBestMove,
          engineRegretVsSfBestCp,
          engineDropVsRootCp
        }
      }));
    }
    sf.stdin.write("quit\n");
  } catch (err) {
    try {
      sf.stdin.write("quit\n");
    } catch (e) {}
    throw err;
  }
}

main().catch((err) => {
  console.error("Compare failed:", err && err.message ? err.message : err);
  process.exit(1);
});
