// Quiet Sudoku grader: solves a puzzle the way a person would, one technique at a
// time, and reports what it took. Plain script, no dependencies; index.html loads it
// before the app and the benchmark loads it from Node via module.exports.
//
//   Grader.grade(puzzle)  -> { hardest, counts, hiddenNeeded, minWidth, solved }
//   Grader.level(report)  -> 'easy' | 'medium' | 'hard' | 'expert' | null
//
// puzzle is an array of 81 digits, 0 for empty. The ladder is tried cheapest first
// on every step, so `hardest` is the easiest technique set that solves the puzzle.
const Grader = (function () {
  'use strict';
  const TECH = ['nsingle', 'hsingle', 'pointing', 'claiming', 'npair', 'hpair', 'ntriple', 'htriple', 'xwing', 'ywing', 'swordfish', 'beyond'];
  const T = {}; TECH.forEach((t, i) => T[t] = i);

  const R = i => (i / 9) | 0, C = i => i % 9, B = i => ((R(i) / 3) | 0) * 3 + ((C(i) / 3) | 0);
  const POP = new Array(512).fill(0); for (let m = 1; m < 512; m++) POP[m] = POP[m >> 1] + (m & 1);
  const PEERS = [], ROWS = [], COLS = [], BOXES = [];
  for (let u = 0; u < 9; u++) { ROWS.push([]); COLS.push([]); BOXES.push([]); }
  for (let i = 0; i < 81; i++) {
    ROWS[R(i)].push(i); COLS[C(i)].push(i); BOXES[B(i)].push(i);
    const a = []; for (let j = 0; j < 81; j++) if (j !== i && (R(i) === R(j) || C(i) === C(j) || B(i) === B(j))) a.push(j); PEERS.push(a);
  }
  const UNITS = [...ROWS, ...COLS, ...BOXES];
  const LINES = [ROWS, COLS];
  const combos = (arr, k, s = 0, cur = []) => k === 0 ? [cur] : arr.slice(s).flatMap((v, i) => combos(arr, k - 1, s + i + 1, [...cur, v]));

  // Width is the number of singles available at a step. The last few cells are
  // always narrow, so it is only measured while at least WIDTH_FLOOR cells are empty.
  const WIDTH_FLOOR = 12;

  function grade(puzzle) {
    const g = puzzle.slice(), cand = new Array(81).fill(0);
    const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
    for (let i = 0; i < 81; i++) if (g[i]) { const m = 1 << (g[i] - 1); rows[R(i)] |= m; cols[C(i)] |= m; boxes[B(i)] |= m; }
    for (let i = 0; i < 81; i++) if (!g[i]) cand[i] = ~(rows[R(i)] | cols[C(i)] | boxes[B(i)]) & 511;
    const counts = new Array(TECH.length).fill(0);
    let hardest = 0, hiddenNeeded = 0, minWidth = 81, empty = g.filter(v => !v).length;
    const use = t => { counts[t]++; if (t > hardest) hardest = t; };
    const place = (i, d) => { g[i] = d; cand[i] = 0; empty--; const m = 1 << (d - 1); for (const j of PEERS[i]) cand[j] &= ~m; };
    const elim = (i, m) => { if (cand[i] & m) { cand[i] &= ~m; return true; } return false; };

    function singles() {
      const naked = [], hidden = [];
      for (let i = 0; i < 81; i++) if (!g[i] && POP[cand[i]] === 1) naked.push([i, 31 - Math.clz32(cand[i]) + 1]);
      for (const u of UNITS) for (let d = 0; d < 9; d++) {
        const bit = 1 << d; let where = -1, n = 0;
        for (const i of u) { if (g[i] === d + 1) { n = -1; break; } if (cand[i] & bit) { n++; where = i; } }
        if (n === 1 && !naked.some(s => s[0] === where) && !hidden.some(s => s[0] === where)) hidden.push([where, d + 1]);
      }
      const width = naked.length + hidden.length;
      if (!width) return false;
      if (empty >= WIDTH_FLOOR && width < minWidth) minWidth = width;
      if (naked.length) { use(T.nsingle); place(...naked[0]); }
      else { use(T.hsingle); hiddenNeeded++; place(...hidden[0]); }
      return true;
    }
    // Digit confined to one line inside a box: drop it from the rest of that line.
    function pointing() {
      for (const box of BOXES) for (let d = 0; d < 9; d++) {
        const bit = 1 << d, cells = box.filter(i => cand[i] & bit); if (cells.length < 2) continue;
        for (const [k, f] of [[0, R], [1, C]]) {
          const l = f(cells[0]); if (!cells.every(i => f(i) === l)) continue;
          let any = false; for (const i of LINES[k][l]) if (!box.includes(i) && elim(i, bit)) any = true;
          if (any) return true;
        }
      }
      return false;
    }
    // Digit confined to one box inside a line: drop it from the rest of that box.
    function claiming() {
      for (const lines of LINES) for (const line of lines) for (let d = 0; d < 9; d++) {
        const bit = 1 << d, cells = line.filter(i => cand[i] & bit); if (cells.length < 2) continue;
        const b = B(cells[0]); if (!cells.every(i => B(i) === b)) continue;
        let any = false; for (const i of BOXES[b]) if (!line.includes(i) && elim(i, bit)) any = true;
        if (any) return true;
      }
      return false;
    }
    function nakedSubset(size) {
      for (const u of UNITS) {
        const open = u.filter(i => !g[i] && POP[cand[i]] >= 2 && POP[cand[i]] <= size);
        for (const cs of combos(open, size)) {
          const m = cs.reduce((a, i) => a | cand[i], 0); if (POP[m] !== size) continue;
          let any = false; for (const i of u) if (!cs.includes(i) && elim(i, m)) any = true;
          if (any) return true;
        }
      }
      return false;
    }
    function hiddenSubset(size) {
      for (const u of UNITS) {
        const ds = []; for (let d = 0; d < 9; d++) { const n = u.filter(i => cand[i] & (1 << d)).length; if (n >= 2 && n <= size) ds.push(d); }
        for (const dd of combos(ds, size)) {
          const m = dd.reduce((a, d) => a | (1 << d), 0), cells = u.filter(i => cand[i] & m); if (cells.length !== size) continue;
          let any = false; for (const i of cells) if (elim(i, ~m & 511)) any = true;
          if (any) return true;
        }
      }
      return false;
    }
    // X-wing (size 2) and swordfish (size 3) on rows and on columns.
    function fish(size) {
      for (let d = 0; d < 9; d++) {
        const bit = 1 << d;
        for (let k = 0; k < 2; k++) {
          const across = k ? R : C, lines = [];
          LINES[k].forEach((line, u) => { const cells = line.filter(i => cand[i] & bit); if (cells.length >= 2 && cells.length <= size) lines.push([u, cells.map(across)]); });
          for (const set of combos(lines, size)) {
            const cover = new Set(set.flatMap(l => l[1])); if (cover.size !== size) continue;
            const base = set.map(l => l[0]); let any = false;
            for (const x of cover) for (const i of LINES[1 - k][x]) if (!base.includes(k ? C(i) : R(i)) && elim(i, bit)) any = true;
            if (any) return true;
          }
        }
      }
      return false;
    }
    function ywing() {
      for (let p = 0; p < 81; p++) {
        if (POP[cand[p]] !== 2) continue;
        const wings = PEERS[p].filter(j => POP[cand[j]] === 2 && cand[j] !== cand[p] && (cand[j] & cand[p]));
        for (const w1 of wings) for (const w2 of wings) {
          if (w1 >= w2) continue;
          const z = cand[w1] & cand[w2]; if (POP[z] !== 1 || (z & cand[p])) continue;
          if ((cand[w1] & cand[p]) === (cand[w2] & cand[p])) continue;
          let any = false; for (const j of PEERS[w1]) if (j !== p && PEERS[w2].includes(j) && elim(j, z)) any = true;
          if (any) return true;
        }
      }
      return false;
    }
    const ladder = [
      [T.pointing, pointing], [T.claiming, claiming],
      [T.npair, () => nakedSubset(2)], [T.hpair, () => hiddenSubset(2)],
      [T.ntriple, () => nakedSubset(3)], [T.htriple, () => hiddenSubset(3)],
      [T.xwing, () => fish(2)], [T.ywing, ywing], [T.swordfish, () => fish(3)]
    ];
    while (empty > 0) {
      if (singles()) continue;
      let did = false;
      for (const [t, fn] of ladder) if (fn()) { use(t); did = true; break; }
      if (!did) { use(T.beyond); break; }
    }
    return { hardest: TECH[hardest], counts, hiddenNeeded, minWidth, solved: empty === 0 };
  }

  // Level bands. Each level is a window on the ladder, so neighbouring levels do not
  // overlap: a puzzle that needs a pair is never Medium, one that needs a wing is never Hard.
  const steps = (r, from, to) => { let n = 0; for (let t = T[from]; t <= T[to]; t++) n += r.counts[t]; return n; };
  const BANDS = {
    easy: r => r.solved && r.hardest === 'nsingle' && r.minWidth >= 4,
    medium: r => r.solved && r.hardest === 'hsingle' && r.hiddenNeeded >= 3 && r.hiddenNeeded <= 12 && r.minWidth >= 2,
    hard: r => r.solved && T[r.hardest] >= T.pointing && T[r.hardest] <= T.htriple && steps(r, 'pointing', 'htriple') >= 2,
    expert: r => r.solved && T[r.hardest] >= T.xwing && T[r.hardest] <= T.swordfish
  };
  const LEVELS = Object.keys(BANDS);
  const level = r => LEVELS.find(k => BANDS[k](r)) || null;

  return { TECH, grade, level, LEVELS };
})();
if (typeof module !== 'undefined') module.exports = Grader;
