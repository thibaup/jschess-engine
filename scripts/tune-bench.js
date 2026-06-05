#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const out = {
    engine: null,
    positions: 12,
    seed: 20260208,
    minPlies: 8,
    maxPlies: 40,
    depth: 10,
    tt: 64
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    switch (a) {
      case "--engine":
        out.engine = n;
        i++;
        break;
      case "--positions":
        out.positions = parseInt(n, 10);
        i++;
        break;
      case "--seed":
        out.seed = parseInt(n, 10);
        i++;
        break;
      case "--min-plies":
        out.minPlies = parseInt(n, 10);
        i++;
        break;
      case "--max-plies":
        out.maxPlies = parseInt(n, 10);
        i++;
        break;
      case "--depth":
        out.depth = parseInt(n, 10);
        i++;
        break;
      case "--tt":
        out.tt = parseInt(n, 10);
        i++;
        break;
      default:
        break;
    }
  }
  if (!out.engine) {
    throw new Error("Missing --engine <path>");
  }
  if (!Number.isFinite(out.positions) || out.positions < 1) out.positions = 12;
  if (!Number.isFinite(out.seed)) out.seed = 20260208;
  if (!Number.isFinite(out.minPlies) || out.minPlies < 0) out.minPlies = 8;
  if (!Number.isFinite(out.maxPlies) || out.maxPlies < out.minPlies) out.maxPlies = out.minPlies + 8;
  if (!Number.isFinite(out.depth) || out.depth < 1) out.depth = 10;
  if (!Number.isFinite(out.tt) || out.tt < 16) out.tt = 64;
  out.engine = path.resolve(process.cwd(), out.engine);
  return out;
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

function generateFens(seed, count, minPlies, maxPlies) {
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

function bootstrap(enginePath, ttMb) {
  setupDomStubs();
  vm.runInThisContext(fs.readFileSync(enginePath, "utf8"), { filename: enginePath });
  InitFilesRanksBrd();
  InitAttacks();
  InitSq120To64();
  InitPst();
  InitHashKeys();
  InitTT(ttMb);
  InitBoardVars();
  InitMvvLva();
  EvalInit();
  GameController.BookLoaded = BOOL.FALSE;
  EngineSettings.skillLevel = 8;
  EngineSettings.fastPlayMode = true;
  EngineSettings.ttTargetMb = ttMb;
}

function runBench(fens, depth) {
  let totalMs = 0;
  let totalNodes = 0;
  let totalDepth = 0;

  // Warmup to reduce one-time JIT effects.
  for (let i = 0; i < Math.min(3, fens.length); i++) {
    ParseFen(fens[i]);
    srch_depth = Math.max(2, depth - 1);
    srch_time = 600000;
    SearchPosition({
      useBook: false,
      fastPlay: true,
      renderAnalysis: false,
      adaptiveTime: false,
      multiPvCount: 1
    });
  }

  for (const fen of fens) {
    ParseFen(fen);
    srch_depth = depth;
    srch_time = 600000;
    const started = Date.now();
    const result = SearchPosition({
      useBook: false,
      fastPlay: true,
      renderAnalysis: false,
      adaptiveTime: false,
      multiPvCount: 1
    });
    const elapsed = Date.now() - started;
    totalMs += elapsed;
    totalNodes += result.nodes || 0;
    totalDepth += result.depth || 0;
  }

  return {
    positions: fens.length,
    totalMs,
    totalNodes,
    avgDepth: fens.length ? (totalDepth / fens.length) : 0,
    nps: totalMs > 0 ? Math.round((totalNodes * 1000) / totalMs) : 0
  };
}

function main() {
  const opts = parseArgs(process.argv);
  bootstrap(opts.engine, opts.tt);
  const fens = generateFens(opts.seed, opts.positions, opts.minPlies, opts.maxPlies);
  const bench = runBench(fens, opts.depth);
  const payload = {
    engine: opts.engine,
    tt: opts.tt,
    depth: opts.depth,
    seed: opts.seed,
    ...bench
  };
  process.stdout.write("RESULT_JSON=" + JSON.stringify(payload) + "\n");
}

try {
  main();
} catch (err) {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
}

