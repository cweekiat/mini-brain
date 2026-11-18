"""Mini Brain · Step 1: one neuron.

The same two models as the live demos, in plain Python:
  1. the leaky integrate-and-fire neuron ("leaky bucket")
  2. the Hodgkin–Huxley neuron (real sodium and potassium channels)

Run:  python step01_neuron.py      (needs numpy and matplotlib)
Units: millivolts (mV), milliseconds (ms).
"""
import numpy as np
import matplotlib.pyplot as plt


# ── Model 1: the leaky bucket ─────────────────────────────────────────────
class LIF:
    def __init__(self, tau=15.0, threshold=-55.0):
        self.V_rest, self.V_reset = -70.0, -75.0
        self.R = 10.0              # MΩ: how much 1 nA raises V
        self.tau = tau             # ms: how fast the bucket drains
        self.threshold = threshold # mV: the brim
        self.t_ref = 2.0           # ms: silence after a spike
        self.V, self.refractory = self.V_rest, 0.0

    def step(self, dt, input_nA):
        """Advance dt ms. Returns True if the neuron fired."""
        if self.refractory > 0:                 # just fired: stay silent
            self.refractory -= dt
            self.V = self.V_reset
            return False
        # leak back to rest + fill from input
        self.V += dt / self.tau * (-(self.V - self.V_rest) + self.R * input_nA)
        if self.V >= self.threshold:            # reached the brim
            self.V = self.V_reset               # empty the bucket
            self.refractory = self.t_ref
            return True                         # spike!
        return False


# ── Model 2: Hodgkin–Huxley (1952) ────────────────────────────────────────
def _x_over_1_minus_exp(x):
    """x / (1 - e^(-x/10)), with its limit 10 at x = 0."""
    return 10.0 if abs(x) < 1e-6 else x / (1 - np.exp(-x / 10))

# Equation 2's opening (alpha) and closing (beta) speeds for each gate, per ms
def alpha_m(V): return 0.1 * _x_over_1_minus_exp(V + 40)
def beta_m(V):  return 4.0 * np.exp(-(V + 65) / 18)
def alpha_h(V): return 0.07 * np.exp(-(V + 65) / 20)
def beta_h(V):  return 1.0 / (1 + np.exp(-(V + 35) / 10))
def alpha_n(V): return 0.01 * _x_over_1_minus_exp(V + 55)
def beta_n(V):  return 0.125 * np.exp(-(V + 65) / 80)


class HH:
    C = 1.0                                   # µF/cm²
    g_Na, g_K, g_L = 120.0, 36.0, 0.3         # mS/cm² with every door open
    E_Na, E_K, E_L = 50.0, -77.0, -54.387     # mV each ion pushes toward

    def __init__(self, na_block=0.0, k_block=0.0):
        self.na_block, self.k_block = na_block, k_block
        V = self.V = -65.0
        # start each gate at its resting value
        self.m = alpha_m(V) / (alpha_m(V) + beta_m(V))
        self.h = alpha_h(V) / (alpha_h(V) + beta_h(V))
        self.n = alpha_n(V) / (alpha_n(V) + beta_n(V))
        self._above = False

    def step(self, dt, I):
        V = self.V
        # Equation 2: each gate opens and closes at voltage-dependent speeds
        self.m += dt * (alpha_m(V) * (1 - self.m) - beta_m(V) * self.m)
        self.h += dt * (alpha_h(V) * (1 - self.h) - beta_h(V) * self.h)
        self.n += dt * (alpha_n(V) * (1 - self.n) - beta_n(V) * self.n)
        # Equation 1: conductance × open fraction × driving force
        self.I_Na = self.g_Na * (1 - self.na_block) * self.m**3 * self.h * (V - self.E_Na)
        self.I_K = self.g_K * (1 - self.k_block) * self.n**4 * (V - self.E_K)
        I_L = self.g_L * (V - self.E_L)
        self.V += dt / self.C * (I - self.I_Na - self.I_K - I_L)
        # count a spike when V crosses 0 mV going up
        fired = (not self._above) and self.V > 0
        self._above = self.V > 0 if self.V > 0 or self.V < -20 else self._above
        return fired


def firing_rate(make_neuron, input_value, dt=0.1, ms=1000):
    """Simulate 1 s with a steady input and count the spikes (= Hz)."""
    neuron, count = make_neuron(), 0
    for i in range(int((ms + 100) / dt)):
        if neuron.step(dt, input_value) and i * dt > 100:  # skip settling
            count += 1
    return count * 1000 / ms


if __name__ == "__main__":
    fig, ax = plt.subplots(3, 1, figsize=(8, 9), constrained_layout=True)

    # Demo 1: the bucket at 3 nA
    dt, lif, V = 0.1, LIF(), []
    for _ in range(int(200 / dt)):
        lif.step(dt, 3.0)
        V.append(lif.V)
    ax[0].plot(np.arange(len(V)) * dt, V)
    ax[0].axhline(-55, ls="--", c="crimson", label="threshold")
    ax[0].set(title="Leaky bucket, input 3 nA", xlabel="ms", ylabel="mV"); ax[0].legend()

    # Demo 2: one Hodgkin–Huxley spike and its gates
    dt, hh, rows = 0.01, HH(), []
    for i in range(int(20 / dt)):
        t = i * dt
        hh.step(dt, 20.0 if 1 <= t < 2 else 0.0)   # 1 ms zap
        rows.append((t, hh.V, hh.m, hh.h, hh.n))
    t, V, m, h, n = np.array(rows).T
    ax[1].plot(t, V, label="V (mV)")
    ax2 = ax[1].twinx()
    for g, name in ((m, "m"), (h, "h"), (n, "n")):
        ax2.plot(t, g, ls=":", label=name)
    ax[1].set(title="Hodgkin–Huxley spike", xlabel="ms", ylabel="mV"); ax2.set_ylabel("gate open")
    ax2.legend(loc="upper right")

    # Demo 3: firing rate vs input
    I_lif = np.arange(0, 5.01, 0.25)
    I_hh = np.arange(0, 20.01, 1.0)
    ax[2].plot(I_lif, [firing_rate(LIF, I) for I in I_lif], label="bucket (nA)")
    ax[2].plot(I_hh / 4, [firing_rate(HH, I, dt=0.025, ms=300) for I in I_hh], label="HH (µA/cm² ÷ 4)")
    ax[2].set(title="Strength becomes rhythm", xlabel="input", ylabel="spikes/s"); ax[2].legend()

    print("HH firing at 10 µA/cm²:", firing_rate(HH, 10.0, dt=0.01, ms=1000), "Hz")
    plt.show()
