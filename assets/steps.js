// The single list of every step. Navigation, the home-page roadmap and the
// "artificial brain inventory" are all built from this, so a new step only
// needs an entry here plus its page in /steps.
export const STEPS = [
  { n: 1, slug: "01-neuron", title: "One neuron", sub: "The leaky bucket that fires a spike", level: "Cellular", ready: true, neurons: 1 },
  { n: 2, slug: "02-synapse", title: "Two neurons that learn", sub: "Synapses and “fire together, wire together”", level: "Cellular", ready: false, neurons: 2 },
  { n: 3, slug: "03-brain-waves", title: "Brain waves", sub: "1,000 neurons find a rhythm by themselves", level: "Physiological", ready: false, neurons: 1000 },
  { n: 4, slug: "04-memory", title: "Memory recall", sub: "Show half a pattern, get the whole back", level: "Physiological", ready: false, neurons: 400 },
  { n: 5, slug: "05-working-memory", title: "Working memory", sub: "Holding a thought after the input is gone", level: "Physiological", ready: false, neurons: 1000 },
  { n: 6, slug: "06-decisions", title: "Decisions", sub: "Two groups compete; harder choices take longer", level: "Physiological", ready: false, neurons: 2000 },
  { n: 7, slug: "07-reward", title: "Learning from reward", sub: "Dopamine teaches a circuit to play a game", level: "Physiological", ready: false, neurons: 2000 },
  { n: 8, slug: "08-vision", title: "Vision", sub: "Neurons teach themselves to read digits", level: "Physiological", ready: false, neurons: 6400 },
  { n: 9, slug: "09-navigation", title: "Navigation", sub: "Place cells and an inner compass", level: "Physiological", ready: false, neurons: 1000 },
  { n: 10, slug: "10-movement", title: "Rhythmic movement", sub: "A circuit that makes walking by itself", level: "Physiological", ready: false, neurons: 50 },
  { n: 11, slug: "11-fly-brain", title: "A whole fly brain", sub: "The real 140,000-neuron connectome", level: "Anatomical", ready: false, neurons: 140000 },
  { n: 12, slug: "12-whole-brain", title: "The whole human brain, summarised", sub: "80 regions, real wiring, sleep vs wake", level: "Anatomical", ready: false, neurons: 0 },
];

export function navInto(el, current, base) {
  el.innerHTML = STEPS.map((s) => {
    const cls = s.n === current ? "on" : s.ready ? "" : "soon";
    const href = s.ready ? `${base}steps/${s.slug}.html` : `${base}index.html#roadmap`;
    return `<a class="${cls}" href="${href}" title="Step ${s.n}: ${s.title}${s.ready ? "" : " (coming soon)"}">${s.n}</a>`;
  }).join("");
}

// Per-browser "I finished this step" ticks. Wrapped because storage can be blocked.
export function isDone(n) { try { return localStorage.getItem("mb-done-" + n) === "1"; } catch { return false; } }
export function setDone(n, v) { try { localStorage.setItem("mb-done-" + n, v ? "1" : "0"); } catch {} }
