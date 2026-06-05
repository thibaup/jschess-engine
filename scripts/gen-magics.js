'use strict';

const MASK64 = (1n << 64n) - 1n;

let seed = 0x9e3779b9 >>> 0;
function nextU32() {
  // xorshift32
  seed ^= (seed << 13) >>> 0;
  seed ^= seed >>> 17;
  seed ^= (seed << 5) >>> 0;
  return seed >>> 0;
}

function random64() {
  const lo = BigInt(nextU32());
  const hi = BigInt(nextU32());
  return ((hi << 32n) | lo) & MASK64;
}

function randomFewBits64() {
  return (random64() & random64() & random64()) & MASK64;
}

function sqToFile(sq) { return sq & 7; }
function sqToRank(sq) { return sq >> 3; }
function bit(sq) { return 1n << BigInt(sq); }

function popcountBig(x) {
  let n = 0;
  while (x) {
    x &= x - 1n;
    n++;
  }
  return n;
}

function rookMask(sq) {
  const file = sqToFile(sq);
  const rank = sqToRank(sq);
  let m = 0n;
  for (let r = rank + 1; r <= 6; r++) m |= bit((r << 3) + file);
  for (let r = rank - 1; r >= 1; r--) m |= bit((r << 3) + file);
  for (let f = file + 1; f <= 6; f++) m |= bit((rank << 3) + f);
  for (let f = file - 1; f >= 1; f--) m |= bit((rank << 3) + f);
  return m;
}

function bishopMask(sq) {
  const file = sqToFile(sq);
  const rank = sqToRank(sq);
  let m = 0n;
  for (let f = file + 1, r = rank + 1; f <= 6 && r <= 6; f++, r++) m |= bit((r << 3) + f);
  for (let f = file - 1, r = rank + 1; f >= 1 && r <= 6; f--, r++) m |= bit((r << 3) + f);
  for (let f = file + 1, r = rank - 1; f <= 6 && r >= 1; f++, r--) m |= bit((r << 3) + f);
  for (let f = file - 1, r = rank - 1; f >= 1 && r >= 1; f--, r--) m |= bit((r << 3) + f);
  return m;
}

function rookAttacks(sq, occ) {
  const file = sqToFile(sq);
  const rank = sqToRank(sq);
  let a = 0n;

  for (let r = rank + 1; r <= 7; r++) {
    const s = (r << 3) + file;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let r = rank - 1; r >= 0; r--) {
    const s = (r << 3) + file;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let f = file + 1; f <= 7; f++) {
    const s = (rank << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let f = file - 1; f >= 0; f--) {
    const s = (rank << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }

  return a;
}

function bishopAttacks(sq, occ) {
  const file = sqToFile(sq);
  const rank = sqToRank(sq);
  let a = 0n;

  for (let f = file + 1, r = rank + 1; f <= 7 && r <= 7; f++, r++) {
    const s = (r << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let f = file - 1, r = rank + 1; f >= 0 && r <= 7; f--, r++) {
    const s = (r << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let f = file + 1, r = rank - 1; f <= 7 && r >= 0; f++, r--) {
    const s = (r << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }
  for (let f = file - 1, r = rank - 1; f >= 0 && r >= 0; f--, r--) {
    const s = (r << 3) + f;
    const b = bit(s);
    a |= b;
    if (occ & b) break;
  }

  return a;
}

function enumerateOccupancies(mask) {
  const bits = [];
  for (let sq = 0; sq < 64; sq++) {
    if (mask & bit(sq)) bits.push(sq);
  }
  const n = bits.length;
  const total = 1 << n;
  const occ = new Array(total);
  for (let i = 0; i < total; i++) {
    let o = 0n;
    for (let b = 0; b < n; b++) {
      if (i & (1 << b)) o |= bit(bits[b]);
    }
    occ[i] = o;
  }
  return { bits, occ };
}

function findMagic(sq, isBishop, attempts) {
  const mask = isBishop ? bishopMask(sq) : rookMask(sq);
  const { bits, occ } = enumerateOccupancies(mask);
  const relevantBits = bits.length;
  const shift = 64 - relevantBits;
  const size = 1 << relevantBits;
  const attacks = new Array(size);

  for (let i = 0; i < size; i++) {
    attacks[i] = isBishop ? bishopAttacks(sq, occ[i]) : rookAttacks(sq, occ[i]);
  }

  const topMask = 0xFF00000000000000n;
  const sh = BigInt(shift);

  for (let iter = 0; iter < attempts; iter++) {
    const magic = randomFewBits64();
    if (popcountBig((mask * magic) & topMask) < 6) continue;

    const used = new Array(size);
    let fail = false;

    for (let i = 0; i < size; i++) {
      const idx = Number(((occ[i] * magic) & MASK64) >> sh);
      const at = attacks[i];
      const prev = used[idx];
      if (prev === undefined) {
        used[idx] = at;
      } else if (prev !== at) {
        fail = true;
        break;
      }
    }

    if (!fail) {
      return { magic, shift, relevantBits };
    }
  }

  throw new Error(`No magic found sq=${sq} bishop=${isBishop} after ${attempts} attempts`);
}

function splitLoHi(v) {
  return {
    lo: Number(v & 0xFFFFFFFFn) >>> 0,
    hi: Number((v >> 32n) & 0xFFFFFFFFn) >>> 0
  };
}

function formatArray(name, arr) {
  return `const ${name} = [\n  ${arr.join(',\n  ')}\n];`;
}

function main() {
  const attempts = Number(process.argv[2] || 2000000);

  const rookLo = [];
  const rookHi = [];
  const rookShift = [];
  const bishopLo = [];
  const bishopHi = [];
  const bishopShift = [];

  for (let sq = 0; sq < 64; sq++) {
    const r = findMagic(sq, false, attempts);
    const rs = splitLoHi(r.magic);
    rookLo.push(rs.lo);
    rookHi.push(rs.hi);
    rookShift.push(r.shift);
    process.stderr.write(`rook ${sq} done shift=${r.shift}\n`);
  }

  for (let sq = 0; sq < 64; sq++) {
    const b = findMagic(sq, true, attempts);
    const bs = splitLoHi(b.magic);
    bishopLo.push(bs.lo);
    bishopHi.push(bs.hi);
    bishopShift.push(b.shift);
    process.stderr.write(`bishop ${sq} done shift=${b.shift}\n`);
  }

  console.log(formatArray('ROOK_MAGIC_LO', rookLo));
  console.log();
  console.log(formatArray('ROOK_MAGIC_HI', rookHi));
  console.log();
  console.log(formatArray('ROOK_MAGIC_SHIFT', rookShift));
  console.log();
  console.log(formatArray('BISHOP_MAGIC_LO', bishopLo));
  console.log();
  console.log(formatArray('BISHOP_MAGIC_HI', bishopHi));
  console.log();
  console.log(formatArray('BISHOP_MAGIC_SHIFT', bishopShift));
}

main();
