// Step 1 models. Units: millivolts (mV), milliseconds (ms).

// ── Model 1: Leaky integrate-and-fire ("the leaky bucket") ──────────────────
// tau * dV/dt = -(V - E_L) + R * I
// When V reaches the threshold: record a spike, reset V, stay silent briefly.
export class LIF {
  constructor() {
    this.EL = -70;      // resting level: where the bucket settles when nothing pours in
    this.Vth = -55;     // threshold: the brim of the bucket
    this.Vreset = -75;  // after a spike the bucket is emptied slightly below rest
    this.R = 10;        // membrane resistance (MΩ): how much 1 nA of input raises V
    this.tau = 15;      // leak time constant (ms): how fast the bucket drains
    this.tRef = 2;      // refractory period (ms): forced silence after a spike
    this.V = this.EL;
    this.refLeft = 0;
  }
  // Advance by dt with input current I (nA). Returns true if it spiked.
  step(dt, I) {
    if (this.refLeft > 0) { this.refLeft -= dt; this.V = this.Vreset; return false; }
    this.V += (dt / this.tau) * (-(this.V - this.EL) + this.R * I);
    if (this.V >= this.Vth) { this.V = this.Vreset; this.refLeft = this.tRef; return true; }
    return false;
  }
}

// ── Model 2: Hodgkin–Huxley (the real squid-axon equations, 1952) ───────────
// The membrane is a capacitor. Three kinds of channel let current through:
//   sodium (Na)   — opens fast when V rises, then closes itself (gates m and h)
//   potassium (K) — opens slowly, pulls V back down (gate n)
//   leak          — always a little bit open
// C dV/dt = I - gNa m³h (V-ENa) - gK n⁴ (V-EK) - gL (V-EL)
// x / (1 - e^(-x/10)) has a 0/0 at x = 0; its limit there is 10.
const xe = (x) => (Math.abs(x) < 1e-6 ? 10 : x / (1 - Math.exp(-x / 10)));
const an = (V) => 0.01 * xe(V + 55);
const bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);
const am = (V) => 0.1 * xe(V + 40);
const bm = (V) => 4 * Math.exp(-(V + 65) / 18);
const ah = (V) => 0.07 * Math.exp(-(V + 65) / 20);
const bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));

export class HH {
  constructor() {
    this.C = 1; this.gNa = 120; this.gK = 36; this.gL = 0.3;
    this.ENa = 50; this.EK = -77; this.EL = -54.387;
    this.naBlock = 0; this.kBlock = 0; // 0 = normal, 1 = fully blocked (drugs)
    this.reset();
  }
  reset() {
    this.V = -65;
    this.m = am(-65) / (am(-65) + bm(-65));
    this.h = ah(-65) / (ah(-65) + bh(-65));
    this.n = an(-65) / (an(-65) + bn(-65));
    this.INa = 0; this.IK = 0; this.above = false;
  }
  // Advance by dt (ms, keep ≤ 0.025) with input I (µA/cm²). Returns true on a spike.
  step(dt, I) {
    const { V } = this;
    this.m += dt * (am(V) * (1 - this.m) - bm(V) * this.m);
    this.h += dt * (ah(V) * (1 - this.h) - bh(V) * this.h);
    this.n += dt * (an(V) * (1 - this.n) - bn(V) * this.n);
    this.INa = this.gNa * (1 - this.naBlock) * this.m ** 3 * this.h * (V - this.ENa);
    this.IK = this.gK * (1 - this.kBlock) * this.n ** 4 * (V - this.EK);
    const IL = this.gL * (V - this.EL);
    this.V += (dt / this.C) * (I - this.INa - this.IK - IL);
    // count a spike when V crosses 0 mV going up
    const spiked = !this.above && this.V > 0;
    this.above = this.V > 0 ? true : this.V < -20 ? false : this.above;
    return spiked;
  }
}

// Firing rate (spikes per second) for a constant input, by brute-force simulation.
export function rateOf(Model, I, { ms = 1000, dt = 0.1, setup } = {}) {
  const cell = new Model();
  if (setup) setup(cell);
  let spikes = 0;
  const skip = 100; // ignore the first 100 ms while it settles
  for (let t = 0; t < ms + skip; t += dt) if (cell.step(dt, I) && t > skip) spikes++;
  return (spikes * 1000) / ms;
}
