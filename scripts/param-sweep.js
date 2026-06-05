#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PATCH_RULES = {
  LMP_LIMIT: /var LMP_LIMIT = \[[^\]]+\];/,
  FUTILITY_MARGIN: /var FUTILITY_MARGIN = \[[^\]]+\];/,
  RFP_MARGIN: /var RFP_MARGIN = \[[^\]]+\];/,
  RAZOR_MARGIN_CP: /var RAZOR_MARGIN_CP = -?\d+;/,
  PROBCUT_MIN_DEPTH: /var PROBCUT_MIN_DEPTH = -?\d+;/,
  PROBCUT_MARGIN: /var PROBCUT_MARGIN = -?\d+;/,
  PROBCUT_REDUCTION: /var PROBCUT_REDUCTION = -?\d+;/,
  PROBCUT_MAX_MOVES: /var PROBCUT_MAX_MOVES = -?\d+;/,
  SEE_PRUNE_DEPTH: /var SEE_PRUNE_DEPTH = -?\d+;/,
  SEE_PRUNE_MARGIN: /var SEE_PRUNE_MARGIN = \[[^\]]+\];/,
  IID_MIN_DEPTH: /var IID_MIN_DEPTH = -?\d+;/,
  IID_REDUCTION: /var IID_REDUCTION = -?\d+;/
};

const DEFAULT_CANDIDATES = [
  { id: "baseline", tt: 64, patch: {} },
  { id: "tt16", tt: 64, patch: { FORCE_TT_MB: 16 } },
  { id: "tt24", tt: 64, patch: { FORCE_TT_MB: 24 } },
  { id: "tt32", tt: 64, patch: { FORCE_TT_MB: 32 } },
  { id: "tt48", tt: 64, patch: { FORCE_TT_MB: 48 } },
  { id: "tt80", tt: 64, patch: { FORCE_TT_MB: 80 } },
  { id: "tt96", tt: 64, patch: { FORCE_TT_MB: 96 } },
  { id: "tt128", tt: 64, patch: { FORCE_TT_MB: 128 } },
  {
    id: "prune_aggressive",
    tt: 64,
    patch: {
      LMP_LIMIT: [0, 1, 4, 7, 10, 14],
      FUTILITY_MARGIN: [0, 90, 170, 250],
      RFP_MARGIN: [0, 90, 170, 280, 390],
      RAZOR_MARGIN_CP: 140
    }
  },
  {
    id: "prune_conservative",
    tt: 64,
    patch: {
      LMP_LIMIT: [0, 2, 6, 10, 16, 22],
      FUTILITY_MARGIN: [0, 120, 240, 360],
      RFP_MARGIN: [0, 120, 240, 360, 520],
      RAZOR_MARGIN_CP: 190
    }
  },
  { id: "probcut_off", tt: 64, patch: { PROBCUT_MIN_DEPTH: 99 } },
  { id: "probcut_more", tt: 64, patch: { PROBCUT_MIN_DEPTH: 4, PROBCUT_MARGIN: 200, PROBCUT_MAX_MOVES: 8 } },
  { id: "see_prune_off", tt: 64, patch: { SEE_PRUNE_DEPTH: 0 } },
  { id: "iid_off", tt: 64, patch: { IID_MIN_DEPTH: 99 } }
];

function parseArgs(argv) {
  const out = {
    base: "js/all.js",
    book: "bookXml.xml",
    report: "scripts/param-sweep-report.json",
    tempDir: "testscripts/.sweep",
    benchPositions: 12,
    benchDepth: 10,
    benchRepeats: 3,
    benchSeed: 20260208,
    benchMinPlies: 8,
    benchMaxPlies: 40,
    benchRejectPct: -12,
    matchTime: 100,
    matchChunkGames: 20,
    matchMaxGames: 60,
    matchTop: 8,
    zAccept: 2.0,
    zReject: -2.0,
    seed: 20260208,
    keepTemp: false
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    switch (a) {
      case "--base":
        out.base = n;
        i++;
        break;
      case "--book":
        out.book = n;
        i++;
        break;
      case "--report":
        out.report = n;
        i++;
        break;
      case "--temp-dir":
        out.tempDir = n;
        i++;
        break;
      case "--bench-positions":
        out.benchPositions = parseInt(n, 10);
        i++;
        break;
      case "--bench-depth":
        out.benchDepth = parseInt(n, 10);
        i++;
        break;
      case "--bench-repeats":
        out.benchRepeats = parseInt(n, 10);
        i++;
        break;
      case "--bench-seed":
        out.benchSeed = parseInt(n, 10);
        i++;
        break;
      case "--bench-min-plies":
        out.benchMinPlies = parseInt(n, 10);
        i++;
        break;
      case "--bench-max-plies":
        out.benchMaxPlies = parseInt(n, 10);
        i++;
        break;
      case "--bench-reject-pct":
        out.benchRejectPct = parseFloat(n);
        i++;
        break;
      case "--match-time":
        out.matchTime = parseInt(n, 10);
        i++;
        break;
      case "--match-chunk":
        out.matchChunkGames = parseInt(n, 10);
        i++;
        break;
      case "--match-max-games":
        out.matchMaxGames = parseInt(n, 10);
        i++;
        break;
      case "--match-top":
        out.matchTop = parseInt(n, 10);
        i++;
        break;
      case "--z-accept":
        out.zAccept = parseFloat(n);
        i++;
        break;
      case "--z-reject":
        out.zReject = parseFloat(n);
        i++;
        break;
      case "--seed":
        out.seed = parseInt(n, 10);
        i++;
        break;
      case "--keep-temp":
        out.keepTemp = true;
        break;
      default:
        break;
    }
  }

  out.base = path.resolve(process.cwd(), out.base);
  out.book = path.resolve(process.cwd(), out.book);
  out.report = path.resolve(process.cwd(), out.report);
  out.tempDir = path.resolve(process.cwd(), out.tempDir);
  if (!Number.isFinite(out.benchPositions) || out.benchPositions < 1) out.benchPositions = 12;
  if (!Number.isFinite(out.benchDepth) || out.benchDepth < 2) out.benchDepth = 10;
  if (!Number.isFinite(out.benchRepeats) || out.benchRepeats < 1) out.benchRepeats = 3;
  if (!Number.isFinite(out.benchSeed)) out.benchSeed = 20260208;
  if (!Number.isFinite(out.benchMinPlies) || out.benchMinPlies < 0) out.benchMinPlies = 8;
  if (!Number.isFinite(out.benchMaxPlies) || out.benchMaxPlies < out.benchMinPlies) out.benchMaxPlies = out.benchMinPlies + 8;
  if (!Number.isFinite(out.benchRejectPct)) out.benchRejectPct = -12;
  if (!Number.isFinite(out.matchTime) || out.matchTime < 25) out.matchTime = 100;
  if (!Number.isFinite(out.matchChunkGames) || out.matchChunkGames < 2) out.matchChunkGames = 20;
  if ((out.matchChunkGames & 1) === 1) out.matchChunkGames += 1;
  if (!Number.isFinite(out.matchMaxGames) || out.matchMaxGames < out.matchChunkGames) out.matchMaxGames = out.matchChunkGames;
  if ((out.matchMaxGames & 1) === 1) out.matchMaxGames += 1;
  if (!Number.isFinite(out.matchTop) || out.matchTop < 1) out.matchTop = 8;
  if (!Number.isFinite(out.zAccept)) out.zAccept = 2.0;
  if (!Number.isFinite(out.zReject)) out.zReject = -2.0;
  if (out.zReject >= out.zAccept) out.zReject = out.zAccept - 0.5;
  if (!Number.isFinite(out.seed)) out.seed = 20260208;
  return out;
}

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const message = [
      `Command failed: node ${args.join(" ")}`,
      `Exit code: ${result.status}`,
      result.stdout || "",
      result.stderr || ""
    ].join("\n");
    throw new Error(message);
  }
  return result.stdout || "";
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function toJsLiteral(value) {
  return JSON.stringify(value);
}

function applyPatchToSource(source, patch) {
  let out = source;
  for (const [key, value] of Object.entries(patch)) {
    if (key === "FORCE_TT_MB") {
      const initTtHead = /function InitTT\(targetMb\) \{\r?\n/;
      if (!initTtHead.test(out)) {
        throw new Error("Pattern not found for key: FORCE_TT_MB");
      }
      out = out.replace(initTtHead, `function InitTT(targetMb) {\n\ttargetMb = ${toJsLiteral(value)};\n`);
      continue;
    }
    const rule = PATCH_RULES[key];
    if (!rule) {
      throw new Error(`Unknown patch key: ${key}`);
    }
    const replacement = rule.source.startsWith("var " + key + " = [")
      ? `var ${key} = ${toJsLiteral(value)};`
      : `var ${key} = ${toJsLiteral(value)};`;
    if (!rule.test(out)) {
      throw new Error(`Pattern not found for key: ${key}`);
    }
    out = out.replace(rule, replacement);
  }
  return out;
}

function createCandidates(basePath, tempDir) {
  const baseSource = fs.readFileSync(basePath, "utf8");
  fs.mkdirSync(tempDir, { recursive: true });

  const out = [];
  for (const cand of DEFAULT_CANDIDATES) {
    const entry = { ...cand };
    if (entry.id === "baseline" || !entry.patch || Object.keys(entry.patch).length === 0) {
      entry.enginePath = basePath;
    } else {
      const patched = applyPatchToSource(baseSource, entry.patch);
      const file = path.join(tempDir, `${entry.id}.js`);
      fs.writeFileSync(file, patched, "utf8");
      entry.enginePath = file;
    }
    out.push(entry);
  }
  return out;
}

function parseBenchPayload(output) {
  const lines = output.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("RESULT_JSON=")) continue;
    return JSON.parse(line.slice("RESULT_JSON=".length));
  }
  throw new Error("Benchmark output missing RESULT_JSON payload.");
}

function runBenchOnce(enginePath, ttMb, opts) {
  const args = [
    path.join("scripts", "tune-bench.js"),
    "--engine", enginePath,
    "--positions", String(opts.benchPositions),
    "--seed", String(opts.benchSeed),
    "--min-plies", String(opts.benchMinPlies),
    "--max-plies", String(opts.benchMaxPlies),
    "--depth", String(opts.benchDepth),
    "--tt", String(ttMb)
  ];
  const stdout = runNode(args, process.cwd());
  return parseBenchPayload(stdout);
}

function parseMatchSummary(output) {
  const re = /A:\s*([0-9]+(?:\.[0-9]+)?)\s*\|\s*B:\s*([0-9]+(?:\.[0-9]+)?)\s*\|\s*Draws:\s*([0-9]+)/g;
  let m;
  let last = null;
  while ((m = re.exec(output)) !== null) {
    last = m;
  }
  if (!last) {
    throw new Error("Could not parse engine-match summary.");
  }
  const aPoints = parseFloat(last[1]);
  const bPoints = parseFloat(last[2]);
  const draws = parseInt(last[3], 10);
  const games = Math.round(aPoints + bPoints);
  const bWins = Math.round((bPoints - (draws * 0.5)) * 1000) / 1000;
  const bLosses = games - draws - bWins;
  return { games, aPoints, bPoints, draws, bWins, bLosses };
}

function runMatchChunk(basePath, candidatePath, ttMb, games, timeMs, bookPath, seed) {
  const args = [
    path.join("scripts", "engine-match.js"),
    "--a", basePath,
    "--b", candidatePath,
    "--games", String(games),
    "--time", String(timeMs),
    "--tt", String(ttMb),
    "--book", bookPath,
    "--seed", String(seed),
    "--quiet"
  ];
  const stdout = runNode(args, process.cwd());
  return parseMatchSummary(stdout);
}

function computeScoreStats(wins, draws, losses) {
  const n = wins + draws + losses;
  if (n <= 0) {
    return { n: 0, mean: 0.5, variance: 0.25, z: 0, elo: 0 };
  }
  const mean = (wins + (0.5 * draws)) / n;
  const ex2 = (wins + (0.25 * draws)) / n;
  let variance = ex2 - (mean * mean);
  if (variance < 1e-9) variance = 1e-9;
  const z = (mean - 0.5) / Math.sqrt(variance / n);
  let elo = 0;
  if (mean <= 0) elo = -9999;
  else if (mean >= 1) elo = 9999;
  else elo = -400 * Math.log10((1 / mean) - 1);
  return { n, mean, variance, z, elo };
}

function sequentialMatch(basePath, candidatePath, ttMb, opts, seedBase) {
  let totalWins = 0;
  let totalDraws = 0;
  let totalLosses = 0;
  let gamesPlayed = 0;
  let verdict = "inconclusive";
  const rounds = [];

  while (gamesPlayed < opts.matchMaxGames) {
    const nextGames = Math.min(opts.matchChunkGames, opts.matchMaxGames - gamesPlayed);
    const seed = seedBase + gamesPlayed;
    const chunk = runMatchChunk(basePath, candidatePath, ttMb, nextGames, opts.matchTime, opts.book, seed);
    totalWins += chunk.bWins;
    totalDraws += chunk.draws;
    totalLosses += chunk.bLosses;
    gamesPlayed += chunk.games;

    const stats = computeScoreStats(totalWins, totalDraws, totalLosses);
    const row = {
      games: gamesPlayed,
      wins: totalWins,
      losses: totalLosses,
      draws: totalDraws,
      scorePct: +(stats.mean * 100).toFixed(2),
      z: +stats.z.toFixed(3),
      elo: +stats.elo.toFixed(1)
    };
    rounds.push(row);

    if (stats.z >= opts.zAccept) {
      verdict = "better";
      break;
    }
    if (stats.z <= opts.zReject) {
      verdict = "worse";
      break;
    }
  }

  if (verdict === "inconclusive") {
    const stats = computeScoreStats(totalWins, totalDraws, totalLosses);
    verdict = stats.mean > 0.5 ? "lean_better" : (stats.mean < 0.5 ? "lean_worse" : "equal");
  }

  return { verdict, gamesPlayed, wins: totalWins, losses: totalLosses, draws: totalDraws, rounds };
}

function cleanupTempDir(tempDir) {
  if (!fs.existsSync(tempDir)) return;
  for (const name of fs.readdirSync(tempDir)) {
    const file = path.join(tempDir, name);
    if (fs.statSync(file).isFile() && name.endsWith(".js")) {
      fs.unlinkSync(file);
    }
  }
}

function main() {
  const opts = parseArgs(process.argv);
  const candidates = createCandidates(opts.base, opts.tempDir);
  const benchRows = [];

  for (const cand of candidates) {
    const runs = [];
    for (let i = 0; i < opts.benchRepeats; i++) {
      runs.push(runBenchOnce(cand.enginePath, cand.tt, opts));
    }
    const npsRuns = runs.map((r) => r.nps);
    const msRuns = runs.map((r) => r.totalMs);
    const nodesRuns = runs.map((r) => r.totalNodes);
    benchRows.push({
      id: cand.id,
      enginePath: cand.enginePath,
      tt: cand.tt,
      patch: cand.patch,
      bench: {
        runs,
        medianNps: median(npsRuns),
        medianMs: median(msRuns),
        medianNodes: median(nodesRuns),
        rawNps: npsRuns,
        rawMs: msRuns
      }
    });
  }

  const baseline = benchRows.find((r) => r.id === "baseline");
  if (!baseline) {
    throw new Error("Missing baseline candidate.");
  }

  for (const row of benchRows) {
    row.bench.npsDeltaPct = +(((row.bench.medianNps - baseline.bench.medianNps) / baseline.bench.medianNps) * 100).toFixed(2);
    row.bench.msDeltaPct = +(((row.bench.medianMs - baseline.bench.medianMs) / baseline.bench.medianMs) * 100).toFixed(2);
  }

  const matchPool = benchRows
    .filter((r) => r.id !== "baseline")
    .filter((r) => r.bench.npsDeltaPct >= opts.benchRejectPct)
    .sort((a, b) => b.bench.npsDeltaPct - a.bench.npsDeltaPct)
    .slice(0, opts.matchTop);

  for (let i = 0; i < matchPool.length; i++) {
    const row = matchPool[i];
    row.match = sequentialMatch(
      opts.base,
      row.enginePath,
      row.tt,
      opts,
      opts.seed + (i * 1000)
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    options: opts,
    baseline: {
      id: baseline.id,
      enginePath: baseline.enginePath,
      bench: baseline.bench
    },
    candidates: benchRows.map((r) => ({
      id: r.id,
      tt: r.tt,
      patch: r.patch,
      enginePath: r.enginePath,
      bench: r.bench,
      match: r.match || null
    }))
  };

  fs.mkdirSync(path.dirname(opts.report), { recursive: true });
  fs.writeFileSync(opts.report, JSON.stringify(report, null, 2), "utf8");

  const benchTable = benchRows.map((r) => ({
    id: r.id,
    tt: r.tt,
    medianNps: r.bench.medianNps,
    npsDeltaPct: r.bench.npsDeltaPct,
    medianMs: r.bench.medianMs,
    msDeltaPct: r.bench.msDeltaPct
  }));
  console.log("Benchmark summary:");
  console.table(benchTable);

  if (matchPool.length > 0) {
    const matchTable = matchPool.map((r) => {
      const lastRound = r.match.rounds[r.match.rounds.length - 1];
      return {
        id: r.id,
        tt: r.tt,
        verdict: r.match.verdict,
        games: r.match.gamesPlayed,
        wins: r.match.wins,
        losses: r.match.losses,
        draws: r.match.draws,
        scorePct: lastRound ? lastRound.scorePct : 50.0,
        z: lastRound ? lastRound.z : 0
      };
    });
    console.log("Match summary (candidate as engine B vs baseline engine A):");
    console.table(matchTable);
  } else {
    console.log("No candidates passed benchmark gate for match stage.");
  }

  console.log(`Report written to ${opts.report}`);

  if (!opts.keepTemp) {
    cleanupTempDir(opts.tempDir);
  } else {
    console.log(`Temporary variants kept in ${opts.tempDir}`);
  }
}

try {
  main();
} catch (err) {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
}
