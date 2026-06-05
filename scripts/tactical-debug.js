const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

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
  if (typeof selector === "function") {
    return makeStub("__ready__");
  }
  return makeStub(String(selector));
};

$.trim = (value) => String(value).trim();
$.now = () => Date.now();
$.ajax = function() {};

vm.runInThisContext(fs.readFileSync("js/all.js", "utf8"), { filename: "js/all.js" });

const FEN_BLUNDER_1 = "6bk/6p1/7p/7P/4Q3/2q1nPP1/4B2K/4r1NR w - - 5 51";
const FEN_BLUNDER_2 = "6bk/4Q1p1/7p/8/7P/r1q2PP1/4BK1R/4n1N1 w - - 3 44";
const FEN_BLUNDER_3 = "r4rk1/2qnbpp1/b1p2n1p/p1Pp4/3PpN2/PBN1P3/3B1PPP/R2QK2R w KQ - 1 17";

function bootstrapEngine() {
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fen: null,
    depth: 22,
    timeMs: 20000,
    runs: 1,
    tracePly: -1,
    traceDepth: 3,
    rootTrace: true,
    traceTop: 24,
    compareReference: true,
    referenceDepth: 7,
    referenceTop: 12,
    referenceQDepth: 3
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--fen" && args[i + 1]) {
      options.fen = args[++i];
    } else if (arg === "--depth" && args[i + 1]) {
      options.depth = parseInt(args[++i], 10);
    } else if (arg === "--time" && args[i + 1]) {
      options.timeMs = parseInt(args[++i], 10);
    } else if (arg === "--runs" && args[i + 1]) {
      options.runs = parseInt(args[++i], 10);
    } else if (arg === "--trace-ply" && args[i + 1]) {
      options.tracePly = parseInt(args[++i], 10);
    } else if (arg === "--trace-depth" && args[i + 1]) {
      options.traceDepth = parseInt(args[++i], 10);
    } else if (arg === "--root-trace") {
      options.rootTrace = true;
    } else if (arg === "--no-root-trace") {
      options.rootTrace = false;
    } else if (arg === "--trace-top" && args[i + 1]) {
      options.traceTop = parseInt(args[++i], 10);
    } else if (arg === "--compare-reference") {
      options.compareReference = true;
    } else if (arg === "--no-compare-reference") {
      options.compareReference = false;
    } else if (arg === "--reference-depth" && args[i + 1]) {
      options.referenceDepth = parseInt(args[++i], 10);
    } else if (arg === "--reference-top" && args[i + 1]) {
      options.referenceTop = parseInt(args[++i], 10);
    } else if (arg === "--reference-qdepth" && args[i + 1]) {
      options.referenceQDepth = parseInt(args[++i], 10);
    }
  }
  if (!Number.isFinite(options.depth) || options.depth < 1) options.depth = 22;
  if (!Number.isFinite(options.timeMs) || options.timeMs < 50) options.timeMs = 20000;
  if (!Number.isFinite(options.runs) || options.runs < 1) options.runs = 1;
  if (!Number.isFinite(options.tracePly)) options.tracePly = -1;
  if (!Number.isFinite(options.traceDepth) || options.traceDepth < 1) options.traceDepth = 3;
  if (!Number.isFinite(options.traceTop) || options.traceTop < 1) options.traceTop = 24;
  if (!Number.isFinite(options.referenceDepth) || options.referenceDepth < 1) options.referenceDepth = 7;
  if (!Number.isFinite(options.referenceTop) || options.referenceTop < 1) options.referenceTop = 12;
  if (!Number.isFinite(options.referenceQDepth) || options.referenceQDepth < 0) options.referenceQDepth = 3;
  return options;
}

function installSearchTrace(options) {
  if (options.tracePly < 0) {
    return;
  }
  const tracePly = options.tracePly;
  const traceDepth = options.traceDepth;
  const makeStack = [];

  const originalMakeMove = MakeMove;
  const originalTakeMove = TakeMove;
  const originalAlphaBeta = AlphaBeta;
  const originalQuiescence = Quiescence;

  function shouldTraceNode(depth) {
    return brd_ply <= tracePly && (brd_ply === 0 || depth <= traceDepth);
  }

  function keyText(key, keyHi) {
    return (key >>> 0).toString(16) + ":" + (keyHi >>> 0).toString(16);
  }

  MakeMove = function(move) {
    const ply = brd_ply;
    const traced = (ply <= tracePly);
    const snapshot = traced ? {
      ply,
      move,
      fen: BoardToFen(),
      key: brd_posKey >>> 0,
      keyHi: brd_posKeyHi >>> 0,
      side: brd_side,
      kingW: brd_kingSq[COLOURS.WHITE],
      kingB: brd_kingSq[COLOURS.BLACK],
      materialW: brd_material[COLOURS.WHITE],
      materialB: brd_material[COLOURS.BLACK]
    } : null;

    const ok = originalMakeMove(move);
    if (traced) {
      const hashOk = (GeneratePosKey() === brd_posKey) && (GeneratePosKeyHi() === brd_posKeyHi);
      console.log(
        `[MAKE ply=${ply}] move=${PrMove(move)} ok=${ok === BOOL.TRUE} side=${SideChar[snapshot.side]}->${SideChar[brd_side]}` +
        ` key=${keyText(snapshot.key, snapshot.keyHi)}->${keyText(brd_posKey, brd_posKeyHi)} hashOk=${hashOk}`
      );
    }
    if (ok === BOOL.TRUE && traced) {
      makeStack.push(snapshot);
    }
    return ok;
  };

  TakeMove = function() {
    originalTakeMove();
    if (brd_ply <= tracePly) {
      const snapshot = makeStack.pop();
      if (!snapshot) {
        console.log(`[TAKE ply=${brd_ply}] missing snapshot`);
        return;
      }
      const hashOk = (snapshot.key === (brd_posKey >>> 0)) && (snapshot.keyHi === (brd_posKeyHi >>> 0));
      const stateOk =
        hashOk &&
        snapshot.side === brd_side &&
        snapshot.kingW === brd_kingSq[COLOURS.WHITE] &&
        snapshot.kingB === brd_kingSq[COLOURS.BLACK] &&
        snapshot.materialW === brd_material[COLOURS.WHITE] &&
        snapshot.materialB === brd_material[COLOURS.BLACK] &&
        snapshot.fen === BoardToFen();
      console.log(
        `[TAKE ply=${brd_ply}] restored=${stateOk} side=${SideChar[brd_side]} key=${keyText(brd_posKey, brd_posKeyHi)}`
      );
    }
  };

  AlphaBeta = function(alpha, beta, depth, doNull) {
    if (shouldTraceNode(depth)) {
      const side = brd_side;
      const inCheck = SqAttacked(brd_kingSq[side], side ^ 1);
      console.log(
        `[AB> ply=${brd_ply}] depth=${depth} side=${SideChar[side]} inCheck=${inCheck === BOOL.TRUE}` +
        ` a=${alpha} b=${beta} key=${keyText(brd_posKey, brd_posKeyHi)} doNull=${doNull}`
      );
    }
    const score = originalAlphaBeta(alpha, beta, depth, doNull);
    if (shouldTraceNode(depth)) {
      console.log(`[AB< ply=${brd_ply}] depth=${depth} score=${score}`);
    }
    return score;
  };

  Quiescence = function(alpha, beta) {
    if (brd_ply <= tracePly) {
      const side = brd_side;
      const inCheck = SqAttacked(brd_kingSq[side], side ^ 1);
      console.log(
        `[Q> ply=${brd_ply}] side=${SideChar[side]} inCheck=${inCheck === BOOL.TRUE} a=${alpha} b=${beta}` +
        ` key=${keyText(brd_posKey, brd_posKeyHi)}`
      );
    }
    const score = originalQuiescence(alpha, beta);
    if (brd_ply <= tracePly) {
      console.log(`[Q< ply=${brd_ply}] score=${score}`);
    }
    return score;
  };
}

function printRootTrace(entries, topN) {
  if (!Array.isArray(entries) || entries.length === 0) {
    console.log("ROOT_TRACE no entries");
    return;
  }

  let maxDepth = -1;
  for (const item of entries) {
    if (typeof item.depth === "number" && item.depth > maxDepth) {
      maxDepth = item.depth;
    }
  }
  const depthFiltered = (maxDepth > 0)
    ? entries.filter((item) => item && item.depth === maxDepth)
    : entries.slice(0);

  // Keep the last entry per move at the deepest traced root depth.
  const byMove = new Map();
  for (const item of depthFiltered) {
    if (!item || !item.move) continue;
    byMove.set(item.move, item);
  }

  const sorted = Array.from(byMove.values()).sort((a, b) => {
    const aScore = (typeof a.score === "number") ? a.score : -999999;
    const bScore = (typeof b.score === "number") ? b.score : -999999;
    if (bScore !== aScore) return bScore - aScore;
    return (a.order || 0) - (b.order || 0);
  });

  const limit = Math.min(topN, sorted.length);
  console.log(`ROOT_TRACE depth=${maxDepth} total=${entries.length} uniqueAtDepth=${sorted.length} showing=${limit}`);
  for (let i = 0; i < limit; i++) {
    const item = sorted[i];
    const scoreText = (typeof item.score === "number") ? String(item.score) : "NA";
    const reason = item.reason ? ` reason=${item.reason}` : "";
    const rootLMR = item.rootReduced ? ` rootLMR=-${item.rootReduction}` : "";
    const rootResearch =
      (item.rootLmrResearched ? " rootLMRRe=1" : "") +
      (item.rootPvsResearched ? " rootPVSRe=1" : "");
    console.log(
      `TRACE move=${item.move} order=${item.order} score=${scoreText}` +
      ` a=${item.alphaIn}->${item.alphaOut} b=${item.betaIn}` +
      ` cut=${item.cutoff ? 1 : 0}${reason}` +
      `${rootLMR}${rootResearch}` +
      ` lmr=${item.lmrReductions || 0}/${item.lmrReductionTotal || 0}` +
      ` lmrRe=${item.lmrResearched || 0} pvsRe=${item.pvsResearched || 0}` +
      ` lmp=${item.lmpPrunes || 0} rfp=${item.rfpCuts || 0}` +
      ` fut=${item.futilityCuts || 0} raz=${item.razorCuts || 0}` +
      ` null=${item.nullCuts || 0}` +
      ` qchk=${item.qcheckExtensions || 0} qchkCut=${item.qcheckBetaCuts || 0}` +
      ` qchkCap=${item.qcheckCapHits || 0} qDelta=${item.qDeltaPrunes || 0}`
    );
  }
}

function referenceQSearch(alpha, beta, qDepth, qDepthLimit) {
  const side = brd_side;
  const enemy = side ^ 1;
  const inCheck = SqAttacked(brd_kingSq[side], enemy);
  let standPat = -INFINITE;

  if (inCheck === BOOL.FALSE) {
    standPat = EvalPosition();
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    if (qDepth >= qDepthLimit) return alpha;
    GenerateCaptures();
  } else {
    GenerateMoves();
  }

  let legal = 0;
  for (let i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    PickNextMove(i);
    const move = brd_moveList[i];
    if (MakeMove(move) !== BOOL.TRUE) continue;
    legal++;
    const score = -referenceQSearch(-beta, -alpha, qDepth + 1, qDepthLimit);
    TakeMove();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  if (inCheck === BOOL.TRUE && legal === 0) {
    return -MATE + brd_ply;
  }
  return alpha;
}

function referenceAlphaBeta(alpha, beta, depth, qDepthLimit) {
  if (depth <= 0) {
    return referenceQSearch(alpha, beta, 0, qDepthLimit);
  }
  if ((IsRepetition() || brd_fiftyMove >= 100) && brd_ply !== 0) {
    return 0;
  }
  if (brd_ply > MAXDEPTH - 1) {
    return EvalPosition();
  }

  const side = brd_side;
  const enemy = side ^ 1;
  const inCheck = SqAttacked(brd_kingSq[side], enemy);
  let localDepth = depth;
  if (inCheck === BOOL.TRUE) {
    localDepth++;
  }

  GenerateMoves();
  let legal = 0;
  for (let i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    PickNextMove(i);
    const move = brd_moveList[i];
    if (MakeMove(move) !== BOOL.TRUE) continue;
    legal++;
    const score = -referenceAlphaBeta(-beta, -alpha, localDepth - 1, qDepthLimit);
    TakeMove();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  if (legal === 0) {
    if (inCheck === BOOL.TRUE) return -MATE + brd_ply;
    return 0;
  }
  return alpha;
}

function searchRootReferenceTopMoves(fen, depth, topN, qDepthLimit) {
  const savedSearching = srch_searching;
  const savedPly = brd_ply;
  const savedHisPly = brd_hisPly;
  const savedMoveStart0 = brd_moveListStart[0];

  assert.strictEqual(ParseFen(fen), BOOL.TRUE, "Reference mode FEN parse failed");
  srch_searching = BOOL.TRUE;
  brd_ply = 0;
  brd_moveListStart[0] = 0;

  const rows = [];
  try {
    GenerateMoves();
    for (let i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
      PickNextMove(i);
      const move = brd_moveList[i];
      if (MakeMove(move) !== BOOL.TRUE) continue;
      const score = -referenceAlphaBeta(-INFINITE, INFINITE, depth - 1, qDepthLimit);
      TakeMove();
      rows.push({ move, moveText: PrMove(move), score });
    }
  } finally {
    while (brd_ply > 0) {
      TakeMove();
    }
    srch_searching = savedSearching;
    brd_ply = savedPly;
    brd_hisPly = savedHisPly;
    brd_moveListStart[0] = savedMoveStart0;
  }

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.move - b.move;
  });
  if (rows.length > topN) rows.length = topN;
  return rows;
}

function searchRootNormalTopMoves(fen, depth, topN) {
  assert.strictEqual(ParseFen(fen), BOOL.TRUE, "Normal mode FEN parse failed");
  const savedSearching = srch_searching;
  const savedPly = brd_ply;
  const savedHisPly = brd_hisPly;
  const savedMoveStart0 = brd_moveListStart[0];
  const savedStop = srch_stop;
  const savedStart = srch_start;
  const savedTime = srch_time;
  srch_searching = BOOL.TRUE;
  brd_ply = 0;
  brd_moveListStart[0] = 0;
  srch_stop = BOOL.FALSE;
  srch_start = Date.now();
  srch_time = 60000;
  const rows = SearchRootWithTopMoves(depth, topN).map((item) => ({
    move: item.move,
    moveText: PrMove(item.move),
    score: item.score
  }));
  srch_searching = savedSearching;
  brd_ply = savedPly;
  brd_hisPly = savedHisPly;
  brd_moveListStart[0] = savedMoveStart0;
  srch_stop = savedStop;
  srch_start = savedStart;
  srch_time = savedTime;
  return rows;
}

function printReferenceComparison(fen, options, result) {
  const depth = Math.max(1, options.referenceDepth);
  const topN = Math.max(1, options.referenceTop);
  const normal = searchRootNormalTopMoves(fen, depth, topN);
  const reference = searchRootReferenceTopMoves(fen, depth, topN, options.referenceQDepth);
  const normalRank = new Map();
  const refRank = new Map();
  normal.forEach((row, idx) => normalRank.set(row.moveText, idx + 1));
  reference.forEach((row, idx) => refRank.set(row.moveText, idx + 1));

  const unionMoves = new Set([...normalRank.keys(), ...refRank.keys()]);
  const rows = [];
  for (const moveText of unionMoves) {
    const n = normal.find((x) => x.moveText === moveText) || null;
    const r = reference.find((x) => x.moveText === moveText) || null;
    rows.push({
      move: moveText,
      normalRank: n ? normalRank.get(moveText) : "-",
      normalScore: n ? n.score : null,
      refRank: r ? refRank.get(moveText) : "-",
      refScore: r ? r.score : null,
      rankDelta: (n ? normalRank.get(moveText) : 999) - (r ? refRank.get(moveText) : 999)
    });
  }

  rows.sort((a, b) => {
    const aKey = Math.abs(a.rankDelta);
    const bKey = Math.abs(b.rankDelta);
    if (bKey !== aKey) return bKey - aKey;
    return String(a.move).localeCompare(String(b.move));
  });

  console.log(`REFERENCE_COMPARE depth=${depth} qDepth=${options.referenceQDepth} topN=${topN}`);
  console.log(`NORMAL best=${normal[0] ? normal[0].moveText : "-"} score=${normal[0] ? normal[0].score : "NA"}`);
  console.log(`REF    best=${reference[0] ? reference[0].moveText : "-"} score=${reference[0] ? reference[0].score : "NA"}`);
  const show = rows.slice(0, Math.min(rows.length, topN));
  for (const row of show) {
    console.log(
      `CMP move=${row.move} nRank=${row.normalRank} nScore=${row.normalScore}` +
      ` rRank=${row.refRank} rScore=${row.refScore} rankDelta=${row.rankDelta}`
    );
  }

  if (Array.isArray(result.searchTrace) && result.searchTrace.length > 0) {
    const moveTrace = new Map();
    for (const item of result.searchTrace) {
      if (!item || !item.move || typeof item.depth !== "number") continue;
      const prev = moveTrace.get(item.move);
      if (!prev || item.depth > prev.depth || (item.depth === prev.depth && (item.order || 0) >= (prev.order || 0))) {
        moveTrace.set(item.move, item);
      }
    }
    const normalBest = normal[0] ? normal[0].moveText : null;
    const refBest = reference[0] ? reference[0].moveText : null;
    const focus = [normalBest, refBest, PrMove(result.bestMove)].filter(Boolean);
    const printed = new Set();
    for (const mv of focus) {
      if (printed.has(mv)) continue;
      printed.add(mv);
      const t = moveTrace.get(mv);
      if (!t) continue;
      console.log(
        `TRACE_FOCUS move=${mv} depth=${t.depth} order=${t.order} score=${t.score}` +
        ` rootLMR=${t.rootReduced ? -t.rootReduction : 0}` +
        ` lmr=${t.lmrReductions || 0}/${t.lmrReductionTotal || 0}` +
        ` lmrRe=${t.lmrResearched || 0} pvsRe=${t.pvsResearched || 0}` +
        ` lmp=${t.lmpPrunes || 0} rfp=${t.rfpCuts || 0}` +
        ` fut=${t.futilityCuts || 0} null=${t.nullCuts || 0} qDelta=${t.qDeltaPrunes || 0}`
      );
    }
  }
}

function verifyPvLine(fen, pvLine) {
  if (ParseFen(fen) !== BOOL.TRUE) {
    return { ok: false, reason: "could not parse FEN" };
  }
  if (!pvLine || !pvLine.trim()) {
    return { ok: true, length: 0 };
  }
  const moves = pvLine.trim().split(/\s+/);
  for (let i = 0; i < moves.length; i++) {
    const moveText = moves[i];
    const from = SqFromAlg(moveText.slice(0, 2));
    const to = SqFromAlg(moveText.slice(2, 4));
    if (from === SQUARES.NO_SQ || to === SQUARES.NO_SQ) {
      return { ok: false, reason: "bad coordinate in PV", index: i, move: moveText };
    }
    const move = ParseMove(from, to);
    if (move === NOMOVE) {
      return { ok: false, reason: "illegal PV move", index: i, move: moveText, fen: BoardToFen() };
    }
    if (MakeMove(move) !== BOOL.TRUE) {
      return { ok: false, reason: "MakeMove rejected PV move", index: i, move: moveText, fen: BoardToFen() };
    }
  }
  while (brd_hisPly > 0) {
    TakeMove();
  }
  return { ok: true, length: moves.length };
}

function runSingleSearch(fen, depth, timeMs, options) {
  assert.strictEqual(ParseFen(fen), BOOL.TRUE, "FEN parse failed");
  InitTT(64);
  if (typeof SetSearchTraceEnabled === "function") {
    SetSearchTraceEnabled(options.rootTrace === true);
  }
  if (options.rootTrace === true && typeof ClearSearchTraceEntries === "function") {
    ClearSearchTraceEntries();
  }
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
  const pvCheck = verifyPvLine(fen, result.pvLine || "");
  console.log(
    `RESULT depthDone=${result.depth} nodes=${result.nodes} timeMs=${elapsed}` +
    ` best=${PrMove(result.bestMove)} play=${PrMove(result.playMove)} score=${result.bestScore}` +
    ` pv="${result.pvLine || ""}" pvOk=${pvCheck.ok}`
  );
  if (!pvCheck.ok) {
    console.log("PV verification failure:", JSON.stringify(pvCheck));
  }

  if (options.rootTrace === true) {
    const traceEntries = Array.isArray(result.searchTrace)
      ? result.searchTrace
      : (typeof GetSearchTraceEntries === "function" ? GetSearchTraceEntries() : []);
    printRootTrace(traceEntries, options.traceTop);
  }

  if (typeof SetSearchTraceEnabled === "function") {
    SetSearchTraceEnabled(false);
  }

  if (options.compareReference === true) {
    printReferenceComparison(fen, options, result);
  }
}

function main() {
  const options = parseArgs();
  bootstrapEngine();
  installSearchTrace(options);

  const fens = options.fen ? [options.fen] : [FEN_BLUNDER_1, FEN_BLUNDER_3];
  for (const fen of fens) {
    for (let run = 1; run <= options.runs; run++) {
      console.log(`\n=== Trace run ${run} ===`);
      console.log(`FEN: ${fen}`);
      runSingleSearch(fen, options.depth, options.timeMs, options);
    }
  }
}

try {
  main();
} catch (err) {
  console.error("Tactical debug failed:", err && err.message ? err.message : err);
  process.exit(1);
}
