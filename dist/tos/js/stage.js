/* =====================================================================
   Stage: animated, zoomable picture for one step of a solution.
   stage = Stage.create(container, scene); stage.show(frame)
   A frame is a small description of what to draw and where to zoom.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS, H = window.Viz._h;
  const { el, txt } = H;
  const f = (x, d = 2) => T.fmt(x, d);
  const W = 800, HT = 440;

  /* ---------- small drawing helpers ---------- */
  let delay = 0, fs = 1;
  const step = () => { delay = Math.min(1.1, delay + 0.12); return delay.toFixed(2) + 's'; };
  const enter = (node, kind) => { node.classList.add(kind === 'draw' ? 'st-draw' : 'st-in'); node.style.animationDelay = step(); return node; };
  const line = (g, x1, y1, x2, y2, cls, marker, draw) => {
    const p = el('path', { d: `M${x1},${y1} L${x2},${y2}`, class: cls, pathLength: 1 }, g);
    if (marker) p.setAttribute('marker-end', `url(#${marker})`);
    return draw === false ? p : enter(p, 'draw');
  };
  const label = (g, x, y, s, cls, anchor) => enter(txt(g, x, y, s, 'lbl ' + (cls || 'st-lab'), anchor || 'middle'));
  const tagBox = (g, x, y, s, cls) => {
    const t = txt(g, x, y, s, 'lbl st-tag ' + (cls || ''), 'middle');
    const w = Math.max(32, s.length * 8.3 * fs + 16);
    const r = el('rect', { x: x - w / 2, y: y - 16 * fs, width: w, height: 22 * fs, rx: 11 * fs, class: 'st-tagbg ' + (cls || '') }, g);
    g.insertBefore(r, t); enter(r); t.style.animationDelay = r.style.animationDelay; t.classList.add('st-in');
    return t;
  };
  function arc(g, cx, cy, r, cw, cls, lab, labPos) {
    const a0 = cw ? 150 : 30, a1 = cw ? 150 + 260 : 30 - 260;
    const rad = (a) => a * Math.PI / 180;
    const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
    const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
    const p = el('path', { d: `M${x0},${y0} A${r},${r} 0 1 ${cw ? 1 : 0} ${x1},${y1}`, class: 'st-arc ' + (cls || ''), pathLength: 1, 'marker-end': `url(#${cls && cls.includes('rot') ? 'st-ah-acc' : 'st-ah-mom'})` }, g);
    enter(p, 'draw');
    if (lab) label(g, labPos ? labPos[0] : cx, labPos ? labPos[1] : cy - r - 8, lab, cls && cls.includes('rot') ? 'st-lab acc' : 'st-lab mom');
    return p;
  }
  function dim(g, x1, y1, x2, y2, lab, cls, off) {
    const p = el('path', { d: `M${x1},${y1} L${x2},${y2}`, class: 'st-dim ' + (cls || ''), 'marker-start': 'url(#st-ah-dim)', 'marker-end': 'url(#st-ah-dim)', pathLength: 1 }, g);
    enter(p, 'draw');
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    if (lab) tagBox(g, mx + (vertical ? (off || 0) : 0), my + (vertical ? 4 : (off !== undefined ? off : -10)), lab, cls);
  }
  function addDefs(svg) {
    const defs = svg.querySelector('defs');
    const mk = (id, cls, size) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: size || 6, markerHeight: size || 6, orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m); };
    mk('st-ah-mom', 'ah-mom'); mk('st-ah-acc', 'ah-acc'); mk('st-ah-dim', 'ah-dim', 7); mk('st-ah-force', 'ah-force', 5); mk('st-ah-load', 'ah-load', 6);
  }
  function padlock(g, x, y, open) {
    const gg = el('g', { class: 'st-lock' + (open ? ' open' : '') }, g);
    el('rect', { x: x - 8, y: y - 2, width: 16, height: 12, rx: 2 }, gg);
    el('path', { d: open ? `M${x - 5},${y - 2} v-5 a5,5 0 0 1 10,0` : `M${x - 5},${y - 2} v-5 a5,5 0 0 1 10,0 v5`, class: 'shackle' }, gg);
    enter(gg);
  }

  /* ---------- viewBox tween ---------- */
  function fitBox(b, aspect) {
    let { x, y, w, h } = b;
    w = Math.max(w, 300); h = Math.max(h, 150);
    if (w / h < aspect) { const nw = h * aspect; x -= (nw - w) / 2; w = nw; } else { const nh = w / aspect; y -= (nh - h) / 2; h = nh; }
    return { x, y, w, h };
  }
  function tweenView(svg, to) {
    const cur = (svg.getAttribute('viewBox') || `0 0 ${W} ${HT}`).split(' ').map(Number);
    const tgt = [to.x, to.y, to.w, to.h];
    H.animate(750, (t) => svg.setAttribute('viewBox', cur.map((v, i) => (v + (tgt[i] - v) * t).toFixed(1)).join(' ')));
  }

  /* =====================================================================
     BEAM STAGE
     ===================================================================== */
  function beamStage(svg, sc) {
    const m = 80, y0 = 140, by = 330;
    const sx = (W - 2 * m) / sc.L, X = (x) => m + x * sx;
    const at = (v) => typeof v === 'number' ? v : (sc.names.find((n) => n[1] === v) || [0])[0];
    let lastDeflKey = null;
    function draw(fr, g) {
      const base = el('g', {}, g), ov = el('g', {}, g);
      const keyed = {};
      const sups = fr.sups || sc.supports;
      // M/EI or BMD baseline
      const usesLow = fr.parts || fr.areas || fr.bmd;
      // beam
      if (fr.seg) { // highlighted segment(s)
        fr.seg.forEach((s) => { const r = el('rect', { x: X(s[0]), y: y0 - 10, width: (s[1] - s[0]) * sx, height: 20, rx: 3, class: 'st-seg' }, base); enter(r); });
      }
      keyed.beam = el('rect', { x: X(0), y: y0 - 7, width: sc.L * sx, height: 14, class: 'st-beam' }, base);
      if (sc.ei) sc.ei.forEach((s) => txt(base, X((s.x1 + s.x2) / 2), y0 + 4, s.label, 'lbl ei'));
      sups.forEach((s, i) => { const gg = el('g', {}, base); H.support(gg, X(s.x), s.type === 'fixed' ? y0 : y0 + 7, s.type, s.right || (s.type === 'fixed' && s.x > 0)); keyed['sup' + i] = gg; });
      sc.loads.forEach((ld, i) => {
        const gg = el('g', {}, base);
        if (ld.type === 'UDL') H.udl(gg, X(ld.x1), X(ld.x2), y0 - 7, ld.label); else H.pointLoad(gg, X(ld.x), y0 - 7, ld.label, sc.loads.some((q) => q.type === 'UDL') ? 72 : 56);
        keyed['load' + i] = gg;
      });
      sc.names.forEach(([x, n]) => txt(base, X(x), y0 + 50, n, 'lbl name'));
      (fr.hl || []).forEach((k) => { if (keyed[k]) keyed[k].classList.add('st-hl'); });
      (fr.hide || []).forEach((k) => { if (keyed[k]) keyed[k].classList.add('st-gone'); });
      if (fr.dim0 !== false && !usesLow) { // overall dimension chain
        const xs = [...new Set(sc.names.map((n) => n[0]).concat([0, sc.L]))].sort((a, b) => a - b);
        for (let k = 0; k < xs.length - 1; k++) if (xs[k + 1] - xs[k] > 1e-9) { el('path', { d: `M${X(xs[k]) + 2},${y0 + 82} L${X(xs[k + 1]) - 2},${y0 + 82}`, class: 'st-dim faint', 'marker-start': 'url(#st-ah-dim)', 'marker-end': 'url(#st-ah-dim)' }, base); txt(base, (X(xs[k]) + X(xs[k + 1])) / 2, y0 + 76, `${+(xs[k + 1] - xs[k]).toFixed(2)} m`, 'lbl dimt'); }
      }
      // ---- lower diagrams ----
      let sMax = 1e-9;
      const sample = (fn, x1, x2) => { const out = []; for (let k = 0; k <= 80; k++) { const x = x1 + (x2 - x1) * k / 80; out.push([x, fn(Math.min(sc.L - 1e-7, Math.max(1e-7, x)))]); } return out; };
      if (usesLow) {
        (fr.parts || []).forEach((p) => sample(p.fn, 0, sc.L).forEach(([, v]) => (sMax = Math.max(sMax, Math.abs(v)))));
        (fr.areas || []).forEach((a) => sample((x) => (a.base ? a.base(x) : 0) + a.fn(x), a.x1, a.x2).forEach(([, v]) => (sMax = Math.max(sMax, Math.abs(v)))));
        if (fr.bmd) sample(fr.bmd.fn || sc.bm, 0, sc.L).forEach(([, v]) => (sMax = Math.max(sMax, Math.abs(v))));
        const s = (fr.bmd && !fr.areas && !fr.parts ? 80 : 95) / sMax;
        el('path', { d: `M${X(0)},${by} L${X(sc.L)},${by}`, class: 'axis' }, ov);
        txt(ov, X(0) - 10, by + 4, fr.lowLabel || (fr.areas ? 'M/EI' : 'BM'), 'lbl st-axl', 'end');
        // light guides from the beam ends
        el('path', { d: `M${X(0)},${y0 + 20} L${X(0)},${by}`, class: 'st-guide' }, ov); el('path', { d: `M${X(sc.L)},${y0 + 20} L${X(sc.L)},${by}`, class: 'st-guide' }, ov);
        (fr.parts || []).forEach((p, i) => {
          const pts = sample(p.fn, 0, sc.L);
          const path = el('path', { d: `M${X(0)},${by} ` + pts.map(([x, v]) => `L${X(x).toFixed(1)},${(by + Math.abs(v) * s).toFixed(1)}`).join(' ') + ` L${X(sc.L)},${by} Z`, class: 'st-part c' + i }, ov); enter(path);
          let im = 0; pts.forEach(([, v], k) => { if (Math.abs(v) > Math.abs(pts[im][1])) im = k; });
          if (p.label) tagBox(ov, Math.min(W - 90, Math.max(110, X(pts[im][0]) + (i ? 70 : 0))), by + Math.abs(pts[im][1]) * s + 22 + i * 4, p.label, 'c' + i);
        });
        (fr.areas || []).forEach((a, i) => {
          const base0 = a.base || (() => 0);
          const top = sample(base0, a.x1, a.x2), bot = sample((x) => base0(x) + a.fn(x), a.x1, a.x2);
          const d = 'M' + top.map(([x, v]) => `${X(x).toFixed(1)},${(by + v * s).toFixed(1)}`).join(' L') + ' L' + bot.reverse().map(([x, v]) => `${X(x).toFixed(1)},${(by + v * s).toFixed(1)}`).join(' L') + ' Z';
          enter(el('path', { d, class: 'st-area c' + (a.c !== undefined ? a.c : i) }, ov));
          // centroid of the shape fn on [x1,x2]
          let A = 0, Ax = 0; const n = 200; for (let k = 0; k < n; k++) { const x = a.x1 + (a.x2 - a.x1) * (k + 0.5) / n; const v = a.fn(x); A += v; Ax += v * x; }
          const xc = Ax / A; const yc = by + (base0(xc) + a.fn(xc) / 2) * s;
          if (a.label) tagBox(ov, X(xc), yc + 5, a.label, 'c' + (a.c !== undefined ? a.c : i));
          if (a.cent) {
            enter(el('circle', { cx: X(xc), cy: yc - 12, r: 4, class: 'st-cdot' }, ov));
            const yy = by - 16 - (a.cent.row || i) * 22;
            line(ov, X(xc), yc - 12, X(xc), yy, 'st-guide2');
            dim(ov, X(xc), yy, X(at(a.cent.ref)), yy, a.cent.label, 'c' + (a.c !== undefined ? a.c : i));
          }
        });
        if (fr.bmd) {
          const fn = fr.bmd.fn || sc.bm; const pts = sample(fn, 0, sc.L);
          // sagging drawn below, hogging above the axis
          const d = `M${X(0)},${by} ` + pts.map(([x, v]) => `L${X(x).toFixed(1)},${(by + v * s * 0.8).toFixed(1)}`).join(' ') + ` L${X(sc.L)},${by} Z`;
          enter(el('path', { d, class: 'st-bmd' }, ov));
          const keys = new Map(); let iMax = 0, iMin = 0; pts.forEach(([, v], k) => { if (v > pts[iMax][1]) iMax = k; if (v < pts[iMin][1]) iMin = k; });
          [pts[iMax], pts[iMin]].concat(sc.names.map((q) => [q[0], fn(Math.min(sc.L - 1e-7, Math.max(1e-7, q[0])))])).forEach(([x, v]) => { if (Math.abs(v) > sMax * 0.03) keys.set(x.toFixed(2) + (v > 0), [x, v]); });
          [...keys.values()].forEach(([x, v]) => label(ov, Math.max(m - 10, Math.min(W - m + 10, X(x))), by + v * s * 0.8 + (v > 0 ? 16 : -6), f(v), 'st-lab val'));
          (fr.marks || []).forEach((mk) => { const v = fn(mk.x); enter(el('circle', { cx: X(mk.x), cy: by + v * s * 0.8, r: 5, class: 'st-cdot' }, ov)); if (mk.from !== undefined) dim(ov, X(mk.x), by - 14, X(at(mk.from)), by - 14, mk.label, 'c1'); else if (mk.label) tagBox(ov, X(mk.x), by + v * s * 0.8 + 26, mk.label, 'c1'); });
          txt(ov, X(sc.L) + 8, by + 30, 'sagging +', 'lbl st-axl', 'start'); txt(ov, X(sc.L) + 8, by - 22, 'hogging −', 'lbl st-axl', 'start');
        }
      }
      // ---- deflected shape ----
      if (fr.defl) {
        const d = fr.defl === true ? {} : fr.defl;
        const bm = d.bm || sc.bm, bc = d.bc || sc.bc;
        const sh = T.deflectedShape(sc.L, bm, d.EI || sc.EI, bc === 'cantilever-left' ? 'cantilever-left' : 'ss', 160);
        const vmax = Math.max(...sh.v.map(Math.abs)) || 1, amp = d.amp || 42;
        const Y = (k, t) => y0 - sh.v[k] / vmax * amp * t;
        const p = el('path', { d: '', class: 'st-defl' + (d.cls ? ' ' + d.cls : '') }, ov);
        const key = (d.key || 'main') + sc.L;
        const render = (t) => p.setAttribute('d', sh.xs.map((x, k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(k, t).toFixed(1)}`).join(' '));
        if (lastDeflKey === key) render(1); else H.animate(1000, render);
        lastDeflKey = key;
        const idx = (x) => Math.round(x / sc.L * (sh.xs.length - 1));
        if (d.tip) { const k = idx(at(d.tip.x)); const yy = Y(k, 1); dim(ov, X(sh.xs[k]) + 16, y0, X(sh.xs[k]) + 16, yy, d.tip.label, 'c2', 52); }
        if (d.tangent) {
          const k = idx(at(d.tangent.x)); const k2 = Math.max(0, Math.min(sh.xs.length - 1, k + (k > sh.xs.length / 2 ? -6 : 6)));
          const slope = (Y(k2, 1) - Y(k, 1)) / (X(sh.xs[k2]) - X(sh.xs[k])); const x0 = X(sh.xs[k]), yk = Y(k, 1); const dir = k > sh.xs.length / 2 ? -1 : 1;
          line(ov, x0 - dir * 20, yk - dir * 20 * slope, x0 + dir * 110, yk + dir * 110 * slope, 'st-tan');
          line(ov, x0, yk, x0 + dir * 110, yk, 'st-guide2');
          label(ov, x0 + dir * 70, yk + (slope * dir > 0 ? 6 : -8) + (slope * dir) * 30, d.tangent.label, 'st-lab acc');
        }
      } else lastDeflKey = null;
      // ---- arrows, moments, rotations ----
      (fr.react || []).forEach((r) => { const x = X(at(r.x)); const up = r.dir !== 'down'; line(ov, x, up ? y0 + 96 : y0 + 44, x, up ? y0 + 46 : y0 + 94, 'st-force', 'st-ah-force'); tagBox(ov, x, y0 + 116, r.label, 'force'); });
      (fr.force || []).forEach((r) => { const x = X(at(r.x)); const up = r.dir !== 'down'; line(ov, x, up ? y0 + 92 : y0 - 70, x, up ? y0 + 10 : y0 - 10, 'st-force big', 'st-ah-force'); tagBox(ov, x + (r.dx || 0), up ? y0 + 112 : y0 - 84, r.label, 'force'); });
      (fr.moments || []).forEach((mm) => { const x = X(at(mm.x)) + (mm.side || 0) * 26; arc(ov, x, y0, 18, mm.cw, 'mom', mm.label, [x + (mm.side || 0) * 10, y0 - 30 - (mm.row || 0) * 18]); });
      (fr.rot || []).forEach((r) => { const x = X(at(r.x)); arc(ov, x, y0, 26, r.cw !== false, 'rot', r.label, [x, y0 - 38]); });
      (fr.lock || []).forEach((x) => padlock(ov, X(at(x)), y0 - 44, false));
      (fr.unlock || []).forEach((x) => padlock(ov, X(at(x)), y0 - 44, true));
      (fr.dims || []).forEach((d0, i) => dim(ov, X(at(d0.x1)), y0 + 66 + i * 22, X(at(d0.x2)), y0 + 66 + i * 22, d0.label, 'c' + (d0.c || 1)));
      (fr.flows || []).forEach((fl) => { // carry-over arrow along beam from node to node
        const x1 = X(at(fl.from)), x2 = X(at(fl.to)); const left = x2 < x1; const yy = left ? y0 + 30 : y0 - 26; const mx = (x1 + x2) / 2; const bend = left ? 40 : -34;
        const p = el('path', { d: `M${x1 + Math.sign(x2 - x1) * 22},${yy} Q${mx},${yy + bend} ${x2 - Math.sign(x2 - x1) * 22},${yy}`, class: 'st-flow', pathLength: 1, 'marker-end': 'url(#st-ah-acc)' }, ov); enter(p, 'draw');
        tagBox(ov, mx, yy + bend * 0.62 + (left ? 8 : 0), fl.label, 'acc');
      });
      (fr.shares || []).forEach((sh) => tagBox(ov, X(at(sh.x)) + sh.side * 62, y0 - 34 - (sh.row || 0) * 24, sh.label, sh.cls || 'c1'));
      if (fr.tag) tagBox(ov, 120, 26, fr.tag, 'acc');
    }
    function box(fr) {
      const low = fr.parts || fr.areas || fr.bmd;
      const fx = fr.focus ? fr.focus.map(at) : [0, sc.L];
      const top = fr.tag ? 8 : 30, bot = low ? 436 : (fr.react || fr.force || fr.dims ? 268 : 236);
      return { x: X(fx[0]) - 70, y: top, w: (fx[1] - fx[0]) * sx + 140, h: bot - top };
    }
    return { draw, box };
  }

  /* =====================================================================
     FRAME STAGE (also used for joint-only diagrams)
     ===================================================================== */
  function frameStage(svg, sc) {
    const { model, sd } = sc;
    const xs = model.nodes.map((n) => n.x), ys = model.nodes.map((n) => n.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const mg = 110; const s = Math.min((W - 2 * mg) / Math.max(1, maxx - minx), (HT - 2 * mg) / Math.max(1, maxy - miny));
    const ox = (W - (maxx - minx) * s) / 2, oy = HT - (HT - (maxy - miny) * s) / 2;
    const P = (x, y) => [ox + (x - minx) * s, oy - (y - miny) * s];
    const N = {}; model.nodes.forEach((n) => (N[n.id] = n));
    const geo = {}; sd.members.forEach((mm) => { const [x1, y1] = P(N[mm.i].x, N[mm.i].y), [x2, y2] = P(N[mm.j].x, N[mm.j].y); const L = Math.hypot(x2 - x1, y2 - y1); geo[mm.i + mm.j] = { mm, x1, y1, x2, y2, L, ux: (x2 - x1) / L, uy: (y2 - y1) / L, rx: -(y2 - y1) / L, ry: (x2 - x1) / L }; });
    const memOf = (k) => geo[k] || geo[k[1] + k[0]];
    function endPoint(mk, node, off) { const gm = memOf(mk); const atI = gm.mm.i === node; const [x, y] = atI ? [gm.x1, gm.y1] : [gm.x2, gm.y2]; const dx = atI ? gm.ux : -gm.ux, dy = atI ? gm.uy : -gm.uy; return [x + dx * off, y + dy * off, gm]; }
    let lastDefl = false;
    function draw(fr, g) {
      const base = el('g', {}, g), ov = el('g', {}, g);
      Object.values(geo).forEach((gm) => { const p = el('path', { d: `M${gm.x1},${gm.y1} L${gm.x2},${gm.y2}`, class: 'st-member' + ((fr.hl || []).includes(gm.mm.i + gm.mm.j) ? ' st-hlm' : '') }, base); });
      // loads
      Object.values(geo).forEach((gm) => gm.mm.loads.forEach((ld) => {
        const gg = el('g', { class: 'load' + ((fr.hl || []).includes('load:' + gm.mm.i + gm.mm.j) ? ' st-hl' : '') }, base);
        if (ld.type === 'UDL') { const hh = 22; for (let k = 0; k <= 6; k++) { const t = k / 6, px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t; el('path', { d: `M${px - gm.rx * hh},${py - gm.ry * hh} L${px - gm.rx * 4},${py - gm.ry * 4}`, class: 'loadline thin', 'marker-end': 'url(#st-ah-load)' }, gg); } el('path', { d: `M${gm.x1 - gm.rx * hh},${gm.y1 - gm.ry * hh} L${gm.x2 - gm.rx * hh},${gm.y2 - gm.ry * hh}`, class: 'loadline' }, gg); txt(gg, (gm.x1 + gm.x2) / 2 - gm.rx * 32, (gm.y1 + gm.y2) / 2 - gm.ry * 32 + 4, `${ld.w} kN/m`, 'lbl load-t'); }
        else { const t = ld.a / gm.mm.L, px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t; el('path', { d: `M${px - gm.rx * 46},${py - gm.ry * 46} L${px - gm.rx * 4},${py - gm.ry * 4}`, class: 'loadline', 'marker-end': 'url(#st-ah-load)' }, gg); txt(gg, px - gm.rx * 56, py - gm.ry * 56 + 4, `${ld.P} kN`, 'lbl load-t'); }
      }));
      model.nodes.forEach((n) => {
        const [x, y] = P(n.x, n.y); const mems = Object.values(geo).filter((gm) => gm.mm.i === n.id || gm.mm.j === n.id);
        if (n.sup === 'fixed') { const vert = mems.length === 1 && Math.abs(mems[0].ux) < 0.5; if (vert) { el('rect', { x: x - 22, y, width: 44, height: 9, fill: 'url(#hatch)', class: 'wall' }, base); el('path', { d: `M${x - 22},${y} L${x + 22},${y}`, class: 'ink thick' }, base); } else { const right = mems[0].mm.j === n.id ? mems[0].ux > 0 : mems[0].ux < 0; el('rect', { x: right ? x : x - 9, y: y - 22, width: 9, height: 44, fill: 'url(#hatch)', class: 'wall' }, base); el('path', { d: `M${x},${y - 22} L${x},${y + 22}`, class: 'ink thick' }, base); } }
        else if (n.sup) H.support(base, x, y + 3, n.sup === 'roller' ? 'roller' : 'pin');
        else el('circle', { cx: x, cy: y, r: 4, class: 'joint' }, base);
        const away = mems.reduce((a, gm) => { const sg = gm.mm.i === n.id ? 1 : -1; return [a[0] - gm.ux * sg, a[1] - gm.uy * sg]; }, [0, 0]); const al = Math.hypot(...away) || 1;
        txt(base, x + away[0] / al * 24 - 8, y + away[1] / al * 24 + 4, n.id, 'lbl name');
      });
      // deflected
      if (fr.defl) {
        const gd = el('g', {}, ov); const shapes = Object.values(geo).map((gm) => ({ gm, sh: T.deflectedShape(gm.mm.L, (x) => T.memberMoment(gm.mm.L, gm.mm.loads, gm.mm.Mij, gm.mm.Mji, x), () => gm.mm.I || 1, 'ss', 50) }));
        let vmax = 1e-9; shapes.forEach(({ sh }) => sh.v.forEach((v) => (vmax = Math.max(vmax, Math.abs(v)))));
        const paths = shapes.map(() => el('path', { class: 'st-defl' }, gd));
        const render = (t) => shapes.forEach(({ gm, sh }, i) => paths[i].setAttribute('d', sh.xs.map((x, k) => { const u = x / gm.mm.L; const px = gm.x1 + (gm.x2 - gm.x1) * u, py = gm.y1 + (gm.y2 - gm.y1) * u; const v = sh.v[k] / vmax * 22 * t; return `${k ? 'L' : 'M'}${(px - gm.rx * v).toFixed(1)},${(py - gm.ry * v).toFixed(1)}`; }).join(' ')));
        if (lastDefl) render(1); else H.animate(1000, render); lastDefl = true;
      } else lastDefl = false;
      if (fr.bmd) {
        let Mx = 1e-9; Object.values(geo).forEach((gm) => { for (let k = 0; k <= 30; k++) Mx = Math.max(Mx, Math.abs(T.memberMoment(gm.mm.L, gm.mm.loads, gm.mm.Mij, gm.mm.Mji, gm.mm.L * k / 30))); });
        const sc2 = 60 / Mx;
        Object.values(geo).forEach((gm) => {
          const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40; const M = T.memberMoment(gm.mm.L, gm.mm.loads, gm.mm.Mij, gm.mm.Mji, gm.mm.L * t); pts.push([gm.x1 + (gm.x2 - gm.x1) * t + gm.rx * M * sc2, gm.y1 + (gm.y2 - gm.y1) * t + gm.ry * M * sc2, M]); }
          enter(el('path', { d: `M${gm.x1},${gm.y1} ` + pts.map((q) => `L${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ') + ` L${gm.x2},${gm.y2} Z`, class: 'st-bmd' }, ov));
          let km = 0; pts.forEach((q, k) => { if (k > 2 && k < 38 && Math.abs(q[2]) > Math.abs(pts[km][2])) km = k; });
          if (km && Math.abs(pts[km][2]) > 0.05) label(ov, pts[km][0] + gm.rx * 14 * Math.sign(pts[km][2]), pts[km][1] + gm.ry * 14 * Math.sign(pts[km][2]) + 4, f(Math.abs(pts[km][2])), 'st-lab val');
        });
      }
      (fr.ends || []).forEach((e) => { // end-moment arcs: {m:'AB', node:'A', val, label}
        const [x, y, gm] = endPoint(e.m, e.node, 30); const cx = x - gm.rx * 0, cy = y;
        arc(ov, cx, cy, 15, e.val >= 0, 'mom', e.label, [x - gm.rx * 34 + (Math.abs(gm.ux) > 0.5 ? 0 : (gm.uy > 0 ? 0 : 0)), y - gm.ry * 34 + (Math.abs(gm.ux) > 0.5 ? -6 : 4) - (e.row || 0) * 16]);
      });
      (fr.rot || []).forEach((r) => { const [x, y] = P(N[r.node].x, N[r.node].y); arc(ov, x, y, 26, r.cw !== false, 'rot', r.label, [x + 36, y - 30]); });
      (fr.lock || []).forEach((nd) => { const [x, y] = P(N[nd].x, N[nd].y); padlock(ov, x + 18, y - 26, false); });
      (fr.unlock || []).forEach((nd) => { const [x, y] = P(N[nd].x, N[nd].y); padlock(ov, x + 18, y - 26, true); });
      (fr.flows || []).forEach((fl) => { const gm = memOf(fl.m); const atI = gm.mm.i === fl.from; const [ax, ay] = atI ? [gm.x1, gm.y1] : [gm.x2, gm.y2]; const [bx, by2] = atI ? [gm.x2, gm.y2] : [gm.x1, gm.y1]; const sd2 = atI ? 1 : -1; const mx = (ax + bx) / 2 - gm.rx * 40 * sd2, my = (ay + by2) / 2 - gm.ry * 40 * sd2; const p = el('path', { d: `M${ax + (bx - ax) * 0.12 - gm.rx * 14 * sd2},${ay + (by2 - ay) * 0.12 - gm.ry * 14 * sd2} Q${mx},${my} ${ax + (bx - ax) * 0.88 - gm.rx * 14 * sd2},${ay + (by2 - ay) * 0.88 - gm.ry * 14 * sd2}`, class: 'st-flow', pathLength: 1, 'marker-end': 'url(#st-ah-acc)' }, ov); enter(p, 'draw'); tagBox(ov, mx, my - 4, fl.label, 'acc'); });
      (fr.shares || []).forEach((sh) => { const [x, y, gm] = endPoint(sh.m, sh.node, Math.min(70, memOf(sh.m).L * 0.4)); tagBox(ov, x + gm.rx * 18, y + gm.ry * 18 + 4, sh.label, sh.cls || 'c1'); });
      if (fr.tag) tagBox(ov, 130, 26, fr.tag, 'acc');
    }
    function box(fr) {
      if (!fr.focus) { const pts = model.nodes.map((n) => P(n.x, n.y)); const xs2 = pts.map((q) => q[0]), ys2 = pts.map((q) => q[1]); return { x: Math.min(...xs2) - 95, y: Math.min(...ys2) - 95, w: Math.max(...xs2) - Math.min(...xs2) + 190, h: Math.max(...ys2) - Math.min(...ys2) + 150 }; }
      const pts = fr.focus.map((id) => P(N[id].x, N[id].y)); const xs2 = pts.map((p) => p[0]), ys2 = pts.map((p) => p[1]);
      return { x: Math.min(...xs2) - 120, y: Math.min(...ys2) - 120, w: Math.max(...xs2) - Math.min(...xs2) + 240, h: Math.max(...ys2) - Math.min(...ys2) + 240 };
    }
    return { draw, box };
  }

  /* =====================================================================
     ARCH STAGE
     ===================================================================== */
  function archStage(svg, sc) {
    const { L, h, r, loads } = sc; const base = 250;
    const s = Math.min((W - 260) / L, 150 / h); const ox = (W - L * s) / 2;
    const X = (x) => ox + x * s, Y = (y) => base - y * s;
    function draw(fr, g) {
      const b = el('g', {}, g), ov = el('g', {}, g);
      const pts = []; for (let k = 0; k <= 120; k++) { const x = L * k / 120; pts.push([x, r.g.y(x)]); }
      el('path', { d: pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' '), class: 'st-member arch' + (fr.hlArch ? ' st-hlm' : '') }, b);
      el('path', { d: `M${X(0)},${base} L${X(L)},${base}`, class: 'st-guide' }, b);
      [[0, 'A'], [L / 2, 'C'], [L, 'B']].forEach(([x, nm]) => { const c = el('circle', { cx: X(x), cy: Y(r.g.y(x)), r: 5, class: 'hinge' + (fr.crown && nm === 'C' ? ' st-hl' : '') }, b); txt(b, X(x) + (x === L / 2 ? 0 : x ? 16 : -16), Y(r.g.y(x)) + (x === L / 2 ? -12 : 22), nm, 'lbl name'); });
      H.support(b, X(0), base + 5, 'pin'); H.support(b, X(L), base + 5, 'pin');
      loads.forEach((ld, i) => {
        const gg = el('g', { class: (fr.hl || []).includes('load' + i) ? 'st-hl' : '' }, b);
        if (ld.type === 'P') H.pointLoad(gg, X(ld.x), Y(r.g.y(ld.x)) - 4, `${ld.P} kN`, 48);
        else { const top = Y(h) - 56; el('rect', { x: X(ld.x1), y: top, width: (ld.x2 - ld.x1) * s, height: 12, class: 'udlfill' }, gg); for (let k = 0; k <= 8; k++) { const xx = X(ld.x1 + (ld.x2 - ld.x1) * k / 8); el('path', { d: `M${xx},${top} L${xx},${top + 22}`, class: 'loadline thin', 'marker-end': 'url(#st-ah-load)' }, gg); } txt(gg, X((ld.x1 + ld.x2) / 2), top - 6, `${ld.w} kN/m`, 'lbl load-t'); }
      });
      if (fr.react) { line(ov, X(0), base + 86, X(0), base + 34, 'st-force', 'st-ah-force'); tagBox(ov, X(0), base + 104, fr.react[0], 'force'); line(ov, X(L), base + 86, X(L), base + 34, 'st-force', 'st-ah-force'); tagBox(ov, X(L), base + 104, fr.react[1], 'force'); }
      if (fr.H) { line(ov, X(0) - 80, base + 10, X(0) - 14, base + 10, 'st-force', 'st-ah-force'); tagBox(ov, X(0) - 60, base - 8, fr.H, 'force'); line(ov, X(L) + 80, base + 10, X(L) + 14, base + 10, 'st-force', 'st-ah-force'); tagBox(ov, X(L) + 60, base - 8, fr.H, 'force'); }
      if (fr.crown) tagBox(ov, X(L / 2), Y(h) - 30, fr.crown, 'acc');
      if (fr.rise) dim(ov, X(L / 2) + 26, base, X(L / 2) + 26, Y(h), fr.rise, 'c1', 30);
      (fr.loadDims || []).forEach((d0, i) => dim(ov, X(0), base + 40 + i * 22, X(d0.x), base + 40 + i * 22, d0.label, 'c' + (i + 1)));
      if (fr.section) {
        const x = fr.section.x, y = r.g.y(x), th = r.g.theta(x); const px = X(x), py = Y(y);
        const tx = Math.cos(th), ty = -Math.sin(th);
        line(ov, px - ty * 20, py + tx * 20, px + ty * 20, py - tx * 20, 'st-cut');
        if (fr.section.y) dim(ov, px, base, px, py, fr.section.y, 'c1', -34);
        if (fr.section.theta) { line(ov, px - tx * 60, py - ty * 60, px + tx * 60, py + ty * 60, 'st-tan'); line(ov, px, py, px + 70, py, 'st-guide2'); label(ov, px + 78, py - 8, fr.section.theta, 'st-lab acc', 'start'); }
        if (fr.section.NS) { line(ov, px + tx * 70, py + ty * 70, px + tx * 8, py + ty * 8, 'st-force', 'st-ah-force'); tagBox(ov, px + tx * 92, py + ty * 92, fr.section.NS[0], 'force'); line(ov, px - ty * 60, py + tx * 60, px - ty * 8, py + tx * 8, 'st-force mom', 'st-ah-mom'); tagBox(ov, px - ty * 80, py + tx * 80, fr.section.NS[1], 'c2'); }
      }
      if (fr.vectri) { // vector triangle H, V, R at A
        const sc2 = 70 / Math.max(r.H, r.VA);
        const bx = 40, byy = base + 120; const Hx = bx + r.H * sc2, Vy = byy - r.VA * sc2;
        line(ov, bx, byy, Hx, byy, 'st-force', 'st-ah-force'); tagBox(ov, (bx + Hx) / 2, byy + 18, 'H', 'force');
        line(ov, Hx, byy, Hx, Vy, 'st-force', 'st-ah-force'); tagBox(ov, Hx + 22, (byy + Vy) / 2, 'V', 'force');
        line(ov, bx, byy, Hx, Vy, 'st-tan'); tagBox(ov, (bx + Hx) / 2 - 20, (byy + Vy) / 2 - 10, fr.vectri, 'acc');
      }
      if (fr.beamM) {
        const lo = el('g', {}, ov); let mx = 1e-9; const bm = pts.map(([x]) => { const v = T.beamMoment(L, loads, x); mx = Math.max(mx, Math.abs(v)); return v; });
        const s2 = 90 / mx; const b0 = 425;
        enter(el('path', { d: pts.map(([x], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${(b0 - bm[k] * s2).toFixed(1)}`).join(' '), class: 'st-guide2 thick' }, lo));
        enter(el('path', { d: pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${(b0 - r.H * y * s2).toFixed(1)}`).join(' '), class: 'st-hy' }, lo));
        enter(el('path', { d: 'M' + pts.map(([x], k) => `${X(x).toFixed(1)},${(b0 - bm[k] * s2).toFixed(1)}`).join(' L') + ' L' + pts.slice().reverse().map(([x, y]) => `${X(x).toFixed(1)},${(b0 - r.H * y * s2).toFixed(1)}`).join(' L') + ' Z', class: 'st-area c1' }, lo));
        tagBox(lo, X(L) + 70, b0 - 60, 'beam M', 'c0'); tagBox(lo, X(L) + 70, b0 - 34, 'H × y', 'force');
        if (fr.beamM.x !== undefined) { const x = fr.beamM.x, k = Math.round(x / L * 120); line(lo, X(x), b0 - bm[k] * s2, X(x), b0 - r.H * pts[k][1] * s2, 'st-tan'); tagBox(lo, X(x) + 50, b0 - (bm[k] + r.H * pts[k][1]) / 2 * s2, fr.beamM.label, 'c1'); }
      }
      if (fr.tag) tagBox(ov, 130, 26, fr.tag, 'acc');
    }
    function box(fr) {
      if (fr.section && fr.focus) { const x = fr.section.x; return { x: X(x) - 190, y: Y(r.g.y(x)) - 130, w: 380, h: 250 }; }
      if (fr.focus) { const [a, b2] = fr.focus; return { x: X(a) - 120, y: 40, w: (b2 - a) * s + 240, h: 330 }; }
      return { x: X(0) - 115, y: Y(h) - 85, w: L * s + 230, h: (fr.beamM ? 440 : base + 125) - (Y(h) - 85) };
    }
    return { draw, box };
  }

  /* =====================================================================
     CABLE STAGES
     ===================================================================== */
  function cableStage(svg, sc) {
    const { L, r } = sc; const m = 90, s = (W - 2 * m) / L; const maxY = Math.max(...r.pts.map((p) => p.y)); const vs = Math.min(130 / maxY, s * 8);
    const X = (x) => m + x * s, Y = (y) => 90 + y * vs;
    function draw(fr, g) {
      const b = el('g', {}, g), ov = el('g', {}, g);
      el('path', { d: `M${X(0)},${Y(0)} L${X(L)},${Y(0)}`, class: 'st-guide' }, b);
      el('path', { d: r.pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' '), class: 'st-cable' }, b);
      r.pts.forEach((p, k) => {
        if (k === 0 || k === r.pts.length - 1) { el('circle', { cx: X(p.x), cy: Y(0), r: 6, class: 'hinge' }, b); txt(b, X(p.x) + (k ? 18 : -18), Y(0) - 8, p.name, 'lbl name'); return; }
        const gg = el('g', { class: 'load' + ((fr.hl || []).includes(p.name) ? ' st-hl' : '') }, b); el('path', { d: `M${X(p.x)},${Y(p.y) + 4} L${X(p.x)},${Y(p.y) + 46}`, class: 'loadline', 'marker-end': 'url(#st-ah-load)' }, gg); txt(gg, X(p.x), Y(p.y) + 62, `${sc.loads[k - 1].P} kN`, 'lbl load-t');
        txt(b, X(p.x) + 12, Y(p.y) - 6, p.name, 'lbl name', 'start');
      });
      if (fr.react) { line(ov, X(0), Y(0) - 12, X(0), Y(0) - 80, 'st-force', 'st-ah-force'); tagBox(ov, X(0), Y(0) - 92, fr.react[0], 'force'); line(ov, X(L), Y(0) - 12, X(L), Y(0) - 80, 'st-force', 'st-ah-force'); tagBox(ov, X(L), Y(0) - 92, fr.react[1], 'force'); }
      if (fr.H) { line(ov, X(0) + 10, Y(0), X(0) - 70, Y(0), 'st-force', 'st-ah-force'); tagBox(ov, X(0) - 50, Y(0) + 20, fr.H, 'force'); line(ov, X(L) - 10, Y(0), X(L) + 70, Y(0), 'st-force', 'st-ah-force'); tagBox(ov, X(L) + 50, Y(0) + 20, fr.H, 'force'); }
      (fr.dips || []).forEach((d0, i) => { const p = r.pts.find((q) => q.name === d0.name); dim(ov, X(p.x) - 14, Y(0), X(p.x) - 14, Y(p.y), d0.label, d0.known ? 'c2' : 'c1', -40); });
      (fr.segs || []).forEach((k) => { const a = r.pts[k], b2 = r.pts[k + 1]; const sg = r.segs[k];
        enter(el('path', { d: `M${X(a.x)},${Y(a.y)} L${X(b2.x)},${Y(a.y)} L${X(b2.x)},${Y(b2.y)} Z`, class: 'st-area c1' }, ov));
        line(ov, X(a.x), Y(a.y), X(b2.x), Y(b2.y), 'st-cable hl');
        tagBox(ov, (X(a.x) + X(b2.x)) / 2, Y(a.y) + (b2.y > a.y ? -10 : 18), `dx ${f(sg.dx)}`, 'c0');
        tagBox(ov, X(b2.x) + 38, (Y(a.y) + Y(b2.y)) / 2, `dy ${f(Math.abs(sg.dy), 3)}`, 'c0');
        tagBox(ov, (X(a.x) + X(b2.x)) / 2 - 10, (Y(a.y) + Y(b2.y)) / 2 + 26, fr.segLabel ? fr.segLabel(sg) : `T = ${f(sg.T)}`, 'acc'); });
      if (fr.beamBM) { // same shape
        const lo = el('g', {}, ov); const b0 = 300; const s2 = 110 / Math.max(...r.pts.map((p) => p.M || 0));
        enter(el('path', { d: r.pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${b0 + (p.M || 0) * s2}`).join(' '), class: 'st-bmdline' }, lo));
        tagBox(lo, X(L) - 30, b0 - 12, 'simple beam BM: same shape!', 'c1');
      }
      if (fr.tag) tagBox(ov, 140, 26, fr.tag, 'acc');
    }
    function box(fr) { if (fr.focus) { const [a, b2] = fr.focus; const ys = r.pts.filter((q) => q.x >= a - 1e-9 && q.x <= b2 + 1e-9).map((q) => Y(q.y)); return { x: X(a) - 110, y: Math.min(...ys) - 60, w: (b2 - a) * s + 220, h: Math.max(...ys) - Math.min(...ys) + 150 }; } const bot = fr.beamBM ? 430 : Y(maxY) + 80; return { x: X(0) - 100, y: fr.react ? Y(0) - 110 : Y(0) - 40, w: L * s + 200, h: bot - (fr.react ? Y(0) - 110 : Y(0) - 40) }; }
    return { draw, box };
  }
  function cableUDLStage(svg, sc) {
    const { L, d, r, beta } = sc; const span = L * 1.5; const s = (W - 40) / span; const ox = 20 + L * 0.25 * s; const top = 110; const vs = Math.min(150 / d, 6 * s);
    const X = (x) => ox + x * s, Y = (y) => top + y * vs; const pierH = 150; const bt = Math.tan(beta * Math.PI / 180);
    function draw(fr, g) {
      const b = el('g', {}, g), ov = el('g', {}, g);
      const pts = []; for (let k = 0; k <= 80; k++) { const x = L * k / 80; pts.push([x, 4 * d * x * (L - x) / (L * L)]); }
      el('path', { d: pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' '), class: 'st-cable' }, b);
      for (let k = 0; k <= 12; k++) { const x = L * k / 12, y = 4 * d * x * (L - x) / (L * L); el('path', { d: `M${X(x)},${Y(y) + 4} L${X(x)},${Y(y) + 26}`, class: 'loadline thin', 'marker-end': 'url(#st-ah-load)' }, b); }
      txt(b, X(L / 2), Y(d) + 42, `${sc.w} kN/m`, 'lbl load-t');
      [[0, -1], [L, 1]].forEach(([x, dir]) => { el('rect', { x: X(x) - 7, y: Y(0), width: 14, height: pierH, class: 'pier' }, b); el('circle', { cx: X(x), cy: Y(0), r: 7, class: 'hinge' + (fr.pier && x === L ? ' st-hl' : '') }, b); el('path', { d: `M${X(x)},${Y(0)} L${X(x) + dir * pierH / bt},${Y(0) + pierH}`, class: 'st-cable' + (fr.pier && x === L ? ' hl' : '') }, b); });
      el('path', { d: `M0,${Y(0) + pierH + 6} L${W},${Y(0) + pierH + 6}`, class: 'ink' }, b);
      if (fr.dip) dim(ov, X(L / 2) + 20, Y(0), X(L / 2) + 20, Y(d), fr.dip, 'c1', 30);
      if (fr.cut) { const x = fr.cut.x, y = 4 * d * x * (L - x) / (L * L); dim(ov, X(x) - 14, Y(0), X(x) - 14, Y(y), fr.cut.label, 'c2', -34); dim(ov, X(0), Y(0) - 26, X(x), Y(0) - 26, 'x', 'c0'); }
      if (fr.H) { line(ov, X(0) + 12, Y(0), X(0) + 90, Y(0) + 0, 'st-force', 'st-ah-force'); tagBox(ov, X(0) + 70, Y(0) - 12, fr.H, 'force'); }
      if (fr.vectri) { const a = r.theta; const L0 = 120; const ax = X(0), ay = Y(0); const hx = ax + L0, vy = ay + L0 * Math.tan(a);
        line(ov, ax, ay, hx, ay, 'st-force', 'st-ah-force'); tagBox(ov, (ax + hx) / 2, ay - 12, 'H', 'force'); line(ov, hx, ay, hx, vy, 'st-force', 'st-ah-force'); tagBox(ov, hx + 22, (ay + vy) / 2, 'V', 'force'); line(ov, ax, ay, hx, vy, 'st-tan'); tagBox(ov, (ax + hx) / 2 - 24, (ay + vy) / 2 + 18, fr.vectri, 'acc'); }
      if (fr.pier) { const px = X(L), py = Y(0); const a = r.theta, bb = beta * Math.PI / 180; const Lr = 90;
        line(ov, px, py, px - Lr * Math.cos(a), py + Lr * Math.sin(a), 'st-force', 'st-ah-force'); tagBox(ov, px - Lr * Math.cos(a) - 20, py + Lr * Math.sin(a) - 10, 'T₁', 'force');
        line(ov, px, py, px + Lr * Math.cos(bb), py + Lr * Math.sin(bb), 'st-force', 'st-ah-force'); tagBox(ov, px + Lr * Math.cos(bb) + 20, py + Lr * Math.sin(bb) - 10, fr.pier === 'pulley' ? 'T₂ = T₁' : 'T₂', 'force');
        if (fr.pier === 'pulley') { line(ov, px, py + pierH * 0.5, px + 60, py + pierH * 0.5, 'st-force mom', 'st-ah-mom'); tagBox(ov, px + 80, py + pierH * 0.5 - 14, 'net push → bends pier', 'c2'); }
        else { el('circle', { cx: px - 6, cy: py + 10, r: 4, class: 'hinge' }, ov); el('circle', { cx: px + 6, cy: py + 10, r: 4, class: 'hinge' }, ov); tagBox(ov, px + 90, py + pierH * 0.5 - 14, 'rollers: no sideways force', 'c1'); }
        line(ov, px, py + pierH + 40, px, py + pierH + 6, 'st-force', 'st-ah-force'); tagBox(ov, px, py + pierH + 56, fr.pierV || 'V', 'force'); }
      if (fr.tag) tagBox(ov, 140, 26, fr.tag, 'acc');
    }
    function box(fr) { if (fr.pier) return { x: X(L) - 170, y: Y(0) - 70, w: 340, h: pierH + 150 }; return { x: 0, y: 0, w: W, h: HT }; }
    return { draw, box };
  }
  function jointStage(svg, sc) {
    const cx = 330, cy = 220; const ang = [180, 90, 0, 270, 45];
    function draw(fr, g) {
      const b = el('g', {}, g), ov = el('g', {}, g);
      sc.mem.forEach((m0, k) => { const a = ang[k] * Math.PI / 180, len = 120; const x = cx + Math.cos(a) * len, y = cy - Math.sin(a) * len;
        el('path', { d: `M${cx},${cy} L${x},${y}`, class: 'st-member' }, b);
        if (m0.far === 'fixed') el('rect', { x: x - 10, y: y - 10, width: 20, height: 20, fill: 'url(#hatch)', class: 'wall' }, b); else el('circle', { cx: x, cy: y, r: 7, class: 'hinge' }, b);
        txt(b, x + Math.cos(a) * 24, y - Math.sin(a) * 24 + 4, m0.name.slice(1), 'lbl name'); });
      el('circle', { cx, cy, r: 8, class: 'joint big' }, b); txt(b, cx + 16, cy + 24, 'O', 'lbl name');
      const tot = sc.mem.reduce((s, m0) => s + m0.k, 0);
      if (fr.k || fr.df) {
        const bx = 520, w = 220;
        txt(ov, bx, 60, fr.df ? 'Share of the moment (DF)' : 'Stiffness k', 'lbl st-axl', 'start');
        sc.mem.forEach((m0, i) => { const y = 80 + i * 44; const frac = fr.df ? m0.DF : m0.k / Math.max(...sc.mem.map((q) => q.k));
          txt(ov, bx, y + 14, m0.name, 'lbl name', 'start');
          const r = el('rect', { x: bx + 40, y, width: w * frac, height: 20, rx: 4, class: 'st-bar ' + (m0.far === 'fixed' ? 'c0' : 'c1') }, ov); enter(r);
          label(ov, bx + 46 + w * frac, y + 15, fr.df ? f(m0.DF, 3) : (m0.far === 'fixed' ? '4EI/L' : '3EI/L'), 'st-lab val', 'start'); });
        if (fr.df) { // pie
          let a0 = -Math.PI / 2; const pr = 60, pcx = cx, pcy = cy;
          sc.mem.forEach((m0, i) => { const a1 = a0 + m0.DF * 2 * Math.PI; const large = a1 - a0 > Math.PI ? 1 : 0; enter(el('path', { d: `M${pcx},${pcy} L${pcx + pr * Math.cos(a0)},${pcy + pr * Math.sin(a0)} A${pr},${pr} 0 ${large} 1 ${pcx + pr * Math.cos(a1)},${pcy + pr * Math.sin(a1)} Z`, class: 'st-pie c' + (i % 4) }, ov)); a0 = a1; });
        }
      }
      if (fr.tag) tagBox(ov, 140, 26, fr.tag, 'acc');
    }
    return { draw, box: () => ({ x: 0, y: 0, w: W, h: HT }) };
  }
  /* section (EI) demo: two rectangles, depth effect */
  function sectionStage(svg) {
    function draw(fr, g) {
      const ov = el('g', {}, g); const b = fr.b || 1, d = fr.d || 1, sc = 60;
      const draws = [[200, 1], [520, d]];
      draws.forEach(([cx, dd], i) => { const w = b * sc, hh = dd * sc * 1.2; const r = el('rect', { x: cx - w / 2, y: 300 - hh, width: w, height: hh, class: 'st-sec c' + i }, ov); enter(r);
        dim(ov, cx - w / 2 - 16, 300, cx - w / 2 - 16, 300 - hh, `d${i ? ' × ' + d : ''}`, 'c' + i, -26); dim(ov, cx - w / 2, 320, cx + w / 2, 320, 'b', 'c0', 16);
        const I = Math.pow(dd, 3); const bw = 26 * I; enter(el('rect', { x: cx - 50, y: 380, width: Math.min(300, bw), height: 16, rx: 4, class: 'st-bar c' + i }, ov)); label(ov, cx - 50 + Math.min(300, bw) + 6, 393, `I ∝ d³ → ${I}×`, 'st-lab val', 'start'); });
      if (fr.tag) tagBox(ov, 140, 26, fr.tag, 'acc');
    }
    return { draw, box: () => ({ x: 0, y: 0, w: W, h: HT }) };
  }

  /* =====================================================================
     public
     ===================================================================== */
  function create(container, scene) {
    const svg = H.svgRoot(container, W, HT, 'Animated step diagram'); addDefs(svg); svg.classList.add('stage');
    const aspect = () => { const r = svg.getBoundingClientRect(); return r.width > 20 && r.height > 20 ? r.width / r.height : W / HT; };
    const kinds = { beam: beamStage, frame: frameStage, arch: archStage, cable: cableStage, cableUDL: cableUDLStage, joint: jointStage, section: sectionStage };
    let impl = kinds[scene.kind](svg, scene);
    const g = el('g', {}, svg);
    return {
      svg,
      show(fr) {
        fr = fr || {}; delay = 0;
        fs = svg.getBoundingClientRect().width < 560 ? 1.65 : 1; svg.classList.toggle('big', fs > 1);
        if (fr.scene) impl = kinds[fr.scene.kind](svg, fr.scene);
        g.innerHTML = ''; impl.draw(fr, g);
        tweenView(svg, fitBox(impl.box(fr), aspect()));
      },
    };
  }
  window.Stage = { create };
})();
