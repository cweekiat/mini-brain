"""Mini Brain · Step 5: working memory with a ring "bump attractor".

100 rate neurons on a ring. A brief flash starts a bump of activity that keeps
itself going after the flash is gone, and slowly drifts with noise.

Run:  python step05_working_memory.py      (needs numpy and matplotlib)
"""
import numpy as np
import matplotlib.pyplot as plt

N = 100
THETA = 2 * np.pi * np.arange(N) / N              # preferred angles
wrap = lambda a: np.arctan2(np.sin(a), np.cos(a))  # angle into −π…π
f = lambda x: np.where(x > 0, np.tanh(x), 0.0)     # silent below 0, saturates at 1


class Ring:
    def __init__(self, J1=12.0, J0=-2.0, I0=-0.4, tau=100.0, noise=0.5, seed=1):
        self.W = (J0 + J1 * np.cos(THETA[:, None] - THETA[None, :])) / N
        self.I0, self.tau, self.noise = I0, tau, noise
        self.r = np.zeros(N)
        self.rng = np.random.default_rng(seed)

    def step(self, dt=1.0, ext=0.0):
        I = self.W @ self.r + self.I0 + ext + self.noise * self.rng.standard_normal(N) / np.sqrt(dt)
        self.r += dt / self.tau * (-self.r + f(I))

    def run(self, ms, ext=0.0, dt=1.0):
        for _ in range(int(ms / dt)):
            self.step(dt, ext)

    def decode(self):
        """Population vector: each neuron votes for its angle, weighted by its rate."""
        return np.arctan2(self.r @ np.sin(THETA), self.r @ np.cos(THETA))


def bump(at, strength, width=0.5):
    d = wrap(THETA - at)
    return strength * np.exp(-d ** 2 / (2 * width ** 2))


def drift_curve(tau, noise, trials=30, delays=(500, 1000, 2000, 3000, 4000, 5000, 6000)):
    err, lost = {t: [] for t in delays}, 0
    for k in range(trials):
        at = (k * 2.399) % (2 * np.pi)
        ring = Ring(tau=tau, noise=noise, seed=100 + k)
        ring.run(250, ext=bump(at, 2))                # flash for 250 ms, then wait
        for t in range(1, max(delays) + 1):
            ring.step(1.0)
            if t in err:
                if ring.r.max() < 0.3:
                    lost += 1
                    break
                err[t].append(np.degrees(wrap(ring.decode() - at)))
    rms = {t: (np.sqrt(np.mean(np.square(e))) if e else np.nan) for t, e in err.items()}
    return rms, lost


if __name__ == "__main__":
    # Demo 1: flash at 60°, hold for 3 s, then a nearby distractor
    ring = Ring()
    ring.run(300)
    hist = []
    for t in range(4500):
        ext = 0.0
        if t < 250:
            ext = bump(np.radians(60), 2)              # the flash
        elif 2000 <= t < 2250:
            ext = bump(np.radians(105), 1)             # distractor 45° away
        ring.step(1.0, ext)
        if t % 20 == 0:
            hist.append(ring.r.copy())
        if t in (1999, 4499):
            print(f"t={t + 1} ms: remembered {np.degrees(ring.decode()) % 360:.1f}°  (flashed at 60°)")

    print("Memory error vs delay (RMS over 30 trials):")
    curves = {}
    for tau in (20, 100):
        rms, lost = drift_curve(tau, 0.5)
        curves[tau] = rms
        print(f"  tau={tau:3d} ms: " + "  ".join(f"{t / 1000:.1f}s {v:4.1f}°" for t, v in rms.items()) + f"  forgotten {lost}/30")

    fig, ax = plt.subplots(1, 2, figsize=(12, 4), constrained_layout=True)
    ax[0].imshow(np.array(hist).T, aspect="auto", origin="lower", cmap="Blues", extent=[0, 4.5, 0, 360])
    ax[0].set(title="Bump holds the flash (60°); a nearby distractor pulls it", xlabel="s", ylabel="neuron's preferred angle (°)")
    for tau, rms in curves.items():
        ax[1].plot([t / 1000 for t in rms], list(rms.values()), marker="o", label=f"τ = {tau} ms")
    ax[1].set(title="Fuzzier with time", xlabel="delay (s)", ylabel="RMS error (°)"); ax[1].legend()
    plt.show()
