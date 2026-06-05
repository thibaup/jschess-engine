const fs = require("fs");
const vm = require("vm");
const { spawn } = require("child_process");

const DEFAULT_STOCKFISH = "stockfish";

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    positions: 20,
    minPlies: 12,
    maxPlies: 50,
    engineDepth: 10,
    engineTimeMs: 1500,
    sfDepth: 12,
    sfPath: process.env.STOCKFISH_PATH || DEFAULT_STOCKFISH,
    seed: 1337,
    pruningProfile: "baseline"
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--positions" && args[i + 1]) options.positions = parseInt(args[++i], 10);
    else if (arg === "--min-plies" && args[i + 1]) options.minPlies = parseInt(args[++i], 10);
    else if (arg === "--max-plies" && args[i + 1]) options.maxPlies = parseInt(args[++i], 10);
    else if (arg === "--engine-depth" && args[i + 1]) options.engineDepth = parseInt(args[++i], 10);
    else if (arg === "--engine-time" && args[i + 1]) options.engineTimeMs = parseInt(args[++i], 10);
    else if (arg === "--sf-depth" && args[i + 1]) options.sfDepth = parseInt(args[++i], 10);
    else if (arg === "--stockfish" && args[i + 1]) options.sfPath = args[++i];
    else if (arg === "--seed" && args[i + 1]) options.seed = parseInt(args[++i], 10);
    else if (arg === "--pruning-profile" && args[i + 1]) options.pruningProfile = String(args[++i]).trim();
  }

  if (!Number.isFinite(options.positions) || options.positions < 1) options.positions = 20;
  if (!Number.isFinite(options.minPlies) || options.minPlies < 0) options.minPlies = 12;
  if (!Number.isFinite(options.maxPlies) || options.maxPlies < options.minPlies) options.maxPlies = options.minPlies + 20;
  if (!Number.isFinite(options.engineDepth) || options.engineDepth < 1) options.engineDepth = 10;
  if (!Number.isFinite(options.engineTimeMs) || options.engineTimeMs < 50) options.engineTimeMs = 1500;
  if (!Number.isFinite(options.sfDepth) || options.sfDepth < 1) options.sfDepth = 12;
  if (!Number.isFinite(options.seed)) options.seed = 1337;
  if (!options.pruningProfile) options.pruningProfile = "baseline";
  return options;
}

function normalizeMove(move) {
  if (!move) return "0000";
  const m = String(move).trim().toLowerCase();
  if (m === "(none)" || m === "none") return "0000";
  return m;
}

function setupDomStubs() {
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
  setupDomStubs();
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

function generateRandomFen(rand, minPlies, maxPlies) {
  ParseFen(START_FEN);
  const plies = minPlies + Math.floor(rand() * (maxPlies - minPlies + 1));
  for (let p = 0; p < plies; p++) {
    const move = randomLegalMove(rand);
    if (move === NOMOVE) break;
    if (MakeMove(move) !== BOOL.TRUE) break;
  }
  return BoardToFen();
}

function runEngineSearch(fen, depth, timeMs) {
  if (ParseFen(fen) !== BOOL.TRUE) throw new Error("bad FEN for engine");
  InitTT(64);
  srch_depth = depth;
  srch_time = timeMs;
  const start = Date.now();
  const result = SearchPosition({
    useBook: false,
    fastPlay: true,
    renderAnalysis: false,
    adaptiveTime: false,
    multiPvCount: 1
  });
  return {
    bestMove: normalizeMove(PrMove(result.bestMove)),
    score: result.bestScore,
    depth: result.depth,
    nodes: result.nodes,
    timeMs: Date.now() - start
  };
}

function startStockfish(path) {
  const proc = spawn(path, [], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stderr.on("data", (d) => {
    const msg = String(d || "").trim();
    if (msg.length) console.error(msg);
  });
  return proc;
}

function waitForLine(proc, predicate, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, timeoutMs);

    function onData(chunk) {
      buf += chunk.toString("utf8");
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
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
      reject(new Error("stockfish exited " + code));
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
  await waitForLine(proc, (line) => line === "uciok");
  proc.stdin.write("setoption name Threads value 1\n");
  proc.stdin.write("setoption name Hash value 64\n");
  proc.stdin.write("isready\n");
  await waitForLine(proc, (line) => line === "readyok");
}

function parseScoreInfo(line) {
  const m = line.match(/score\s+(cp|mate)\s+(-?\d+)(?:\s+(lowerbound|upperbound))?/);
  if (!m) return null;
  const kind = m[1];
  const value = parseInt(m[2], 10);
  if (!Number.isFinite(value)) return null;
  return { kind, value, bound: m[3] || null };
}

function decodeEngineMate(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  const mateBase = (typeof global.MATE === "number" && Number.isFinite(global.MATE)) ? global.MATE : 29000;
  const threshold = mateBase - 1000;
  const a = Math.abs(score);
  if (a < threshold) return null;
  let plies = mateBase - a;
  if (!Number.isFinite(plies) || plies < 0) plies = 0;
  const moves = Math.ceil(plies / 2);
  const signedMoves = score >= 0 ? moves : -moves;
  return { moves: signedMoves, plies: score >= 0 ? plies : -plies, raw: score };
}

async function runStockfishSearch(proc, fen, depth) {
  let bestDepth = -1;
  let bestInfo = "";
  let bestScore = null;

  let bestMateDepth = -1;
  let bestMateInfo = "";
  let bestMateScore = null;

  let buf = "";
  const onData = (chunk) => {
    buf += chunk.toString("utf8");
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      const line = raw.trim();
      if (!line.startsWith("info ")) continue;

      const dm = line.match(/\bdepth\s+(\d+)\b/);
      if (!dm) continue;

      const d = parseInt(dm[1], 10);
      if (!Number.isFinite(d)) continue;

      const s = parseScoreInfo(line);
      if (s && s.kind === "mate") {
        if (d > bestMateDepth) {
          bestMateDepth = d;
          bestMateInfo = line;
          bestMateScore = s;
        } else if (d === bestMateDepth && bestMateScore) {
          if (Math.abs(s.value) < Math.abs(bestMateScore.value)) {
            bestMateInfo = line;
            bestMateScore = s;
          }
        } else if (d === bestMateDepth && !bestMateScore) {
          bestMateInfo = line;
          bestMateScore = s;
        }
      }

      if (d > bestDepth) {
        bestDepth = d;
        bestInfo = line;
        bestScore = s;
      } else if (d === bestDepth) {
        if (s && (!bestScore || bestInfo.length <= line.length)) {
          bestInfo = line;
          bestScore = s;
        } else if (!bestScore && s) {
          bestInfo = line;
          bestScore = s;
        } else if (!bestInfo) {
          bestInfo = line;
        }
      }
    }
  };

  proc.stdout.on("data", onData);
  proc.stdin.write("ucinewgame\n");
  proc.stdin.write("isready\n");
  await waitForLine(proc, (line) => line === "readyok");
  proc.stdin.write("position fen " + fen + "\n");
  proc.stdin.write("go depth " + depth + "\n");
  const bestLine = await waitForLine(proc, (line) => line.startsWith("bestmove "), 120000);
  proc.stdout.off("data", onData);

  const bestMove = normalizeMove(bestLine.replace(/^bestmove\s+/, "").split(/\s+/)[0]);

  const finalScore = bestMateScore || bestScore;
  const finalInfo = bestMateScore ? bestMateInfo : bestInfo;

  return {
    bestMove,
    info: finalInfo,
    score: finalScore
  };
}


function compareResult(entry) {
  const engineMove = normalizeMove(entry.engine.bestMove);
  const sfMove = normalizeMove(entry.stockfish.bestMove);
  const moveMismatch = engineMove !== sfMove;

  const sfScore = entry.stockfish.score;
  const sfMate = sfScore && sfScore.kind === "mate" ? sfScore.value : null;
  const sfCp = sfScore && sfScore.kind === "cp" ? sfScore.value : null;

  const engineMate = decodeEngineMate(entry.engine.score);
  const engineMateMoves = engineMate ? engineMate.moves : null;

  let scoreGapCp = null;
  let mateGapMoves = null;
  let mateSignMismatch = false;
  let falseMate = false;
  let missedMate = false;

  if (sfMate !== null) {
    if (engineMateMoves !== null) {
      mateSignMismatch = Math.sign(engineMateMoves) !== Math.sign(sfMate);
      mateGapMoves = Math.abs(Math.abs(engineMateMoves) - Math.abs(sfMate));
    } else {
      missedMate = true;
    }
  } else if (sfCp !== null) {
    if (engineMateMoves !== null) {
      falseMate = true;
    } else if (typeof entry.engine.score === "number" && Number.isFinite(entry.engine.score)) {
      scoreGapCp = Math.abs(entry.engine.score - sfCp);
    }
  }

  return {
    moveMismatch,
    scoreGapCp,
    mateGapMoves,
    mateSignMismatch,
    falseMate,
    missedMate,
    engineMateMoves
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  bootstrapEngine();
  const rand = makeRng(opts.seed);

  const sf = startStockfish(opts.sfPath);
  await initStockfish(sf);

  const rows = [];
  try {
    for (let i = 0; i < opts.positions; i++) {
      const fen = generateRandomFen(rand, opts.minPlies, opts.maxPlies);
      const engine = runEngineSearch(fen, opts.engineDepth, opts.engineTimeMs);

      let stockfish = await runStockfishSearch(sf, fen, opts.sfDepth);

      const engineMate = decodeEngineMate(engine.score);
      if (engineMate && (!stockfish.score || stockfish.score.kind !== "mate")) {
        const verifyDepth = Math.min(Math.max(opts.sfDepth + 8, 24), 32);
        const sf2 = await runStockfishSearch(sf, fen, verifyDepth);
        if (sf2.score && sf2.score.kind === "mate") stockfish = sf2;
      }

      const cmp = compareResult({ engine, stockfish });

      const engineScoreText = engineMate ? `mate ${engineMate.moves}` : `cp ${engine.score}`;
      const sfScoreText = stockfish.score ? `${stockfish.score.kind} ${stockfish.score.value}` : "NA";

      const row = {
        idx: i + 1,
        fen,
        engineMove: engine.bestMove,
        engineScore: engineScoreText,
        sfMove: stockfish.bestMove,
        sfScore: sfScoreText,
        moveMismatch: cmp.moveMismatch,
        scoreGapCp: cmp.scoreGapCp,
        mateGapMoves: cmp.mateGapMoves,
        mateSignMismatch: cmp.mateSignMismatch,
        falseMate: cmp.falseMate,
        missedMate: cmp.missedMate
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  } finally {
    try {
      sf.stdin.write("quit\n");
    } catch (e) {}
  }

  const mismatchCount = rows.filter((r) => r.moveMismatch).length;
  const falseMateCount = rows.filter((r) => r.falseMate).length;
  const missedMateCount = rows.filter((r) => r.missedMate).length;
  const mateSignMismatchCount = rows.filter((r) => r.mateSignMismatch).length;

  const cpGaps = rows.map((r) => r.scoreGapCp).filter((v) => typeof v === "number" && Number.isFinite(v));
  const avgGap = cpGaps.length > 0 ? Math.round((cpGaps.reduce((sum, v) => sum + v, 0) / cpGaps.length) * 10) / 10 : 0;

  console.log("\nSummary:");
  console.log(JSON.stringify({
    positions: rows.length,
    moveAgree: rows.length - mismatchCount,
    moveMismatch: mismatchCount,
    moveAgreePct: rows.length > 0 ? Math.round(((rows.length - mismatchCount) * 10000) / rows.length) / 100 : 0,
    avgScoreGapCp: avgGap,
    falseMateCount,
    missedMateCount,
    mateSignMismatchCount
  }));
}

main().catch((err) => {
  console.error("Fuzzer failed:", err && err.message ? err.message : err);
  process.exit(1);
});
