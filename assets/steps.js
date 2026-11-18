// The single list of every step. The navigation bar, home-page roadmap and
// scoreboard are all built from this, so a new step only needs an entry here
// plus its page in /steps.
export const LEVELS = ["Cellular", "Circuits", "Whole brain"];

export const STEPS = [
  { n: 1, slug: "01-neuron", title: "One neuron", sub: "How a cell fires a spike", level: "Cellular", ready: true, neurons: 1, synapses: 0 },
  { n: 2, slug: "02-synapse", title: "Two neurons that learn", sub: "Fire together, wire together", level: "Cellular", ready: true, neurons: 2, synapses: 1 },
  { n: 3, slug: "03-brain-waves", title: "Brain waves", sub: "Rhythms with no conductor", level: "Circuits", ready: true, neurons: 1000, synapses: 99900 },
  { n: 4, slug: "04-memory", title: "Memory recall", sub: "Half a cue, the whole memory", level: "Circuits", ready: true, neurons: 400, synapses: 159600 },
  { n: 5, slug: "05-working-memory", title: "Working memory", sub: "Holding a thought", level: "Circuits", ready: false, neurons: 1000 },
  { n: 6, slug: "06-decisions", title: "Decisions", sub: "Neurons that compete", level: "Circuits", ready: false, neurons: 2000 },
  { n: 7, slug: "07-reward", title: "Learning from reward", sub: "Dopamine as a teacher", level: "Circuits", ready: false, neurons: 2000 },
  { n: 8, slug: "08-vision", title: "Vision", sub: "Learning to read digits", level: "Circuits", ready: false, neurons: 6400 },
  { n: 9, slug: "09-navigation", title: "Navigation", sub: "Place cells and a compass", level: "Circuits", ready: false, neurons: 1000 },
  { n: 10, slug: "10-movement", title: "Rhythmic movement", sub: "A circuit that walks", level: "Circuits", ready: false, neurons: 50 },
  { n: 11, slug: "11-fly-brain", title: "A whole fly brain", sub: "140,000 real neurons", level: "Whole brain", ready: false, neurons: 140000 },
  { n: 12, slug: "12-whole-brain", title: "The human brain, summarised", sub: "80 regions, real wiring", level: "Whole brain", ready: false, neurons: 0 },
];

export const nextOf = (n) => STEPS.find((s) => s.n === n + 1);
export const prevOf = (n) => STEPS.find((s) => s.n === n - 1);

// Per-browser "finished" ticks. Storage can be blocked, so every access is guarded.
export function isDone(n) { try { return localStorage.getItem("mb-done-" + n) === "1"; } catch { return false; } }
export function setDone(n, v) { try { localStorage.setItem("mb-done-" + n, v ? "1" : "0"); } catch {} }
