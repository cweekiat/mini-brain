// Step 2 models. Units: nanoamps (nA), millivolts (mV), milliseconds (ms).

// ── Synapse ──────────────────────────────────────────────────────────────
// When neuron A spikes, it releases transmitter and B receives a pulse of
// current that fades over a few ms:   tau_s * dI/dt = -I,   and I += w on each A spike.
// w > 0 is excitatory (glutamate), w < 0 is inhibitory (GABA).
export class Synapse {
  constructor(w = 2, tau = 5) {
    this.w = w;       // weight: how strong the kick is (the volume knob)
    this.tau = tau;   // how quickly the receptors close again (ms)
    this.I = 0;       // current flowing into the postsynaptic neuron (nA)
  }
  onPreSpike() { this.I += this.w; }
  step(dt) { this.I -= (dt / this.tau) * this.I; return this.I; }
}

// ── STDP: spike-timing-dependent plasticity ──────────────────────────────
// Each neuron keeps a fading "memory trace" of its recent spikes.
//   A fires, then B fires soon after  →  A helped cause B  →  strengthen (LTP)
//   B fires, then A fires soon after  →  A was too late     →  weaken (LTD)
// Δw = +A_plus  · e^(−Δt/τ+)  if Δt = t_B − t_A > 0
// Δw = −A_minus · e^(+Δt/τ−)  if Δt < 0
export class STDP {
  constructor({ Aplus = 0.8, Aminus = 0.85, tauPlus = 20, tauMinus = 20, wMin = 0, wMax = 10 } = {}) {
    Object.assign(this, { Aplus, Aminus, tauPlus, tauMinus, wMin, wMax });
    this.xPre = 0;   // trace of A's recent spikes
    this.yPost = 0;  // trace of B's recent spikes
  }
  // advance the traces; call every step
  decay(dt) {
    this.xPre *= Math.exp(-dt / this.tauPlus);
    this.yPost *= Math.exp(-dt / this.tauMinus);
  }
  // returns the weight change
  onPre(syn) { this.xPre += 1; return this.apply(syn, -this.Aminus * this.yPost); }
  onPost(syn) { this.yPost += 1; return this.apply(syn, this.Aplus * this.xPre); }
  apply(syn, dw) {
    const before = syn.w;
    syn.w = Math.min(this.wMax, Math.max(this.wMin, syn.w + dw));
    return syn.w - before;
  }
  // the textbook curve, for plotting
  window(dt) { return dt > 0 ? this.Aplus * Math.exp(-dt / this.tauPlus) : dt < 0 ? -this.Aminus * Math.exp(dt / this.tauMinus) : 0; }
}
