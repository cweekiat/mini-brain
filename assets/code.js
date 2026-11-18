// Minimal syntax colouring for the "How it's coded" snippets.
// Colours comments, keywords and numbers in every <pre><code class="js">.
// One pass, so inserted <span> markup is never re-matched.
const TOKEN = /\b(\d+(?:\.\d+)?)\b|\b(if|else|for|return|let|const|function|class|new|true|false|this)\b/g;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function line(src) {
  const i = src.indexOf("//");
  const code = i < 0 ? src : src.slice(0, i), note = i < 0 ? "" : src.slice(i);
  const body = esc(code).replace(TOKEN, (m, num) =>
    num ? `<span class="tn">${m}</span>` : `<span class="tk">${m}</span>`);
  return body + (note ? `<span class="tc">${esc(note)}</span>` : "");
}

export function highlight(root = document) {
  root.querySelectorAll("pre code.js").forEach((el) => {
    el.innerHTML = el.textContent.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n").map(line).join("\n");
  });
}
