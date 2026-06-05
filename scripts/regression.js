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

function bootstrapEngine() {
  InitFilesRanksBrd();
  InitAttacks();
  InitSq120To64();
  InitPst();
  InitHashKeys();
  InitTT(16);
  InitBoardVars();
  InitMvvLva();
  EvalInit();
  GameController.BookLoaded = BOOL.FALSE;
  EngineSettings.skillLevel = 9;
}

const FEN_BLUNDER_1 = "6bk/6p1/7p/7P/4Q3/2q1nPP1/4B2K/4r1NR w - - 5 51";
const FEN_BLUNDER_2 = "6bk/4Q1p1/7p/8/7P/r1q2PP1/4BK1R/4n1N1 w - - 3 44";
const FEN_BLUNDER_3 = "r4rk1/2qnbpp1/b1p2n1p/p1Pp4/3PpN2/PBN1P3/3B1PPP/R2QK2R w KQ - 1 17";

function playMove(alg) {
  const from = SqFromAlg(alg.substring(0, 2));
  const to = SqFromAlg(alg.substring(2, 4));
  const move = ParseMove(from, to);
  assert.notStrictEqual(move, NOMOVE, "Expected legal move: " + alg);
  assert.strictEqual(MakeMove(move), BOOL.TRUE, "Failed to make move: " + alg);
  return move;
}

function captureState() {
  return {
    fen: BoardToFen(),
    key: brd_posKey >>> 0,
    keyHi: brd_posKeyHi >>> 0,
    side: brd_side,
    enPas: brd_enPas,
    castlePerm: brd_castlePerm,
    fiftyMove: brd_fiftyMove,
    fullMove: brd_fullMoveNumber,
    hisPly: brd_hisPly,
    ply: brd_ply,
    kingW: brd_kingSq[COLOURS.WHITE],
    kingB: brd_kingSq[COLOURS.BLACK],
    materialW: brd_material[COLOURS.WHITE],
    materialB: brd_material[COLOURS.BLACK],
    pstW: brd_pst[COLOURS.WHITE],
    pstB: brd_pst[COLOURS.BLACK]
  };
}

function assertStateEquals(expected, label) {
  assert.strictEqual(brd_posKey >>> 0, expected.key, label + " hash key mismatch");
  assert.strictEqual(brd_posKeyHi >>> 0, expected.keyHi, label + " hash key hi mismatch");
  assert.strictEqual(brd_side, expected.side, label + " side mismatch");
  assert.strictEqual(brd_enPas, expected.enPas, label + " en-passant mismatch");
  assert.strictEqual(brd_castlePerm, expected.castlePerm, label + " castle rights mismatch");
  assert.strictEqual(brd_fiftyMove, expected.fiftyMove, label + " fifty-move mismatch");
  assert.strictEqual(brd_fullMoveNumber, expected.fullMove, label + " fullmove mismatch");
  assert.strictEqual(brd_hisPly, expected.hisPly, label + " history ply mismatch");
  assert.strictEqual(brd_ply, expected.ply, label + " search ply mismatch");
  assert.strictEqual(brd_kingSq[COLOURS.WHITE], expected.kingW, label + " white king square mismatch");
  assert.strictEqual(brd_kingSq[COLOURS.BLACK], expected.kingB, label + " black king square mismatch");
  assert.strictEqual(brd_material[COLOURS.WHITE], expected.materialW, label + " white material mismatch");
  assert.strictEqual(brd_material[COLOURS.BLACK], expected.materialB, label + " black material mismatch");
  assert.strictEqual(brd_pst[COLOURS.WHITE], expected.pstW, label + " white pst mismatch");
  assert.strictEqual(brd_pst[COLOURS.BLACK], expected.pstB, label + " black pst mismatch");
  assert.strictEqual(BoardToFen(), expected.fen, label + " FEN mismatch");
  assert.strictEqual(CheckBoard(), BOOL.TRUE, label + " CheckBoard failed");
}

function runPerftSuite() {
  const suites = [
    {
      name: "start",
      fen: START_FEN,
      expected: [20, 400, 8902, 197281, 4865609]
    },
    {
      name: "blunder-fen-1",
      fen: FEN_BLUNDER_1,
      expected: [32, 1263, 33727]
    },
    {
      name: "blunder-fen-2",
      fen: FEN_BLUNDER_2,
      expected: [33, 1286, 37720]
    },
    {
      name: "bench-tactical",
      fen: "r2q1rk1/ppp2ppp/2npbn2/3Np3/2B1P3/2N5/PPP2PPP/R1BQ1RK1 w - - 0 1",
      expected: [42, 1373, 58030]
    },
    {
      name: "blunder-fen-3",
      fen: FEN_BLUNDER_3,
      expected: [38, 1605, 61066]
    }
  ];

  for (const suite of suites) {
    assert.strictEqual(ParseFen(suite.fen), BOOL.TRUE, "Perft FEN failed: " + suite.name);
    for (let depth = 1; depth <= suite.expected.length; depth++) {
      perft_leafNodes = 0;
      Perft(depth);
      assert.strictEqual(
        perft_leafNodes,
        suite.expected[depth - 1],
        `Perft mismatch (${suite.name}) depth ${depth}`
      );
    }
  }
}

function verifyMakeUnmakeIntegrityForFen(fen, depth) {
  assert.strictEqual(ParseFen(fen), BOOL.TRUE, "Integrity FEN failed: " + fen);
  const savedSearching = srch_searching;
  const savedPly = brd_ply;
  srch_searching = BOOL.TRUE;
  brd_ply = 0;

  function walk(remainingDepth) {
    if (remainingDepth <= 0) {
      return;
    }
    GenerateMoves();
    const start = brd_moveListStart[brd_ply];
    const end = brd_moveListStart[brd_ply + 1];
    for (let index = start; index < end; index++) {
      const move = brd_moveList[index];
      const before = captureState();
      const made = MakeMove(move);
      if (made === BOOL.FALSE) {
        assertStateEquals(before, "Illegal move rollback " + PrMove(move));
        continue;
      }
      assert.strictEqual(CheckBoard(), BOOL.TRUE, "CheckBoard failed after MakeMove " + PrMove(move));
      walk(remainingDepth - 1);
      TakeMove();
      assertStateEquals(before, "TakeMove rollback " + PrMove(move));
    }
  }

  try {
    walk(depth);
  } finally {
    srch_searching = savedSearching;
    brd_ply = savedPly;
  }
}

function searchFen(fen, depth, timeMs, renderAnalysis) {
  InitTT(64);
  assert.strictEqual(ParseFen(fen), BOOL.TRUE, "Search FEN failed: " + fen);
  srch_depth = depth;
  srch_time = timeMs;
  return SearchPosition({
    useBook: false,
    fastPlay: renderAnalysis ? false : true,
    renderAnalysis: renderAnalysis !== false,
    multiPvCount: 3,
    adaptiveTime: false
  });
}

function pvHead(pv, moves) {
  if (!pv || !pv.trim()) return "";
  return pv.trim().split(/\s+/).slice(0, moves).join(" ");
}

function runDeterministicSearchSeries(fen, depth, timeMs, runs) {
  const outputs = [];
  for (let i = 0; i < runs; i++) {
    const result = searchFen(fen, depth, timeMs, false);
    outputs.push({
      best: PrMove(result.bestMove),
      play: PrMove(result.playMove),
      score: result.bestScore,
      pv: result.pvLine || ""
    });
  }
  let deterministic = true;
  for (let i = 1; i < outputs.length; i++) {
    if (outputs[i].best !== outputs[0].best) deterministic = false;
    if (outputs[i].play !== outputs[0].play) deterministic = false;
    if (Math.abs(outputs[i].score - outputs[0].score) > 20) deterministic = false;
    if (pvHead(outputs[i].pv, 4) !== pvHead(outputs[0].pv, 4)) deterministic = false;
  }
  if (!deterministic) {
    console.warn("Search determinism drift detected (non-fixed series):", {
      fen,
      depth,
      runs,
      outputs
    });
  }
  return outputs[0];
}

function runFixedDepthDeterministicSearchSeries(fen, fixedDepth, timeMs, runs) {
  const outputs = [];
  for (let i = 0; i < runs; i++) {
    const result = searchFen(fen, fixedDepth, timeMs, false);
    assert.strictEqual(
      result.depth,
      fixedDepth,
      `Fixed-depth determinism failed to complete depth ${fixedDepth} on run ${i + 1}`
    );
    outputs.push({
      best: PrMove(result.bestMove),
      play: PrMove(result.playMove),
      score: result.bestScore,
      pv: result.pvLine || ""
    });
  }
  for (let i = 1; i < outputs.length; i++) {
    assert.strictEqual(outputs[i].best, outputs[0].best, "Fixed-depth determinism failed (best move) on run " + (i + 1));
    assert.strictEqual(outputs[i].play, outputs[0].play, "Fixed-depth determinism failed (play move) on run " + (i + 1));
    assert.strictEqual(outputs[i].score, outputs[0].score, "Fixed-depth determinism failed (score) on run " + (i + 1));
    assert.strictEqual(
      pvHead(outputs[i].pv, 4),
      pvHead(outputs[0].pv, 4),
      "Fixed-depth determinism failed (PV head) on run " + (i + 1)
    );
  }
  return outputs[0];
}

function run() {
  bootstrapEngine();

  assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN should parse");
  assert.strictEqual(BoardToFen(), START_FEN, "Start FEN roundtrip failed");

  // Simulate a long live game on the main thread: root ply must be normalized.
  brd_ply = MAXDEPTH;
  CheckAndSet();
  assert.strictEqual(brd_ply, 0, "Root ply should be reset for live-game checks");
  assert.strictEqual(GameController.GameOver, BOOL.FALSE, "Start position must not be marked game over");
  assert.strictEqual(stateStore["#GameStatus::text"] || "", "", "Start position status should stay empty");

  playMove("e2e4");
  playMove("e7e5");
  playMove("g1f3");
  assert.strictEqual(brd_ply, 0, "brd_ply must remain a root index during live play");
  assert.strictEqual(
    BoardToFen(),
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    "Move-sequence FEN mismatch"
  );

  assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN reparse failed");
  srch_depth = 2;
  srch_time = 30;
  const quickSearch = SearchPosition({
    useBook: false,
    fastPlay: true,
    renderAnalysis: false,
    multiPvCount: 1
  });
  assert.ok(quickSearch && typeof quickSearch === "object", "Quick search should return a result object");
  assert.strictEqual(srch_searching, BOOL.FALSE, "Search state flag should reset after search");
  assert.strictEqual(brd_ply, 0, "Root ply should reset after search");

  assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN reparse failed");
  playMove("g1f3");
  playMove("g8f6");
  playMove("f3g1");
  playMove("f6g8");
  assert.strictEqual(CheckResult(), BOOL.FALSE, "Two occurrences should not trigger a repetition draw");
  playMove("g1f3");
  playMove("g8f6");
  playMove("f3g1");
  playMove("f6g8");
  assert.strictEqual(CheckResult(), BOOL.TRUE, "Third occurrence should trigger repetition draw");
  assert.ok(
    (stateStore["#GameStatus::text"] || "").includes("3-fold repetition"),
    "Repetition draw should set the correct status text"
  );

  const savedBookLines = brd_bookLines.slice(0);
  const savedBookLoaded = GameController.BookLoaded;
  const savedRandom = Math.random;
  try {
    brd_bookLines = [
      "e2e4 e7e5",
      "e2e4 c7c5",
      "e2e4 e7e6",
      "d2d4 d7d5",
      "c2c4 e7e5"
    ];
    BuildBookIndex();
    GameController.BookLoaded = BOOL.TRUE;
    assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN reparse failed");
    const bookResult = SearchPosition({
      useBook: true,
      fastPlay: true,
      renderAnalysis: false,
      multiPvCount: 1
    });
    assert.strictEqual(bookResult.fromBook, true, "Book search should return a book result");
    const listedBookMoves = bookResult.topMoves.map((m) => PrMove(m.move));
    const listedSet = new Set(listedBookMoves);
    assert.ok(listedBookMoves.length >= 3, "Book result should expose all candidate moves");
    assert.strictEqual(listedSet.size, listedBookMoves.length, "Book move list should be deduplicated");
    ["e2e4", "d2d4", "c2c4"].forEach((alg) => {
      assert.ok(listedSet.has(alg), "Missing book move in UI list: " + alg);
    });
    assert.strictEqual(bookResult.topMoves[0].bookCount, 3, "Most frequent book move should be ranked first");
    assert.strictEqual(PrMove(bookResult.topMoves[0].move), "e2e4", "Book move ordering should follow frequency");
    assert.ok(listedSet.has(PrMove(bookResult.playMove)), "Played book move should be one of listed book moves");

    Math.random = () => 0.2;
    const weightedLow = SearchPosition({
      useBook: true,
      fastPlay: true,
      renderAnalysis: false,
      multiPvCount: 1
    });
    assert.strictEqual(PrMove(weightedLow.playMove), "e2e4", "Weighted book pick should favor frequent moves");

    Math.random = () => 0.95;
    const weightedHigh = SearchPosition({
      useBook: true,
      fastPlay: true,
      renderAnalysis: false,
      multiPvCount: 1
    });
    assert.notStrictEqual(PrMove(weightedHigh.playMove), "e2e4", "Weighted book pick should still allow rarer moves");
  } finally {
    Math.random = savedRandom;
    brd_bookLines = savedBookLines.slice(0);
    BuildBookIndex();
    GameController.BookLoaded = savedBookLoaded;
  }

  const beforeInvalidFen = BoardToFen();
  const beforeInvalidKey = brd_posKey;
  assert.strictEqual(ParseFen("not a fen"), BOOL.FALSE, "Invalid FEN should fail");
  assert.strictEqual(BoardToFen(), beforeInvalidFen, "Board changed after invalid FEN");
  assert.strictEqual(brd_posKey, beforeInvalidKey, "Hash changed after invalid FEN");

  assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN reparse failed");
  brd_fiftyMove = 100;
  assert.strictEqual(CheckResult(), BOOL.TRUE, "Fifty-move draw threshold should be inclusive");

  assert.strictEqual(ParseFen(START_FEN), BOOL.TRUE, "START_FEN reparse failed");
  const nullState = {
    side: brd_side,
    fifty: brd_fiftyMove,
    fullMove: brd_fullMoveNumber,
    hisPly: brd_hisPly,
    ply: brd_ply,
    key: brd_posKey,
    fen: BoardToFen()
  };
  MakeNullMove();
  TakeNullMove();
  assert.strictEqual(brd_side, nullState.side, "Null move side restore failed");
  assert.strictEqual(brd_fiftyMove, nullState.fifty, "Null move halfmove restore failed");
  assert.strictEqual(brd_fullMoveNumber, nullState.fullMove, "Null move fullmove restore failed");
  assert.strictEqual(brd_hisPly, nullState.hisPly, "Null move history ply restore failed");
  assert.strictEqual(brd_ply, nullState.ply, "Null move ply restore failed");
  assert.strictEqual(brd_posKey, nullState.key, "Null move hash restore failed");
  assert.strictEqual(BoardToFen(), nullState.fen, "Null move FEN restore failed");

  assert.strictEqual(ParseFen(FEN_BLUNDER_3), BOOL.TRUE, "FEN #3 parse failed");
  const illegalCastleState = captureState();
  const forgedCastle = MOVE(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA);
  assert.strictEqual(MakeMove(forgedCastle), BOOL.FALSE, "Illegal forged castle should be rejected by MakeMove");
  assertStateEquals(illegalCastleState, "Illegal forged castle rollback");

  runPerftSuite();

  verifyMakeUnmakeIntegrityForFen(START_FEN, 2);
  verifyMakeUnmakeIntegrityForFen(FEN_BLUNDER_1, 2);
  verifyMakeUnmakeIntegrityForFen(FEN_BLUNDER_2, 2);
  verifyMakeUnmakeIntegrityForFen(FEN_BLUNDER_3, 2);

  const fen1Search = runDeterministicSearchSeries(FEN_BLUNDER_1, 20, 20000, 3);
  if (fen1Search.play !== fen1Search.best) {
    console.warn("FEN #1 non-fixed play != best (allowed):", fen1Search);
  }
  assert.ok(fen1Search.pv.length > 0, "FEN #1 should expose a non-empty PV");

  const fen2Search = runDeterministicSearchSeries(FEN_BLUNDER_2, 20, 20000, 3);
  assert.strictEqual(fen2Search.best, "e7a3", "FEN #2 tactical regression: expected Qxa3");
  if (fen2Search.play !== "e7a3") {
    console.warn("FEN #2 non-fixed play != Qxa3 (allowed):", fen2Search);
  }
  assert.ok(fen2Search.pv.startsWith("e7a3"), "FEN #2 PV should begin with Qxa3");

  const fen2TopResult = searchFen(FEN_BLUNDER_2, 20, 20000, false);
  assert.strictEqual(PrMove(fen2TopResult.bestMove), "e7a3", "FEN #2 best move should stay Qxa3");
  assert.ok(Array.isArray(fen2TopResult.topMoves), "FEN #2 should expose top moves");
  const fen2TopMoves = fen2TopResult.topMoves.map((entry) => PrMove(entry.move));
  assert.ok(fen2TopMoves.includes("e7a3"), "FEN #2 top move list must include Qxa3");

  const fen3Search = runDeterministicSearchSeries(FEN_BLUNDER_3, 20, 20000, 2);
  console.log("fen3Search", fen3Search);
  //assert.notStrictEqual(fen3Search.best, "b3d5", "FEN #3 tactical regression: b3d5 should be rejected");
  if (fen3Search.play !== fen3Search.best) {
    console.warn("FEN #3 non-fixed play != best (allowed):", fen3Search);
  }

  const fixedDepthSearch = runFixedDepthDeterministicSearchSeries(FEN_BLUNDER_2, 10, 20000, 3);
  assert.strictEqual(fixedDepthSearch.play, fixedDepthSearch.best, "Fixed-depth deterministic play move should match best move");

  assert.strictEqual(
    ParseFen("r2q1rk1/ppp2ppp/2npbn2/3Np3/2B1P3/2N5/PPP2PPP/R1BQ1RK1 w - - 0 1"),
    BOOL.TRUE,
    "Bench setup FEN failed"
  );
  const beforeBenchFen = BoardToFen();
  const benchResult = RunBenchSuite(1000);
  assert.ok(benchResult && Array.isArray(benchResult.results), "Bench result missing summary");
  assert.strictEqual(benchResult.results.length, 3, "Bench should run 3 positions");
  assert.strictEqual(BoardToFen(), beforeBenchFen, "Bench did not restore original position");

  console.log("All regression checks passed.");
}

try {
  run();
} catch (err) {
  console.error("Regression failed:", err && err.message ? err.message : err);
  process.exit(1);
}
