// Scaling-up page: small-world wiring (Watts & Strogatz, 1998).
// N neurons on a ring. Each links to its K nearest neighbours, then every link
// is rewired to a random neuron with chance p. Links are treated as two-way.
import { rng } from "./network.js";

export function smallWorld(N, K, p, seed = 1) {
  const R = rng(seed);
  const adj = Array.from({ length: N }, () => new Set());
  const edges = [];
  for (let i = 0; i < N; i++) for (let d = 1; d <= K / 2; d++) edges.push([i, (i + d) % N]);
  for (const [i, j0] of edges) {
    let j = j0;
    if (R.uniform() < p) { // rewire: pick a random partner that isn't i or already linked
      let tries = 0;
      do { j = Math.floor(R.uniform() * N); tries++; } while ((j === i || adj[i].has(j)) && tries < 50);
      if (j === i || adj[i].has(j)) j = j0;
    }
    if (j !== i && !adj[i].has(j)) { adj[i].add(j); adj[j].add(i); }
  }
  return adj.map((s) => [...s]);
}

// Breadth-first search: hops from one neuron to every other (−1 = unreachable).
export function hopsFrom(adj, src) {
  const d = new Int32Array(adj.length).fill(-1), q = [src];
  d[src] = 0;
  for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (d[v] < 0) { d[v] = d[q[h]] + 1; q.push(v); }
  return d;
}

// Average hops between all pairs (path length L) and clustering C:
// C = for each neuron, the fraction of its partners' pairs that are linked to each other.
export function metrics(adj) {
  const N = adj.length;
  let sum = 0, pairs = 0, unreachable = 0;
  for (let s = 0; s < N; s++) { const d = hopsFrom(adj, s); for (let t = 0; t < N; t++) if (t !== s) { if (d[t] > 0) { sum += d[t]; pairs++; } else unreachable++; } }
  let C = 0;
  for (let i = 0; i < N; i++) {
    const nb = adj[i], k = nb.length; if (k < 2) continue;
    let links = 0;
    for (let a = 0; a < k; a++) { const sa = adj[nb[a]]; for (let b = a + 1; b < k; b++) if (sa.includes(nb[b])) links++; }
    C += links / ((k * (k - 1)) / 2);
  }
  return { L: pairs ? sum / pairs : Infinity, C: C / N, unreachable };
}
