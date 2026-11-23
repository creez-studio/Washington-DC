/* =====================================================================
   SVG drawings + animations (beams, frames, arches, cables, gauges)
   Colours come from CSS classes so both themes work.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f = (x, d = 2) => T.fmt(x, d);
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const txt = (parent, x, y, s, cls, anchor) => { const t = el('text', { x, y, class: cls || 'lbl', 'text-anchor': anchor || 'middle' }, parent); t.textContent = s; return t; };
  const svgRoot = (container, w, h, label) => {
    container.innerHTML = '';
    const s = el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'viz', role: 'img', 'aria-label': label || 'Structure diagram' }, container);
    const defs = el('defs', {}, s);
    const mk = (id, cls) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m); };
    mk('ah-load', 'ah-load'); mk('ah-react', 'ah-react'); mk('ah-ink', 'ah-ink'); mk('ah-ten', 'ah-ten');
    const pat = el('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hatchline' }, pat);
    return s;
  };
  function animate(dur, fn, done) {
    if (reduced()) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      fn(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }
  function wobble(dur, fn) { // damped oscillation around 1
    if (reduced()) { fn(1); return; }
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / dur;
      const v = t >= 1 ? 1 : 1 - Math.exp(-5 * t) * Math.cos(14 * t);
      fn(v); if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- supports ---------- */
  function support(g, x, y, type, right) {
    if (type === 'fixed') {
      const dir = right ? 1 : -1;
      el('rect', { x: right ? x : x - 12, y: y - 30, width: 12, height: 60, fill: 'url(#hatch)', class: 'wall' }, g);
      el('line', { x1: x, y1: y - 30, x2: x, y2: y + 30, class: 'ink thick' }, g);
      return;
    }
    el('path', { d: `M${x},${y} l-11,18 h22 z`, class: 'sup' }, g);
    if (type === 'roller') { el('circle', { cx: x - 6, cy: y + 22, r: 4, class: 'sup' }, g); el('circle', { cx: x + 6, cy: y + 22, r: 4, class: 'sup' }, g); el('line', { x1: x - 16, y1: y + 27, x2: x + 16, y2: y + 27, class: 'ink' }, g); }
    else el('line', { x1: x - 16, y1: y + 19, x2: x + 16, y2: y + 19, class: 'ink' }, g);
  }
  function pointLoad(g, x, y, label, len) {
    len = len || 56;
    const gg = el('g', { class: 'load' }, g);
    el('line', { x1: x, y1: y - len, x2: x, y2: y - 2, class: 'loadline', 'marker-end': 'url(#ah-load)' }, gg);
    txt(gg, x, y - len - 6, label, 'lbl load-t');
    return gg;
  }
  function udl(g, x1, x2, y, label, h) {
    h = h || 26;
    const gg = el('g', { class: 'load' }, g);
    el('rect', { x: x1, y: y - h, width: x2 - x1, height: h - 4, class: 'udlfill' }, gg);
    el('line', { x1, y1: y - h, x2, y2: y - h, class: 'loadline' }, gg);
    const n = Math.max(3, Math.round((x2 - x1) / 22));
    for (let k = 0; k <= n; k++) { const xx = x1 + (x2 - x1) * k / n; el('line', { x1: xx, y1: y - h, x2: xx, y2: y - 2, class: 'loadline thin', 'marker-end': 'url(#ah-load)' }, gg); }
    txt(gg, (x1 + x2) / 2, y - h - 6, label, 'lbl load-t');
    return gg;
  }

  /* =====================================================================
     BEAM
     ===================================================================== */
  function sampleFn(L, fn, loads, n) {
    const xs = new Set();
    for (let k = 0; k <= n; k++) xs.add(L * k / n);
    (loads || []).forEach((ld) => { const x = ld.type === 'P' ? ld.x : null; if (x !== null) { xs.add(Math.max(0, x - 1e-6)); xs.add(Math.min(L, x + 1e-6)); } });
    return [...xs].sort((a, b) => a - b).map((x) => [x, fn(x)]);
  }
  function beam(container, sc, opts) {
    opts = opts || {};
    const W = 760, H = 250, m = 60, y0 = 118, th = 14;
    const sx = (W - 2 * m) / sc.L, X = (x) => m + x * sx;
    const svg = svgRoot(container, W, H, 'Beam with loads and deflected shape');
    const gStress = el('g', {}, svg), gBeam = el('g', {}, svg), gDef = el('g', {}, svg), gGhost = el('g', {}, svg), gCrack = el('g', {}, svg), gLoads = el('g', {}, svg), gSup = el('g', {}, svg), gTxt = el('g', {}, svg);
    // M samples for stress colour
    const N = 80; const mv = []; let mmax = 1e-9;
    for (let k = 0; k < N; k++) { const x = sc.L * (k + 0.5) / N; const v = sc.bm(x); mv.push(v); mmax = Math.max(mmax, Math.abs(v)); }
    const segs = mv.map((v, k) => {
      const x = X(sc.L * k / N), w = sx * sc.L / N + 0.6;
      const top = el('rect', { x, y: y0 - th / 2, width: w, height: th / 2, class: 'st-off' }, gStress);
      const bot = el('rect', { x, y: y0, width: w, height: th / 2, class: 'st-off' }, gStress);
      return { top, bot, v };
    });
    const outline = el('rect', { x: X(0), y: y0 - th / 2, width: sx * sc.L, height: th, class: 'beam' }, gBeam);
    if (sc.ei) sc.ei.forEach((s) => { txt(gTxt, X((s.x1 + s.x2) / 2), y0 + 4, s.label, 'lbl ei'); if (s.x1 > 0) el('line', { x1: X(s.x1), y1: y0 - th, x2: X(s.x1), y2: y0 + th, class: 'ink dash' }, gTxt); });
    sc.supports.forEach((s) => support(gSup, X(s.x), s.type === 'fixed' ? y0 : y0 + th / 2, s.type, s.right || (s.type === 'fixed' && s.x > 0)));
    sc.loads.forEach((ld) => { if (ld.type === 'UDL') udl(gLoads, X(ld.x1), X(ld.x2), y0 - th / 2, ld.label); });
    sc.loads.forEach((ld) => { if (ld.type === 'P') pointLoad(gLoads, X(ld.x), y0 - th / 2, ld.label, sc.loads.some((q) => q.type === 'UDL') ? 74 : 56); });
    sc.names.forEach(([x, n]) => txt(gTxt, X(x), y0 + 52, n, 'lbl name'));
    // dimension line
    const dims = [...new Set(sc.names.map((q) => q[0]).concat([0, sc.L]))].sort((a, b) => a - b);
    const yd = H - 22;
    for (let k = 0; k < dims.length - 1; k++) {
      const a = dims[k], b = dims[k + 1]; if (b - a < 1e-9) continue;
      el('line', { x1: X(a) + 2, y1: yd, x2: X(b) - 2, y2: yd, class: 'dim', 'marker-start': 'url(#ah-ink)', 'marker-end': 'url(#ah-ink)' }, gTxt);
      txt(gTxt, (X(a) + X(b)) / 2, yd - 5, `${+(b - a).toFixed(2)} m`, 'lbl dimt');
    }
    dims.forEach((d) => el('line', { x1: X(d), y1: yd - 8, x2: X(d), y2: yd + 6, class: 'ink thin' }, gTxt));
    // deflected shape
    const sh = T.deflectedShape(sc.L, sc.bm, sc.EI, sc.bc === 'cantilever-left' ? 'cantilever-left' : 'ss', 160);
    const vmax = Math.max(...sh.v.map(Math.abs)) || 1;
    const pathFor = (scale) => sh.xs.map((x, k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${(y0 - sh.v[k] / vmax * scale).toFixed(1)}`).join(' ');
    const defPath = el('path', { d: pathFor(0), class: 'defl' }, gDef);
    const ghostPath = el('path', { d: pathFor(0), class: 'ghost', opacity: 0 }, gGhost);
    const ghostLbl = txt(gGhost, 0, 0, '', 'lbl ghost-t', 'start');
    let iMax = 0; sh.v.forEach((v, k) => { if (Math.abs(v) > Math.abs(sh.v[iMax])) iMax = k; });
    const DEF = 34;
    const api = {
      svg,
      play() { animate(1100, (t) => defPath.setAttribute('d', pathFor(DEF * t))); },
      show(scale) { defPath.setAttribute('d', pathFor(scale === undefined ? DEF : scale)); },
      stress(on) {
        segs.forEach((s) => {
          if (!on) { s.top.setAttribute('class', 'st-off'); s.bot.setAttribute('class', 'st-off'); s.top.style.opacity = s.bot.style.opacity = ''; return; }
          const a = Math.abs(s.v) / mmax; const sag = s.v >= 0;
          s.top.setAttribute('class', sag ? 'st-comp' : 'st-ten'); s.bot.setAttribute('class', sag ? 'st-ten' : 'st-comp');
          s.top.style.opacity = s.bot.style.opacity = (0.15 + 0.85 * a).toFixed(2);
        });
      },
      ghost(ratio, label) {
        const sc2 = Math.max(-130, Math.min(130, DEF * ratio));
        ghostPath.setAttribute('opacity', 1);
        wobble(1400, (v) => ghostPath.setAttribute('d', pathFor(sc2 * v)));
        const gx = X(sh.xs[iMax]); const nearRight = gx > W - 160;
        ghostLbl.setAttribute('text-anchor', nearRight ? 'end' : 'start');
        ghostLbl.setAttribute('x', nearRight ? gx - 8 : gx + 8); ghostLbl.setAttribute('y', y0 - Math.sign(sh.v[iMax]) * sc2 + (sh.v[iMax] < 0 ? 18 : -8));
        ghostLbl.textContent = label || 'your answer';
      },
      clearGhost() { ghostPath.setAttribute('opacity', 0); ghostLbl.textContent = ''; gCrack.innerHTML = ''; },
      crack(xAt, severity) {
        gCrack.innerHTML = '';
        const x = xAt !== undefined ? xAt : sh.xs[iMax];
        const sag = sc.bm(Math.min(sc.L - 1e-6, Math.max(1e-6, x))) >= 0;
        const face = sag ? y0 + th / 2 : y0 - th / 2, dir = sag ? -1 : 1;
        const n = Math.min(5, 1 + Math.round(severity * 3));
        for (let k = 0; k < n; k++) {
          const cx = Math.max(X(0) + 4, Math.min(X(sc.L) - 4, X(x) + (k - (n - 1) / 2) * 11));
          const len = th * Math.min(1.6, 0.45 + 0.4 * severity);
          const p = el('path', { d: `M${cx},${face} l${2 * dir},${dir * len * 0.3} l${-3 * dir},${dir * len * 0.35} l${2 * dir},${dir * len * 0.35}`, class: 'crack' }, gCrack);
          const Lp = 40; p.style.strokeDasharray = Lp; p.style.strokeDashoffset = Lp;
          animate(700 + 150 * k, (t) => (p.style.strokeDashoffset = Lp * (1 - t)));
        }
      },
    };
    return api;
  }

  /* ---------- SFD / BMD plots ---------- */
  function diagram(container, L, fn, loads, title, unit, opts) {
    opts = opts || {};
    const W = 760, H = 170, m = 60, mid = 86;
    const sx = (W - 2 * m) / L, X = (x) => m + x * sx;
    const svg = svgRoot(container, W, H, title);
    const pts = sampleFn(L, fn, loads, 300);
    let vmax = 1e-9; pts.forEach(([, v]) => (vmax = Math.max(vmax, Math.abs(v))));
    const sy = 62 / vmax, Y = (v) => mid - v * sy;
    txt(svg, 8, 16, title, 'lbl dtitle', 'start');
    el('line', { x1: X(0), y1: mid, x2: X(L), y2: mid, class: 'axis' }, svg);
    const d = `M${X(0)},${mid} ` + pts.map(([x, v]) => `L${X(x).toFixed(1)},${Y(v).toFixed(1)}`).join(' ') + ` L${X(L)},${mid} Z`;
    // split fill by sign using clip
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    const defs = svg.querySelector('defs');
    const cp = el('clipPath', { id: id + 'p' }, defs); el('rect', { x: 0, y: 0, width: W, height: mid }, cp);
    const cn = el('clipPath', { id: id + 'n' }, defs); el('rect', { x: 0, y: mid, width: W, height: H }, cn);
    el('path', { d, class: 'dpos', 'clip-path': `url(#${id}p)` }, svg);
    el('path', { d, class: 'dneg', 'clip-path': `url(#${id}n)` }, svg);
    el('path', { d: pts.map(([x, v], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(v).toFixed(1)}`).join(' '), class: 'dline' }, svg);
    // labels: extremes and key points
    const keys = new Map();
    const addKey = (x, v) => { const k = x.toFixed(3) + (v >= 0 ? 'p' : 'n'); if (Math.abs(v) > vmax * 0.04 && !keys.has(k)) keys.set(k, [x, v]); };
    let iMax = 0, iMin = 0; pts.forEach(([, v], k) => { if (v > pts[iMax][1]) iMax = k; if (v < pts[iMin][1]) iMin = k; });
    addKey(...pts[iMax]); addKey(...pts[iMin]);
    (opts.keyX || []).forEach((x) => { const v = fn(Math.min(L - 1e-7, Math.max(1e-7, x))); addKey(x, v); });
    const placed = [];
    [...keys.values()].forEach(([x, v]) => {
      let ty = v >= 0 ? Y(v) - 6 : Y(v) + 14;
      const tx = Math.max(m - 20, Math.min(W - m + 20, X(x)));
      if (placed.some(([px, py]) => Math.abs(px - tx) < 46 && Math.abs(py - ty) < 12)) ty += v >= 0 ? -12 : 12;
      placed.push([tx, ty]);
      el('circle', { cx: X(x), cy: Y(v), r: 2.5, class: 'dot' }, svg);
      txt(svg, tx, ty, f(v), 'lbl dval');
    });
    txt(svg, W - 8, 16, unit + (opts.note ? ' · ' + opts.note : ''), 'lbl dunit', 'end');
    return svg;
  }

  /* =====================================================================
     FRAME (non-sway) with BMD / deflected shape
     ===================================================================== */
  function frame(container, sc, mode) {
    const { model, sd } = sc;
    const xs = model.nodes.map((n) => n.x), ys = model.nodes.map((n) => n.y);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const W = 760, H = 380, m = 80;
    const s = Math.min((W - 2 * m) / Math.max(1, maxx - minx), (H - 2 * m) / Math.max(1, maxy - miny));
    const ox = (W - (maxx - minx) * s) / 2, oy = H - (H - (maxy - miny) * s) / 2;
    const P = (x, y) => [ox + (x - minx) * s, oy - (y - miny) * s];
    const svg = svgRoot(container, W, H, 'Frame');
    const gD = el('g', {}, svg), gM = el('g', {}, svg), gL = el('g', {}, svg), gS = el('g', {}, svg), gT = el('g', {}, svg);
    let Mmax = 1e-9;
    sd.members.forEach((mm) => { for (let k = 0; k <= 40; k++) Mmax = Math.max(Mmax, Math.abs(T.memberMoment(mm.L, mm.loads, mm.Mij, mm.Mji, mm.L * k / 40))); });
    const nodeById = {}; model.nodes.forEach((n) => (nodeById[n.id] = n));
    const geom = sd.members.map((mm) => {
      const a = nodeById[mm.i], b = nodeById[mm.j];
      const [x1, y1] = P(a.x, a.y), [x2, y2] = P(b.x, b.y);
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      // screen coords: y down. Right side of i→j in world = (uyW, -uxW); screen right normal:
      const rx = -uy, ry = ux; // (screen) right-hand normal
      return { mm, x1, y1, x2, y2, L, ux, uy, rx, ry };
    });
    geom.forEach((gm) => el('line', { x1: gm.x1, y1: gm.y1, x2: gm.x2, y2: gm.y2, class: 'member' }, gS));
    // loads
    geom.forEach((gm) => {
      gm.mm.loads.forEach((ld) => {
        if (ld.type === 'UDL') {
          const n = 7, hh = 26;
          const gg = el('g', { class: 'load' }, gL);
          const ax = gm.x1 - gm.rx * hh, ay = gm.y1 - gm.ry * hh, bx = gm.x2 - gm.rx * hh, by = gm.y2 - gm.ry * hh;
          el('path', { d: `M${gm.x1 - gm.rx * 3},${gm.y1 - gm.ry * 3} L${ax},${ay} L${bx},${by} L${gm.x2 - gm.rx * 3},${gm.y2 - gm.ry * 3} Z`, class: 'udlfill' }, gg);
          el('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'loadline' }, gg);
          for (let k = 0; k <= n; k++) { const t = k / n; const px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t; el('line', { x1: px - gm.rx * hh, y1: py - gm.ry * hh, x2: px - gm.rx * 3, y2: py - gm.ry * 3, class: 'loadline thin', 'marker-end': 'url(#ah-load)' }, gg); }
          txt(gg, (ax + bx) / 2 - gm.rx * 10, (ay + by) / 2 - gm.ry * 10 - 2, `${ld.w} kN/m`, 'lbl load-t');
        } else {
          const t = ld.a / gm.mm.L; const px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t;
          const gg = el('g', { class: 'load' }, gL);
          el('line', { x1: px - gm.rx * 52, y1: py - gm.ry * 52, x2: px - gm.rx * 3, y2: py - gm.ry * 3, class: 'loadline', 'marker-end': 'url(#ah-load)' }, gg);
          txt(gg, px - gm.rx * 62, py - gm.ry * 62 + 4, `${ld.P} kN`, 'lbl load-t');
        }
      });
    });
    // supports and names
    model.nodes.forEach((n) => {
      const [x, y] = P(n.x, n.y);
      const mems = geom.filter((gm) => gm.mm.i === n.id || gm.mm.j === n.id);
      const vertical = mems.length === 1 && Math.abs(mems[0].ux) < 0.5;
      if (n.sup === 'fixed') {
        if (vertical) { el('rect', { x: x - 26, y: y, width: 52, height: 10, fill: 'url(#hatch)', class: 'wall' }, gS); el('line', { x1: x - 26, y1: y, x2: x + 26, y2: y, class: 'ink thick' }, gS); }
        else { const right = mems.length && (mems[0].mm.j === n.id ? mems[0].ux > 0 : mems[0].ux < 0); el('rect', { x: right ? x : x - 10, y: y - 26, width: 10, height: 52, fill: 'url(#hatch)', class: 'wall' }, gS); el('line', { x1: x, y1: y - 26, x2: x, y2: y + 26, class: 'ink thick' }, gS); }
      } else if (n.sup === 'roller' || n.sup === 'pinned') support(gS, x, y, n.sup === 'roller' ? 'roller' : 'pin');
      else el('circle', { cx: x, cy: y, r: 4, class: 'joint' }, gS);
      const away = mems.reduce((acc, gm) => { const sgn = gm.mm.i === n.id ? 1 : -1; return [acc[0] - gm.ux * sgn, acc[1] - gm.uy * sgn]; }, [0, 0]);
      const al = Math.hypot(away[0], away[1]) || 1;
      txt(gT, x + away[0] / al * 22 - 10, y + away[1] / al * 22 + 4, n.id, 'lbl name');
    });
    // BMD (tension side) and deflected shape
    const drawBMD = () => {
      gM.innerHTML = '';
      const scale = 70 / Mmax;
      geom.forEach((gm) => {
        const mm = gm.mm; const n = 40; const pts = [];
        for (let k = 0; k <= n; k++) { const t = k / n; const M = T.memberMoment(mm.L, mm.loads, mm.Mij, mm.Mji, mm.L * t); const px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t; pts.push([px + gm.rx * M * scale, py + gm.ry * M * scale, M]); }
        const d = `M${gm.x1},${gm.y1} ` + pts.map((q) => `L${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ') + ` L${gm.x2},${gm.y2} Z`;
        el('path', { d, class: 'fbmd' }, gM);
        [[0, mm.Mij], [n, mm.Mji]].forEach(([k, M]) => { if (Math.abs(M) > 0.005) txt(gM, pts[k][0] + gm.rx * (M >= 0 ? 12 : -12) * Math.sign(M || 1), pts[k][1] + gm.ry * 12 * Math.sign(M || 1) + 4, f(Math.abs(M)), 'lbl dval'); });
        let kx = 0; pts.forEach((q, k) => { if (Math.abs(q[2]) > Math.abs(pts[kx][2]) && k > 0 && k < n) kx = k; });
        if (kx > 0 && kx < n && Math.abs(pts[kx][2]) > 0.01) txt(gM, pts[kx][0] + gm.rx * 12 * Math.sign(pts[kx][2]), pts[kx][1] + gm.ry * 12 * Math.sign(pts[kx][2]) + 4, f(Math.abs(pts[kx][2])), 'lbl dval');
      });
      txt(gM, 10, 18, 'BMD drawn on the tension side (kN·m)', 'lbl dtitle', 'start');
    };
    const drawDefl = (amp) => {
      gD.innerHTML = '';
      let vmax = 1e-9; const shapes = geom.map((gm) => { const mm = gm.mm; const sh = T.deflectedShape(mm.L, (x) => T.memberMoment(mm.L, mm.loads, mm.Mij, mm.Mji, x), () => mm.I || 1, 'ss', 60); sh.v.forEach((v) => (vmax = Math.max(vmax, Math.abs(v)))); return sh; });
      geom.forEach((gm, gi) => {
        const sh = shapes[gi];
        // v positive = left of i→j (world). screen left normal = -r
        const d = sh.xs.map((x, k) => { const t = x / gm.mm.L; const px = gm.x1 + (gm.x2 - gm.x1) * t, py = gm.y1 + (gm.y2 - gm.y1) * t; const v = sh.v[k] / vmax * amp; return `${k ? 'L' : 'M'}${(px - gm.rx * v).toFixed(1)},${(py - gm.ry * v).toFixed(1)}`; }).join(' ');
        el('path', { d, class: 'defl' }, gD);
      });
    };
    const api = {
      svg,
      mode(md) { gM.style.display = md === 'bmd' ? '' : 'none'; gD.style.display = md === 'defl' ? '' : 'none'; if (md === 'bmd') drawBMD(); if (md === 'defl') animate(900, (t) => drawDefl(26 * t)); },
      play() { api.mode('defl'); },
    };
    api.mode(mode || 'defl');
    return api;
  }

  /* =====================================================================
     ARCH
     ===================================================================== */
  function arch(container, sc, opts) {
    opts = opts || {};
    const { L, h, r, loads } = sc;
    const W = 760, H = 340, m = 130;
    const s = Math.min((W - 2 * m) / L, 170 / h * 1);
    const ox = (W - L * s) / 2, base = 250;
    const X = (x) => ox + x * s, Y = (y) => base - y * s;
    const svg = svgRoot(container, W, H, 'Three hinged arch');
    const gB = el('g', {}, svg), gA = el('g', {}, svg), gL = el('g', {}, svg), gR = el('g', {}, svg), gT = el('g', {}, svg);
    const n = 120; const pts = []; for (let k = 0; k <= n; k++) { const x = L * k / n; pts.push([x, r.g.y(x)]); }
    const archPath = el('path', { d: pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' '), class: 'member arch' }, gA);
    el('line', { x1: X(0), y1: base, x2: X(L), y2: base, class: 'ink dash' }, gA);
    [[0, 'A'], [L / 2, 'C'], [L, 'B']].forEach(([x, nm]) => { el('circle', { cx: X(x), cy: Y(r.g.y(x)), r: 5, class: 'hinge' }, gA); txt(gT, X(x) + (x === L / 2 ? 0 : x ? 16 : -16), Y(r.g.y(x)) + (x === L / 2 ? -12 : 20), nm, 'lbl name'); });
    support(gA, X(0), base + 5, 'pin'); support(gA, X(L), base + 5, 'pin');
    loads.forEach((ld) => {
      if (ld.type === 'P') { const y = Y(r.g.y(ld.x)); pointLoad(gL, X(ld.x), y - 4, `${ld.P} kN`, 50); }
      else {
        const gg = el('g', { class: 'load' }, gL); const top = Y(h) - 60;
        el('rect', { x: X(ld.x1), y: top, width: (ld.x2 - ld.x1) * s, height: 14, class: 'udlfill' }, gg);
        const k = 8; for (let i = 0; i <= k; i++) { const xx = X(ld.x1 + (ld.x2 - ld.x1) * i / k); el('line', { x1: xx, y1: top, x2: xx, y2: top + 24, class: 'loadline thin', 'marker-end': 'url(#ah-load)' }, gg); }
        txt(gg, X((ld.x1 + ld.x2) / 2), top - 6, `${ld.w} kN/m`, 'lbl load-t');
      }
    });
    // reactions
    const arrow = (x1, y1, x2, y2, label, lx, ly, cls) => { el('line', { x1, y1, x2, y2, class: cls || 'react', 'marker-end': 'url(#ah-react)' }, gR); txt(gR, lx, ly, label, 'lbl react-t'); };
    arrow(X(0) - 64, base + 6, X(0) - 14, base + 6, `H = ${f(r.H)}`, X(0) - 50, base - 6);
    arrow(X(L) + 64, base + 6, X(L) + 14, base + 6, `H = ${f(r.H)}`, X(L) + 50, base - 6);
    arrow(X(0), base + 58, X(0), base + 10, `V_A = ${f(r.VA)}`, X(0) + 4, base + 72);
    arrow(X(L), base + 58, X(L), base + 10, `V_B = ${f(r.VB)}`, X(L) - 4, base + 72);
    if (sc.xs !== null && sc.xs !== undefined) {
      const sct = r.at(sc.xs, 'left'); const x = X(sc.xs), y = Y(sct.y);
      const tx = Math.cos(sct.theta), ty = -Math.sin(sct.theta);
      el('line', { x1: x - ty * 18, y1: y + tx * 18, x2: x + ty * 18, y2: y - tx * 18, class: 'cut' }, gT);
      txt(gT, x, y + 40, `x = ${sc.xs} m`, 'lbl dimt');
    }
    // BMD comparison band (beam moment vs H·y)
    let api = { svg };
    api.showMoments = () => {
      gB.innerHTML = '';
      let mx = 1e-9; const bmv = pts.map(([x]) => { const v = T.beamMoment(L, loads, x); mx = Math.max(mx, Math.abs(v)); return v; });
      const sc2 = 120 / mx;
      el('path', { d: pts.map(([x], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${(base - bmv[k] * sc2).toFixed(1)}`).join(' '), class: 'ghost' }, gB);
      el('path', { d: pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${(base - r.H * y * sc2).toFixed(1)}`).join(' '), class: 'hyline' }, gB);
      const fill = pts.map(([x, y], k) => [X(x), base - bmv[k] * sc2, base - r.H * y * sc2]);
      el('path', { d: 'M' + fill.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L') + ' L' + fill.slice().reverse().map((q) => `${q[0].toFixed(1)},${q[2].toFixed(1)}`).join(' L') + ' Z', class: 'archM' }, gB);
      txt(gB, 10, 18, 'Dashed: simple-beam BM · Line: H·y · Shaded gap = arch BM (small!)', 'lbl dtitle', 'start');
    };
    animate(900, (t) => { gR.style.opacity = t; });
    return api;
  }

  /* =====================================================================
     CABLES
     ===================================================================== */
  function cable(container, sc) {
    const { L, r } = sc;
    const W = 760, H = 300, m = 70;
    const s = (W - 2 * m) / L; const maxY = Math.max(...r.pts.map((p) => p.y));
    const vs = Math.min(140 / maxY, s * 8); // vertical exaggeration
    const X = (x) => m + x * s, Y = (y) => 70 + y * vs;
    const svg = svgRoot(container, W, H, 'Cable with point loads');
    el('line', { x1: X(0), y1: Y(0), x2: X(L), y2: Y(0), class: 'ink dash' }, svg);
    const poly = el('path', { d: r.pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${Y(0)}`).join(' '), class: 'member cable' }, svg);
    animate(1000, (t) => poly.setAttribute('d', r.pts.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${Y(p.y * t)}`).join(' ')));
    r.pts.forEach((p, k) => {
      if (k === 0 || k === r.pts.length - 1) { el('circle', { cx: X(p.x), cy: Y(0), r: 6, class: 'hinge' }, svg); txt(svg, X(p.x) + (k ? 16 : -16), Y(0) - 8, p.name, 'lbl name'); return; }
      const g = el('g', { class: 'load' }, svg);
      el('line', { x1: X(p.x), y1: Y(p.y) + 4, x2: X(p.x), y2: Y(p.y) + 50, class: 'loadline', 'marker-end': 'url(#ah-load)' }, g);
      txt(g, X(p.x), Y(p.y) + 66, `${sc.loads[k - 1].P} kN`, 'lbl load-t');
      txt(svg, X(p.x) + 12, Y(p.y) - 6, p.name, 'lbl name', 'start');
      el('line', { x1: X(p.x), y1: Y(0), x2: X(p.x), y2: Y(p.y), class: 'ink thin dash' }, svg);
      txt(svg, X(p.x) - 6, (Y(0) + Y(p.y)) / 2 + 4, `${f(p.y, 3)} m`, 'lbl dimt', 'end');
    });
    r.segs.forEach((sg, k) => {
      const a = r.pts[k], b = r.pts[k + 1];
      txt(svg, (X(a.x) + X(b.x)) / 2, (Y(a.y) + Y(b.y)) / 2 - 8, `T = ${f(sg.T)}`, 'lbl ten-t');
    });
    txt(svg, 10, H - 10, `H = ${f(r.H)} kN · vertical scale exaggerated for clarity`, 'lbl dtitle', 'start');
    return { svg };
  }
  function cableUDL(container, sc) {
    const { L, d, r, beta, hp } = sc;
    const W = 760, H = 330;
    const span = L * 1.45; const s = (W - 60) / span; const ox = 30 + L * 0.2 * s; const top = 90;
    const vs = Math.min(150 / (d + hp * 0.0001), 8 * s);
    const X = (x) => ox + x * s, Y = (y) => top + y * vs;
    const svg = svgRoot(container, W, H, 'Suspension cable with anchor');
    const n = 80; const pts = []; for (let k = 0; k <= n; k++) { const x = L * k / n; pts.push([x, 4 * d * x * (L - x) / (L * L)]); }
    const path = el('path', { d: '', class: 'member cable' }, svg);
    animate(1000, (t) => path.setAttribute('d', pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y * t).toFixed(1)}`).join(' ')));
    const g = el('g', { class: 'load' }, svg);
    for (let k = 0; k <= 12; k++) { const x = L * k / 12; const y = 4 * d * x * (L - x) / (L * L); el('line', { x1: X(x), y1: Y(y) + 4, x2: X(x), y2: Y(y) + 30, class: 'loadline thin', 'marker-end': 'url(#ah-load)' }, g); }
    txt(g, X(L / 2), Y(d) + 46, `${sc.w} kN/m`, 'lbl load-t');
    // piers + anchors
    const pierH = 130; const bt = Math.tan(beta * Math.PI / 180);
    [[0, -1], [L, 1]].forEach(([x, dir]) => {
      el('rect', { x: X(x) - 7, y: Y(0), width: 14, height: pierH, class: 'pier' }, svg);
      el('circle', { cx: X(x), cy: Y(0), r: 7, class: 'hinge' }, svg);
      const ax = X(x) + dir * pierH / bt, ay = Y(0) + pierH;
      el('line', { x1: X(x), y1: Y(0), x2: ax, y2: ay, class: 'member cable' }, svg);
      el('rect', { x: ax - 12, y: ay - 4, width: 24, height: 12, class: 'pier' }, svg);
    });
    el('line', { x1: 10, y1: Y(0) + pierH + 8, x2: W - 10, y2: Y(0) + pierH + 8, class: 'ink' }, svg);
    txt(svg, X(L) + 14, Y(0) + pierH / 2, `${hp} m`, 'lbl dimt', 'start');
    txt(svg, X(L) + pierH / bt * 0.55 + 10, Y(0) + pierH * 0.55, `β = ${beta}°`, 'lbl dimt', 'start');
    txt(svg, X(L / 2), Y(0) - 12, `span ${L} m · dip ${d} m`, 'lbl dimt');
    txt(svg, 10, 20, `H = ${f(r.H)} kN · Tmax = ${f(r.Tmax)} kN`, 'lbl dtitle', 'start');
    return { svg };
  }
  function joint(container, sc) {
    const W = 760, H = 300, cx = W / 2, cy = H / 2;
    const svg = svgRoot(container, W, H, 'Joint O with members');
    const ang = [180, 90, 0, 270, 45];
    sc.mem.forEach((m, k) => {
      const a = ang[k] * Math.PI / 180, len = 110;
      const x = cx + Math.cos(a) * len, y = cy - Math.sin(a) * len;
      el('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'member' }, svg);
      if (m.far === 'fixed') { el('rect', { x: x - 10, y: y - 10, width: 20, height: 20, fill: 'url(#hatch)', class: 'wall' }, svg); }
      else el('circle', { cx: x, cy: y, r: 7, class: 'hinge' }, svg);
      txt(svg, x + Math.cos(a) * 26, y - Math.sin(a) * 26 + 4, m.name.slice(1), 'lbl name');
      txt(svg, cx + Math.cos(a) * 55 + (Math.abs(Math.cos(a)) < 0.2 ? 30 : 0), cy - Math.sin(a) * 55 - (Math.abs(Math.sin(a)) < 0.2 ? 10 : 0), `DF ${f(m.DF, 3)}`, 'lbl dval');
    });
    el('circle', { cx, cy, r: 8, class: 'joint big' }, svg); txt(svg, cx + 16, cy + 22, 'O', 'lbl name');
    return { svg };
  }

  /* =====================================================================
     Stress–strain gauge: u = demand / capacity
     ===================================================================== */
  function gauge(container, u, caption) {
    const W = 360, H = 200, m = 36;
    const svg = svgRoot(container, W, H, 'Stress strain indicator');
    const ex = (e) => m + e / 32 * (W - 2 * m), sy = (s) => H - 34 - s / 1.5 * (H - 70);
    const curve = [[0, 0], [1, 1], [10, 1], [14, 1.18], [20, 1.36], [25, 1.4], [29, 1.33], [30, 1.25]];
    el('rect', { x: ex(0), y: sy(1.5), width: ex(1) - ex(0), height: sy(0) - sy(1.5), class: 'zone-el' }, svg);
    el('rect', { x: ex(1), y: sy(1.5), width: ex(25) - ex(1), height: sy(0) - sy(1.5), class: 'zone-pl' }, svg);
    el('rect', { x: ex(25), y: sy(1.5), width: ex(32) - ex(25), height: sy(0) - sy(1.5), class: 'zone-fr' }, svg);
    el('line', { x1: ex(0), y1: sy(0), x2: ex(32), y2: sy(0), class: 'axis' }, svg);
    el('line', { x1: ex(0), y1: sy(0), x2: ex(0), y2: sy(1.5), class: 'axis' }, svg);
    el('path', { d: curve.map(([e, s], k) => `${k ? 'L' : 'M'}${ex(e)},${sy(s)}`).join(' '), class: 'sscurve' }, svg);
    txt(svg, ex(0.5), H - 18, 'elastic', 'lbl tiny'); txt(svg, ex(13), H - 18, 'yielding (permanent bend)', 'lbl tiny'); txt(svg, ex(28.5), H - 18, 'rupture', 'lbl tiny');
    txt(svg, ex(31), sy(0) + 14, 'strain ε', 'lbl tiny', 'end'); txt(svg, ex(0) + 4, sy(1.5) + 10, 'stress σ/fy', 'lbl tiny', 'start');
    el('line', { x1: ex(0), y1: sy(1 / 1.5), x2: ex(32), y2: sy(1 / 1.5), class: 'ink dash thin' }, svg);
    txt(svg, ex(32), sy(1 / 1.5) - 4, 'design stress (FOS 1.5)', 'lbl tiny', 'end');
    const target = u / 1.5;
    const pos = (s) => {
      if (s <= 1) return [s, s];
      if (s <= 1.4) { // along the plastic + hardening part
        const segs = [[1, 1, 10, 1], [10, 1, 14, 1.18], [14, 1.18, 20, 1.36], [20, 1.36, 25, 1.4]];
        for (const [e1, s1, e2, s2] of segs) if (s <= s2 + 1e-9) { if (s2 === s1) return [e1 + (e2 - e1) * 0.6, s1]; const t = (s - s1) / (s2 - s1); return [e1 + (e2 - e1) * t, s]; }
      }
      return [30, 1.25];
    };
    const dot = el('circle', { cx: ex(0), cy: sy(0), r: 7, class: 'ssdot' }, svg);
    const lab = txt(svg, ex(0), sy(0), '', 'lbl ssval', 'start');
    animate(1200, (t) => {
      const s = Math.min(target, 1.6) * t; const [e, ss] = pos(s);
      dot.setAttribute('cx', ex(e)); dot.setAttribute('cy', sy(ss));
      dot.setAttribute('class', 'ssdot ' + (s <= 1 ? 'ok' : s <= 1.4 ? 'warn' : 'bad'));
      lab.setAttribute('x', Math.min(ex(e) + 10, W - 120)); lab.setAttribute('y', sy(ss) - 10); lab.textContent = `${Math.round(Math.min(target, 9.99) * 100)}% fy`;
    });
    if (caption) txt(svg, 6, 14, caption, 'lbl tiny', 'start');
    return { svg };
  }

  window.Viz = { beam, diagram, frame, arch, cable, cableUDL, joint, gauge, animate, sampleFn };
})();
