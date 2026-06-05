

var PIECES =  { EMPTY : 0, wP : 1, wN : 2, wB : 3,wR : 4, wQ : 5, wK : 6, bP : 7, bN : 8, bB : 9, bR : 10, bQ : 11, bK : 12  };
var BRD_SQ_NUM = 120;

var MAXGAMEMOVES = 2048;
var MAXPOSITIONMOVES = 256;
var MAXDEPTH = 64;

var INFINITE = 30000;
var MATE = 29000;

var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
var START_FEN_KEY = (function() {
	var tokens = START_FEN.split(/\s+/);
	return tokens.slice(0, 4).join(" ");
})();


var FILES =  { FILE_A:0, FILE_B:1, FILE_C:2, FILE_D:3, FILE_E:4, FILE_F:5, FILE_G:6, FILE_H:7, FILE_NONE:8 };
var RANKS =  { RANK_1:0, RANK_2:1, RANK_3:2, RANK_4:3, RANK_5:4, RANK_6:5, RANK_7:6, RANK_8:7, RANK_NONE:8 };

var COLOURS = { WHITE:0, BLACK:1, BOTH:2 };

var SQUARES = {
  A1:21, B1:22, C1:23, D1:24, E1:25, F1:26, G1:27, H1:28,  
  A8:91, B8:92, C8:93, D8:94, E8:95, F8:96, G8:97, H8:98, NO_SQ:99, OFFBOARD:100
};

var BOOL = { FALSE:0, TRUE:1 };

var CASTLEBIT = { WKCA : 1, WQCA : 2, BKCA : 4, BQCA : 8 };

var FilesBrd = new Int16Array(BRD_SQ_NUM);
var RanksBrd = new Int16Array(BRD_SQ_NUM);

var Sq120ToSq64 = new Int16Array(BRD_SQ_NUM);
var Sq64ToSq120 = new Int16Array(64);
var BB_PIECE_COUNT = 13;
var brd_bbLo = new Uint32Array(BB_PIECE_COUNT);
var brd_bbHi = new Uint32Array(BB_PIECE_COUNT);
var brd_occLo = new Uint32Array(3);
var brd_occHi = new Uint32Array(3);
var BB_MASK64_LO = new Uint32Array(64);
var BB_MASK64_HI = new Uint32Array(64);
var BB_FILE_MASK_LO = new Uint32Array(8);
var BB_FILE_MASK_HI = new Uint32Array(8);
var BB_RANK_MASK_LO = new Uint32Array(8);
var BB_RANK_MASK_HI = new Uint32Array(8);
var BB_KNIGHT_ATK_LO = new Uint32Array(64);
var BB_KNIGHT_ATK_HI = new Uint32Array(64);
var BB_KING_ATK_LO = new Uint32Array(64);
var BB_KING_ATK_HI = new Uint32Array(64);
var BB_PAWN_FROM_WHITE_LO = new Uint32Array(64);
var BB_PAWN_FROM_WHITE_HI = new Uint32Array(64);
var BB_PAWN_FROM_BLACK_LO = new Uint32Array(64);
var BB_PAWN_FROM_BLACK_HI = new Uint32Array(64);
var BB_RAY_LO = new Uint32Array(8 * 64);
var BB_RAY_HI = new Uint32Array(8 * 64);
var BB_ROOK_MASK_LO = new Uint32Array(64);
var BB_ROOK_MASK_HI = new Uint32Array(64);
var BB_BISHOP_MASK_LO = new Uint32Array(64);
var BB_BISHOP_MASK_HI = new Uint32Array(64);
var BB_ROOK_BITPOS_OFFSET = new Int16Array(64);
var BB_ROOK_BITPOS_COUNT = new Int8Array(64);
var BB_BISHOP_BITPOS_OFFSET = new Int16Array(64);
var BB_BISHOP_BITPOS_COUNT = new Int8Array(64);
var BB_ROOK_ATTACK_OFFSET = new Int32Array(64);
var BB_BISHOP_ATTACK_OFFSET = new Int32Array(64);
var BB_ROOK_BITPOS = null;
var BB_BISHOP_BITPOS = null;
var BB_ROOK_ATTACK_LO = null;
var BB_ROOK_ATTACK_HI = null;
var BB_BISHOP_ATTACK_LO = null;
var BB_BISHOP_ATTACK_HI = null;
var BB_ROOK_MAGIC_LO = new Uint32Array([
	373293216,
	4198400,
	2097280,
	2147747840,
	135172,
	34079744,
	1107301504,
	37781764,
	2149597185,
	2097280,
	2097280,
	2162697,
	262273,
	68157952,
	33554688,
	30848,
	8404992,
	268451873,
	536936465,
	537919498,
	67110913,
	301990912,
	135266817,
	675547265,
	2147517483,
	1074274308,
	1064992,
	1048833,
	2155874304,
	17055760,
	5277730,
	16516,
	2441085155,
	54526544,
	16781376,
	2155874304,
	8390656,
	100665360,
	67147792,
	2181039113,
	1074167840,
	3758194752,
	679608336,
	268501248,
	327696,
	67174402,
	38010896,
	138805251,
	4260096,
	2151678208,
	268470400,
	2450129408,
	16811264,
	33587328,
	268993536,
	142889472,
	1745944641,
	570458186,
	536872977,
	2219835401,
	34078737,
	59780098,
	1485832452,
	4202630
]);

var BB_ROOK_MAGIC_HI = new Uint32Array([
	209715328,
	4194336,
	813697040,
	612372480,
	419432449,
	16777472,
	276832512,
	33555506,
	604012544,
	1081408,
	163856,
	1114128,
	281051144,
	167903240,
	536903808,
	4620289,
	8320,
	136314944,
	268716288,
	269025536,
	2717941888,
	100958592,
	209920,
	262656,
	303087628,
	1048656,
	2097409,
	1073750025,
	262148,
	1224744968,
	270537476,
	268452098,
	33636352,
	17825824,
	6291489,
	4096,
	302284804,
	268566540,
	262418,
	1312321,
	294920,
	2420113536,
	17432640,
	271056928,
	134383617,
	33619976,
	1092724737,
	16516,
	270540928,
	2688614432,
	2290098179,
	1092886592,
	134221832,
	67372032,
	1573122,
	1929404676,
	1610907648,
	268501008,
	540932,
	268763296,
	65540,
	131096,
	547365384,
	873464837
]);

var BB_ROOK_MAGIC_SHIFT32 = new Int8Array([
	20,
	21,
	21,
	21,
	21,
	21,
	21,
	20,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	21,
	22,
	22,
	22,
	22,
	22,
	22,
	21,
	20,
	21,
	21,
	21,
	21,
	21,
	21,
	20
]);

var BB_BISHOP_MAGIC_LO = new Uint32Array([
	8650816,
	67717184,
	25297152,
	737282,
	88084992,
	143888392,
	272646148,
	269617281,
	1090650628,
	10551360,
	68354560,
	1090519040,
	268468736,
	34603520,
	138545152,
	102305922,
	67174946,
	269517060,
	67371141,
	541168193,
	10485760,
	8422400,
	405013520,
	2214660096,
	2986479648,
	537002112,
	68420736,
	67182594,
	1064964,
	940118016,
	176443426,
	270606592,
	2290356224,
	131616,
	75629568,
	168034560,
	1050632,
	570691584,
	270464,
	1078070336,
	352389122,
	142610432,
	33558544,
	1090521093,
	151024128,
	33637441,
	168821329,
	1108346112,
	1612972032,
	67403776,
	218398853,
	579342416,
	2198077960,
	566362248,
	14713120,
	2315289600,
	201474052,
	33689604,
	2152204291,
	8655112,
	136349760,
	2684420352,
	1342308486,
	140902912
]);

var BB_BISHOP_MAGIC_HI = new Uint32Array([
	18874692,
	269486338,
	4722852,
	285739089,
	16908816,
	134349072,
	67841,
	2363652,
	1074071840,
	270573576,
	42484737,
	270608,
	8390162,
	37749008,
	1342211074,
	3758379076,
	2098496,
	360528,
	7471105,
	17302020,
	50365452,
	621871138,
	2113538,
	33565824,
	2150899745,
	526592,
	1082277952,
	1312768,
	65792,
	134479936,
	557314,
	134481152,
	133440,
	1082673192,
	269223972,
	16794625,
	262402,
	263168,
	73924865,
	134353416,
	530520,
	17601680,
	33556548,
	2281704193,
	33620512,
	272695816,
	272928770,
	135529242,
	2701198358,
	1075906648,
	1140851202,
	537919520,
	134742024,
	2147622916,
	52436996,
	1082429440,
	1207964804,
	16781348,
	1342341376,
	1242596096,
	2147492864,
	273154064,
	1142988802,
	1057793
]);

var BB_BISHOP_MAGIC_SHIFT32 = new Int8Array([
	26,
	27,
	27,
	27,
	27,
	27,
	27,
	26,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	25,
	25,
	25,
	25,
	27,
	27,
	27,
	27,
	25,
	23,
	23,
	25,
	27,
	27,
	27,
	27,
	25,
	23,
	23,
	25,
	27,
	27,
	27,
	27,
	25,
	25,
	25,
	25,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	27,
	26,
	27,
	27,
	27,
	27,
	27,
	27,
	26
]);

var BB_DIR_N = 0;
var BB_DIR_S = 1;
var BB_DIR_E = 2;
var BB_DIR_W = 3;
var BB_DIR_NE = 4;
var BB_DIR_NW = 5;
var BB_DIR_SE = 6;
var BB_DIR_SW = 7;
var BB_FILE_A_LO = 0 >>> 0;
var BB_FILE_A_HI = 0 >>> 0;
var BB_FILE_H_LO = 0 >>> 0;
var BB_FILE_H_HI = 0 >>> 0;
var BB_FILE_AB_LO = 0 >>> 0;
var BB_FILE_AB_HI = 0 >>> 0;
var BB_FILE_GH_LO = 0 >>> 0;
var BB_FILE_GH_HI = 0 >>> 0;
var BB_NOT_FILE_A_LO = 0 >>> 0;
var BB_NOT_FILE_A_HI = 0 >>> 0;
var BB_NOT_FILE_H_LO = 0 >>> 0;
var BB_NOT_FILE_H_HI = 0 >>> 0;
var BB_NOT_FILE_AB_LO = 0 >>> 0;
var BB_NOT_FILE_AB_HI = 0 >>> 0;
var BB_NOT_FILE_GH_LO = 0 >>> 0;
var BB_NOT_FILE_GH_HI = 0 >>> 0;
var BB_RANK_1_LO = 0 >>> 0;
var BB_RANK_1_HI = 0 >>> 0;
var BB_RANK_2_LO = 0 >>> 0;
var BB_RANK_2_HI = 0 >>> 0;
var BB_RANK_3_LO = 0 >>> 0;
var BB_RANK_3_HI = 0 >>> 0;
var BB_RANK_4_LO = 0 >>> 0;
var BB_RANK_4_HI = 0 >>> 0;
var BB_RANK_5_LO = 0 >>> 0;
var BB_RANK_5_HI = 0 >>> 0;
var BB_RANK_6_LO = 0 >>> 0;
var BB_RANK_6_HI = 0 >>> 0;
var BB_RANK_7_LO = 0 >>> 0;
var BB_RANK_7_HI = 0 >>> 0;
var BB_RANK_8_LO = 0 >>> 0;
var BB_RANK_8_HI = 0 >>> 0;
var BB_TABLES_READY = false;

var PceChar = ".PNBRQKpnbrqk";
var SideChar = "wb-";
var RankChar = "12345678";
var FileChar = "abcdefgh";

var PieceBig = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE ]);
var PieceMaj = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE ]);
var PieceMin = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ]);
var PieceVal= new Int32Array([ 0, 100, 325, 325, 550, 1000, 50000, 100, 325, 325, 550, 1000, 50000  ]);
var PieceCol = new Int8Array([ COLOURS.BOTH, COLOURS.WHITE, COLOURS.WHITE, COLOURS.WHITE, COLOURS.WHITE, COLOURS.WHITE, COLOURS.WHITE,
	COLOURS.BLACK, COLOURS.BLACK, COLOURS.BLACK, COLOURS.BLACK, COLOURS.BLACK, COLOURS.BLACK ]);
	
var PiecePawn = new Int8Array([ BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ]);	
var PieceKnight = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ]);
var PieceKing = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE ]);
var PieceRookQueen = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE ]);
var PieceBishopQueen = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE ]);
var PieceSlides = new Int8Array([ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE ]);
var PiecePhase = new Int8Array([ 0, 0, 1, 1, 2, 4, 0, 0, 1, 1, 2, 4, 0 ]);

function PiecePhaseValue(pce) {
	if(pce >= PIECES.wP && pce <= PIECES.bK) {
		return PiecePhase[pce];
	}
	return 0;
}

var KnDir = new Int8Array([ -8, -19,	-21, -12, 8, 19, 21, 12 ]);
var RkDir = new Int8Array([ -1, -10,	1, 10 ]);
var BiDir = new Int8Array([ -9, -11, 11, 9 ]);
var KiDir = new Int8Array([ -1, -10,	1, 10, -9, -11, 11, 9 ]);

var KnAttacks = new Int16Array(BRD_SQ_NUM * 8);
var KnAttackCount = new Int8Array(BRD_SQ_NUM);
var KiAttacks = new Int16Array(BRD_SQ_NUM * 8);
var KiAttackCount = new Int8Array(BRD_SQ_NUM);
var KingDistance64 = new Int8Array(64 * 64);

var DirNum = new Int8Array([ 0, 0, 8, 4, 4, 8, 8, 0, 8, 4, 4, 8, 8 ]);
var PceDir = [0, 0, KnDir, BiDir, RkDir, KiDir, KiDir, 0, KnDir, BiDir, RkDir, KiDir, KiDir ];
var PceDirFlat = new Int8Array(13 * 8);
var LoopSlidePce = new Int8Array([ PIECES.wB, PIECES.wR, PIECES.wQ, 0, PIECES.bB, PIECES.bR, PIECES.bQ, 0 ]);
var LoopNonSlidePce = new Int8Array([ PIECES.wN, PIECES.wK, 0, PIECES.bN, PIECES.bK, 0 ]);
var LoopSlideIndex = [ 0, 4 ];
var LoopNonSlideIndex = [ 0, 3 ];
var Kings = [PIECES.wK, PIECES.bK];

var PieceKeys = new Uint32Array(14 * 120);
var PieceKeysHi = new Uint32Array(14 * 120);
var SideKey = 0 >>> 0;
var SideKeyHi = 0 >>> 0;
var CastleKeys = new Uint32Array(16);
var CastleKeysHi = new Uint32Array(16);

var Mirror64 = new Int8Array([
56	,	57	,	58	,	59	,	60	,	61	,	62	,	63	,
48	,	49	,	50	,	51	,	52	,	53	,	54	,	55	,
40	,	41	,	42	,	43	,	44	,	45	,	46	,	47	,
32	,	33	,	34	,	35	,	36	,	37	,	38	,	39	,
24	,	25	,	26	,	27	,	28	,	29	,	30	,	31	,
16	,	17	,	18	,	19	,	20	,	21	,	22	,	23	,
8	,	9	,	10	,	11	,	12	,	13	,	14	,	15	,
0	,	1	,	2	,	3	,	4	,	5	,	6	,	7
]);

var CastlePerm = new Int8Array([
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 13, 15, 15, 15, 12, 15, 15, 14, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15,  7, 15, 15, 15,  3, 15, 15, 11, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15
]);



function FROMSQ(m) { return (m & 0x7F); }
function TOSQ(m)  { return (((m)>>7) & 0x7F); }
function CAPTURED(m)  { return (((m)>>14) & 0xF); }
function PROMOTED(m)  { return (((m)>>20) & 0xF); }

var MFLAGEP = 0x40000
var MFLAGPS = 0x80000
var MFLAGCA = 0x1000000

var MFLAGCAP = 0x7C000
var MFLAGPROM = 0xF00000

var NOMOVE = 0

var PVENTRIES = 10000;

var DEBUG_LOGS = false;

var SearchProgressCallback = null;
var ContinuousAnalysisState = { token: 0 };
var BackgroundEvalState = { token: 0, timer: null, lastFen: "", lastEvalAt: 0, running: false };
var EvalBarPulseState = { timer: null };
var EvalBarRenderState = { fillPercent: -1, text: "", horizontal: null };
var EvalOverrideState = { fenKey: "", score: 0, side: COLOURS.WHITE, depth: 0 };

var EVALCACHE_SIZE = 1 << 16;
var EVALCACHE_MASK = EVALCACHE_SIZE - 1;
var EVALCACHE_KEY = new Uint32Array(EVALCACHE_SIZE);
var EVALCACHE_KEY_HI = new Uint32Array(EVALCACHE_SIZE);
var EVALCACHE_SCORE = new Int32Array(EVALCACHE_SIZE);

function DebugLog() {
	if(DEBUG_LOGS !== true) return;
	if(typeof console === "undefined" || typeof console.log !== "function") return;
	console.log.apply(console, arguments);
}

function StrTrim(value) {
	if(typeof value === "string") return value.trim();
	if(value === null || typeof value === "undefined") return "";
	return String(value).trim();
}

function NowMs() {
	return Date.now ? Date.now() : (new Date()).getTime();
}

function PopCount32(value) {
	value = value >>> 0;
	value = (value - ((value >>> 1) & 0x55555555)) >>> 0;
	value = (((value & 0x33333333) + ((value >>> 2) & 0x33333333)) >>> 0);
	value = (((value + (value >>> 4)) & 0x0F0F0F0F) >>> 0);
	return (Math.imul(value, 0x01010101) >>> 24) | 0;
}

function PopCount64(lo, hi) {
	return (PopCount32(lo) + PopCount32(hi)) | 0;
}

function BBLsbIndex64(lo, hi) {
	lo = lo >>> 0;
	hi = hi >>> 0;
	if(lo !== 0) {
		var lsb = (lo & (-lo)) >>> 0;
		return (31 - Math.clz32(lsb)) | 0;
	}
	var lsbHi = (hi & (-hi)) >>> 0;
	return (32 + (31 - Math.clz32(lsbHi))) | 0;
}

function BBMsbIndex64(lo, hi) {
	lo = lo >>> 0;
	hi = hi >>> 0;
	if(hi !== 0) {
		return (63 - Math.clz32(hi)) | 0;
	}
	return (31 - Math.clz32(lo)) | 0;
}

function BBShiftNorthLo(lo) {
	return (lo << 8) >>> 0;
}

function BBShiftNorthHi(lo, hi) {
	return ((hi << 8) | (lo >>> 24)) >>> 0;
}

function BBShiftSouthLo(lo, hi) {
	return ((lo >>> 8) | (hi << 24)) >>> 0;
}

function BBShiftSouthHi(hi) {
	return (hi >>> 8) >>> 0;
}

function BBShiftLeft7Lo(lo) {
	return (lo << 7) >>> 0;
}

function BBShiftLeft7Hi(lo, hi) {
	return ((hi << 7) | (lo >>> 25)) >>> 0;
}

function BBShiftLeft9Lo(lo) {
	return (lo << 9) >>> 0;
}

function BBShiftLeft9Hi(lo, hi) {
	return ((hi << 9) | (lo >>> 23)) >>> 0;
}

function BBShiftRight7Lo(lo, hi) {
	return ((lo >>> 7) | (hi << 25)) >>> 0;
}

function BBShiftRight7Hi(hi) {
	return (hi >>> 7) >>> 0;
}

function BBShiftRight9Lo(lo, hi) {
	return ((lo >>> 9) | (hi << 23)) >>> 0;
}

function BBShiftRight9Hi(hi) {
	return (hi >>> 9) >>> 0;
}

function BBOrSquare(arrLo, arrHi, idx, sq64) {
	if((sq64 | 0) < 32) {
		arrLo[idx] = (arrLo[idx] | ((1 << sq64) >>> 0)) >>> 0;
	} else {
		arrHi[idx] = (arrHi[idx] | ((1 << (sq64 - 32)) >>> 0)) >>> 0;
	}
}

var BB_WORK_LO = 0 >>> 0;
var BB_WORK_HI = 0 >>> 0;

function BBComputeRookAttacksOcc(sq64, occLo, occHi) {
	var file = sq64 & 7;
	var rank = sq64 >> 3;
	var atkLo = 0 >>> 0;
	var atkHi = 0 >>> 0;
	var toSq = 0;
	var maskLo = 0;
	var maskHi = 0;
	var r;
	var f;

	for(r = rank + 1; r <= 7; ++r) {
		toSq = (r << 3) + file;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(r = rank - 1; r >= 0; --r) {
		toSq = (r << 3) + file;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(f = file + 1; f <= 7; ++f) {
		toSq = (rank << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(f = file - 1; f >= 0; --f) {
		toSq = (rank << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}

	BB_WORK_LO = atkLo >>> 0;
	BB_WORK_HI = atkHi >>> 0;
}

function BBComputeBishopAttacksOcc(sq64, occLo, occHi) {
	var file = sq64 & 7;
	var rank = sq64 >> 3;
	var atkLo = 0 >>> 0;
	var atkHi = 0 >>> 0;
	var toSq = 0;
	var maskLo = 0;
	var maskHi = 0;
	var r;
	var f;

	for(f = file + 1, r = rank + 1; f <= 7 && r <= 7; ++f, ++r) {
		toSq = (r << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(f = file - 1, r = rank + 1; f >= 0 && r <= 7; --f, ++r) {
		toSq = (r << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(f = file + 1, r = rank - 1; f <= 7 && r >= 0; ++f, --r) {
		toSq = (r << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}
	for(f = file - 1, r = rank - 1; f >= 0 && r >= 0; --f, --r) {
		toSq = (r << 3) + f;
		maskLo = BB_MASK64_LO[toSq];
		maskHi = BB_MASK64_HI[toSq];
		atkLo = (atkLo | maskLo) >>> 0;
		atkHi = (atkHi | maskHi) >>> 0;
		if(((occLo & maskLo) | (occHi & maskHi)) !== 0) break;
	}

	BB_WORK_LO = atkLo >>> 0;
	BB_WORK_HI = atkHi >>> 0;
}

function BBInitSliderMasks() {
	BB_ROOK_MASK_LO.fill(0);
	BB_ROOK_MASK_HI.fill(0);
	BB_BISHOP_MASK_LO.fill(0);
	BB_BISHOP_MASK_HI.fill(0);

	for(var sq64 = 0; sq64 < 64; ++sq64) {
		var file = sq64 & 7;
		var rank = sq64 >> 3;
		var lo = 0 >>> 0;
		var hi = 0 >>> 0;
		var f;
		var r;
		var sq;

		for(r = rank + 1; r <= 6; ++r) {
			sq = (r << 3) + file;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(r = rank - 1; r >= 1; --r) {
			sq = (r << 3) + file;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(f = file + 1; f <= 6; ++f) {
			sq = (rank << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(f = file - 1; f >= 1; --f) {
			sq = (rank << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		BB_ROOK_MASK_LO[sq64] = lo >>> 0;
		BB_ROOK_MASK_HI[sq64] = hi >>> 0;

		lo = 0 >>> 0;
		hi = 0 >>> 0;
		for(f = file + 1, r = rank + 1; f <= 6 && r <= 6; ++f, ++r) {
			sq = (r << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(f = file - 1, r = rank + 1; f >= 1 && r <= 6; --f, ++r) {
			sq = (r << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(f = file + 1, r = rank - 1; f <= 6 && r >= 1; ++f, --r) {
			sq = (r << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		for(f = file - 1, r = rank - 1; f >= 1 && r >= 1; --f, --r) {
			sq = (r << 3) + f;
			lo = (lo | BB_MASK64_LO[sq]) >>> 0;
			hi = (hi | BB_MASK64_HI[sq]) >>> 0;
		}
		BB_BISHOP_MASK_LO[sq64] = lo >>> 0;
		BB_BISHOP_MASK_HI[sq64] = hi >>> 0;
	}
}

function Mul32HiUnsigned(a, b) {
	a = a >>> 0;
	b = b >>> 0;
	var a0 = a & 0xFFFF;
	var a1 = a >>> 16;
	var b0 = b & 0xFFFF;
	var b1 = b >>> 16;
	var c0 = Math.imul(a0, b0) >>> 0;
	var t = (Math.imul(a1, b0) + (c0 >>> 16)) >>> 0;
	var u = (Math.imul(a0, b1) + (t & 0xFFFF)) >>> 0;
	return (Math.imul(a1, b1) + (t >>> 16) + (u >>> 16)) >>> 0;
}

function BBMul64HighWord(aLo, aHi, bLo, bHi) {
	aLo = aLo >>> 0;
	aHi = aHi >>> 0;
	bLo = bLo >>> 0;
	bHi = bHi >>> 0;
	var loHi = Mul32HiUnsigned(aLo, bLo);
	return (loHi + (Math.imul(aLo, bHi) >>> 0) + (Math.imul(aHi, bLo) >>> 0)) >>> 0;
}

function BBRookMagicIndexFromOcc(sq64, occLo, occHi) {
	var maskedLo = (occLo & BB_ROOK_MASK_LO[sq64]) >>> 0;
	var maskedHi = (occHi & BB_ROOK_MASK_HI[sq64]) >>> 0;
	var hashHi = BBMul64HighWord(maskedLo, maskedHi, BB_ROOK_MAGIC_LO[sq64], BB_ROOK_MAGIC_HI[sq64]);
	return (hashHi >>> BB_ROOK_MAGIC_SHIFT32[sq64]) >>> 0;
}

function BBBishopMagicIndexFromOcc(sq64, occLo, occHi) {
	var maskedLo = (occLo & BB_BISHOP_MASK_LO[sq64]) >>> 0;
	var maskedHi = (occHi & BB_BISHOP_MASK_HI[sq64]) >>> 0;
	var hashHi = BBMul64HighWord(maskedLo, maskedHi, BB_BISHOP_MAGIC_LO[sq64], BB_BISHOP_MAGIC_HI[sq64]);
	return (hashHi >>> BB_BISHOP_MAGIC_SHIFT32[sq64]) >>> 0;
}

function BBInitSliderAttackTables() {
	BBInitSliderMasks();

	var rookBits = [];
	var bishopBits = [];
	var rookTableSize = 0;
	var bishopTableSize = 0;

	for(var sq64 = 0; sq64 < 64; ++sq64) {
		var maskLo = BB_ROOK_MASK_LO[sq64] >>> 0;
		var maskHi = BB_ROOK_MASK_HI[sq64] >>> 0;
		BB_ROOK_BITPOS_OFFSET[sq64] = rookBits.length;
		var rookCount = 0;
		while(maskLo !== 0 || maskHi !== 0) {
			var bitSq = BBLsbIndex64(maskLo, maskHi);
			rookBits.push(bitSq);
			rookCount++;
			if(bitSq < 32) {
				maskLo = (maskLo & (maskLo - 1)) >>> 0;
			} else {
				maskHi = (maskHi & (maskHi - 1)) >>> 0;
			}
		}
		BB_ROOK_BITPOS_COUNT[sq64] = rookCount;
		BB_ROOK_ATTACK_OFFSET[sq64] = rookTableSize;
		rookTableSize += (1 << rookCount);

		maskLo = BB_BISHOP_MASK_LO[sq64] >>> 0;
		maskHi = BB_BISHOP_MASK_HI[sq64] >>> 0;
		BB_BISHOP_BITPOS_OFFSET[sq64] = bishopBits.length;
		var bishopCount = 0;
		while(maskLo !== 0 || maskHi !== 0) {
			bitSq = BBLsbIndex64(maskLo, maskHi);
			bishopBits.push(bitSq);
			bishopCount++;
			if(bitSq < 32) {
				maskLo = (maskLo & (maskLo - 1)) >>> 0;
			} else {
				maskHi = (maskHi & (maskHi - 1)) >>> 0;
			}
		}
		BB_BISHOP_BITPOS_COUNT[sq64] = bishopCount;
		BB_BISHOP_ATTACK_OFFSET[sq64] = bishopTableSize;
		bishopTableSize += (1 << bishopCount);
	}

	BB_ROOK_BITPOS = new Int8Array(rookBits);
	BB_BISHOP_BITPOS = new Int8Array(bishopBits);
	BB_ROOK_ATTACK_LO = new Uint32Array(rookTableSize);
	BB_ROOK_ATTACK_HI = new Uint32Array(rookTableSize);
	BB_BISHOP_ATTACK_LO = new Uint32Array(bishopTableSize);
	BB_BISHOP_ATTACK_HI = new Uint32Array(bishopTableSize);

	for(sq64 = 0; sq64 < 64; ++sq64) {
		var rookBitOffset = BB_ROOK_BITPOS_OFFSET[sq64] | 0;
		var rookBitCount = BB_ROOK_BITPOS_COUNT[sq64] | 0;
		var rookSubsetCount = (1 << rookBitCount);
		var rookAttackOffset = BB_ROOK_ATTACK_OFFSET[sq64] | 0;
		var rookFilled = new Int8Array(rookSubsetCount);
		for(var occIdx = 0; occIdx < rookSubsetCount; ++occIdx) {
			var occLo = 0 >>> 0;
			var occHi = 0 >>> 0;
			for(var bit = 0; bit < rookBitCount; ++bit) {
				if((occIdx & (1 << bit)) === 0) continue;
				var occSq = BB_ROOK_BITPOS[rookBitOffset + bit] | 0;
				occLo = (occLo | BB_MASK64_LO[occSq]) >>> 0;
				occHi = (occHi | BB_MASK64_HI[occSq]) >>> 0;
			}
			var rookMagicIdx = BBRookMagicIndexFromOcc(sq64, occLo, occHi) | 0;
			var rookWriteIdx = (rookAttackOffset + rookMagicIdx) | 0;
			BBComputeRookAttacksOcc(sq64, occLo, occHi);
			var rookAtkLo = BB_WORK_LO >>> 0;
			var rookAtkHi = BB_WORK_HI >>> 0;
			if(rookFilled[rookMagicIdx] !== 0) {
				if(BB_ROOK_ATTACK_LO[rookWriteIdx] !== rookAtkLo || BB_ROOK_ATTACK_HI[rookWriteIdx] !== rookAtkHi) {
					throw new Error("Rook magic collision sq64=" + sq64 + " idx=" + rookMagicIdx);
				}
				continue;
			}
			rookFilled[rookMagicIdx] = 1;
			BB_ROOK_ATTACK_LO[rookWriteIdx] = rookAtkLo;
			BB_ROOK_ATTACK_HI[rookWriteIdx] = rookAtkHi;
		}

		var bishopBitOffset = BB_BISHOP_BITPOS_OFFSET[sq64] | 0;
		var bishopBitCount = BB_BISHOP_BITPOS_COUNT[sq64] | 0;
		var bishopSubsetCount = (1 << bishopBitCount);
		var bishopAttackOffset = BB_BISHOP_ATTACK_OFFSET[sq64] | 0;
		var bishopFilled = new Int8Array(bishopSubsetCount);
		for(occIdx = 0; occIdx < bishopSubsetCount; ++occIdx) {
			occLo = 0 >>> 0;
			occHi = 0 >>> 0;
			for(bit = 0; bit < bishopBitCount; ++bit) {
				if((occIdx & (1 << bit)) === 0) continue;
				occSq = BB_BISHOP_BITPOS[bishopBitOffset + bit] | 0;
				occLo = (occLo | BB_MASK64_LO[occSq]) >>> 0;
				occHi = (occHi | BB_MASK64_HI[occSq]) >>> 0;
			}
			var bishopMagicIdx = BBBishopMagicIndexFromOcc(sq64, occLo, occHi) | 0;
			var bishopWriteIdx = (bishopAttackOffset + bishopMagicIdx) | 0;
			BBComputeBishopAttacksOcc(sq64, occLo, occHi);
			var bishopAtkLo = BB_WORK_LO >>> 0;
			var bishopAtkHi = BB_WORK_HI >>> 0;
			if(bishopFilled[bishopMagicIdx] !== 0) {
				if(BB_BISHOP_ATTACK_LO[bishopWriteIdx] !== bishopAtkLo || BB_BISHOP_ATTACK_HI[bishopWriteIdx] !== bishopAtkHi) {
					throw new Error("Bishop magic collision sq64=" + sq64 + " idx=" + bishopMagicIdx);
				}
				continue;
			}
			bishopFilled[bishopMagicIdx] = 1;
			BB_BISHOP_ATTACK_LO[bishopWriteIdx] = bishopAtkLo;
			BB_BISHOP_ATTACK_HI[bishopWriteIdx] = bishopAtkHi;
		}
	}
}

function BBRookAttackTableIndex(sq64, occLo, occHi) {
	var idx = BBRookMagicIndexFromOcc(sq64, occLo, occHi);
	return (BB_ROOK_ATTACK_OFFSET[sq64] + idx) | 0;
}

function BBBishopAttackTableIndex(sq64, occLo, occHi) {
	var idx = BBBishopMagicIndexFromOcc(sq64, occLo, occHi);
	return (BB_BISHOP_ATTACK_OFFSET[sq64] + idx) | 0;
}

function InitBitboardTables() {
	BB_MASK64_LO.fill(0);
	BB_MASK64_HI.fill(0);
	BB_FILE_MASK_LO.fill(0);
	BB_FILE_MASK_HI.fill(0);
	BB_RANK_MASK_LO.fill(0);
	BB_RANK_MASK_HI.fill(0);
	BB_KNIGHT_ATK_LO.fill(0);
	BB_KNIGHT_ATK_HI.fill(0);
	BB_KING_ATK_LO.fill(0);
	BB_KING_ATK_HI.fill(0);
	BB_PAWN_FROM_WHITE_LO.fill(0);
	BB_PAWN_FROM_WHITE_HI.fill(0);
	BB_PAWN_FROM_BLACK_LO.fill(0);
	BB_PAWN_FROM_BLACK_HI.fill(0);
	BB_RAY_LO.fill(0);
	BB_RAY_HI.fill(0);

	var sq64;
	var file;
	var rank;
	for(sq64 = 0; sq64 < 64; ++sq64) {
		file = sq64 & 7;
		rank = sq64 >> 3;
		BBOrSquare(BB_MASK64_LO, BB_MASK64_HI, sq64, sq64);
		BBOrSquare(BB_FILE_MASK_LO, BB_FILE_MASK_HI, file, sq64);
		BBOrSquare(BB_RANK_MASK_LO, BB_RANK_MASK_HI, rank, sq64);
	}

	BB_FILE_A_LO = BB_FILE_MASK_LO[FILES.FILE_A] >>> 0;
	BB_FILE_A_HI = BB_FILE_MASK_HI[FILES.FILE_A] >>> 0;
	BB_FILE_H_LO = BB_FILE_MASK_LO[FILES.FILE_H] >>> 0;
	BB_FILE_H_HI = BB_FILE_MASK_HI[FILES.FILE_H] >>> 0;
	BB_FILE_AB_LO = (BB_FILE_MASK_LO[FILES.FILE_A] | BB_FILE_MASK_LO[FILES.FILE_B]) >>> 0;
	BB_FILE_AB_HI = (BB_FILE_MASK_HI[FILES.FILE_A] | BB_FILE_MASK_HI[FILES.FILE_B]) >>> 0;
	BB_FILE_GH_LO = (BB_FILE_MASK_LO[FILES.FILE_G] | BB_FILE_MASK_LO[FILES.FILE_H]) >>> 0;
	BB_FILE_GH_HI = (BB_FILE_MASK_HI[FILES.FILE_G] | BB_FILE_MASK_HI[FILES.FILE_H]) >>> 0;
	BB_NOT_FILE_A_LO = (~BB_FILE_A_LO) >>> 0;
	BB_NOT_FILE_A_HI = (~BB_FILE_A_HI) >>> 0;
	BB_NOT_FILE_H_LO = (~BB_FILE_H_LO) >>> 0;
	BB_NOT_FILE_H_HI = (~BB_FILE_H_HI) >>> 0;
	BB_NOT_FILE_AB_LO = (~BB_FILE_AB_LO) >>> 0;
	BB_NOT_FILE_AB_HI = (~BB_FILE_AB_HI) >>> 0;
	BB_NOT_FILE_GH_LO = (~BB_FILE_GH_LO) >>> 0;
	BB_NOT_FILE_GH_HI = (~BB_FILE_GH_HI) >>> 0;

	BB_RANK_1_LO = BB_RANK_MASK_LO[RANKS.RANK_1] >>> 0;
	BB_RANK_1_HI = BB_RANK_MASK_HI[RANKS.RANK_1] >>> 0;
	BB_RANK_2_LO = BB_RANK_MASK_LO[RANKS.RANK_2] >>> 0;
	BB_RANK_2_HI = BB_RANK_MASK_HI[RANKS.RANK_2] >>> 0;
	BB_RANK_3_LO = BB_RANK_MASK_LO[RANKS.RANK_3] >>> 0;
	BB_RANK_3_HI = BB_RANK_MASK_HI[RANKS.RANK_3] >>> 0;
	BB_RANK_4_LO = BB_RANK_MASK_LO[RANKS.RANK_4] >>> 0;
	BB_RANK_4_HI = BB_RANK_MASK_HI[RANKS.RANK_4] >>> 0;
	BB_RANK_5_LO = BB_RANK_MASK_LO[RANKS.RANK_5] >>> 0;
	BB_RANK_5_HI = BB_RANK_MASK_HI[RANKS.RANK_5] >>> 0;
	BB_RANK_6_LO = BB_RANK_MASK_LO[RANKS.RANK_6] >>> 0;
	BB_RANK_6_HI = BB_RANK_MASK_HI[RANKS.RANK_6] >>> 0;
	BB_RANK_7_LO = BB_RANK_MASK_LO[RANKS.RANK_7] >>> 0;
	BB_RANK_7_HI = BB_RANK_MASK_HI[RANKS.RANK_7] >>> 0;
	BB_RANK_8_LO = BB_RANK_MASK_LO[RANKS.RANK_8] >>> 0;
	BB_RANK_8_HI = BB_RANK_MASK_HI[RANKS.RANK_8] >>> 0;

	for(sq64 = 0; sq64 < 64; ++sq64) {
		file = sq64 & 7;
		rank = sq64 >> 3;
		if(file > 0 && rank > 1) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 - 17);
		if(file < 7 && rank > 1) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 - 15);
		if(file > 1 && rank > 0) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 - 10);
		if(file < 6 && rank > 0) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 - 6);
		if(file > 1 && rank < 7) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 + 6);
		if(file < 6 && rank < 7) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 + 10);
		if(file > 0 && rank < 6) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 + 15);
		if(file < 7 && rank < 6) BBOrSquare(BB_KNIGHT_ATK_LO, BB_KNIGHT_ATK_HI, sq64, sq64 + 17);

		if(file > 0) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 - 1);
		if(file < 7) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 + 1);
		if(rank > 0) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 - 8);
		if(rank < 7) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 + 8);
		if(file > 0 && rank > 0) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 - 9);
		if(file < 7 && rank > 0) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 - 7);
		if(file > 0 && rank < 7) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 + 7);
		if(file < 7 && rank < 7) BBOrSquare(BB_KING_ATK_LO, BB_KING_ATK_HI, sq64, sq64 + 9);

		if(file > 0 && rank > 0) BBOrSquare(BB_PAWN_FROM_WHITE_LO, BB_PAWN_FROM_WHITE_HI, sq64, sq64 - 9);
		if(file < 7 && rank > 0) BBOrSquare(BB_PAWN_FROM_WHITE_LO, BB_PAWN_FROM_WHITE_HI, sq64, sq64 - 7);
		if(file > 0 && rank < 7) BBOrSquare(BB_PAWN_FROM_BLACK_LO, BB_PAWN_FROM_BLACK_HI, sq64, sq64 + 7);
		if(file < 7 && rank < 7) BBOrSquare(BB_PAWN_FROM_BLACK_LO, BB_PAWN_FROM_BLACK_HI, sq64, sq64 + 9);
	}

	var rayDirsFile = new Int8Array([ 0, 0, 1, -1, 1, -1, 1, -1 ]);
	var rayDirsRank = new Int8Array([ 1, -1, 0, 0, 1, 1, -1, -1 ]);
	for(var dir = 0; dir < 8; ++dir) {
		for(sq64 = 0; sq64 < 64; ++sq64) {
			file = sq64 & 7;
			rank = sq64 >> 3;
			var f = file + rayDirsFile[dir];
			var r = rank + rayDirsRank[dir];
			var idx = (dir << 6) + sq64;
			while(f >= 0 && f < 8 && r >= 0 && r < 8) {
				BBOrSquare(BB_RAY_LO, BB_RAY_HI, idx, (r << 3) + f);
				f += rayDirsFile[dir];
				r += rayDirsRank[dir];
			}
		}
	}

	BBInitSliderAttackTables();
	BB_TABLES_READY = true;
}

function BBClearAll() {
	brd_bbLo.fill(0);
	brd_bbHi.fill(0);
	brd_occLo.fill(0);
	brd_occHi.fill(0);
}

function BBAddPieceSquare(pce, sq120) {
	var sq64 = Sq120ToSq64[sq120];
	if(sq64 < 0 || sq64 > 63) return;
	var maskLo = BB_MASK64_LO[sq64];
	var maskHi = BB_MASK64_HI[sq64];
	var col = PieceCol[pce];
	brd_bbLo[pce] = (brd_bbLo[pce] | maskLo) >>> 0;
	brd_bbHi[pce] = (brd_bbHi[pce] | maskHi) >>> 0;
	brd_occLo[col] = (brd_occLo[col] | maskLo) >>> 0;
	brd_occHi[col] = (brd_occHi[col] | maskHi) >>> 0;
	brd_occLo[COLOURS.BOTH] = (brd_occLo[COLOURS.BOTH] | maskLo) >>> 0;
	brd_occHi[COLOURS.BOTH] = (brd_occHi[COLOURS.BOTH] | maskHi) >>> 0;
}

function BBRemovePieceSquare(pce, sq120) {
	var sq64 = Sq120ToSq64[sq120];
	if(sq64 < 0 || sq64 > 63) return;
	var maskLo = BB_MASK64_LO[sq64];
	var maskHi = BB_MASK64_HI[sq64];
	var invLo = (~maskLo) >>> 0;
	var invHi = (~maskHi) >>> 0;
	var col = PieceCol[pce];
	brd_bbLo[pce] = (brd_bbLo[pce] & invLo) >>> 0;
	brd_bbHi[pce] = (brd_bbHi[pce] & invHi) >>> 0;
	brd_occLo[col] = (brd_occLo[col] & invLo) >>> 0;
	brd_occHi[col] = (brd_occHi[col] & invHi) >>> 0;
	brd_occLo[COLOURS.BOTH] = (brd_occLo[COLOURS.BOTH] & invLo) >>> 0;
	brd_occHi[COLOURS.BOTH] = (brd_occHi[COLOURS.BOTH] & invHi) >>> 0;
}

function BBMovePieceSquare(pce, from120, to120) {
	var from64 = Sq120ToSq64[from120];
	var to64 = Sq120ToSq64[to120];
	if(from64 < 0 || from64 > 63 || to64 < 0 || to64 > 63) return;
	var fromLo = BB_MASK64_LO[from64];
	var fromHi = BB_MASK64_HI[from64];
	var toLo = BB_MASK64_LO[to64];
	var toHi = BB_MASK64_HI[to64];
	var invFromLo = (~fromLo) >>> 0;
	var invFromHi = (~fromHi) >>> 0;
	var col = PieceCol[pce];
	brd_bbLo[pce] = ((brd_bbLo[pce] & invFromLo) | toLo) >>> 0;
	brd_bbHi[pce] = ((brd_bbHi[pce] & invFromHi) | toHi) >>> 0;
	brd_occLo[col] = ((brd_occLo[col] & invFromLo) | toLo) >>> 0;
	brd_occHi[col] = ((brd_occHi[col] & invFromHi) | toHi) >>> 0;
	brd_occLo[COLOURS.BOTH] = ((brd_occLo[COLOURS.BOTH] & invFromLo) | toLo) >>> 0;
	brd_occHi[COLOURS.BOTH] = ((brd_occHi[COLOURS.BOTH] & invFromHi) | toHi) >>> 0;
}

function BBRebuildFromBoard() {
	BBClearAll();
	for(var sq64 = 0; sq64 < 64; ++sq64) {
		var sq120 = Sq64ToSq120[sq64];
		var pce = brd_pieces[sq120];
		if(pce != PIECES.EMPTY && pce != SQUARES.OFFBOARD) {
			BBAddPieceSquare(pce, sq120);
		}
	}
}

function BBRayHitsSlider(sq64, dir, useLsb, sliderLo, sliderHi) {
	var idx = (dir << 6) + sq64;
	var blockersLo = (BB_RAY_LO[idx] & brd_occLo[COLOURS.BOTH]) >>> 0;
	var blockersHi = (BB_RAY_HI[idx] & brd_occHi[COLOURS.BOTH]) >>> 0;
	if((blockersLo | blockersHi) === 0) return BOOL.FALSE;
	var blockerSq = useLsb ? BBLsbIndex64(blockersLo, blockersHi) : BBMsbIndex64(blockersLo, blockersHi);
	var maskLo = BB_MASK64_LO[blockerSq];
	var maskHi = BB_MASK64_HI[blockerSq];
	if(((sliderLo & maskLo) | (sliderHi & maskHi)) !== 0) {
		return BOOL.TRUE;
	}
	return BOOL.FALSE;
}



var TT_BUCKETS = 2;
var TT_WORDS_PER_SLOT = 5; // keyLo, keyHi, move, score, packedMeta(depth|flag|gen)
var TT_ENTRY_BYTES = (TT_WORDS_PER_SLOT * 4) * TT_BUCKETS;
var TT_MIN_MB = 16;
var TT_SIZE = 1 << 19;
var TT_MASK = TT_SIZE - 1;
var TT_REQUEST_MB = 8;
var TT_TARGET_MB = 8;
var TT_ALLOC_MB = 8;
var TT_SLOTS = TT_SIZE * TT_BUCKETS;

var TT_KEY_OFS = 0;
var TT_KEY_HI_OFS = 1;
var TT_MOVE_OFS = 2;
var TT_SCORE_OFS = 3;
var TT_META_OFS = 4;

var TT_BUFFER = new ArrayBuffer(TT_SLOTS * TT_WORDS_PER_SLOT * 4);
var TT_U32 = new Uint32Array(TT_BUFFER);
var TT_I32 = new Int32Array(TT_BUFFER);
var TT_CURR_GEN = 1;

var TT_FLAG_ALPHA = 1;
var TT_FLAG_BETA = 2;
var TT_FLAG_EXACT = 3;

function FloorPowerOfTwo(value) {
	var power = 1;
	while((power << 1) > 0 && (power << 1) <= value) {
		power <<= 1;
	}
	return power;
}

function InitTT(targetMb) {
	var requestedMb = parseInt(targetMb, 10);
	if(isNaN(requestedMb) || requestedMb < TT_MIN_MB) {
		requestedMb = TT_MIN_MB;
	}
	TT_REQUEST_MB = requestedMb;

	var trialMb = requestedMb;
	while(trialMb >= TT_MIN_MB) {
		var requestedBytes = trialMb * 1024 * 1024;
		var entries = FloorPowerOfTwo(Math.floor(requestedBytes / TT_ENTRY_BYTES));
		if(entries < 1024) {
			entries = 1024;
		}
		try {
			TT_SIZE = entries;
			TT_MASK = TT_SIZE - 1;
			TT_SLOTS = TT_SIZE * TT_BUCKETS;
			TT_BUFFER = new ArrayBuffer(TT_SLOTS * TT_WORDS_PER_SLOT * 4);
			TT_U32 = new Uint32Array(TT_BUFFER);
			TT_I32 = new Int32Array(TT_BUFFER);
			TT_CURR_GEN = 1;
			TT_TARGET_MB = trialMb;
			TT_ALLOC_MB = Math.max(TT_MIN_MB, Math.round((TT_SIZE * TT_ENTRY_BYTES) / (1024 * 1024)));
			console.log("TT initialized: " + TT_ALLOC_MB + "MB (" + TT_SIZE + " entries)");
			return TT_ALLOC_MB;
		} catch(err) {
			trialMb = Math.floor(trialMb / 2);
		}
	}

	TT_SIZE = 1 << 20;
	TT_MASK = TT_SIZE - 1;
	TT_SLOTS = TT_SIZE * TT_BUCKETS;
	TT_BUFFER = new ArrayBuffer(TT_SLOTS * TT_WORDS_PER_SLOT * 4);
	TT_U32 = new Uint32Array(TT_BUFFER);
	TT_I32 = new Int32Array(TT_BUFFER);
	TT_CURR_GEN = 1;
	TT_REQUEST_MB = TT_MIN_MB;
	TT_TARGET_MB = TT_MIN_MB;
	TT_ALLOC_MB = Math.round((TT_SIZE * TT_ENTRY_BYTES) / (1024 * 1024));
	console.log("TT fallback initialized: " + TT_ALLOC_MB + "MB (" + TT_SIZE + " entries)");
	return TT_ALLOC_MB;
}

function TTClearGenerationTags() {
	var ttU32 = TT_U32;
	for(var idx = TT_META_OFS; idx < ttU32.length; idx = (idx + TT_WORDS_PER_SLOT) | 0) {
		ttU32[idx] = (ttU32[idx] & 0x00FFFFFF) >>> 0;
	}
}

function TTNewSearch() {
	TT_CURR_GEN = (TT_CURR_GEN + 1) & 0xFF;
	if(TT_CURR_GEN == 0) {
		TT_CURR_GEN = 1;
		TTClearGenerationTags();
	}
}

function TTBaseIndex(key) {
	return ((key & TT_MASK) << 1) | 0;
}

function TTScoreToStore(score) {
	if(score > MATE - MAXDEPTH) return score + brd_ply;
	if(score < -MATE + MAXDEPTH) return score - brd_ply;
	return score;
}

function TTScoreFromStore(score) {
	if(score > MATE - MAXDEPTH) return score - brd_ply;
	if(score < -MATE + MAXDEPTH) return score + brd_ply;
	return score;
}

function TTProbeMove() {
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var base = TTBaseIndex(key);
	var ttU32 = TT_U32;
	var ttI32 = TT_I32;
	var off0 = (base * TT_WORDS_PER_SLOT) | 0;
	var bestIdx = -1;
	var bestDepth = -32768;
	if(ttU32[off0 + TT_KEY_OFS] === key && ttU32[off0 + TT_KEY_HI_OFS] === keyHi) {
		bestIdx = base;
		bestDepth = (ttU32[off0 + TT_META_OFS] & 0xFFFF) | 0;
	}
	var idx1 = (base + 1) | 0;
	var off1 = (off0 + TT_WORDS_PER_SLOT) | 0;
	if(ttU32[off1 + TT_KEY_OFS] === key && ttU32[off1 + TT_KEY_HI_OFS] === keyHi) {
		if(((ttU32[off1 + TT_META_OFS] & 0xFFFF) | 0) > bestDepth) {
			bestIdx = idx1;
		}
	}
	if(bestIdx < 0) return NOMOVE;
	return ttI32[((bestIdx * TT_WORDS_PER_SLOT) | 0) + TT_MOVE_OFS] | 0;
}

var TTProbeNodeMove = NOMOVE;
var TTProbeNodeFlag = 0;
var TTProbeNodeDepth = -32768;
var TTProbeNodeScore = 0;

function TTProbeNode(alpha, beta, depth) {
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var base = TTBaseIndex(key);
	var ttU32 = TT_U32;
	var ttI32 = TT_I32;
	var off0 = (base * TT_WORDS_PER_SLOT) | 0;
	var idxMove = -1;
	var idxScore = -1;
	var bestMoveDepth = -32768;
	var bestScoreDepth = -32768;

	TTProbeNodeMove = NOMOVE;
	TTProbeNodeFlag = 0;
	TTProbeNodeDepth = -32768;
	TTProbeNodeScore = 0;

	if(ttU32[off0 + TT_KEY_OFS] === key && ttU32[off0 + TT_KEY_HI_OFS] === keyHi) {
		var meta0 = ttU32[off0 + TT_META_OFS] >>> 0;
		var d0 = (meta0 & 0xFFFF) | 0;
		idxMove = base;
		bestMoveDepth = d0;
		if(d0 >= depth) {
			idxScore = base;
			bestScoreDepth = d0;
		}
	}
	var idx1 = (base + 1) | 0;
	var off1 = (off0 + TT_WORDS_PER_SLOT) | 0;
	if(ttU32[off1 + TT_KEY_OFS] === key && ttU32[off1 + TT_KEY_HI_OFS] === keyHi) {
		var meta1 = ttU32[off1 + TT_META_OFS] >>> 0;
		var d1 = (meta1 & 0xFFFF) | 0;
		if(d1 > bestMoveDepth) {
			idxMove = idx1;
			bestMoveDepth = d1;
		}
		if(d1 >= depth && d1 > bestScoreDepth) {
			idxScore = idx1;
		}
	}

	if(idxMove >= 0) {
		var offMove = (idxMove * TT_WORDS_PER_SLOT) | 0;
		var moveMeta = ttU32[offMove + TT_META_OFS] >>> 0;
		var moveScore = TTScoreFromStore(ttI32[offMove + TT_SCORE_OFS] | 0);
		TTProbeNodeMove = ttI32[offMove + TT_MOVE_OFS] | 0;
		TTProbeNodeFlag = (moveMeta >>> 16) & 0xFF;
		TTProbeNodeDepth = (moveMeta & 0xFFFF) | 0;
		TTProbeNodeScore = moveScore;
		if(idxScore == idxMove) {
			var moveFlag = TTProbeNodeFlag;
			if(moveFlag == TT_FLAG_EXACT) return moveScore;
			if(moveFlag == TT_FLAG_ALPHA && moveScore <= alpha) return alpha;
			if(moveFlag == TT_FLAG_BETA && moveScore >= beta) return beta;
			return null;
		}
	}
	if(idxScore < 0) return null;
	var offScore = (idxScore * TT_WORDS_PER_SLOT) | 0;
	var score = TTScoreFromStore(ttI32[offScore + TT_SCORE_OFS] | 0);
	var flag = (ttU32[offScore + TT_META_OFS] >>> 16) & 0xFF;
	if(flag == TT_FLAG_EXACT) return score;
	if(flag == TT_FLAG_ALPHA && score <= alpha) return alpha;
	if(flag == TT_FLAG_BETA && score >= beta) return beta;
	return null;
}

function TTStore(move, score, depth, flag) {

	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var base = TTBaseIndex(key);
	var storedScore = TTScoreToStore(score);
	var ttU32 = TT_U32;
	var ttI32 = TT_I32;
	var idx0 = base;
	var idx1 = (base + 1) | 0;
	var off0 = (idx0 * TT_WORDS_PER_SLOT) | 0;
	var off1 = (off0 + TT_WORDS_PER_SLOT) | 0;

	if(ttU32[off0 + TT_KEY_OFS] === key && ttU32[off0 + TT_KEY_HI_OFS] === keyHi) {
		var meta0 = ttU32[off0 + TT_META_OFS] >>> 0;
		var oldFlag0 = (meta0 >>> 16) & 0xFF;
		var oldDepth0 = (meta0 & 0xFFFF) | 0;
		var shouldReplace0 = ((meta0 >>> 24) !== TT_CURR_GEN) ||
			(depth > oldDepth0) ||
			(depth == oldDepth0 && flag >= oldFlag0) ||
			(flag == TT_FLAG_EXACT && oldFlag0 != TT_FLAG_EXACT && depth >= (oldDepth0 - 2));
		if(shouldReplace0) {
			ttU32[off0 + TT_META_OFS] = ((depth & 0xFFFF) | ((flag & 0xFF) << 16) | ((TT_CURR_GEN & 0xFF) << 24)) >>> 0;
			ttI32[off0 + TT_SCORE_OFS] = storedScore;
			if(move !== NOMOVE) ttI32[off0 + TT_MOVE_OFS] = move;
		} else if(move !== NOMOVE && ttI32[off0 + TT_MOVE_OFS] === NOMOVE) {
			ttI32[off0 + TT_MOVE_OFS] = move;
		}
		return;
	}

	if(ttU32[off1 + TT_KEY_OFS] === key && ttU32[off1 + TT_KEY_HI_OFS] === keyHi) {
		var meta1 = ttU32[off1 + TT_META_OFS] >>> 0;
		var oldFlag1 = (meta1 >>> 16) & 0xFF;
		var oldDepth1 = (meta1 & 0xFFFF) | 0;
		var shouldReplace1 = ((meta1 >>> 24) !== TT_CURR_GEN) ||
			(depth > oldDepth1) ||
			(depth == oldDepth1 && flag >= oldFlag1) ||
			(flag == TT_FLAG_EXACT && oldFlag1 != TT_FLAG_EXACT && depth >= (oldDepth1 - 2));
		if(shouldReplace1) {
			ttU32[off1 + TT_META_OFS] = ((depth & 0xFFFF) | ((flag & 0xFF) << 16) | ((TT_CURR_GEN & 0xFF) << 24)) >>> 0;
			ttI32[off1 + TT_SCORE_OFS] = storedScore;
			if(move !== NOMOVE) ttI32[off1 + TT_MOVE_OFS] = move;
		} else if(move !== NOMOVE && ttI32[off1 + TT_MOVE_OFS] === NOMOVE) {
			ttI32[off1 + TT_MOVE_OFS] = move;
		}
		return;
	}

	var meta0Any = ttU32[off0 + TT_META_OFS] >>> 0;
	var meta1Any = ttU32[off1 + TT_META_OFS] >>> 0;
	var gen0 = (meta0Any >>> 24) | 0;
	var gen1 = (meta1Any >>> 24) | 0;
	var idx = idx0;
	if(gen0 != TT_CURR_GEN && gen1 == TT_CURR_GEN) {
		idx = idx0;
	} else if(gen1 != TT_CURR_GEN && gen0 == TT_CURR_GEN) {
		idx = idx1;
	} else {
		var depth0 = (meta0Any & 0xFFFF) | 0;
		var depth1 = (meta1Any & 0xFFFF) | 0;
		if(depth0 < depth1) {
			idx = idx0;
		} else if(depth1 < depth0) {
			idx = idx1;
		} else {
			var flag0 = (meta0Any >>> 16) & 0xFF;
			var flag1 = (meta1Any >>> 16) & 0xFF;
			if(flag0 < flag1) {
				idx = idx0;
			} else if(flag1 < flag0) {
				idx = idx1;
			}
		}
	}

	var off = (idx * TT_WORDS_PER_SLOT) | 0;
	ttU32[off + TT_KEY_OFS] = key;
	ttU32[off + TT_KEY_HI_OFS] = keyHi;
	ttU32[off + TT_META_OFS] = ((depth & 0xFFFF) | ((flag & 0xFF) << 16) | ((TT_CURR_GEN & 0xFF) << 24)) >>> 0;
	ttI32[off + TT_SCORE_OFS] = storedScore;
	ttI32[off + TT_MOVE_OFS] = move;
}

function TTProbe(alpha, beta, depth) {
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var base = TTBaseIndex(key);
	var ttU32 = TT_U32;
	var ttI32 = TT_I32;
	var idxBest = -1;
	var bestDepth = -32768;
	var idxA = base;
	var offA = (idxA * TT_WORDS_PER_SLOT) | 0;
	if(ttU32[offA + TT_KEY_OFS] === key && ttU32[offA + TT_KEY_HI_OFS] === keyHi) {
		var depthA = (ttU32[offA + TT_META_OFS] & 0xFFFF) | 0;
		if(depthA >= depth) {
			idxBest = idxA;
			bestDepth = depthA;
		}
	}
	var idxB = base + 1;
	var offB = (offA + TT_WORDS_PER_SLOT) | 0;
	if(ttU32[offB + TT_KEY_OFS] === key && ttU32[offB + TT_KEY_HI_OFS] === keyHi) {
		var depthB = (ttU32[offB + TT_META_OFS] & 0xFFFF) | 0;
		if(depthB >= depth && depthB > bestDepth) {
			idxBest = idxB;
		}
	}
	if(idxBest < 0) return null;

	var offBest = (idxBest * TT_WORDS_PER_SLOT) | 0;
	var score = TTScoreFromStore(ttI32[offBest + TT_SCORE_OFS] | 0);
	var flag = (ttU32[offBest + TT_META_OFS] >>> 16) & 0xFF;

	if(flag == TT_FLAG_EXACT) return score;
	if(flag == TT_FLAG_ALPHA && score <= alpha) return alpha;
	if(flag == TT_FLAG_BETA && score >= beta) return beta;

	return null;
}

function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

function FR2SQ(f,r) {
 	return ( (21 + (f) ) + ( (r) * 10 ) );
}

function SQ64(sq120) { 
	return Sq120ToSq64[(sq120)];
}

function SQ120(sq64) {
	return Sq64ToSq120[(sq64)];
}

function MIRROR64(sq) {
	return Mirror64[sq];
}

var HASH_RAND_SEED = 0x12345678 >>> 0;
var hashRandState = HASH_RAND_SEED;

function RAND_32() {
	// Deterministic Zobrist keys keep search behavior stable across runs.
	var x = hashRandState | 0;
	x ^= (x << 13);
	x ^= (x >>> 17);
	x ^= (x << 5);
	hashRandState = x >>> 0;
	if(hashRandState === 0) {
		hashRandState = 0x9e3779b9 >>> 0;
	}
	return hashRandState;

}

function SQOFFBOARD(sq) {
	if(FilesBrd[sq]==SQUARES.OFFBOARD) return BOOL.TRUE;
	return BOOL.FALSE;	
}

function HASH_PCE(pce,sq) { 
	var idx = pce*120 + sq;
	brd_posKey = (brd_posKey ^ PieceKeys[idx]) >>> 0;
	brd_posKeyHi = (brd_posKeyHi ^ PieceKeysHi[idx]) >>> 0;
}
function HASH_CA() {
	brd_posKey = (brd_posKey ^ CastleKeys[brd_castlePerm]) >>> 0;
	brd_posKeyHi = (brd_posKeyHi ^ CastleKeysHi[brd_castlePerm]) >>> 0;
}
function HASH_SIDE() {
	brd_posKey = (brd_posKey ^ SideKey) >>> 0;
	brd_posKeyHi = (brd_posKeyHi ^ SideKeyHi) >>> 0;
}
function HASH_EP() {
	brd_posKey = (brd_posKey ^ PieceKeys[brd_enPas]) >>> 0;
	brd_posKeyHi = (brd_posKeyHi ^ PieceKeysHi[brd_enPas]) >>> 0;
}

var GameController = {};
GameController.EngineSide = COLOURS.BOTH;
GameController.PlayerSide = COLOURS.BOTH;
GameController.BoardFlipped = BOOL.FALSE;
GameController.GameOver = BOOL.FALSE;
GameController.BookLoaded = BOOL.FALSE;
GameController.GameSaved = BOOL.TRUE;
GameController.SquareSize = 60;
GameController.LastSearchResult = null;
GameController.LastSearchFenKey = "";

var GAME_MODES = {
	HUMAN_WHITE: "human_white",
	HUMAN_BLACK: "human_black",
	HUMAN_VS_HUMAN: "human_vs_human",
	ENGINE_VS_ENGINE: "engine_vs_engine"
};

var EngineSettings = {
	gameMode: GAME_MODES.HUMAN_WHITE,
	analysisSide: COLOURS.WHITE,
	skillLevel: 5,
	timeCapMs: null,
	multiPvCount: 3,
	autoAnalyze: true,
	fastPlayMode: true,
	ttTargetMb: 96,
	backgroundEval: true,
	backgroundEvalDepth: 2,
	backgroundEvalTimeMs: 120,
	backgroundEvalIntervalMs: 750
};

var EngineWorkerController = {
	enabled: (typeof window !== "undefined" && typeof window.Worker === "function"),
	ready: false,
	worker: null,
	activeRequest: null,
	nextRequestId: 1,
	fallbackReason: "",
	bookSynced: false
};

var SkillProfiles = {
	1: { label: "Beginner", maxDepth: 1, baseTimeMs: 150, randomnessCp: 350, pickWindowCp: 500, useBook: false },
	2: { label: "Novice", maxDepth: 2, baseTimeMs: 300, randomnessCp: 250, pickWindowCp: 350, useBook: false },
	3: { label: "Casual", maxDepth: 3, baseTimeMs: 500, randomnessCp: 180, pickWindowCp: 250, useBook: true },
	4: { label: "Intermediate", maxDepth: 4, baseTimeMs: 800, randomnessCp: 120, pickWindowCp: 180, useBook: true },
	5: { label: "Club", maxDepth: 5, baseTimeMs: 1200, randomnessCp: 80, pickWindowCp: 120, useBook: true },
	6: { label: "Advanced", maxDepth: 6, baseTimeMs: 1800, randomnessCp: 40, pickWindowCp: 70, useBook: true },
	7: { label: "Expert", maxDepth: 8, baseTimeMs: 2500, randomnessCp: 10, pickWindowCp: 30, useBook: true },
	8: { label: "Master", maxDepth: 10, baseTimeMs: 4000, randomnessCp: 0, pickWindowCp: 0, useBook: true },
	9: { label: "Ultimate", maxDepth: MAXDEPTH, baseTimeMs: 3000, maxTimeMs: 15000, randomnessCp: 0, pickWindowCp: 0, useBook: true, adaptiveTime: true }
};

var brd_side = COLOURS.WHITE;
var brd_pieces = new Int16Array(BRD_SQ_NUM);
var brd_enPas = SQUARES.NO_SQ;
var brd_fiftyMove;	
var brd_fullMoveNumber;
var brd_ply;
var brd_hisPly;	
var brd_castlePerm;	
var brd_posKey = 0 >>> 0;	
var brd_posKeyHi = 0 >>> 0;
var brd_pceNum = new Int8Array(13);
var brd_material = new Int32Array(2);	
var brd_pList = new Int16Array(14 * 10);	
var brd_pIndex = new Int16Array(BRD_SQ_NUM);
var brd_kingSq = new Int16Array(2);
var brd_pst = new Int32Array(2);
var brd_openingPhase = 0;
var PST = new Int16Array(13 * BRD_SQ_NUM);

function GetPstValue(pce, sq120) {
	var sq64 = Sq120ToSq64[sq120];
	if(sq64 > 63) return 0;
	if(PieceCol[pce] === COLOURS.BLACK) {
		sq64 = Mirror64[sq64];
	}
	switch(pce) {
		case PIECES.wP: case PIECES.bP: return PawnTable[sq64];
		case PIECES.wN: case PIECES.bN: return KnightTable[sq64];
		case PIECES.wB: case PIECES.bB: return BishopTable[sq64];
		case PIECES.wR: case PIECES.bR: return RookTable[sq64];
		case PIECES.wQ: case PIECES.bQ: return RookTable[sq64];
		default: return 0;
	}
}

var brd_history_move = new Int32Array(MAXGAMEMOVES);
var brd_history_castlePerm = new Int16Array(MAXGAMEMOVES);
var brd_history_enPas = new Int16Array(MAXGAMEMOVES);
var brd_history_fiftyMove = new Int16Array(MAXGAMEMOVES);
var brd_history_fullMoveNumber = new Int32Array(MAXGAMEMOVES);
var brd_history_posKey = new Uint32Array(MAXGAMEMOVES);
var brd_history_posKeyHi = new Uint32Array(MAXGAMEMOVES);
var brd_history_contextPiece = new Int8Array(MAXGAMEMOVES);

var brd_bookLines = [];
var brd_bookIndex = new Map();

var brd_moveList = new Int32Array(MAXDEPTH * MAXPOSITIONMOVES);
var brd_moveScores = new Int32Array(MAXDEPTH * MAXPOSITIONMOVES);
var brd_moveListStart = new Int32Array(MAXDEPTH + 1);

var brd_PvTable_move = new Int32Array(PVENTRIES);	
var brd_PvTable_posKey = new Int32Array(PVENTRIES);
var brd_PvArray = new Int32Array(MAXDEPTH);
var HIST_SQ_NUM = 64;
var HIST_PCE_SLOTS = 14;
var HIST_STRIDE = HIST_PCE_SLOTS * HIST_SQ_NUM;
var brd_searchHistory = new Int32Array(HIST_STRIDE);
var brd_searchCaptureHistory = new Int32Array(HIST_STRIDE);
var brd_searchKillers = new Int32Array(3 * MAXDEPTH);
var COUNTERMOVE_SIZE = HIST_SQ_NUM * HIST_SQ_NUM;
var brd_searchCounter = new Int32Array(COUNTERMOVE_SIZE);
var COUNTER_HIST_STRIDE = HIST_SQ_NUM;
var COUNTER_HIST_SIZE = COUNTERMOVE_SIZE * COUNTER_HIST_STRIDE;
var brd_searchCounterHistory = new Int16Array(COUNTER_HIST_SIZE);
var brd_searchQuietTried = new Int32Array(MAXDEPTH * MAXPOSITIONMOVES);
var brd_searchEvalStack = new Int32Array(MAXDEPTH + 4);
var CONT_HIST_STRIDE = HIST_STRIDE;
var CONT_HIST_SIZE = CONT_HIST_STRIDE * CONT_HIST_STRIDE;
var brd_searchContHistory1 = new Int16Array(CONT_HIST_SIZE);
var brd_searchContHistory2 = new Int16Array(CONT_HIST_SIZE);
var brd_contHistoryBase1 = -1;
var brd_contHistoryBase2 = -1;
var brd_excludedMove = NOMOVE;
var brd_excludedPly = -1;
var brd_counterMoveHint = NOMOVE;
var brd_counterHistoryBase = -1;
var brd_hashMoveHint = NOMOVE;

function ResetSearchHeuristics() {
	brd_searchHistory.fill(0);
	brd_searchCaptureHistory.fill(0);
	brd_searchKillers.fill(0);
	brd_searchCounter.fill(0);
	brd_searchCounterHistory.fill(0);
	brd_searchContHistory1.fill(0);
	brd_searchContHistory2.fill(0);
	brd_searchQuietTried.fill(0);
	brd_searchEvalStack.fill(0);
	brd_contHistoryBase1 = -1;
	brd_contHistoryBase2 = -1;
	brd_excludedMove = NOMOVE;
	brd_excludedPly = -1;
	brd_counterMoveHint = NOMOVE;
	brd_counterHistoryBase = -1;
	brd_hashMoveHint = NOMOVE;
}

var HISTORY_MAX = 32768;
var CAPHIST_MAX = 32768;
var CONT_HIST_MAX = 16384;
var COUNTER_HIST_MAX = 16384;
var HISTORY_DECAY_SHIFT = 15;
var CAPHIST_DECAY_SHIFT = 15;
var CONT_HIST_DECAY_SHIFT = 14;
var COUNTER_HIST_DECAY_SHIFT = 14;
var QHIST_BONUS = 96;

var CAPHIST_SHIFT = 3;
var CONT_HIST_SHIFT = 3;

var SCORE_HASH = 2000000;
var SCORE_PROMO_QUIET = 1900000;
var SCORE_CAPTURE = 1600000;
var SCORE_BAD_CAPTURE = 1200000;
var SCORE_KILLER1 = 1500000;
var SCORE_KILLER2 = 1450000;
var SCORE_COUNTER = 1400000;

// board functions

function BoardToFen() {
	var fenStr = '';
	var rank,file,sq,piece;
	var emptyCount = 0;
	
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		emptyCount = 0; 
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = brd_pieces[sq];
			if(piece == PIECES.EMPTY) {
				emptyCount++;
			} else {
				if(emptyCount!=0) {
					fenStr += String.fromCharCode('0'.charCodeAt() + emptyCount);
				}
				emptyCount = 0;
				fenStr += PceChar[piece];
			}
		}
		if(emptyCount!=0) {
			fenStr += String.fromCharCode('0'.charCodeAt() + emptyCount);
		}
		
		if(rank!=RANKS.RANK_1) {
			fenStr += '/'
		} else {
			fenStr += ' ';
		}
	}
	
	fenStr += SideChar[brd_side] + ' ';

	if(brd_castlePerm == 0) {
		fenStr += '- '
	} else {
		if(brd_castlePerm & CASTLEBIT.WKCA) fenStr += 'K';
		if(brd_castlePerm & CASTLEBIT.WQCA) fenStr += 'Q';
		if(brd_castlePerm & CASTLEBIT.BKCA) fenStr += 'k';
		if(brd_castlePerm & CASTLEBIT.BQCA) fenStr += 'q';
		fenStr += ' ';
	}

	if(brd_enPas == SQUARES.NO_SQ) {
		fenStr += '- '
	} else {
		fenStr += PrSq(brd_enPas) + ' ';
	}

	fenStr += brd_fiftyMove;
	fenStr += ' ';
	fenStr += Math.max(1, brd_fullMoveNumber);	
	
	return fenStr;
}

function CheckBoard() {   
 
	var t_pceNum = new Int16Array(13);
	var t_material = new Int32Array(2);
	
	var sq64,t_piece,t_pce_num,sq120;
	
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		for(t_pce_num = 0; t_pce_num < brd_pceNum[t_piece]; ++t_pce_num) {
			var listIndex = PCEINDEX(t_piece,t_pce_num);
			sq120 = brd_pList[listIndex];
			if(brd_pieces[sq120]!=t_piece) {
				console.log('Error Pce Lists');
				return BOOL.FALSE;
			}
			if(brd_pIndex[sq120] != listIndex) {
				console.log('Error pIndex Lists');
				return BOOL.FALSE;
			}
		}	
	}
	
	for(sq64 = 0; sq64 < 64; ++sq64) {
		sq120 = SQ120(sq64);
		t_piece = brd_pieces[sq120];
		t_pceNum[t_piece]++;
		t_material[PieceCol[t_piece]] += PieceVal[t_piece];
		if(t_piece == PIECES.EMPTY) {
			if(brd_pIndex[sq120] != -1) {
				console.log('Error pIndex Empty');
				return BOOL.FALSE;
			}
		}
	}
	
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		if(t_pceNum[t_piece]!=brd_pceNum[t_piece]) {
				console.log('Error t_pceNum');
				return BOOL.FALSE;
			}	
	}
	
	if(t_material[COLOURS.WHITE]!=brd_material[COLOURS.WHITE] || t_material[COLOURS.BLACK]!=brd_material[COLOURS.BLACK]) {
				console.log('Error t_material');
				return BOOL.FALSE;
			}		
	if(ComputeOpeningPhaseFromCounts() != Clamp(brd_openingPhase, 0, OPENING_PHASE_TOTAL)) {
		console.log('Error openingPhase');
		return BOOL.FALSE;
	}
	if(brd_kingSq[COLOURS.WHITE] != brd_pList[PCEINDEX(PIECES.wK,0)] ||
		brd_kingSq[COLOURS.BLACK] != brd_pList[PCEINDEX(PIECES.bK,0)]) {
		console.log('Error kingSq');
		return BOOL.FALSE;
	}
	var bbLoCheck = new Uint32Array(BB_PIECE_COUNT);
	var bbHiCheck = new Uint32Array(BB_PIECE_COUNT);
	var occLoCheck = new Uint32Array(3);
	var occHiCheck = new Uint32Array(3);
	for(sq64 = 0; sq64 < 64; ++sq64) {
		sq120 = SQ120(sq64);
		t_piece = brd_pieces[sq120];
		if(t_piece == PIECES.EMPTY || t_piece == SQUARES.OFFBOARD) continue;
		var bitLo = BB_MASK64_LO[sq64];
		var bitHi = BB_MASK64_HI[sq64];
		var pCol = PieceCol[t_piece];
		bbLoCheck[t_piece] = (bbLoCheck[t_piece] | bitLo) >>> 0;
		bbHiCheck[t_piece] = (bbHiCheck[t_piece] | bitHi) >>> 0;
		occLoCheck[pCol] = (occLoCheck[pCol] | bitLo) >>> 0;
		occHiCheck[pCol] = (occHiCheck[pCol] | bitHi) >>> 0;
		occLoCheck[COLOURS.BOTH] = (occLoCheck[COLOURS.BOTH] | bitLo) >>> 0;
		occHiCheck[COLOURS.BOTH] = (occHiCheck[COLOURS.BOTH] | bitHi) >>> 0;
	}
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		if((bbLoCheck[t_piece] >>> 0) != (brd_bbLo[t_piece] >>> 0) ||
			(bbHiCheck[t_piece] >>> 0) != (brd_bbHi[t_piece] >>> 0)) {
			console.log('Error bitboards');
			return BOOL.FALSE;
		}
	}
	for(var c = COLOURS.WHITE; c <= COLOURS.BOTH; ++c) {
		if((occLoCheck[c] >>> 0) != (brd_occLo[c] >>> 0) ||
			(occHiCheck[c] >>> 0) != (brd_occHi[c] >>> 0)) {
			console.log('Error occupancy');
			return BOOL.FALSE;
		}
	}
	if(brd_side!=COLOURS.WHITE && brd_side!=COLOURS.BLACK) {
				console.log('Error brd_side');
				return BOOL.FALSE;
			}
	if(GeneratePosKey()!=brd_posKey || GeneratePosKeyHi()!=brd_posKeyHi) {
				console.log('Error brd_posKey');
				return BOOL.FALSE;
			}
	if(GeneratePawnKey() != brd_pawnKey || GeneratePawnKeyHi() != brd_pawnKeyHi) {
		console.log('Error brd_pawnKey');
		return BOOL.FALSE;
	}
	
	 
	return BOOL.TRUE;	
}

function printGameLine() {

	var moveNum = 0;
	var gameLine = "";
	for(moveNum = 0; moveNum < brd_hisPly; ++moveNum) {
		gameLine += PrMove(brd_history_move[moveNum]) + " ";
	}
	//console.log('Game Line: ' + gameLine);
	return StrTrim(gameLine);
	
}

function BuildRepetitionHistoryPayload() {
	var hisPly = brd_hisPly | 0;
	if(hisPly < 0) hisPly = 0;
	if(hisPly > MAXGAMEMOVES) hisPly = MAXGAMEMOVES;
	return {
		hisPly: hisPly,
		fiftyMove: brd_fiftyMove | 0,
		posKeys: hisPly > 0 ? brd_history_posKey.slice(0, hisPly) : [],
		posKeysHi: hisPly > 0 ? brd_history_posKeyHi.slice(0, hisPly) : []
	};
}

function SetLastSearchResult(result) {
	ClearEvalOverride();
	GameController.LastSearchResult = result;
	GameController.LastSearchFenKey = CurrentFenKey();
}

function ClearLastSearchResult() {
	GameController.LastSearchResult = null;
	GameController.LastSearchFenKey = "";
	ClearEvalOverride();
}

function HasCurrentAnalysisResult() {
	if(!GameController.LastSearchResult) return false;
	return GameController.LastSearchFenKey === CurrentFenKey();
}

function SetEvalOverride(score, side, depth) {
	EvalOverrideState.fenKey = CurrentFenKey();
	EvalOverrideState.score = score;
	EvalOverrideState.side = side;
	if(typeof depth === "number") {
		EvalOverrideState.depth = depth;
	} else {
		EvalOverrideState.depth = 0;
	}
}

function ClearEvalOverride() {
	EvalOverrideState.fenKey = "";
	EvalOverrideState.score = 0;
	EvalOverrideState.side = COLOURS.WHITE;
	EvalOverrideState.depth = 0;
}

function GetEvalOverride() {
	if(!EvalOverrideState.fenKey) return null;
	if(EvalOverrideState.fenKey !== CurrentFenKey()) {
		ClearEvalOverride();
		return null;
	}
	return EvalOverrideState;
}

function GetFenKey(fen) {
	if(typeof fen !== "string") return "";
	var tokens = StrTrim(fen).split(/\s+/);
	if(tokens.length < 4) return "";
	return tokens[0] + " " + tokens[1] + " " + tokens[2] + " " + tokens[3];
}

function CurrentFenKey() {
	return GetFenKey(BoardToFen());
}

function IsStartPositionLike() {
	return CurrentFenKey() === START_FEN_KEY;
}

function IsBookEligible(gameLineOverride) {
	if(GameController.BookLoaded != BOOL.TRUE) return false;
	var line = "";
	if(typeof gameLineOverride === "string") {
		line = StrTrim(gameLineOverride);
	} else {
		line = printGameLine();
	}
	if(line.length > 0) return true;
	return IsStartPositionLike();
}

function BuildBookIndex() {
	brd_bookIndex = new Map();
	for(var lineIdx = 0; lineIdx < brd_bookLines.length; ++lineIdx) {
		var line = brd_bookLines[lineIdx];
		if(!line) continue;
		var tokens = line.split(/\s+/);
		var prefix = "";
		for(var i = 0; i < tokens.length; ++i) {
			var moveAlg = tokens[i];
			if(!moveAlg) continue;
			if(moveAlg.length < 4) break;
			var entries = brd_bookIndex.get(prefix);
			if(!entries) {
				entries = [];
				brd_bookIndex.set(prefix, entries);
			}
			entries.push(moveAlg.substr(0, 4));
			prefix = (prefix.length === 0) ? moveAlg : (prefix + " " + moveAlg);
		}
	}
}

function GetBookMoves(maxCount, gameLineOverride) {
	var bookMoves = [];
	var stats = GetBookMoveStats(gameLineOverride, maxCount);
	for(var i = 0; i < stats.length; ++i) {
		bookMoves.push(stats[i].move);
	}
	return bookMoves;
}

function GetBookMoveStats(gameLineOverride, maxCount) {
	var gameLine;
	if(typeof gameLineOverride === "string") {
		gameLine = StrTrim(gameLineOverride);
	} else {
		gameLine = printGameLine();
	}
	var prefixMoves = brd_bookIndex.get(gameLine);
	var stats = [];
	if(!prefixMoves || prefixMoves.length == 0) {
		return stats;
	}

	var statsByMove = {};
	for(var i = 0; i < prefixMoves.length; ++i) {
		var moveAlg = prefixMoves[i];
		var from = SqFromAlg(moveAlg.substr(0,2));
		var to = SqFromAlg(moveAlg.substr(2,2));
		var internalMove = ParseMove(from,to);
		if(internalMove == NOMOVE) {
			continue;
		}
		var key = String(internalMove);
		var entry = statsByMove[key];
		if(!entry) {
			entry = {
				move: internalMove,
				count: 0
			};
			statsByMove[key] = entry;
			stats.push(entry);
		}
		entry.count++;
	}

	stats.sort(function(a, b) {
		if(b.count !== a.count) return b.count - a.count;
		return a.move - b.move;
	});

	if(maxCount && stats.length > maxCount) {
		stats.length = maxCount;
	}
	return stats;
}

function PickWeightedBookMove(bookStats) {
	if(!bookStats || bookStats.length == 0) {
		return NOMOVE;
	}
	var totalWeight = 0;
	for(var i = 0; i < bookStats.length; ++i) {
		totalWeight += Math.max(1, bookStats[i].count || 0);
	}
	var roll = Math.random() * totalWeight;
	for(var idx = 0; idx < bookStats.length; ++idx) {
		roll -= Math.max(1, bookStats[idx].count || 0);
		if(roll < 0) {
			return bookStats[idx].move;
		}
	}
	return bookStats[bookStats.length - 1].move;
}

function BookMove() {
	var bookStats = GetBookMoveStats(null, 0);
	console.log("Total + " + bookStats.length + " moves in array");
	if(bookStats.length==0) return NOMOVE;
	return PickWeightedBookMove(bookStats);
}

function PrintPceLists() {
	var piece,pceNum;
	
	for(piece=PIECES.wP; piece <= PIECES.bK; ++piece) {
		for(pceNum = 0; pceNum < brd_pceNum[piece]; ++pceNum) {
			console.log("Piece " + PceChar[piece] + " on " + PrSq(brd_pList[PCEINDEX(piece,pceNum)]));
		}
	}

}

function UpdateListsMaterial() {
	brd_pceNum.fill(0);
	brd_material[COLOURS.WHITE] = 0;
	brd_material[COLOURS.BLACK] = 0;
	brd_pst[COLOURS.WHITE] = 0;
	brd_pst[COLOURS.BLACK] = 0;
	brd_openingPhase = 0;
	brd_kingSq[COLOURS.WHITE] = SQUARES.NO_SQ;
	brd_kingSq[COLOURS.BLACK] = SQUARES.NO_SQ;
	brd_pList.fill(PIECES.EMPTY);
	brd_pIndex.fill(-1);
	BBClearAll();

	for(var sq = 0; sq < BRD_SQ_NUM; ++sq) {
		var pce = brd_pieces[sq];
		if(pce == PIECES.EMPTY || pce == SQUARES.OFFBOARD) continue;

		var col = PieceCol[pce];
		brd_material[col] += PieceVal[pce];
		brd_pst[col] += PST[pce * BRD_SQ_NUM + sq];
		brd_openingPhase += PiecePhaseValue(pce);

		var idx = PCEINDEX(pce, brd_pceNum[pce]);
		brd_pList[idx] = sq;
		brd_pIndex[sq] = idx;
		brd_pceNum[pce]++;
		BBAddPieceSquare(pce, sq);

		if(PieceKing[pce] == BOOL.TRUE) {
			brd_kingSq[col] = sq;
		}
	}

	brd_openingPhase = Clamp(brd_openingPhase, 0, OPENING_PHASE_TOTAL);
	brd_pawnKey = GeneratePawnKey();
	brd_pawnKeyHi = GeneratePawnKeyHi();
}


function GeneratePosKey() {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;
	
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = brd_pieces[sq];
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {			
			finalKey ^= PieceKeys[(piece * 120) + sq];
		}		
	}
	
	if(brd_side == COLOURS.WHITE) {
		finalKey ^= SideKey;
	}
		
	if(brd_enPas != SQUARES.NO_SQ) {		
		finalKey ^= PieceKeys[brd_enPas];
	}
	
	finalKey ^= CastleKeys[brd_castlePerm];
	
	return finalKey >>> 0;
}

function GeneratePosKeyHi() {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;
	
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = brd_pieces[sq];
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {			
			finalKey ^= PieceKeysHi[(piece * 120) + sq];
		}		
	}
	
	if(brd_side == COLOURS.WHITE) {
		finalKey ^= SideKeyHi;
	}
		
	if(brd_enPas != SQUARES.NO_SQ) {		
		finalKey ^= PieceKeysHi[brd_enPas];
	}
	
	finalKey ^= CastleKeysHi[brd_castlePerm];
	
	return finalKey >>> 0;
}

function PrintBoard() {
	
	var sq,file,rank,piece;

	console.log("\nGame Board:\n");
	
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = brd_pieces[sq];
			line += (" " + PceChar[piece] + " ");
		}
		console.log(line);
	}
	
	console.log("");
	var line = "   ";
	for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
		line += (' ' + String.fromCharCode('a'.charCodeAt() + file) + ' ');	
	}
	console.log(line);
	console.log("side:" + SideChar[brd_side] );
	console.log("enPas:" + brd_enPas);
	line = "";	
	if(brd_castlePerm & CASTLEBIT.WKCA) line += 'K';
	if(brd_castlePerm & CASTLEBIT.WQCA) line += 'Q';
	if(brd_castlePerm & CASTLEBIT.BKCA) line += 'k';
	if(brd_castlePerm & CASTLEBIT.BQCA) line += 'q';
	
	console.log("castle:" + line);
	console.log("key:" + brd_posKey.toString(16) + ":" + brd_posKeyHi.toString(16));
	//PrintPceLists();
}

var brd_pawnKey = 0 >>> 0;
var brd_pawnKeyHi = 0 >>> 0;

function HASH_PAWN(pce, sq) {
	if(pce !== PIECES.wP && pce !== PIECES.bP) return;
	var idx = (pce * 120) + sq;
	brd_pawnKey = (brd_pawnKey ^ PieceKeys[idx]) >>> 0;
	brd_pawnKeyHi = (brd_pawnKeyHi ^ PieceKeysHi[idx]) >>> 0;
}

function GeneratePawnKey() {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;
	
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = brd_pieces[sq];
		if(piece == PIECES.wP || piece == PIECES.bP) {			
			finalKey ^= PieceKeys[(piece * 120) + sq];
		}		
	}
	
	return finalKey >>> 0;
}

function GeneratePawnKeyHi() {

	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;
	
	for(sq = 0; sq < BRD_SQ_NUM; ++sq) {
		piece = brd_pieces[sq];
		if(piece == PIECES.wP || piece == PIECES.bP) {			
			finalKey ^= PieceKeysHi[(piece * 120) + sq];
		}		
	}
	
	return finalKey >>> 0;
}

function PawnCacheLoad(pawnCacheIdx) {
	return PAWNCACHE_SCORE[pawnCacheIdx] | 0;
}

function PawnCacheStore(pawnCacheIdx, pawnKey, pawnKeyHi, pawnScore, whitePawnFiles, blackPawnFiles) {
	PAWNCACHE_KEY[pawnCacheIdx] = pawnKey >>> 0;
	PAWNCACHE_KEY_HI[pawnCacheIdx] = pawnKeyHi >>> 0;
	PAWNCACHE_SCORE[pawnCacheIdx] = pawnScore | 0;
	PAWNCACHE_WFILES[pawnCacheIdx] = whitePawnFiles & 0xFF;
	PAWNCACHE_BFILES[pawnCacheIdx] = blackPawnFiles & 0xFF;
}

function ResetBoard() {
	var index = 0;

	brd_pieces.fill(SQUARES.OFFBOARD);
	for(index = 0; index < 64; ++index) {
		brd_pieces[SQ120(index)] = PIECES.EMPTY;
	}

	brd_pList.fill(PIECES.EMPTY);
	brd_pIndex.fill(-1);
	brd_kingSq[COLOURS.WHITE] = SQUARES.NO_SQ;
	brd_kingSq[COLOURS.BLACK] = SQUARES.NO_SQ;
	brd_material.fill(0);
	brd_pst.fill(0);
	brd_pceNum.fill(0);
	BBClearAll();
	brd_openingPhase = 0;

	brd_side = COLOURS.BOTH;
	brd_enPas = SQUARES.NO_SQ;
	brd_fiftyMove = 0;
	brd_fullMoveNumber = 1;
	brd_ply = 0;
	brd_hisPly = 0;
	brd_castlePerm = 0;
	brd_posKey = 0 >>> 0;
	brd_posKeyHi = 0 >>> 0;

	brd_pawnKey = 0 >>> 0;
	brd_pawnKeyHi = 0 >>> 0;

	brd_moveListStart[brd_ply] = 0;
}


function ParseFen(fen) {
	if(typeof fen !== "string") {
		return BOOL.FALSE;
	}

	fen = StrTrim(fen);
	if(fen.length === 0) {
		return BOOL.FALSE;
	}

	var tokens = fen.split(/\s+/);
	if(tokens.length < 4) {
		return BOOL.FALSE;
	}

	var placementToken = tokens[0];
	var sideToken = tokens[1];
	var castleToken = tokens[2];
	var enPassantToken = tokens[3];
	var halfMoveToken = (tokens.length > 4) ? tokens[4] : "0";
	var fullMoveToken = (tokens.length > 5) ? tokens[5] : "1";

	var tempPieces = new Int16Array(BRD_SQ_NUM);
	tempPieces.fill(SQUARES.OFFBOARD);
	for(var sq64 = 0; sq64 < 64; ++sq64) {
		tempPieces[SQ120(sq64)] = PIECES.EMPTY;
	}

	var rank = RANKS.RANK_8;
	var file = FILES.FILE_A;
	var piece = PIECES.EMPTY;
	var i;

	for(i = 0; i < placementToken.length; ++i) {
		var ch = placementToken[i];

		if(ch === '/') {
			if(file !== 8 || rank === RANKS.RANK_1) {
				return BOOL.FALSE;
			}
			rank--;
			file = FILES.FILE_A;
			continue;
		}

		if(ch >= '1' && ch <= '8') {
			file += ch.charCodeAt(0) - '0'.charCodeAt(0);
			if(file > 8) {
				return BOOL.FALSE;
			}
			continue;
		}

		switch(ch) {
			case 'p': piece = PIECES.bP; break;
			case 'r': piece = PIECES.bR; break;
			case 'n': piece = PIECES.bN; break;
			case 'b': piece = PIECES.bB; break;
			case 'k': piece = PIECES.bK; break;
			case 'q': piece = PIECES.bQ; break;
			case 'P': piece = PIECES.wP; break;
			case 'R': piece = PIECES.wR; break;
			case 'N': piece = PIECES.wN; break;
			case 'B': piece = PIECES.wB; break;
			case 'K': piece = PIECES.wK; break;
			case 'Q': piece = PIECES.wQ; break;
			default:
				return BOOL.FALSE;
		}

		if(file > FILES.FILE_H) {
			return BOOL.FALSE;
		}

		tempPieces[FR2SQ(file, rank)] = piece;
		file++;
	}

	if(rank !== RANKS.RANK_1 || file !== 8) {
		return BOOL.FALSE;
	}

	var parsedSide = COLOURS.BOTH;
	if(sideToken === 'w') {
		parsedSide = COLOURS.WHITE;
	} else if(sideToken === 'b') {
		parsedSide = COLOURS.BLACK;
	} else {
		return BOOL.FALSE;
	}

	var parsedCastlePerm = 0;
	if(castleToken !== '-') {
		for(i = 0; i < castleToken.length; ++i) {
			switch(castleToken[i]) {
				case 'K': parsedCastlePerm |= CASTLEBIT.WKCA; break;
				case 'Q': parsedCastlePerm |= CASTLEBIT.WQCA; break;
				case 'k': parsedCastlePerm |= CASTLEBIT.BKCA; break;
				case 'q': parsedCastlePerm |= CASTLEBIT.BQCA; break;
				default:
					return BOOL.FALSE;
			}
		}
	}

	var parsedEnPassant = SQUARES.NO_SQ;
	if(enPassantToken !== '-') {
		if(enPassantToken.length !== 2) {
			return BOOL.FALSE;
		}
		var epFile = enPassantToken[0].charCodeAt(0) - 'a'.charCodeAt(0);
		var epRank = enPassantToken[1].charCodeAt(0) - '1'.charCodeAt(0);
		if(epFile < FILES.FILE_A || epFile > FILES.FILE_H || epRank < RANKS.RANK_1 || epRank > RANKS.RANK_8) {
			return BOOL.FALSE;
		}
		parsedEnPassant = FR2SQ(epFile, epRank);
	}

	var parsedHalfMove = parseInt(halfMoveToken, 10);
	if(isNaN(parsedHalfMove) || parsedHalfMove < 0) {
		return BOOL.FALSE;
	}

	var parsedFullMove = parseInt(fullMoveToken, 10);
	if(isNaN(parsedFullMove) || parsedFullMove < 1) {
		return BOOL.FALSE;
	}

	ResetBoard();
	brd_pieces.set(tempPieces);
	brd_side = parsedSide;
	brd_castlePerm = parsedCastlePerm;
	brd_enPas = parsedEnPassant;
	brd_fiftyMove = parsedHalfMove;
	brd_fullMoveNumber = parsedFullMove;
	brd_ply = 0;
	brd_hisPly = 0;
	UpdateListsMaterial();
	brd_posKey = GeneratePosKey();
	brd_posKeyHi = GeneratePosKeyHi();
	brd_pawnKey = GeneratePawnKey();
	brd_pawnKeyHi = GeneratePawnKeyHi();
	ResetSearchHeuristics();
	return BOOL.TRUE;
}

function SqAttackedByWhite64(sq64) {
	if(((brd_bbLo[PIECES.wP] & BB_PAWN_FROM_WHITE_LO[sq64]) | (brd_bbHi[PIECES.wP] & BB_PAWN_FROM_WHITE_HI[sq64])) !== 0) return BOOL.TRUE;
	if(((brd_bbLo[PIECES.wN] & BB_KNIGHT_ATK_LO[sq64]) | (brd_bbHi[PIECES.wN] & BB_KNIGHT_ATK_HI[sq64])) !== 0) return BOOL.TRUE;
	if(((brd_bbLo[PIECES.wK] & BB_KING_ATK_LO[sq64]) | (brd_bbHi[PIECES.wK] & BB_KING_ATK_HI[sq64])) !== 0) return BOOL.TRUE;

	var occLo = brd_occLo[COLOURS.BOTH] >>> 0;
	var occHi = brd_occHi[COLOURS.BOTH] >>> 0;
	var rookQueenLo = (brd_bbLo[PIECES.wR] | brd_bbLo[PIECES.wQ]) >>> 0;
	var rookQueenHi = (brd_bbHi[PIECES.wR] | brd_bbHi[PIECES.wQ]) >>> 0;
	if((rookQueenLo | rookQueenHi) !== 0) {
		var rookIdx = BBRookAttackTableIndex(sq64, occLo, occHi);
		if(((BB_ROOK_ATTACK_LO[rookIdx] & rookQueenLo) | (BB_ROOK_ATTACK_HI[rookIdx] & rookQueenHi)) !== 0) {
			return BOOL.TRUE;
		}
	}

	var bishopQueenLo = (brd_bbLo[PIECES.wB] | brd_bbLo[PIECES.wQ]) >>> 0;
	var bishopQueenHi = (brd_bbHi[PIECES.wB] | brd_bbHi[PIECES.wQ]) >>> 0;
	if((bishopQueenLo | bishopQueenHi) !== 0) {
		var bishopIdx = BBBishopAttackTableIndex(sq64, occLo, occHi);
		if(((BB_BISHOP_ATTACK_LO[bishopIdx] & bishopQueenLo) | (BB_BISHOP_ATTACK_HI[bishopIdx] & bishopQueenHi)) !== 0) {
			return BOOL.TRUE;
		}
	}
	return BOOL.FALSE;
}

function SqAttackedByBlack64(sq64) {
	if(((brd_bbLo[PIECES.bP] & BB_PAWN_FROM_BLACK_LO[sq64]) | (brd_bbHi[PIECES.bP] & BB_PAWN_FROM_BLACK_HI[sq64])) !== 0) return BOOL.TRUE;
	if(((brd_bbLo[PIECES.bN] & BB_KNIGHT_ATK_LO[sq64]) | (brd_bbHi[PIECES.bN] & BB_KNIGHT_ATK_HI[sq64])) !== 0) return BOOL.TRUE;
	if(((brd_bbLo[PIECES.bK] & BB_KING_ATK_LO[sq64]) | (brd_bbHi[PIECES.bK] & BB_KING_ATK_HI[sq64])) !== 0) return BOOL.TRUE;

	var occLo = brd_occLo[COLOURS.BOTH] >>> 0;
	var occHi = brd_occHi[COLOURS.BOTH] >>> 0;
	var rookQueenLo = (brd_bbLo[PIECES.bR] | brd_bbLo[PIECES.bQ]) >>> 0;
	var rookQueenHi = (brd_bbHi[PIECES.bR] | brd_bbHi[PIECES.bQ]) >>> 0;
	if((rookQueenLo | rookQueenHi) !== 0) {
		var rookIdx = BBRookAttackTableIndex(sq64, occLo, occHi);
		if(((BB_ROOK_ATTACK_LO[rookIdx] & rookQueenLo) | (BB_ROOK_ATTACK_HI[rookIdx] & rookQueenHi)) !== 0) {
			return BOOL.TRUE;
		}
	}

	var bishopQueenLo = (brd_bbLo[PIECES.bB] | brd_bbLo[PIECES.bQ]) >>> 0;
	var bishopQueenHi = (brd_bbHi[PIECES.bB] | brd_bbHi[PIECES.bQ]) >>> 0;
	if((bishopQueenLo | bishopQueenHi) !== 0) {
		var bishopIdx = BBBishopAttackTableIndex(sq64, occLo, occHi);
		if(((BB_BISHOP_ATTACK_LO[bishopIdx] & bishopQueenLo) | (BB_BISHOP_ATTACK_HI[bishopIdx] & bishopQueenHi)) !== 0) {
			return BOOL.TRUE;
		}
	}
	return BOOL.FALSE;
}

function SqAttackedByWhite(sq) {
	var sq64 = Sq120ToSq64[sq];
	if(sq64 < 0 || sq64 > 63) return BOOL.FALSE;
	return SqAttackedByWhite64(sq64);
}

function SqAttackedByBlack(sq) {
	var sq64 = Sq120ToSq64[sq];
	if(sq64 < 0 || sq64 > 63) return BOOL.FALSE;
	return SqAttackedByBlack64(sq64);
}

function SqAttacked(sq, side) {
	if(side == COLOURS.WHITE) {
		return SqAttackedByWhite(sq);
	}
	return SqAttackedByBlack(sq);
}

function ComputeKingDangerPenalty(side, openingPhase) {
	if(openingPhase < KING_DANGER_PHASE_MIN) return 0;
	var kingSq = brd_kingSq[side];
	if(kingSq == SQUARES.NO_SQ) return 0;
	var kingSq64 = SQ64(kingSq);
	if(kingSq64 < 0 || kingSq64 >= 64) return 0;

	var enemy = side ^ 1;
	var enemyHeavy = (enemy == COLOURS.WHITE) ?
		(brd_pceNum[PIECES.wQ] + brd_pceNum[PIECES.wR]) :
		(brd_pceNum[PIECES.bQ] + brd_pceNum[PIECES.bR]);
	if(enemyHeavy == 0) return 0;
	var kingUnderAttack = SqAttacked(kingSq, enemy);

	var attackUnits = 0;
	var enemyRook = (enemy == COLOURS.WHITE) ? PIECES.wR : PIECES.bR;
	var enemyQueen = (enemy == COLOURS.WHITE) ? PIECES.wQ : PIECES.bQ;

	var piece;
	var pceNum;
	var sq;
	var dist;

	piece = enemyRook;
	for(pceNum = 0; pceNum < brd_pceNum[piece]; ++pceNum) {
		sq = brd_pList[PCEINDEX(piece, pceNum)];
		dist = KingDistance64[(SQ64(sq) << 6) + kingSq64];
		if(dist <= 2) attackUnits += 2;
		else if(dist == 3) attackUnits += 1;
	}

	piece = enemyQueen;
	for(pceNum = 0; pceNum < brd_pceNum[piece]; ++pceNum) {
		sq = brd_pList[PCEINDEX(piece, pceNum)];
		dist = KingDistance64[(SQ64(sq) << 6) + kingSq64];
		if(dist <= 2) attackUnits += 3;
		else if(dist == 3) attackUnits += 2;
	}
	if(attackUnits == 0 && kingUnderAttack == BOOL.FALSE) return 0;

	var kingBase = kingSq * 8;
	var shelter = 0;
	var ourPawn = (side == COLOURS.WHITE) ? PIECES.wP : PIECES.bP;
	var kingAdjCount = KiAttackCount[kingSq];
	for(var i = 0; i < kingAdjCount; ++i) {
		sq = KiAttacks[kingBase + i];
		if(brd_pieces[sq] == ourPawn) {
			shelter++;
		}
	}

	var pressure = (attackUnits * KING_DANGER_ATTACK_WEIGHT) - (shelter * KING_DANGER_DEFENSE_WEIGHT);
	if(kingUnderAttack == BOOL.TRUE) {
		pressure += KING_DANGER_CHECK_BONUS;
	}
	if(pressure <= 0) return 0;

	var phaseScaled = ((pressure * openingPhase + (OPENING_PHASE_TOTAL >> 1)) / OPENING_PHASE_TOTAL) | 0;
	return Clamp(phaseScaled, 0, KING_DANGER_MAX_CP);
}

function PrintSqAttacked() {
	
	var sq,file,rank,piece;

	console.log("\nAttacked:\n");
	
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =((rank+1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(SqAttacked(sq, COLOURS.BLACK) == BOOL.TRUE) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
		console.log(line);
	}
	
	console.log("");
}
var RookOpenFile = 10;
var RookSemiOpenFile = 5;
var QueenOpenFile = 5;
var QueenSemiOpenFile = 3;
var BishopPair = 30;
var KING_DANGER_ATTACK_WEIGHT = 1;
var KING_DANGER_DEFENSE_WEIGHT = 1;
var KING_DANGER_CHECK_BONUS = 2;
var KING_DANGER_PHASE_MIN = 8;
var KING_DANGER_MAX_CP = 12;

var PawnRanksWhite = new Int8Array(10);
var PawnRanksBlack = new Int8Array(10);
var PAWNCACHE_SIZE = 1 << 15;
var PAWNCACHE_MASK = PAWNCACHE_SIZE - 1;
var PAWNCACHE_KEY = new Uint32Array(PAWNCACHE_SIZE);
var PAWNCACHE_KEY_HI = new Uint32Array(PAWNCACHE_SIZE);
var PAWNCACHE_SCORE = new Int32Array(PAWNCACHE_SIZE);
var PAWNCACHE_WFILES = new Uint16Array(PAWNCACHE_SIZE);
var PAWNCACHE_BFILES = new Uint16Array(PAWNCACHE_SIZE);

var PawnIsolated = -14;
var PawnDoubled  = -12;
var PawnPassed   = new Int16Array([ 0, 6, 12, 24, 45, 85, 170, 200 ]);
var TempoBonus   = 8;

var PawnTable = new Int16Array([
	0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	,
	0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	,
	5	,	0	,	0	,	5	,	5	,	0	,	0	,	5	,
	0	,	0	,	10	,	20	,	20	,	10	,	0	,	0	,
	5	,	5	,	5	,	10	,	10	,	5	,	5	,	5	,
	10	,	10	,	10	,	20	,	20	,	10	,	10	,	10	,
	20	,	20	,	20	,	30	,	30	,	20	,	20	,	20	,
	0	,	0	,	0	,	0	,	0	,	0	,	0	,	0
]);

var KnightTable = new Int16Array([
0	,	-10	,	0	,	0	,	0	,	0	,	-10	,	0	,
0	,	0	,	0	,	5	,	5	,	0	,	0	,	0	,
0	,	0	,	10	,	10	,	10	,	10	,	0	,	0	,
0	,	0	,	10	,	20	,	20	,	10	,	5	,	0	,
5	,	10	,	15	,	20	,	20	,	15	,	10	,	5	,
5	,	10	,	10	,	20	,	20	,	10	,	10	,	5	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	0	,	0	,	0	,	0	,	0	,	0		
]);

var BishopTable = new Int16Array([
0	,	0	,	-10	,	0	,	0	,	-10	,	0	,	0	,
0	,	0	,	0	,	10	,	10	,	0	,	0	,	0	,
0	,	0	,	10	,	15	,	15	,	10	,	0	,	0	,
0	,	10	,	15	,	20	,	20	,	15	,	10	,	0	,
0	,	10	,	15	,	20	,	20	,	15	,	10	,	0	,
0	,	0	,	10	,	15	,	15	,	10	,	0	,	0	,
0	,	0	,	0	,	10	,	10	,	0	,	0	,	0	,
0	,	0	,	0	,	0	,	0	,	0	,	0	,	0	
]);

var RookTable = new Int16Array([
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0	,
25	,	25	,	25	,	25	,	25	,	25	,	25	,	25	,
0	,	0	,	5	,	10	,	10	,	5	,	0	,	0		
]);

var KingE = new Int16Array([	
	-50	,	-10	,	0	,	0	,	0	,	0	,	-10	,	-50	,
	-10,	0	,	10	,	10	,	10	,	10	,	0	,	-10	,
	0	,	10	,	20	,	20	,	20	,	20	,	10	,	0	,
	0	,	10	,	20	,	40	,	40	,	20	,	10	,	0	,
	0	,	10	,	20	,	40	,	40	,	20	,	10	,	0	,
	0	,	10	,	20	,	20	,	20	,	20	,	10	,	0	,
	-10,	0	,	10	,	10	,	10	,	10	,	0	,	-10	,
	-50	,	-10	,	0	,	0	,	0	,	0	,	-10	,	-50	
]);

var KingO = new Int16Array([	
	0	,	5	,	5	,	-10	,	-10	,	0	,	10	,	5	,
	-30	,	-30	,	-30	,	-30	,	-30	,	-30	,	-30	,	-30	,
	-50	,	-50	,	-50	,	-50	,	-50	,	-50	,	-50	,	-50	,
	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,
	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70	,	-70		
]);

var QueenTable = new Int16Array([
	-10	,	-5	,	-5	,	-5	,	-5	,	-5	,	-5	,	-10	,
	-5	,	0	,	0	,	0	,	0	,	0	,	0	,	-5	,
	-5	,	0	,	5	,	5	,	5	,	5	,	0	,	-5	,
	-5	,	0	,	5	,	10	,	10	,	5	,	0	,	-5	,
	-5	,	0	,	5	,	10	,	10	,	5	,	0	,	-5	,
	-5	,	0	,	5	,	5	,	5	,	5	,	0	,	-5	,
	-5	,	0	,	0	,	0	,	0	,	0	,	0	,	-5	,
	-10	,	-5	,	-5	,	-5	,	-5	,	-5	,	-5	,	-10
]);

function MaterialDraw() {
    if (0 == brd_pceNum[PIECES.wR] && 0 == brd_pceNum[PIECES.bR] && 0 == brd_pceNum[PIECES.wQ] && 0 == brd_pceNum[PIECES.bQ]) {
	  if (0 == brd_pceNum[PIECES.bB] && 0 == brd_pceNum[PIECES.wB]) {
	      if (brd_pceNum[PIECES.wN] < 3 && brd_pceNum[PIECES.bN] < 3) {  return BOOL.TRUE; }
	  } else if (0 == brd_pceNum[PIECES.wN] && 0 == brd_pceNum[PIECES.bN]) {
	     if (Math.abs(brd_pceNum[PIECES.wB] - brd_pceNum[PIECES.bB]) < 2) { return BOOL.TRUE; }
	  } else if ((brd_pceNum[PIECES.wN] < 3 && 0 == brd_pceNum[PIECES.wB]) || (brd_pceNum[PIECES.wB] == 1 && 0 == brd_pceNum[PIECES.wN])) {
	    if ((brd_pceNum[PIECES.bN] < 3 && 0 == brd_pceNum[PIECES.bB]) || (brd_pceNum[PIECES.bB] == 1 && 0 == brd_pceNum[PIECES.bN]))  { return BOOL.TRUE; }
	  }
	} else if (0 == brd_pceNum[PIECES.wQ] && 0 == brd_pceNum[PIECES.bQ]) {
        if (brd_pceNum[PIECES.wR] == 1 && brd_pceNum[PIECES.bR] == 1) {
            if ((brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB]) < 2 && (brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB]) < 2)	{ return BOOL.TRUE; }
        } else if (brd_pceNum[PIECES.wR] == 1 && 0 == brd_pceNum[PIECES.bR]) {
            if ((brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] == 0) && (((brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB]) == 1) || ((brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB]) == 2))) { return BOOL.TRUE; }
        } else if (brd_pceNum[PIECES.bR] == 1 && 0 == brd_pceNum[PIECES.wR]) {
            if ((brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] == 0) && (((brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB]) == 1) || ((brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB]) == 2))) { return BOOL.TRUE; }
        }
    }
  return BOOL.FALSE;
}

var PHASE_WEIGHT_N = 1;
var PHASE_WEIGHT_B = 1;
var PHASE_WEIGHT_R = 2;
var PHASE_WEIGHT_Q = 4;
var OPENING_PHASE_TOTAL = (4 * PHASE_WEIGHT_N) + (4 * PHASE_WEIGHT_B) + (4 * PHASE_WEIGHT_R) + (2 * PHASE_WEIGHT_Q);
var KING_BLEND = new Int16Array((OPENING_PHASE_TOTAL + 1) * 64);

(function InitKingBlend() {
	for(var op = 0; op <= OPENING_PHASE_TOTAL; ++op) {
		var eg = OPENING_PHASE_TOTAL - op;
		var base = op << 6;
		for(var sq = 0; sq < 64; ++sq) {
			KING_BLEND[base + sq] =
				((KingO[sq] * op + KingE[sq] * eg + (OPENING_PHASE_TOTAL >> 1)) / OPENING_PHASE_TOTAL) | 0;
		}
	}
})();

function ComputeOpeningPhaseFromCounts() {
	var phase = 0;
	phase += PopCount64((brd_bbLo[PIECES.wN] | brd_bbLo[PIECES.bN]) >>> 0, (brd_bbHi[PIECES.wN] | brd_bbHi[PIECES.bN]) >>> 0) * PHASE_WEIGHT_N;
	phase += PopCount64((brd_bbLo[PIECES.wB] | brd_bbLo[PIECES.bB]) >>> 0, (brd_bbHi[PIECES.wB] | brd_bbHi[PIECES.bB]) >>> 0) * PHASE_WEIGHT_B;
	phase += PopCount64((brd_bbLo[PIECES.wR] | brd_bbLo[PIECES.bR]) >>> 0, (brd_bbHi[PIECES.wR] | brd_bbHi[PIECES.bR]) >>> 0) * PHASE_WEIGHT_R;
	phase += PopCount64((brd_bbLo[PIECES.wQ] | brd_bbLo[PIECES.bQ]) >>> 0, (brd_bbHi[PIECES.wQ] | brd_bbHi[PIECES.bQ]) >>> 0) * PHASE_WEIGHT_Q;
	return Clamp(phase, 0, OPENING_PHASE_TOTAL);
}

function GetOpeningPhase() {
	return Clamp(brd_openingPhase, 0, OPENING_PHASE_TOTAL);
}

function PawnsInit() {
	var index = 0;
	var pce;
	var pceNum;
	var sq;
	
	PawnRanksWhite.fill(RANKS.RANK_8);
	PawnRanksBlack.fill(RANKS.RANK_1);
	
	pce = PIECES.wP;	
	for(pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
		sq = brd_pList[PCEINDEX(pce,pceNum)];
		if(RanksBrd[sq] < PawnRanksWhite[FilesBrd[sq]+1]) {
			PawnRanksWhite[FilesBrd[sq]+1] = RanksBrd[sq];
		}
	}	

	pce = PIECES.bP;	
	for(pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
		sq = brd_pList[PCEINDEX(pce,pceNum)];
		if(RanksBrd[sq] > PawnRanksBlack[FilesBrd[sq]+1]) {
			PawnRanksBlack[FilesBrd[sq]+1] = RanksBrd[sq];
		}			
	}	
}

function EvalPosition() {
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var idx = key & EVALCACHE_MASK;
	if(EVALCACHE_KEY[idx] === key && EVALCACHE_KEY_HI[idx] === keyHi) {
		return EVALCACHE_SCORE[idx];
	}

	if(0 == brd_pceNum[PIECES.wP] && 0 == brd_pceNum[PIECES.bP] && MaterialDraw() == BOOL.TRUE) {
		EVALCACHE_KEY[idx] = key;
		EVALCACHE_KEY_HI[idx] = keyHi;
		EVALCACHE_SCORE[idx] = 0;
		return 0;
	}

	var score = (brd_material[COLOURS.WHITE] + brd_pst[COLOURS.WHITE]) - (brd_material[COLOURS.BLACK] + brd_pst[COLOURS.BLACK]);

	var pawnKey = brd_pawnKey >>> 0;
	var pawnKeyHi = brd_pawnKeyHi >>> 0;
	var pawnCacheIdx = pawnKey & PAWNCACHE_MASK;
	var whitePawnFiles = 0;
	var blackPawnFiles = 0;
	var pNum;
	var sq;

	if(PAWNCACHE_KEY[pawnCacheIdx] === pawnKey && PAWNCACHE_KEY_HI[pawnCacheIdx] === pawnKeyHi) {
		score += PawnCacheLoad(pawnCacheIdx);
		whitePawnFiles = PAWNCACHE_WFILES[pawnCacheIdx] | 0;
		blackPawnFiles = PAWNCACHE_BFILES[pawnCacheIdx] | 0;
	} else {
		PawnsInit();

		var pawnScore = 0;
		var file, rank, pceNum;
		var whitePawnSeen = 0;
		var blackPawnSeen = 0;
		var fileBit = 0;

		for(pceNum = 0; pceNum < brd_pceNum[PIECES.wP]; ++pceNum) {
			sq = brd_pList[PCEINDEX(PIECES.wP, pceNum)];
			file = FilesBrd[sq] + 1;
			rank = RanksBrd[sq];
			fileBit = 1 << (file - 1);
			if((whitePawnSeen & fileBit) != 0) {
				pawnScore += PawnDoubled;
			} else {
				whitePawnSeen |= fileBit;
			}

			if(PawnRanksWhite[file - 1] == RANKS.RANK_8 && PawnRanksWhite[file + 1] == RANKS.RANK_8) {
				pawnScore += PawnIsolated;
			}
			if(PawnRanksBlack[file - 1] <= rank && PawnRanksBlack[file] <= rank && PawnRanksBlack[file + 1] <= rank) {
				pawnScore += PawnPassed[rank];
			}
		}

		for(pceNum = 0; pceNum < brd_pceNum[PIECES.bP]; ++pceNum) {
			sq = brd_pList[PCEINDEX(PIECES.bP, pceNum)];
			file = FilesBrd[sq] + 1;
			rank = RanksBrd[sq];
			fileBit = 1 << (file - 1);
			if((blackPawnSeen & fileBit) != 0) {
				pawnScore -= PawnDoubled;
			} else {
				blackPawnSeen |= fileBit;
			}

			if(PawnRanksBlack[file - 1] == RANKS.RANK_1 && PawnRanksBlack[file + 1] == RANKS.RANK_1) {
				pawnScore -= PawnIsolated;
			}
			if(PawnRanksWhite[file - 1] >= rank && PawnRanksWhite[file] >= rank && PawnRanksWhite[file + 1] >= rank) {
				pawnScore -= PawnPassed[7 - rank];
			}
		}

		whitePawnFiles = whitePawnSeen;
		blackPawnFiles = blackPawnSeen;
		score += pawnScore;
		PawnCacheStore(pawnCacheIdx, pawnKey, pawnKeyHi, pawnScore, whitePawnFiles, blackPawnFiles);
	}

	var fileMask = 0;
	for(pNum = 0; pNum < brd_pceNum[PIECES.wR]; ++pNum) {
		sq = brd_pList[PCEINDEX(PIECES.wR, pNum)];
		fileMask = 1 << FilesBrd[sq];
		if((whitePawnFiles & fileMask) == 0) {
			score += ((blackPawnFiles & fileMask) == 0) ? RookOpenFile : RookSemiOpenFile;
		}
	}
	for(pNum = 0; pNum < brd_pceNum[PIECES.bR]; ++pNum) {
		sq = brd_pList[PCEINDEX(PIECES.bR, pNum)];
		fileMask = 1 << FilesBrd[sq];
		if((blackPawnFiles & fileMask) == 0) {
			score -= ((whitePawnFiles & fileMask) == 0) ? RookOpenFile : RookSemiOpenFile;
		}
	}
	for(pNum = 0; pNum < brd_pceNum[PIECES.wQ]; ++pNum) {
		sq = brd_pList[PCEINDEX(PIECES.wQ, pNum)];
		fileMask = 1 << FilesBrd[sq];
		if((whitePawnFiles & fileMask) == 0) {
			score += ((blackPawnFiles & fileMask) == 0) ? QueenOpenFile : QueenSemiOpenFile;
		}
	}
	for(pNum = 0; pNum < brd_pceNum[PIECES.bQ]; ++pNum) {
		sq = brd_pList[PCEINDEX(PIECES.bQ, pNum)];
		fileMask = 1 << FilesBrd[sq];
		if((blackPawnFiles & fileMask) == 0) {
			score -= ((whitePawnFiles & fileMask) == 0) ? QueenOpenFile : QueenSemiOpenFile;
		}
	}

	var openingPhase = GetOpeningPhase();
	var phaseBase = openingPhase << 6;
	var wKingSq64 = SQ64(brd_kingSq[COLOURS.WHITE]);
	score += KING_BLEND[phaseBase + wKingSq64];

	var bKingSq64 = MIRROR64(SQ64(brd_kingSq[COLOURS.BLACK]));
	score -= KING_BLEND[phaseBase + bKingSq64];

	score -= ComputeKingDangerPenalty(COLOURS.WHITE, openingPhase);
	score += ComputeKingDangerPenalty(COLOURS.BLACK, openingPhase);

	if(brd_pceNum[PIECES.wB] >= 2) score += BishopPair;
	if(brd_pceNum[PIECES.bB] >= 2) score -= BishopPair;

	score = score | 0;
	var evalScore = (brd_side == COLOURS.WHITE) ? score : -score;
	evalScore += TempoBonus;

	EVALCACHE_KEY[idx] = key;
	EVALCACHE_KEY_HI[idx] = keyHi;
	EVALCACHE_SCORE[idx] = evalScore;
	return evalScore;
}

var DEBUG_VALIDATE_FAST = false;

function AssertStateLight(tag) {
	if(!DEBUG_VALIDATE_FAST) return;

	// Kings must exist where we think they are
	var wK = brd_kingSq[COLOURS.WHITE];
	var bK = brd_kingSq[COLOURS.BLACK];
	if(brd_pieces[wK] !== PIECES.wK) throw new Error("State corrupt ("+tag+"): white kingSq wrong");
	if(brd_pieces[bK] !== PIECES.bK) throw new Error("State corrupt ("+tag+"): black kingSq wrong");

	// Hash must match incremental
	var kLo = GeneratePosKey();
	var kHi = GeneratePosKeyHi();
	if((kLo >>> 0) !== (brd_posKey >>> 0) || (kHi >>> 0) !== (brd_posKeyHi >>> 0)) {
		throw new Error("State corrupt ("+tag+"): hash mismatch");
	}
}

function ClearPieceFast(sq) {
	var pce = brd_pieces[sq];
	if(pce === PIECES.EMPTY || pce === SQUARES.OFFBOARD) return;

	var col = PieceCol[pce];
	var idx = brd_pIndex[sq];
	if(DEBUG_VALIDATE_FAST && idx < 0) throw new Error("brd_pIndex corrupt in ClearPieceFast @ " + sq);

	HASH_PCE(pce, sq);
	HASH_PAWN(pce, sq);

	brd_pieces[sq] = PIECES.EMPTY;
	BBRemovePieceSquare(pce, sq);
	brd_material[col] -= PieceVal[pce];
	brd_pst[col] -= PST[(pce * BRD_SQ_NUM) + sq];
	brd_openingPhase -= PiecePhaseValue(pce);

	var newCount = (brd_pceNum[pce] - 1) | 0;
	var lastIdx = PCEINDEX(pce, newCount);
	var lastSq = brd_pList[lastIdx];

	brd_pceNum[pce] = newCount;

	if(idx !== lastIdx) {
		brd_pList[idx] = lastSq;
		brd_pIndex[lastSq] = idx;
	}
	brd_pList[lastIdx] = PIECES.EMPTY;
	brd_pIndex[sq] = -1;

	if(PieceKing[pce] === BOOL.TRUE) {
		brd_kingSq[col] = SQUARES.NO_SQ;
	}
}

function AddPieceFast(sq, pce) {
	var col = PieceCol[pce];
	var idx = PCEINDEX(pce, brd_pceNum[pce]);

	HASH_PCE(pce, sq);
	HASH_PAWN(pce, sq);

	brd_pieces[sq] = pce;
	BBAddPieceSquare(pce, sq);
	brd_material[col] += PieceVal[pce];
	brd_pst[col] += PST[(pce * BRD_SQ_NUM) + sq];
	brd_openingPhase += PiecePhaseValue(pce);

	brd_pList[idx] = sq;
	brd_pIndex[sq] = idx;
	brd_pceNum[pce]++;

	if(PieceKing[pce] === BOOL.TRUE) {
		brd_kingSq[col] = sq;
	}
}



function MovePieceFast(from, to) {
	var pce = brd_pieces[from];
	var col = PieceCol[pce];

	var idx = brd_pIndex[from];
	if (DEBUG_VALIDATE_FAST && idx < 0) {
		
	throw new Error(
		"brd_pIndex corrupt in MovePieceFast @ " + from +
		" (" + PrSq(from) + ") piece=" + PceChar[pce]
	);
	}


	var pstBase = pce * BRD_SQ_NUM;
	brd_pst[col] += (PST[pstBase + to] - PST[pstBase + from]);

	HASH_PCE(pce, from);
	HASH_PAWN(pce, from);
	brd_pieces[from] = PIECES.EMPTY;

	HASH_PCE(pce, to);
	HASH_PAWN(pce, to);
	brd_pieces[to] = pce;
	BBMovePieceSquare(pce, from, to);

	brd_pList[idx] = to;
	brd_pIndex[to] = idx;
	brd_pIndex[from] = -1;

	if(PieceKing[pce] === BOOL.TRUE) {
		brd_kingSq[col] = to;
	}
}

function MakeMoveFast(move) {
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var side = brd_side;
	var movingPiece = brd_pieces[from];
	var pr = (move >>> 20) & 0xF;

	if((move & MFLAGCA) !== 0) {
		if(side === COLOURS.WHITE) {
			if(from !== SQUARES.E1 || movingPiece !== PIECES.wK) return BOOL.FALSE;
			if(to === SQUARES.G1 && brd_pieces[SQUARES.H1] !== PIECES.wR) return BOOL.FALSE;
			if(to === SQUARES.C1 && brd_pieces[SQUARES.A1] !== PIECES.wR) return BOOL.FALSE;
		} else {
			if(from !== SQUARES.E8 || movingPiece !== PIECES.bK) return BOOL.FALSE;
			if(to === SQUARES.G8 && brd_pieces[SQUARES.H8] !== PIECES.bR) return BOOL.FALSE;
			if(to === SQUARES.C8 && brd_pieces[SQUARES.A8] !== PIECES.bR) return BOOL.FALSE;
		}
	}

	// Save for repetition/debug
	brd_history_posKey[brd_hisPly] = brd_posKey;
	brd_history_posKeyHi[brd_hisPly] = brd_posKeyHi;

	// Special captures / castling rook move (must happen before moving king piece)
	if((move & MFLAGEP) !== 0) {
		if(side === COLOURS.WHITE) ClearPieceFast(to - 10);
		else ClearPieceFast(to + 10);
	} else if((move & MFLAGCA) !== 0) {
		switch(to) {
			case SQUARES.C1: MovePieceFast(SQUARES.A1, SQUARES.D1); break;
			case SQUARES.C8: MovePieceFast(SQUARES.A8, SQUARES.D8); break;
			case SQUARES.G1: MovePieceFast(SQUARES.H1, SQUARES.F1); break;
			case SQUARES.G8: MovePieceFast(SQUARES.H8, SQUARES.F8); break;
			default: break;
		}
	}

	// Hash out old EP / old castle
	if(brd_enPas !== SQUARES.NO_SQ) HASH_EP();
	HASH_CA();

	// Store undo info
	brd_history_move[brd_hisPly] = move;
	brd_history_fiftyMove[brd_hisPly] = brd_fiftyMove;
	brd_history_fullMoveNumber[brd_hisPly] = brd_fullMoveNumber;
	brd_history_enPas[brd_hisPly] = brd_enPas;
	brd_history_castlePerm[brd_hisPly] = brd_castlePerm;
	brd_history_contextPiece[brd_hisPly] = (pr !== PIECES.EMPTY) ? pr : movingPiece;

	// Update castle rights + reset EP
	brd_castlePerm &= CastlePerm[from];
	brd_castlePerm &= CastlePerm[to];
	brd_enPas = SQUARES.NO_SQ;

	// Hash in new castle
	HASH_CA();

	// 50-move
	brd_fiftyMove++;

	// Normal capture (EP was already handled above)
	var captured = (move >>> 14) & 0xF;
	if(captured !== PIECES.EMPTY) {
		ClearPieceFast(to);
		brd_fiftyMove = 0;
	}

	brd_hisPly++;
	if(srch_searching === BOOL.TRUE) brd_ply++;

	// Pawn logic before moving piece (needs piece at 'from')
	if(PiecePawn[movingPiece] === BOOL.TRUE) {
		brd_fiftyMove = 0;
		if((move & MFLAGPS) !== 0) {
			brd_enPas = (side === COLOURS.WHITE) ? (from + 10) : (from - 10);
			HASH_EP();
		}
	}

	// Move piece
	MovePieceFast(from, to);

	// Promotion
	if(pr !== PIECES.EMPTY) {
		ClearPieceFast(to);
		AddPieceFast(to, pr);
	}

	// Fullmove number
	if(side === COLOURS.BLACK) brd_fullMoveNumber++;

	// Side to move
	brd_side ^= 1;
	HASH_SIDE();

	// Legality: did we leave our own king in check?
	var kingInCheck = (side === COLOURS.WHITE) ?
		SqAttackedByBlack(brd_kingSq[side]) :
		SqAttackedByWhite(brd_kingSq[side]);
	if(kingInCheck === BOOL.TRUE) {
		TakeMoveFast();
		return BOOL.FALSE;
	}

	if(DEBUG_VALIDATE_FAST) {
		AssertStateLight("MakeMoveFast");
	}
	return BOOL.TRUE;
}

function TakeMoveFast() {
	brd_hisPly--;
	if(srch_searching === BOOL.TRUE && brd_ply > 0) brd_ply--;

	var move = brd_history_move[brd_hisPly];
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;

	// Hash out current EP/castle
	if(brd_enPas !== SQUARES.NO_SQ) HASH_EP();
	HASH_CA();

	// Restore state
	brd_castlePerm = brd_history_castlePerm[brd_hisPly];
	brd_fiftyMove = brd_history_fiftyMove[brd_hisPly];
	brd_fullMoveNumber = brd_history_fullMoveNumber[brd_hisPly];
	brd_enPas = brd_history_enPas[brd_hisPly];

	// Hash in restored EP/castle
	if(brd_enPas !== SQUARES.NO_SQ) HASH_EP();
	HASH_CA();

	// Restore side
	brd_side ^= 1;
	HASH_SIDE();

	// Undo EP capture / undo castling rook
	if((move & MFLAGEP) !== 0) {
		if(brd_side === COLOURS.WHITE) AddPieceFast(to - 10, PIECES.bP);
		else AddPieceFast(to + 10, PIECES.wP);
	} else if((move & MFLAGCA) !== 0) {
		switch(to) {
			case SQUARES.C1: MovePieceFast(SQUARES.D1, SQUARES.A1); break;
			case SQUARES.C8: MovePieceFast(SQUARES.D8, SQUARES.A8); break;
			case SQUARES.G1: MovePieceFast(SQUARES.F1, SQUARES.H1); break;
			case SQUARES.G8: MovePieceFast(SQUARES.F8, SQUARES.H8); break;
			default: break;
		}
	}

	// Move back the main piece
	MovePieceFast(to, from);

	// Restore captured piece
	var captured = (move >>> 14) & 0xF;
	if(captured !== PIECES.EMPTY) {
		AddPieceFast(to, captured);
	}

	// Undo promotion
	var pr = (move >>> 20) & 0xF;
	if(pr !== PIECES.EMPTY) {
		ClearPieceFast(from);
		AddPieceFast(from, (PieceCol[pr] === COLOURS.WHITE) ? PIECES.wP : PIECES.bP);
	}

	if(DEBUG_VALIDATE_FAST) {
		AssertStateLight("TakeMoveFast");
	}
}


var UserMove = {};
UserMove.from = SQUARES.NO_SQ;
UserMove.to = SQUARES.NO_SQ;

var MirrorFiles = new Int8Array([ FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A ]);
var MirrorRanks = new Int8Array([ RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1 ]);

function MIRROR120(sq) {
	var file = MirrorFiles[FilesBrd[sq]];
	var rank = MirrorRanks[RanksBrd[sq]];
	return FR2SQ(file,rank);
}

function Clamp(value, min, max) {
	if(value < min) return min;
	if(value > max) return max;
	return value;
}

function ResetRootPly() {
	// brd_ply tracks search depth and must be 0 for the live game position.
	brd_ply = 0;
	brd_moveListStart[0] = 0;
}

function CreateBoardStateBuffer() {
	return {
		side: COLOURS.WHITE,
		enPas: SQUARES.NO_SQ,
		fiftyMove: 0,
		fullMoveNumber: 1,
		ply: 0,
		hisPly: 0,
		castlePerm: 0,
		posKey: 0 >>> 0,
		posKeyHi: 0 >>> 0,
		pawnKey: 0 >>> 0,
		pawnKeyHi: 0 >>> 0,
		openingPhase: 0,
		pieces: new Int16Array(BRD_SQ_NUM),
		pceNum: new Int8Array(13),
		material: new Int32Array(2),
		pList: new Int16Array(14 * 10),
		pIndex: new Int16Array(BRD_SQ_NUM),
		kingSq: new Int16Array(2),
		pst: new Int32Array(2),
		bbLo: new Uint32Array(BB_PIECE_COUNT),
		bbHi: new Uint32Array(BB_PIECE_COUNT),
		occLo: new Uint32Array(3),
		occHi: new Uint32Array(3),
		moveListStart: new Int32Array(MAXDEPTH + 1),
		history_move: new Int32Array(MAXGAMEMOVES),
		history_castlePerm: new Int16Array(MAXGAMEMOVES),
		history_enPas: new Int16Array(MAXGAMEMOVES),
		history_fiftyMove: new Int16Array(MAXGAMEMOVES),
		history_fullMoveNumber: new Int32Array(MAXGAMEMOVES),
		history_posKey: new Uint32Array(MAXGAMEMOVES),
		history_posKeyHi: new Uint32Array(MAXGAMEMOVES),
		history_contextPiece: new Int8Array(MAXGAMEMOVES)
	};
}

var SearchBoardStateBuffer = CreateBoardStateBuffer();

function CaptureBoardState(state, includeHistory) {
	var snapshot = state || SearchBoardStateBuffer;
	var copyHistory = (includeHistory !== false);
	snapshot.side = brd_side;
	snapshot.enPas = brd_enPas;
	snapshot.fiftyMove = brd_fiftyMove;
	snapshot.fullMoveNumber = brd_fullMoveNumber;
	snapshot.ply = brd_ply;
	snapshot.hisPly = brd_hisPly;
	snapshot.castlePerm = brd_castlePerm;
	snapshot.posKey = brd_posKey;
	snapshot.posKeyHi = brd_posKeyHi;
	snapshot.pawnKey = brd_pawnKey;
	snapshot.pawnKeyHi = brd_pawnKeyHi;
	snapshot.openingPhase = brd_openingPhase;
	snapshot.pieces.set(brd_pieces);
	snapshot.pceNum.set(brd_pceNum);
	snapshot.material.set(brd_material);
	snapshot.pList.set(brd_pList);
	snapshot.pIndex.set(brd_pIndex);
	snapshot.kingSq.set(brd_kingSq);
	snapshot.pst.set(brd_pst);
	snapshot.bbLo.set(brd_bbLo);
	snapshot.bbHi.set(brd_bbHi);
	snapshot.occLo.set(brd_occLo);
	snapshot.occHi.set(brd_occHi);
	snapshot.moveListStart.set(brd_moveListStart);
	if(copyHistory) {
		snapshot.history_move.set(brd_history_move);
		snapshot.history_castlePerm.set(brd_history_castlePerm);
		snapshot.history_enPas.set(brd_history_enPas);
		snapshot.history_fiftyMove.set(brd_history_fiftyMove);
		snapshot.history_fullMoveNumber.set(brd_history_fullMoveNumber);
		snapshot.history_posKey.set(brd_history_posKey);
		snapshot.history_posKeyHi.set(brd_history_posKeyHi);
		snapshot.history_contextPiece.set(brd_history_contextPiece);
	}
	return snapshot;
}

function RestoreBoardState(state, includeHistory) {
	var restoreHistory = (includeHistory !== false);
	brd_side = state.side;
	brd_enPas = state.enPas;
	brd_fiftyMove = state.fiftyMove;
	brd_fullMoveNumber = state.fullMoveNumber;
	brd_ply = state.ply;
	brd_hisPly = state.hisPly;
	brd_castlePerm = state.castlePerm;
	brd_posKey = state.posKey;
	brd_posKeyHi = state.posKeyHi;
	brd_pawnKey = state.pawnKey;
	brd_pawnKeyHi = state.pawnKeyHi;
	brd_openingPhase = state.openingPhase;
	brd_pieces.set(state.pieces);
	brd_pceNum.set(state.pceNum);
	brd_material.set(state.material);
	brd_pList.set(state.pList);
	brd_pIndex.set(state.pIndex);
	brd_kingSq.set(state.kingSq);
	brd_pst.set(state.pst);
	if(state.bbLo && state.bbHi && state.occLo && state.occHi) {
		brd_bbLo.set(state.bbLo);
		brd_bbHi.set(state.bbHi);
		brd_occLo.set(state.occLo);
		brd_occHi.set(state.occHi);
	} else {
		BBRebuildFromBoard();
	}
	brd_moveListStart.set(state.moveListStart);
	if(restoreHistory) {
		brd_history_move.set(state.history_move);
		brd_history_castlePerm.set(state.history_castlePerm);
		brd_history_enPas.set(state.history_enPas);
		brd_history_fiftyMove.set(state.history_fiftyMove);
		brd_history_fullMoveNumber.set(state.history_fullMoveNumber);
		brd_history_posKey.set(state.history_posKey);
		brd_history_posKeyHi.set(state.history_posKeyHi);
		brd_history_contextPiece.set(state.history_contextPiece);
	}
}

function GetSkillProfile() {
	return SkillProfiles[EngineSettings.skillLevel] || SkillProfiles[5];
}

function GetEffectiveSearchBudget() {
	var profile = GetSkillProfile();
	var depth = profile.maxDepth;
	var timeMs = profile.baseTimeMs;
	var softTimeMs = profile.baseTimeMs;
	if(typeof profile.fixedTimeMs === "number") {
		timeMs = profile.fixedTimeMs;
		depth = MAXDEPTH;
	}
	if(typeof profile.maxTimeMs === "number") {
		timeMs = profile.maxTimeMs;
	}
	if(EngineSettings.timeCapMs !== null) {
		timeMs = Math.min(timeMs, EngineSettings.timeCapMs);
	}
	timeMs = Clamp(timeMs, 25, 60000);
	softTimeMs = Clamp(Math.min(softTimeMs, timeMs), 25, timeMs);
	return {
		depth: depth,
		timeMs: timeMs,
		softTimeMs: softTimeMs,
		adaptiveTime: profile.adaptiveTime === true,
		useBook: profile.useBook
	};
}

function IsHumanTurn(side) {
	if(EngineSettings.gameMode === GAME_MODES.HUMAN_VS_HUMAN) return true;
	if(EngineSettings.gameMode === GAME_MODES.ENGINE_VS_ENGINE) return false;
	if(EngineSettings.gameMode === GAME_MODES.HUMAN_WHITE) return side === COLOURS.WHITE;
	if(EngineSettings.gameMode === GAME_MODES.HUMAN_BLACK) return side === COLOURS.BLACK;
	return true;
}

function IsEngineTurn(side) {
	return IsHumanTurn(side) === false;
}

function ComputeSquareSize() {
	var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
	var targetBoard = viewportWidth >= 1180 ? 560 : Math.floor((viewportWidth - 32));
	targetBoard = Clamp(targetBoard, 352, 560);
	return Clamp(Math.floor(targetBoard / 8), 44, 60);
}

function ApplyBoardSize() {
	GameController.SquareSize = ComputeSquareSize();
	var boardPx = GameController.SquareSize * 8;
	$("#Board").css({
		width: boardPx + "px",
		height: boardPx + "px"
	});
}

function EnsureBoardOverlay() {
	if(typeof document === "undefined" || typeof document.createElementNS !== "function") {
		return;
	}
	var boardPx = GameController.SquareSize * 8;
	var $overlay = $("#BoardOverlay");
	if($overlay.length === 0) {
		var ns = "http://www.w3.org/2000/svg";
		var svg = document.createElementNS(ns, "svg");
		svg.setAttribute("id", "BoardOverlay");
		svg.setAttribute("class", "board-overlay");
		svg.setAttribute("viewBox", "0 0 " + boardPx + " " + boardPx);
		svg.setAttribute("width", boardPx);
		svg.setAttribute("height", boardPx);

		var defs = document.createElementNS(ns, "defs");
		var marker = document.createElementNS(ns, "marker");
		marker.setAttribute("id", "boardArrowHead");
		marker.setAttribute("markerUnits", "userSpaceOnUse");
		marker.setAttribute("markerWidth", "7");
		marker.setAttribute("markerHeight", "7");
		marker.setAttribute("refX", "5.6");
		marker.setAttribute("refY", "3");
		marker.setAttribute("orient", "auto");

		var tip = document.createElementNS(ns, "path");
		tip.setAttribute("d", "M0,0 L6,3 L0,6 z");
		tip.setAttribute("fill", "context-stroke");
		marker.appendChild(tip);
		defs.appendChild(marker);
		svg.appendChild(defs);
		$("#Board").append(svg);
		$overlay = $("#BoardOverlay");
	} else {
		$overlay.attr("viewBox", "0 0 " + boardPx + " " + boardPx);
		$overlay.attr("width", boardPx);
		$overlay.attr("height", boardPx);
	}
}

function ToDisplaySquare(sq) {
	if(GameController.BoardFlipped == BOOL.TRUE) {
		return MIRROR120(sq);
	}
	return sq;
}

function GetSquareCenterPxFromInternalSq(sq) {
	var displaySq = ToDisplaySquare(sq);
	var file = FilesBrd[displaySq];
	var rank = RanksBrd[displaySq];
	var px = GameController.SquareSize;
	return {
		x: (file * px) + (px / 2),
		y: ((7 - rank) * px) + (px / 2)
	};
}

function ClearTopMoveArrows() {
	$("#BoardOverlay .analysis-arrow").remove();
}

function RenderTopMoveArrows(topMoves) {
	EnsureBoardOverlay();
	ClearTopMoveArrows();
	if(!topMoves || topMoves.length === 0) return;

	var showAllBookMoves = true;
	for(var modeIdx = 0; modeIdx < topMoves.length; ++modeIdx) {
		if(topMoves[modeIdx].isBook !== true) {
			showAllBookMoves = false;
			break;
		}
	}
	var arrowLimit = showAllBookMoves ? topMoves.length : Math.min(topMoves.length, 3);
	var topColors = ["#ef6f1a", "#23a2bd", "#2a9368"];
	var ns = "http://www.w3.org/2000/svg";
	var baseWidth = Math.max(2.2, GameController.SquareSize * 0.08);

	for(var i = 0; i < arrowLimit; ++i) {
		var move = topMoves[i].move;
		if(move == NOMOVE) continue;
		var from = move & 0x7F;
		var to = (move >>> 7) & 0x7F;
		var fromPt = GetSquareCenterPxFromInternalSq(from);
		var toPt = GetSquareCenterPxFromInternalSq(to);
		var dx = toPt.x - fromPt.x;
		var dy = toPt.y - fromPt.y;
		var len = Math.sqrt((dx * dx) + (dy * dy));
		var startPad = GameController.SquareSize * 0.16;
		var endPad = GameController.SquareSize * 0.24;

		var x1 = fromPt.x;
		var y1 = fromPt.y;
		var x2 = toPt.x;
		var y2 = toPt.y;

		if(len > (startPad + endPad + 2)) {
			var ux = dx / len;
			var uy = dy / len;
			x1 = fromPt.x + (ux * startPad);
			y1 = fromPt.y + (uy * startPad);
			x2 = toPt.x - (ux * endPad);
			y2 = toPt.y - (uy * endPad);
		}

		var line = document.createElementNS(ns, "line");
		line.setAttribute("class", "analysis-arrow");
		line.setAttribute("x1", x1.toFixed(2));
		line.setAttribute("y1", y1.toFixed(2));
		line.setAttribute("x2", x2.toFixed(2));
		line.setAttribute("y2", y2.toFixed(2));
		var strokeColor;
		if(showAllBookMoves) {
			var hue = (i * 137.508) % 360;
			strokeColor = "hsl(" + hue.toFixed(1) + ", 78%, 50%)";
		} else {
			strokeColor = topColors[i];
		}
		line.setAttribute("stroke", strokeColor);
		var width = showAllBookMoves ? Math.max(baseWidth * 0.42, baseWidth * (1 - (i * 0.04))) :
			(i === 0 ? baseWidth : (i === 1 ? baseWidth * 0.78 : baseWidth * 0.62));
		line.setAttribute("stroke-width", width.toFixed(2));
		line.setAttribute("stroke-linecap", "round");
		line.setAttribute("stroke-linejoin", "round");
		line.setAttribute("shape-rendering", "geometricPrecision");
		var opacity = showAllBookMoves ? Math.max(0.38, 0.9 - (i * 0.035)) :
			(i === 0 ? 0.9 : (i === 1 ? 0.74 : 0.62));
		line.setAttribute("opacity", opacity.toFixed(2));
		line.setAttribute("marker-end", "url(#boardArrowHead)");
		$("#BoardOverlay").append(line);
	}
}

function SetThinkingState(isThinking) {
	srch_thinking = isThinking ? BOOL.TRUE : BOOL.FALSE;
	if(isThinking) {
		CancelBackgroundEval();
	} else {
		ScheduleBackgroundEval(true);
	}
	var $chip = $("#EngineThinking");
	if($chip.length === 0) return;
	if(isThinking) {
		$chip.removeClass("idle").addClass("thinking").text("Engine thinking...");
	} else {
		$chip.removeClass("thinking").addClass("idle").text("Idle");
	}
}

function ParseTimeCapValue(rawValue) {
	if(rawValue === "auto") return null;
	var parsed = parseInt(rawValue, 10);
	if(isNaN(parsed)) return null;
	return parsed;
}

function ParseAnalysisSide(rawValue) {
	if(rawValue === "black") return COLOURS.BLACK;
	return COLOURS.WHITE;
}

function UpdateHintToggleButton() {
	var enabled = (EngineSettings.autoAnalyze === true);
	var $btn = $("#HintToggleButton");
	if($btn.length === 0) return;
	$btn.text(enabled ? "Hints: On" : "Hints: Off");
	$btn.attr("aria-pressed", enabled ? "true" : "false");
}

function ClearAnalysisOutput() {
	ClearLastSearchResult();
	ClearTopMoveArrows();
	$("#EvalBar").removeClass("eval-pulse eval-up eval-down horizontal");
	$("#TopMovesList").empty();
	$("#EvalScoreOut").text("+0.00");
	$("#EvalBarFill").css("height", "50%");
	$("#EvalBarFill").css("width", "100%");
	EvalBarRenderState.fillPercent = 50;
	EvalBarRenderState.text = "+0.00";
	EvalBarRenderState.horizontal = false;
	$("#BestOut").text("BestMove:");
	$("#DepthOut").text("Depth:");
	$("#ScoreOut").text("Score:");
	$("#NodesOut").text("Nodes:");
	$("#TimeOut").text("Time:");
	$("#PvLineOut").text("PV:");
}

function InitControlDefaults() {
	$("#GameModeChoice").val(EngineSettings.gameMode);
	$("#AnalysisSideChoice").val(EngineSettings.analysisSide == COLOURS.BLACK ? "black" : "white");
	$("#SkillChoice").val(String(EngineSettings.skillLevel));
	$("#ThinkTimeChoice").val("auto");
	UpdateHintToggleButton();
}

$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val();
	if(ParseFen(fenStr) != BOOL.TRUE) {
		$("#GameStatus").text("Invalid FEN");
		return;
	}
	$("#GameStatus").text("");
	PrintBoard();		
	SetInitialBoardPieces();	
	ClearLastSearchResult();
	ClearTopMoveArrows();
	CheckAndSet();	
	EvalPosition();	
	newGameAjax();
	MaybeTriggerEngineTurn();
});

function CheckResult() {

    if (brd_fiftyMove >= 100) {
     $("#GameStatus").text("GAME DRAWN {fifty move rule}"); 
     return BOOL.TRUE;
    }

    if (ThreeFoldRep() >= 2) {
     $("#GameStatus").text("GAME DRAWN {3-fold repetition}"); 
     return BOOL.TRUE;
    }
	
	if (DrawMaterial() == BOOL.TRUE) {
     $("#GameStatus").text("GAME DRAWN {insufficient material to mate}"); 
     return BOOL.TRUE;
    }
	
	DebugLog('Checking end of game');
	GenerateMoves();
      
    var MoveNum = 0;
	var found = 0;
	for(MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum)  {	
       
        if ( MakeMove(brd_moveList[MoveNum]) == BOOL.FALSE)  {
            continue;
        }
        found++;
		TakeMove();
		break;
    }
    
    $("#currentFenSpan").text(BoardToFen()); 
	
	if(found != 0) return BOOL.FALSE;
	var InCheck = SqAttacked(brd_kingSq[brd_side], brd_side^1);
	DebugLog('No Move Found, incheck:' + InCheck);
	
	if(InCheck == BOOL.TRUE)	{
	    if(brd_side == COLOURS.WHITE) {
	      $("#GameStatus").text("GAME OVER {black mates}");return BOOL.TRUE;
        } else {
	      $("#GameStatus").text("GAME OVER {white mates}");return BOOL.TRUE;
        }
    } else {
      $("#GameStatus").text("GAME DRAWN {stalemate}");return BOOL.TRUE;
    }	
    DebugLog('Returning False');
	return BOOL.FALSE;	
}

function ClickedSquare(pageX, pageY) {
	var offset = $("#Board").offset();
	var boardSize = GameController.SquareSize;
	var relX = Math.floor(pageX - offset.left);
	var relY = Math.floor(pageY - offset.top);
	var file = Math.floor(relX / boardSize);
	var rank = 7 - Math.floor(relY / boardSize);

	if(file < 0 || file > 7 || rank < 0 || rank > 7) {
		return SQUARES.NO_SQ;
	}

	var sq = FR2SQ(file,rank);

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	SetSqSelected(sq);
	return sq;

}

function CheckAndSet() {
	ResetRootPly();
	if(CheckResult() != BOOL.TRUE) {
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');		
	} else {
		GameController.GameOver = BOOL.TRUE;
		GameController.GameSaved = BOOL.TRUE;
	}
	 $("#currentFenSpan").text(BoardToFen());
	if(ShouldAutoAnalyzePosition() !== true && srch_thinking == BOOL.FALSE && HasCurrentAnalysisResult() !== true) {
		var override = GetEvalOverride();
		if(override) {
			RenderEvalOnly(override.score, override.side);
		} else {
			RenderEvalOnly(EvalPosition(), brd_side);
		}
	}
}

function ShouldAutoAnalyzePosition() {
	if(EngineSettings.autoAnalyze !== true) return false;
	if(GameController.GameOver == BOOL.TRUE) return false;
	if(IsEngineTurn(brd_side)) return false;
	if(EngineSettings.gameMode === GAME_MODES.HUMAN_VS_HUMAN && brd_side !== EngineSettings.analysisSide) {
		return false;
	}
	return true;
}

function CancelContinuousAnalysis() {
	ContinuousAnalysisState.token++;
}

function ScheduleContinuousAnalysis() {
	if(ShouldAutoAnalyzePosition() !== true) return;
	if(srch_thinking == BOOL.TRUE) return;
	var fen = BoardToFen();
	var token = ++ContinuousAnalysisState.token;
	setTimeout(function() {
		if(token !== ContinuousAnalysisState.token) return;
		if(ShouldAutoAnalyzePosition() !== true) return;
		if(srch_thinking == BOOL.TRUE) return;
		if(BoardToFen() !== fen) return;
		RunSearch(false);
	}, 160);
}

function ShouldBackgroundEval() {
	if(EngineSettings.backgroundEval !== true) return false;
	if(ShouldAutoAnalyzePosition() === true) return false;
	if(GameController.GameOver == BOOL.TRUE) return false;
	if(srch_thinking == BOOL.TRUE) return false;
	if(srch_searching == BOOL.TRUE) return false;
	if(BackgroundEvalState.running === true) return false;
	if(EngineWorkerController.activeRequest) return false;
	if(HasCurrentAnalysisResult() === true) {
		var targetDepth = parseInt(EngineSettings.backgroundEvalDepth, 10);
		if(isNaN(targetDepth) || targetDepth < 1) targetDepth = 1;
		var lastDepth = 0;
		if(GameController.LastSearchResult && typeof GameController.LastSearchResult.depth === "number") {
			lastDepth = GameController.LastSearchResult.depth;
		}
		if(lastDepth >= targetDepth) {
			return false;
		}
	}
	var override = GetEvalOverride();
	if(override) {
		var overrideDepth = typeof override.depth === "number" ? override.depth : 0;
		var targetDepthOverride = parseInt(EngineSettings.backgroundEvalDepth, 10);
		if(isNaN(targetDepthOverride) || targetDepthOverride < 1) targetDepthOverride = 1;
		if(overrideDepth >= targetDepthOverride) {
			return false;
		}
	}
	return true;
}

function CancelBackgroundEval() {
	BackgroundEvalState.token++;
	if(BackgroundEvalState.timer) {
		clearTimeout(BackgroundEvalState.timer);
		BackgroundEvalState.timer = null;
	}
}

function RunBackgroundEvalOnce() {
	if(BackgroundEvalState.running === true) return null;
	BackgroundEvalState.running = true;
	var savedDepth = srch_depth;
	var savedTime = srch_time;
	var savedStart = srch_start;
	var savedStop = srch_stop;
	try {
		var depth = parseInt(EngineSettings.backgroundEvalDepth, 10);
		if(isNaN(depth) || depth < 1) depth = 1;
		var timeMs = parseInt(EngineSettings.backgroundEvalTimeMs, 10);
		if(isNaN(timeMs) || timeMs < 25) timeMs = 25;
		srch_depth = depth;
		srch_time = Clamp(timeMs, 25, 2000);
		var result = SearchPosition({
			useBook: false,
			fastPlay: true,
			renderAnalysis: false,
			multiPvCount: 1,
			reportProgress: false
		});
		if(result && typeof result.bestScore === "number") {
			if(HasCurrentAnalysisResult() === true) {
				var lastDepth = (GameController.LastSearchResult && typeof GameController.LastSearchResult.depth === "number")
					? GameController.LastSearchResult.depth
					: 0;
				var bgDepth = (typeof result.depth === "number") ? result.depth : depth;
				if(GameController.LastSearchFenKey === CurrentFenKey() && lastDepth >= bgDepth) {
					return result;
				}
			}
			RenderEvalOnly(result.bestScore, result.side);
		}
		return result;
	} catch(err) {
		if(typeof console !== "undefined" && typeof console.warn === "function") {
			console.warn("Background eval failed:", err && err.message ? err.message : err);
		}
		return null;
	} finally {
		BackgroundEvalState.running = false;
		srch_depth = savedDepth;
		srch_time = savedTime;
		srch_start = savedStart;
		srch_stop = savedStop;
	}
}

function ScheduleBackgroundEval(immediate) {
	if(BackgroundEvalState.timer) {
		clearTimeout(BackgroundEvalState.timer);
		BackgroundEvalState.timer = null;
	}
	if(ShouldBackgroundEval() !== true) return;
	var interval = parseInt(EngineSettings.backgroundEvalIntervalMs, 10);
	if(isNaN(interval) || interval < 200) interval = 750;
	var delay = immediate === true ? 60 : interval;
	var token = ++BackgroundEvalState.token;
	BackgroundEvalState.timer = setTimeout(function() {
		if(token !== BackgroundEvalState.token) return;
		BackgroundEvalState.timer = null;
		if(ShouldBackgroundEval() !== true) return;
		var fen = BoardToFen();
		var elapsed = NowMs() - BackgroundEvalState.lastEvalAt;
		if(fen !== BackgroundEvalState.lastFen || elapsed >= interval) {
			RunBackgroundEvalOnce();
			BackgroundEvalState.lastFen = fen;
			BackgroundEvalState.lastEvalAt = NowMs();
		}
		ScheduleBackgroundEval(false);
	}, delay);
}

function MaybeTriggerEngineTurn() {
	if(GameController.GameOver == BOOL.TRUE || srch_thinking == BOOL.TRUE) return;
	if(IsEngineTurn(brd_side)) {
		RunSearch(true);
		return;
	}
	if(ShouldAutoAnalyzePosition() === true) {
		RunSearch(false);
		return;
	}
	ScheduleBackgroundEval(true);
}

function NextWorkerRequestId() {
	var requestId = EngineWorkerController.nextRequestId++;
	if(EngineWorkerController.nextRequestId > 1000000000) {
		EngineWorkerController.nextRequestId = 1;
	}
	return requestId;
}

function ApplySearchOutcome(makeMove, result) {
	SetLastSearchResult(result);
	if(makeMove === true && result.playMove != NOMOVE && GameController.GameOver != BOOL.TRUE) {
		ResetRootPly();
		var moveToPlay = EnsurePlayableMove(result.playMove);
		if(moveToPlay != NOMOVE && MakeMove(moveToPlay) == BOOL.TRUE) {
			MoveGUIPiece(moveToPlay);
			ClearLastSearchResult();
			if(typeof result.bestScore === "number") {
				var derivedDepth = (typeof result.depth === "number") ? Math.max(0, result.depth - 1) : 0;
				var derivedScore = FlipScoreForSideToMove(result.bestScore);
				SetEvalOverride(derivedScore, brd_side, derivedDepth);
			}
			ClearTopMoveArrows();
			CheckAndSet();
		}
	} else if(makeMove !== true) {
		ScheduleContinuousAnalysis();
	}
}

function RunSearchSync(makeMove, budget, fastPlay, multiPvCount) {
	if(EngineSettings.ttTargetMb !== TT_REQUEST_MB) {
		InitTT(EngineSettings.ttTargetMb);
	}
	srch_depth = budget.depth;
	srch_time = budget.timeMs;
	var prevProgressCallback = SearchProgressCallback;
	SearchProgressCallback = function(progress) {
		if(!progress || typeof progress !== "object") return;
		SafeRenderSearchResult(progress);
	};
	var result = null;
	try {
		result = SearchPosition({
			useBook: budget.useBook,
			fastPlay: fastPlay,
			renderAnalysis: true,
			multiPvCount: multiPvCount,
			reportProgress: true,
			progressThrottleMs: 120,
			adaptiveTime: budget.adaptiveTime === true,
			softTimeMs: budget.softTimeMs
		});
	} catch(err) {
		if(typeof console !== "undefined" && typeof console.warn === "function") {
			console.warn("SearchPosition failed:", err && err.message ? err.message : err);
		}
	} finally {
		SearchProgressCallback = prevProgressCallback;
	}
	if(result) {
		try {
			ApplySearchOutcome(makeMove, result);
		} catch(err) {
			if(typeof console !== "undefined" && typeof console.warn === "function") {
				console.warn("ApplySearchOutcome failed:", err && err.message ? err.message : err);
			}
		}
	}
	SetThinkingState(false);
	if(makeMove === true) {
		MaybeTriggerEngineTurn();
	}
}

function DisableWorkerAndFallback(reason) {
	var pending = EngineWorkerController.activeRequest;
	EngineWorkerController.activeRequest = null;

	if(EngineWorkerController.worker) {
		try {
			EngineWorkerController.worker.terminate();
		} catch(ignore) {}
	}

	EngineWorkerController.enabled = false;
	EngineWorkerController.ready = false;
	EngineWorkerController.worker = null;
	EngineWorkerController.bookSynced = false;
	EngineWorkerController.fallbackReason = reason || "Worker disabled";
	if(typeof console !== "undefined" && typeof console.warn === "function") {
		console.warn("Engine worker disabled, falling back to synchronous search: " + EngineWorkerController.fallbackReason);
	}

	if(!pending) return;

	if(BoardToFen() === pending.fen) {
		RunSearchSync(pending.makeMove, pending.budget, pending.fastPlay, pending.multiPvCount);
	} else {
		SetThinkingState(false);
		MaybeTriggerEngineTurn();
	}
}

function SyncBookToWorker() {
	if(EngineWorkerController.enabled !== true || EngineWorkerController.ready !== true) return;
	if(!EngineWorkerController.worker) return;
	if(EngineWorkerController.bookSynced === true) return;
	if(GameController.BookLoaded != BOOL.TRUE) return;
	try {
		EngineWorkerController.worker.postMessage({
			type: "setBook",
			bookLines: brd_bookLines.slice(0)
		});
		EngineWorkerController.bookSynced = true;
	} catch(err) {
		DisableWorkerAndFallback("Book sync failed: " + (err && err.message ? err.message : err));
	}
}

function HandleWorkerMessage(evt) {
	var data = evt && evt.data ? evt.data : {};
	if(data.type === "ready") {
		EngineWorkerController.ready = true;
		SyncBookToWorker();
		return;
	}

	if(data.type === "error") {
		DisableWorkerAndFallback(data.message || "Worker runtime error");
		return;
	}

	if(data.type === "searchProgress") {
		var pendingProgress = EngineWorkerController.activeRequest;
		if(!pendingProgress || data.requestId !== pendingProgress.requestId) return;
		if(data.fen !== pendingProgress.fen || BoardToFen() !== pendingProgress.fen) {
			return;
		}
		if(data.result && typeof data.result === "object") {
			SafeRenderSearchResult(data.result);
		}
		return;
	}
	if(data.type !== "searchResult") return;

	var pending = EngineWorkerController.activeRequest;
	if(!pending || data.requestId !== pending.requestId) return;

	if(data.fen !== pending.fen || BoardToFen() !== pending.fen) {
		EngineWorkerController.activeRequest = null;
		SetThinkingState(false);
		MaybeTriggerEngineTurn();
		return;
	}

	var result = data.result;
	if(!result || typeof result !== "object") {
		DisableWorkerAndFallback("Malformed search result from worker");
		return;
	}
	EngineWorkerController.activeRequest = null;

	if(result.renderAnalysis !== false) {
		SafeRenderSearchResult(result);
	}

	try {
		ApplySearchOutcome(pending.makeMove, result);
	} catch(err) {
		if(typeof console !== "undefined" && typeof console.warn === "function") {
			console.warn("ApplySearchOutcome failed:", err && err.message ? err.message : err);
		}
	}
	SetThinkingState(false);
	if(pending.makeMove === true) {
		MaybeTriggerEngineTurn();
	}
}

function PostSearchToWorker(payload, pendingRequest) {
	if(EngineWorkerController.enabled !== true || EngineWorkerController.ready !== true) return false;
	if(!EngineWorkerController.worker) return false;
	try {
		EngineWorkerController.worker.postMessage(payload);
		EngineWorkerController.activeRequest = pendingRequest;
		return true;
	} catch(err) {
		DisableWorkerAndFallback("Search dispatch failed: " + (err && err.message ? err.message : err));
		return false;
	}
}

function InitEngineWorkerBridge() {
	EngineWorkerController.enabled = (typeof window !== "undefined" && typeof window.Worker === "function");
	EngineWorkerController.ready = false;
	EngineWorkerController.worker = null;
	EngineWorkerController.activeRequest = null;
	EngineWorkerController.nextRequestId = 1;
	EngineWorkerController.bookSynced = false;
	EngineWorkerController.fallbackReason = "";

	if(EngineWorkerController.enabled !== true) {
		EngineWorkerController.fallbackReason = "Web Worker not supported";
		return;
	}

	try {
		var worker = new Worker("js/engine-worker.js");
		worker.onmessage = HandleWorkerMessage;
		worker.onerror = function(evt) {
			var reason = "Worker runtime error";
			if(evt && evt.message) {
				reason = evt.message;
			}
			DisableWorkerAndFallback(reason);
		};
		EngineWorkerController.worker = worker;
		worker.postMessage({
			type: "init",
			ttTargetMb: EngineSettings.ttTargetMb,
			skillLevel: EngineSettings.skillLevel
		});
	} catch(err) {
		DisableWorkerAndFallback("Worker initialization failed: " + (err && err.message ? err.message : err));
	}
}

function RunSearch(makeMove) {
	if(GameController.GameOver == BOOL.TRUE || srch_thinking == BOOL.TRUE) return;
	SetThinkingState(true);
	setTimeout(function() {
		try {
			ResetRootPly();
			if(makeMove !== true && EngineSettings.autoAnalyze !== true) {
				SetThinkingState(false);
				return;
			}

			var budget = GetEffectiveSearchBudget();
			var fastPlay = (makeMove === true && EngineSettings.fastPlayMode === true);
			var multiPvCount = fastPlay ? 1 : EngineSettings.multiPvCount;

			SyncBookToWorker();
			if(EngineWorkerController.enabled === true && EngineWorkerController.ready === true && EngineWorkerController.worker) {
				var currentFen = BoardToFen();
				var requestId = NextWorkerRequestId();
				var pendingRequest = {
					requestId: requestId,
					fen: currentFen,
					makeMove: (makeMove === true),
					budget: budget,
					fastPlay: fastPlay,
					multiPvCount: multiPvCount
				};
				var payload = {
					type: "search",
					requestId: requestId,
					fen: currentFen,
					search: {
						gameLine: printGameLine(),
						repHistory: BuildRepetitionHistoryPayload(),
						depth: budget.depth,
						timeMs: budget.timeMs,
						softTimeMs: budget.softTimeMs,
						adaptiveTime: budget.adaptiveTime === true,
						reportProgress: true,
						progressThrottleMs: 120,
						useBook: budget.useBook,
						fastPlay: fastPlay,
						renderAnalysis: true,
						multiPvCount: multiPvCount
					},
					settings: {
						skillLevel: EngineSettings.skillLevel,
						ttTargetMb: EngineSettings.ttTargetMb
					}
				};
				if(PostSearchToWorker(payload, pendingRequest) === true) {
					return;
				}
			}

			RunSearchSync(makeMove, budget, fastPlay, multiPvCount);
		} catch(err) {
			if(typeof console !== "undefined" && typeof console.warn === "function") {
				console.warn("RunSearch failed:", err && err.message ? err.message : err);
			}
			SetThinkingState(false);
		}
	}, 40);
}

function MakeUserMove() {
	if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
		DebugLog("User Move:" + PrSq(UserMove.from) + PrSq(UserMove.to));
		ResetRootPly();
		
		var parsed = ParseMove(UserMove.from,UserMove.to);
		
		DeselectSq(UserMove.from);
		DeselectSq(UserMove.to);
		
		DebugLog("Parsed:" + parsed);
		
		if(parsed != NOMOVE) {
			MakeMove(parsed);
			MoveGUIPiece(parsed);
			ClearLastSearchResult();
			ClearTopMoveArrows();
			CheckAndSet();
			MaybeTriggerEngineTurn();
		}
		
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ; 	
	}
}

$(document).on('click','.Piece', function (e) {	
	DebugLog("Piece Click");
	if(srch_thinking == BOOL.FALSE && IsHumanTurn(brd_side)) {
		if(UserMove.from == SQUARES.NO_SQ) 
			UserMove.from = ClickedSquare(e.pageX, e.pageY);
		else 
			UserMove.to = ClickedSquare(e.pageX, e.pageY);	

		if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
			MakeUserMove();
		}
	}	
});

$(document).on('click','.Square', function (e) {	
	DebugLog("Square Click");
	if(srch_thinking == BOOL.FALSE && IsHumanTurn(brd_side) && UserMove.from != SQUARES.NO_SQ) {
		UserMove.to = ClickedSquare(e.pageX, e.pageY);
		if(UserMove.to != SQUARES.NO_SQ) {
			MakeUserMove();
		}
	}
});

function RemoveGUIPiece(sq) {
	$('.Piece[data-sq="' + sq + '"]').remove();
}

function GetPieceSpritePath(pce) {
	return "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
}

function GetSquareTopLeft(sq) {
	var file = FilesBrd[sq];
	var rank = RanksBrd[sq];
	var px = GameController.SquareSize;
	return {
		left: file * px,
		top: (7 - rank) * px
	};
}

function PositionGUIPiece($piece, sq) {
	var coords = GetSquareTopLeft(sq);
	var size = GameController.SquareSize;
	$piece.attr("data-sq", sq);
	$piece.css({
		left: coords.left + "px",
		top: coords.top + "px",
		width: size + "px",
		height: size + "px"
	});
}

function AddGUIPiece(sq,pce) {
	var $piece = $("<img/>", {
		src: GetPieceSpritePath(pce),
		class: "Piece clickElement",
		alt: PceChar[pce],
		"data-sq": sq
	});
	PositionGUIPiece($piece, sq);
	$("#Board").append($piece);
}

function MoveSingleGUIPiece(fromSq, toSq) {
	var $piece = $('.Piece[data-sq="' + fromSq + '"]');
	if($piece.length === 0) {
		return BOOL.FALSE;
	}
	PositionGUIPiece($piece, toSq);
	return BOOL.TRUE;
}

function UpdateGUIPieceAppearanceAtSquare(sq, pce) {
	var $piece = $('.Piece[data-sq="' + sq + '"]');
	if($piece.length === 0) {
		return BOOL.FALSE;
	}
	$piece.attr("src", GetPieceSpritePath(pce));
	$piece.attr("alt", PceChar[pce]);
	return BOOL.TRUE;
}

function MoveGUIPiece(move) {
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var movedSide = brd_side ^ 1;
	var fromDisplay = ToDisplaySquare(from);
	var toDisplay = ToDisplaySquare(to);
	var rookFrom = SQUARES.NO_SQ;
	var rookTo = SQUARES.NO_SQ;

	if((move & MFLAGEP) != 0) {
		var capturedSq = (movedSide == COLOURS.WHITE) ? (to - 10) : (to + 10);
		RemoveGUIPiece(ToDisplaySquare(capturedSq));
	} else if(CAPTURED(move) != PIECES.EMPTY) {
		RemoveGUIPiece(toDisplay);
	}

	if(MoveSingleGUIPiece(fromDisplay, toDisplay) == BOOL.FALSE) {
		SetInitialBoardPieces();
		return;
	}

	if((move & MFLAGCA) != 0) {
		switch(to) {
			case SQUARES.C1: rookFrom = SQUARES.A1; rookTo = SQUARES.D1; break;
			case SQUARES.C8: rookFrom = SQUARES.A8; rookTo = SQUARES.D8; break;
			case SQUARES.G1: rookFrom = SQUARES.H1; rookTo = SQUARES.F1; break;
			case SQUARES.G8: rookFrom = SQUARES.H8; rookTo = SQUARES.F8; break;
			default: break;
		}

		if(rookFrom != SQUARES.NO_SQ) {
			if(MoveSingleGUIPiece(ToDisplaySquare(rookFrom), ToDisplaySquare(rookTo)) == BOOL.FALSE) {
				SetInitialBoardPieces();
				return;
			}
		}
	}

	if(PROMOTED(move) != PIECES.EMPTY) {
		var promotedPiece = brd_pieces[to];
		if(promotedPiece == PIECES.EMPTY || promotedPiece == SQUARES.OFFBOARD) {
			promotedPiece = PROMOTED(move);
		}
		if(UpdateGUIPieceAppearanceAtSquare(toDisplay, promotedPiece) == BOOL.FALSE) {
			SetInitialBoardPieces();
		}
	}
}

function DeselectSq(sq) {

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	$('.Square[data-sq="' + sq + '"]').removeClass('SqSelected');
}

function SetSqSelected(sq) {
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}

	$('.Square[data-sq="' + sq + '"]').addClass('SqSelected');
}

$("#TakeButton").click(function () {	
	DebugLog('TakeBack request... brd_hisPly:' + brd_hisPly);
	if(brd_hisPly > 0) {
		TakeMove();
		brd_ply = 0;
		SetInitialBoardPieces();
		ClearLastSearchResult();
		ClearTopMoveArrows();
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ;
		CheckAndSet();
		MaybeTriggerEngineTurn();
	}
});

$("#SearchButton").click(function () {	
	var makeMove = true;
	if(EngineSettings.gameMode === GAME_MODES.HUMAN_VS_HUMAN) {
		makeMove = false;
	}
	RunSearch(makeMove);
});

$("#HintToggleButton").click(function () {
	EngineSettings.autoAnalyze = !EngineSettings.autoAnalyze;
	UpdateHintToggleButton();
	if(EngineSettings.autoAnalyze !== true) {
		CancelContinuousAnalysis();
		ScheduleBackgroundEval(true);
	}
	if(EngineSettings.autoAnalyze === true) {
		CancelBackgroundEval();
		MaybeTriggerEngineTurn();
	}
});

$("#FlipButton").click(function () {	
	GameController.BoardFlipped ^= 1;
	DebugLog("Flipped:" + GameController.BoardFlipped);
	SetInitialBoardPieces();
	if(GameController.LastSearchResult && GameController.LastSearchResult.topMoves) {
		RenderTopMoveArrows(GameController.LastSearchResult.topMoves);
	}
});

function NewGame() {
	ParseFen(START_FEN);
	PrintBoard();		
	SetInitialBoardPieces();
	ClearLastSearchResult();
	ClearTopMoveArrows();
	CheckAndSet();	
	GameController.GameSaved = BOOL.FALSE;
	UserMove.from = SQUARES.NO_SQ;
	UserMove.to = SQUARES.NO_SQ;
}

$("#NewGameButton").click(function () {	
	NewGame();
	newGameAjax();
	MaybeTriggerEngineTurn();
});

$("#GameModeChoice").change(function() {
	EngineSettings.gameMode = $(this).val();
	UserMove.from = SQUARES.NO_SQ;
	UserMove.to = SQUARES.NO_SQ;
	MaybeTriggerEngineTurn();
});

$("#AnalysisSideChoice").change(function() {
	EngineSettings.analysisSide = ParseAnalysisSide($(this).val());
	MaybeTriggerEngineTurn();
});

$("#SkillChoice").change(function() {
	var parsed = parseInt($(this).val(), 10);
	if(!isNaN(parsed) && SkillProfiles[parsed]) {
		EngineSettings.skillLevel = parsed;
	}
	MaybeTriggerEngineTurn();
});

$("#ThinkTimeChoice").change(function() {
	EngineSettings.timeCapMs = ParseTimeCapValue($(this).val());
	MaybeTriggerEngineTurn();
});

function newGameAjax() {
	console.log('new Game');
}

function initBoardSquares() {
	ApplyBoardSize();
	var px = GameController.SquareSize;
	var board = $("#Board");
	board.empty();
	for(var rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		for(var fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
			var sq = FR2SQ(fileIter, rankIter);
			var light = ((fileIter + rankIter) & 1) == 0;
			var $square = $("<div/>", {
				class: "Square clickElement " + (light ? "Light" : "Dark"),
				"data-sq": sq
			});
			$square.css({
				left: (fileIter * px) + "px",
				top: ((7 - rankIter) * px) + "px",
				width: px + "px",
				height: px + "px"
			});
			board.append($square);
		}
	}
	EnsureBoardOverlay();
}

function RefreshBoardLayout() {
	initBoardSquares();
	SetInitialBoardPieces();
	if(GameController.LastSearchResult && GameController.LastSearchResult.topMoves) {
		RenderTopMoveArrows(GameController.LastSearchResult.topMoves);
	} else {
		ClearTopMoveArrows();
	}
}

function ClearAllPieces() {
	DebugLog("Removing pieces");
	$(".Piece").remove();
}

function SetInitialBoardPieces() {
	var sq;
	var sq120;
	var pce;
	ClearAllPieces();
	for( sq = 0; sq < 64; ++sq) {
		
		sq120 = SQ120(sq);
		
		pce = brd_pieces[sq120];
		
		var displaySq = sq120;
		if(GameController.BoardFlipped == BOOL.TRUE) {
			displaySq = MIRROR120(sq120);
		}

		if(pce>=PIECES.wP && pce<=PIECES.bK) {				
			AddGUIPiece(displaySq, pce);
		}
	}

}
function SqFromAlg(moveAlg) {

	if(moveAlg.length != 2) return SQUARES.NO_SQ;
	
	if(moveAlg[0] > 'h' || moveAlg[0] < 'a' ) return SQUARES.NO_SQ;
	if(moveAlg[1] > '8' || moveAlg[1] < '1' ) return SQUARES.NO_SQ;
	
	var file = moveAlg[0].charCodeAt() - 'a'.charCodeAt();
	var rank = moveAlg[1].charCodeAt() - '1'.charCodeAt();	
	
	return FR2SQ(file,rank);		
}

function PrintMoveList() {
	var index;
	var move;
	console.log("MoveList:");
	
	for(index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
	
		move = brd_moveList[index];	
		console.log("Move:" + (index+1) + " > " + PrMove(move));
		
	}
}

function PrSq(sq) {
	var file = FilesBrd[sq];
	var rank = RanksBrd[sq];
	
	var sqStr = String.fromCharCode('a'.charCodeAt() + file) + String.fromCharCode('1'.charCodeAt() + rank);
	return sqStr;
}

function PrMove(move) {

	var MvStr;
	
	var ff = FilesBrd[FROMSQ(move)];
	var rf = RanksBrd[FROMSQ(move)];
	var ft = FilesBrd[TOSQ(move)];
	var rt = RanksBrd[TOSQ(move)];
	
	MvStr = String.fromCharCode('a'.charCodeAt() + ff) + String.fromCharCode('1'.charCodeAt() + rf) + 
				String.fromCharCode('a'.charCodeAt() + ft) + String.fromCharCode('1'.charCodeAt() + rt)
				
	var promoted = PROMOTED(move);
	
	if(promoted != PIECES.EMPTY) {
		var pchar = 'q';
		if(PieceKnight[promoted] == BOOL.TRUE) {
			pchar = 'n';
		} else if(PieceRookQueen[promoted] == BOOL.TRUE && PieceBishopQueen[promoted] == BOOL.FALSE)  {
			pchar = 'r';
		} else if(PieceRookQueen[promoted] == BOOL.FALSE && PieceBishopQueen[promoted] == BOOL.TRUE)   {
			pchar = 'b';
		}
		 MvStr += pchar;		
	} 	
	return MvStr;
}

function ParseMove(from, to) {
	
    GenerateMoves();     
   
	var Move = NOMOVE;
	var PromPce = PIECES.EMPTY;
	var found = BOOL.FALSE;
	var index = 0;
	for(index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {	
		Move = brd_moveList[index];	
		if(FROMSQ(Move)==from && TOSQ(Move)==to) {
			PromPce = PROMOTED(Move);
			if(PromPce!=PIECES.EMPTY) {
				if( (PromPce==PIECES.wQ && brd_side==COLOURS.WHITE) || (PromPce==PIECES.bQ && brd_side==COLOURS.BLACK) ) {
					found = BOOL.TRUE;
					break;
				}
				continue;
			}
			found = BOOL.TRUE;
			break;
		}
    }
	
	if(found != BOOL.FALSE) {
		if(MakeMove(Move) == BOOL.FALSE) {
			return NOMOVE;
		}
		TakeMove();
		return Move;
	}
	
    return NOMOVE;	
}
$(document).ajaxComplete(function() {
  	
  	
});

$(function() {
    init();
	InitEngineWorkerBridge();
	InitControlDefaults();
    $('#fenIn').val(START_FEN);
    NewGame();
    newGameAjax();
	MaybeTriggerEngineTurn();

	var resizeTimer = null;
	$(window).on('resize orientationchange', function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			RefreshBoardLayout();
		}, 120);
	});

    $.ajax({
        url : "bookXml.xml",
		cache : false,
		dataType: "xml",
		success: function (xml) {				
			console.log("Read success");
			$(xml).find('line').each(function() {	
				var trimmed = $(this).text();
				trimmed = StrTrim(trimmed);						
				brd_bookLines.push(trimmed);
			});
			BuildBookIndex();
			GameController.BookLoaded = BOOL.TRUE;
			SyncBookToWorker();
			$('#LoadingBook').remove();
			console.log("Book length: " + brd_bookLines.length + " entries");
			MaybeTriggerEngineTurn();
		}
    });
});

function InitBoardVars() {

	brd_history_move.fill(NOMOVE);
	brd_history_castlePerm.fill(0);
	brd_history_enPas.fill(SQUARES.NO_SQ);
	brd_history_fiftyMove.fill(0);
	brd_history_fullMoveNumber.fill(1);
	brd_history_posKey.fill(0);
	brd_history_posKeyHi.fill(0);
	brd_history_contextPiece.fill(PIECES.EMPTY);
	
	brd_PvTable_move.fill(NOMOVE);
	brd_PvTable_posKey.fill(0);
	ResetSearchHeuristics();

}

function EvalInit() {
	PawnRanksWhite.fill(0);
	PawnRanksBlack.fill(0);
}

function InitHashKeys() {
    var index = 0;
	hashRandState = HASH_RAND_SEED;
	
	for(index = 0; index < PieceKeys.length; ++index) {				
		PieceKeys[index] = RAND_32();
		PieceKeysHi[index] = RAND_32();
	}
	
	SideKey = RAND_32() >>> 0;
	SideKeyHi = RAND_32() >>> 0;
	
	for(index = 0; index < CastleKeys.length; ++index) {
		CastleKeys[index] = RAND_32();
		CastleKeysHi[index] = RAND_32();
	}
}

function InitSq120To64() {

	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	var sq64 = 0;
	Sq120ToSq64.fill(65);
	Sq64ToSq120.fill(120);
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			Sq64ToSq120[sq64] = sq;
			Sq120ToSq64[sq] = sq64;
			sq64++;
		}
	}

	for(var a64 = 0; a64 < 64; ++a64) {
		var aFile = a64 & 7;
		var aRank = a64 >> 3;
		for(var b64 = 0; b64 < 64; ++b64) {
			var bFile = b64 & 7;
			var bRank = b64 >> 3;
			var fileDist = Math.abs(aFile - bFile);
			var rankDist = Math.abs(aRank - bRank);
			KingDistance64[(a64 << 6) + b64] = (fileDist > rankDist) ? fileDist : rankDist;
		}
	}
	InitBitboardTables();
}

function InitFilesRanksBrd() {
	
	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	var sq64 = 0;
	FilesBrd.fill(SQUARES.OFFBOARD);
	RanksBrd.fill(SQUARES.OFFBOARD);
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			FilesBrd[sq] = file;
			RanksBrd[sq] = rank;
		}
	}
}

function InitPieceDirectionTables() {
	PceDirFlat.fill(0);
	for(var pce = PIECES.wP; pce <= PIECES.bK; ++pce) {
		var dirs = PceDir[pce];
		if(!dirs) continue;
		var base = pce << 3;
		var count = DirNum[pce];
		for(var idx = 0; idx < count; ++idx) {
			PceDirFlat[base + idx] = dirs[idx];
		}
	}
}
InitPieceDirectionTables();

function InitAttacks() {
	KnAttackCount.fill(0);
	KiAttackCount.fill(0);

	for(var sq = 0; sq < BRD_SQ_NUM; ++sq) {
		if(FilesBrd[sq] == SQUARES.OFFBOARD) continue;

		var knBase = sq * 8;
		var knCount = 0;
		for(var i = 0; i < 8; ++i) {
			var t_sq = sq + KnDir[i];
			if(FilesBrd[t_sq] != SQUARES.OFFBOARD) {
				KnAttacks[knBase + knCount] = t_sq;
				knCount++;
			}
		}
		KnAttackCount[sq] = knCount;

		var kiBase = sq * 8;
		var kiCount = 0;
		for(i = 0; i < 8; ++i) {
			var t_sq_ki = sq + KiDir[i];
			if(FilesBrd[t_sq_ki] != SQUARES.OFFBOARD) {
				KiAttacks[kiBase + kiCount] = t_sq_ki;
				kiCount++;
			}
		}
		KiAttackCount[sq] = kiCount;
	}
}

function InitPst() {
	PST.fill(0);

	for(var pce = PIECES.wP; pce <= PIECES.bK; ++pce) {
		var base = pce * BRD_SQ_NUM;
		var isBlack = PieceCol[pce] == COLOURS.BLACK;
		for(var sq = 0; sq < BRD_SQ_NUM; ++sq) {
			if(FilesBrd[sq] == SQUARES.OFFBOARD) continue;
			var sq64 = Sq120ToSq64[sq];
			if(sq64 > 63) continue;
			if(isBlack) sq64 = Mirror64[sq64];

			var value = 0;
			switch(pce) {
				case PIECES.wP: case PIECES.bP: value = PawnTable[sq64]; break;
				case PIECES.wN: case PIECES.bN: value = KnightTable[sq64]; break;
				case PIECES.wB: case PIECES.bB: value = BishopTable[sq64]; break;
				case PIECES.wR: case PIECES.bR: value = RookTable[sq64]; break;
				case PIECES.wQ: case PIECES.bQ: value = QueenTable[sq64]; break;
				default: break;
			}
			PST[base + sq] = value;
		}
	}
}
function InitLmrTable() {
	for(var depth = 0; depth <= MAXDEPTH; ++depth) {
		var depthBase = depth * LMR_TABLE_STRIDE;
		for(var moveNum = 0; moveNum < LMR_MAX_MOVES; ++moveNum) {
			var reduction = 0;
			if(depth >= 2 && moveNum >= 2) {
				var base = (Math.log(depth + 1) * Math.log(moveNum + 1)) / 1.95 - 0.45;
				reduction = Math.floor(base);
				if(reduction < 0) {
					reduction = 0;
				}
			}
			if(reduction > 15) {
				reduction = 15;
			}
			LMR_BASE[depthBase + moveNum] = reduction;
		}
	}
}

function init() {	
	InitFilesRanksBrd();
	InitPieceDirectionTables();
	InitAttacks();
	InitSq120To64();
	InitPst();
	InitLmrTable();
	InitHashKeys();
	InitTT(EngineSettings.ttTargetMb);
	InitBoardVars();
	InitMvvLva();
	initBoardSquares();
	EvalInit();
	SetThinkingState(false);
}
function ClearPiece(sq) {
	var pce = brd_pieces[sq];
	var col = PieceCol[pce];
	var pIndex = brd_pIndex;
	var idx = pIndex[sq];
	var pList = brd_pList;
	var pceCount = brd_pceNum[pce];

	if(idx < 0) {
		for(var i = 0; i < pceCount; ++i) {
			var searchIdx = PCEINDEX(pce, i);
			if(pList[searchIdx] == sq) {
				idx = searchIdx;
				break;
			}
		}
	}

	HASH_PCE(pce, sq);
	HASH_PAWN(pce, sq);

	brd_pieces[sq] = PIECES.EMPTY;
	BBRemovePieceSquare(pce, sq);
	brd_material[col] -= PieceVal[pce];
	brd_pst[col] -= PST[(pce * BRD_SQ_NUM) + sq];
	brd_openingPhase -= PiecePhaseValue(pce);

	var newCount = pceCount - 1;
	var lastIdx = PCEINDEX(pce, newCount);
	var lastSq = pList[lastIdx];
	brd_pceNum[pce] = newCount;

	if(idx != lastIdx) {
		pList[idx] = lastSq;
		pIndex[lastSq] = idx;
	}
	pList[lastIdx] = PIECES.EMPTY;
	pIndex[sq] = -1;
	if(PieceKing[pce] == BOOL.TRUE) {
		brd_kingSq[col] = SQUARES.NO_SQ;
	}
}

function AddPiece(sq, pce) {
	var col = PieceCol[pce];
	var idx = PCEINDEX(pce, brd_pceNum[pce]);

	HASH_PCE(pce, sq);
	HASH_PAWN(pce, sq);

	brd_pieces[sq] = pce;
	BBAddPieceSquare(pce, sq);
	brd_material[col] += PieceVal[pce];
	brd_pst[col] += PST[(pce * BRD_SQ_NUM) + sq];
	brd_openingPhase += PiecePhaseValue(pce);
	brd_pList[idx] = sq;
	brd_pIndex[sq] = idx;
	if(PieceKing[pce] == BOOL.TRUE) {
		brd_kingSq[col] = sq;
	}
	brd_pceNum[pce]++;
}

function MovePiece(from, to) {
	var pce = brd_pieces[from];
	var col = PieceCol[pce];
	var pstBase = pce * BRD_SQ_NUM;
	var pstDelta = PST[pstBase + to] - PST[pstBase + from];
	var idx = brd_pIndex[from];

	if(idx < 0) {
		for(var i = 0; i < brd_pceNum[pce]; ++i) {
			var searchIdx = PCEINDEX(pce, i);
			if(brd_pList[searchIdx] == from) {
				idx = searchIdx;
				break;
			}
		}
	}

	brd_pst[col] += pstDelta;

	HASH_PCE(pce, from);
	HASH_PAWN(pce, from);
	brd_pieces[from] = PIECES.EMPTY;

	HASH_PCE(pce, to);
	HASH_PAWN(pce, to);
	brd_pieces[to] = pce;
	BBMovePieceSquare(pce, from, to);

	brd_pList[idx] = to;
	brd_pIndex[to] = idx;
	brd_pIndex[from] = -1;
	if(PieceKing[pce] == BOOL.TRUE) {
		brd_kingSq[col] = to;
	}
}

function MakeMove(move) {
	if(srch_searching == BOOL.TRUE) return MakeMoveFast(move);
	
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var side = brd_side;
	var movingPiece = brd_pieces[from];
	var targetPiece = brd_pieces[to];
	var captured = (move >>> 14) & 0xF;
	var promoted = PROMOTED(move);

	if(movingPiece == PIECES.EMPTY || movingPiece == SQUARES.OFFBOARD || PieceCol[movingPiece] != side) {
		return BOOL.FALSE;
	}
	if(targetPiece == SQUARES.OFFBOARD) {
		return BOOL.FALSE;
	}
	if((move & MFLAGEP) == 0) {
		if(captured == PIECES.EMPTY) {
			if(targetPiece != PIECES.EMPTY) {
				return BOOL.FALSE;
			}
		} else if(targetPiece != captured) {
			return BOOL.FALSE;
		}
	}
	if(captured != PIECES.EMPTY && PieceKing[captured] == BOOL.TRUE) {
		return BOOL.FALSE;
	}
	if((move & MFLAGEP) == 0 && targetPiece != PIECES.EMPTY && PieceKing[targetPiece] == BOOL.TRUE) {
		return BOOL.FALSE;
	}
	if((move & MFLAGCA) != 0) {
		if(PieceKing[movingPiece] != BOOL.TRUE) {
			return BOOL.FALSE;
		}
		if(side == COLOURS.WHITE) {
			if(from != SQUARES.E1) {
				return BOOL.FALSE;
			}
			if(to == SQUARES.G1) {
				if((brd_castlePerm & CASTLEBIT.WKCA) == 0) return BOOL.FALSE;
				if(brd_pieces[SQUARES.F1] != PIECES.EMPTY || brd_pieces[SQUARES.G1] != PIECES.EMPTY) return BOOL.FALSE;
				if(brd_pieces[SQUARES.H1] != PIECES.wR) return BOOL.FALSE;
				if(SqAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.TRUE || SqAttacked(SQUARES.F1, COLOURS.BLACK) == BOOL.TRUE) return BOOL.FALSE;
			} else if(to == SQUARES.C1) {
				if((brd_castlePerm & CASTLEBIT.WQCA) == 0) return BOOL.FALSE;
				if(brd_pieces[SQUARES.D1] != PIECES.EMPTY || brd_pieces[SQUARES.C1] != PIECES.EMPTY || brd_pieces[SQUARES.B1] != PIECES.EMPTY) return BOOL.FALSE;
				if(brd_pieces[SQUARES.A1] != PIECES.wR) return BOOL.FALSE;
				if(SqAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.TRUE || SqAttacked(SQUARES.D1, COLOURS.BLACK) == BOOL.TRUE) return BOOL.FALSE;
			} else {
				return BOOL.FALSE;
			}
		} else {
			if(from != SQUARES.E8) {
				return BOOL.FALSE;
			}
			if(to == SQUARES.G8) {
				if((brd_castlePerm & CASTLEBIT.BKCA) == 0) return BOOL.FALSE;
				if(brd_pieces[SQUARES.F8] != PIECES.EMPTY || brd_pieces[SQUARES.G8] != PIECES.EMPTY) return BOOL.FALSE;
				if(brd_pieces[SQUARES.H8] != PIECES.bR) return BOOL.FALSE;
				if(SqAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.TRUE || SqAttacked(SQUARES.F8, COLOURS.WHITE) == BOOL.TRUE) return BOOL.FALSE;
			} else if(to == SQUARES.C8) {
				if((brd_castlePerm & CASTLEBIT.BQCA) == 0) return BOOL.FALSE;
				if(brd_pieces[SQUARES.D8] != PIECES.EMPTY || brd_pieces[SQUARES.C8] != PIECES.EMPTY || brd_pieces[SQUARES.B8] != PIECES.EMPTY) return BOOL.FALSE;
				if(brd_pieces[SQUARES.A8] != PIECES.bR) return BOOL.FALSE;
				if(SqAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.TRUE || SqAttacked(SQUARES.D8, COLOURS.WHITE) == BOOL.TRUE) return BOOL.FALSE;
			} else {
				return BOOL.FALSE;
			}
		}
	}
	
	brd_history_posKey[brd_hisPly] = brd_posKey;
	brd_history_posKeyHi[brd_hisPly] = brd_posKeyHi;
	
	if( (move & MFLAGEP) != 0) {
        if(side == COLOURS.WHITE) {
            ClearPiece(to-10);
        } else {
            ClearPiece(to+10);
        }
    } else if ( (move & MFLAGCA) != 0) {
        switch(to) {
            case SQUARES.C1:
                MovePiece(SQUARES.A1, SQUARES.D1);
			break;
            case SQUARES.C8:
                MovePiece(SQUARES.A8, SQUARES.D8);
			break;
            case SQUARES.G1:
                MovePiece(SQUARES.H1, SQUARES.F1);
			break;
            case SQUARES.G8:
                MovePiece(SQUARES.H8, SQUARES.F8);
			break;
            default: break;
        }
    }	
	
	if(brd_enPas != SQUARES.NO_SQ) HASH_EP();
    HASH_CA();
	
	brd_history_move[brd_hisPly] = move;
    brd_history_fiftyMove[brd_hisPly] = brd_fiftyMove;
	brd_history_fullMoveNumber[brd_hisPly] = brd_fullMoveNumber;
    brd_history_enPas[brd_hisPly] = brd_enPas;
    brd_history_castlePerm[brd_hisPly] = brd_castlePerm;
	brd_history_contextPiece[brd_hisPly] = (promoted != PIECES.EMPTY) ? promoted : movingPiece;

    brd_castlePerm &= CastlePerm[from];
    brd_castlePerm &= CastlePerm[to];
    brd_enPas = SQUARES.NO_SQ;

	HASH_CA();
	
    brd_fiftyMove++;
	
	if(captured != PIECES.EMPTY) {
        ClearPiece(to);
        brd_fiftyMove = 0;
    }
	
	brd_hisPly++;
	if(srch_searching == BOOL.TRUE) {
		brd_ply++;
	}
	
	if(PiecePawn[movingPiece] == BOOL.TRUE) {
        brd_fiftyMove = 0;
        if( (move & MFLAGPS) != 0) {
            if(side==COLOURS.WHITE) {
                brd_enPas=from+10;
            } else {
                brd_enPas=from-10;
            }
            HASH_EP();
        }
    }
	
	MovePiece(from, to);
	
	var prPce = promoted;
    if(prPce != PIECES.EMPTY)   {       
        ClearPiece(to);
        AddPiece(to, prPce);
    }

	if(side == COLOURS.BLACK) {
		brd_fullMoveNumber++;
	}
		
	brd_side ^= 1;
    HASH_SIDE();
	
	
	if(SqAttacked(brd_kingSq[side], brd_side))  {
        TakeMove();
        return BOOL.FALSE;
    }
	
	return BOOL.TRUE;	
}


function TakeMove() {
	if(srch_searching == BOOL.TRUE) {
		TakeMoveFast();
		return;
	}

	brd_hisPly--;

	var move = brd_history_move[brd_hisPly];
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;

	if(brd_enPas != SQUARES.NO_SQ) HASH_EP();
	HASH_CA();

	brd_castlePerm = brd_history_castlePerm[brd_hisPly];
	brd_fiftyMove = brd_history_fiftyMove[brd_hisPly];
	brd_fullMoveNumber = brd_history_fullMoveNumber[brd_hisPly];
	brd_enPas = brd_history_enPas[brd_hisPly];

	if(brd_enPas != SQUARES.NO_SQ) HASH_EP();
	HASH_CA();

	brd_side ^= 1;
	HASH_SIDE();

	if((MFLAGEP & move) != 0) {
		if(brd_side == COLOURS.WHITE) {
			AddPiece(to - 10, PIECES.bP);
		} else {
			AddPiece(to + 10, PIECES.wP);
		}
	} else if((MFLAGCA & move) != 0) {
		switch(to) {
			case SQUARES.C1: MovePiece(SQUARES.D1, SQUARES.A1); break;
			case SQUARES.C8: MovePiece(SQUARES.D8, SQUARES.A8); break;
			case SQUARES.G1: MovePiece(SQUARES.F1, SQUARES.H1); break;
			case SQUARES.G8: MovePiece(SQUARES.F8, SQUARES.H8); break;
			default: break;
		}
	}

	MovePiece(to, from);

	var captured = (move >>> 14) & 0xF;
	if(captured != PIECES.EMPTY) {
		AddPiece(to, captured);
	}

	if(PROMOTED(move) != PIECES.EMPTY) {
		ClearPiece(from);
		AddPiece(from, (PieceCol[PROMOTED(move)] == COLOURS.WHITE ? PIECES.wP : PIECES.bP));
	}
}

function MakeNullMove() {
	var side = brd_side;
	brd_history_posKey[brd_hisPly] = brd_posKey;
	brd_history_posKeyHi[brd_hisPly] = brd_posKeyHi;
	brd_history_move[brd_hisPly] = NOMOVE;
	brd_history_contextPiece[brd_hisPly] = PIECES.EMPTY;
	brd_history_fiftyMove[brd_hisPly] = brd_fiftyMove;
	brd_history_fullMoveNumber[brd_hisPly] = brd_fullMoveNumber;
	brd_history_enPas[brd_hisPly] = brd_enPas;
	brd_history_castlePerm[brd_hisPly] = brd_castlePerm;

	if(brd_enPas != SQUARES.NO_SQ) HASH_EP();
	brd_enPas = SQUARES.NO_SQ;

	brd_side ^= 1;
	HASH_SIDE();

	brd_fiftyMove++;
	if(side == COLOURS.BLACK) {
		brd_fullMoveNumber++;
	}

	brd_hisPly++;
	if(srch_searching == BOOL.TRUE) {
		brd_ply++;
		brd_moveListStart[brd_ply] = brd_moveListStart[brd_ply - 1];
	}
}

function TakeNullMove() {
	brd_hisPly--;
	if(srch_searching == BOOL.TRUE && brd_ply > 0) {
		brd_ply--;
	}

	brd_side ^= 1;
	brd_fiftyMove = brd_history_fiftyMove[brd_hisPly];
	brd_fullMoveNumber = brd_history_fullMoveNumber[brd_hisPly];
	brd_enPas = brd_history_enPas[brd_hisPly];
	brd_castlePerm = brd_history_castlePerm[brd_hisPly];
	brd_posKey = brd_history_posKey[brd_hisPly];
	brd_posKeyHi = brd_history_posKeyHi[brd_hisPly];
}
var VictimScore = new Int16Array([ 0, 100, 200, 300, 400, 500, 600, 100, 200, 300, 400, 500, 600 ]);
var MvvLvaScores = new Int16Array(14 * 14);
var PromoScore = new Int16Array(13);

PromoScore[PIECES.wQ] = 9000;
PromoScore[PIECES.bQ] = 9000;
PromoScore[PIECES.wR] = 8000;
PromoScore[PIECES.bR] = 8000;
PromoScore[PIECES.wB] = 7000;
PromoScore[PIECES.bB] = 7000;
PromoScore[PIECES.wN] = 6000;
PromoScore[PIECES.bN] = 6000;

function InitMvvLva() {
	var Attacker;
	var Victim;
	for(Attacker = PIECES.wP; Attacker <= PIECES.bK; ++Attacker) {
		for(Victim = PIECES.wP; Victim <= PIECES.bK; ++Victim) {
			MvvLvaScores[Victim * 14 + Attacker] = VictimScore[Victim] + 6 - ( VictimScore[Attacker] / 100);
		}
	}		
}

function RefreshMoveOrderingHints() {
	brd_counterMoveHint = NOMOVE;
	brd_counterHistoryBase = -1;
	brd_contHistoryBase1 = -1;
	brd_contHistoryBase2 = -1;
	var hisPly = brd_hisPly;

	if(hisPly > 0) {
		var prevIdx = hisPly - 1;
		var prevMove = brd_history_move[prevIdx];
		if(prevMove != NOMOVE) {
			var prevFrom120 = prevMove & 0x7F;
			var prevTo120 = (prevMove >>> 7) & 0x7F;
			var prevFrom64 = Sq120ToSq64[prevFrom120] | 0;
			var prevTo64 = Sq120ToSq64[prevTo120] | 0;
			if(prevFrom64 >= 0 && prevFrom64 < HIST_SQ_NUM && prevTo64 >= 0 && prevTo64 < HIST_SQ_NUM) {
				var counterIdx = (prevFrom64 << 6) | prevTo64;
				brd_counterMoveHint = brd_searchCounter[counterIdx];
				brd_counterHistoryBase = counterIdx << 6;
			}
			var prevPiece = brd_history_contextPiece[prevIdx];
			if(prevPiece != PIECES.EMPTY && prevTo64 >= 0 && prevTo64 < HIST_SQ_NUM) {
				brd_contHistoryBase1 = (prevPiece * HIST_SQ_NUM + prevTo64) * CONT_HIST_STRIDE;
			}
		}
	}

	if(hisPly > 1) {
		var prev2Idx = hisPly - 2;
		var prev2Move = brd_history_move[prev2Idx];
		if(prev2Move != NOMOVE) {
			var prev2To120 = (prev2Move >>> 7) & 0x7F;
			var prev2To64 = Sq120ToSq64[prev2To120] | 0;
			var prev2Piece = brd_history_contextPiece[prev2Idx];
			if(prev2Piece != PIECES.EMPTY && prev2To64 >= 0 && prev2To64 < HIST_SQ_NUM) {
				brd_contHistoryBase2 = (prev2Piece * HIST_SQ_NUM + prev2To64) * CONT_HIST_STRIDE;
			}
		}
	}
}

function UpdateHistoryValue(table, idx, bonus, maxAbs, decayShift) {
	var value = table[idx] | 0;
	var scaledBonus = bonus | 0;
	var absBonus = (scaledBonus < 0) ? -scaledBonus : scaledBonus;
	value += scaledBonus - (Math.imul(value, absBonus) >> decayShift);
	if(value > maxAbs) {
		value = maxAbs;
	} else if(value < -maxAbs) {
		value = -maxAbs;
	}
	table[idx] = value;
}

function UpdateMainHistory(idx, bonus) {
	UpdateHistoryValue(brd_searchHistory, idx, bonus, HISTORY_MAX, HISTORY_DECAY_SHIFT);
}

function UpdateCaptureHistory(idx, bonus) {
	UpdateHistoryValue(brd_searchCaptureHistory, idx, bonus, CAPHIST_MAX, CAPHIST_DECAY_SHIFT);
}

function UpdateCounterHistory(toSq, bonus) {
	var base = brd_counterHistoryBase;
	if(base < 0) return;
	UpdateHistoryValue(brd_searchCounterHistory, base + toSq, bonus, COUNTER_HIST_MAX, COUNTER_HIST_DECAY_SHIFT);
}

function UpdateContinuationHistoryTable(table, base, histIdx, bonus) {
	if(base < 0) {
		return;
	}
	var idx = base + histIdx;
	var value = table[idx] | 0;
	var scaledBonus = bonus | 0;
	var absBonus = (scaledBonus < 0) ? -scaledBonus : scaledBonus;
	value += scaledBonus - (Math.imul(value, absBonus) >> CONT_HIST_DECAY_SHIFT);
	if(value > CONT_HIST_MAX) {
		value = CONT_HIST_MAX;
	} else if(value < -CONT_HIST_MAX) {
		value = -CONT_HIST_MAX;
	}
	table[idx] = value;
}

function UpdateContinuationHistory(histIdx, bonus) {
	UpdateContinuationHistoryTable(brd_searchContHistory1, brd_contHistoryBase1, histIdx, bonus);
	var secondaryBonus = bonus >> 1;
	if(secondaryBonus == 0) {
		if(bonus > 0) {
			secondaryBonus = 1;
		} else if(bonus < 0) {
			secondaryBonus = -1;
		}
	}
	UpdateContinuationHistoryTable(brd_searchContHistory2, brd_contHistoryBase2, histIdx, secondaryBonus);
}


function MOVE(from,to,captured,promoted,flag) {
	return (from | (to << 7) | (captured << 14) | (promoted << 20) | flag);
}

function MoveExists(move) {
	
	GenerateMoves();
    
	var index;
	var moveFound = NOMOVE;
	for(index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
	
		moveFound = brd_moveList[index];	
		if(MakeMove(moveFound) == BOOL.FALSE) {
			continue;
		}				
		TakeMove();
		if(move == moveFound) {
			return BOOL.TRUE;
		}
	}
	return BOOL.FALSE;
}

function AddCaptureMove(move) {
	var plyNext = brd_ply + 1;
	var index = brd_moveListStart[plyNext];
	var moveList = brd_moveList;
	var moveScores = brd_moveScores;
	moveList[index] = move;
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var captured = (move >>> 14) & 0xF;
	var promoted = (move >>> 20) & 0xF;
	var attacker = brd_pieces[from];
	var promoScore = 0;
	var to64 = Sq120ToSq64[to] | 0;
	var capHist = (brd_searchCaptureHistory[attacker * HIST_SQ_NUM + to64] >> CAPHIST_SHIFT);
	var seeScore = 0;
	var scoreBase = SCORE_CAPTURE;
	if(promoted != PIECES.EMPTY) {
		promoScore = PromoScore[promoted];
	}
	// Demote obviously losing captures below killer/counter heuristics.
	if(promoted == PIECES.EMPTY && (move & MFLAGEP) == 0 && PieceVal[attacker] > PieceVal[captured]) {
		seeScore = StaticExchangeEval(move);
		if(seeScore < 0) {
			scoreBase = SCORE_BAD_CAPTURE;
		}
	}
	var score = MvvLvaScores[captured * 14 + attacker] + scoreBase + promoScore + capHist + seeScore;
	if(brd_hashMoveHint == move) {
		score = SCORE_HASH + promoScore;
	}
	moveScores[index] = score;
	brd_moveListStart[plyNext] = index + 1;
}

function AddQuietMove(move) {
	var plyNext = brd_ply + 1;
	var index = brd_moveListStart[plyNext];
	var moveList = brd_moveList;
	var moveScores = brd_moveScores;
	moveList[index] = move;
	var promoted = (move >>> 20) & 0xF;
	var score = 0;
	var ply = brd_ply;
	var killers = brd_searchKillers;
	var historyScore = 0;
	var from = 0;
	var to = 0;

	if(brd_hashMoveHint == move) {
		var hashPromo = 0;
		if(promoted != PIECES.EMPTY) {
			hashPromo = PromoScore[promoted];
		}
		score = SCORE_HASH + hashPromo;
	} else if(promoted != PIECES.EMPTY) {
		score = SCORE_PROMO_QUIET + PromoScore[promoted];
	} else {	
		from = move & 0x7F;
		to = (move >>> 7) & 0x7F;
		var to64 = Sq120ToSq64[to] | 0;
		var quietHistIdx = brd_pieces[from] * HIST_SQ_NUM + to64;
		var continuationScore = 0;
		var contBase1 = brd_contHistoryBase1;
		if(contBase1 >= 0) {
			continuationScore += brd_searchContHistory1[contBase1 + quietHistIdx];
		}
		var contBase2 = brd_contHistoryBase2;
		if(contBase2 >= 0) {
			continuationScore += (brd_searchContHistory2[contBase2 + quietHistIdx] >> 1);
		}
		var counterHistoryScore = 0;
		var counterHistBase = brd_counterHistoryBase;
		if(counterHistBase >= 0) {
			counterHistoryScore = brd_searchCounterHistory[counterHistBase + to64];
		}
		historyScore = brd_searchHistory[quietHistIdx] +
			(continuationScore >> CONT_HIST_SHIFT) +
			(counterHistoryScore >> 1);
		if(killers[ply] == move) {	
			score = SCORE_KILLER1 + (historyScore >> 2);
		} else if(killers[MAXDEPTH + ply] == move) {	
			score = SCORE_KILLER2 + (historyScore >> 2);
		} else if(brd_counterMoveHint == move) {
			score = SCORE_COUNTER + (historyScore >> 1);
		} else {
			score = historyScore;
		}
	}
	moveScores[index] = score;
	brd_moveListStart[plyNext] = index + 1;	
}

function AddEnPassantMove(move) {
	var plyNext = brd_ply + 1;
	var index = brd_moveListStart[plyNext];
	var moveList = brd_moveList;
	var moveScores = brd_moveScores;
	moveList[index] = move;
	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var attacker = brd_pieces[from];
	var to64 = Sq120ToSq64[to] | 0;
	var score = 105 + SCORE_CAPTURE + (brd_searchCaptureHistory[attacker * HIST_SQ_NUM + to64] >> CAPHIST_SHIFT);
	if(brd_hashMoveHint == move) {
		score = SCORE_HASH;
	}
	moveScores[index] = score;
	brd_moveListStart[plyNext] = index + 1;
}

function AddWhitePawnCaptureMove(from, to, cap) {
	if(PieceKing[cap] == BOOL.TRUE) {
		return;
	}
	if(RanksBrd[from]==RANKS.RANK_7) {
		AddCaptureMove(MOVE(from,to,cap,PIECES.wQ,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.wR,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.wB,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.wN,0));
	} else {
		AddCaptureMove(MOVE(from,to,cap,PIECES.EMPTY,0));	
	}
}

function AddWhitePawnQuietMove(from, to) {
	if(RanksBrd[from]==RANKS.RANK_7) {
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wQ,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wR,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wB,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.wN,0));
	} else {
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.EMPTY,0));	
	}
}

function AddBlackPawnCaptureMove(from, to, cap) {
	if(PieceKing[cap] == BOOL.TRUE) {
		return;
	}
	if(RanksBrd[from]==RANKS.RANK_2) {
		AddCaptureMove(MOVE(from,to,cap,PIECES.bQ,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.bR,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.bB,0));
		AddCaptureMove(MOVE(from,to,cap,PIECES.bN,0));
	} else {
		AddCaptureMove(MOVE(from,to,cap,PIECES.EMPTY,0));	
	}
}

function AddBlackPawnQuietMove(from, to) {
	if(RanksBrd[from]==RANKS.RANK_2) {
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bQ,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bR,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bB,0));
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.bN,0));
	} else {
		AddQuietMove(MOVE(from,to,PIECES.EMPTY,PIECES.EMPTY,0));	
	}
}

function GenerateWhitePawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, enPasSq, capturesOnly) {
	var pawnsLo = brd_bbLo[PIECES.wP] >>> 0;
	var pawnsHi = brd_bbHi[PIECES.wP] >>> 0;
	var emptyLo = (~allOccLo) >>> 0;
	var emptyHi = (~allOccHi) >>> 0;
	var toLo = 0;
	var toHi = 0;
	var promoLo = 0;
	var promoHi = 0;
	var iterLo = 0;
	var iterHi = 0;
	var sq64 = 0;
	var from64 = 0;
	var from120 = 0;
	var to120 = 0;
	var target = 0;

	if(capturesOnly !== true) {
		toLo = BBShiftNorthLo(pawnsLo);
		toHi = BBShiftNorthHi(pawnsLo, pawnsHi);
		toLo = (toLo & emptyLo) >>> 0;
		toHi = (toHi & emptyHi) >>> 0;
		promoLo = (toLo & BB_RANK_8_LO) >>> 0;
		promoHi = (toHi & BB_RANK_8_HI) >>> 0;
		iterLo = (toLo & (~BB_RANK_8_LO)) >>> 0;
		iterHi = (toHi & (~BB_RANK_8_HI)) >>> 0;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var lsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(lsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var lsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(lsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 - 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddWhitePawnQuietMove(from120, to120);
		}
		iterLo = promoLo;
		iterHi = promoHi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var promoLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(promoLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var promoLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(promoLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 - 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddWhitePawnQuietMove(from120, to120);
		}

		var rank2Lo = (pawnsLo & BB_RANK_2_LO) >>> 0;
		var rank2Hi = (pawnsHi & BB_RANK_2_HI) >>> 0;
		var step1Lo = BBShiftNorthLo(rank2Lo);
		var step1Hi = BBShiftNorthHi(rank2Lo, rank2Hi);
		step1Lo = (step1Lo & emptyLo) >>> 0;
		step1Hi = (step1Hi & emptyHi) >>> 0;
		var step2Lo = BBShiftNorthLo(step1Lo);
		var step2Hi = BBShiftNorthHi(step1Lo, step1Hi);
		step2Lo = (step2Lo & emptyLo) >>> 0;
		step2Hi = (step2Hi & emptyHi) >>> 0;
		iterLo = step2Lo;
		iterHi = step2Hi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var dblLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(dblLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var dblLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(dblLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 - 16) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddQuietMove(MOVE(from120, to120, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
		}
	} else {
		toLo = BBShiftNorthLo(pawnsLo);
		toHi = BBShiftNorthHi(pawnsLo, pawnsHi);
		toLo = (toLo & emptyLo & BB_RANK_8_LO) >>> 0;
		toHi = (toHi & emptyHi & BB_RANK_8_HI) >>> 0;
		iterLo = toLo;
		iterHi = toHi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var qPromoLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(qPromoLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var qPromoLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(qPromoLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 - 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddWhitePawnQuietMove(from120, to120);
		}
	}

	var srcLo = (pawnsLo & BB_NOT_FILE_A_LO) >>> 0;
	var srcHi = (pawnsHi & BB_NOT_FILE_A_HI) >>> 0;
	toLo = BBShiftLeft7Lo(srcLo);
	toHi = BBShiftLeft7Hi(srcLo, srcHi);
	toLo = (toLo & enemyOccLo) >>> 0;
	toHi = (toHi & enemyOccHi) >>> 0;
	promoLo = (toLo & BB_RANK_8_LO) >>> 0;
	promoHi = (toHi & BB_RANK_8_HI) >>> 0;
	iterLo = (toLo & (~BB_RANK_8_LO)) >>> 0;
	iterHi = (toHi & (~BB_RANK_8_HI)) >>> 0;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap7LsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap7LsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap7LsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap7LsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 - 7) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.BLACK) {
			AddWhitePawnCaptureMove(from120, to120, target);
		}
	}
	iterLo = promoLo;
	iterHi = promoHi;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap7PromoLsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap7PromoLsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap7PromoLsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap7PromoLsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 - 7) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.BLACK) {
			AddWhitePawnCaptureMove(from120, to120, target);
		}
	}

	srcLo = (pawnsLo & BB_NOT_FILE_H_LO) >>> 0;
	srcHi = (pawnsHi & BB_NOT_FILE_H_HI) >>> 0;
	toLo = BBShiftLeft9Lo(srcLo);
	toHi = BBShiftLeft9Hi(srcLo, srcHi);
	toLo = (toLo & enemyOccLo) >>> 0;
	toHi = (toHi & enemyOccHi) >>> 0;
	promoLo = (toLo & BB_RANK_8_LO) >>> 0;
	promoHi = (toHi & BB_RANK_8_HI) >>> 0;
	iterLo = (toLo & (~BB_RANK_8_LO)) >>> 0;
	iterHi = (toHi & (~BB_RANK_8_HI)) >>> 0;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap9LsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap9LsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap9LsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap9LsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 - 9) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.BLACK) {
			AddWhitePawnCaptureMove(from120, to120, target);
		}
	}
	iterLo = promoLo;
	iterHi = promoHi;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap9PromoLsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap9PromoLsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap9PromoLsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap9PromoLsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 - 9) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.BLACK) {
			AddWhitePawnCaptureMove(from120, to120, target);
		}
	}

	if(enPasSq != SQUARES.NO_SQ) {
		var epFromLeft = enPasSq - 9;
		if(brd_pieces[epFromLeft] == PIECES.wP) {
			AddEnPassantMove(MOVE(epFromLeft, enPasSq, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
		}
		var epFromRight = enPasSq - 11;
		if(brd_pieces[epFromRight] == PIECES.wP) {
			AddEnPassantMove(MOVE(epFromRight, enPasSq, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
		}
	}
}

function GenerateBlackPawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, enPasSq, capturesOnly) {
	var pawnsLo = brd_bbLo[PIECES.bP] >>> 0;
	var pawnsHi = brd_bbHi[PIECES.bP] >>> 0;
	var emptyLo = (~allOccLo) >>> 0;
	var emptyHi = (~allOccHi) >>> 0;
	var toLo = 0;
	var toHi = 0;
	var promoLo = 0;
	var promoHi = 0;
	var iterLo = 0;
	var iterHi = 0;
	var sq64 = 0;
	var from64 = 0;
	var from120 = 0;
	var to120 = 0;
	var target = 0;

	if(capturesOnly !== true) {
		toLo = BBShiftSouthLo(pawnsLo, pawnsHi);
		toHi = BBShiftSouthHi(pawnsHi);
		toLo = (toLo & emptyLo) >>> 0;
		toHi = (toHi & emptyHi) >>> 0;
		promoLo = (toLo & BB_RANK_1_LO) >>> 0;
		promoHi = (toHi & BB_RANK_1_HI) >>> 0;
		iterLo = (toLo & (~BB_RANK_1_LO)) >>> 0;
		iterHi = (toHi & (~BB_RANK_1_HI)) >>> 0;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var lsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(lsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var lsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(lsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 + 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddBlackPawnQuietMove(from120, to120);
		}
		iterLo = promoLo;
		iterHi = promoHi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var promoLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(promoLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var promoLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(promoLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 + 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddBlackPawnQuietMove(from120, to120);
		}

		var rank7Lo = (pawnsLo & BB_RANK_7_LO) >>> 0;
		var rank7Hi = (pawnsHi & BB_RANK_7_HI) >>> 0;
		var step1Lo = BBShiftSouthLo(rank7Lo, rank7Hi);
		var step1Hi = BBShiftSouthHi(rank7Hi);
		step1Lo = (step1Lo & emptyLo) >>> 0;
		step1Hi = (step1Hi & emptyHi) >>> 0;
		var step2Lo = BBShiftSouthLo(step1Lo, step1Hi);
		var step2Hi = BBShiftSouthHi(step1Hi);
		step2Lo = (step2Lo & emptyLo) >>> 0;
		step2Hi = (step2Hi & emptyHi) >>> 0;
		iterLo = step2Lo;
		iterHi = step2Hi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var dblLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(dblLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var dblLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(dblLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 + 16) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddQuietMove(MOVE(from120, to120, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
		}
	} else {
		toLo = BBShiftSouthLo(pawnsLo, pawnsHi);
		toHi = BBShiftSouthHi(pawnsHi);
		toLo = (toLo & emptyLo & BB_RANK_1_LO) >>> 0;
		toHi = (toHi & emptyHi & BB_RANK_1_HI) >>> 0;
		iterLo = toLo;
		iterHi = toHi;
		while(iterLo !== 0 || iterHi !== 0) {
			if(iterLo !== 0) {
				var qPromoLsbLo = (iterLo & (-iterLo)) >>> 0;
				sq64 = (31 - Math.clz32(qPromoLsbLo)) | 0;
				iterLo = (iterLo & (iterLo - 1)) >>> 0;
			} else {
				var qPromoLsbHi = (iterHi & (-iterHi)) >>> 0;
				sq64 = (32 + (31 - Math.clz32(qPromoLsbHi))) | 0;
				iterHi = (iterHi & (iterHi - 1)) >>> 0;
			}
			from64 = (sq64 + 8) | 0;
			from120 = SQ120(from64);
			to120 = SQ120(sq64);
			AddBlackPawnQuietMove(from120, to120);
		}
	}

	var srcLo = (pawnsLo & BB_NOT_FILE_H_LO) >>> 0;
	var srcHi = (pawnsHi & BB_NOT_FILE_H_HI) >>> 0;
	toLo = BBShiftRight7Lo(srcLo, srcHi);
	toHi = BBShiftRight7Hi(srcHi);
	toLo = (toLo & enemyOccLo) >>> 0;
	toHi = (toHi & enemyOccHi) >>> 0;
	promoLo = (toLo & BB_RANK_1_LO) >>> 0;
	promoHi = (toHi & BB_RANK_1_HI) >>> 0;
	iterLo = (toLo & (~BB_RANK_1_LO)) >>> 0;
	iterHi = (toHi & (~BB_RANK_1_HI)) >>> 0;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap7LsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap7LsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap7LsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap7LsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 + 7) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.WHITE) {
			AddBlackPawnCaptureMove(from120, to120, target);
		}
	}
	iterLo = promoLo;
	iterHi = promoHi;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap7PromoLsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap7PromoLsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap7PromoLsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap7PromoLsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 + 7) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.WHITE) {
			AddBlackPawnCaptureMove(from120, to120, target);
		}
	}

	srcLo = (pawnsLo & BB_NOT_FILE_A_LO) >>> 0;
	srcHi = (pawnsHi & BB_NOT_FILE_A_HI) >>> 0;
	toLo = BBShiftRight9Lo(srcLo, srcHi);
	toHi = BBShiftRight9Hi(srcHi);
	toLo = (toLo & enemyOccLo) >>> 0;
	toHi = (toHi & enemyOccHi) >>> 0;
	promoLo = (toLo & BB_RANK_1_LO) >>> 0;
	promoHi = (toHi & BB_RANK_1_HI) >>> 0;
	iterLo = (toLo & (~BB_RANK_1_LO)) >>> 0;
	iterHi = (toHi & (~BB_RANK_1_HI)) >>> 0;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap9LsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap9LsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap9LsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap9LsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 + 9) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.WHITE) {
			AddBlackPawnCaptureMove(from120, to120, target);
		}
	}
	iterLo = promoLo;
	iterHi = promoHi;
	while(iterLo !== 0 || iterHi !== 0) {
		if(iterLo !== 0) {
			var cap9PromoLsbLo = (iterLo & (-iterLo)) >>> 0;
			sq64 = (31 - Math.clz32(cap9PromoLsbLo)) | 0;
			iterLo = (iterLo & (iterLo - 1)) >>> 0;
		} else {
			var cap9PromoLsbHi = (iterHi & (-iterHi)) >>> 0;
			sq64 = (32 + (31 - Math.clz32(cap9PromoLsbHi))) | 0;
			iterHi = (iterHi & (iterHi - 1)) >>> 0;
		}
		from64 = (sq64 + 9) | 0;
		from120 = SQ120(from64);
		to120 = SQ120(sq64);
		target = brd_pieces[to120];
		if(PieceCol[target] == COLOURS.WHITE) {
			AddBlackPawnCaptureMove(from120, to120, target);
		}
	}

	if(enPasSq != SQUARES.NO_SQ) {
		var epFromRight = enPasSq + 9;
		if(brd_pieces[epFromRight] == PIECES.bP) {
			AddEnPassantMove(MOVE(epFromRight, enPasSq, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
		}
		var epFromLeft = enPasSq + 11;
		if(brd_pieces[epFromLeft] == PIECES.bP) {
			AddEnPassantMove(MOVE(epFromLeft, enPasSq, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
		}
	}
}

function GenerateKnightMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, capturesOnly) {
	var knight = (side == COLOURS.WHITE) ? PIECES.wN : PIECES.bN;
	var pieceLo = brd_bbLo[knight] >>> 0;
	var pieceHi = brd_bbHi[knight] >>> 0;
	var sq64To120 = Sq64ToSq120;
	var pieceKing = PieceKing;
	var fromSq64 = 0;
	var fromSq120 = 0;
	var toSq64 = 0;
	var toSq120 = 0;
	var targetsLo = 0;
	var targetsHi = 0;
	var targetPiece = 0;
	while(pieceLo !== 0 || pieceHi !== 0) {
		if(pieceLo !== 0) {
			var fromLsbLo = (pieceLo & (-pieceLo)) >>> 0;
			fromSq64 = (31 - Math.clz32(fromLsbLo)) | 0;
			pieceLo = (pieceLo & (pieceLo - 1)) >>> 0;
		} else {
			var fromLsbHi = (pieceHi & (-pieceHi)) >>> 0;
			fromSq64 = (32 + (31 - Math.clz32(fromLsbHi))) | 0;
			pieceHi = (pieceHi & (pieceHi - 1)) >>> 0;
		}
		fromSq120 = sq64To120[fromSq64];

		targetsLo = (BB_KNIGHT_ATK_LO[fromSq64] & enemyOccLo) >>> 0;
		targetsHi = (BB_KNIGHT_ATK_HI[fromSq64] & enemyOccHi) >>> 0;
		while(targetsLo !== 0 || targetsHi !== 0) {
			if(targetsLo !== 0) {
				var toCapLsbLo = (targetsLo & (-targetsLo)) >>> 0;
				toSq64 = (31 - Math.clz32(toCapLsbLo)) | 0;
				targetsLo = (targetsLo & (targetsLo - 1)) >>> 0;
			} else {
				var toCapLsbHi = (targetsHi & (-targetsHi)) >>> 0;
				toSq64 = (32 + (31 - Math.clz32(toCapLsbHi))) | 0;
				targetsHi = (targetsHi & (targetsHi - 1)) >>> 0;
			}
			toSq120 = sq64To120[toSq64];
			targetPiece = brd_pieces[toSq120];
			if(pieceKing[targetPiece] == BOOL.FALSE) {
				AddCaptureMove(MOVE(fromSq120, toSq120, targetPiece, PIECES.EMPTY, 0));
			}
		}

		if(capturesOnly === true) continue;
		targetsLo = (BB_KNIGHT_ATK_LO[fromSq64] & (~allOccLo)) >>> 0;
		targetsHi = (BB_KNIGHT_ATK_HI[fromSq64] & (~allOccHi)) >>> 0;
		while(targetsLo !== 0 || targetsHi !== 0) {
			if(targetsLo !== 0) {
				var toQuietLsbLo = (targetsLo & (-targetsLo)) >>> 0;
				toSq64 = (31 - Math.clz32(toQuietLsbLo)) | 0;
				targetsLo = (targetsLo & (targetsLo - 1)) >>> 0;
			} else {
				var toQuietLsbHi = (targetsHi & (-targetsHi)) >>> 0;
				toSq64 = (32 + (31 - Math.clz32(toQuietLsbHi))) | 0;
				targetsHi = (targetsHi & (targetsHi - 1)) >>> 0;
			}
			toSq120 = sq64To120[toSq64];
			AddQuietMove(MOVE(fromSq120, toSq120, PIECES.EMPTY, PIECES.EMPTY, 0));
		}
	}
}

function GenerateKingMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, capturesOnly) {
	var kingSq120 = brd_kingSq[side];
	var kingSq64 = Sq120ToSq64[kingSq120];
	if(kingSq64 < 0 || kingSq64 > 63) return;
	var sq64To120 = Sq64ToSq120;
	var pieceKing = PieceKing;
	var toSq64 = 0;
	var toSq120 = 0;
	var targetPiece = 0;
	var targetsLo = (BB_KING_ATK_LO[kingSq64] & enemyOccLo) >>> 0;
	var targetsHi = (BB_KING_ATK_HI[kingSq64] & enemyOccHi) >>> 0;
	while(targetsLo !== 0 || targetsHi !== 0) {
		if(targetsLo !== 0) {
			var toCapLsbLo = (targetsLo & (-targetsLo)) >>> 0;
			toSq64 = (31 - Math.clz32(toCapLsbLo)) | 0;
			targetsLo = (targetsLo & (targetsLo - 1)) >>> 0;
		} else {
			var toCapLsbHi = (targetsHi & (-targetsHi)) >>> 0;
			toSq64 = (32 + (31 - Math.clz32(toCapLsbHi))) | 0;
			targetsHi = (targetsHi & (targetsHi - 1)) >>> 0;
		}
		toSq120 = sq64To120[toSq64];
		targetPiece = brd_pieces[toSq120];
		if(pieceKing[targetPiece] == BOOL.FALSE) {
			AddCaptureMove(MOVE(kingSq120, toSq120, targetPiece, PIECES.EMPTY, 0));
		}
	}

	if(capturesOnly === true) return;
	targetsLo = (BB_KING_ATK_LO[kingSq64] & (~allOccLo)) >>> 0;
	targetsHi = (BB_KING_ATK_HI[kingSq64] & (~allOccHi)) >>> 0;
	while(targetsLo !== 0 || targetsHi !== 0) {
		if(targetsLo !== 0) {
			var toQuietLsbLo = (targetsLo & (-targetsLo)) >>> 0;
			toSq64 = (31 - Math.clz32(toQuietLsbLo)) | 0;
			targetsLo = (targetsLo & (targetsLo - 1)) >>> 0;
		} else {
			var toQuietLsbHi = (targetsHi & (-targetsHi)) >>> 0;
			toSq64 = (32 + (31 - Math.clz32(toQuietLsbHi))) | 0;
			targetsHi = (targetsHi & (targetsHi - 1)) >>> 0;
		}
		toSq120 = sq64To120[toSq64];
		AddQuietMove(MOVE(kingSq120, toSq120, PIECES.EMPTY, PIECES.EMPTY, 0));
	}
}

function GenerateSliderMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, capturesOnly) {
	var pList = brd_pList;
	var pceCounts = brd_pceNum;
	var pieces = brd_pieces;
	var sq64To120 = Sq64ToSq120;
	var pceIndex = LoopSlideIndex[side];
	var pce = LoopSlidePce[pceIndex++];
	var pceNum = 0;
	var from120 = 0;
	var from64 = 0;
	var attLo = 0;
	var attHi = 0;
	var tableIdx = 0;
	var capLo = 0;
	var capHi = 0;
	var quietLo = 0;
	var quietHi = 0;
	var to64 = 0;
	var to120 = 0;
	var target = 0;

	while(pce != 0) {
		for(pceNum = 0; pceNum < pceCounts[pce]; ++pceNum) {
			from120 = pList[PCEINDEX(pce, pceNum)];
			from64 = Sq120ToSq64[from120];

			if(pce == PIECES.wB || pce == PIECES.bB) {
				tableIdx = BBBishopAttackTableIndex(from64, allOccLo, allOccHi);
				attLo = BB_BISHOP_ATTACK_LO[tableIdx] >>> 0;
				attHi = BB_BISHOP_ATTACK_HI[tableIdx] >>> 0;
			} else if(pce == PIECES.wR || pce == PIECES.bR) {
				tableIdx = BBRookAttackTableIndex(from64, allOccLo, allOccHi);
				attLo = BB_ROOK_ATTACK_LO[tableIdx] >>> 0;
				attHi = BB_ROOK_ATTACK_HI[tableIdx] >>> 0;
			} else {
				var rookIdx = BBRookAttackTableIndex(from64, allOccLo, allOccHi);
				var bishopIdx = BBBishopAttackTableIndex(from64, allOccLo, allOccHi);
				attLo = (BB_ROOK_ATTACK_LO[rookIdx] | BB_BISHOP_ATTACK_LO[bishopIdx]) >>> 0;
				attHi = (BB_ROOK_ATTACK_HI[rookIdx] | BB_BISHOP_ATTACK_HI[bishopIdx]) >>> 0;
			}

			capLo = (attLo & enemyOccLo) >>> 0;
			capHi = (attHi & enemyOccHi) >>> 0;
			while(capLo !== 0 || capHi !== 0) {
				if(capLo !== 0) {
					var capLsbLo = (capLo & (-capLo)) >>> 0;
					to64 = (31 - Math.clz32(capLsbLo)) | 0;
					capLo = (capLo & (capLo - 1)) >>> 0;
				} else {
					var capLsbHi = (capHi & (-capHi)) >>> 0;
					to64 = (32 + (31 - Math.clz32(capLsbHi))) | 0;
					capHi = (capHi & (capHi - 1)) >>> 0;
				}
				to120 = sq64To120[to64];
				target = pieces[to120];
				if(PieceKing[target] == BOOL.FALSE) {
					AddCaptureMove(MOVE(from120, to120, target, PIECES.EMPTY, 0));
				}
			}

			if(capturesOnly === true) continue;
			quietLo = (attLo & (~allOccLo)) >>> 0;
			quietHi = (attHi & (~allOccHi)) >>> 0;
			while(quietLo !== 0 || quietHi !== 0) {
				if(quietLo !== 0) {
					var quietLsbLo = (quietLo & (-quietLo)) >>> 0;
					to64 = (31 - Math.clz32(quietLsbLo)) | 0;
					quietLo = (quietLo & (quietLo - 1)) >>> 0;
				} else {
					var quietLsbHi = (quietHi & (-quietHi)) >>> 0;
					to64 = (32 + (31 - Math.clz32(quietLsbHi))) | 0;
					quietHi = (quietHi & (quietHi - 1)) >>> 0;
				}
				to120 = sq64To120[to64];
				AddQuietMove(MOVE(from120, to120, PIECES.EMPTY, PIECES.EMPTY, 0));
			}
		}
		pce = LoopSlidePce[pceIndex++];
	}
}


function GenerateMoves() {
	var side = brd_side;
	var enemy = side ^ 1;
	var pieces = brd_pieces;
	var pList = brd_pList;
	var pceCounts = brd_pceNum;
	var pceIndex;
	var pce;
	var pceNum;
	var sq;
	var t_sq;
	var index;
	var dir;
	var target;
	var allOccLo = brd_occLo[COLOURS.BOTH] >>> 0;
	var allOccHi = brd_occHi[COLOURS.BOTH] >>> 0;
	var enemyOccLo = brd_occLo[enemy] >>> 0;
	var enemyOccHi = brd_occHi[enemy] >>> 0;

	brd_moveListStart[brd_ply + 1] = brd_moveListStart[brd_ply];
	RefreshMoveOrderingHints();

	if(side == COLOURS.WHITE) {
		GenerateWhitePawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, brd_enPas, false);
		if(brd_castlePerm & CASTLEBIT.WKCA) {
			if(pieces[SQUARES.H1] == PIECES.wR &&
				pieces[SQUARES.F1] == PIECES.EMPTY && pieces[SQUARES.G1] == PIECES.EMPTY) {
				if(SqAttacked(SQUARES.E1,COLOURS.BLACK) == BOOL.FALSE && SqAttacked(SQUARES.F1,COLOURS.BLACK) == BOOL.FALSE) {
					AddQuietMove(MOVE(SQUARES.E1, SQUARES.G1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}

		if(brd_castlePerm & CASTLEBIT.WQCA) {
			if(pieces[SQUARES.A1] == PIECES.wR &&
				pieces[SQUARES.D1] == PIECES.EMPTY && pieces[SQUARES.C1] == PIECES.EMPTY && pieces[SQUARES.B1] == PIECES.EMPTY) {
				if(SqAttacked(SQUARES.E1,COLOURS.BLACK) == BOOL.FALSE && SqAttacked(SQUARES.D1,COLOURS.BLACK) == BOOL.FALSE ) {
					AddQuietMove(MOVE(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
	} else {
		GenerateBlackPawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, brd_enPas, false);
		if(brd_castlePerm & CASTLEBIT.BKCA) {
			if(pieces[SQUARES.H8] == PIECES.bR &&
				pieces[SQUARES.F8] == PIECES.EMPTY && pieces[SQUARES.G8] == PIECES.EMPTY) {
				if(SqAttacked(SQUARES.E8,COLOURS.WHITE) == BOOL.FALSE && SqAttacked(SQUARES.F8,COLOURS.WHITE) == BOOL.FALSE) {
					AddQuietMove(MOVE(SQUARES.E8, SQUARES.G8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}

		if(brd_castlePerm & CASTLEBIT.BQCA) {
			if(pieces[SQUARES.A8] == PIECES.bR &&
				pieces[SQUARES.D8] == PIECES.EMPTY && pieces[SQUARES.C8] == PIECES.EMPTY && pieces[SQUARES.B8] == PIECES.EMPTY) {
				if(SqAttacked(SQUARES.E8,COLOURS.WHITE) == BOOL.FALSE && SqAttacked(SQUARES.D8,COLOURS.WHITE) == BOOL.FALSE ) {
					AddQuietMove(MOVE(SQUARES.E8, SQUARES.C8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
	}

	GenerateSliderMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, false);

	GenerateKnightMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, false);
	GenerateKingMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, false);
}


function GenerateCaptures() {
	var side = brd_side;
	var enemy = side ^ 1;
	var pieces = brd_pieces;
	var pList = brd_pList;
	var pceCounts = brd_pceNum;
	var pceIndex;
	var pce;
	var pceNum;
	var sq;
	var t_sq;
	var index;
	var dir;
	var target;
	var allOccLo = brd_occLo[COLOURS.BOTH] >>> 0;
	var allOccHi = brd_occHi[COLOURS.BOTH] >>> 0;
	var enemyOccLo = brd_occLo[enemy] >>> 0;
	var enemyOccHi = brd_occHi[enemy] >>> 0;

	brd_moveListStart[brd_ply + 1] = brd_moveListStart[brd_ply];
	RefreshMoveOrderingHints();

	if(side == COLOURS.WHITE) {
		GenerateWhitePawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, brd_enPas, true);
	} else {
		GenerateBlackPawnMovesBitboard(enemyOccLo, enemyOccHi, allOccLo, allOccHi, brd_enPas, true);
	}

	GenerateSliderMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, true);

	GenerateKnightMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, true);
	GenerateKingMovesBitboard(side, enemy, allOccLo, allOccHi, enemyOccLo, enemyOccHi, true);
}
var perft_leafNodes;

function Perft(depth) { 
	var startedPerft = (srch_searching != BOOL.TRUE);
	if(startedPerft) {
		srch_searching = BOOL.TRUE;
		brd_ply = 0;
	}
	try {
		MakeNullMove();
		if(brd_posKey !=  GeneratePosKey() || brd_posKeyHi != GeneratePosKeyHi())  {
			console.log(printGameLine());
			PrintBoard();
			srch_stop = BOOL.TRUE;
			console.log('Hash Error After Make');
		}   
		
		TakeNullMove();
		if(brd_posKey !=  GeneratePosKey() || brd_posKeyHi != GeneratePosKeyHi())  {
			console.log(printGameLine());
			PrintBoard();
			srch_stop = BOOL.TRUE;
			console.log('Hash Error After Take');
		}   

		if(depth == 0) {
	        perft_leafNodes++;
	        return;
	    }	

	    GenerateMoves();
	    
		var index;
		var move;
		for(index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
		
			move = brd_moveList[index];	
			if(MakeMove(move) == BOOL.FALSE) {
				continue;
			}		
			Perft(depth-1);
			TakeMove();
		}

	    return;
	} finally {
		if(startedPerft) {
			srch_searching = BOOL.FALSE;
			brd_ply = 0;
		}
	}
}

function PerftTest(depth) {    

	PrintBoard();
	console.log("Starting Test To Depth:" + depth);	
	perft_leafNodes = 0;
	GenerateMoves();
	var index;
	var move;
	var moveNum = 0;
	for(index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
	
		move = brd_moveList[index];	
		if(MakeMove(move) == BOOL.FALSE) {
			continue;
		}	
		moveNum++;	
        var cumnodes = perft_leafNodes;
		Perft(depth-1);
		TakeMove();
		var oldnodes = perft_leafNodes - cumnodes;
        console.log("move:" + moveNum + " " + PrMove(move) + " " + oldnodes);
	}
    
	console.log("Test Complete : " + perft_leafNodes + " leaf nodes visited");
        $("#FenOutput").text("Test Complete : " + perft_leafNodes + " leaf nodes visited");

    return;
}
function ThreeFoldRep() {
	return RepetitionCount();
}

function CountRepetitionMatches(maxMatches) {
	var limit = (maxMatches === undefined) ? 0 : (maxMatches | 0);
	if(limit < 0) {
		limit = 0;
	}

	if(brd_hisPly < 2 || brd_fiftyMove < 2) {
		return 0;
	}

	var hisPly = brd_hisPly | 0;
	var start = hisPly - (brd_fiftyMove | 0);
	if(start < 0) start = 0;
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var histMove = brd_history_move;
	var histKey = brd_history_posKey;
	var histKeyHi = brd_history_posKeyHi;
	var count = 0;
	for(var index = hisPly - 2; index >= start; index -= 2) {
		if(limit > 0) {
			var remainingSlots = (((index - start) >> 1) + 1);
			if((count + remainingSlots) < limit) {
				break;
			}
		}
		if(histMove[index] == NOMOVE) {
			// Null moves split the repetition chain inside search.
			break;
		}
		if(histKey[index] === key && histKeyHi[index] === keyHi) {
			count++;
			if(limit > 0 && count >= limit) {
				return count;
			}
		}
	}
	return count;
}

function CountRepetitionMatches2() {
	if(brd_hisPly < 2 || brd_fiftyMove < 2) {
		return 0;
	}

	var hisPly = brd_hisPly | 0;
	var start = hisPly - (brd_fiftyMove | 0);
	if(start < 0) start = 0;
	var key = brd_posKey >>> 0;
	var keyHi = brd_posKeyHi >>> 0;
	var histMove = brd_history_move;
	var histKey = brd_history_posKey;
	var histKeyHi = brd_history_posKeyHi;
	var count = 0;
	for(var index = hisPly - 2; index >= start; index -= 2) {
		if(histMove[index] == NOMOVE) {
			// Null moves split the repetition chain inside search.
			break;
		}
		if(histKey[index] === key && histKeyHi[index] === keyHi) {
			count++;
			if(count >= 2) {
				return 2;
			}
		}
	}
	return count;
}

function RepetitionCount() {
	return CountRepetitionMatches(0);
}

function HasRepetition(requiredPreviousCount) {
	var required = requiredPreviousCount | 0;
	if(required < 1) {
		required = 2;
	}
	return CountRepetitionMatches(required) >= required ? BOOL.TRUE : BOOL.FALSE;
}

function MoveAllowsOpponentRepetition(move, requiredPreviousCount) {
	if(move == NOMOVE) return BOOL.FALSE;
	if(MakeMove(move) == BOOL.FALSE) {
		return BOOL.FALSE;
	}
	var allows = BOOL.FALSE;
	GenerateMoves();
	for(var index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
		var reply = brd_moveList[index];
		if(MakeMove(reply) == BOOL.FALSE) {
			continue;
		}
		if(HasRepetition(requiredPreviousCount) == BOOL.TRUE) {
			allows = BOOL.TRUE;
			TakeMove();
			break;
		}
		TakeMove();
	}
	TakeMove();
	return allows;
}

function DrawMaterial() {

    if (brd_pceNum[PIECES.wP]!=0 || brd_pceNum[PIECES.bP]!=0) return BOOL.FALSE;
    if (brd_pceNum[PIECES.wQ]!=0 || brd_pceNum[PIECES.bQ]!=0 || brd_pceNum[PIECES.wR]!=0 || brd_pceNum[PIECES.bR]!=0) return BOOL.FALSE;
    if (brd_pceNum[PIECES.wB] > 1 || brd_pceNum[PIECES.bB] > 1) {return BOOL.FALSE;}
    if (brd_pceNum[PIECES.wN] > 1 || brd_pceNum[PIECES.bN] > 1) {return BOOL.FALSE;}
    if (brd_pceNum[PIECES.wN]!=0 && brd_pceNum[PIECES.wB]!=0) {return BOOL.FALSE;}
    if (brd_pceNum[PIECES.bN]!=0 && brd_pceNum[PIECES.bB]!=0) {return BOOL.FALSE;}
	
    return BOOL.TRUE;
}
function GetPvLine(depth) {

	var move = TTProbeMove();
	var count = 0;

	while(move != NOMOVE && count < depth) {
		GenerateMoves();
		var found = BOOL.FALSE;
		var start = brd_moveListStart[brd_ply];
		var end = brd_moveListStart[brd_ply + 1];
		for(var idx = start; idx < end; ++idx) {
			if(brd_moveList[idx] == move) {
				found = BOOL.TRUE;
				break;
			}
		}
		if(found == BOOL.FALSE || MakeMove(move) == BOOL.FALSE) {
			break;
		}
		brd_PvArray[count++] = move;
		move = TTProbeMove();
	}

	while(brd_ply > 0) {
		TakeMove();
	}
	return count;
}
var srch_nodes;
var srch_fh;
var srch_fhf;
var srch_depth;
var srch_time;
var srch_start;
var srch_stop;
var srch_best;
var srch_thinking;
var srch_searching = BOOL.FALSE;
var srch_lowTimeFastMode = BOOL.FALSE;
var SEARCH_CHECK_MASK = 262143;
var DELTA_PRUNE_MARGIN = 170;
var FUTILITY_MARGIN = [0, 100, 200, 300];
var RFP_MARGIN = [0, 100, 200, 320, 440];
var LMP_LIMIT = [0, 1, 5, 8, 14, 20];
var RAZOR_MARGIN_CP = 160;
var PROBCUT_MIN_DEPTH = 5;
var PROBCUT_MARGIN = 240;
var PROBCUT_REDUCTION = 4;
var PROBCUT_MAX_MOVES = 6;
var SEE_PRUNE_DEPTH = 4;
var SEE_PRUNE_MARGIN = [0, -180, -150, -120, -90, -60];
var SEE_QS_MARGIN = -140;
var IID_MIN_DEPTH = 10;
var IID_REDUCTION = 2;
var SINGULAR_MIN_DEPTH = 8;
var SINGULAR_MARGIN_BASE = 36;
var SINGULAR_MARGIN_DEPTH = 3;
var IMPROVING_RFP_BONUS = 42;
var IMPROVING_FUTILITY_BONUS = 34;
var IMPROVING_LMP_BONUS = 2;
var IMPROVING_LMR_TWEAK = 1;
var STATIC_NULL_MIN_DEPTH = 5;
var STATIC_NULL_MAX_DEPTH = 8;
var STATIC_NULL_MARGIN = 84;
var LMR_MAX_MOVES = 64;
var LMR_TABLE_STRIDE = LMR_MAX_MOVES;
var LMR_BASE = new Int8Array((MAXDEPTH + 1) * LMR_TABLE_STRIDE);
var SORT_FIRST_N = 10;
var ROOT_SAFETY_PLY = 0;
var QCHECK_MAX_DEPTH = 0;
var QCHECK_MOVE_CAP = 2;
var DRAW_CONTEMPT_CP = 24;
var AVOID_REPETITION_WINNING_CP = 50;
var REP_AVOID_MAX_DROP_CP = 200;
var SEE_SWAP_GAIN = new Int32Array(34);
var SearchTraceState = {
	enabled: false,
	entries: [],
	currentRoot: null,
	currentMove: NOMOVE,
	fen: "",
	depth: 0
};

function SearchTraceCount(field, delta) {
	if(SearchTraceState.enabled !== true) return;
	var root = SearchTraceState.currentRoot;
	if(root === null) return;
	var step = (delta === undefined) ? 1 : delta;
	root[field] = (root[field] || 0) + step;
}

function SetSearchTraceEnabled(enabled) {
	SearchTraceState.enabled = (enabled === true);
	if(SearchTraceState.enabled !== true) {
		SearchTraceState.entries.length = 0;
		SearchTraceState.currentRoot = null;
		SearchTraceState.currentMove = NOMOVE;
	}
}

function ClearSearchTraceEntries() {
	SearchTraceState.entries.length = 0;
	SearchTraceState.currentRoot = null;
	SearchTraceState.currentMove = NOMOVE;
}

function GetSearchTraceEntries() {
	return SearchTraceState.entries.slice(0);
}

function SearchTraceRootBegin(move, depth, alpha, beta, legalOrder, isCapture, isPromotion, givesCheck, hashMove) {
	if(SearchTraceState.enabled !== true || brd_ply != 1) return null;
	var entry = {
		move: PrMove(move),
		moveCode: move,
		depth: depth,
		order: legalOrder,
		alphaIn: alpha,
		betaIn: beta,
		isCapture: (isCapture === true),
		isPromotion: (isPromotion === true),
		givesCheck: (givesCheck == BOOL.TRUE),
		isHashMove: (hashMove != NOMOVE && move == hashMove),
		rootReduced: false,
		rootReduction: 0,
		rootLmrResearched: false,
		rootPvsResearched: false,
		lmpPrunes: 0,
		lmrReductions: 0,
		lmrReductionTotal: 0,
		lmrResearched: 0,
		pvsResearched: 0,
		rfpCuts: 0,
		futilityCuts: 0,
		razorCuts: 0,
		nullCuts: 0,
		probCuts: 0,
		seePrunes: 0,
		singularExtensions: 0,
		singularMultiCuts: 0,
		iidProbes: 0,
		qDeltaPrunes: 0,
		qcheckExtensions: 0,
		qcheckBetaCuts: 0,
		qcheckCapHits: 0
	};
	SearchTraceState.currentRoot = entry;
	SearchTraceState.currentMove = move;
	return entry;
}

function SearchTraceRootEnd(entry, score, alphaOut, cutoff, reason, fullySearched, stopped) {
	if(entry === null || entry === undefined) return;
	entry.score = score;
	entry.alphaOut = alphaOut;
	entry.cutoff = (cutoff === true);
	entry.reason = reason || "";
	entry.fullySearched = (fullySearched === true);
	entry.stopped = (stopped === true);
	SearchTraceState.entries.push(entry);
	if(SearchTraceState.currentRoot === entry) {
		SearchTraceState.currentRoot = null;
		SearchTraceState.currentMove = NOMOVE;
	}
}

function CheckUp() {
	if(srch_time <= 0 || (NowMs() - srch_start) >= srch_time) srch_stop = BOOL.TRUE;
}

function EndSearchState() {
	srch_searching = BOOL.FALSE;
	brd_ply = 0;
	brd_moveListStart[0] = 0;
}

function GetDrawScore() {
	var evalScore = EvalPosition();
	if(evalScore > DRAW_CONTEMPT_CP) return -DRAW_CONTEMPT_CP;
	if(evalScore < -DRAW_CONTEMPT_CP) return DRAW_CONTEMPT_CP;
	return 0;
}

function IsKingPressureNode(side, enemy) {
	var heavy = (side == COLOURS.WHITE) ?
		(brd_pceNum[PIECES.wQ] + brd_pceNum[PIECES.wR]) :
		(brd_pceNum[PIECES.bQ] + brd_pceNum[PIECES.bR]);
	if(heavy == 0) {
		return BOOL.FALSE;
	}
	if(SqAttacked(brd_kingSq[enemy], side) == BOOL.TRUE) {
		return BOOL.TRUE;
	}
	return BOOL.FALSE;
}

function HasNonPawnMaterial(side) {
	if(side == COLOURS.WHITE) {
		return ((brd_pceNum[PIECES.wN] | brd_pceNum[PIECES.wB] | brd_pceNum[PIECES.wR] | brd_pceNum[PIECES.wQ]) !== 0) ? BOOL.TRUE : BOOL.FALSE;
	}
	return ((brd_pceNum[PIECES.bN] | brd_pceNum[PIECES.bB] | brd_pceNum[PIECES.bR] | brd_pceNum[PIECES.bQ]) !== 0) ? BOOL.TRUE : BOOL.FALSE;
}

function SEEExtractLsbSq64(lo, hi) {
	lo = lo >>> 0;
	hi = hi >>> 0;
	if((lo | hi) === 0) {
		return -1;
	}
	return BBLsbIndex64(lo, hi) | 0;
}

function SEEGetLeastAttackerSq64(side, sq64, occLo, occHi) {
	var lo = 0 >>> 0;
	var hi = 0 >>> 0;
	var idx = -1;
	var bishopIdx = 0;
	var rookIdx = 0;

	if(side == COLOURS.WHITE) {
		lo = (brd_bbLo[PIECES.wP] & BB_PAWN_FROM_WHITE_LO[sq64] & occLo) >>> 0;
		hi = (brd_bbHi[PIECES.wP] & BB_PAWN_FROM_WHITE_HI[sq64] & occHi) >>> 0;
		idx = SEEExtractLsbSq64(lo, hi);
		if(idx >= 0) return idx;

		lo = (brd_bbLo[PIECES.wN] & BB_KNIGHT_ATK_LO[sq64] & occLo) >>> 0;
		hi = (brd_bbHi[PIECES.wN] & BB_KNIGHT_ATK_HI[sq64] & occHi) >>> 0;
		idx = SEEExtractLsbSq64(lo, hi);
		if(idx >= 0) return idx;

		bishopIdx = BBBishopAttackTableIndex(sq64, occLo, occHi);
		rookIdx = BBRookAttackTableIndex(sq64, occLo, occHi);

		lo = (BB_BISHOP_ATTACK_LO[bishopIdx] & brd_bbLo[PIECES.wB] & occLo) >>> 0;
		hi = (BB_BISHOP_ATTACK_HI[bishopIdx] & brd_bbHi[PIECES.wB] & occHi) >>> 0;
		idx = SEEExtractLsbSq64(lo, hi);
		if(idx >= 0) return idx;

		lo = (BB_ROOK_ATTACK_LO[rookIdx] & brd_bbLo[PIECES.wR] & occLo) >>> 0;
		hi = (BB_ROOK_ATTACK_HI[rookIdx] & brd_bbHi[PIECES.wR] & occHi) >>> 0;
		idx = SEEExtractLsbSq64(lo, hi);
		if(idx >= 0) return idx;

		lo = ((BB_BISHOP_ATTACK_LO[bishopIdx] | BB_ROOK_ATTACK_LO[rookIdx]) & brd_bbLo[PIECES.wQ] & occLo) >>> 0;
		hi = ((BB_BISHOP_ATTACK_HI[bishopIdx] | BB_ROOK_ATTACK_HI[rookIdx]) & brd_bbHi[PIECES.wQ] & occHi) >>> 0;
		idx = SEEExtractLsbSq64(lo, hi);
		if(idx >= 0) return idx;

		lo = (brd_bbLo[PIECES.wK] & BB_KING_ATK_LO[sq64] & occLo) >>> 0;
		hi = (brd_bbHi[PIECES.wK] & BB_KING_ATK_HI[sq64] & occHi) >>> 0;
		return SEEExtractLsbSq64(lo, hi);
	}

	lo = (brd_bbLo[PIECES.bP] & BB_PAWN_FROM_BLACK_LO[sq64] & occLo) >>> 0;
	hi = (brd_bbHi[PIECES.bP] & BB_PAWN_FROM_BLACK_HI[sq64] & occHi) >>> 0;
	idx = SEEExtractLsbSq64(lo, hi);
	if(idx >= 0) return idx;

	lo = (brd_bbLo[PIECES.bN] & BB_KNIGHT_ATK_LO[sq64] & occLo) >>> 0;
	hi = (brd_bbHi[PIECES.bN] & BB_KNIGHT_ATK_HI[sq64] & occHi) >>> 0;
	idx = SEEExtractLsbSq64(lo, hi);
	if(idx >= 0) return idx;

	bishopIdx = BBBishopAttackTableIndex(sq64, occLo, occHi);
	rookIdx = BBRookAttackTableIndex(sq64, occLo, occHi);

	lo = (BB_BISHOP_ATTACK_LO[bishopIdx] & brd_bbLo[PIECES.bB] & occLo) >>> 0;
	hi = (BB_BISHOP_ATTACK_HI[bishopIdx] & brd_bbHi[PIECES.bB] & occHi) >>> 0;
	idx = SEEExtractLsbSq64(lo, hi);
	if(idx >= 0) return idx;

	lo = (BB_ROOK_ATTACK_LO[rookIdx] & brd_bbLo[PIECES.bR] & occLo) >>> 0;
	hi = (BB_ROOK_ATTACK_HI[rookIdx] & brd_bbHi[PIECES.bR] & occHi) >>> 0;
	idx = SEEExtractLsbSq64(lo, hi);
	if(idx >= 0) return idx;

	lo = ((BB_BISHOP_ATTACK_LO[bishopIdx] | BB_ROOK_ATTACK_LO[rookIdx]) & brd_bbLo[PIECES.bQ] & occLo) >>> 0;
	hi = ((BB_BISHOP_ATTACK_HI[bishopIdx] | BB_ROOK_ATTACK_HI[rookIdx]) & brd_bbHi[PIECES.bQ] & occHi) >>> 0;
	idx = SEEExtractLsbSq64(lo, hi);
	if(idx >= 0) return idx;

	lo = (brd_bbLo[PIECES.bK] & BB_KING_ATK_LO[sq64] & occLo) >>> 0;
	hi = (brd_bbHi[PIECES.bK] & BB_KING_ATK_HI[sq64] & occHi) >>> 0;
	return SEEExtractLsbSq64(lo, hi);
}

function StaticExchangeEval(move) {
	var promoted = (move >>> 20) & 0xF;
	if(promoted != PIECES.EMPTY) {
		return 0;
	}
	if((move & MFLAGEP) != 0) {
		return 0;
	}

	var captured = (move >>> 14) & 0xF;
	if(captured == PIECES.EMPTY) {
		return 0;
	}

	var from = move & 0x7F;
	var to = (move >>> 7) & 0x7F;
	var movingPiece = brd_pieces[from];
	if(movingPiece == PIECES.EMPTY || movingPiece == SQUARES.OFFBOARD) {
		return 0;
	}
	var from64 = Sq120ToSq64[from] | 0;
	var to64 = Sq120ToSq64[to] | 0;
	if(from64 < 0 || from64 > 63 || to64 < 0 || to64 > 63) {
		return 0;
	}

	var occLo = brd_occLo[COLOURS.BOTH] >>> 0;
	var occHi = brd_occHi[COLOURS.BOTH] >>> 0;
	occLo = (occLo & (~BB_MASK64_LO[from64])) >>> 0;
	occHi = (occHi & (~BB_MASK64_HI[from64])) >>> 0;

	var depth = 0;
	var side = brd_side ^ 1;
	var attackerValue = PieceVal[movingPiece] | 0;
	SEE_SWAP_GAIN[0] = PieceVal[captured] | 0;

	while(true) {
		depth++;
		SEE_SWAP_GAIN[depth] = (attackerValue - SEE_SWAP_GAIN[depth - 1]) | 0;
		if(Math.max(-SEE_SWAP_GAIN[depth - 1], SEE_SWAP_GAIN[depth]) < 0) {
			break;
		}

		var attackerSq64 = SEEGetLeastAttackerSq64(side, to64, occLo, occHi);
		if(attackerSq64 < 0) {
			break;
		}

		var attackerSq120 = Sq64ToSq120[attackerSq64];
		var attackerPiece = brd_pieces[attackerSq120];
		if(attackerPiece == PIECES.EMPTY || attackerPiece == SQUARES.OFFBOARD) {
			break;
		}

		occLo = (occLo & (~BB_MASK64_LO[attackerSq64])) >>> 0;
		occHi = (occHi & (~BB_MASK64_HI[attackerSq64])) >>> 0;
		attackerValue = PieceVal[attackerPiece] | 0;
		side ^= 1;
	}

	while(--depth > 0) {
		SEE_SWAP_GAIN[depth - 1] = -Math.max(-SEE_SWAP_GAIN[depth - 1], SEE_SWAP_GAIN[depth]);
	}
	return SEE_SWAP_GAIN[0] | 0;
}

function PickNextMoveRange(moveNum, moveEnd, moveList, moveScores) {
	if(moveNum + 1 >= moveEnd) {
		return;
	}
	if(moveScores[moveNum] >= SCORE_HASH) {
		return;
	}

	var index = 0;
	var bestNum = moveNum;
	var bestScore = moveScores[moveNum];
	var temp;

	for(index = moveNum + 1; index < moveEnd; ++index) {
		var score = moveScores[index];
		if(score > bestScore) {
			bestScore = score;
			bestNum = index;
		}
	}
	if(bestNum == moveNum) {
		return;
	}
	temp = moveList[moveNum];
	moveList[moveNum] = moveList[bestNum];
	moveList[bestNum] = temp;

	temp = moveScores[moveNum];
	moveScores[moveNum] = moveScores[bestNum];
	moveScores[bestNum] = temp;
}

function BringMoveToFront(move, start, end, list, scores) {
	if(move == NOMOVE) return;
	for(var i = start; i < end; ++i) {
		if(list[i] == move) {
			if(i != start) {
				var t = list[start];
				list[start] = list[i];
				list[i] = t;
				t = scores[start];
				scores[start] = scores[i];
				scores[i] = t;
			}
			return;
		}
	}
}

function PickNextMove(moveNum) {
	PickNextMoveRange(moveNum, brd_moveListStart[brd_ply + 1], brd_moveList, brd_moveScores);
}

function IsRepetition(requiredPreviousCount) {
	// Search should only treat true claimable repetition (3-fold) as an immediate draw score.
	return HasRepetition(requiredPreviousCount);
}

function ClearPvTable() {
	brd_PvTable_move.fill(NOMOVE);
	brd_PvTable_posKey.fill(0);
}

function ClearForSearch() {

	brd_searchEvalStack.fill(0);
	brd_contHistoryBase1 = -1;
	brd_contHistoryBase2 = -1;
	brd_excludedMove = NOMOVE;
	brd_excludedPly = -1;
	brd_counterMoveHint = NOMOVE;
	brd_counterHistoryBase = -1;
	brd_hashMoveHint = NOMOVE;

	TTNewSearch();

	brd_ply = 0;	
	brd_moveListStart[0] = 0;
	srch_searching = BOOL.TRUE;

	srch_nodes = 0;
	srch_fh = 0;
	srch_fhf = 0;
	srch_start = NowMs();
	srch_stop = BOOL.FALSE;
	srch_best = NOMOVE;
	srch_lowTimeFastMode = BOOL.FALSE;

	if(SearchTraceState.enabled === true) {
		SearchTraceState.entries.length = 0;
		SearchTraceState.currentRoot = null;
		SearchTraceState.currentMove = NOMOVE;
		SearchTraceState.fen = BoardToFen();
		SearchTraceState.depth = srch_depth;
	}
}


function Quiescence(alpha, beta, qDepth) {
	if(qDepth === undefined) {
		qDepth = 0;
	}

	if((srch_nodes & SEARCH_CHECK_MASK) == 0) CheckUp();
	
	srch_nodes++;
	
	var repCount = 0;
	if(brd_fiftyMove >= 4) {
		repCount = CountRepetitionMatches2();
	}
	if(repCount >= 2 || brd_fiftyMove >= 100) {
		return GetDrawScore();
	}
	
	if(brd_ply > MAXDEPTH - 1) {
		return EvalPosition();
	}

	var ttScore = TTProbeNode(alpha, beta, 0);
	var HashMove = TTProbeNodeMove;
	if(ttScore !== null) {
		return ttScore;
	}
	
	var side = brd_side;
	var enemy = side ^ 1;
	var InCheck = SqAttacked(brd_kingSq[side], enemy);
	var standPat = -INFINITE;

	brd_hashMoveHint = HashMove;

	if(InCheck == BOOL.FALSE) {
		standPat = EvalPosition();
		
		if(standPat >= beta) {
			TTStore(NOMOVE, beta, 0, TT_FLAG_BETA);
			return beta;
		}
		
		if(standPat > alpha) {
			alpha = standPat;
		}
		GenerateCaptures();
	} else {
		GenerateMoves();
	}
	brd_hashMoveHint = NOMOVE;
	BringMoveToFront(HashMove, brd_moveListStart[brd_ply], brd_moveListStart[brd_ply + 1], brd_moveList, brd_moveScores);
      
	var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var allMovesFullySearched = BOOL.TRUE;
	var BestMove = NOMOVE;
	var Score = -INFINITE;
	var moveList = brd_moveList;
	var moveScores = brd_moveScores;
	var pieces = brd_pieces;
	var moveStart = brd_moveListStart[brd_ply];
	var moveEnd = brd_moveListStart[brd_ply + 1];
	var move;
	var captured;
	var promoted;
	var deltaBase = standPat + DELTA_PRUNE_MARGIN;
	

	for(MoveNum = moveStart; MoveNum < moveEnd; ++MoveNum)  {	
		if((MoveNum - moveStart) < SORT_FIRST_N) {
			PickNextMoveRange(MoveNum, moveEnd, moveList, moveScores);
		}
		move = moveList[MoveNum];
		captured = (move >>> 14) & 0xF;
		promoted = (move >>> 20) & 0xF;
		var isEnPassant = (move & MFLAGEP) != 0;

		if(InCheck == BOOL.FALSE && promoted == PIECES.EMPTY && captured != PIECES.EMPTY &&
			alpha > (-MATE + MAXDEPTH) && alpha < (MATE - MAXDEPTH) &&
			(deltaBase + PieceVal[captured]) <= alpha) {
			allMovesFullySearched = BOOL.FALSE;
			SearchTraceCount("qDeltaPrunes", 1);
			continue;
		}
		if(InCheck == BOOL.FALSE && qDepth > 0 && promoted == PIECES.EMPTY &&
			captured != PIECES.EMPTY && isEnPassant == BOOL.FALSE) {
			var from = move & 0x7F;
			var movingPiece = pieces[from];
			if(movingPiece != PIECES.EMPTY && (PieceVal[captured] - PieceVal[movingPiece]) < SEE_QS_MARGIN) {
				if(StaticExchangeEval(move) < SEE_QS_MARGIN) {
					allMovesFullySearched = BOOL.FALSE;
					SearchTraceCount("seePrunes", 1);
					continue;
				}
			}
		}
		
        if ( MakeMoveFast(move) == BOOL.FALSE)  {
            continue;
        }
        
		Legal++;
		Score = -Quiescence( -beta, -alpha, qDepth + 1);
		TakeMoveFast();					
		if(srch_stop == BOOL.TRUE) return 0;
		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal==1) {
					srch_fhf++;
				}
				srch_fh++;				
						
				var from = move & 0x7F;
				var to = (move >>> 7) & 0x7F;
				var attacker = pieces[from];
				if(attacker != PIECES.EMPTY) {
					var to64 = Sq120ToSq64[to] | 0;
					var idx = attacker * HIST_SQ_NUM + to64;
					UpdateCaptureHistory(idx, QHIST_BONUS);
				}
				TTStore(move, beta, 0, TT_FLAG_BETA);
				return beta;
			}
			alpha = Score;
			BestMove = move;			
		}		
    }
	
	if(InCheck == BOOL.TRUE && Legal == 0) {
		return -MATE + brd_ply;
	}

	var qKingPressure = BOOL.FALSE;
	if(InCheck == BOOL.FALSE && qDepth < QCHECK_MAX_DEPTH && alpha < beta) {
		qKingPressure = IsKingPressureNode(side, enemy);
	}
	if(InCheck == BOOL.FALSE && qDepth < QCHECK_MAX_DEPTH && alpha < beta &&
		qKingPressure == BOOL.TRUE) {
		brd_hashMoveHint = HashMove;
		GenerateMoves();
		brd_hashMoveHint = NOMOVE;
		moveStart = brd_moveListStart[brd_ply];
		moveEnd = brd_moveListStart[brd_ply + 1];
		BringMoveToFront(HashMove, moveStart, moveEnd, moveList, moveScores);
		var quietChecks = 0;
		var quietCheckCap = (beta - alpha) >= 60 ? QCHECK_MOVE_CAP : Math.max(1, QCHECK_MOVE_CAP - 2);

		for(MoveNum = moveStart; MoveNum < moveEnd; ++MoveNum) {
			if((MoveNum - moveStart) < SORT_FIRST_N) {
				PickNextMoveRange(MoveNum, moveEnd, moveList, moveScores);
			}
			move = moveList[MoveNum];
			if((move & MFLAGCAP) != 0 || ((move >>> 20) & 0xF) != PIECES.EMPTY || (move & MFLAGCA) != 0) {
				continue;
			}
			if(MakeMoveFast(move) == BOOL.FALSE) {
				continue;
			}
			var givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
			if(givesCheck == BOOL.FALSE) {
				TakeMoveFast();
				continue;
			}

			Legal++;
			quietChecks++;
			SearchTraceCount("qcheckExtensions", 1);
			Score = -Quiescence(-beta, -alpha, qDepth + 1);
			TakeMoveFast();
			if(srch_stop == BOOL.TRUE) return 0;
			if(Score > alpha) {
				if(Score >= beta) {
					if(Legal == 1) {
						srch_fhf++;
					}
					srch_fh++;
					SearchTraceCount("qcheckBetaCuts", 1);
					TTStore(move, beta, 0, TT_FLAG_BETA);
					return beta;
				}
				alpha = Score;
				BestMove = move;
			}
			if(quietChecks >= quietCheckCap) {
				allMovesFullySearched = BOOL.FALSE;
				SearchTraceCount("qcheckCapHits", 1);
				break;
			}
		}
	}

	var flag = 0;
	if(allMovesFullySearched == BOOL.TRUE) {
		flag = (alpha != OldAlpha) ? TT_FLAG_EXACT : TT_FLAG_ALPHA;
	}
	if(flag != 0) {
		TTStore(BestMove, alpha, 0, flag);
	}
	return alpha;
}

function AlphaBeta(alpha, beta, depth, DoNull) {

	if(depth <= 0) {
		return Quiescence(alpha, beta, 0);
	}

	if((srch_nodes & SEARCH_CHECK_MASK) == 0) CheckUp();

	srch_nodes++;

	var repCount = 0;
	if(brd_fiftyMove >= 4) {
		repCount = CountRepetitionMatches2();
	}
	if(repCount >= 2 || brd_fiftyMove >= 100) {	
		return GetDrawScore();
	}

	if(brd_ply > MAXDEPTH - 1) {
		return EvalPosition();
	}

	var mateAlpha = -MATE + brd_ply;
	if(alpha < mateAlpha) {
		alpha = mateAlpha;
	}
	var mateBeta = MATE - brd_ply - 1;
	if(beta > mateBeta) {
		beta = mateBeta;
	}
	if(alpha >= beta) {
		return alpha;
	}
	var nonMateWindow = (alpha > (-MATE + MAXDEPTH) && beta < (MATE - MAXDEPTH));
	var isPvNode = ((beta - alpha) > 1);
	
	var alphaOrig = alpha;
	var side = brd_side;
	var enemy = side ^ 1;
	var InCheck = SqAttacked(brd_kingSq[side], enemy);
	var HashMove = NOMOVE;
	var HashFlag = 0;
	var HashDepth = -32768;
	var HashScore = 0;
	var exclusionSearch = (brd_excludedMove != NOMOVE && brd_ply == brd_excludedPly);
	var kingPressure = BOOL.FALSE;
	var traceEnabled = (SearchTraceState.enabled === true);
	var lowTimeFastMode = (srch_lowTimeFastMode == BOOL.TRUE);
	var improving = BOOL.FALSE;
	if(exclusionSearch === true) {
		DoNull = BOOL.FALSE;
	}
	if(brd_ply > 0) {
		brd_searchEvalStack[brd_ply] = brd_searchEvalStack[brd_ply - 1];
	}

	if(InCheck == BOOL.TRUE) {
		depth++;
	}
	if(InCheck == BOOL.FALSE && depth <= 3 && brd_ply > ROOT_SAFETY_PLY) {
		kingPressure = IsKingPressureNode(side, enemy);
	}

	if(exclusionSearch === false) {
		var ttScore = TTProbeNode(alpha, beta, depth);
		HashMove = TTProbeNodeMove;
		HashFlag = TTProbeNodeFlag;
		HashDepth = TTProbeNodeDepth;
		HashScore = TTProbeNodeScore;
		if(ttScore !== null) {
			return ttScore;
		}
	}

	if(depth >= IID_MIN_DEPTH && InCheck == BOOL.FALSE && HashMove == NOMOVE &&
		DoNull == BOOL.TRUE && brd_ply > ROOT_SAFETY_PLY && exclusionSearch === false &&
		isPvNode === true) {
		var iidDepth = depth - IID_REDUCTION;
		if(iidDepth < 1) {
			iidDepth = 1;
		}
		SearchTraceCount("iidProbes", 1);
		AlphaBeta(alpha, alpha + 1, iidDepth, BOOL.FALSE);
		if(srch_stop == BOOL.TRUE) return 0;
		HashMove = TTProbeMove();
	}

	var staticEval = null;
	if(depth <= 4 && DoNull == BOOL.TRUE && InCheck == BOOL.FALSE && brd_ply > ROOT_SAFETY_PLY &&
		kingPressure == BOOL.FALSE &&
		nonMateWindow &&
		exclusionSearch === false) {
		staticEval = EvalPosition();
		if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
			improving = BOOL.TRUE;
		}
		brd_searchEvalStack[brd_ply] = staticEval;
		var rfpMargin = RFP_MARGIN[depth];
		if(improving == BOOL.TRUE) {
			rfpMargin += IMPROVING_RFP_BONUS;
		}
		if(staticEval - rfpMargin >= beta) {
			SearchTraceCount("rfpCuts", 1);
			return beta;
		}
	}

	if(depth <= 3 && InCheck == BOOL.FALSE && brd_ply > ROOT_SAFETY_PLY &&
		kingPressure == BOOL.FALSE &&
		nonMateWindow &&
		exclusionSearch === false) {
		if(staticEval === null) {
			staticEval = EvalPosition();
			if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
				improving = BOOL.TRUE;
			}
			brd_searchEvalStack[brd_ply] = staticEval;
		}
		var futMargin = FUTILITY_MARGIN[depth];
		if(improving == BOOL.TRUE) {
			futMargin += IMPROVING_FUTILITY_BONUS;
		}
		if(staticEval + futMargin <= alpha) {
			SearchTraceCount("futilityCuts", 1);
			return alpha;
		}
	}

	if(depth == 1 && InCheck == BOOL.FALSE && brd_ply > ROOT_SAFETY_PLY &&
		kingPressure == BOOL.FALSE &&
		nonMateWindow &&
		exclusionSearch === false) {
		if(staticEval === null) {
			staticEval = EvalPosition();
			if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
				improving = BOOL.TRUE;
			}
			brd_searchEvalStack[brd_ply] = staticEval;
		}
		var razorMargin = RAZOR_MARGIN_CP + ((improving == BOOL.TRUE) ? 18 : 0);
		if(staticEval + razorMargin <= alpha) {
			SearchTraceCount("razorCuts", 1);
			return Quiescence(alpha, beta, 0);
		}
	}

	if(DoNull == BOOL.TRUE &&
		InCheck == BOOL.FALSE &&
		kingPressure == BOOL.FALSE &&
		brd_ply > ROOT_SAFETY_PLY &&
		depth >= STATIC_NULL_MIN_DEPTH && depth <= STATIC_NULL_MAX_DEPTH &&
		nonMateWindow &&
		exclusionSearch === false &&
		isPvNode === false &&
		HasNonPawnMaterial(side) == BOOL.TRUE) {
		if(staticEval === null) {
			staticEval = EvalPosition();
			if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
				improving = BOOL.TRUE;
			}
			brd_searchEvalStack[brd_ply] = staticEval;
		}
		var staticNullMargin = STATIC_NULL_MARGIN * depth;
		if(improving == BOOL.TRUE) {
			staticNullMargin += 24;
		}
		if(staticEval - staticNullMargin >= beta) {
			SearchTraceCount("rfpCuts", 1);
			return beta;
		}
	}

	if(DoNull == BOOL.TRUE && BOOL.FALSE == InCheck && 
			kingPressure == BOOL.FALSE &&
			brd_ply != 0 && (HasNonPawnMaterial(side) == BOOL.TRUE) && depth >= 4 &&
			isPvNode === false &&
			exclusionSearch === false) {

		if(staticEval === null) {
			staticEval = EvalPosition();
			if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
				improving = BOOL.TRUE;
			}
			brd_searchEvalStack[brd_ply] = staticEval;
		}
		var nullReduction = 3;
		if(depth >= 6) {
			nullReduction++;
		}
		if(depth >= 10) {
			nullReduction++;
		}
		if(staticEval >= beta + 120) {
			nullReduction++;
		}
		if(lowTimeFastMode == BOOL.TRUE && depth >= 8) {
			nullReduction++;
		}
		var nullDepth = depth - nullReduction;
		if(nullDepth < 1) {
			nullDepth = 1;
		}
		MakeNullMove();
		var Score = -AlphaBeta( -beta, -beta + 1, nullDepth, BOOL.FALSE);
		TakeNullMove();

		if(srch_stop == BOOL.TRUE) return 0;	
		if (Score >= beta) {
			var verifiedCut = true;
			if(depth >= 10 && nonMateWindow && staticEval < beta + 520) {
				var verifyDepth = depth - nullReduction - 1;
				if(verifyDepth < 1) {
					verifyDepth = 1;
				}
				var verifyScore = AlphaBeta(beta - 1, beta, verifyDepth, BOOL.FALSE);
				if(srch_stop == BOOL.TRUE) return 0;
				if(verifyScore < beta) {
					verifiedCut = false;
				}
			}
			if(verifiedCut) {
				// Null-move cutoffs come from reduced-depth search; keep TT depth conservative.
				SearchTraceCount("nullCuts", 1);
				TTStore(NOMOVE, beta, nullDepth, TT_FLAG_BETA);
				return beta;
			}
		}
	}

	if((beta - alpha) <= 1 &&
		depth >= PROBCUT_MIN_DEPTH &&
		InCheck == BOOL.FALSE &&
		DoNull == BOOL.TRUE &&
		kingPressure == BOOL.FALSE &&
		nonMateWindow &&
		exclusionSearch === false) {
		if(staticEval === null) {
			staticEval = EvalPosition();
			if(brd_ply >= 2 && staticEval > brd_searchEvalStack[brd_ply - 2]) {
				improving = BOOL.TRUE;
			}
			brd_searchEvalStack[brd_ply] = staticEval;
		}
		var probBeta = beta + PROBCUT_MARGIN + ((depth - PROBCUT_MIN_DEPTH) << 4);
		if(improving == BOOL.TRUE) {
			probBeta += 24;
		}
		if(staticEval >= probBeta - 140) {
			brd_hashMoveHint = HashMove;
			GenerateCaptures();
			brd_hashMoveHint = NOMOVE;

			var probStart = brd_moveListStart[brd_ply];
			var probEnd = brd_moveListStart[brd_ply + 1];
			BringMoveToFront(HashMove, probStart, probEnd, brd_moveList, brd_moveScores);
			var probDepth = depth - PROBCUT_REDUCTION;
			if(probDepth < 1) {
				probDepth = 1;
			}
			var probSearched = 0;
			for(var probMoveNum = probStart; probMoveNum < probEnd && probSearched < PROBCUT_MAX_MOVES; ++probMoveNum) {
				PickNextMoveRange(probMoveNum, probEnd, brd_moveList, brd_moveScores);
				var probMove = brd_moveList[probMoveNum];
				var probCaptured = (probMove >>> 14) & 0xF;
				var probPromoted = (probMove >>> 20) & 0xF;
				var probIsEp = (probMove & MFLAGEP) != 0;
				if(probPromoted == PIECES.EMPTY && probCaptured != PIECES.EMPTY && probIsEp == BOOL.FALSE) {
					if(StaticExchangeEval(probMove) < -90) {
						continue;
					}
				}
				if(MakeMoveFast(probMove) == BOOL.FALSE) {
					continue;
				}
				probSearched++;
				var probScore = -AlphaBeta(-probBeta, -probBeta + 1, probDepth, BOOL.FALSE);
				TakeMoveFast();
				if(srch_stop == BOOL.TRUE) return 0;
				if(probScore >= probBeta) {
					SearchTraceCount("probCuts", 1);
					TTStore(probMove, beta, probDepth, TT_FLAG_BETA);
					return beta;
				}
			}
		}
	}

	brd_hashMoveHint = HashMove;
	GenerateMoves();
	brd_hashMoveHint = NOMOVE;

    var MoveNum = 0;
	var Legal = 0;
	var BestMove = NOMOVE;
	var moveList = brd_moveList;
	var moveScores = brd_moveScores;
	var searchKillers = brd_searchKillers;
	var searchHistory = brd_searchHistory;
	var searchCounter = brd_searchCounter;
	var searchContHistory1 = brd_searchContHistory1;
	var searchContHistory2 = brd_searchContHistory2;
	var pieces = brd_pieces;
	var sq120To64 = Sq120ToSq64;
	var allMovesFullySearched = BOOL.TRUE;
	var moveStart = brd_moveListStart[brd_ply];
	var moveEnd = brd_moveListStart[brd_ply + 1];
	BringMoveToFront(HashMove, moveStart, moveEnd, moveList, moveScores);
	var newDepth = depth - 1;

	var depthSq = depth * depth;
	var lmpHistoryGate = depthSq << 1;
	var lmpDepthLimit = (lowTimeFastMode == BOOL.TRUE) ? 4 : 3;
	var lmpMoveLimit = (depth < LMP_LIMIT.length) ? LMP_LIMIT[depth] : LMP_LIMIT[LMP_LIMIT.length - 1];
	var lmpHistoryLimit = lmpHistoryGate;
	if(lowTimeFastMode == BOOL.TRUE && depth >= 3) {
		lmpMoveLimit += 1;
		lmpHistoryLimit += (depth << 1);
	}
	if(improving == BOOL.TRUE) {
		lmpMoveLimit += IMPROVING_LMP_BONUS;
		lmpHistoryLimit += (depth + (depth >> 1));
	}
	if(lmpMoveLimit < 1) {
		lmpMoveLimit = 1;
	}
	var canLateFutility = (InCheck == BOOL.FALSE && depth <= 2 && kingPressure == BOOL.FALSE &&
		nonMateWindow && staticEval !== null && exclusionSearch === false);
	var ply = brd_ply;
	var quietSeen = 0;
	var quietTried = brd_searchQuietTried;
	var quietTriedBase = ply * MAXPOSITIONMOVES;
	var quietTriedCount = 0;
	var trackQuietTried = (depth >= 3);
	var hashMoveTrusted = (HashMove != NOMOVE &&
		HashDepth >= (depth - 2) &&
		(HashFlag == TT_FLAG_BETA || HashFlag == TT_FLAG_EXACT) &&
		Math.abs(HashScore) < (MATE - MAXDEPTH));
	var singularMove = (exclusionSearch === false && hashMoveTrusted &&
		depth >= SINGULAR_MIN_DEPTH && InCheck == BOOL.FALSE &&
		isPvNode === false) ? HashMove : NOMOVE;
	var singularExtension = 0;
	if(singularMove != NOMOVE) {
		var singularDepth = depth - 3;
		if(singularDepth < 1) {
			singularDepth = 1;
		}
		var singularMargin = SINGULAR_MARGIN_BASE + (depth * SINGULAR_MARGIN_DEPTH);
		var singularRef = beta;
		if(HashFlag == TT_FLAG_EXACT) {
			singularRef = HashScore;
		} else if(HashFlag == TT_FLAG_BETA && HashScore > singularRef) {
			singularRef = HashScore;
		}
		var singularBeta = singularRef - singularMargin;
		var prevExcluded = brd_excludedMove;
		var prevExcludedPly = brd_excludedPly;
		brd_excludedMove = singularMove;
		brd_excludedPly = brd_ply;
		var singularScore = AlphaBeta(singularBeta - 1, singularBeta, singularDepth, BOOL.FALSE);
		brd_excludedMove = prevExcluded;
		brd_excludedPly = prevExcludedPly;
		if(srch_stop == BOOL.TRUE) return 0;
		if(singularScore < singularBeta) {
			singularExtension = 1;
			if(depth >= (SINGULAR_MIN_DEPTH + 4) && singularScore < (singularBeta - 120)) {
				singularExtension = 2;
			}
			SearchTraceCount("singularExtensions", 1);
		} else if(singularBeta >= beta && singularScore >= singularBeta) {
			SearchTraceCount("singularMultiCuts", 1);
			TTStore(NOMOVE, beta, depth, TT_FLAG_BETA);
			return beta;
		}
	}


	for(MoveNum = moveStart; MoveNum < moveEnd; ++MoveNum)  {	
		if((MoveNum - moveStart) < SORT_FIRST_N) {
			PickNextMoveRange(MoveNum, moveEnd, moveList, moveScores);
		}

		var move = moveList[MoveNum];
		if(exclusionSearch === true && move == brd_excludedMove) {
			allMovesFullySearched = BOOL.FALSE;
			continue;
		}
		var from = move & 0x7F;
		var to = (move >>> 7) & 0x7F;
		var to64 = sq120To64[to] | 0;
		var movedPiece = pieces[from];
		var captured = (move >>> 14) & 0xF;
		var promoted = (move >>> 20) & 0xF;
		var isEnPassant = (move & MFLAGEP) != 0;
		var isCapture = (captured != PIECES.EMPTY) || isEnPassant;
		var isPromotion = promoted != PIECES.EMPTY;
		var canGiveCheck = (!isCapture && !isPromotion);
		var quietHistIdx = -1;
		var rootTrace = null;
		var rootAlphaIn = alpha;
		var moveScoreOrd = moveScores[MoveNum];
		var extension = 0;
		if(singularMove != NOMOVE && move == singularMove) {
			extension = singularExtension;
		}
		if(InCheck == BOOL.FALSE && isCapture == BOOL.TRUE && isPromotion == BOOL.FALSE &&
			(move & MFLAGEP) == 0 &&
			Legal > 0 &&
			depth <= SEE_PRUNE_DEPTH &&
			nonMateWindow &&
			exclusionSearch === false &&
			moveScoreOrd < SCORE_HASH) {
			var seeMargin = (depth < SEE_PRUNE_MARGIN.length) ? SEE_PRUNE_MARGIN[depth] : SEE_PRUNE_MARGIN[SEE_PRUNE_MARGIN.length - 1];
			if(StaticExchangeEval(move) < seeMargin) {
				allMovesFullySearched = BOOL.FALSE;
				SearchTraceCount("seePrunes", 1);
				continue;
			}
		}
		if(PieceKing[movedPiece] == BOOL.TRUE && (move & MFLAGCA) == 0) {
			if(SqAttacked(to, enemy) == BOOL.TRUE) {
				allMovesFullySearched = BOOL.FALSE;
				continue;
			}
		}
        if ( MakeMoveFast(move) == BOOL.FALSE)  {
            continue;
        }
		var givesCheck = BOOL.FALSE;
		var checkKnown = BOOL.FALSE;
		if(traceEnabled) {
			if(canGiveCheck) {
				givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
				checkKnown = BOOL.TRUE;
			}
		}
		if((traceEnabled && brd_ply == 1) && checkKnown == BOOL.FALSE) {
			givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
			checkKnown = BOOL.TRUE;
		}
		if(traceEnabled) {
			rootTrace = SearchTraceRootBegin(move, depth, rootAlphaIn, beta, Legal + 1, isCapture, isPromotion, givesCheck, HashMove);
		}

		Legal++;
		if(canGiveCheck) {
			quietSeen++;
			quietHistIdx = movedPiece * HIST_SQ_NUM + to64;
			if(trackQuietTried && quietTriedCount < MAXPOSITIONMOVES) {
				quietTried[quietTriedBase + quietTriedCount] = quietHistIdx;
				quietTriedCount++;
			}
		}
		if(InCheck == BOOL.FALSE && depth <= lmpDepthLimit && brd_ply > ROOT_SAFETY_PLY && canGiveCheck &&
			kingPressure == BOOL.FALSE &&
			nonMateWindow &&
			exclusionSearch === false &&
			quietSeen > lmpMoveLimit) {
			if(checkKnown == BOOL.FALSE) {
				givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
				checkKnown = BOOL.TRUE;
			}
			if(givesCheck == BOOL.FALSE) {
				var quietContScore = 0;
				var quietContBase1 = brd_contHistoryBase1;
				if(quietContBase1 >= 0) {
					quietContScore += searchContHistory1[quietContBase1 + quietHistIdx];
				}
				var quietContBase2 = brd_contHistoryBase2;
				if(quietContBase2 >= 0) {
					quietContScore += (searchContHistory2[quietContBase2 + quietHistIdx] >> 1);
				}
				var quietHist = searchHistory[quietHistIdx] + (quietContScore >> CONT_HIST_SHIFT);
				if(quietHist <= lmpHistoryLimit) {
					allMovesFullySearched = BOOL.FALSE;
					SearchTraceCount("lmpPrunes", 1);
					TakeMoveFast();
					if(rootTrace !== null) {
						SearchTraceRootEnd(rootTrace, null, alpha, false, "lmp_prune", false, false);
					}
					continue;
				}
			}
		}
		if(canLateFutility && canGiveCheck && moveScoreOrd <= 0) {
			if(checkKnown == BOOL.FALSE) {
				givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
				checkKnown = BOOL.TRUE;
			}
			if(givesCheck == BOOL.FALSE) {
				var moveFutility = staticEval + FUTILITY_MARGIN[depth] +
					((improving == BOOL.TRUE) ? IMPROVING_FUTILITY_BONUS : 0) +
					(quietSeen << 3);
				if(moveFutility <= alpha) {
					allMovesFullySearched = BOOL.FALSE;
					SearchTraceCount("futilityCuts", 1);
					TakeMoveFast();
					if(rootTrace !== null) {
						SearchTraceRootEnd(rootTrace, null, alpha, false, "late_futility_prune", false, false);
					}
					continue;
				}
			}
		}

		var score;
		var fullySearchedMove = BOOL.TRUE;
		var moveDepth = newDepth + extension;
		if(moveDepth < 0) {
			moveDepth = 0;
		}

		if(Legal == 1) {
			score = -AlphaBeta( -beta, -alpha, moveDepth, BOOL.TRUE);
		} else {

			var reducedDepth = moveDepth;
			var reduced = BOOL.FALSE;
			var didFullWindowResearch = BOOL.FALSE;

			var lmrLegalGate = (lowTimeFastMode == BOOL.TRUE) ? 2 : 3;
			if(depth >= 3 && moveDepth >= 2 && InCheck == BOOL.FALSE && 
				Legal > lmrLegalGate && canGiveCheck &&
				exclusionSearch === false) {
				if(checkKnown == BOOL.FALSE) {
					givesCheck = SqAttacked(brd_kingSq[brd_side], brd_side ^ 1);
					checkKnown = BOOL.TRUE;
				}
				if(givesCheck != BOOL.FALSE) {
					reducedDepth = moveDepth;
				} else {
					var lmrDepth = depth;
					if(lmrDepth > MAXDEPTH) {
						lmrDepth = MAXDEPTH;
					}
					var lmrMove = Legal;
					if(lmrMove >= LMR_MAX_MOVES) {
						lmrMove = LMR_MAX_MOVES - 1;
					}
					var reduction = LMR_BASE[lmrDepth * LMR_TABLE_STRIDE + lmrMove] | 0;
					if(reduction < 1) {
						reduction = 1;
					}

					var lmrContScore = 0;
					var lmrContBase1 = brd_contHistoryBase1;
					if(lmrContBase1 >= 0) {
						lmrContScore += searchContHistory1[lmrContBase1 + quietHistIdx];
					}
					var lmrContBase2 = brd_contHistoryBase2;
					if(lmrContBase2 >= 0) {
						lmrContScore += (searchContHistory2[lmrContBase2 + quietHistIdx] >> 1);
					}
					var historyScore = searchHistory[quietHistIdx] + (lmrContScore >> CONT_HIST_SHIFT);
					var moveScore = moveScoreOrd;
					if(moveScore >= SCORE_KILLER1) {
						reduction--;
					} else if(moveScore <= 0 && Legal > 8) {
						reduction++;
					}
					if(moveScore >= SCORE_COUNTER) {
						reduction--;
					}
					var historyAdjustment = (historyScore + ((historyScore >= 0) ? 2048 : -2048)) >> 12;
					if(historyAdjustment > 3) {
						historyAdjustment = 3;
					} else if(historyAdjustment < -3) {
						historyAdjustment = -3;
					}
					reduction -= historyAdjustment;
					if(lowTimeFastMode == BOOL.TRUE && moveScore <= 0 && historyAdjustment <= 0 && Legal > 8) {
						reduction++;
					}
					if(improving == BOOL.TRUE) {
						reduction -= IMPROVING_LMR_TWEAK;
					}
					if(extension > 0) {
						reduction--;
					}
					if(isPvNode === true) {
						reduction--;
					}
					if(kingPressure == BOOL.TRUE) {
						reduction = 1;
					}
					if(reduction < 1) {
						reduction = 1;
					}
					var maxReduction = moveDepth - 1;
					if(maxReduction < 1) {
						maxReduction = 1;
					}
					if(reduction > maxReduction) {
						reduction = maxReduction;
					}
					reducedDepth = moveDepth - reduction;
					if(reducedDepth < 1) {
						reducedDepth = 1;
					}
					reduced = BOOL.TRUE;
					SearchTraceCount("lmrReductions", 1);
					SearchTraceCount("lmrReductionTotal", reduction);
					if(rootTrace !== null) {
						rootTrace.rootReduced = true;
						rootTrace.rootReduction = reduction;
					}
				}
			}

			score = -AlphaBeta( -alpha - 1, -alpha, reducedDepth, BOOL.TRUE);

			if(reduced == BOOL.TRUE && score > alpha) {
				SearchTraceCount("lmrResearched", 1);
				if(rootTrace !== null) {
					rootTrace.rootLmrResearched = true;
				}
				if(isPvNode === true) {
					SearchTraceCount("pvsResearched", 1);
					if(rootTrace !== null) {
						rootTrace.rootPvsResearched = true;
					}
					score = -AlphaBeta( -beta, -alpha, moveDepth, BOOL.TRUE);
					didFullWindowResearch = BOOL.TRUE;
				} else {
					score = -AlphaBeta( -alpha - 1, -alpha, moveDepth, BOOL.TRUE);
				}
			}

			if(didFullWindowResearch == BOOL.FALSE && score > alpha && score < beta) {
				SearchTraceCount("pvsResearched", 1);
				if(rootTrace !== null) {
					rootTrace.rootPvsResearched = true;
				}
				score = -AlphaBeta( -beta, -alpha, moveDepth, BOOL.TRUE);
			}

			// A reduced move that never gets a full-depth re-search is a bound, not an exact proof.
			if(reduced == BOOL.TRUE && didFullWindowResearch == BOOL.FALSE && score <= alpha) {
				fullySearchedMove = BOOL.FALSE;
			}
		}

		if(fullySearchedMove == BOOL.FALSE) {
			allMovesFullySearched = BOOL.FALSE;
		}

		TakeMoveFast();
		if(srch_stop == BOOL.TRUE) {
			if(rootTrace !== null) {
				SearchTraceRootEnd(rootTrace, score, alpha, false, "stopped", fullySearchedMove == BOOL.TRUE, true);
			}
			return 0;
		}

		if(score > alpha) {
			if(brd_ply == 0) {
				srch_best = move;
			}
			if(score >= beta) {
				if(Legal==1) {
					srch_fhf++;
				}
				srch_fh++;	

				if(canGiveCheck) {
					if(searchKillers[ply] != move) {
						searchKillers[MAXDEPTH + ply] = searchKillers[ply];
						searchKillers[ply] = move;
					}
					if(brd_hisPly > 0) {
						var prevMove = brd_history_move[brd_hisPly - 1];
						if(prevMove != NOMOVE) {
							var prevFrom64 = sq120To64[prevMove & 0x7F] | 0;
							var prevTo64 = sq120To64[(prevMove >>> 7) & 0x7F] | 0;
							searchCounter[(prevFrom64 << 6) | prevTo64] = move;
						}
					}

					var bonus = depthSq;
					var bestHist = (quietHistIdx >= 0) ? quietHistIdx : (movedPiece * HIST_SQ_NUM + to64);
					UpdateMainHistory(bestHist, bonus);
					UpdateContinuationHistory(bestHist, bonus);
					UpdateCounterHistory(to64, bonus);
					if(trackQuietTried && quietTriedCount > 1) {
						var malus = depthSq >> 1;
						if(malus < 1) {
							malus = 1;
						}
						for(var qt = 0; qt < quietTriedCount; ++qt) {
							var quietIdx = quietTried[quietTriedBase + qt];
							if(quietIdx == bestHist) {
								continue;
							}
							UpdateMainHistory(quietIdx, -malus);
							UpdateContinuationHistory(quietIdx, -malus);
							UpdateCounterHistory(quietIdx & 63, -malus);
						}
					}
				} else if(isCapture == BOOL.TRUE) {
					var capIdx = movedPiece * HIST_SQ_NUM + to64;
					UpdateCaptureHistory(capIdx, depthSq);
				}

				if(exclusionSearch === false) {
					TTStore(move, beta, depth, TT_FLAG_BETA);
				}
				if(rootTrace !== null) {
					SearchTraceRootEnd(rootTrace, score, alpha, true, "beta_cut", fullySearchedMove == BOOL.TRUE, false);
				}
				return beta;
			}

			alpha = score;
			BestMove = move;

		}		
		if(rootTrace !== null) {
			SearchTraceRootEnd(rootTrace, score, alpha, false, "", fullySearchedMove == BOOL.TRUE, false);
		}
    }

	if(Legal == 0) {
		if(InCheck) {
			return -MATE + brd_ply;
		} else {
			return GetDrawScore();
		}
	}

	if(alpha != alphaOrig && Legal > 0) {
		var bmCaptured = (BestMove >>> 14) & 0xF;
		var bmPromoted = (BestMove >>> 20) & 0xF;
		var bmIsEnPassant = (BestMove & MFLAGEP) != 0;
		if(bmPromoted == PIECES.EMPTY && bmCaptured == PIECES.EMPTY && bmIsEnPassant == BOOL.FALSE) {
			var bmFrom = BestMove & 0x7F;
			var bmTo = (BestMove >>> 7) & 0x7F;
			var bmTo64 = sq120To64[bmTo] | 0;
			var bmPiece = pieces[bmFrom];
			var bonus = depthSq;
			var bestHist = bmPiece * HIST_SQ_NUM + bmTo64;
			UpdateMainHistory(bestHist, bonus);
			UpdateContinuationHistory(bestHist, bonus);
			UpdateCounterHistory(bmTo64, bonus);
			if(brd_hisPly > 0) {
				var prevMove = brd_history_move[brd_hisPly - 1];
				if(prevMove != NOMOVE) {
					var prevFrom64 = sq120To64[prevMove & 0x7F] | 0;
					var prevTo64 = sq120To64[(prevMove >>> 7) & 0x7F] | 0;
					searchCounter[(prevFrom64 << 6) | prevTo64] = BestMove;
				}
			}
		} else if(bmPromoted == PIECES.EMPTY && (bmCaptured != PIECES.EMPTY || bmIsEnPassant == BOOL.TRUE)) {
			var bmFrom = BestMove & 0x7F;
			var bmTo = (BestMove >>> 7) & 0x7F;
			var bmTo64 = sq120To64[bmTo] | 0;
			var bmPiece = pieces[bmFrom];
			var capIdx = bmPiece * HIST_SQ_NUM + bmTo64;
			UpdateCaptureHistory(capIdx, depthSq);
		}
	}

	var flag = 0;
	if(alpha != alphaOrig) {
		flag = (allMovesFullySearched == BOOL.TRUE) ? TT_FLAG_EXACT : TT_FLAG_BETA;
	} else if(allMovesFullySearched == BOOL.TRUE) {
		flag = TT_FLAG_ALPHA;
	}
	if(flag != 0 && exclusionSearch === false) {
		TTStore(BestMove, alpha, depth, flag);
	}

	return alpha;
} 

function ToWhitePerspective(score, side) {
	var perspectiveSide = (typeof side === "number") ? side : brd_side;
	return (perspectiveSide == COLOURS.WHITE) ? score : -score;
}

function FormatEvalText(scoreWhite) {
	if(Math.abs(scoreWhite) > MATE - MAXDEPTH) {
		var mateIn = MATE - Math.abs(scoreWhite) - 1;
		if(mateIn < 1) mateIn = 1;
		return (scoreWhite >= 0 ? "M#" : "-M#") + mateIn;
	}
	var value = (scoreWhite / 100).toFixed(2);
	return (scoreWhite > 0 ? "+" : "") + value;
}

function FlipScoreForSideToMove(score) {
	if(score > MATE - MAXDEPTH) return -score - 1;
	if(score < -MATE + MAXDEPTH) return -score + 1;
	return -score;
}

function FormatScoreLine(scoreWhite) {
	if(Math.abs(scoreWhite) > MATE - MAXDEPTH) {
		var mateIn = MATE - Math.abs(scoreWhite) - 1;
		if(mateIn < 1) mateIn = 1;
		return "Score: Mate in " + mateIn;
	}
	return "Score: " + (scoreWhite > 0 ? "+" : "") + (scoreWhite / 100).toFixed(2);
}

function EvalBarShouldBeHorizontal() {
	var viewportWidth = 1200;
	if(typeof window !== "undefined" && typeof window.innerWidth === "number") {
		viewportWidth = window.innerWidth;
	} else if(typeof document !== "undefined" && document.documentElement && typeof document.documentElement.clientWidth === "number") {
		viewportWidth = document.documentElement.clientWidth;
	}
	return viewportWidth <= 520;
}

function RenderEvalBar(scoreCp, isMate, pulse) {
	var $bar = $("#EvalBar");
	var $fill = $("#EvalBarFill");
	if($bar.length === 0 || $fill.length === 0) return;

	var fillPercent;
	if(isMate) {
		fillPercent = scoreCp >= 0 ? 99 : 1;
	} else {
		// Non-linear centipawn mapping gives smoother mid-range motion while still saturating extremes.
		var bounded = Clamp(scoreCp, -2400, 2400);
		fillPercent = (Math.tanh(bounded / 520) + 1) * 50;
	}

	var horizontal = EvalBarShouldBeHorizontal();
	if(EvalBarRenderState.horizontal !== horizontal) {
		if(horizontal) {
			$bar.addClass("horizontal");
		} else {
			$bar.removeClass("horizontal");
		}
		EvalBarRenderState.horizontal = horizontal;
		EvalBarRenderState.fillPercent = -1;
	}

	var fillText = fillPercent.toFixed(1) + "%";
	var previousFill = EvalBarRenderState.fillPercent;
	var delta = previousFill < 0 ? 100 : Math.abs(fillPercent - previousFill);
	if(delta >= 0.1) {
		if(horizontal) {
			$fill.css("width", fillText);
			$fill.css("height", "100%");
		} else {
			$fill.css("height", fillText);
			$fill.css("width", "100%");
		}
		EvalBarRenderState.fillPercent = fillPercent;
	}

	var evalText = FormatEvalText(scoreCp);
	if(evalText !== EvalBarRenderState.text) {
		$("#EvalScoreOut").text(evalText);
		EvalBarRenderState.text = evalText;
	}

	if(pulse !== false && (delta >= 1.2 || isMate)) {
		PulseEvalBar(scoreCp);
	}
}

function RenderEvalOnly(score, side) {
	var scoreWhite = ToWhitePerspective(score, side);
	$("#ScoreOut").text(FormatScoreLine(scoreWhite));
	RenderEvalBar(scoreWhite, Math.abs(scoreWhite) > MATE - MAXDEPTH, true);
}

function PulseEvalBar(scoreCp) {
	var $bar = $("#EvalBar");
	if($bar.length === 0) return;
	$bar.removeClass("eval-up eval-down");
	if(typeof scoreCp === "number") {
		if(scoreCp >= 0) {
			$bar.addClass("eval-up");
		} else {
			$bar.addClass("eval-down");
		}
	}
	$bar.addClass("eval-pulse");
	if(EvalBarPulseState.timer) {
		clearTimeout(EvalBarPulseState.timer);
	}
	EvalBarPulseState.timer = setTimeout(function() {
		$bar.removeClass("eval-pulse eval-up eval-down");
		EvalBarPulseState.timer = null;
	}, 420);
}

function RenderTopMoves(topMoves, scoreSide) {
	var $list = $("#TopMovesList");
	$list.empty();
	if(!topMoves || topMoves.length == 0) {
		$list.append('<div class="top-move-item">No legal move</div>');
		return;
	}
	var allBookMoves = true;
	for(var b = 0; b < topMoves.length; ++b) {
		if(topMoves[b].isBook !== true) {
			allBookMoves = false;
			break;
		}
	}
	var altRank = 1;
	for(var i = 0; i < topMoves.length; ++i) {
		var item = topMoves[i];
		var scoreWhite = ToWhitePerspective(item.score, scoreSide);
		var moveDepth = (typeof item.depth === "number" && item.depth > 0) ? item.depth : null;
		var scoreLabel;
		if(item.isBook) {
			scoreLabel = "Book" + (item.bookCount > 1 ? (" x" + item.bookCount) : "");
		} else {
			scoreLabel = FormatEvalText(scoreWhite);
			if(moveDepth !== null) {
				scoreLabel += " d" + moveDepth;
			}
		}
		var lineText = item.pv;
		if(item.isBook) {
			lineText += " (book" + (item.bookCount > 1 ? (" x" + item.bookCount) : "") + ")";
		}
		var $row = $('<div class="top-move-item"></div>');
		var rankText;
		if(allBookMoves) {
			rankText = "Book " + (i + 1);
		} else if(item.isEngineChoice === true) {
			rankText = "Engine";
		} else {
			rankText = "Alt " + altRank;
			altRank++;
		}
		$row.append('<span class="top-move-rank rank-' + (i + 1) + '">' + rankText + '</span>');
		$row.append('<span class="top-move-main">' + PrMove(item.move) + '</span>');
		$row.append('<span class="top-move-score">' + scoreLabel + '</span>');
		$row.append('<span class="top-move-pv">' + lineText + '</span>');
		$list.append($row);
	}
}

function SafeRenderSearchResult(result) {
	try {
		RenderSearchResult(result);
	} catch(err) {
		if(typeof console !== "undefined" && typeof console.warn === "function") {
			console.warn("RenderSearchResult failed:", err && err.message ? err.message : err);
		}
	}
}

function RenderSearchResult(result) {
	var topMoves = result.topMoves || [];
	var strongest = topMoves.length > 0 ? topMoves[0] : null;
	var renderAnalysis = (result.renderAnalysis !== false);
	var progressOnly = (result.progressOnly === true);
	var bestDisplayMove = result.bestMove != NOMOVE ? result.bestMove : (strongest ? strongest.move : NOMOVE);
	var evalSourceScore = (typeof result.bestScore === "number") ? result.bestScore : (strongest ? strongest.score : 0);
	var scoreSide = (typeof result.side === "number") ? result.side : brd_side;
	var bestScoreWhite = ToWhitePerspective(evalSourceScore, scoreSide);
	var bestLabel = "BestMove: ";

	if(bestDisplayMove != NOMOVE) {
		bestLabel += PrMove(bestDisplayMove);
	} else {
		bestLabel += "-";
	}
	if(result.fromBook) {
		bestLabel += " (Book)";
	}
	if(result.playMove != NOMOVE && result.playMove != bestDisplayMove) {
		bestLabel += " | Play: " + PrMove(result.playMove);
	}

	$("#BestOut").text(bestLabel);
	$("#DepthOut").text("Depth: " + (result.fromBook ? "Book" : result.depth));
	$("#ScoreOut").text(FormatScoreLine(bestScoreWhite));
	$("#NodesOut").text("Nodes: " + result.nodes);
	$("#TimeOut").text("Time: " + (result.timeMs / 1000).toFixed(2) + "s");
	$("#PvLineOut").text("PV: " + (strongest ? strongest.pv : "-"));
	if(renderAnalysis && !progressOnly) {
		RenderTopMoves(topMoves, scoreSide);
		RenderTopMoveArrows(topMoves);
	} else if(!progressOnly) {
		$("#TopMovesList").empty();
		ClearTopMoveArrows();
	}
	RenderEvalBar(bestScoreWhite, Math.abs(bestScoreWhite) > MATE - MAXDEPTH, !progressOnly);
}

function ExtractPvFromCurrentPosition(maxPly) {
	var line = [];
	var move = TTProbeMove();
	var startPly = brd_ply;
	while(move != NOMOVE && line.length < maxPly) {
		if(MoveExists(move)) {
			MakeMove(move);
			line.push(move);
		} else {
			break;
		}
		move = TTProbeMove();
	}
	while(brd_ply > startPly) {
		TakeMove();
	}
	return line;
}

function ExtractPvFromMove(move, maxPly) {
	if(move == NOMOVE) return "";
	if(MakeMove(move) == BOOL.FALSE) return PrMove(move);
	var tail = ExtractPvFromCurrentPosition(Math.max(0, maxPly - 1));
	TakeMove();
	var parts = [PrMove(move)];
	for(var i = 0; i < tail.length; ++i) {
		parts.push(PrMove(tail[i]));
	}
	return parts.join(" ");
}

function SearchRootWithTopMoves(depth, multiPvCount) {
	var allMoves = [];
	var topState = CaptureBoardState(CreateBoardStateBuffer(), false);
	try {
		var targetDepth = Math.max(1, depth);
		GenerateMoves();
		for(var moveNum = brd_moveListStart[brd_ply]; moveNum < brd_moveListStart[brd_ply + 1]; ++moveNum) {
			PickNextMoveRange(moveNum, brd_moveListStart[brd_ply + 1], brd_moveList, brd_moveScores);
			var move = brd_moveList[moveNum];
			if(MakeMove(move) == BOOL.FALSE) {
				continue;
			}
			var score;
			if(targetDepth <= 1) {
				score = -Quiescence(-INFINITE, INFINITE);
			} else {
				score = -AlphaBeta(-INFINITE, INFINITE, targetDepth - 1, BOOL.TRUE);
			}
			var tail = ExtractPvFromCurrentPosition(5);
			var pvParts = [PrMove(move)];
			for(var i = 0; i < tail.length; ++i) {
				pvParts.push(PrMove(tail[i]));
			}
			TakeMove();
			allMoves.push({
				move: move,
				score: score,
				depth: targetDepth,
				pv: pvParts.join(" "),
				isBook: false
			});
			if(srch_stop == BOOL.TRUE) break;
		}
		allMoves.sort(function(a, b) { return b.score - a.score; });
		if(multiPvCount && allMoves.length > multiPvCount) {
			allMoves.length = multiPvCount;
		}
		return allMoves;
	} finally {
		RestoreBoardState(topState, false);
	}
}

function PickMoveBySkill(topMoves, profile) {
	if(!topMoves || topMoves.length == 0) return NOMOVE;
	var candidates = topMoves;
	var bestScore = -INFINITE;
	for(var s = 0; s < candidates.length; ++s) {
		if(typeof candidates[s].score === "number" && candidates[s].score > bestScore) {
			bestScore = candidates[s].score;
		}
	}

	if(profile.randomnessCp === 0 && profile.pickWindowCp === 0) {
		var bestMove = candidates[0].move;
		var bestMoveScore = -INFINITE;
		for(var bm = 0; bm < candidates.length; ++bm) {
			if(typeof candidates[bm].score === "number" && candidates[bm].score > bestMoveScore) {
				bestMoveScore = candidates[bm].score;
				bestMove = candidates[bm].move;
			}
		}
		return bestMove;
	}

	if(bestScore > AVOID_REPETITION_WINNING_CP) {
		var nonRep = [];
		var bestNonRepScore = -INFINITE;
		for(var r = 0; r < candidates.length; ++r) {
			var move = candidates[r].move;
			if(move == NOMOVE) continue;
			if(MakeMove(move) == BOOL.FALSE) {
				continue;
			}
			var isRep = (HasRepetition(2) == BOOL.TRUE);
			TakeMove();
			if(isRep == BOOL.FALSE) {
				nonRep.push(candidates[r]);
				if(typeof candidates[r].score === "number" && candidates[r].score > bestNonRepScore) {
					bestNonRepScore = candidates[r].score;
				}
			}
		}
		if(nonRep.length > 0 && bestNonRepScore >= (bestScore - REP_AVOID_MAX_DROP_CP)) {
			candidates = nonRep;
			bestScore = bestNonRepScore;
		}
	}

	var window = profile.pickWindowCp || 0;
	var filtered = [];
	for(var i = 0; i < candidates.length; ++i) {
		if(typeof candidates[i].score !== "number") continue;
		if(candidates[i].score >= (bestScore - window)) {
			filtered.push(candidates[i]);
		}
	}
	if(filtered.length == 0) {
		filtered = candidates.slice(0);
	}

	var bestAdjusted = -INFINITE;
	var chosen = filtered[0];
	for(var j = 0; j < filtered.length; ++j) {
		var noise = 0;
		if(profile.randomnessCp > 0) {
			noise = (Math.random() * 2 - 1) * profile.randomnessCp;
		}
		var adjusted = filtered[j].score + noise;
		if(adjusted > bestAdjusted) {
			bestAdjusted = adjusted;
			chosen = filtered[j];
		}
	}
	return chosen.move;
}

function GetFirstLegalMove() {
	GenerateMoves();
	for(var index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
		var move = brd_moveList[index];
		if(MakeMove(move) == BOOL.FALSE) {
			continue;
		}
		TakeMove();
		return move;
	}
	return NOMOVE;
}

function EnsurePlayableMove(move) {
	if(move != NOMOVE && MoveExists(move) == BOOL.TRUE) {
		return move;
	}
	return GetFirstLegalMove();
}

function SearchPosition(options) {
	options = options || {};
	if(EngineSettings.ttTargetMb !== TT_REQUEST_MB) {
		InitTT(EngineSettings.ttTargetMb);
	}
	var forceUltimateBook = (EngineSettings.skillLevel === 9);
	var useBook = ((options.useBook !== false) || forceUltimateBook) && IsBookEligible(options.bookLine);
	var fastPlay = (options.fastPlay === true);
	var renderAnalysis = (options.renderAnalysis !== false);
	var multiPvCount = options.multiPvCount || EngineSettings.multiPvCount || 3;
	if(fastPlay) {
		multiPvCount = 1;
	}
	var profile = GetSkillProfile();
	var searchWallClockStart = NowMs();
	var reportProgress = (options.reportProgress === true);
	var progressThrottleMs = parseInt(options.progressThrottleMs, 10);
	if(isNaN(progressThrottleMs) || progressThrottleMs < 50) {
		progressThrottleMs = 120;
	}
	var adaptiveTime = (options.adaptiveTime === true);
	var softTimeMs = (typeof options.softTimeMs === "number") ? options.softTimeMs : null;
	if(softTimeMs === null) {
		softTimeMs = srch_time;
	}
	softTimeMs = Clamp(softTimeMs, 25, srch_time);
	var deterministicProfile = (profile.randomnessCp === 0 && profile.pickWindowCp === 0);
	var baseTimeMs = srch_time;
	srch_lowTimeFastMode = (fastPlay === true && baseTimeMs <= 300) ? BOOL.TRUE : BOOL.FALSE;
	var lowTimeFastPlay = (srch_lowTimeFastMode == BOOL.TRUE);
	var instabilityBestMove = NOMOVE;
	var instabilityBestScore = 0;
	var instabilityStreak = 0;
	var instabilityExtraBudget = (deterministicProfile === true) ?
		(lowTimeFastPlay ?
			Math.min(Math.max(12, Math.floor(baseTimeMs * 0.12)), 40) :
			Math.min(Math.max(120, Math.floor(baseTimeMs * 0.10)), 1200)
		) : 0;
	var instabilityExtraUsed = 0;
	var instabilityExtendStep = lowTimeFastPlay ?
		Math.min(20, Math.max(8, Math.floor(baseTimeMs * 0.08))) :
		Math.max(120, Math.floor(baseTimeMs * 0.08));
	var instabilityTriggerMs = lowTimeFastPlay ?
		Math.max(50, Math.floor(baseTimeMs * 0.65)) :
		1200;
	var stableDepths = 0;
	var lastStableMove = NOMOVE;
	var lastStableScore = 0;

	var result = {
		side: brd_side,
		bestMove: NOMOVE,
		playMove: NOMOVE,
		bestScore: 0,
		depth: 0,
		nodes: 0,
		timeMs: 0,
		topMoves: [],
		pvLine: "",
		fromBook: false,
		renderAnalysis: renderAnalysis
	};

	var boardStateBeforeSearch = CaptureBoardState(CreateBoardStateBuffer(), false);
	ClearForSearch();
	try {

	if(useBook && GameController.BookLoaded == BOOL.TRUE) {
		var bookStats = GetBookMoveStats(options.bookLine, 0);
		if(bookStats.length > 0) {
			var chosenBook = PickWeightedBookMove(bookStats);
			if(profile.randomnessCp === 0 && profile.pickWindowCp === 0 && forceUltimateBook === false) {
				// Non-ultimate deterministic profiles can keep picking the strongest book line.
				chosenBook = bookStats[0].move;
			}
			for(var b = 0; b < bookStats.length; ++b) {
				result.topMoves.push({
					move: bookStats[b].move,
					score: 0,
					pv: PrMove(bookStats[b].move),
					isBook: true,
					bookCount: bookStats[b].count
				});
			}
			result.bestMove = result.topMoves[0].move;
			result.playMove = chosenBook;
			result.bestScore = 0;
			result.depth = 0;
			result.nodes = 0;
			result.timeMs = 0;
			result.pvLine = PrMove(result.bestMove);
			result.fromBook = true;
			if(renderAnalysis) {
				SafeRenderSearchResult(result);
			}
			srch_best = result.playMove;
			return result;
		}
	}

	var bestMove = NOMOVE;
	var bestScore = -INFINITE;
	var completedDepth = 0;
	var bestPvLine = "";
	var lastProgressAt = searchWallClockStart;
	var searchHitTimeLimit = BOOL.FALSE;
	var aspirationBase = (profile.randomnessCp === 0 && profile.pickWindowCp === 0) ? 36 : 50;

	function EmitSearchProgress() {
		if(typeof SearchProgressCallback !== "function") return;
		if(bestMove == NOMOVE) return;
		var pvLine = bestPvLine.length ? bestPvLine : PrMove(bestMove);
		SearchProgressCallback({
			side: brd_side,
			bestMove: bestMove,
			playMove: bestMove,
			bestScore: bestScore,
			depth: completedDepth,
			nodes: srch_nodes,
			timeMs: NowMs() - searchWallClockStart,
			topMoves: [{
				move: bestMove,
				score: bestScore,
				pv: pvLine,
				isBook: false
			}],
			pvLine: pvLine,
			fromBook: false,
			renderAnalysis: true,
			progressOnly: true
		});
	}

	for(var currentDepth = 1; currentDepth <= srch_depth; ++currentDepth) {
		if(deterministicProfile === true && currentDepth > 1 && instabilityExtraUsed < instabilityExtraBudget) {
			var preDepthElapsedMs = NowMs() - searchWallClockStart;
			if(preDepthElapsedMs >= Math.max(instabilityTriggerMs, Math.floor(srch_time * 0.7)) &&
				completedDepth == (currentDepth - 1) &&
				currentDepth < srch_depth &&
				Math.abs(bestScore) <= 80) {
				var preRemainingBudget = instabilityExtraBudget - instabilityExtraUsed;
				var preExtendBy = Math.min(preRemainingBudget, instabilityExtendStep);
				if(preExtendBy > 0) {
					srch_time += preExtendBy;
					instabilityExtraUsed += preExtendBy;
					softTimeMs = Clamp(softTimeMs + Math.floor(preExtendBy * 0.5), 25, srch_time);
				}
			}
		}
		var window = aspirationBase;
		var alpha = -INFINITE;
		var beta = INFINITE;

		if(currentDepth > 1) {
			alpha = bestScore - window;
			beta = bestScore + window;
			if(alpha < -INFINITE) alpha = -INFINITE;
			if(beta > INFINITE) beta = INFINITE;
		}
		var depthSnapshotBestMove = bestMove;
		var depthSnapshotBestScore = bestScore;
		var depthSnapshotSrchBest = srch_best;

		for(;;) {
			var score = AlphaBeta(alpha, beta, currentDepth, BOOL.TRUE);
			if(srch_stop == BOOL.TRUE) {
				bestMove = depthSnapshotBestMove;
				bestScore = depthSnapshotBestScore;
				srch_best = depthSnapshotSrchBest;
				break;
			}

			if(score <= alpha || score >= beta) {
				window = window << 1;
				alpha = score - window;
				beta = score + window;
				if(alpha < -INFINITE) alpha = -INFINITE;
				if(beta > INFINITE) beta = INFINITE;
				continue;
			}

			bestScore = score;
			break;
		}

		if(srch_stop == BOOL.TRUE) break;

		var pvNum = GetPvLine(currentDepth);
		if(pvNum > 0) {
			bestMove = brd_PvArray[0];
			completedDepth = currentDepth;
			var pvParts = [];
			for(var p = 0; p < pvNum; ++p) {
				pvParts.push(PrMove(brd_PvArray[p]));
			}
			bestPvLine = pvParts.join(" ");
		} else if(srch_best != NOMOVE) {
			bestMove = srch_best;
			completedDepth = currentDepth;
			bestPvLine = PrMove(bestMove);
		} else if(currentDepth === 1) {
			bestMove = srch_best;
			completedDepth = currentDepth;
		}
		if(deterministicProfile === true && bestMove != NOMOVE) {
			var scoreSwing = Math.abs(bestScore - instabilityBestScore);
			var moveChanged = (instabilityBestMove != NOMOVE && bestMove != instabilityBestMove);
			if(moveChanged || scoreSwing >= 45) {
				instabilityStreak++;
			} else if(instabilityStreak > 0) {
				instabilityStreak--;
			}
			instabilityBestMove = bestMove;
			instabilityBestScore = bestScore;

			var elapsedMs = NowMs() - searchWallClockStart;
			var uncertainNode = Math.abs(bestScore) <= 80;
			var volatileNode = (moveChanged || scoreSwing >= 45 || instabilityStreak >= 2);
			if(instabilityExtraUsed < instabilityExtraBudget &&
				currentDepth >= 7 &&
				completedDepth == currentDepth &&
				currentDepth < srch_depth &&
				Math.abs(bestScore) <= 280 &&
				(uncertainNode || volatileNode) &&
				elapsedMs >= Math.max(instabilityTriggerMs, Math.floor(srch_time * 0.7))) {
				var remainingBudget = instabilityExtraBudget - instabilityExtraUsed;
				var extendBy = Math.min(remainingBudget, instabilityExtendStep);
				if(extendBy > 0) {
					srch_time += extendBy;
					instabilityExtraUsed += extendBy;
					softTimeMs = Clamp(softTimeMs + Math.floor(extendBy * 0.5), 25, srch_time);
				}
			}
		}
		if(reportProgress && (NowMs() - lastProgressAt) >= progressThrottleMs) {
			EmitSearchProgress();
			lastProgressAt = NowMs();
		}
		if(adaptiveTime && bestMove != NOMOVE) {
			var scoreDelta = Math.abs(bestScore - lastStableScore);
			if(bestMove == lastStableMove && scoreDelta <= 35) {
				stableDepths++;
			} else {
				stableDepths = 0;
			}
			lastStableMove = bestMove;
			lastStableScore = bestScore;
			if((NowMs() - searchWallClockStart) >= softTimeMs && stableDepths >= 2) {
				break;
			}
		}
	}
	searchHitTimeLimit = srch_stop;

	result.nodes = srch_nodes;
	result.depth = completedDepth;

	if(bestMove == NOMOVE || MoveExists(bestMove) == BOOL.FALSE) {
		var savedStop = srch_stop;
		var savedStart = srch_start;
		var savedTime = srch_time;
		srch_stop = BOOL.FALSE;
		srch_start = NowMs();
		srch_time = Math.min(200, Math.max(50, savedTime));
		var fallbackMoves = SearchRootWithTopMoves(1, 1);
		srch_stop = savedStop;
		srch_start = savedStart;
		srch_time = savedTime;
		if(fallbackMoves.length > 0 && fallbackMoves[0].move != NOMOVE) {
			bestMove = fallbackMoves[0].move;
			bestScore = fallbackMoves[0].score;
			bestPvLine = fallbackMoves[0].pv || PrMove(bestMove);
			if(completedDepth == 0) {
				completedDepth = 1;
				result.depth = completedDepth;
			}
		}
	}

	if(bestMove == NOMOVE) {
		result.timeMs = NowMs() - searchWallClockStart;
		if(renderAnalysis) {
			SafeRenderSearchResult(result);
		}
		srch_best = NOMOVE;
		return result;
	}

	// Never let a shallow tie-break override a reasonably deep completed search.
	if(deterministicProfile === true && searchHitTimeLimit == BOOL.TRUE && completedDepth > 0 &&
		completedDepth <= 2 && Math.abs(bestScore) <= 200) {
		var tieSavedStop = srch_stop;
		var tieSavedStart = srch_start;
		var tieSavedTime = srch_time;
		srch_stop = BOOL.FALSE;
		srch_start = NowMs();
		srch_time = Math.max(90, Math.min(220, tieSavedTime));
		var tieDepth = 2;
		var tieMoves = SearchRootWithTopMoves(tieDepth, Math.max(3, multiPvCount || 1));
		srch_stop = tieSavedStop;
		srch_start = tieSavedStart;
		srch_time = tieSavedTime;
		if(tieMoves.length > 0) {
			tieMoves.sort(function(a, b) {
				if(b.score != a.score) return b.score - a.score;
				return a.move - b.move;
			});
			var tieBest = tieMoves[0];
			if(tieBest && tieBest.move != NOMOVE && typeof tieBest.score === "number") {
				if(Math.abs(tieBest.score - bestScore) <= 24) {
					bestMove = tieBest.move;
					bestScore = tieBest.score;
					bestPvLine = tieBest.pv || PrMove(bestMove);
				}
			}
		}
	}

	// Keep the strongest move from full iterative deepening as the engine's anchor.
	result.bestMove = bestMove;
	result.bestScore = bestScore;
	if(bestPvLine.length === 0) {
		bestPvLine = PrMove(bestMove);
	}

	if(fastPlay) {
		result.topMoves = [{
			move: bestMove,
			score: bestScore,
			depth: completedDepth,
			pv: bestPvLine,
			isBook: false,
			isEngineChoice: true
		}];
		result.pvLine = bestPvLine;
		result.playMove = PickMoveBySkill(result.topMoves, profile);
		if(result.playMove == NOMOVE) {
			result.playMove = bestMove;
		}
		if(deterministicProfile !== true && bestScore > AVOID_REPETITION_WINNING_CP && MoveAllowsOpponentRepetition(result.playMove, 1) == BOOL.TRUE) {
			var repDepth = Math.max(1, Math.min(completedDepth, 2));
			var repMoves = SearchRootWithTopMoves(repDepth, Math.max(6, multiPvCount || 3));
			var bestAltMove = NOMOVE;
			var bestAltScore = -INFINITE;
			for(var r = 0; r < repMoves.length; ++r) {
				if(repMoves[r].move == NOMOVE) continue;
				if(MoveAllowsOpponentRepetition(repMoves[r].move, 1) == BOOL.TRUE) continue;
				if(typeof repMoves[r].score === "number" && repMoves[r].score > bestAltScore) {
					bestAltScore = repMoves[r].score;
					bestAltMove = repMoves[r].move;
				}
			}
			if(bestAltMove != NOMOVE && bestAltScore >= (bestScore - REP_AVOID_MAX_DROP_CP)) {
				result.playMove = bestAltMove;
			}
		}
		result.playMove = EnsurePlayableMove(result.playMove);
		result.timeMs = NowMs() - searchWallClockStart;
		if(renderAnalysis) {
			SafeRenderSearchResult(result);
		}
		srch_best = result.playMove;
		return result;
	}

	if(renderAnalysis === false) {
		result.topMoves = [{
			move: bestMove,
			score: bestScore,
			depth: completedDepth,
			pv: bestPvLine,
			isBook: false,
			isEngineChoice: true
		}];
		result.pvLine = bestPvLine;
		result.playMove = PickMoveBySkill(result.topMoves, profile);
		if(result.playMove == NOMOVE) {
			result.playMove = bestMove;
		}
		result.playMove = EnsurePlayableMove(result.playMove);
		result.timeMs = NowMs() - searchWallClockStart;
		srch_best = result.playMove;
		return result;
	}

	var topDepth = Math.max(1, Math.min(completedDepth, 4));
	var topMoves = [];
	var savedStop = srch_stop;
	var savedStart = srch_start;
	var savedTime = srch_time;
	var remainingBudget = savedTime - (NowMs() - savedStart);
	var topMoveBudget = Math.min(120, Math.max(0, remainingBudget));

	if(topMoveBudget >= 30) {
		srch_stop = BOOL.FALSE;
		srch_start = NowMs();
		srch_time = topMoveBudget;
		topMoves = SearchRootWithTopMoves(topDepth, multiPvCount);
	}

	srch_stop = savedStop;
	srch_start = savedStart;
	srch_time = savedTime;

	var hasBest = false;
	for(var t = 0; t < topMoves.length; ++t) {
		if(topMoves[t].move == bestMove) {
			topMoves[t].score = bestScore;
			topMoves[t].depth = completedDepth;
			hasBest = true;
			break;
		}
	}
	if(hasBest == false) {
		topMoves.unshift({
			move: bestMove,
			score: bestScore,
			depth: completedDepth,
			pv: bestPvLine,
			isBook: false
		});
	}
	topMoves.sort(function(a, b) { return b.score - a.score; });
	if(topMoves.length > multiPvCount) {
		topMoves.length = multiPvCount;
	}
	var bestTopIndex = -1;
	for(var bmScan = 0; bmScan < topMoves.length; ++bmScan) {
		if(topMoves[bmScan].move == bestMove) {
			bestTopIndex = bmScan;
			break;
		}
	}
	if(bestTopIndex < 0 && bestMove != NOMOVE) {
		var bestItem = {
			move: bestMove,
			score: bestScore,
			depth: completedDepth,
			pv: bestPvLine,
			isBook: false
		};
		if(topMoves.length >= multiPvCount && topMoves.length > 0) {
			topMoves[topMoves.length - 1] = bestItem;
		} else {
			topMoves.push(bestItem);
		}
		bestTopIndex = topMoves.length - 1;
	}
	if(bestTopIndex > 0) {
		var anchor = topMoves[bestTopIndex];
		topMoves.splice(bestTopIndex, 1);
		topMoves.unshift(anchor);
		if(topMoves.length > multiPvCount) {
			topMoves.length = multiPvCount;
		}
	}
	for(var tmIdx = 0; tmIdx < topMoves.length; ++tmIdx) {
		topMoves[tmIdx].isEngineChoice = (topMoves[tmIdx].move == bestMove);
	}

	result.topMoves = topMoves;
	result.pvLine = topMoves.length ? topMoves[0].pv : bestPvLine;
	if(profile.randomnessCp === 0 && profile.pickWindowCp === 0) {
		result.playMove = bestMove;
	} else {
		result.playMove = PickMoveBySkill(topMoves, profile);
		if(result.playMove == NOMOVE) {
			result.playMove = bestMove;
		}
	}
	result.playMove = EnsurePlayableMove(result.playMove);
	result.timeMs = NowMs() - searchWallClockStart;

	if(renderAnalysis) {
		SafeRenderSearchResult(result);
	}
	srch_best = result.playMove;
	return result;
	} finally {
		RestoreBoardState(boardStateBeforeSearch, false);
		EndSearchState();
		if(SearchTraceState.enabled === true) {
			result.searchTrace = GetSearchTraceEntries();
		}

		// Search helpers may explore and unwind aggressively; validate published moves on the restored root.
		var legalPlay = EnsurePlayableMove(result.playMove != NOMOVE ? result.playMove : result.bestMove);
		if(result.bestMove != NOMOVE && MoveExists(result.bestMove) != BOOL.TRUE) {
			result.bestMove = legalPlay;
		}
		result.playMove = legalPlay;

		if(result.topMoves && result.topMoves.length > 0) {
			var legalTopMoves = [];
			for(var tm = 0; tm < result.topMoves.length; ++tm) {
				var item = result.topMoves[tm];
				if(item && item.move != NOMOVE && MoveExists(item.move) == BOOL.TRUE) {
					legalTopMoves.push(item);
				}
			}
			if(legalTopMoves.length == 0 && result.bestMove != NOMOVE) {
				legalTopMoves.push({
					move: result.bestMove,
					score: result.bestScore,
					pv: (result.pvLine && result.pvLine.length > 0) ? result.pvLine : PrMove(result.bestMove),
					isBook: false
				});
			}
			result.topMoves = legalTopMoves;
		}
	}
}

function RunBenchSuite(thinkMs) {
	var benchTimeMs = parseInt(thinkMs, 10);
	if(isNaN(benchTimeMs) || benchTimeMs < 100) {
		benchTimeMs = 2000;
	}

	var benchFens = [
		{ name: "Start", fen: START_FEN },
		{ name: "Tactical", fen: "r2q1rk1/ppp2ppp/2npbn2/3Np3/2B1P3/2N5/PPP2PPP/R1BQ1RK1 w - - 0 1" },
		{ name: "Endgame", fen: "8/2p5/2P2k2/3p2p1/3P2P1/5K2/8/8 w - - 0 1" }
	];

	var originalFen = BoardToFen();
	var originalResult = GameController.LastSearchResult;
	var originalGameOver = GameController.GameOver;
	var summary = [];
	var totalNodes = 0;
	var totalTime = 0;

	for(var i = 0; i < benchFens.length; ++i) {
		ParseFen(benchFens[i].fen);
		SetInitialBoardPieces();
		GameController.GameOver = BOOL.FALSE;

		srch_depth = MAXDEPTH;
		srch_time = benchTimeMs;
		var result = SearchPosition({
			useBook: false,
			fastPlay: true,
			renderAnalysis: false,
			multiPvCount: 1
		});

		var nps = result.timeMs > 0 ? Math.round((result.nodes * 1000) / result.timeMs) : 0;
		totalNodes += result.nodes;
		totalTime += result.timeMs;
		summary.push({
			name: benchFens[i].name,
			bestMove: result.bestMove != NOMOVE ? PrMove(result.bestMove) : "-",
			nodes: result.nodes,
			timeMs: result.timeMs,
			nps: nps,
			depth: result.depth
		});
	}

	var avgNps = totalTime > 0 ? Math.round((totalNodes * 1000) / totalTime) : 0;
	console.table(summary);
	console.log("Bench average NPS: " + avgNps);

	ParseFen(originalFen);
	SetInitialBoardPieces();
	GameController.LastSearchResult = originalResult;
	GameController.LastSearchFenKey = originalResult ? CurrentFenKey() : "";
	GameController.GameOver = originalGameOver;
	if(originalResult && originalResult.renderAnalysis !== false) {
		SafeRenderSearchResult(originalResult);
	} else {
		ClearTopMoveArrows();
	}
	CheckAndSet();

	return {
		benchTimeMs: benchTimeMs,
		avgNps: avgNps,
		results: summary
	};
}
