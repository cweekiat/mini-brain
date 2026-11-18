"""Mini Brain · Step 6: decisions, two populations that compete.

The Wong & Wang (2006) model of the random-dot task. Population A votes
"right", population B votes "left". Each excites itself and inhibits the other,
so they race; the first to reach a threshold firing rate makes the choice.

Run:  python step06_decisions.py      (needs numpy and matplotlib)
"""
import numpy as np
import matplotlib.pyplot as plt

# Firing rate (Hz) of a population given its input x (nA): silent, then ~linear
a, b, d = 270.0, 108.0, 0.154
def rate(x):
    y = a * x - b
    return y / (1 - np.exp(-d * y))

GAMMA, TAU_S, TAU_N, SIGMA = 0.641, 100.0, 2.0, 0.02   # -, ms, ms, nA
TAU_R = 20.0   # ms: the read-out averages each rate over ~20 ms
J_OTHER, I0, J_EXT, MU = 0.0497, 0.3255, 5.2e-4, 30.0  # nA, nA, nA/Hz, Hz
COHERENCES = [0, 3.2, 6.4, 12.8, 25.6, 51.2]


def trial(c, threshold=15.0, J_self=0.2609, rng=None, dt=0.5, max_ms=2000, record=False):
    """One trial. c = % of dots moving toward A. Returns (choice, time, trace).
    choice: 0 = A, 1 = B, -1 = no decision within max_ms."""
    rng = rng or np.random.default_rng()
    S = np.array([0.1, 0.1])           # open fraction of NMDA synapses
    noise = np.zeros(2)
    rs = rate(np.full(2, I0))           # smoothed rates: what the threshold looks at
    trace = []
    ext = np.zeros(2)
    n_wait = int(300 / dt)
    for k in range(n_wait + int(max_ms / dt)):
        if k == n_wait:                 # 300 ms of waiting, then the dots appear
            ext = J_EXT * MU * np.array([1 + c / 100, 1 - c / 100])
        x = J_self * S - J_OTHER * S[::-1] + I0 + ext + noise
        r = rate(x)
        S += dt * (-S / TAU_S + (1 - S) * GAMMA * r / 1000)
        noise += -(dt / TAU_N) * noise + np.sqrt(dt / TAU_N) * SIGMA * rng.standard_normal(2)
        rs += dt / TAU_R * (r - rs)
        if record:
            trace.append(rs.copy())
        t = (k + 1 - n_wait) * dt
        if k >= n_wait and rs.max() > threshold:
            return int(rs.argmax()), t, np.array(trace)
    return -1, max_ms, np.array(trace)


def curves(threshold=15.0, J_self=0.2609, n=60, seed=1):
    """Accuracy and mean decision time at each coherence."""
    rng = np.random.default_rng(seed)
    acc, rt, undecided = [], [], 0
    for c in COHERENCES:
        res = [trial(c, threshold, J_self, rng)[:2] for _ in range(n)]
        ch = np.array([r[0] for r in res]); t = np.array([r[1] for r in res])
        acc.append((ch == 0).mean()); rt.append(t[ch >= 0].mean() if (ch >= 0).any() else np.nan)
        undecided += (ch < 0).sum()
    return np.array(acc), np.array(rt), undecided


if __name__ == "__main__":
    acc, rt, und = curves()
    print("coherence  accuracy  decision time")
    for c, p, t in zip(COHERENCES, acc, rt):
        print(f"  {c:5.1f}%   {p:6.0%}    {t:5.0f} ms")
    print("\nSpeed vs accuracy at 6.4% coherence:")
    for th in (6, 10, 15, 30):
        a6, r6, _ = curves(threshold=th)
        print(f"  threshold {th:2d} Hz: {a6[2]:4.0%} correct, {r6[2]:4.0f} ms")

    fig, ax = plt.subplots(1, 3, figsize=(13, 3.8), constrained_layout=True)
    for c, col in ((0, "gray"), (6.4, "tab:orange"), (51.2, "tab:green")):
        _, t, tr = trial(c, rng=np.random.default_rng(3), record=True)
        time = np.arange(len(tr)) * 0.5 - 300
        ax[0].plot(time, tr[:, 0], c=col, label=f"A, {c}%"); ax[0].plot(time, tr[:, 1], c=col, ls="--")
    ax[0].axhline(15, c="crimson", ls=":"); ax[0].set(title="The race, smoothed rates (dashed = B)", xlabel="ms after dots appear", ylabel="Hz"); ax[0].legend()
    ax[1].semilogx(np.array(COHERENCES[1:]), acc[1:] * 100, "o-"); ax[1].set(title="Accuracy", xlabel="coherence (%)", ylabel="% correct")
    ax[2].semilogx(np.array(COHERENCES[1:]), rt[1:], "o-"); ax[2].set(title="Harder = slower", xlabel="coherence (%)", ylabel="decision time (ms)")
    plt.show()
