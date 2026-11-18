// Step 5 model: a ring of neurons that holds a location in mind ("bump attractor").
// 100 neurons, each preferring one direction θ around a circle.
// This is a RATE model: each neuron's state is its firing rate r (0 = silent,
// 1 = maximum), not individual spikes. Units: ms.
import { rng } from "./network.js";

export const N = 100;
export const THETA = Float64Array.from({ length: N }, (_, i) => (2 * Math.PI * i) / N); // preferred directions
const COS = THETA.map(Math.cos), SIN = THETA.map(Math.sin);

// The neuron's response curve: silent below 0, rising, then saturating at 1.
export const f = (x) => (x > 0 ? Math.tanh(x) : 0);

export class Ring {
  constructor(seed = 1) {
    this.J0 = -2.0;   // everyone inhibits everyone (broad inhibition)
    this.J1 = 12;     // neighbours excite each other: "reverberation"
    this.I0 = -0.4;   // background input, just below threshold so the ring rests quietly
    this.tau = 100;   // ms: how slowly rates change (set by slow NMDA synapses)
    this.noise = 0.5; // random jostling of the input
    this.r = new Float64Array(N);
    this.ext = new Float64Array(N); // input from outside (cues), set each step
    this.R = rng(seed);
    this.t = 0;
  }
  // Input to every neuron from the ring: I_i = Σ_j W_ij r_j with W_ij = (J0 + J1 cos(θi − θj)) / N.
  // Using cos(a − b) = cos a cos b + sin a sin b, this equals J0·mean(r) + J1·(cosθi·C + sinθi·S)
  // with C = mean(r cos θ), S = mean(r sin θ): the same numbers as W @ r, just faster.
  recurrent() {
    let M = 0, C = 0, S = 0;
    for (let j = 0; j < N; j++) { M += this.r[j]; C += this.r[j] * COS[j]; S += this.r[j] * SIN[j]; }
    M /= N; C /= N; S /= N;
    const out = new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = this.J0 * M + this.J1 * (COS[i] * C + SIN[i] * S);
    return out;
  }
  step(dt) {
    const rec = this.recurrent(), k = dt / this.tau, amp = this.noise * Math.sqrt(1 / dt);
    for (let i = 0; i < N; i++) {
      const I = rec[i] + this.I0 + this.ext[i] + amp * this.R.randn();
      this.r[i] += k * (-this.r[i] + f(I));
    }
    this.t += dt;
  }
  // Set the outside input: a cue centred on angle `at`, `width` radians wide (0 = no cue).
  cue(at, strength, width = 0.5) {
    for (let i = 0; i < N; i++) {
      const d = Math.atan2(Math.sin(THETA[i] - at), Math.cos(THETA[i] - at));
      this.ext[i] = strength * Math.exp(-(d * d) / (2 * width * width));
    }
  }
  inhibit(strength) { this.ext.fill(-strength); } // a global "clear" pulse
  release() { this.ext.fill(0); }
  // Read the memory out: the population vector points at the remembered angle.
  decode() {
    let x = 0, y = 0, m = 0;
    for (let i = 0; i < N; i++) { x += this.r[i] * COS[i]; y += this.r[i] * SIN[i]; m += this.r[i]; }
    return { angle: Math.atan2(y, x), strength: Math.hypot(x, y) / N, mean: m / N };
  }
}

export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)); // angle into −π…π
export const deg = (a) => (a * 180) / Math.PI;
