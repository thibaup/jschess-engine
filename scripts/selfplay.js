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
  InitTT(32);
  InitBoardVars();
  InitMvvLva();
  EvalInit();
  GameController.BookLoaded = BOOL.FALSE;
}

function clearGameStatus() {
  stateStore["#GameStatus::text"] = "";
  GameController.GameOver = BOOL.FALSE;
}

function parseGameResult() {
  const status = stateStore["#GameStatus::text"] || "";
  if (status.includes("GAME OVER {white mates}")) return "white";
  if (status.includes("GAME OVER {black mates}")) return "black";
  if (status.includes("GAME DRAWN {3-fold repetition}")) return "draw-3fold";
  if (status.includes("GAME DRAWN {fifty move rule}")) return "draw-50";
  if (status.includes("GAME DRAWN {stalemate}")) return "draw-stalemate";
  if (status.includes("GAME DRAWN {insufficient material")) return "draw-material";
  if (status.includes("GAME DRAWN")) return "draw-other";
  return "unknown";
}

function runSelfPlay(options) {
  const games = options.games;
  const maxPlies = options.maxPlies;
  const depth = options.depth;
  const timeMs = options.timeMs;

  EngineSettings.skillLevel = 9;
  EngineSettings.fastPlayMode = true;

  const summary = {
    games,
    maxPlies,
    depth,
    timeMs,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
    draw3fold: 0,
    draw50: 0,
    drawStalemate: 0,
    drawMaterial: 0,
    drawOther: 0,
    maxPlyReached: 0,
    searchFailures: 0,
    illegalMoves: 0,
    hashErrors: 0,
    repetitionSuspicious: 0
  };

  for (let game = 1; game <= games; game++) {
    clearGameStatus();
    if (ParseFen(START_FEN) !== BOOL.TRUE) {
      throw new Error("Failed to parse START_FEN for game " + game);
    }

    let ply;
    let ended = false;
    for (ply = 0; ply < maxPlies; ply++) {
      if (CheckResult() === BOOL.TRUE) {
        ended = true;
        break;
      }

      srch_depth = depth;
      srch_time = timeMs;
      const result = SearchPosition({
        useBook: false,
        fastPlay: true,
        renderAnalysis: false,
        multiPvCount: 1
      });

      if (!result || result.playMove === NOMOVE) {
        summary.searchFailures++;
        break;
      }

      const fenBefore = BoardToFen();
      const scoreBefore = typeof result.bestScore === "number" ? result.bestScore : 0;
      const moveToPlay = EnsurePlayableMove(result.playMove);
      if (moveToPlay === NOMOVE) {
        summary.searchFailures++;
        break;
      }
      if (MakeMove(moveToPlay) !== BOOL.TRUE) {
        summary.illegalMoves++;
        break;
      }

      if (Math.abs(scoreBefore) >= 120 && RepetitionCount() >= 2) {
        summary.repetitionSuspicious++;
        if (summary.repetitionSuspicious <= 3) {
          console.log("Suspicious repetition at ply", ply, "score", scoreBefore, "fen", fenBefore, "move", PrMove(moveToPlay));
        }
      }

      if ((ply + 1) % 10 === 0) {
        if (CheckBoard() !== BOOL.TRUE) {
          summary.hashErrors++;
          break;
        }
      }
    }

    if (!ended && ply >= maxPlies) {
      summary.maxPlyReached++;
    }

    if (CheckResult() === BOOL.TRUE) {
      const result = parseGameResult();
      if (result === "white") summary.whiteWins++;
      else if (result === "black") summary.blackWins++;
      else {
        summary.draws++;
        if (result === "draw-3fold") summary.draw3fold++;
        else if (result === "draw-50") summary.draw50++;
        else if (result === "draw-stalemate") summary.drawStalemate++;
        else if (result === "draw-material") summary.drawMaterial++;
        else summary.drawOther++;
      }
    } else {
      summary.draws++;
      summary.drawOther++;
    }

    console.log(
      "Game",
      game,
      "plies",
      ply,
      "status",
      stateStore["#GameStatus::text"] || "(none)"
    );
  }

  return summary;
}

function main() {
  const games = parseInt(process.argv[2], 10) || 20;
  const maxPlies = parseInt(process.argv[3], 10) || 120;
  const depth = parseInt(process.argv[4], 10) || 4;
  const timeMs = parseInt(process.argv[5], 10) || 20;

  bootstrapEngine();
  const summary = runSelfPlay({ games, maxPlies, depth, timeMs });

  console.log("\nSelf-play summary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.searchFailures || summary.illegalMoves || summary.hashErrors) {
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error("Self-play failed:", err && err.message ? err.message : err);
  process.exit(1);
}
