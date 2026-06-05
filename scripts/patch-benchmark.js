const fs = require("fs");
const vm = require("vm");
const { spawn } = require("child_process");

const DEFAULT_STOCKFISH = "stockfish";

const TEST_FENS = [
  "6bk/6p1/7p/7P/4Q3/2q1nPP1/4B2K/4r1NR w - - 5 51",
  "6bk/4Q1p1/7p/8/7P/r1q2PP1/4BK1R/4n1N1 w - - 3 44",
  "r4rk1/2qnbpp1/b1p2n1p/p1Pp4/3PpN2/PBN1P3/3B1PPP/R2QK2R w KQ - 1 17",
  "r4rk1/pppbqpb1/2npp1pp/8/2PPP3/2NB1N2/PP3PPP/R2Q1RK1 w - - 4 11"
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    out: "scripts/patch-benchmark.json",
    stockfish: process.env.STOCKFISH_PATH || DEFAULT_STOCKFISH,
    fenDepth: 22,
    fenTimeMs: 20000,
    randomCount: 24,
    randomSeed: 20260207,
    randomMinPlies: 10,
    randomMaxPlies: 55,
    randomEngineDepth: 10,
    randomEngineTimeMs: 1200,
    randomStockfishDepth: 12
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--out" && args[i + 1]) {
      options.out = args[++i];
    } else if (arg === "--stockfish" && args[i + 1]) {
      options.stockfish = args[++i];
    } else if (arg === "--fen-depth" && args[i + 1]) {
      options.fenDepth = parseInt(args[++i], 10);
    } else if (arg === "--fen-time" && args[i + 1]) {
      options.fenTimeMs = parseInt(args[++i], 10);
    } else if (arg === "--random-count" && args[i + 1]) {
      options.randomCount = parseInt(args[++i], 10);
    } else if (arg === "--random-seed" && args[i + 1]) {
      options.randomSeed = parseInt(args[++i], 10);
    } else if (arg === "--random-min-plies" && args[i + 1]) {
      options.randomMinPlies = parseInt(args[++i], 10);
    } else if (arg === "--random-max-plies" && args[i + 1]) {
      options.randomMaxPlies = parseInt(args[++i], 10);
    } else if (arg === "--random-engine-depth" && args[i + 1]) {
      options.randomEngineDepth = parseInt(args[++i], 10);
    } else if (arg === "--random-engine-time" && args[i + 1]) {
      options.randomEngineTimeMs = parseInt(args[++i], 10);
    } else if (arg === "--random-sf-depth" && args[i + 1]) {
      options.randomStockfishDepth = parseInt(args[++i], 10);
    }
  }

  if (!Number.isFinite(options.fenDepth) || options.fenDepth < 1) options.fenDepth = 22;
  if (!Number.isFinite(options.fenTimeMs) || options.fenTimeMs < 50) options.fenTimeMs = 20000;
  if (!Number.isFinite(options.randomCount) || options.randomCount < 1) options.randomCount = 24;
  if (!Number.isFinite(options.randomSeed)) options.randomSeed = 20260207;
  if (!Number.isFinite(options.randomMinPlies) || options.randomMinPlies < 0) options.randomMinPlies = 10;
  if (!Number.isFinite(options.randomMaxPlies) || options.randomMaxPlies < options.randomMinPlies) {
    options.randomMaxPlies = options.randomMinPlies + 10;
  }
  if (!Number.isFinite(options.randomEngineDepth) || options.randomEngineDepth < 1) options.randomEngineDepth = 10;
  if (!Number.isFinite(options.randomEngineTimeMs) || options.randomEngineTimeMs < 50) options.randomEngineTimeMs = 1200;
  if (!Number.isFinite(options.randomStockfishDepth) || options.randomStockfishDepth < 1) options.randomStockfishDepth = 12;

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

const ENGINE_CONFIGS = [
  { id: "baseline", lmp: [0, 0, 6, 10, 14] },
  { id: "lmp3", lmp: [0, 3, 6, 10, 14] }
];

function applyEngineConfig(cfg) {
  LMP_LIMIT = cfg.lmp.slice(0);
}

function runEngineSearch(cfg, fen, depth, timeMs) {
  applyEngineConfig(cfg);
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

function makeRng(seed) {
  let state = seed >>> 0;
  return function rand() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomLegalMove(rand) {
  GenerateMoves();
  const legal = [];
  for (let i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    const move = brd_moveList[i];
    if (MakeMove(move) === BOOL.TRUE) {
      TakeMove();
      legal.push(move);
    }
  }
  if (legal.length === 0) return NOMOVE;
  return legal[Math.floor(rand() * legal.length)];
}

function generateRandomFens(count, minPlies, maxPlies, seed) {
  const rand = makeRng(seed);
  const fens = [];
  for (let i = 0; i < count; i++) {
    ParseFen(START_FEN);
    const plies = minPlies + Math.floor(rand() * (maxPlies - minPlies + 1));
    for (let p = 0; p < plies; p++) {
      const move = randomLegalMove(rand);
      if (move === NOMOVE) break;
      if (MakeMove(move) !== BOOL.TRUE) break;
    }
    fens.push(BoardToFen());
  }
  return fens;
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

async function runStockfishSearch(proc, fen, depth) {
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
  const bestMoveLine = await waitForLine(proc, (line) => line.startsWith("bestmove "), 180000);
  proc.stdout.off("data", onData);
  return {
    best: bestMoveLine.replace(/^bestmove\s+/, "").split(/\s+/)[0],
    info: lastInfo,
    score: parseScoreFromInfo(lastInfo)
  };
}

function abs(value) {
  return value < 0 ? -value : value;
}

async function main() {
  const options = parseArgs(process.argv);
  bootstrapEngine();

  const sf = createStockfish(options.stockfish);
  try {
    await initStockfish(sf);

    const stockfishFen = {};
    for (const fen of TEST_FENS) {
      stockfishFen[fen] = await runStockfishSearch(sf, fen, options.fenDepth);
    }

    const fenRows = [];
    for (const cfg of ENGINE_CONFIGS) {
      for (const fen of TEST_FENS) {
        const engine = runEngineSearch(cfg, fen, options.fenDepth, options.fenTimeMs);
        const sfRes = stockfishFen[fen];
        fenRows.push({
          config: cfg.id,
          fen,
          engineBest: engine.best,
          engineScore: engine.score,
          engineDepth: engine.depth,
          engineNps: engine.nps,
          sfBest: sfRes.best,
          sfScore: sfRes.score,
          moveMatch: engine.best === sfRes.best,
          scoreGap: (typeof sfRes.score === "number" && typeof engine.score === "number")
            ? abs(engine.score - sfRes.score)
            : null
        });
      }
    }

    const randomFens = generateRandomFens(
      options.randomCount,
      options.randomMinPlies,
      options.randomMaxPlies,
      options.randomSeed
    );

    const randomRows = [];
    for (let i = 0; i < randomFens.length; i++) {
      const fen = randomFens[i];
      const sfRes = await runStockfishSearch(sf, fen, options.randomStockfishDepth);
      for (const cfg of ENGINE_CONFIGS) {
        const engine = runEngineSearch(cfg, fen, options.randomEngineDepth, options.randomEngineTimeMs);
        randomRows.push({
          idx: i + 1,
          config: cfg.id,
          fen,
          sfBest: sfRes.best,
          sfScore: sfRes.score,
          engineBest: engine.best,
          engineScore: engine.score,
          moveMatch: engine.best === sfRes.best,
          scoreGap: (typeof sfRes.score === "number" && typeof engine.score === "number")
            ? abs(engine.score - sfRes.score)
            : null
        });
      }
    }

    const randomSummary = {};
    for (const cfg of ENGINE_CONFIGS) {
      const rows = randomRows.filter((row) => row.config === cfg.id);
      const moveAgree = rows.filter((row) => row.moveMatch).length;
      const scoreRows = rows.filter((row) => typeof row.scoreGap === "number");
      const avgGap = scoreRows.length
        ? (scoreRows.reduce((acc, row) => acc + row.scoreGap, 0) / scoreRows.length)
        : null;
      randomSummary[cfg.id] = {
        positions: rows.length,
        moveAgree,
        moveAgreePct: rows.length ? +(moveAgree * 100 / rows.length).toFixed(2) : 0,
        avgScoreGapCp: avgGap === null ? null : +avgGap.toFixed(2)
      };
    }

    const output = {
      createdAt: new Date().toISOString(),
      engineConfigs: ENGINE_CONFIGS,
      fenParams: {
        depth: options.fenDepth,
        timeMs: options.fenTimeMs
      },
      randomParams: {
        count: options.randomCount,
        seed: options.randomSeed,
        minPlies: options.randomMinPlies,
        maxPlies: options.randomMaxPlies,
        engineDepth: options.randomEngineDepth,
        engineTimeMs: options.randomEngineTimeMs,
        stockfishDepth: options.randomStockfishDepth
      },
      testFens: TEST_FENS,
      fenRows,
      randomSummary
    };

    fs.writeFileSync(options.out, JSON.stringify(output, null, 2));
    console.log("Wrote", options.out);
    console.log(JSON.stringify({ out: options.out, randomSummary }, null, 2));
    sf.stdin.write("quit\n");
  } catch (err) {
    try { sf.stdin.write("quit\n"); } catch (e) {}
    throw err;
  }
}

main().catch((err) => {
  console.error("Patch benchmark failed:", err && err.message ? err.message : err);
  process.exit(1);
});
