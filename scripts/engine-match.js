#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

function usage() {
  return [
    'Usage:',
    '  node engine-match.js --a <engineA.js> --b <engineB.js> [options]',
    '',
    'Required:',
    '  --a <path>              Engine A (all.js-like bundle)',
    '  --b <path>              Engine B (all.js-like bundle)',
    '',
    'Options:',
    '  --book <path>           Opening book XML (default: bookXml.xml)',
    '  --games <n>             Total games (pairs colors per opening when possible) (default: 40)',
    '  --time <ms>             Time per move (default: 250)',
    '  --softTime <ms>         Soft time per move (default: same as --time)',
    '  --depth <n>             Search depth cap (default: engine max)',
    '  --skill <1..9>          Engine skill profile (default: 8)',
    '  --tt <mb>               Transposition table target MB (default: 64)',
    '  --maxPlies <n>          Max plies per game before draw (default: 400)',
    '  --openingMinPlies <n>   Min plies from book line to pre-play (default: 6)',
    '  --openingMaxPlies <n>   Max plies from book line to pre-play (default: 12)',
    '  --useEngineBook         Let engines keep using the book after the opening (default: off)',
    '  --seed <n>              Deterministic randomness (opening selection + engine book, if enabled)',
    '  --quiet                 Reduce output (still prints each game summary)',
    '  --help                 Show this help'
  ].join('\n');
}

function parseArgs(argv) {
  const out = {
    a: null,
    b: null,
    book: 'bookXml.xml',
    games: 40,
    time: 250,
    softTime: null,
    depth: null,
    skill: 8,
    tt: 64,
    maxPlies: 400,
    openingMinPlies: 6,
    openingMaxPlies: 12,
    useEngineBook: false,
    seed: null,
    quiet: false
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (a === '--useEngineBook') {
      out.useEngineBook = true;
      continue;
    }
    if (a === '--quiet') {
      out.quiet = true;
      continue;
    }

    if (!a.startsWith('--')) {
      throw new Error(`Unexpected arg: ${a}`);
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (typeof next === 'undefined' || next.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    i++;

    const setNum = (k) => {
      const v = Number(next);
      if (!Number.isFinite(v)) throw new Error(`Invalid number for --${k}: ${next}`);
      out[k] = v;
    };

    switch (key) {
      case 'a': out.a = next; break;
      case 'b': out.b = next; break;
      case 'book': out.book = next; break;
      case 'games': setNum('games'); break;
      case 'time': setNum('time'); break;
      case 'softTime': setNum('softTime'); break;
      case 'depth': setNum('depth'); break;
      case 'skill': setNum('skill'); break;
      case 'tt': setNum('tt'); break;
      case 'maxPlies': setNum('maxPlies'); break;
      case 'openingMinPlies': setNum('openingMinPlies'); break;
      case 'openingMaxPlies': setNum('openingMaxPlies'); break;
      case 'seed': setNum('seed'); break;
      default:
        throw new Error(`Unknown flag: --${key}`);
    }
  }

  if (!out.a || !out.b) {
    console.log(usage());
    process.exit(1);
  }

  out.a = path.resolve(process.cwd(), out.a);
  out.b = path.resolve(process.cwd(), out.b);
  out.book = path.resolve(process.cwd(), out.book);

  out.games = Math.max(1, Math.floor(out.games));
  out.time = Math.max(25, Math.floor(out.time));
  out.softTime = out.softTime == null ? null : Math.max(25, Math.floor(out.softTime));
  out.depth = out.depth == null ? null : Math.max(1, Math.floor(out.depth));
  out.skill = Math.min(9, Math.max(1, Math.floor(out.skill)));
  out.tt = Math.max(16, Math.floor(out.tt));
  out.maxPlies = Math.max(40, Math.floor(out.maxPlies));
  out.openingMinPlies = Math.max(0, Math.floor(out.openingMinPlies));
  out.openingMaxPlies = Math.max(out.openingMinPlies, Math.floor(out.openingMaxPlies));

  return out;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  if (max < min) [min, max] = [max, min];
  const span = (max - min + 1);
  return min + Math.floor(rng() * span);
}

function loadBookLines(bookPath) {
  const xml = fs.readFileSync(bookPath, 'utf8');
  const lines = [];
  const re = /<line>([\s\S]*?)<\/line>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const line = (m[1] || '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    lines.push(line);
  }
  if (lines.length === 0) {
    throw new Error(`No <line> entries found in ${bookPath}`);
  }
  return lines;
}

class Chess0x88 {
  constructor(fen) {
    this.board = new Array(128).fill(null);
    this.turnColor = 'w';
    this.castling = { K: false, Q: false, k: false, q: false };
    this.ep = null;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history = [];
    this.rep = new Map();
    this.loadFen(fen || Chess0x88.START_FEN);
  }

  static sqTo0x88(sq) {
    const file = sq.charCodeAt(0) - 97;
    const rank = sq.charCodeAt(1) - 49;
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return file + (rank << 4);
  }

  static sqFrom0x88(i) {
    const file = i & 7;
    const rank = i >> 4;
    return String.fromCharCode(97 + file) + String.fromCharCode(49 + rank);
  }

  static pieceColor(p) {
    if (!p) return null;
    return p === p.toUpperCase() ? 'w' : 'b';
  }

  static isSliding(p) {
    const u = p.toLowerCase();
    return u === 'b' || u === 'r' || u === 'q';
  }

  loadFen(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) throw new Error(`Invalid FEN: ${fen}`);

    this.board.fill(null);
    const rows = parts[0].split('/');
    if (rows.length !== 8) throw new Error(`Invalid FEN: ${fen}`);

    for (let r = 7; r >= 0; r--) {
      const row = rows[7 - r];
      let file = 0;
      for (let k = 0; k < row.length; k++) {
        const c = row[k];
        if (c >= '1' && c <= '8') {
          file += Number(c);
          continue;
        }
        const sq = file + (r << 4);
        this.board[sq] = c;
        file++;
      }
      if (file !== 8) throw new Error(`Invalid FEN: ${fen}`);
    }

    this.turnColor = parts[1] === 'b' ? 'b' : 'w';
    const cast = parts[2];
    this.castling = { K: false, Q: false, k: false, q: false };
    if (cast !== '-') {
      for (const c of cast) {
        if (c in this.castling) this.castling[c] = true;
      }
    }
    this.ep = parts[3] === '-' ? null : Chess0x88.sqTo0x88(parts[3]);
    this.halfmove = parts[4] ? Math.max(0, parseInt(parts[4], 10) || 0) : 0;
    this.fullmove = parts[5] ? Math.max(1, parseInt(parts[5], 10) || 1) : 1;

    this.history = [];
    this.rep = new Map();
    this._bumpRepetition();
  }

  fen() {
    const rows = [];
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      let row = '';
      for (let f = 0; f < 8; f++) {
        const sq = f + (r << 4);
        const p = this.board[sq];
        if (!p) {
          empty++;
        } else {
          if (empty) row += String(empty);
          empty = 0;
          row += p;
        }
      }
      if (empty) row += String(empty);
      rows.push(row);
    }
    const cast = Object.entries(this.castling).filter(([, v]) => v).map(([k]) => k).join('') || '-';
    const ep = this.ep == null ? '-' : Chess0x88.sqFrom0x88(this.ep);
    return `${rows.join('/')} ${this.turnColor} ${cast} ${ep} ${this.halfmove} ${this.fullmove}`;
  }

  turn() {
    return this.turnColor;
  }

  _posKey() {
    const cast = Object.entries(this.castling).filter(([, v]) => v).map(([k]) => k).join('') || '-';
    const ep = this.ep == null ? '-' : Chess0x88.sqFrom0x88(this.ep);
    return `${this.fen().split(' ').slice(0, 1).join('')} ${this.turnColor} ${cast} ${ep}`;
  }

  _bumpRepetition() {
    const k = this._posKey();
    this.rep.set(k, (this.rep.get(k) || 0) + 1);
  }

  _findKing(color) {
    const target = color === 'w' ? 'K' : 'k';
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      if (this.board[sq] === target) return sq;
    }
    return null;
  }

  isAttacked(square, byColor) {
    const pawn = byColor === 'w' ? 'P' : 'p';
    const knight = byColor === 'w' ? 'N' : 'n';
    const bishop = byColor === 'w' ? 'B' : 'b';
    const rook = byColor === 'w' ? 'R' : 'r';
    const queen = byColor === 'w' ? 'Q' : 'q';
    const king = byColor === 'w' ? 'K' : 'k';

    const pawnDeltas = byColor === 'w' ? [-17, -15] : [17, 15];
    for (const d of pawnDeltas) {
      const s = square + d;
      if (!(s & 0x88) && this.board[s] === pawn) return true;
    }

    const knightDeltas = [-33, -31, -18, -14, 14, 18, 31, 33];
    for (const d of knightDeltas) {
      const s = square + d;
      if (!(s & 0x88) && this.board[s] === knight) return true;
    }

    const bishopDirs = [-17, -15, 15, 17];
    for (const d of bishopDirs) {
      let s = square + d;
      while (!(s & 0x88)) {
        const p = this.board[s];
        if (p) {
          if (p === bishop || p === queen) return true;
          break;
        }
        s += d;
      }
    }

    const rookDirs = [-16, -1, 1, 16];
    for (const d of rookDirs) {
      let s = square + d;
      while (!(s & 0x88)) {
        const p = this.board[s];
        if (p) {
          if (p === rook || p === queen) return true;
          break;
        }
        s += d;
      }
    }

    const kingDeltas = [-17, -16, -15, -1, 1, 15, 16, 17];
    for (const d of kingDeltas) {
      const s = square + d;
      if (!(s & 0x88) && this.board[s] === king) return true;
    }

    return false;
  }

  inCheck(color) {
    const ksq = this._findKing(color);
    if (ksq == null) return false;
    const opp = color === 'w' ? 'b' : 'w';
    return this.isAttacked(ksq, opp);
  }

  _generatePseudoMoves() {
    const moves = [];
    const us = this.turnColor;
    const them = us === 'w' ? 'b' : 'w';

    const addMove = (from, to, promo, flags) => {
      moves.push({ from, to, promo: promo || null, flags: flags || '' });
    };

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const p = this.board[sq];
      if (!p || Chess0x88.pieceColor(p) !== us) continue;

      const pl = p.toLowerCase();

      if (pl === 'p') {
        const dir = us === 'w' ? 16 : -16;
        const startRank = us === 'w' ? 1 : 6;
        const promoRank = us === 'w' ? 7 : 0;

        const one = sq + dir;
        if (!(one & 0x88) && !this.board[one]) {
          const toRank = one >> 4;
          if (toRank === promoRank) {
            for (const pr of ['q', 'r', 'b', 'n']) addMove(sq, one, pr, 'p');
          } else {
            addMove(sq, one, null, '');
            const two = one + dir;
            if ((sq >> 4) === startRank && !this.board[two]) {
              addMove(sq, two, null, 'b');
            }
          }
        }

        const caps = us === 'w' ? [15, 17] : [-15, -17];
        for (const d of caps) {
          const to = sq + d;
          if (to & 0x88) continue;
          const tp = this.board[to];
          if (tp && Chess0x88.pieceColor(tp) === them) {
            const toRank = to >> 4;
            if (toRank === promoRank) {
              for (const pr of ['q', 'r', 'b', 'n']) addMove(sq, to, pr, 'cp');
            } else {
              addMove(sq, to, null, 'c');
            }
          }
          if (this.ep != null && to === this.ep) {
            addMove(sq, to, null, 'e');
          }
        }
        continue;
      }

      if (pl === 'n') {
        const deltas = [-33, -31, -18, -14, 14, 18, 31, 33];
        for (const d of deltas) {
          const to = sq + d;
          if (to & 0x88) continue;
          const tp = this.board[to];
          if (!tp || Chess0x88.pieceColor(tp) === them) addMove(sq, to, null, tp ? 'c' : '');
        }
        continue;
      }

      if (pl === 'b' || pl === 'r' || pl === 'q') {
        const dirs = [];
        if (pl === 'b' || pl === 'q') dirs.push(-17, -15, 15, 17);
        if (pl === 'r' || pl === 'q') dirs.push(-16, -1, 1, 16);

        for (const d of dirs) {
          let to = sq + d;
          while (!(to & 0x88)) {
            const tp = this.board[to];
            if (!tp) {
              addMove(sq, to, null, '');
            } else {
              if (Chess0x88.pieceColor(tp) === them) addMove(sq, to, null, 'c');
              break;
            }
            to += d;
          }
        }
        continue;
      }

      if (pl === 'k') {
        const deltas = [-17, -16, -15, -1, 1, 15, 16, 17];
        for (const d of deltas) {
          const to = sq + d;
          if (to & 0x88) continue;
          const tp = this.board[to];
          if (!tp || Chess0x88.pieceColor(tp) === them) addMove(sq, to, null, tp ? 'c' : '');
        }

        if (us === 'w') {
          if (this.castling.K && !this.board[5] && !this.board[6]) {
            if (!this.isAttacked(4, them) && !this.isAttacked(5, them) && !this.isAttacked(6, them)) {
              addMove(4, 6, null, 'k');
            }
          }
          if (this.castling.Q && !this.board[3] && !this.board[2] && !this.board[1]) {
            if (!this.isAttacked(4, them) && !this.isAttacked(3, them) && !this.isAttacked(2, them)) {
              addMove(4, 2, null, 'q');
            }
          }
        } else {
          const e8 = 116;
          const f8 = 117;
          const g8 = 118;
          const d8 = 115;
          const c8 = 114;
          const b8 = 113;
          if (this.castling.k && !this.board[f8] && !this.board[g8]) {
            if (!this.isAttacked(e8, them) && !this.isAttacked(f8, them) && !this.isAttacked(g8, them)) {
              addMove(e8, g8, null, 'k');
            }
          }
          if (this.castling.q && !this.board[d8] && !this.board[c8] && !this.board[b8]) {
            if (!this.isAttacked(e8, them) && !this.isAttacked(d8, them) && !this.isAttacked(c8, them)) {
              addMove(e8, c8, null, 'q');
            }
          }
        }
      }
    }

    return moves;
  }

  _makeMoveRaw(m) {
    const us = this.turnColor;
    const them = us === 'w' ? 'b' : 'w';
    const fromP = this.board[m.from];
    const toP = this.board[m.to];

    const undo = {
      from: m.from,
      to: m.to,
      fromP,
      toP,
      turn: this.turnColor,
      castling: { ...this.castling },
      ep: this.ep,
      halfmove: this.halfmove,
      fullmove: this.fullmove,
      epCaptureSq: null,
      rookFrom: null,
      rookTo: null,
      rookPiece: null
    };

    this.ep = null;

    const isPawn = fromP && fromP.toLowerCase() === 'p';
    const isCapture = !!toP || m.flags.includes('e');

    if (isPawn || isCapture) this.halfmove = 0;
    else this.halfmove++;

    if (m.flags.includes('e')) {
      const capSq = us === 'w' ? (m.to - 16) : (m.to + 16);
      undo.epCaptureSq = capSq;
      undo.toP = this.board[capSq];
      this.board[capSq] = null;
    }

    if (m.flags.includes('k')) {
      if (us === 'w') {
        undo.rookFrom = 7;
        undo.rookTo = 5;
      } else {
        undo.rookFrom = 119;
        undo.rookTo = 117;
      }
      undo.rookPiece = this.board[undo.rookFrom];
      this.board[undo.rookTo] = this.board[undo.rookFrom];
      this.board[undo.rookFrom] = null;
    } else if (m.flags.includes('q')) {
      if (us === 'w') {
        undo.rookFrom = 0;
        undo.rookTo = 3;
      } else {
        undo.rookFrom = 112;
        undo.rookTo = 115;
      }
      undo.rookPiece = this.board[undo.rookFrom];
      this.board[undo.rookTo] = this.board[undo.rookFrom];
      this.board[undo.rookFrom] = null;
    }

    this.board[m.from] = null;
    this.board[m.to] = fromP;

    if (m.promo) {
      const promoPiece = (us === 'w' ? m.promo.toUpperCase() : m.promo.toLowerCase());
      this.board[m.to] = promoPiece;
    }

    if (fromP === 'K') { this.castling.K = false; this.castling.Q = false; }
    if (fromP === 'k') { this.castling.k = false; this.castling.q = false; }

    if (m.from === 0 || m.to === 0) this.castling.Q = false;
    if (m.from === 7 || m.to === 7) this.castling.K = false;
    if (m.from === 112 || m.to === 112) this.castling.q = false;
    if (m.from === 119 || m.to === 119) this.castling.k = false;

    if (m.flags.includes('b')) {
      this.ep = us === 'w' ? (m.from + 16) : (m.from - 16);
    }

    this.turnColor = them;
    if (this.turnColor === 'w') this.fullmove++;

    return undo;
  }

  _undoMoveRaw(undo) {
    this.turnColor = undo.turn;
    this.castling = { ...undo.castling };
    this.ep = undo.ep;
    this.halfmove = undo.halfmove;
    this.fullmove = undo.fullmove;

    this.board[undo.from] = undo.fromP;
    this.board[undo.to] = undo.toP;

    if (undo.epCaptureSq != null) {
      this.board[undo.epCaptureSq] = undo.toP;
      this.board[undo.to] = null;
    }

    if (undo.rookFrom != null) {
      this.board[undo.rookFrom] = undo.rookPiece;
      this.board[undo.rookTo] = null;
    }
  }

  legalMoves() {
    const pseudo = this._generatePseudoMoves();
    const legal = [];
    const us = this.turnColor;

    for (const m of pseudo) {
      const undo = this._makeMoveRaw(m);
      const inCheck = this.inCheck(us);
      this._undoMoveRaw(undo);
      if (!inCheck) legal.push(m);
    }

    return legal;
  }

  makeMoveUci(uci) {
    const m = String(uci || '').trim();
    if (m.length < 4) return { ok: false, reason: 'bad_uci' };
    const from = Chess0x88.sqTo0x88(m.slice(0, 2));
    const to = Chess0x88.sqTo0x88(m.slice(2, 4));
    if (from == null || to == null) return { ok: false, reason: 'bad_uci' };
    const promo = m.length >= 5 ? m[4].toLowerCase() : null;

    const legal = this.legalMoves();
    let chosen = null;
    for (const mv of legal) {
      if (mv.from !== from || mv.to !== to) continue;
      if ((mv.promo || null) !== (promo || null)) continue;
      chosen = mv;
      break;
    }
    if (!chosen) return { ok: false, reason: 'illegal' };

    const undo = this._makeMoveRaw(chosen);
    this.history.push(undo);
    this._bumpRepetition();
    return { ok: true };
  }

  repetitionCount() {
    return this.rep.get(this._posKey()) || 0;
  }

  insufficientMaterial() {
    const pieces = [];
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const p = this.board[sq];
      if (p) pieces.push({ p, sq });
    }

    const majors = pieces.filter(x => ['q', 'r', 'p'].includes(x.p.toLowerCase()));
    if (majors.length > 0) return false;

    const minors = pieces.filter(x => ['b', 'n'].includes(x.p.toLowerCase()));
    if (minors.length === 0) return true;

    if (minors.length === 1) return true;

    if (minors.length === 2) {
      const bothBishops = minors.every(x => x.p.toLowerCase() === 'b');
      if (bothBishops) {
        const colors = minors.map(x => ((x.sq & 7) + (x.sq >> 4)) % 2);
        return colors[0] === colors[1];
      }
      const bothKnights = minors.every(x => x.p.toLowerCase() === 'n');
      if (bothKnights) return true;
    }

    return false;
  }

  gameStatus() {
    if (this.halfmove >= 100) {
      return { over: true, result: '1/2-1/2', reason: '50-move' };
    }
    if (this.repetitionCount() >= 3) {
      return { over: true, result: '1/2-1/2', reason: '3-fold' };
    }
    if (this.insufficientMaterial()) {
      return { over: true, result: '1/2-1/2', reason: 'insufficient' };
    }

    const legal = this.legalMoves();
    if (legal.length === 0) {
      if (this.inCheck(this.turnColor)) {
        const winner = this.turnColor === 'w' ? '0-1' : '1-0';
        return { over: true, result: winner, reason: 'checkmate' };
      }
      return { over: true, result: '1/2-1/2', reason: 'stalemate' };
    }

    return { over: false };
  }
}

Chess0x88.START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const WORKER_CODE = `
'use strict';
const fs = require('fs');
const vm = require('vm');
const { parentPort, workerData } = require('worker_threads');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (Number.isFinite(workerData.seed)) {
  Math.random = mulberry32(workerData.seed >>> 0);
}

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
      var key = selector + '::val';
      if(typeof value === 'undefined') return __workerStateStore[key] || '';
      __workerStateStore[key] = String(value);
      return this;
    },
    text: function(value) {
      var key = selector + '::text';
      if(typeof value === 'undefined') return __workerStateStore[key] || '';
      __workerStateStore[key] = String(value);
      return this;
    }
  };
}

global.self = global;
self.window = self;
self.document = { documentElement: { clientWidth: 1200 } };
self.$ = function(selector) {
  if (typeof selector === 'function') return makeStub('__ready__');
  return makeStub(String(selector));
};
self.$.trim = function(v) { return String(v).trim(); };
self.$.now = function() { return Date.now(); };
self.$.ajax = function() {};

function loadScript(p) {
  const code = fs.readFileSync(p, 'utf8');
  vm.runInThisContext(code, { filename: p });
}

loadScript(workerData.enginePath);

RenderSearchResult = function() {};

var WorkerEngineState = { initialized: false };

function EnsureWorkerInitialized(ttTargetMb, skillLevel) {
  var parsedTt = parseInt(ttTargetMb, 10);
  if (isNaN(parsedTt) || parsedTt < TT_MIN_MB) parsedTt = EngineSettings.ttTargetMb;

  if (WorkerEngineState.initialized !== true) {
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
  } else if (parsedTt !== TT_REQUEST_MB) {
    InitTT(parsedTt);
  }

  EngineSettings.ttTargetMb = parsedTt;

  var parsedSkill = parseInt(skillLevel, 10);
  if (!isNaN(parsedSkill) && SkillProfiles[parsedSkill]) {
    EngineSettings.skillLevel = parsedSkill;
  }
}

function post(type, payload) {
  parentPort.postMessage({ type, ...(payload || {}) });
}

function handleSetBook(msg) {
  const requestId = msg.requestId;
  EnsureWorkerInitialized(workerData.ttTargetMb, workerData.skillLevel);
  const bookLines = msg.bookLines;
  if (Array.isArray(bookLines)) {
    brd_bookLines = bookLines.slice(0);
    BuildBookIndex();
    GameController.BookLoaded = brd_bookLines.length > 0 ? BOOL.TRUE : BOOL.FALSE;
  }
  post('bookReady', { requestId, count: brd_bookLines.length });
}

function handleSearch(msg) {
  const requestId = msg.requestId;
  try {
    EnsureWorkerInitialized(workerData.ttTargetMb, workerData.skillLevel);
    const fen = msg.fen || START_FEN;

    if (ParseFen(fen) != BOOL.TRUE) {
      post('error', { requestId, message: 'Invalid FEN' });
      return;
    }

    const depth = Number.isFinite(msg.depth) ? msg.depth : (Number.isFinite(workerData.depth) ? workerData.depth : MAXDEPTH);
    const timeMs = Number.isFinite(msg.timeMs) ? msg.timeMs : workerData.timeMs;
    const softTimeMs = Number.isFinite(msg.softTimeMs) ? msg.softTimeMs : null;

    if(typeof SEARCH_CHECK_MASK === 'number') {
      if(timeMs <= 150) SEARCH_CHECK_MASK = 4095;
      else if(timeMs <= 300) SEARCH_CHECK_MASK = 8191;
      else if(timeMs <= 700) SEARCH_CHECK_MASK = 32767;
      else SEARCH_CHECK_MASK = 262143;
    }

    srch_depth = depth;
    srch_time = timeMs;

    const r = SearchPosition({
      useBook: msg.useBook === true,
      fastPlay: true,
      renderAnalysis: false,
      multiPvCount: 1,
      adaptiveTime: false,
      softTimeMs: softTimeMs,
      bookLine: typeof msg.gameLine === 'string' ? msg.gameLine : null
    });

    const moveUci = (r && r.playMove != NOMOVE) ? PrMove(r.playMove) : null;
    post('searchResult', { requestId, result: r, moveUci });
  } catch (e) {
    post('error', { requestId, message: (e && e.message) ? e.message : String(e) });
  }
}

parentPort.on('message', (msg) => {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'init') {
    EnsureWorkerInitialized(workerData.ttTargetMb, workerData.skillLevel);
    post('ready', { requestId: msg.requestId, ttAllocatedMb: TT_ALLOC_MB });
    return;
  }
  if (msg.type === 'setBook') {
    handleSetBook(msg);
    return;
  }
  if (msg.type === 'search') {
    handleSearch(msg);
    return;
  }
  if (msg.type === 'ping') {
    post('pong', {});
  }
});
`;

class EngineHandle {
  constructor(label, enginePath, opts) {
    this.label = label;
    this.enginePath = enginePath;
    this.opts = opts;
    this.worker = new Worker(WORKER_CODE, {
      eval: true,
      workerData: {
        enginePath,
        ttTargetMb: opts.tt,
        skillLevel: opts.skill,
        depth: opts.depth ?? null,
        timeMs: opts.time,
        seed: opts.seed
      }
    });
    this.nextId = 1;
    this.pending = new Map();

    this.worker.on('message', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'searchResult' || msg.type === 'error') {
        const id = msg.requestId;
        const p = this.pending.get(id);
        if (!p) return;
        this.pending.delete(id);
        if (msg.type === 'error') p.reject(new Error(`[${this.label}] ${msg.message || 'error'}`));
        else p.resolve(msg);
      }
      if (msg.type === 'ready' || msg.type === 'bookReady') {
        const id = msg.requestId;
        if (id != null) {
          const p = this.pending.get(id);
          if (p) {
            this.pending.delete(id);
            p.resolve(msg);
          }
        }
      }
    });

    this.worker.on('error', (err) => {
      for (const [, p] of this.pending) {
        p.reject(err);
      }
      this.pending.clear();
    });
  }

  _rpc(type, payload) {
    const requestId = this.nextId++;
    const msg = { type, requestId, ...(payload || {}) };
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage(msg);
    });
  }

  async init() {
    await this._rpc('init', {});
  }

  async setBook(lines) {
    await this._rpc('setBook', { bookLines: lines });
  }

  async search(fen, gameLine, searchOpts) {
    const o = searchOpts || {};
    const msg = {
      fen,
      gameLine,
      useBook: o.useBook === true,
      depth: Number.isFinite(o.depth) ? o.depth : (this.opts.depth ?? null),
      timeMs: Number.isFinite(o.timeMs) ? o.timeMs : this.opts.time,
      softTimeMs: Number.isFinite(o.softTimeMs) ? o.softTimeMs : (this.opts.softTime ?? null)
    };
    const res = await this._rpc('search', msg);
    return res.moveUci;
  }

  async close() {
    await this.worker.terminate();
  }
}

function formatMoveList(moves) {
  const out = [];
  for (let i = 0; i < moves.length; i += 2) {
    const moveNo = (i / 2) + 1;
    const w = moves[i] || '';
    const b = moves[i + 1] || '';
    out.push(`${moveNo}. ${w}${b ? ' ' + b : ''}`);
  }
  return out.join('\n');
}

function pickOpening(rng, bookLines, minPlies, maxPlies) {
  const line = bookLines[randInt(rng, 0, bookLines.length - 1)];
  const tokens = line.split(/\s+/).filter(Boolean);
  const plies = Math.min(tokens.length, randInt(rng, minPlies, Math.min(maxPlies, tokens.length)));
  return tokens.slice(0, plies);
}

async function playOneGame({
  gameId,
  startFen,
  openingMoves,
  engineWhite,
  engineBlack,
  opts,
  openingLineForBook
}) {
  const chess = new Chess0x88(startFen);
  const moves = openingMoves.slice();
  let gameLine = openingLineForBook;

  for (let ply = 0; ply < opts.maxPlies; ply++) {
    const status = chess.gameStatus();
    if (status.over) {
      return { moves, ...status };
    }

    const fen = chess.fen();
    const side = chess.turn();
    const engine = side === 'w' ? engineWhite : engineBlack;

    const moveUci = await engine.search(
      fen,
      gameLine,
      {
        useBook: opts.useEngineBook,
        timeMs: opts.time,
        softTimeMs: opts.softTime ?? null,
        depth: opts.depth ?? null
      }
    );

    if (!moveUci) {
      const res = side === 'w' ? '0-1' : '1-0';
      return { moves, over: true, result: res, reason: 'no-move' };
    }

    const applied = chess.makeMoveUci(moveUci);
    if (!applied.ok) {
      const res = side === 'w' ? '0-1' : '1-0';
      return { moves: moves.concat([moveUci]), over: true, result: res, reason: `illegal-move(${applied.reason})` };
    }

    moves.push(moveUci);
    gameLine = gameLine ? `${gameLine} ${moveUci}` : moveUci;

  }

  return { moves, over: true, result: '1/2-1/2', reason: `max-plies(${opts.maxPlies})` };
}

function scoreFromResult(result) {
  if (result === '1-0') return { w: 1, b: 0 };
  if (result === '0-1') return { w: 0, b: 1 };
  return { w: 0.5, b: 0.5 };
}

async function main() {
  const opts = parseArgs(process.argv);

  const rng = Number.isFinite(opts.seed) ? mulberry32(opts.seed >>> 0) : Math.random;
  const bookLines = loadBookLines(opts.book);

  const A = new EngineHandle('A', opts.a, {
    tt: opts.tt,
    skill: opts.skill,
    depth: opts.depth,
    time: opts.time,
    softTime: opts.softTime,
    seed: Number.isFinite(opts.seed) ? (opts.seed >>> 0) : null
  });
  const B = new EngineHandle('B', opts.b, {
    tt: opts.tt,
    skill: opts.skill,
    depth: opts.depth,
    time: opts.time,
    softTime: opts.softTime,
    seed: Number.isFinite(opts.seed) ? ((opts.seed + 1) >>> 0) : null
  });

  await Promise.all([A.init(), B.init()]);

  const bookForWorkers = bookLines.slice();
  await Promise.all([A.setBook(bookForWorkers), B.setBook(bookForWorkers)]);

  let scoreA = 0;
  let scoreB = 0;
  let draws = 0;

  const totalGames = opts.games;
  let playedGames = 0;
  let positionsUsed = 0;

  while (playedGames < totalGames) {
    positionsUsed++;
    let openingMoves = null;
    let startFen = null;

    for (let tries = 0; tries < 50; tries++) {
      const cand = pickOpening(rng, bookLines, opts.openingMinPlies, opts.openingMaxPlies);
      const c = new Chess0x88(Chess0x88.START_FEN);
      let ok = true;
      for (const mv of cand) {
        const r = c.makeMoveUci(mv);
        if (!r.ok) { ok = false; break; }
      }
      if (!ok) continue;
      openingMoves = cand;
      startFen = c.fen();
      break;
    }

    if (!openingMoves || !startFen) {
      throw new Error('Failed to build a legal starting position from the opening book');
    }

    const openingLineForBook = openingMoves.join(' ');

    const game1Id = playedGames + 1;
    console.log(`\n=== Game ${game1Id}/${totalGames} | A as White (starting) ===`);
    console.log(`StartFEN: ${startFen}`);
    console.log(`Opening (${openingMoves.length} plies): ${openingLineForBook || '(none)'}`);

    const g1 = await playOneGame({
      gameId: game1Id,
      startFen,
      openingMoves,
      engineWhite: A,
      engineBlack: B,
      opts,
      openingLineForBook
    });
    playedGames++;

    console.log(`Result: ${g1.result} (${g1.reason})`);

    const s1 = scoreFromResult(g1.result);
    scoreA += s1.w;
    scoreB += s1.b;
    if (g1.result === '1/2-1/2') draws++;

    if (playedGames < totalGames) {
      const game2Id = playedGames + 1;
      console.log(`\n=== Game ${game2Id}/${totalGames} | A as Black (starting) ===`);
      console.log(`StartFEN: ${startFen}`);
      console.log(`Opening (${openingMoves.length} plies): ${openingLineForBook || '(none)'}`);

      const g2 = await playOneGame({
        gameId: game2Id,
        startFen,
        openingMoves,
        engineWhite: B,
        engineBlack: A,
        opts,
        openingLineForBook
      });
      playedGames++;

      console.log(`Result: ${g2.result} (${g2.reason})`);

      const s2 = scoreFromResult(g2.result);
      scoreA += s2.b;
      scoreB += s2.w;
      if (g2.result === '1/2-1/2') draws++;
    }

    console.log(`\n--- After ${positionsUsed} position(s) (${playedGames}/${totalGames} games) ---`);
    console.log(`A: ${scoreA.toFixed(1)} | B: ${scoreB.toFixed(1)} | Draws: ${draws}`);
  }

  console.log('\n=== Final ===');
  console.log(`Games: ${totalGames} (positions used: ${positionsUsed})`);
  console.log(`A: ${scoreA.toFixed(1)}  |  B: ${scoreB.toFixed(1)}  |  Draws: ${draws}`);
  //log the names of the engines
  console.log(`Engine A: ${opts.a}`);
  console.log(`Engine B: ${opts.b}`);

  await Promise.all([A.close(), B.close()]);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
