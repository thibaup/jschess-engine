"use strict";

var __workerStateStore = Object.create(null);

function makeStub(selector) {
	return {
		length: 0,
		click: function() { return this; },
		change: function() { return this; },
		on: function() { return this; },
		ajaxComplete: function() { return this; },
		remove: function() { return this; },
		append: function() { return this; },
		empty: function() { return this; },
		css: function() { return this; },
		attr: function() { return this; },
		removeClass: function() { return this; },
		addClass: function() { return this; },
		find: function() { return this; },
		each: function() { return this; },
		offset: function() { return { left: 0, top: 0 }; },
		val: function(value) {
			var key = selector + "::val";
			if(typeof value === "undefined") return __workerStateStore[key] || "";
			__workerStateStore[key] = String(value);
			return this;
		},
		text: function(value) {
			var key = selector + "::text";
			if(typeof value === "undefined") return __workerStateStore[key] || "";
			__workerStateStore[key] = String(value);
			return this;
		}
	};
}

self.window = self;
self.document = {
	documentElement: { clientWidth: 1200 }
};

self.$ = function(selector) {
	if(typeof selector === "function") {
		return makeStub("__ready__");
	}
	return makeStub(String(selector));
};

self.$.trim = function(value) {
	return String(value).trim();
};

self.$.now = function() {
	return Date.now();
};

self.$.ajax = function() {};

importScripts("all.js");

// Rendering is handled on the main thread. Keep this as a no-op in worker.
RenderSearchResult = function() {};

var WorkerEngineState = {
	initialized: false
};

function postWorkerMessage(type, payload) {
	var message = payload || {};
	message.type = type;
	self.postMessage(message);
}

function postWorkerError(message, requestId) {
	var payload = {
		message: String(message || "Worker error")
	};
	if(typeof requestId !== "undefined") {
		payload.requestId = requestId;
	}
	postWorkerMessage("error", payload);
}

function EnsureWorkerInitialized(ttTargetMb, skillLevel) {
	var parsedTt = parseInt(ttTargetMb, 10);
	if(isNaN(parsedTt) || parsedTt < TT_MIN_MB) {
		parsedTt = EngineSettings.ttTargetMb;
	}

	if(WorkerEngineState.initialized !== true) {
		InitFilesRanksBrd();
		InitAttacks();
		InitSq120To64();
		InitPst();
		InitHashKeys();
		InitTT(parsedTt);
		InitBoardVars();
		InitMvvLva();
		EvalInit();
		GameController.BookLoaded = BOOL.FALSE;
		WorkerEngineState.initialized = true;
	} else if(parsedTt !== TT_REQUEST_MB) {
		InitTT(parsedTt);
	}

	EngineSettings.ttTargetMb = parsedTt;

	var parsedSkill = parseInt(skillLevel, 10);
	if(!isNaN(parsedSkill) && SkillProfiles[parsedSkill]) {
		EngineSettings.skillLevel = parsedSkill;
	}
}

function ApplyRepetitionHistory(history) {
	if(!history || typeof history !== "object") return;
	var posKeys = history.posKeys;
	var posKeysHi = history.posKeysHi;
	if(!posKeys || !posKeysHi || typeof posKeys.length !== "number" || typeof posKeysHi.length !== "number") {
		return;
	}

	var hisPly = parseInt(history.hisPly, 10);
	if(isNaN(hisPly) || hisPly < 0) hisPly = 0;
	if(hisPly > MAXGAMEMOVES) hisPly = MAXGAMEMOVES;
	var maxLen = Math.min(hisPly, posKeys.length, posKeysHi.length);

	brd_hisPly = maxLen;

	var fiftyMove = parseInt(history.fiftyMove, 10);
	if(!isNaN(fiftyMove) && fiftyMove >= 0) {
		brd_fiftyMove = fiftyMove;
	}

	if(maxLen === 0) {
		brd_history_posKey.fill(0);
		brd_history_posKeyHi.fill(0);
		return;
	}

	brd_history_posKey.set(posKeys.slice(0, maxLen), 0);
	brd_history_posKeyHi.set(posKeysHi.slice(0, maxLen), 0);
}

function HandleSearchMessage(message) {
	var requestId = message.requestId;
	var fen = message.fen || START_FEN;
	var settings = message.settings || {};
	var search = message.search || {};

	EnsureWorkerInitialized(settings.ttTargetMb, settings.skillLevel);

	if(ParseFen(fen) != BOOL.TRUE) {
		postWorkerError("Invalid FEN in worker search request", requestId);
		return;
	}
	ApplyRepetitionHistory(search.repHistory);

	var depth = parseInt(search.depth, 10);
	if(isNaN(depth) || depth < 1) depth = MAXDEPTH;
	var timeMs = parseInt(search.timeMs, 10);
	if(isNaN(timeMs) || timeMs < 1) timeMs = 1000;
	var softTimeMs = parseInt(search.softTimeMs, 10);
	if(isNaN(softTimeMs) || softTimeMs < 1) softTimeMs = null;
	var adaptiveTime = search.adaptiveTime === true;
	var reportProgress = search.reportProgress === true;
	var progressThrottleMs = parseInt(search.progressThrottleMs, 10);
	if(isNaN(progressThrottleMs) || progressThrottleMs < 50) progressThrottleMs = 120;

	srch_depth = depth;
	srch_time = timeMs;

	var prevProgressCallback = SearchProgressCallback;
	if(reportProgress) {
		SearchProgressCallback = function(progress) {
			if(!progress || typeof progress !== "object") return;
			postWorkerMessage("searchProgress", {
				requestId: requestId,
				fen: fen,
				result: progress
			});
		};
	}

	var result = SearchPosition({
		useBook: search.useBook !== false,
		fastPlay: search.fastPlay === true,
		renderAnalysis: search.renderAnalysis !== false,
		multiPvCount: search.multiPvCount || EngineSettings.multiPvCount || 3,
		adaptiveTime: adaptiveTime,
		softTimeMs: softTimeMs,
		reportProgress: reportProgress,
		progressThrottleMs: progressThrottleMs,
		bookLine: typeof search.gameLine === "string" ? search.gameLine : null
	});
	SearchProgressCallback = prevProgressCallback;

	postWorkerMessage("searchResult", {
		requestId: requestId,
		fen: fen,
		result: result
	});
}

self.onmessage = function(evt) {
	var message = evt && evt.data ? evt.data : {};
	try {
		if(message.type === "init") {
			EnsureWorkerInitialized(message.ttTargetMb, message.skillLevel);
			postWorkerMessage("ready", {
				ttAllocatedMb: TT_ALLOC_MB
			});
			return;
		}

		if(message.type === "setBook") {
			EnsureWorkerInitialized();
			if(Array.isArray(message.bookLines)) {
				brd_bookLines = message.bookLines.slice(0);
				BuildBookIndex();
				GameController.BookLoaded = brd_bookLines.length > 0 ? BOOL.TRUE : BOOL.FALSE;
			}
			postWorkerMessage("bookReady", {
				count: brd_bookLines.length
			});
			return;
		}

		if(message.type === "search") {
			HandleSearchMessage(message);
			return;
		}

		if(message.type === "ping") {
			postWorkerMessage("pong", {});
		}
	} catch(err) {
		postWorkerError(err && err.message ? err.message : err, message.requestId);
	}
};
