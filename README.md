# Mini Brain

Building a scaled-down artificial brain on a laptop, one brain function at a time, as a learning project.

**Live site:** https://cweekiat.github.io/mini-brain/

Every step is a web page with:

- a plain-language **analogy**
- a **live demo** running a real neuroscience model in your browser
- **“Try this”** experiments
- **live Python code beside every demo**: your inputs and its outputs filled in as it runs
- a **real brain vs artificial brain** comparison
- **beyond the lab**: the emerging tech (neuromorphic chips, brain–computer interfaces, AI) and uses for good that each idea leads to
- a quick **check** quiz

## Roadmap

| # | Step | Level | Status |
|---|------|-------|--------|
| 1 | One neuron: leaky bucket + Hodgkin–Huxley ion channels | Cellular | ✅ |
| 2 | Two neurons that learn: synapses, STDP, Pavlov's bell | Cellular | ✅ |
| 3 | Brain waves from 1,000 neurons: E/I network, gamma, EEG spectrum | Physiological | ✅ |
| 4 | Memory recall: Hopfield network, pattern completion, capacity and synapse loss | Physiological | ✅ |
| 5 | Working memory: ring bump attractor, drift, distractors, slow NMDA synapses | Physiological | ✅ |
| 6 | Decisions: two populations race to a threshold, speed vs accuracy | Physiological | ✅ |
| 7 | Learning from reward (dopamine) | Physiological | ⏳ |
| 8 | Vision: learning to read digits | Physiological | ⏳ |
| 9 | Navigation: place cells and head direction | Physiological | ⏳ |
| 10 | Rhythmic movement (central pattern generator) | Physiological | ⏳ |
| 11 | A whole fruit-fly brain (FlyWire connectome) | Anatomical | ⏳ |
| 12 | The whole human brain as ~80 connected regions | Anatomical | ⏳ |

## Side trips

- **How connected is the brain?** (`steps/scaling-up.html`): connections per neuron across the brain, a small-world wiring demo, and a calculator for what simulating any brain would take

## Python versions

Every step has a plain-Python version of its models in `python/` (NumPy + Matplotlib), matching the live code panels:

```bash
pip install -r python/requirements.txt
```

```bash
python python/step02_synapse.py
```

## Run locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 4180
```

Then open http://localhost:4180.

## Layout

```
index.html            home page, roadmap, scoreboard
steps/NN-name.html    one page per step (lesson + live demos)
assets/style.css      shared styles (light + dark)
assets/plot.js        tiny canvas plotting helpers
assets/steps.js       the list of steps: drives nav, roadmap, scoreboard
assets/sim/*.js       the brain models, one file per topic (run in the browser)
assets/livecode.js    helpers for the live Python code panels
python/stepNN_*.py    the same models in Python, runnable locally
```
