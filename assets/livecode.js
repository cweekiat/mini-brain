// Live code panels: show the Python version of an algorithm with the current
// inputs and computed outputs filled in. Shared by every step.
export const C = (s) => `<span class="tc">${s}</span>`;        // # comment
export const K = (s) => `<span class="tk">${s}</span>`;        // keyword
export const IN = (v) => `<span class="lv in">${v}</span>`;    // value you control
export const OUT = (v) => `<span class="lv out">${v}</span>`;  // value the code computed
export const num = (v, d = 1) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(d);

// lines: strings, or [string, "hit"] to highlight the line that just ran
export function paint(id, lines) {
  document.getElementById(id).innerHTML = lines
    .map((l) => (Array.isArray(l) ? `<span class="line ${l[1]}">${l[0]}</span>` : `<span class="line">${l}</span>`))
    .join("");
}
