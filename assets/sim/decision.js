// Step 6 model: a decision between two choices (Wong & Wang, 2006).
// Two populations of neurons, A ("right") and B ("left"), each reduced to one
// number S: the fraction of its slow NMDA synapses that are open (0…1).
// Each excites itself and inhibits the other, so they race and one wins.
// Units: ms, nA, Hz (spikes per second).
import { rng } from "./network.js";

// Firing rate (Hz) of a population given its input current x (nA).
// Silent for small x, then roughly linear: the "f-I curve" of Step 1, for a crowd.
const a = 270, b = 108, d = 0.154;
export function rate(x) {
  const y = a * x - b;
  return Math.abs(y) < 1e-9 ? 1 / d : y / (1 - Math.exp(-d * y));
}

export class Decision {
  constructor(seed = 1) {
    this.Jself = 0.2609;  // nA: each population excites itself
    this.Jother = 0.0497; // nA: and inhibits the other (via inhibitory cells)
    this.I0 = 0.3255;     // nA: background input from the rest of the brain
    this.Jext = 5.2e-4;   // nA per Hz of evidence
    this.mu = 30;         // Hz: how strongly the dots drive each population
    this.gamma = 0.641;   // how quickly spikes open NMDA synapses
    this.tauS = 100;      // ms: NMDA synapses close slowly (Step 5's slow synapses)
    this.tauN = 2;        // ms: noise correlation time (fast AMPA)
    this.sigma = 0.02;    // nA: noise size
    this.tauR = 20;       // ms: the read-out averages each rate over ~20 ms
    this.R = rng(seed);
    this.reset();
  }
  reset() {
    this.S = [0.1, 0.1]; this.noise = [0, 0]; this.r = [rate(this.I0), rate(this.I0)];
    this.rs = [...this.r]; // smoothed rates: what the threshold looks at
    this.x = [this.I0, this.I0]; this.ext = [0, 0]; this.t = 0;
  }
  // Evidence: coherence c (%) of dots moving toward A (positive) or B (negative)
  stimulus(c) { this.ext = [this.Jext * this.mu * (1 + c / 100), this.Jext * this.mu * (1 - c / 100)]; }
  stimOff() { this.ext = [0, 0]; }
  step(dt) {
    const [SA, SB] = this.S;
    const x = [
      this.Jself * SA - this.Jother * SB + this.I0 + this.ext[0] + this.noise[0],
      this.Jself * SB - this.Jother * SA + this.I0 + this.ext[1] + this.noise[1],
    ];
    for (let i = 0; i < 2; i++) {
      const r = rate(x[i]);
      this.S[i] += dt * (-this.S[i] / this.tauS + (1 - this.S[i]) * this.gamma * r / 1000);
      this.noise[i] += -(dt / this.tauN) * this.noise[i] + Math.sqrt(dt / this.tauN) * this.sigma * this.R.randn();
      this.r[i] = r;
      this.rs[i] += (dt / this.tauR) * (r - this.rs[i]);
    }
    this.x = x;
    this.t += dt;
  }
}

// One full trial: 300 ms of waiting, then dots until a population's smoothed
// rate reaches the threshold (or 2 s pass). Returns the choice (0 = A, 1 = B, −1 = none) and time.
export function trial(c, { threshold = 15, Jself, seed = 1, dt = 0.5, maxMs = 2000 } = {}) {
  const m = new Decision(seed);
  if (Jself !== undefined) m.Jself = Jself;
  for (let t = 0; t < 300; t += dt) m.step(dt);
  m.stimulus(c);
  for (let t = 0; t < maxMs; t += dt) {
    m.step(dt);
    if (Math.max(...m.rs) > threshold) return { choice: m.rs[0] > m.rs[1] ? 0 : 1, rt: t + dt };
  }
  return { choice: -1, rt: maxMs };
}
export const COHERENCES = [0, 3.2, 6.4, 12.8, 25.6, 51.2];
