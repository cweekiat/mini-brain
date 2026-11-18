// Step 4 model: a Hopfield network, the classic model of memory recall.
// 400 neurons in a 20×20 grid. Each is either on (+1) or off (−1).
// Memories are stored in the connections with Hebb's rule, and recalled by
// letting each neuron follow the vote of its inputs.
import { rng } from "./network.js";

export const SIDE = 20, N = SIDE * SIDE;

// ── The four pictures we store ─────────────────────────────────────────────
// Each is drawn from a simple shape rule on a grid from −1 to +1.
const SHAPES = {
  heart: (x, y) => { const X = x * 1.25, Y = -y * 1.25 + 0.25; return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0; },
  smile: (x, y) => {
    const r = Math.hypot(x, y);
    const eye = Math.hypot(Math.abs(x) - 0.35, y + 0.3) < 0.15;
    const mouth = Math.abs(Math.hypot(x, y + 0.05) - 0.5) < 0.1 && y > 0.15;
    return Math.abs(r - 0.85) < 0.13 || eye || mouth;
  },
  cross: (x, y) => Math.abs(Math.abs(x) - Math.abs(y)) < 0.42,
  sun: (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); return r < 0.45 || (r < 0.98 && r > 0.55 && Math.cos(8 * a) > 0.3); },
};
// These four were chosen because they overlap little (|overlap| ≤ 0.3).
// Very similar pictures interfere and blend: try the "too many memories" demo.
export const NAMES = Object.keys(SHAPES);

export function picture(name) {
  const p = new Int8Array(N);
  for (let r = 0; r < SIDE; r++) for (let c = 0; c < SIDE; c++) {
    const x = ((c + 0.5) / SIDE) * 2 - 1, y = ((r + 0.5) / SIDE) * 2 - 1;
    p[r * SIDE + c] = SHAPES[name](x, y) ? 1 : -1;
  }
  return p;
}

export function randomPatterns(P, seed = 7) {
  const R = rng(seed);
  return Array.from({ length: P }, () => Int8Array.from({ length: N }, () => (R.uniform() < 0.5 ? 1 : -1)));
}

// ── Learning: Hebb's rule ──────────────────────────────────────────────────
// W[i][j] = (1/N) Σ over memories of p[i]·p[j].  Neurons on together → stronger link.
export function hebb(patterns) {
  const W = new Float32Array(N * N);
  for (const p of patterns) for (let i = 0; i < N; i++) {
    const pi = p[i] / N, row = i * N;
    for (let j = 0; j < N; j++) W[row + j] += pi * p[j];
  }
  for (let i = 0; i < N; i++) W[i * N + i] = 0; // no neuron talks to itself
  return W;
}

// Cut a fraction of synapses at random (both directions, so W stays symmetric).
export function damage(W, fraction, seed = 11) {
  if (fraction <= 0) return W;
  const R = rng(seed), D = W.slice();
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (R.uniform() < fraction) { D[i * N + j] = 0; D[j * N + i] = 0; }
  return D;
}

// ── Recall ─────────────────────────────────────────────────────────────────
export class Recall {
  constructor(W, cue, seed = 3) {
    this.W = W; this.s = Int8Array.from(cue); this.R = rng(seed);
    this.order = this.perm(); this.k = 0; this.flipsThisSweep = 0; this.sweeps = 0; this.settled = false;
    this.last = null; // details of the most recent update, for the live code panel
  }
  perm() { const o = Array.from({ length: N }, (_, i) => i); for (let i = N - 1; i > 0; i--) { const j = Math.floor(this.R.uniform() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
  // Update one neuron: it takes the sign of the weighted vote of all others.
  updateOne() {
    if (this.settled) return false;
    const i = this.order[this.k], { W, s } = this, row = i * N;
    let h = 0;
    for (let j = 0; j < N; j++) h += W[row + j] * s[j];
    const before = s[i];
    if (h > 0) s[i] = 1; else if (h < 0) s[i] = -1; // h = 0: keep
    const flipped = s[i] !== before;
    if (flipped) this.flipsThisSweep++;
    this.last = { i, h, before, after: s[i], flipped };
    if (++this.k === N) { // end of a sweep: stop if nothing changed
      this.sweeps++;
      if (this.flipsThisSweep === 0) this.settled = true;
      this.k = 0; this.flipsThisSweep = 0; this.order = this.perm();
    }
    return flipped;
  }
  run(maxSweeps = 20) { while (!this.settled && this.sweeps < maxSweeps) this.updateOne(); return this.s; }
}

// Energy: E = −½ Σ W[i][j] s[i] s[j]. Every update can only lower it (or keep it).
export function energy(W, s) {
  let E = 0;
  for (let i = 0; i < N; i++) { let h = 0; const row = i * N; for (let j = 0; j < N; j++) h += W[row + j] * s[j]; E += s[i] * h; }
  return -0.5 * E;
}
// Overlap: +1 = identical, 0 = unrelated, −1 = exact negative.
export const overlap = (a, b) => { let o = 0; for (let i = 0; i < N; i++) o += a[i] * b[i]; return o / N; };

// Corrupt a pattern: flip a fraction of pixels, or hide (blank to −1) the bottom part.
export function corrupt(p, { flip = 0, hide = 0 } = {}, seed = 5) {
  const R = rng(seed), q = Int8Array.from(p);
  for (let i = 0; i < N; i++) if (R.uniform() < flip) q[i] = -q[i];
  const rows = Math.round(hide * SIDE);
  for (let r = SIDE - rows; r < SIDE; r++) for (let c = 0; c < SIDE; c++) q[r * SIDE + c] = -1;
  return q;
}
