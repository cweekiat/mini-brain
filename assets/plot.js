// Tiny canvas plotting helpers shared by every step. No dependencies.

export function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Make a canvas crisp on retina screens and keep it sized to its box.
export function fitCanvas(canvas, height) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  canvas.style.height = height + "px";
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h: height };
}

// A scrolling "oscilloscope": push samples in, it draws the last N of them.
export class Scope {
  constructor(canvas, { height = 220, yMin, yMax, yLabel = "", window: n = 1000, lines = [], hlines = [] }) {
    Object.assign(this, { canvas, height, yMin, yMax, yLabel, n, lines, hlines });
    this.data = lines.map(() => new Float32Array(n).fill(NaN));
    this.marks = new Uint8Array(n);
    this.head = 0;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
  }
  resize() { Object.assign(this, fitCanvas(this.canvas, this.height)); this.draw(); }
  push(values, mark = 0) {
    values.forEach((v, i) => (this.data[i][this.head] = v));
    this.marks[this.head] = mark;
    this.head = (this.head + 1) % this.n;
  }
  clear() { this.data.forEach((d) => d.fill(NaN)); this.marks.fill(0); }
  draw() {
    const { ctx, w, h, n, yMin, yMax } = this;
    if (!ctx) return;
    const L = 44, R = 8, T = 8, B = 8;
    const pw = w - L - R, ph = h - T - B;
    const y = (v) => T + ph * (1 - (v - yMin) / (yMax - yMin));
    ctx.clearRect(0, 0, w, h);
    ctx.font = "12px -apple-system, system-ui, sans-serif";
    // grid + y ticks
    const step = niceStep((yMax - yMin) / 4);
    ctx.strokeStyle = css("--grid"); ctx.fillStyle = css("--label-2"); ctx.lineWidth = 1;
    for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) {
      ctx.beginPath(); ctx.moveTo(L, y(v)); ctx.lineTo(w - R, y(v)); ctx.stroke();
      ctx.fillText(step < 1 ? v.toFixed(1) : String(Math.round(v)), 4, y(v) + 4);
    }
    if (this.yLabel) ctx.fillText(this.yLabel, L + 4, T + 10);
    // reference lines (threshold etc.)
    for (const hl of this.hlines) {
      const v = typeof hl.value === "function" ? hl.value() : hl.value;
      ctx.setLineDash([4, 4]); ctx.strokeStyle = css(hl.color); ctx.beginPath();
      ctx.moveTo(L, y(v)); ctx.lineTo(w - R, y(v)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css(hl.color); ctx.fillText(hl.label, w - R - ctx.measureText(hl.label).width - 2, y(v) - 4);
    }
    // traces, oldest sample on the left
    this.data.forEach((d, li) => {
      ctx.strokeStyle = css(this.lines[li].color); ctx.lineWidth = this.lines[li].width || 2;
      ctx.lineJoin = "round"; ctx.beginPath();
      let pen = false;
      for (let k = 0; k < n; k++) {
        const v = d[(this.head + k) % n];
        if (Number.isNaN(v)) { pen = false; continue; }
        const px = L + (pw * k) / (n - 1), py = y(Math.max(yMin, Math.min(yMax, v)));
        pen ? ctx.lineTo(px, py) : ctx.moveTo(px, py); pen = true;
      }
      ctx.stroke();
    });
    // spike markers along the top
    ctx.fillStyle = css("--accent");
    for (let k = 0; k < n; k++) if (this.marks[(this.head + k) % n]) {
      const px = L + (pw * k) / (n - 1);
      ctx.fillRect(px - 1, T, 2, 6);
    }
  }
}

// Static x–y line chart (for curves such as firing rate vs input).
export function xyPlot(canvas, { height = 220, series, xLabel, yLabel, xMax, yMax, marker }) {
  const { ctx, w, h } = fitCanvas(canvas, height);
  const L = 44, R = 10, T = 10, B = 30;
  const pw = w - L - R, ph = h - T - B;
  const X = (v) => L + (pw * v) / xMax, Y = (v) => T + ph * (1 - v / yMax);
  ctx.clearRect(0, 0, w, h);
  ctx.font = "12px -apple-system, system-ui, sans-serif"; ctx.lineWidth = 1;
  const ys = niceStep(yMax / 4), xs = niceStep(xMax / 5);
  ctx.strokeStyle = css("--grid"); ctx.fillStyle = css("--label-2");
  for (let v = 0; v <= yMax + 1e-9; v += ys) { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke(); ctx.fillText(String(+v.toFixed(1)), 4, Y(v) + 4); }
  for (let v = 0; v <= xMax + 1e-9; v += xs) ctx.fillText(String(+v.toFixed(1)), X(v) - 6, h - 14);
  ctx.fillText(xLabel, w - R - ctx.measureText(xLabel).width, h - 2);
  ctx.fillText(yLabel, L + 4, T + 10);
  for (const s of series) {
    ctx.strokeStyle = css(s.color); ctx.lineWidth = 2; ctx.setLineDash(s.dash || []); ctx.beginPath();
    s.points.forEach(([a, b], i) => (i ? ctx.lineTo(X(a), Y(Math.min(b, yMax))) : ctx.moveTo(X(a), Y(Math.min(b, yMax)))));
    ctx.stroke(); ctx.setLineDash([]);
  }
  if (marker) {
    ctx.fillStyle = css(marker.color); ctx.strokeStyle = css("--card"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(marker.x), Y(Math.min(marker.y, yMax)), 6, 0, 7); ctx.fill(); ctx.stroke();
  }
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

// Wire a range input to an <output> and a callback.
export function slider(id, fmt, onChange) {
  const el = document.getElementById(id);
  const out = document.querySelector(`output[for="${id}"]`);
  const update = () => { const v = parseFloat(el.value); if (out) out.textContent = fmt(v); onChange && onChange(v); };
  el.addEventListener("input", update);
  update();
  return () => parseFloat(el.value);
}
