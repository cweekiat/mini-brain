"""Mini Brain · Step 4: memory recall with a Hopfield network.

400 on/off neurons (20×20). Memories are stored with Hebb's rule and
recalled from a damaged clue. Same model as the live demos.

Run:  python step04_memory.py      (needs numpy and matplotlib)
"""
import numpy as np
import matplotlib.pyplot as plt

SIDE = 20
N = SIDE * SIDE


# ── The four pictures ─────────────────────────────────────────────────────
def _heart(x, y):
    X, Y = x * 1.25, -y * 1.25 + 0.25
    return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0

def _smile(x, y):
    r = np.hypot(x, y)
    eye = np.hypot(np.abs(x) - 0.35, y + 0.3) < 0.15
    mouth = (np.abs(np.hypot(x, y + 0.05) - 0.5) < 0.1) & (y > 0.15)
    return (np.abs(r - 0.85) < 0.13) | eye | mouth

def _cross(x, y):
    return np.abs(np.abs(x) - np.abs(y)) < 0.42

def _sun(x, y):
    r, a = np.hypot(x, y), np.arctan2(y, x)
    return (r < 0.45) | ((r < 0.98) & (r > 0.55) & (np.cos(8 * a) > 0.3))

SHAPES = {"heart": _heart, "smile": _smile, "cross": _cross, "sun": _sun}


def picture(name):
    c, r = np.meshgrid(np.arange(SIDE), np.arange(SIDE))
    x, y = (c + 0.5) / SIDE * 2 - 1, (r + 0.5) / SIDE * 2 - 1
    return np.where(SHAPES[name](x, y), 1, -1).ravel()


# ── Learning and recall ───────────────────────────────────────────────────
def hebb(memories):
    M = np.asarray(memories, dtype=float)       # P × N, entries ±1
    W = M.T @ M / N                             # neurons on together → stronger link
    np.fill_diagonal(W, 0)                      # no neuron talks to itself
    return W


def cut_synapses(W, lost, rng):
    cut = np.triu(rng.random((N, N)) < lost, 1)  # each pair once…
    W = W.copy()
    W[cut | cut.T] = 0                           # …removed in both directions
    return W


def recall(W, s, rng, max_sweeps=20):
    """Each sweep: every neuron once, in random order, takes the sign of its vote."""
    s = s.copy()
    for sweep in range(max_sweeps):
        flips = 0
        for i in rng.permutation(N):
            h = W[i] @ s                         # the vote
            new = 1 if h > 0 else -1 if h < 0 else s[i]   # h == 0: keep
            if new != s[i]:
                s[i], flips = new, flips + 1
        if flips == 0:                           # nothing changed: settled
            break
    return s


def clue(memory, flip, hide, rng):
    """Flip a fraction of pixels, then blank the bottom rows to −1."""
    s = memory.copy()
    s[rng.random(N) < flip] *= -1
    rows = round(hide * SIDE)
    if rows:
        s[(SIDE - rows) * SIDE:] = -1
    return s


energy = lambda W, s: -0.5 * s @ W @ s
overlap = lambda a, b: a @ b / N


def capacity_curve(lost, Ps=range(5, 81, 5), tests=5, seed=7):
    rng = np.random.default_rng(seed)
    out = []
    for P in Ps:
        M = rng.choice([-1, 1], (P, N))
        W = cut_synapses(hebb(M), lost, rng)
        q = np.mean([overlap(recall(W, clue(M[k], 0.10, 0, rng), rng, 15), M[k]) for k in range(tests)])
        out.append(q)
    return list(Ps), out


if __name__ == "__main__":
    rng = np.random.default_rng(1)
    names = list(SHAPES)
    memories = [picture(n) for n in names]
    W = hebb(memories)

    print("Recall success (10 trials each):")
    for flip, hide in [(0.2, 0), (0.3, 0), (0.45, 0), (0, 0.4), (0, 0.7)]:
        ok = sum(overlap(recall(W, clue(m, flip, hide, rng), rng), m) > 0.95 for m in memories for _ in range(10))
        print(f"  flip {flip:.0%}, hide {hide:.0%}: {ok}/{10 * len(memories)}")

    fig, ax = plt.subplots(1, 4, figsize=(14, 3.6), constrained_layout=True)
    c = clue(memories[0], 0.2, 0.3, rng)
    out = recall(W, c, rng)
    for a, img, title in zip(ax[:3], (c, out, memories[0]), ("Clue (20% flipped, 30% hidden)", "Recalled", "Original")):
        a.imshow(img.reshape(SIDE, SIDE), cmap="Blues", vmin=-1, vmax=1); a.set_title(title); a.axis("off")

    for lost, style in ((0.0, "-"), (0.6, "--")):
        Ps, q = capacity_curve(lost)
        ax[3].plot(Ps, q, style, label=f"{lost:.0%} synapses lost")
        print(f"Capacity curve, {lost:.0%} lost:", " ".join(f"{p}:{v:.2f}" for p, v in zip(Ps, q)))
    ax[3].axvline(0.138 * N, ls=":", c="crimson", label="0.14 × N")
    ax[3].set(title="Too many memories", xlabel="memories stored", ylabel="recall quality"); ax[3].legend()
    plt.show()
