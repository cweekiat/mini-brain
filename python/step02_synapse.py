"""Mini Brain · Step 2: two neurons that learn.

  1. a synapse: A fires → B gets a fading push of current
  2. STDP: spike timing makes the synapse stronger or weaker
  3. Pavlov's bell: pairing bell with food teaches the bell to fire B alone

Run:  python step02_synapse.py      (needs numpy and matplotlib)
"""
import numpy as np
import matplotlib.pyplot as plt
from step01_neuron import LIF

DT = 0.1  # ms


class Synapse:
    """A fires → B receives I_syn, which fades with time constant tau."""
    def __init__(self, w=2.0, tau=5.0):
        self.w, self.tau, self.I = w, tau, 0.0

    def on_pre_spike(self):
        self.I += self.w                     # transmitter released

    def step(self, dt):
        self.I -= dt / self.tau * self.I     # receptors close
        return self.I


class STDP:
    """Fading traces of each neuron's spikes decide the weight change."""
    def __init__(self, A_plus=0.8, A_minus=0.85, tau=20.0, w_max=10.0):
        self.A_plus, self.A_minus, self.tau, self.w_max = A_plus, A_minus, tau, w_max
        self.x_pre = self.y_post = 0.0

    def decay(self, dt):
        self.x_pre *= np.exp(-dt / self.tau)
        self.y_post *= np.exp(-dt / self.tau)

    def on_pre(self, syn):    # A fired: was B recent? then A was late → weaken
        self.x_pre += 1
        syn.w = float(np.clip(syn.w - self.A_minus * self.y_post, 0, self.w_max))

    def on_post(self, syn):   # B fired: was A recent? then A was early → strengthen
        self.y_post += 1
        syn.w = float(np.clip(syn.w + self.A_plus * self.x_pre, 0, self.w_max))


def epsp_size(w):
    """Peak bump in B (mV) from one spike of A through a synapse of weight w."""
    b, syn, peak = LIF(), Synapse(w), -70.0
    syn.on_pre_spike()
    for _ in range(int(60 / DT)):
        fired = b.step(DT, syn.step(DT))
        peak = max(peak, b.V)
        if fired:
            return float("inf")
    return peak + 70


def stdp_change(gap_ms, w=5.0):
    """Weight change from one pairing: B fires gap_ms after A."""
    syn, rule = Synapse(w), STDP()
    t_a, t_b = 50.0, 50.0 + gap_ms
    for i in range(int(200 / DT)):
        t = i * DT
        rule.decay(DT)
        if abs(t - t_a) < DT / 2: rule.on_pre(syn)
        if abs(t - t_b) < DT / 2: rule.on_post(syn)
    return syn.w - w


def pavlov(trials=12, w=2.5):
    """Bell (A) then food (forces B to fire) on every trial. Returns weights."""
    weights = [w]
    syn, rule = Synapse(w), STDP()
    for _ in range(trials):
        bell, drool = LIF(), LIF()
        for i in range(int(60 / DT)):
            t = i * DT
            rule.decay(DT)
            if bell.step(DT, 12.0 if 5 <= t < 7.5 else 0.0):   # ring the bell
                rule.on_pre(syn); syn.on_pre_spike()
            food = 12.0 if 9 <= t < 12 else 0.0                # food 4 ms later
            if drool.step(DT, syn.step(DT) + food):
                rule.on_post(syn)
        weights.append(syn.w)
    return weights


if __name__ == "__main__":
    fig, ax = plt.subplots(1, 3, figsize=(13, 4), constrained_layout=True)

    ws = np.arange(0, 10.01, 0.5)
    ax[0].plot(ws, [min(epsp_size(w), 16) for w in ws])
    ax[0].axhline(15, ls="--", c="crimson", label="enough to fire")
    ax[0].set(title="Bump in B from one spike of A", xlabel="weight w", ylabel="mV"); ax[0].legend()

    gaps = np.arange(-50, 51, 1)
    ax[1].plot(gaps, [stdp_change(g) for g in gaps])
    ax[1].axhline(0, c="gray", lw=0.5); ax[1].axvline(0, c="gray", lw=0.5)
    ax[1].set(title="STDP: change per pairing", xlabel="Δt = t_B − t_A (ms)", ylabel="Δw")

    w_hist = pavlov()
    ax[2].plot(w_hist, marker="o")
    ax[2].axhline(7.9, ls="--", c="crimson", label="bell alone fires B")
    ax[2].set(title="Pavlov: bell + food trials", xlabel="trial", ylabel="bell → B weight"); ax[2].legend()

    print("Weight after each trial:", np.round(w_hist, 2))
    plt.show()
