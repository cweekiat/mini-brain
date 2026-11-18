# Mini Brain: notes for building more steps

A learning site about building a scaled-down brain, written for a university student. Keep it simple, concise and bite-sized: short sentences, one idea per card, longer material inside `<details>`.

## Design: Apple HIG, translated to the web
- System font stack, iOS Dynamic Type scale in rem (Large Title 34, Title 2 22, Headline 17, Body 17, Subhead 15, Footnote 13). Never embed SF fonts or SF Symbols.
- Grouped background + white cards (`.card`, `.group` rows), translucent `.navbar` with a back link naming the previous screen (“‹ Roadmap”) and “Step N of 12”.
- Colours only from tokens in `style.css`. All text at least 4.5:1 in light and dark. `--real` = real brain (pink), `--model` = our model (green), `--na` / `--k` = sodium / potassium.
- Every control at least 44 px tall. Buttons are verbs in title case (“Zap”, “Zap Twice”, “Play”). Demos start paused when Reduce Motion is on.
- No horizontal scroll at 375 px, including code blocks (about 36 characters per line max).

## Every step page, in this order
1. Eyebrow (Step N · level), Large Title, one-line lede
2. **You'll learn**: 3–4 goals
3. **The idea**: one analogy sentence + 3 bullets
4. **Demo + live code, side by side** (`div.duo` holding `section.card` and `aside.card.live-code`). The code panel shows the algorithm **in Python syntax** (helpers in `assets/livecode.js`), at most 36 characters a line, repainted about 20×/s from the model's state: `IN(v)` tags values the user controls, `OUT(v)` tags computed values, `C()` for comments, `K()` for keywords. Highlight the active branch (e.g. the spike `if`) with a `hit` line plus a text cue (“← fired!”). It sits side by side at 960 px+ and stacks on phones. Follow each demo with a **Try it** card (`ol.tasks`).
   **Code panels must be complete and accurate.** They mirror the demo's real step loop line for line, in the same order. Every input shown is used in the code shown, and every value the sim uses appears (state fixed constants in a comment). Show values the sim actually applied: if a brief pulse is held on screen for visibility, show the matching snapshot of anything computed from it. Before shipping, read each panel against its `frameN()` loop.
5. **The real [thing]**: the biology in short cards, in stages if it's a process
6. **The equations**: `.eq` blocks (colour-coded terms) plus a `.terms-grid` explaining every symbol; exact constants in a `<details>`
7. **Real vs our model**: `.vs` items with `.pair .r` / `.pair .m`
8. Optional `<details>`: why this simplification, the equation
9. **Key terms**: `dl.terms`, one-line definitions
10. **Run it yourself**: link to `python/stepNN_<slug>.py`, the same models in NumPy, checked to give the same numbers as the browser
11. **Check yourself**: 3-question quiz, a “Mark as done” toggle, and a `.pager`

## Conventions
- Static only: plain ES modules, no build step. Runs on GitHub Pages.
- Browser models live in `assets/sim/<topic>.js` (JS, so the demos run on Pages). Python twins live in `python/`; keep the numbers identical, units mV / ms, commented in plain English.
- To add a step: create `steps/NN-slug.html`, set `ready: true` in `assets/steps.js`, and tick it in README.md. Link the previous step's pager “Next” to it.
- Verify numbers against the literature before claiming a match.
- A hidden browser pane pauses `requestAnimationFrame`. To test, load the page in an iframe with rAF patched to setTimeout.
