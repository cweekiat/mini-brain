"""Mini Brain · Step 3: brain waves.

1,000 leaky-bucket neurons (800 excitatory, 200 inhibitory), each pair wired
with a 10% chance. The same step as the live code panel, vectorised in NumPy.

Run:  python step03_brain_waves.py      (needs numpy and matplotlib)
The random numbers differ from the browser, so results match statistically,
not spike for spike.
"""
import numpy as np
import matplotlib.pyplot as plt

NE, NI = 800, 200
N = NE + NI
E = np.arange(N) < NE                              # True for excitatory cells
V_REST, THRESHOLD, V_RESET, R, TAU_M, T_REF = -70.0, -55.0, -75.0, 10.0, 15.0, 2.0

PRESETS = {
    "rhythm":  dict(drive_E=3.0, drive_I=0.5, w_E=0.6, g=5.0, noise=0.5),
    "calm":    dict(drive_E=2.0, drive_I=2.0, w_E=0.6, g=5.0, noise=3.0),
    "seizure": dict(drive_E=3.0, drive_I=0.5, w_E=0.6, g=0.0, noise=0.5),
    "silent":  dict(drive_E=1.0, drive_I=0.5, w_E=0.6, g=5.0, noise=0.5),
}


def simulate(drive_E, drive_I, w_E, g, noise, tau_E=3.0, tau_I=8.0, ms=1500, dt=0.1, seed=1):
    rng = np.random.default_rng(seed)
    W = (rng.random((N, N)) < 0.1) & ~np.eye(N, dtype=bool)   # W[j, k]: k → j
    W = W.astype(np.float32)
    V = V_REST + 15 * rng.random(N)
    I_E, I_I, refractory = np.zeros(N), np.zeros(N), np.zeros(N)
    ext = np.where(E, drive_E, drive_I)
    spikes, eeg = [], []                             # (time, neuron), 1 sample per ms
    for step in range(int(ms / dt)):
        I_E -= dt / tau_E * I_E                      # AMPA fades
        I_I -= dt / tau_I * I_I                      # GABA fades
        rest = refractory > 0
        refractory[rest] -= dt
        V[rest] = V_RESET
        ok = ~rest
        I = ext + noise * 1.5 * rng.standard_normal(N) + I_E - I_I
        V[ok] += dt / TAU_M * (-(V[ok] - V_REST) + R * I[ok])
        fired = ok & (V >= THRESHOLD)
        V[fired] = V_RESET
        refractory[fired] = T_REF
        # deliver spikes; they are felt from the next step
        fE = np.flatnonzero(fired[:NE])
        fI = NE + np.flatnonzero(fired[NE:])
        if fE.size: I_E += w_E * W[:, fE].sum(1)
        if fI.size: I_I += g * w_E * W[:, fI].sum(1)
        t = step * dt
        spikes.extend((t, k) for k in np.flatnonzero(fired))
        if step % 10 == 9:
            eeg.append(np.mean(I_E[:NE] + I_I[:NE]))  # the EEG-like signal
    return np.array(spikes).reshape(-1, 2), np.array(eeg)


def summarise(spikes, ms, skip=300):
    """Rates and synchrony (variance/mean of E spikes per 1 ms bin; ≈1 if independent)."""
    s = spikes[spikes[:, 0] > skip]
    secs = (ms - skip) / 1000
    nE = np.sum(s[:, 1] < NE)
    counts = np.bincount(s[s[:, 1] < NE, 0].astype(int), minlength=ms)[skip:ms]
    sync = counts.var() / counts.mean() if counts.mean() > 0 else 0.0
    return nE / NE / secs, (len(s) - nE) / NI / secs, sync


def peak_frequency(eeg):
    """Same as the browser: last 1,024 samples, mean removed, Hann window."""
    x = eeg[-1024:]
    x = (x - x.mean()) * np.hanning(1024)
    p = np.abs(np.fft.rfft(x)) ** 2
    f = np.fft.rfftfreq(1024, d=0.001)
    m = (f >= 3) & (f <= 100)
    return f[m][np.argmax(p[m])], f, p


if __name__ == "__main__":
    for name, params in PRESETS.items():
        spikes, eeg = simulate(**params)
        rE, rI, sync = summarise(spikes, 1500)
        print(f"{name:8s} E {rE:5.1f} Hz  I {rI:5.1f} Hz  synchrony {sync:6.1f}x  peak {peak_frequency(eeg)[0]:4.0f} Hz")

    print("Rhythm speed vs how long inhibition lasts:")
    for tau_I in (8, 12, 16, 25):
        _, eeg = simulate(**PRESETS["rhythm"], tau_I=tau_I, ms=1500)
        print(f"  tau_I = {tau_I:2d} ms → peak {peak_frequency(eeg)[0]:.0f} Hz")

    spikes, eeg = simulate(**PRESETS["rhythm"])
    fig, ax = plt.subplots(3, 1, figsize=(9, 9), constrained_layout=True)
    show = (spikes[:, 0] > 1250) & ((spikes[:, 1] < 200) | ((spikes[:, 1] >= NE) & (spikes[:, 1] < NE + 50)))
    rows = np.where(spikes[show, 1] < NE, spikes[show, 1], spikes[show, 1] - NE + 200)
    ax[0].scatter(spikes[show, 0], rows, s=2, c=np.where(rows < 200, "tab:blue", "tab:purple"))
    ax[0].set(title="Raster (Rhythm): 200 E + 50 I neurons", xlabel="ms", ylabel="neuron")
    ax[1].plot(np.arange(len(eeg))[-250:], eeg[-250:], c="tab:green")
    ax[1].set(title="EEG-like signal", xlabel="ms", ylabel="nA")
    pk, f, p = peak_frequency(eeg)
    m = f <= 100
    ax[2].plot(f[m], p[m] / p[m].max(), c="tab:green"); ax[2].axvline(pk, ls="--", c="crimson")
    ax[2].set(title=f"Spectrum: peak {pk:.0f} Hz", xlabel="Hz", ylabel="power (relative)")
    plt.show()
