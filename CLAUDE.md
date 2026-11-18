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
4. **Demo(s)** in `section.card`, each followed by a **Try it** card (`ol.tasks`, each task plus a one-line “what you'll see”)
5. **The real [thing]**: the biology in 3–4 bullets
6. **How it's coded**: `.card.coded` per behaviour. A “BIOLOGY · …” line, a title, a snippet of at most 8 lines in `<pre><code class="js">` (highlighted by `assets/code.js`), and one line linking it back to the demo. Snippets are simplified from `assets/sim/`, with comments on their own lines.
7. **Real vs our model**: `.vs` items with `.pair .r` / `.pair .m`
8. Optional `<details>`: why this simplification, the equation
9. **Key terms**: `dl.terms`, one-line definitions
10. **Check yourself**: 3-question quiz, a “Mark as done” toggle, and a `.pager`

## Conventions
- Static only: plain ES modules, no build step. Runs on GitHub Pages.
- Models live in `assets/sim/<topic>.js`, units mV / ms, commented in plain English.
- To add a step: create `steps/NN-slug.html`, set `ready: true` in `assets/steps.js`, and tick it in README.md. Link the previous step's pager “Next” to it.
- Verify numbers against the literature before claiming a match.
- A hidden browser pane pauses `requestAnimationFrame`. To test, load the page in an iframe with rAF patched to setTimeout.
