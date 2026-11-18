# Mini Brain: notes for building more steps

A learning site about building a scaled-down brain. The owner is learning the concepts, so clarity beats completeness.

## Every step page must have, in this order
1. Kicker (step number + zoom level), title, one-line lede
2. **The big idea**: one everyday analogy, in a `.analogy` block
3. **Live demo(s)**: a model running in the browser, with sliders and buttons, in a `.demo` block
4. **Try this**: numbered experiments that each reveal one concept
5. **What the real brain does**: the biology, in plain words
6. **Real vs our model** table (`table.pair` with `.tag.real` / `.tag.model`), then “What we left out”
7. **The code**: the core loop, short, quoted from `assets/sim/`
8. **Quick check**: a 3-question quiz, a “mark done” checkbox, and a link to the next step

## Conventions
- Static only: plain ES modules, no build step, no frameworks. Runs on GitHub Pages.
- Models live in `assets/sim/<topic>.js`, one class per model, units in mV / ms, commented in plain English.
- To add a step: create `steps/NN-slug.html`, set `ready: true` in `assets/steps.js`, and tick it in README.md.
- Verify numbers against the literature before claiming “✓ matches”.
- Colours come from CSS tokens in `style.css`. Light and dark both work. Mobile at 375px must have no horizontal scroll.
- Animation uses `requestAnimationFrame`. A hidden browser pane pauses it, so test inside an iframe whose rAF is patched to setTimeout.
