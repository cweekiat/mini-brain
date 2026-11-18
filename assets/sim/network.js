// Step 3 model: 1,000 leaky-bucket neurons, 80% excitatory (E), 20% inhibitory (I),
// each receiving random input from 10% of the network, like a patch of cortex.
// Units: mV, ms, nA.

// Small seeded random number generator, so every visitor gets the same wiring.
export function rng(seed = 1) {
  let a = seed >>> 0;
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  const randn = () => { // standard normal (Box–Muller)
    if (spare !== null) { const s = spare; spare = null; return s; }
    const u = 1 - uniform(), v = uniform(), r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  return { uniform, randn };
}

export class Network {
  constructor({ NE = 800, NI = 200, p = 0.1, seed = 1 } = {}) {
    const N = NE + NI;
    Object.assign(this, { NE, NI, N, p });
    this.r = rng(seed);
    // Wiring: targets[k] = the neurons that neuron k sends to (each pair connected with chance p)
    this.targets = [];
    for (let k = 0; k < N; k++) {
      const t = [];
      for (let j = 0; j < N; j++) if (j !== k && this.r.uniform() < p) t.push(j);
      this.targets.push(Int32Array.from(t));
    }
    // Same leaky bucket as Step 1
    this.EL = -70; this.Vth = -55; this.Vreset = -75; this.R = 10; this.tauM = 15; this.tRef = 2;
    // Synapses: excitatory (AMPA-like) and inhibitory (GABA-A-like) currents fade away
    this.tauE = 3; this.tauI = 8;
    // Knobs
    this.drive = 1.8;  // nA: steady input from the rest of the brain, to E cells
    this.driveI = 0.5; // nA: weaker outside input to I cells (they mostly follow local E cells)
    this.noise = 1.0;  // random jostling (same form as Step 1)
    this.wE = 0.5;     // nA kick from one excitatory spike
    this.g = 4;        // inhibitory kick = g × wE
    this.V = new Float32Array(N); this.IE = new Float32Array(N); this.II = new Float32Array(N); this.ref = new Float32Array(N);
    for (let j = 0; j < N; j++) this.V[j] = this.EL + 15 * this.r.uniform(); // random start
    this.t = 0;
  }

  // Advance one step of dt ms. Returns an array of the neurons that fired.
  step(dt) {
    const { N, V, IE, II, ref } = this;
    const dE = dt / this.tauE, dI = dt / this.tauI, dM = dt / this.tauM;
    const fired = [];
    for (let j = 0; j < N; j++) {
      IE[j] -= dE * IE[j];                       // AMPA fades
      II[j] -= dI * II[j];                       // GABA fades
      if (ref[j] > 0) { ref[j] -= dt; V[j] = this.Vreset; continue; }
      const ext = j < this.NE ? this.drive : this.driveI;
      const I = ext + this.noise * 1.5 * this.r.randn() + IE[j] - II[j];
      V[j] += dM * (-(V[j] - this.EL) + this.R * I);
      if (V[j] >= this.Vth) { V[j] = this.Vreset; ref[j] = this.tRef; fired.push(j); }
    }
    // Deliver this step's spikes; they arrive at the start of the next step
    const kE = this.wE, kI = this.g * this.wE;
    for (const k of fired) {
      const t = this.targets[k];
      if (k < this.NE) for (let i = 0; i < t.length; i++) IE[t[i]] += kE;
      else for (let i = 0; i < t.length; i++) II[t[i]] += kI;
    }
    this.t += dt;
    return fired;
  }

  // "EEG-like" signal: total synaptic current into the excitatory cells.
  // Real EEG mostly measures these currents (not the spikes) in pyramidal cells.
  eeg() {
    let s = 0;
    for (let j = 0; j < this.NE; j++) s += this.IE[j] + this.II[j];
    return s / this.NE;
  }
}

// Power spectrum of a signal sampled every `dtMs` ms. Returns [{f, p}] for f ≤ fMax.
export function spectrum(x, dtMs, fMax = 100) {
  let n = 1; while (n * 2 <= x.length) n *= 2;
  const re = new Float64Array(n), im = new Float64Array(n);
  let mean = 0; for (let i = 0; i < n; i++) mean += x[x.length - n + i]; mean /= n;
  for (let i = 0; i < n; i++) { // remove the average, then a Hann window to avoid edge artefacts
    re[i] = (x[x.length - n + i] - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  // in-place radix-2 FFT
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar; im[i + k] += ai;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
  const df = 1000 / (n * dtMs), out = [];
  for (let k = 1; k * df <= fMax && k < n / 2; k++) out.push({ f: k * df, p: re[k] * re[k] + im[k] * im[k] });
  return out;
}

export const BANDS = [
  { name: "delta", lo: 0.5, hi: 4, when: "deep sleep" },
  { name: "theta", lo: 4, hi: 8, when: "memory, navigation" },
  { name: "alpha", lo: 8, hi: 13, when: "relaxed, eyes closed" },
  { name: "beta", lo: 13, hi: 30, when: "active thinking, movement" },
  { name: "gamma", lo: 30, hi: 100, when: "focused attention" },
];
export const bandOf = (f) => BANDS.find((b) => f >= b.lo && f < b.hi) || null;
