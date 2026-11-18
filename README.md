# Mini Brain

Building a scaled-down artificial brain on a laptop, one brain function at a time, as a learning project.

**Live site:** https://cweekiat.github.io/mini-brain/

Every step is a web page with:

- a plain-language **analogy**
- a **live demo** running a real neuroscience model in your browser
- **“Try this”** experiments
- **How it's coded**: each brain behaviour paired with the few lines of code that reproduce it
- a **real brain vs artificial brain** comparison
- the **code**, short and commented
- a quick **check** quiz

## Roadmap

| # | Step | Level | Status |
|---|------|-------|--------|
| 1 | One neuron: leaky bucket + Hodgkin–Huxley ion channels | Cellular | ✅ |
| 2 | Two neurons that learn (synapses, STDP) | Cellular | ⏳ |
| 3 | Brain waves from 1,000 neurons | Physiological | ⏳ |
| 4 | Memory recall from partial cues | Physiological | ⏳ |
| 5 | Working memory | Physiological | ⏳ |
| 6 | Decisions | Physiological | ⏳ |
| 7 | Learning from reward (dopamine) | Physiological | ⏳ |
| 8 | Vision: learning to read digits | Physiological | ⏳ |
| 9 | Navigation: place cells and head direction | Physiological | ⏳ |
| 10 | Rhythmic movement (central pattern generator) | Physiological | ⏳ |
| 11 | A whole fruit-fly brain (FlyWire connectome) | Anatomical | ⏳ |
| 12 | The whole human brain as ~80 connected regions | Anatomical | ⏳ |

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
assets/code.js        syntax colouring for code snippets
assets/steps.js       the list of steps: drives nav, roadmap, scoreboard
assets/sim/*.js       the brain models, one file per topic
```
