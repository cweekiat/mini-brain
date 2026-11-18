"""Mini Brain · Side trip: how connected is the brain?

1. Small-world wiring (Watts & Strogatz, 1998): average hops and clustering
2. Brain simulation calculator: synapses, memory, events and laptop time

Run:  python scaling_up.py      (needs numpy and matplotlib)
"""
from collections import deque
import numpy as np
import matplotlib.pyplot as plt


# ── 1. Small-world wiring ─────────────────────────────────────────────────
def small_world(N, K, p, rng):
    """Ring of N neurons, each linked to K nearest neighbours; each link
    rewired to a random new partner with chance p. Links are two-way."""
    adj = [set() for _ in range(N)]
    edges = [(i, (i + d) % N) for i in range(N) for d in range(1, K // 2 + 1)]
    for i, j in edges:
        if rng.random() < p:                      # rewire to a random new partner
            for _ in range(50):
                cand = int(rng.integers(N))
                if cand != i and cand not in adj[i]:
                    j = cand
                    break
        if j != i and j not in adj[i]:
            adj[i].add(j); adj[j].add(i)
    return adj


def bfs(adj, s):
    """Hops from neuron s to every other neuron (breadth-first search)."""
    hops = [-1] * len(adj); hops[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if hops[v] < 0:
                hops[v] = hops[u] + 1; q.append(v)
    return hops


def metrics(adj):
    N = len(adj)
    all_hops = [h for s in range(N) for t, h in enumerate(bfs(adj, s)) if t != s and h > 0]
    C = []
    for i in range(N):
        nb = list(adj[i]); k = len(nb)
        if k >= 2:
            links = sum(nb[b] in adj[nb[a]] for a in range(k) for b in range(a + 1, k))
            C.append(links / (k * (k - 1) / 2))
    return np.mean(all_hops), np.sum(C) / N


# ── 2. Calculator ─────────────────────────────────────────────────────────
BRAINS = {  # neurons, synapses
    "C. elegans": (302, 7_000),
    "Fruit fly": (139_255, 54.5e6),
    "Mini Brain (Step 3)": (1_000, 99_900),
    "Mouse (rough)": (7.1e7, 1e11),
    "Human": (8.6e10, 1.5e14),
}
EV_PER_S, UPD_PER_S, STEPS_PER_S = 11e6, 34e6, 10_000   # measured on this site's simulator (1 core)


def cost(N, K, rate=1.0, B=8):
    synapses = N * K
    memory = synapses * B
    events = N * rate * K                                  # synaptic events per second
    laptop_s = events / EV_PER_S + N * STEPS_PER_S / UPD_PER_S
    return synapses, memory, events, laptop_s


if __name__ == "__main__":
    print("Small-world wiring, N = 200, K = 10:")
    for p in (0, 0.01, 0.05, 0.2, 1):
        L, C = metrics(small_world(200, 10, p, np.random.default_rng(1)))
        print(f"  shortcuts {p:4.0%}: average hops {L:5.2f}   clustering {C:.3f}")

    print("\nWhat would it take? (rate 1 Hz, 8 bytes per synapse)")
    for name, (N, S) in BRAINS.items():
        syn, mem, ev, t = cost(N, S / N)
        print(f"  {name:20s} K={S / N:8.0f}  memory {mem / 1e9:12.3f} GB   1 s of brain on a laptop: {t / 86400:10.3f} days")

    fig, ax = plt.subplots(1, 2, figsize=(12, 4), constrained_layout=True)
    ps = np.logspace(-3, 0, 12)
    res = [metrics(small_world(200, 10, p, np.random.default_rng(1))) for p in ps]
    L0, C0 = metrics(small_world(200, 10, 0, np.random.default_rng(1)))
    ax[0].semilogx(ps, [r[0] / L0 for r in res], "o-", label="hops (relative)")
    ax[0].semilogx(ps, [r[1] / C0 for r in res], "s-", label="clustering (relative)")
    ax[0].axvline(0.05, ls=":", c="crimson"); ax[0].set(title="Small world: a few shortcuts go a long way", xlabel="shortcut chance p"); ax[0].legend()
    names = list(BRAINS)
    ax[1].barh(names, [cost(N, S / N)[1] for N, S in BRAINS.values()], color="tab:pink")
    for x, lab in ((24e9, "MacBook 24 GB"), (80e9, "GPU 80 GB"), (4.85e15, "Fugaku")):
        ax[1].axvline(x, ls="--", c="gray"); ax[1].text(x, -0.6, lab, rotation=90, va="bottom", fontsize=8)
    ax[1].set_xscale("log"); ax[1].set(title="Memory to store every synapse", xlabel="bytes")
    plt.show()
