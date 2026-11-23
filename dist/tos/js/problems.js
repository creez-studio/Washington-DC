/* =====================================================================
   Problem generators for every repeating KTU AET201 question family.
   Each make(params) returns a complete problem: KTU-style statement,
   drawing (scene), answer key and step-by-step working.
   Every number is computed by engine.js (verified by tools/tos-verify.js).
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  const f = (x, d = 2) => T.fmt(x, d);
  const trim = (x) => { const s = (+x).toFixed(3); return s.replace(/\.?0+$/, ''); };
  const c = (v, u) => `<b class="c">${typeof v === 'number' ? f(v) : v}${u ? ' ' + u : ''}</b>`;
  const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
  const rnd = {
    int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    step: (a, b, s) => +(a + s * Math.floor(Math.random() * (Math.round((b - a) / s) + 1))).toFixed(3),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  };
  /* statement builder: v(key) prints a parameter; changed keys are highlighted */
  const V = (p, changed) => (key, unit, val) => {
    const x = val !== undefined ? val : p[key];
    const cls = changed && changed.has(key) ? 'chg' : 'g';
    return `<b class="${cls}">${trim(x)}${unit ? ' ' + unit : ''}</b>`;
  };
  const g = (x, unit) => `<b class="g">${trim(x)}${unit ? ' ' + unit : ''}</b>`;
  const ans = (id, label, unit, value, kind, extra) => Object.assign({ id, label, unit, value, kind }, extra || {});
  const ordinal = (s) => s;

  const P = {}; // registry

  /* ================================================================
     MODULE 1
     ================================================================ */
  P['m1-cant-udl-point'] = {
    module: 1, title: 'Cantilever: UDL + point load at free end', method: 'Moment area method', family: 'M1-cantilever',
    presets: [{ label: 'KTU Nov 2024 · Q6', params: { L: 3.3, w: 11, P: 22 } }],
    random: () => ({ L: rnd.step(2, 5, 0.5), w: rnd.int(5, 30), P: rnd.int(10, 50) }),
    loadKeys: ['w', 'P'],
    statement: (p, ch) => { const v = V(p, ch); return `Using moment-area method, find the maximum slope and deflection of a cantilever beam of span ${v('L', 'm')} having uniform flexural rigidity EI subjected to a UDL of intensity ${v('w', 'kN/m')} over the entire span and a concentrated load of ${v('P', 'kN')} at the free end.`; },
    make(p) {
      const { L, w, P: Pl } = p;
      const r = T.cantileverTip(L, [{ type: 'P', P: Pl, a: L }, { type: 'UDL', w, a1: 0, a2: L }]);
      const A1 = Pl * L * L / 2, A2 = w * L ** 3 / 6, x1 = 2 * L / 3, x2 = 3 * L / 4;
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }], [{ type: 'UDL', x1: 0, x2: L, w, label: `${trim(w)} kN/m` }, { type: 'P', x: L, P: Pl, label: `${trim(Pl)} kN` }], { names: [[0, 'A'], [L, 'B']], bc: 'cantilever-left', bm: (x) => -(Pl * (L - x) + w * (L - x) ** 2 / 2), sf: (x) => Pl + w * (L - x) }),
        answers: [
          ans('th', 'Maximum slope θ<sub>B</sub> (at free end)', '/EI  (kN·m²)', r.slope, 'slope', { linear: true }),
          ans('dl', 'Maximum deflection δ<sub>B</sub> (at free end)', '/EI  (kN·m³)', r.defl, 'defl', { linear: true }),
        ],
        steps: [
          { t: 'Where is the maximum?', kid: 'Hold a ruler flat on a table edge and press its tip. The tip moves the most and tilts the most, while the end held on the table does not move at all.', w: `Fixed end A: slope = 0, deflection = 0. So the <b>maximum slope and deflection occur at the free end B</b>. Mohr's theorems measured from A give them directly.` },
          { t: 'Draw the bending moment diagram (hogging)', kid: 'Every load tries to bend the beam. The moment is biggest at the wall because the loads have the longest lever arm there.', w: `Due to point load: triangle, max at A = P·L = ${g(Pl)} × ${g(L)} = ${c(Pl * L, 'kN·m')}<br>Due to UDL: parabola (spandrel), max at A = wL²/2 = ${g(w)} × ${g(L)}² / 2 = ${c(w * L * L / 2, 'kN·m')}` },
          { t: 'Areas of the M/EI diagram', kid: 'Mohr I says: the change in slope equals the AREA under the M/EI diagram.', w: `Triangle: A<sub>1</sub> = ½ × L × PL = ½ × ${g(L)} × ${c(Pl * L)} = ${c(A1)} /EI<br>Spandrel (parabola): A<sub>2</sub> = ⅓ × L × wL²/2 = ⅓ × ${g(L)} × ${c(w * L * L / 2)} = ${c(A2)} /EI` },
          { t: "Mohr's first theorem → slope", kid: 'Add the two areas together and you have the slope.', w: `θ<sub>B</sub> = (A<sub>1</sub> + A<sub>2</sub>)/EI = ${c(A1)} + ${c(A2)} = <b class="ans">${f(r.slope)} /EI</b> (radians, clockwise)<br>Formula check: PL²/2EI + wL³/6EI` },
          { t: 'Centroids measured from the free end B', kid: 'Mohr II needs the "balance point" of each area, measured from the point whose deflection we want (B).', w: `Triangle (apex at B): x̄<sub>1</sub> = 2L/3 = ${c(x1, 'm')}<br>Spandrel (apex at B): x̄<sub>2</sub> = 3L/4 = ${c(x2, 'm')}` },
          { t: "Mohr's second theorem → deflection", kid: 'Deflection = (area × its distance), added up. It is like counting how much each part of the bend pushes the tip down.', w: `δ<sub>B</sub> = (A<sub>1</sub>x̄<sub>1</sub> + A<sub>2</sub>x̄<sub>2</sub>)/EI = ${c(A1)}×${c(x1)} + ${c(A2)}×${c(x2)} = ${c(A1 * x1)} + ${c(A2 * x2)}<br>δ<sub>B</sub> = <b class="ans">${f(r.defl)} /EI</b> (downward)<br>Formula check: PL³/3EI + wL⁴/8EI` },
        ],
      };
    },
  };

  P['m1-cant-two-point'] = {
    module: 1, title: 'Cantilever: two point loads', method: 'Conjugate beam method', family: 'M1-cantilever',
    presets: [
      { label: 'KTU Nov 2024 · Q7', params: { L: 3, P1: 12, P2: 23, c: 1.2 } },
      { label: 'KTU Dec 2022 · Q6 (W at end & centre, take W = 10 kN, L = 2 m → span 2L = 4 m)', params: { L: 4, P1: 10, P2: 10, c: 2 } },
    ],
    random: () => { const L = rnd.step(2, 6, 0.5); return { L, P1: rnd.int(5, 40), P2: rnd.int(10, 50), c: rnd.step(0.5, L - 0.5, 0.1) }; },
    loadKeys: ['P1', 'P2'],
    statement: (p, ch) => { const v = V(p, ch); return `Determine the slope and deflection at the free end of a cantilever beam of span ${v('L', 'm')} subjected to two point loads ${v('P1', 'kN')} acting at the free end and ${v('P2', 'kN')} acting at a distance ${v('c', 'm')} from the free end, using Conjugate beam method.`; },
    make(p) {
      const { L, P1, P2, c: cc } = p; const a = L - cc;
      const r = T.cantileverTip(L, [{ type: 'P', P: P1, a: L }, { type: 'P', P: P2, a }]);
      const A1 = P1 * L * L / 2, A2 = P2 * a * a / 2, x1 = 2 * L / 3, x2 = cc + 2 * a / 3;
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }], [{ type: 'P', x: a, P: P2, label: `${trim(P2)} kN` }, { type: 'P', x: L, P: P1, label: `${trim(P1)} kN` }], { names: [[0, 'A'], [a, 'C'], [L, 'B']], bc: 'cantilever-left', bm: (x) => -(P1 * (L - x) + (x < a ? P2 * (a - x) : 0)), sf: (x) => P1 + (x < a ? P2 : 0) }),
        answers: [
          ans('th', 'Slope at free end θ<sub>B</sub>', '/EI  (kN·m²)', r.slope, 'slope', { linear: true }),
          ans('dl', 'Deflection at free end δ<sub>B</sub>', '/EI  (kN·m³)', r.defl, 'defl', { linear: true }),
        ],
        steps: [
          { t: 'Make the conjugate beam', kid: 'The conjugate beam is an imaginary twin beam. Its supports are swapped: where the real beam is held, the twin is free, and where the real beam is free, the twin is held.', w: `Real: A fixed, B free → Conjugate: <b>A free, B fixed</b>.<br>Load the conjugate beam with the M/EI diagram of the real beam.<br>Slope at B (real) = <b>shear</b> at B (conjugate); deflection at B (real) = <b>bending moment</b> at B (conjugate).` },
          { t: 'Bending moments of the real beam', kid: 'Each load makes a triangle-shaped moment diagram that is tallest at the wall.', w: `Load at free end: max at A = P₁L = ${g(P1)} × ${g(L)} = ${c(P1 * L, 'kN·m')}<br>Load at C (distance from A: a = L − c = ${g(L)} − ${g(cc)} = ${c(a, 'm')}): max at A = P₂a = ${g(P2)} × ${c(a)} = ${c(P2 * a, 'kN·m')}` },
          { t: 'Loads on the conjugate beam (areas)', kid: 'Each triangle becomes a "load" on the twin beam. Its size is the triangle\'s area.', w: `A₁ = ½ × L × P₁L = ½ × ${g(L)} × ${c(P1 * L)} = ${c(A1)} /EI<br>A₂ = ½ × a × P₂a = ½ × ${c(a)} × ${c(P2 * a)} = ${c(A2)} /EI` },
          { t: 'Shear at B of conjugate beam → slope', kid: 'Total load on the twin = shear at its fixed end.', w: `θ<sub>B</sub> = A₁ + A₂ = ${c(A1)} + ${c(A2)} = <b class="ans">${f(r.slope)} /EI</b>` },
          { t: 'Distances of the loads from B', kid: 'A triangle\'s balance point is one third of the way from its tall side.', w: `x̄₁ = 2L/3 = ${c(x1, 'm')}<br>x̄₂ = c + 2a/3 = ${g(cc)} + 2×${c(a)}/3 = ${c(x2, 'm')}` },
          { t: 'Moment at B of conjugate beam → deflection', kid: 'Moment = load × distance. Add them up.', w: `δ<sub>B</sub> = A₁x̄₁ + A₂x̄₂ = ${c(A1)}×${c(x1)} + ${c(A2)}×${c(x2)} = <b class="ans">${f(r.defl)} /EI</b> (downward)` },
        ],
      };
    },
  };

  P['m1-cant-stepped'] = {
    module: 1, title: 'Cantilever with 2EI and EI portions', method: 'Moment area method', family: 'M1-cantilever',
    presets: [{ label: 'KTU Jun 2024 · Q6', params: { L: 3, L1: 1, P: 100 } }],
    random: () => { const L = rnd.step(2, 6, 0.5); return { L, L1: rnd.step(0.5, L - 0.5, 0.5), P: rnd.int(10, 120) }; },
    loadKeys: ['P'],
    statement: (p, ch) => { const v = V(p, ch); return `Find the maximum slope and deflection of a cantilever beam of length ${v('L', 'm')} and having flexural rigidity 2EI for a length of ${v('L1', 'm')} from the fixed end and EI for the remaining length and subjected to a concentrated load of ${v('P', 'kN')} at the free end by moment area method.`; },
    make(p) {
      const { L, L1, P: Pl } = p; const L2 = L - L1;
      const r = T.cantileverTip(L, [{ type: 'P', P: Pl, a: L }], [{ x1: 0, x2: L1, k: 2 }, { x1: L1, x2: L, k: 1 }]);
      const rect = L1 * Pl * L2 / 2, xr = L - L1 / 2, tri = Pl * L1 * L1 / 4, xt = L - L1 / 3, t2 = Pl * L2 * L2 / 2, x2 = 2 * L2 / 3;
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }], [{ type: 'P', x: L, P: Pl, label: `${trim(Pl)} kN` }], { names: [[0, 'A'], [L1, 'C'], [L, 'B']], ei: [{ x1: 0, x2: L1, label: '2EI', k: 2 }, { x1: L1, x2: L, label: 'EI', k: 1 }], bc: 'cantilever-left', bm: (x) => -Pl * (L - x), sf: () => Pl, EI: (x) => (x < L1 ? 2 : 1) }),
        answers: [
          ans('th', 'Maximum slope θ<sub>B</sub>', '/EI  (kN·m²)', r.slope, 'slope', { linear: true }),
          ans('dl', 'Maximum deflection δ<sub>B</sub>', '/EI  (kN·m³)', r.defl, 'defl', { linear: true }),
        ],
        steps: [
          { t: 'Bending moment diagram', kid: 'One load at the tip gives a straight-line triangle, tallest at the wall.', w: `M at A = PL = ${g(Pl)}×${g(L)} = ${c(Pl * L)} kN·m; at C (where EI changes) = P(L − L₁) = ${g(Pl)}×${c(L2)} = ${c(Pl * L2)} kN·m; at B = 0.` },
          { t: 'Divide by the stiffness to get M/EI', kid: 'The thicker part (2EI) is twice as stiff, so it bends only half as much. That is why we divide its moment by 2.', w: `Portion AC (2EI): M/EI goes from ${c(Pl * L / 2)} to ${c(Pl * L2 / 2)} (÷EI)<br>Portion CB (EI): M/EI goes from ${c(Pl * L2)} to 0 (÷EI) — note the <b>jump</b> at C.` },
          { t: 'Split into simple shapes', kid: 'A trapezium is just a rectangle with a triangle on top.', w: `Rectangle on AC: ${g(L1)} × ${c(Pl * L2 / 2)} = ${c(rect)}, centroid from B = L − L₁/2 = ${c(xr)} m<br>Triangle on AC: ½ × ${g(L1)} × ${c(Pl * L1 / 2)} = ${c(tri)}, centroid from B = L − L₁/3 = ${c(xt)} m<br>Triangle on CB: ½ × ${c(L2)} × ${c(Pl * L2)} = ${c(t2)}, centroid from B = 2(L−L₁)/3 = ${c(x2)} m` },
          { t: 'Slope (Mohr I)', kid: 'Add all the areas.', w: `θ<sub>B</sub> = ${c(rect)} + ${c(tri)} + ${c(t2)} = <b class="ans">${f(r.slope)} /EI</b>` },
          { t: 'Deflection (Mohr II)', kid: 'Add all (area × distance from B).', w: `δ<sub>B</sub> = ${c(rect)}×${c(xr)} + ${c(tri)}×${c(xt)} + ${c(t2)}×${c(x2)} = <b class="ans">${f(r.defl)} /EI</b>` },
        ],
      };
    },
  };

  P['m1-ss'] = {
    module: 1, title: 'Simply supported beam: central load / full UDL', method: 'Conjugate beam method', family: 'M1-ss',
    presets: [{ label: 'KTU Jun 2024 · Q7', params: { L: 4, P: 50, w: 0 } }],
    random: () => { const t = rnd.pick(['P', 'w', 'both']); return { L: rnd.step(3, 8, 0.5), P: t === 'w' ? 0 : rnd.int(10, 80), w: t === 'P' ? 0 : rnd.int(5, 30) }; },
    loadKeys: ['P', 'w'],
    statement: (p, ch) => { const v = V(p, ch); const ld = p.P && p.w ? `a central concentrated load of ${v('P', 'kN')} and a UDL of ${v('w', 'kN/m')} over the entire span` : p.P ? `a central concentrated load of ${v('P', 'kN')}` : `a UDL of ${v('w', 'kN/m')} over the entire span`; return `Find the maximum slope and deflection of a simply supported beam of length ${v('L', 'm')} subjected to ${ld} by conjugate beam method. The beam is having uniform flexural rigidity EI.`; },
    make(p) {
      const { L, P: Pl, w } = p; const r = T.ssSymmetric(L, Pl, w);
      const loads = []; if (w) loads.push({ type: 'UDL', x1: 0, x2: L, w, label: `${trim(w)} kN/m` }); if (Pl) loads.push({ type: 'P', x: L / 2, P: Pl, label: `${trim(Pl)} kN` });
      const sP = Pl * L * L / 16, sW = w * L ** 3 / 24;
      const steps = [
        { t: 'Conjugate beam of a simply supported beam', kid: 'For a beam resting on two supports, the imaginary twin also rests on two supports.', w: 'Real beam: hinge + roller → Conjugate beam: <b>hinge + roller</b>. Load it with the M/EI diagram. Slope at A = reaction at A of conjugate beam; max deflection (at centre, symmetry) = BM at centre of conjugate beam.' },
      ];
      if (Pl) steps.push({ t: 'Point load part', kid: 'A centre load makes a triangle of moment; its peak is P × L / 4.', w: `Peak M = PL/4 = ${g(Pl)}×${g(L)}/4 = ${c(Pl * L / 4)}; total area = ½ × L × PL/4 = ${c(Pl * L * L / 8)}/EI<br>Reaction R'<sub>A</sub> = half = ${c(sP)}/EI<br>M' at centre = R'<sub>A</sub>·L/2 − (half area)·(L/6) = ${c(sP)}×${c(L / 2)} − ${c(sP)}×${c(L / 6)} = ${c(Pl * L ** 3 / 48)}/EI → PL³/48EI` });
      if (w) steps.push({ t: 'UDL part', kid: 'A UDL makes a parabola of moment; its peak is wL²/8.', w: `Peak M = wL²/8 = ${g(w)}×${g(L)}²/8 = ${c(w * L * L / 8)}; area = ⅔ × L × wL²/8 = ${c(w * L ** 3 / 12)}/EI<br>Reaction R'<sub>A</sub> = ${c(sW)}/EI<br>M' at centre = R'<sub>A</sub>·L/2 − (half area)·(3L/16) = ${c(sW)}×${c(L / 2)} − ${c(sW)}×${c(3 * L / 16)} = ${c(5 * w * L ** 4 / 384)}/EI → 5wL⁴/384EI` });
      steps.push({ t: 'Answers', kid: 'Add the parts if both loads act (superposition).', w: `θ<sub>A</sub> = θ<sub>max</sub> = <b class="ans">${f(r.slope)} /EI</b><br>δ<sub>max</sub> (at centre) = <b class="ans">${f(r.defl)} /EI</b>` });
      return {
        scene: beamScene(L, [{ x: 0, type: 'pin' }, { x: L, type: 'roller' }], loads, { names: [[0, 'A'], [L / 2, 'C'], [L, 'B']], bc: 'ss', bm: (x) => (Pl ? Pl * Math.min(x, L - x) / 2 : 0) + w * x * (L - x) / 2, sf: (x) => (Pl ? (x < L / 2 ? Pl / 2 : -Pl / 2) : 0) + w * (L / 2 - x) }),
        answers: [ans('th', 'Maximum slope θ<sub>A</sub> (at supports)', '/EI  (kN·m²)', r.slope, 'slope', { linear: true }), ans('dl', 'Maximum deflection δ<sub>C</sub> (at centre)', '/EI  (kN·m³)', r.defl, 'defl', { linear: true })],
        steps,
      };
    },
  };

  /* ================================================================
     MODULE 2
     ================================================================ */
  P['m2-propped-udl'] = {
    module: 2, title: 'Propped cantilever with full UDL', method: 'Consistent deformation method', family: 'M2-propped',
    presets: [{ label: 'KTU Nov 2024 · Q8', params: { L: 6, w: 27 } }, { label: 'KTU Jun 2024 · Q9', params: { L: 3, w: 50 } }],
    random: () => ({ L: rnd.step(3, 8, 0.5), w: rnd.int(10, 60) }),
    loadKeys: ['w'],
    statement: (p, ch) => { const v = V(p, ch); return `Using Consistent Deformation method, analyse a propped cantilever beam of length ${v('L', 'm')} subjected to a uniformly distributed load of ${v('w', 'kN/m')} over the entire span. The beam is having uniform flexural rigidity EI. Draw the Shear force and Bending moment diagrams.`; },
    make(p) {
      const { L, w } = p; const r = T.proppedUDL(L, w);
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'roller' }], [{ type: 'UDL', x1: 0, x2: L, w, label: `${trim(w)} kN/m` }], { names: [[0, 'A'], [L, 'B']], bc: 'ss', bm: (x) => -r.MA + r.RA * x - w * x * x / 2, sf: (x) => r.RA - w * x }),
        answers: [
          ans('RB', 'Prop reaction R<sub>B</sub>', 'kN', r.RB, 'reaction', { linear: true }),
          ans('RA', 'Reaction at fixed end R<sub>A</sub>', 'kN', r.RA, 'reaction', { linear: true }),
          ans('MA', 'Fixing moment M<sub>A</sub> (hogging)', 'kN·m', r.MA, 'moment', { linear: true, at: 0 }),
          ans('Mmax', 'Maximum sagging moment', 'kN·m', r.Mmax, 'moment', { linear: true, at: L - r.xMax }),
        ],
        steps: [
          { t: 'Degree of indeterminacy', kid: 'The beam has one support more than it needs to stand. That extra support is the "redundant" one.', w: 'Reactions: fixed end (3) + prop (1) = 4. Equations of statics = 3. <b>Ds = 1</b>. Take the prop reaction R<sub>B</sub> as the redundant.' },
          { t: 'Remove the prop → cantilever', kid: 'Take the prop away and see how far the tip would drop.', w: `δ<sub>B1</sub> = wL⁴/8EI = ${g(w)}×${g(L)}⁴/8 = ${c(r.deltaFree * w)} /EI (downward)` },
          { t: 'Push up with R<sub>B</sub> alone', kid: 'Now push the tip back up with the prop force alone.', w: `δ<sub>B2</sub> = R<sub>B</sub>L³/3EI = R<sub>B</sub> × ${g(L)}³/3 = ${c(r.deltaR)} R<sub>B</sub> /EI (upward)` },
          { t: 'Compatibility: the prop does not move', kid: 'The real tip sits on the prop, so the drop and the push-up must cancel exactly.', w: `δ<sub>B1</sub> = δ<sub>B2</sub> → ${c(r.deltaFree * w)} = ${c(r.deltaR)} R<sub>B</sub><br>R<sub>B</sub> = <b class="ans">${f(r.RB)} kN</b> (= 3wL/8)` },
          { t: 'Other reactions from statics', kid: 'Upward forces must balance the total load.', w: `R<sub>A</sub> = wL − R<sub>B</sub> = ${c(w * L)} − ${c(r.RB)} = <b class="ans">${f(r.RA)} kN</b><br>M<sub>A</sub> = wL²/2 − R<sub>B</sub>·L = ${c(w * L * L / 2)} − ${c(r.RB * L)} = <b class="ans">${f(r.MA)} kN·m</b> (hogging, = wL²/8)` },
          { t: 'Maximum sagging moment', kid: 'The biggest sag happens where the shear force becomes zero.', w: `SF = 0 at x = R<sub>B</sub>/w = ${c(r.RB)}/${g(w)} = ${c(r.xMax)} m from B<br>M<sub>max</sub> = R<sub>B</sub>²/2w = <b class="ans">${f(r.Mmax)} kN·m</b> (= 9wL²/128)<br>Point of contraflexure: x = 2R<sub>B</sub>/w = ${c(r.xPOC)} m from B` },
        ],
      };
    },
  };

  P['m2-propped-point'] = {
    module: 2, title: 'Propped cantilever with a point load', method: 'Consistent deformation method', family: 'M2-propped',
    presets: [],
    random: () => { const L = rnd.step(3, 8, 0.5); return { L, P: rnd.int(10, 100), a: rnd.step(1, L - 1, 0.5) }; },
    loadKeys: ['P'],
    statement: (p, ch) => { const v = V(p, ch); return `A propped cantilever AB of span ${v('L', 'm')} is fixed at A and propped at B. It carries a concentrated load of ${v('P', 'kN')} at a distance of ${v('a', 'm')} from the fixed end. Using consistent deformation method, find the prop reaction and draw the SFD and BMD. EI is constant.`; },
    make(p) {
      const { L, P: Pl, a } = p; const r = T.proppedPoint(L, Pl, a);
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'roller' }], [{ type: 'P', x: a, P: Pl, label: `${trim(Pl)} kN` }], { names: [[0, 'A'], [a, 'C'], [L, 'B']], bc: 'ss', bm: (x) => -r.MA + r.RA * x - (x > a ? Pl * (x - a) : 0), sf: (x) => r.RA - (x > a ? Pl : 0) }),
        answers: [
          ans('RB', 'Prop reaction R<sub>B</sub>', 'kN', r.RB, 'reaction', { linear: true }),
          ans('RA', 'Reaction R<sub>A</sub>', 'kN', r.RA, 'reaction', { linear: true }),
          ans('MA', 'Fixing moment M<sub>A</sub> (hogging)', 'kN·m', r.MA, 'moment', { linear: true, at: 0 }),
          ans('MC', 'Sagging moment under the load', 'kN·m', r.Mload, 'moment', { linear: true, at: a }),
        ],
        steps: [
          { t: 'Ds = 1, redundant = prop reaction R<sub>B</sub>', kid: 'One extra support → one extra unknown → one extra equation needed (compatibility).', w: 'Remove the prop: the beam becomes a cantilever fixed at A.' },
          { t: 'Tip deflection due to the load', kid: 'The load bends the part between A and C; the part beyond C just tilts like a stick.', w: `δ<sub>B1</sub> = Pa³/3EI + (Pa²/2EI)(L − a) = Pa²(3L − a)/6EI<br>= ${g(Pl)}×${g(a)}²×(3×${g(L)} − ${g(a)})/6 = ${c(r.deltaFree)} /EI` },
          { t: 'Tip deflection due to R<sub>B</sub>', kid: '', w: `δ<sub>B2</sub> = R<sub>B</sub>L³/3EI = ${c(r.deltaR)} R<sub>B</sub>/EI` },
          { t: 'Compatibility', kid: 'The prop stops the tip, so the two must be equal.', w: `R<sub>B</sub> = ${c(r.deltaFree)} / ${c(r.deltaR)} = <b class="ans">${f(r.RB)} kN</b>` },
          { t: 'Statics', kid: '', w: `R<sub>A</sub> = P − R<sub>B</sub> = <b class="ans">${f(r.RA)} kN</b><br>M<sub>A</sub> = P·a − R<sub>B</sub>·L = ${c(Pl * a)} − ${c(r.RB * L)} = <b class="ans">${f(r.MA)} kN·m</b> (hogging)<br>Under load: M<sub>C</sub> = R<sub>B</sub> × (L − a) = ${c(r.RB)} × ${c(r.b)} = <b class="ans">${f(r.Mload)} kN·m</b> (sagging)` },
        ],
      };
    },
  };

  P['m2-fixed'] = {
    module: 2, title: 'Fixed beam: single point load or full UDL', method: 'Consistent deformation method', family: 'M2-fixed',
    presets: [{ label: 'Syllabus case (fixed beam, single point load)', params: { L: 6, type: 'P', P: 60, a: 2 } }],
    random: () => { const L = rnd.step(4, 8, 0.5); return rnd.pick([true, false]) ? { L, type: 'P', P: rnd.int(20, 100), a: rnd.step(1, L - 1, 0.5) } : { L, type: 'UDL', w: rnd.int(5, 40) }; },
    loadKeys: ['P', 'w'],
    statement: (p, ch) => { const v = V(p, ch); return `A fixed beam AB of span ${v('L', 'm')} carries ${p.type === 'P' ? `a concentrated load of ${v('P', 'kN')} at a distance of ${v('a', 'm')} from the left end A` : `a uniformly distributed load of ${v('w', 'kN/m')} over the entire span`}. Find the fixing moments and support reactions by consistent deformation method and draw the BMD. EI is constant.`; },
    make(p) {
      const { L } = p; const isP = p.type === 'P';
      const r = isP ? T.fixedPoint(L, p.P, p.a) : T.fixedUDL(L, p.w);
      const th0 = isP ? p.P * p.a * p.a / 2 : p.w * L ** 3 / 6, d0 = isP ? p.P * p.a * p.a * (3 * L - p.a) / 6 : p.w * L ** 4 / 8;
      const loads = isP ? [{ type: 'P', x: p.a, P: p.P, label: `${trim(p.P)} kN` }] : [{ type: 'UDL', x1: 0, x2: L, w: p.w, label: `${trim(p.w)} kN/m` }];
      const bm = isP ? (x) => -r.MA + r.RA * x - (x > p.a ? p.P * (x - p.a) : 0) : (x) => -r.MA + r.RA * x - p.w * x * x / 2;
      const sf = isP ? (x) => r.RA - (x > p.a ? p.P : 0) : (x) => r.RA - p.w * x;
      const Mpos = isP ? r.Mload : r.Mmid;
      return {
        scene: beamScene(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'fixed', right: true }], loads, { names: [[0, 'A'], [L, 'B']], bc: 'ss', bm, sf }),
        answers: [
          ans('MA', 'Fixing moment M<sub>A</sub> (hogging)', 'kN·m', r.MA, 'moment', { linear: true, at: 0 }),
          ans('MB', 'Fixing moment M<sub>B</sub> (hogging)', 'kN·m', r.MB, 'moment', { linear: true, at: L }),
          ans('RA', 'Reaction R<sub>A</sub>', 'kN', r.RA, 'reaction', { linear: true }),
          ans('RB', 'Reaction R<sub>B</sub>', 'kN', r.RB, 'reaction', { linear: true }),
          ans('Mp', isP ? 'Sagging moment under the load' : 'Sagging moment at mid span', 'kN·m', Mpos, 'moment', { linear: true, at: isP ? p.a : L / 2 }),
        ],
        steps: [
          { t: 'Ds = 2 for vertical loads', kid: 'Both ends are gripped. Release end B to get a cantilever and put back the two things B was providing: a force R<sub>B</sub> and a moment M<sub>B</sub>.', w: 'Redundants: R<sub>B</sub> (upward) and M<sub>B</sub> (hogging). Conditions: at B, slope = 0 and deflection = 0.' },
          { t: 'Released cantilever under the load', kid: 'How much does the free tip tilt and drop?', w: isP ? `θ<sub>B0</sub> = Pa²/2EI = ${c(th0)}/EI ; δ<sub>B0</sub> = Pa²(3L−a)/6EI = ${c(d0)}/EI` : `θ<sub>B0</sub> = wL³/6EI = ${c(th0)}/EI ; δ<sub>B0</sub> = wL⁴/8EI = ${c(d0)}/EI` },
          { t: 'Effect of R<sub>B</sub> and M<sub>B</sub>', kid: '', w: `R<sub>B</sub>: θ = R<sub>B</sub>L²/2EI = ${c(L * L / 2)}R<sub>B</sub>, δ = R<sub>B</sub>L³/3EI = ${c(L ** 3 / 3)}R<sub>B</sub><br>M<sub>B</sub>: θ = M<sub>B</sub>L/EI = ${c(L)}M<sub>B</sub>, δ = M<sub>B</sub>L²/2EI = ${c(L * L / 2)}M<sub>B</sub> (opposite sense)` },
          { t: 'Two compatibility equations', kid: 'Two unknowns need two equations: no tilt and no drop at B.', w: `Slope: ${c(L * L / 2)}R<sub>B</sub> − ${c(L)}M<sub>B</sub> = ${c(th0)}<br>Deflection: ${c(L ** 3 / 3)}R<sub>B</sub> − ${c(L * L / 2)}M<sub>B</sub> = ${c(d0)}<br>Solving: R<sub>B</sub> = <b class="ans">${f(r.RB)} kN</b>, M<sub>B</sub> = <b class="ans">${f(r.MB)} kN·m</b>` },
          { t: 'Back to statics', kid: '', w: `R<sub>A</sub> = total load − R<sub>B</sub> = <b class="ans">${f(r.RA)} kN</b><br>M<sub>A</sub> = <b class="ans">${f(r.MA)} kN·m</b> ${isP ? '(= Pab²/L²; M<sub>B</sub> = Pa²b/L²)' : '(= wL²/12)'}` },
          { t: 'Positive moment', kid: 'Free (simply supported) moment minus the fixing-moment line.', w: isP ? `Free BM under load = Pab/L = ${c(r.Mfree)}; minus (M<sub>A</sub>·b + M<sub>B</sub>·a)/L → <b class="ans">${f(Mpos)} kN·m</b>` : `wL²/8 − wL²/12 = wL²/24 = <b class="ans">${f(Mpos)} kN·m</b>` },
        ],
      };
    },
  };

  P['m2-three-moment'] = {
    module: 2, title: 'Two span continuous beam', method: "Clapeyron's three moment theorem", family: 'M2-three-moment',
    presets: [
      { label: 'KTU Nov 2024 · Q9', params: { L1: 5, l1: { type: 'P', P: 23, a: 2 }, L2: 4.5, l2: { type: 'UDL', w: 13 }, left: 'pinned' } },
      { label: 'KTU Jun 2024 · Q8', params: { L1: 5, l1: { type: 'UDL', w: 25 }, L2: 6, l2: { type: 'P', P: 50, a: 2 }, left: 'fixed' } },
    ],
    random: () => {
      const L1 = rnd.step(3, 7, 0.5), L2 = rnd.step(3, 7, 0.5);
      const ld = (L) => rnd.pick([true, false]) ? { type: 'UDL', w: rnd.int(8, 40) } : { type: 'P', P: rnd.int(15, 80), a: rnd.step(1, L - 1, 0.5) };
      return { L1, l1: ld(L1), L2, l2: ld(L2), left: rnd.pick(['fixed', 'pinned']) };
    },
    loadKeys: [],
    statement: (p) => {
      const d = (L, ld, near) => ld.type === 'UDL' ? `subjected to a UDL of ${g(ld.w, 'kN/m')} over the entire span` : `subjected to a point load ${g(ld.P, 'kN')} at a distance ${g(ld.a, 'm')} from ${near}`;
      return `Determine the support moments of a two span continuous beam ABC using Clapeyron's theorem and draw the bending moment diagram. Span AB ${g(p.L1, 'm')} long is ${d(p.L1, p.l1, 'A')} and span BC ${g(p.L2, 'm')} long is ${d(p.L2, p.l2, 'B')}. End A is ${p.left === 'fixed' ? '<b>fixed</b>' : 'a pinned support'}, B and C are simple (roller) supports. EI is constant.`;
    },
    make(p) {
      const r = T.threeMoment2(p.L1, p.l1, p.L2, p.l2, p.left, 'pinned');
      const L = p.L1 + p.L2;
      const loads = [];
      const sixText = (L, ld, ref, val) => ld.type === 'UDL' ? `wL³/4 = ${g(ld.w)}×${g(L)}³/4 = ${c(val)}` : `Pab(L + a)/L with a measured from ${ref} = ${c(val)}`;
      [[p.l1, 0, p.L1], [p.l2, p.L1, p.L2]].forEach(([ld, x0, Ls]) => {
        if (ld.type === 'UDL') loads.push({ type: 'UDL', x1: x0, x2: x0 + Ls, w: ld.w, label: `${trim(ld.w)} kN/m` });
        else loads.push({ type: 'P', x: x0 + ld.a, P: ld.P, label: `${trim(ld.P)} kN` });
      });
      // moment function along whole beam (sagging +)
      const span = (x) => (x <= p.L1 ? 0 : 1);
      const bm = (x) => {
        if (x <= p.L1) return E1(p.L1, p.l1, x) - r.MA * (1 - x / p.L1) - r.MB * (x / p.L1);
        const s = x - p.L1; return E1(p.L2, p.l2, s) - r.MB * (1 - s / p.L2) - r.MC * (s / p.L2);
      };
      const sf = (x) => {
        if (x < p.L1) return r.RA - (p.l1.type === 'UDL' ? p.l1.w * x : (x > p.l1.a ? p.l1.P : 0));
        const s = x - p.L1; return r.RB2 - (p.l2.type === 'UDL' ? p.l2.w * s : (s > p.l2.a ? p.l2.P : 0));
      };
      const answers = [];
      if (p.left === 'fixed') answers.push(ans('MA', 'Support moment M<sub>A</sub> (hogging)', 'kN·m', r.MA, 'moment', { at: 0 }));
      answers.push(ans('MB', 'Support moment M<sub>B</sub> (hogging)', 'kN·m', r.MB, 'moment', { at: p.L1 }));
      answers.push(ans('RA', 'Reaction R<sub>A</sub>', 'kN', r.RA, 'reaction'), ans('RB', 'Reaction R<sub>B</sub>', 'kN', r.RB, 'reaction'), ans('RC', 'Reaction R<sub>C</sub>', 'kN', r.RC, 'reaction'));
      const eqText = r.eqs.map((e) => `<li>${e.name}: ${Object.entries(e.coef).map(([k, v]) => `${c(v)}·${k.replace('M', 'M<sub>') + '</sub>'}`).join(' + ')} = ${c(e.rhs)}</li>`).join('');
      return {
        scene: beamScene(L, [{ x: 0, type: p.left === 'fixed' ? 'fixed' : 'pin' }, { x: p.L1, type: 'roller' }, { x: L, type: 'roller' }], loads, { names: [[0, 'A'], [p.L1, 'B'], [L, 'C']], bc: 'ss', bm, sf }),
        answers,
        steps: [
          { t: 'The three moment equation', kid: 'Clapeyron found one equation that links the moments at three supports in a row. Write it for every middle support.', w: `M<sub>A</sub>L₁ + 2M<sub>B</sub>(L₁ + L₂) + M<sub>C</sub>L₂ = 6A₁x̄₁/L₁ + 6A₂x̄₂/L₂<br>(moments hogging +, x̄₁ from A, x̄₂ from C). End C is simply supported → M<sub>C</sub> = 0. ${p.left === 'fixed' ? 'End A is <b>fixed</b> → add an imaginary span A₀A of zero length on the left.' : 'End A is pinned → M<sub>A</sub> = 0.'}` },
          { t: 'Free bending moment of each span (as if simply supported)', kid: 'First pretend each span is a separate simple beam.', w: `Span AB: ${p.l1.type === 'UDL' ? `wL²/8 = ${c(T.freeBMArea(p.L1, p.l1).Mmax)}` : `Pab/L = ${c(T.freeBMArea(p.L1, p.l1).Mmax)}`} kN·m, area A₁ = ${c(T.freeBMArea(p.L1, p.l1).A)}<br>Span BC: ${p.l2.type === 'UDL' ? `wL²/8 = ${c(T.freeBMArea(p.L2, p.l2).Mmax)}` : `Pab/L = ${c(T.freeBMArea(p.L2, p.l2).Mmax)}`} kN·m, area A₂ = ${c(T.freeBMArea(p.L2, p.l2).A)}` },
          { t: 'The 6Ax̄/L terms', kid: 'These ready-made terms save time: for a UDL it is always wL³/4.', w: `Span AB (x̄ from A): ${sixText(p.L1, p.l1, 'A', r.R1L)}${p.left === 'fixed' ? `<br>Span AB (x̄ from B, for the fixed-end equation): ${c(r.R1R)}` : ''}<br>Span BC (x̄ from C): ${sixText(p.L2, p.l2, 'C', r.R2R)}` },
          { t: 'Write and solve the equations', kid: '', w: `<ul>${eqText}</ul>Solving: ${p.left === 'fixed' ? `M<sub>A</sub> = <b class="ans">${f(r.MA)} kN·m</b>, ` : ''}M<sub>B</sub> = <b class="ans">${f(r.MB)} kN·m</b> (hogging)` },
          { t: 'Reactions', kid: 'Each span: simple-beam reaction plus a correction from the difference of end moments.', w: `R<sub>A</sub> = simple + (M<sub>A</sub> − M<sub>B</sub>)/L₁ = <b class="ans">${f(r.RA)} kN</b><br>R<sub>B</sub> = ${c(r.RB1)} + ${c(r.RB2)} = <b class="ans">${f(r.RB)} kN</b><br>R<sub>C</sub> = <b class="ans">${f(r.RC)} kN</b><br>Check: ΣR = total load ✓` },
        ],
      };
    },
  };
  function E1(L, ld, x) { // free (simply supported) BM at x
    if (ld.type === 'UDL') return ld.w * x * (L - x) / 2;
    return x <= ld.a ? ld.P * (L - ld.a) * x / L : ld.P * ld.a * (L - x) / L;
  }

  /* ================================================================
     MODULES 3 & 4 — continuous beams and non-sway frames
     ================================================================ */
  const loadText = (ld, L, near) => ld.type === 'UDL' ? `subjected to UDL of intensity ${g(ld.w, 'kN/m')}` : (Math.abs(ld.a - L / 2) < 1e-9 ? `subjected to central concentrated load of ${g(ld.P, 'kN')}` : `subjected to concentrated load of ${g(ld.P, 'kN')} acting at ${g(ld.a, 'm')} from ${near}`);
  function beamModel(p) {
    const ids = 'ABCDE'; let x = 0;
    const nodes = [{ id: 'A', x: 0, y: 0, sup: p.left === 'fixed' ? 'fixed' : 'pinned' }];
    const members = p.spans.map((s, k) => {
      x += s.L;
      nodes.push({ id: ids[k + 1], x, y: 0, sup: k === p.spans.length - 1 ? (p.right === 'fixed' ? 'fixed' : 'roller') : 'roller' });
      return { i: ids[k], j: ids[k + 1], I: s.I || 1, loads: [s.load] };
    });
    return { nodes, members };
  }
  const randomSpan = () => { const L = rnd.step(3, 7, 0.5); return { L, I: rnd.pick([1, 1, 1, 2]), load: rnd.pick([true, false]) ? { type: 'UDL', w: rnd.int(10, 40) } : { type: 'P', P: rnd.int(20, 100), a: rnd.pick([L / 2, rnd.step(1, L - 1, 0.5)]) } }; };
  const beamPresets = [
    { label: 'KTU Nov 2024 · Q10 (SD)', params: { spans: [{ L: 4.4, I: 1, load: { type: 'UDL', w: 18 } }, { L: 5.6, I: 1, load: { type: 'P', P: 25, a: 3 } }], left: 'fixed', right: 'fixed' } },
    { label: 'KTU Jun 2024 · Q10 / Q12', params: { spans: [{ L: 4, I: 1, load: { type: 'UDL', w: 25 } }, { L: 5, I: 2, load: { type: 'P', P: 50, a: 2 } }, { L: 6, I: 1, load: { type: 'P', P: 75, a: 3 } }], left: 'fixed', right: 'fixed' } },
    { label: 'KTU Dec 2022 · Q11', params: { spans: [{ L: 6, I: 1, load: { type: 'UDL', w: 100 } }, { L: 4, I: 1, load: { type: 'UDL', w: 300 } }], left: 'fixed', right: 'pinned' } },
    { label: 'KTU Nov 2024 · Q12 (MDM)', params: { spans: [{ L: 5, I: 1, load: { type: 'P', P: 54, a: 2.5 } }, { L: 5, I: 1, load: { type: 'P', P: 34, a: 3 } }, { L: 4, I: 1, load: { type: 'UDL', w: 20 } }], left: 'fixed', right: 'fixed' } },
    { label: 'KTU Dec 2022 · Q12 (MDM, 2 kN/m)', params: { spans: [{ L: 6, I: 1, load: { type: 'UDL', w: 2 } }, { L: 5, I: 1, load: { type: 'P', P: 5, a: 2 } }], left: 'pinned', right: 'pinned' } },
  ];
  function beamStatement(p, method) {
    const ids = 'ABCDE'; const n = p.spans.length; const name = ids.slice(0, n + 1);
    const spanTxt = p.spans.map((s, k) => `Span ${ids[k]}${ids[k + 1]} – length ${g(s.L, 'm')}, ${loadText(s.load, s.L, ids[k])}${p.spans.some((q) => (q.I || 1) !== 1) ? ` and having flexural rigidity ${s.I === 1 ? '' : s.I}EI` : ''}.`).join(' ');
    const ends = `End A is ${p.left === 'fixed' ? 'fixed' : 'simply supported'} and end ${ids[n]} is ${p.right === 'fixed' ? 'fixed' : 'simply supported'}; intermediate supports are rollers.`;
    return `Analyse the continuous beam ${name} with the following details by <b>${method}</b>. ${spanTxt} ${ends} Determine the final moments and draw the bending moment diagram.`;
  }
  function frameModel(p) {
    if (p.kind === 'T') {
      const { L1, L2, h } = p;
      return { nodes: [{ id: 'A', x: 0, y: h, sup: 'fixed' }, { id: 'B', x: L1, y: h, sup: null }, { id: 'C', x: L1 + L2, y: h, sup: 'fixed' }, { id: 'D', x: L1, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'P', P: p.P1, a: L1 / 2 }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'P', P: p.P2, a: L2 / 2 }] }, { i: 'B', j: 'D', I: 1, loads: [] }] };
    }
    if (p.kind === 'portal') {
      const { h, L, w, Pc, Ic, Ib } = p;
      const colLoads = Pc ? [{ type: 'P', P: Pc, a: h / 2 }] : [];
      return { nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: 0, y: h, sup: null }, { id: 'C', x: L, y: h, sup: null }, { id: 'D', x: L, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: Ic, loads: colLoads }, { i: 'B', j: 'C', I: Ib, loads: [{ type: 'UDL', w }] }, { i: 'C', j: 'D', I: Ic, loads: colLoads.map((l) => ({ ...l })) }] };
    }
    // beam on elastic column (Dec 2022 Q10 type)
    const { L1, a, P: Pl, L2, w, h, I1 } = p;
    return { nodes: [{ id: 'A', x: 0, y: h, sup: 'fixed' }, { id: 'B', x: L1, y: h, sup: null }, { id: 'C', x: L1 + L2, y: h, sup: 'roller' }, { id: 'D', x: L1, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: I1, loads: [{ type: 'P', P: Pl, a }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'UDL', w }] }, { i: 'B', j: 'D', I: 1, loads: [] }] };
  }
  const framePresets = [
    { label: 'KTU Jun 2024 · Q11 / Q13 (T-frame)', params: { kind: 'T', L1: 4, P1: 100, L2: 5, P2: 100, h: 3 } },
    { label: 'KTU Nov 2024 · Q11 / Q13 (portal)', params: { kind: 'portal', h: 4.8, L: 4, w: 17, Pc: 24, Ic: 1, Ib: 1 } },
    { label: 'KTU Dec 2022 · Q13 (portal, feet taken fixed)', params: { kind: 'portal', h: 4, L: 6, w: 2, Pc: 0, Ic: 1, Ib: 3 } },
    { label: 'KTU Dec 2022 · Q10 (beam on elastic column)', params: { kind: 'bc', L1: 5, a: 2, P: 10, L2: 3, w: 2, h: 3, I1: 2 } },
  ];
  function frameStatement(p, method) {
    if (p.kind === 'T') return `Analyse the frame ABCD by <b>${method}</b>. The horizontal beams AB and BC are subjected to central concentrated loads of ${g(p.P1, 'kN')} and ${g(p.P2, 'kN')} and have lengths ${g(p.L1, 'm')} and ${g(p.L2, 'm')} respectively. The vertical column BD through joint B has height ${g(p.h, 'm')}. All members have uniform flexural rigidity. The ends A, C and D are fixed.`;
    if (p.kind === 'portal') return `A portal frame ABCD is fixed at A and D. Columns AB = CD = ${g(p.h, 'm')} (moment of inertia ${p.Ic === 1 ? '' : p.Ic}I) and beam BC = ${g(p.L, 'm')} (moment of inertia ${p.Ib === 1 ? '' : p.Ib}I). The beam carries a UDL of ${g(p.w, 'kN/m')}${p.Pc ? ` and each column carries a horizontal load of ${g(p.Pc, 'kN')} at mid-height acting inwards` : ''}. Determine the final moments and the support reactions by <b>${method}</b>, and draw the bending moment diagram.`;
    return `A continuous beam ABC fixed at A is supported on an elastic column BD (fixed at D) and on a roller at C. Span AB = ${g(p.L1, 'm')} (${p.I1}I) carries ${g(p.P, 'kN')} at ${g(p.a, 'm')} from A; span BC = ${g(p.L2, 'm')} (I) carries a UDL of ${g(p.w, 'kN/m')}; column BD = ${g(p.h, 'm')} (I). Analyse the frame by <b>${method}</b> and draw the bending moment diagram.`;
  }
  function frameRandom() {
    const kind = rnd.pick(['T', 'portal', 'bc']);
    if (kind === 'T') return { kind, L1: rnd.step(3, 6, 0.5), P1: rnd.int(20, 120), L2: rnd.step(3, 6, 0.5), P2: rnd.int(20, 120), h: rnd.step(2.5, 5, 0.5) };
    if (kind === 'portal') return { kind, h: rnd.step(3, 6, 0.5), L: rnd.step(4, 8, 0.5), w: rnd.int(5, 30), Pc: rnd.pick([0, rnd.int(10, 40)]), Ic: 1, Ib: rnd.pick([1, 2, 3]) };
    const L1 = rnd.step(4, 6, 0.5); return { kind, L1, a: rnd.step(1, L1 - 1, 0.5), P: rnd.int(10, 60), L2: rnd.step(2, 4, 0.5), w: rnd.int(2, 20), h: rnd.step(2.5, 4, 0.5), I1: rnd.pick([1, 2]) };
  }

  function femLine(m) {
    return m.fem.parts.map((pt) => pt.kind === 'UDL'
      ? `M<sub>F${m.i}${m.j}</sub> = −wL²/12 = −${g(pt.w)}×${g(pt.L)}²/12 = ${c(pt.ij)} ; M<sub>F${m.j}${m.i}</sub> = ${c(pt.ji)}`
      : `M<sub>F${m.i}${m.j}</sub> = −Pab²/L² = −${g(pt.P)}×${g(pt.a)}×${g(pt.b)}²/${g(pt.L)}² = ${c(pt.ij)} ; M<sub>F${m.j}${m.i}</sub> = +Pa²b/L² = ${c(pt.ji)}`).join('<br>') || `M<sub>F${m.i}${m.j}</sub> = M<sub>F${m.j}${m.i}</sub> = 0 (no load on member)`;
  }
  function sdExpr(m, theta, dofs, end) {
    const i = end === 'i' ? m.i : m.j, j = end === 'i' ? m.j : m.i;
    const F = end === 'i' ? m.fem.Fij : m.fem.Fji;
    let s = `${c(F)}`;
    if (dofs.includes(i)) s += ` + ${c(2 * m.c)}·EIθ<sub>${i}</sub>`;
    if (dofs.includes(j)) s += ` + ${c(m.c)}·EIθ<sub>${j}</sub>`;
    return s;
  }
  function memberAnswers(model, sd, opts) {
    const out = [];
    const pinnedEnd = (id) => { const n = model.nodes.find((q) => q.id === id); return (n.sup === 'pinned' || n.sup === 'roller') && model.members.filter((m) => m.i === id || m.j === id).length === 1; };
    sd.members.forEach((m) => {
      [[m.i, m.j, m.Mij], [m.j, m.i, m.Mji]].forEach(([a, b, val]) => {
        if (pinnedEnd(a)) return;
        if (opts && opts.skipDup && model.members.filter((q) => q.i === a || q.j === a).length === 2 && model.nodes.find((n) => n.id === a).sup !== 'fixed' && out.some((o) => o.node === a)) return;
        out.push(ans('M' + a + b, `M<sub>${a}${b}</sub>`, 'kN·m', val, 'moment', { signed: true, node: a, member: m.i + m.j }));
      });
    });
    return out;
  }
  function beamReactions(sd) {
    const R = {};
    sd.members.forEach((m) => { R[m.i] = (R[m.i] || 0) + m.Vi; R[m.j] = (R[m.j] || 0) + m.Vj; });
    return R;
  }
  function beamSceneFromModel(model, sd) {
    const L = model.nodes[model.nodes.length - 1].x;
    const loads = []; const sups = model.nodes.map((n) => ({ x: n.x, type: n.sup === 'fixed' ? 'fixed' : n.sup === 'pinned' ? 'pin' : 'roller', right: n.x > 0 && n.sup === 'fixed' }));
    sd.members.forEach((m) => {
      const x0 = model.nodes.find((n) => n.id === m.i).x;
      m.loads.forEach((ld) => { if (ld.type === 'UDL') loads.push({ type: 'UDL', x1: x0, x2: x0 + m.L, w: ld.w, label: `${trim(ld.w)} kN/m` }); else loads.push({ type: 'P', x: x0 + ld.a, P: ld.P, label: `${trim(ld.P)} kN` }); });
    });
    const find = (x) => { let x0 = 0; for (const m of sd.members) { if (x <= x0 + m.L + 1e-9) return [m, x - x0]; x0 += m.L; } const m = sd.members[sd.members.length - 1]; return [m, m.L]; };
    return beamScene(L, sups, loads, {
      names: model.nodes.map((n) => [n.x, n.id]), bc: 'ss',
      bm: (x) => { const [m, s] = find(x); return T.memberMoment(m.L, m.loads, m.Mij, m.Mji, s); },
      sf: (x) => { const [m, s] = find(x); return T.memberShear(m.L, m.loads, m.Mij, m.Mji, s); },
      EI: (x) => find(x)[0].I || 1,
      ei: sd.members.some((m) => (m.I || 1) !== 1) ? (() => { let x0 = 0; return sd.members.map((m) => { const o = { x1: x0, x2: x0 + m.L, label: `${m.I === 1 ? '' : m.I}EI` }; x0 += m.L; return o; }); })() : null,
    });
  }

  function sdSteps(model, sd, isFrame) {
    const dofs = sd.dofNodes;
    const steps = [];
    steps.push({ t: 'Unknown joint rotations', kid: 'Fixed supports cannot turn. Every other joint can twist a little. Those twists (θ) are the unknowns we solve for.', w: `Fixed: ${model.nodes.filter((n) => n.sup === 'fixed').map((n) => n.id).join(', ') || 'none'} (θ = 0).<br>Unknowns: ${dofs.map((d) => `θ<sub>${d}</sub>`).join(', ')}. No sway (${isFrame ? 'symmetric / braced frame' : 'beam'}), so Δ = 0.` });
    steps.push({ t: 'Fixed end moments (clockwise +)', kid: 'First imagine every joint clamped. Each loaded span then pushes on its ends with a "fixed end moment".', w: sd.members.map(femLine).join('<br>') });
    steps.push({ t: 'Slope deflection equations', kid: 'Each end moment = fixed end moment + a correction for how much the joints twist.', w: `M<sub>ij</sub> = M<sub>Fij</sub> + (2EI/L)(2θ<sub>i</sub> + θ<sub>j</sub>) &nbsp; (relative I used; 2EI/L shown as numbers)<br>` + sd.members.map((m) => `M<sub>${m.i}${m.j}</sub> = ${sdExpr(m, sd.theta, dofs, 'i')}<br>M<sub>${m.j}${m.i}</sub> = ${sdExpr(m, sd.theta, dofs, 'j')}`).join('<br>') });
    const eqs = dofs.map((d, r) => `Joint ${d}: ΣM = 0 → ${dofs.map((e, k) => `${c(sd.K[r][k])}·EIθ<sub>${e}</sub>`).join(' + ')} = ${c(sd.F[r])}`).join('<br>');
    steps.push({ t: 'Joint equilibrium', kid: 'A free joint cannot spin forever, so all the moments meeting at it must add up to zero.', w: eqs });
    steps.push({ t: 'Solve the equations', kid: 'Solve them together like simultaneous equations from school.', w: dofs.map((d) => `EIθ<sub>${d}</sub> = <b class="ans">${f(sd.theta[d], 3)}</b>`).join('<br>') });
    steps.push({ t: 'Final moments (put θ back)', kid: 'Put the twists back into the equations to get the real end moments. Positive = clockwise.', w: sd.members.map((m) => `M<sub>${m.i}${m.j}</sub> = <b class="ans">${f(m.Mij)}</b> kN·m ; M<sub>${m.j}${m.i}</sub> = <b class="ans">${f(m.Mji)}</b> kN·m`).join('<br>') });
    return steps;
  }
  function mdTableHTML(md) {
    const head = md.cols.map((cl) => `<th>${cl.key}</th>`).join('');
    const df = md.cols.map((cl) => `<td>${cl.DF ? f(cl.DF, 3) : '0'}</td>`).join('');
    const rows = md.rows.map((r) => `<tr class="${r.kind || ''}"><th>${r.label}</th>${r.vals.map((v) => `<td>${Math.abs(v) < 5e-4 ? '' : f(v)}</td>`).join('')}</tr>`).join('');
    const fin = md.final.map((v) => `<td><b>${f(v)}</b></td>`).join('');
    return `<div class="tbl"><table class="mdm"><thead><tr><th>Joint end</th>${head}</tr></thead><tbody><tr class="df"><th>DF</th>${df}</tr>${rows}<tr class="final"><th>Final</th>${fin}</tr></tbody></table></div>`;
  }
  function mdSteps(model, md, sd) {
    const steps = [];
    steps.push({ t: 'Fixed end moments', kid: 'Lock every joint first so nothing can turn, then work out the moments each loaded span would make.', w: sd.members.map(femLine).join('<br>') });
    const pinned = md.endJoints;
    steps.push({ t: 'Stiffness and distribution factors', kid: 'Stiffer members (short or thick) take a bigger share of the unbalanced moment, like a stronger friend carrying more of a load.', w: md.joints.map((j) => `Joint ${j.node}: ` + j.cols.map((k) => { const cl = md.cols[k]; return `k<sub>${cl.key}</sub> = ${cl.kFormula} = ${cl.farPinned ? '3' : '4'}×${g(cl.m.I || 1)}/${g(cl.m.L)} → DF = ${f(cl.DF, 3)}`; }).join('; ')).join('<br>') + (pinned.length ? `<br>Simply supported end${pinned.length > 1 ? 's' : ''} ${pinned.join(', ')}: release first (DF = 1), then use 3EI/L for the member and carry nothing back.` : '') });
    steps.push({ t: 'Distribute and carry over', kid: 'Unlock one joint at a time. It turns until balanced; each member takes its share (Balance), and half of that share travels to the far end (Carry over). Repeat until the numbers become tiny.', w: mdTableHTML(md) + `<p class="note">Carry over factor = ½ to a fixed or continuous far end; 0 to a simply supported end. Stopped when the unbalanced moment fell below 0.01 kN·m.</p>` });
    steps.push({ t: 'Final moments', kid: 'Add each column from top to bottom.', w: md.cols.map((cl, k) => `M<sub>${cl.key}</sub> = <b class="ans">${f(md.final[k])}</b>`).join(' ; ') + `<br><span class="note">Exact values by slope deflection: ${sd.members.map((m) => `${m.i}${m.j} ${f(m.Mij)}, ${m.j}${m.i} ${f(m.Mji)}`).join('; ')}</span>` });
    return steps;
  }
  function reactionStep(model, sd) {
    const R = beamReactions(sd);
    return { t: 'Support reactions', kid: 'Each span: simple-beam reaction plus (sum of end moments)/L correction.', w: sd.members.map((m) => `Span ${m.i}${m.j}: V<sub>${m.i}</sub> = ${c(m.Ri)} − (${c(m.Mij)} + ${c(m.Mji)})/${g(m.L)} = ${c(m.Vi)} ; V<sub>${m.j}</sub> = ${c(m.Vj)}`).join('<br>') + '<br>' + Object.entries(R).map(([k, v]) => `R<sub>${k}</sub> = <b class="ans">${f(v)} kN</b>`).join(', ') };
  }
  function makeBeamProblem(p, method) {
    const model = beamModel(p); const sd = T.slopeDeflection(model);
    const isMD = method === 'Moment distribution method';
    const md = isMD ? T.momentDistribution(model) : null;
    const R = beamReactions(sd);
    const answers = memberAnswers(model, sd, { skipDup: true });
    const steps = isMD ? mdSteps(model, md, sd) : sdSteps(model, sd, false);
    steps.push(reactionStep(model, sd));
    const ids = Object.keys(R);
    answers.push(ans('R' + ids[1], `Reaction R<sub>${ids[1]}</sub>`, 'kN', R[ids[1]], 'reaction'));
    return { scene: beamSceneFromModel(model, sd), answers, steps, model, sd, md, signNote: true };
  }
  function makeFrameProblem(p, method) {
    const model = frameModel(p); const sd = T.slopeDeflection(model);
    const isMD = method === 'Moment distribution method';
    const md = isMD ? T.momentDistribution(model) : null;
    const answers = memberAnswers(model, sd, {});
    const steps = isMD ? mdSteps(model, md, sd) : sdSteps(model, sd, true);
    if (p.kind === 'portal') {
      const col = sd.members[0], beam = sd.members[1];
      const HA = -col.Vi; // global +x positive
      steps.push({ t: 'Support reactions', kid: 'The beam hands its end shears down the columns. The column moments tell us the horizontal kick at the feet.', w: `V<sub>A</sub> = shear at B of beam = ${c(beam.Ri)} − (${c(beam.Mij)} + ${c(beam.Mji)})/${g(beam.L)} = <b class="ans">${f(beam.Vi)} kN</b> ↑ (V<sub>D</sub> = ${f(beam.Vj)} kN)<br>Column AB: H<sub>A</sub> = ${c(col.Ri)} − (M<sub>AB</sub> + M<sub>BA</sub>)/h = ${c(col.Ri)} − (${c(col.Mij)} + ${c(col.Mji)})/${g(col.L)} → <b class="ans">${f(Math.abs(HA))} kN</b> ${HA >= 0 ? '→ (inwards)' : '← (outwards)'} ; H<sub>D</sub> equal and opposite (symmetry).` });
      answers.push(ans('VA', 'Vertical reaction V<sub>A</sub>', 'kN', beam.Vi, 'reaction'), ans('HA', 'Horizontal reaction H<sub>A</sub> (magnitude)', 'kN', Math.abs(HA), 'reaction'));
    }
    return { scene: { kind: 'frame', model, sd }, answers, steps, model, sd, md, signNote: true };
  }
  P['m3-beam'] = { module: 3, title: 'Continuous beam', method: 'Slope deflection method', family: 'M3-beam', presets: beamPresets.slice(0, 3), random: () => { const n = rnd.pick([2, 3]); return { spans: Array.from({ length: n }, randomSpan), left: rnd.pick(['fixed', 'pinned']), right: rnd.pick(['fixed', 'pinned']) }; }, loadKeys: [], statement: (p) => beamStatement(p, 'slope deflection method'), make: (p) => makeBeamProblem(p, 'Slope deflection method') };
  P['m3-frame'] = { module: 3, title: 'Frame without sway', method: 'Slope deflection method', family: 'M3-frame', presets: framePresets, random: frameRandom, loadKeys: [], statement: (p) => frameStatement(p, 'slope deflection method'), make: (p) => makeFrameProblem(p, 'Slope deflection method') };
  P['m4-beam'] = { module: 4, title: 'Continuous beam', method: 'Moment distribution method', family: 'M4-beam', presets: [beamPresets[3], beamPresets[1], beamPresets[4], beamPresets[2]], random: P['m3-beam'].random, loadKeys: [], statement: (p) => beamStatement(p, 'moment distribution method'), make: (p) => makeBeamProblem(p, 'Moment distribution method') };
  P['m4-frame'] = { module: 4, title: 'Frame without sway', method: 'Moment distribution method', family: 'M4-frame', presets: [framePresets[1], framePresets[0], framePresets[2], framePresets[3]], random: frameRandom, loadKeys: [], statement: (p) => frameStatement(p, 'moment distribution method'), make: (p) => makeFrameProblem(p, 'Moment distribution method') };

  P['m4-df'] = {
    module: 4, title: 'Distribution factors at a joint', method: 'Moment distribution (Part A)', family: 'M4-df',
    presets: [{ label: 'KTU Jun 2024 · Part A Q4', params: { mem: [{ name: 'OA', L: 4, I: 1, far: 'fixed' }, { name: 'OB', L: 4, I: 1, far: 'pinned' }, { name: 'OC', L: 4, I: 1, far: 'pinned' }, { name: 'OD', L: 4, I: 1, far: 'fixed' }], same: true } }],
    random: () => ({ mem: ['OA', 'OB', 'OC', 'OD'].slice(0, rnd.pick([3, 4])).map((name) => ({ name, L: rnd.step(2, 6, 0.5), I: rnd.pick([1, 1, 2, 3]), far: rnd.pick(['fixed', 'pinned']) })) }),
    loadKeys: [],
    statement: (p) => p.same ? 'Find the distribution factor of joint O with four members OA, OB, OC and OD. The ends A and D are fixed and B and C are hinged. All the members are having same length and flexural rigidity.' : `Find the distribution factors at rigid joint O for the members: ${p.mem.map((m) => `${m.name} (L = ${g(m.L, 'm')}, I = ${m.I}I, far end ${m.far === 'fixed' ? 'fixed' : 'hinged'})`).join('; ')}.`,
    make(p) {
      const r = T.jointDF(p.mem); const sum = r.reduce((s, m) => s + m.k, 0);
      return {
        scene: { kind: 'joint', mem: r },
        answers: r.map((m) => ans('DF' + m.name, `DF of ${m.name}`, '', m.DF, 'df', { tolAbs: 0.005 })),
        steps: [
          { t: 'Stiffness of each member', kid: 'A member whose far end is gripped (fixed) resists turning more than one whose far end is free to turn (hinged).', w: r.map((m) => `k<sub>${m.name}</sub> = ${m.far === 'fixed' ? '4EI/L' : '3EI/L'} = ${m.far === 'fixed' ? 4 : 3}×${m.I}/${p.same ? 'L' : g(m.L)} = ${p.same ? (m.far === 'fixed' ? '4' : '3') + 'EI/L' : f(m.k, 3) + ' EI'}`).join('<br>') },
          { t: 'Distribution factor = k / Σk', kid: 'Each member\'s share is its stiffness divided by the total stiffness, like splitting a bill by how much each person ate.', w: `Σk = ${p.same ? r.map((m) => (m.far === 'fixed' ? 4 : 3)).join(' + ') + ' = ' + r.reduce((s, m) => s + (m.far === 'fixed' ? 4 : 3), 0) + ' (×EI/L)' : f(sum, 3) + ' EI'}<br>` + r.map((m) => `DF<sub>${m.name}</sub> = <b class="ans">${f(m.DF, 3)}</b>${p.same ? ` (= ${m.far === 'fixed' ? 4 : 3}/${r.reduce((s, q) => s + (q.far === 'fixed' ? 4 : 3), 0)})` : ''}`).join('<br>') + '<br>Check: ΣDF = 1 ✓' },
        ],
      };
    },
  };

  /* ================================================================
     MODULE 5
     ================================================================ */
  P['m5-parabolic'] = {
    module: 5, title: 'Three hinged parabolic arch', method: 'Statics + arch geometry', family: 'M5-arch',
    presets: [
      { label: 'KTU Dec 2022 · Q14', params: { L: 20, h: 5, pts: [{ P: 200, x: 6 }], udl: null, xs: 6, ask: 'react' } },
      { label: 'KTU Jun 2024 · Q14', params: { L: 24, h: 8, pts: [{ P: 75, x: 6 }, { P: 50, x: 18 }], udl: null, xs: 6, ask: 'full' } },
    ],
    random: () => { const L = rnd.step(16, 40, 4), h = rnd.step(3, Math.min(10, L / 3), 1); const x1 = rnd.step(2, L / 2 - 1, 1); const pts = [{ P: rnd.int(30, 200), x: x1 }]; if (rnd.pick([true, false])) pts.push({ P: rnd.int(30, 150), x: rnd.step(L / 2 + 1, L - 2, 1) }); const udl = rnd.pick([null, null, { w: rnd.int(5, 30), x1: 0, x2: L / 2 }]); let xs = rnd.step(2, L - 2, 1); if (pts.some((q) => q.x === xs) || xs === L / 2) xs += 0.5; return { L, h, pts, udl, xs, ask: 'full' }; },
    loadKeys: [],
    statement: (p) => {
      const lds = p.pts.map((q) => `a concentrated load of ${g(q.P, 'kN')} at ${g(q.x, 'm')} from the left support`).join(' and ') + (p.udl ? ` and a UDL of ${g(p.udl.w, 'kN/m')} over the left half of the span` : '');
      return `A three hinged parabolic arch of span ${g(p.L, 'm')} and central rise ${g(p.h, 'm')} carries ${lds}. Find the support reactions${p.ask === 'full' ? `, and the bending moment, normal thrust and radial shear at ${g(p.xs, 'm')} from the left support` : ' at A and B'}.`;
    },
    make(p) { return archProblem(p, 'parabolic'); },
  };
  P['m5-circular'] = {
    module: 5, title: 'Three hinged circular (segmental) arch', method: 'Statics + arch geometry', family: 'M5-arch',
    presets: [{ label: 'KTU Nov 2024 · Q14', params: { L: 30, h: 6, pts: [{ P: 111, x: 22.5 }], udl: { w: 15, x1: 0, x2: 15 }, xs: 11, ask: 'full' } }],
    random: () => { const L = rnd.step(20, 40, 2), h = rnd.step(4, Math.min(10, L / 3), 1); const d = rnd.step(3, L / 2 - 2, 0.5); let xs = rnd.step(3, L / 2 - 1, 1); return { L, h, pts: [{ P: rnd.int(40, 150), x: L - d }], udl: { w: rnd.int(5, 25), x1: 0, x2: L / 2 }, xs, ask: 'full' }; },
    loadKeys: [],
    statement: (p) => `A three hinged circular arch hinged at the springing points and crown has a span of ${g(p.L, 'm')} with a central rise of ${g(p.h, 'm')}. Determine the reaction at the supports if the arch is subjected to ${p.udl ? `a uniformly distributed load of ${g(p.udl.w, 'kN/m')} over the left half of the span and ` : ''}${p.pts.map((q) => `a point load of ${g(q.P, 'kN')} at a distance ${g(trim(p.L - q.x), 'm')} from the right support`).join(' and ')}. Also find the normal thrust, radial shear and bending moment at a distance ${g(p.xs, 'm')} from the left support.`,
    make(p) { return archProblem(p, 'circular'); },
  };
  function archProblem(p, shape) {
    const loads = p.pts.map((q) => ({ type: 'P', P: q.P, x: q.x })).concat(p.udl ? [{ type: 'UDL', w: p.udl.w, x1: p.udl.x1, x2: p.udl.x2 }] : []);
    const r = T.threeHingedArch(shape, p.L, p.h, loads);
    const onLoad = p.pts.some((q) => Math.abs(q.x - p.xs) < 1e-9);
    const sL = r.at(p.xs, 'left'), sR = r.at(p.xs, 'right');
    const answers = [ans('VA', 'Vertical reaction V<sub>A</sub>', 'kN', r.VA, 'reaction'), ans('VB', 'Vertical reaction V<sub>B</sub>', 'kN', r.VB, 'reaction'), ans('H', 'Horizontal thrust H', 'kN', r.H, 'thrust')];
    if (p.ask === 'react') answers.push(ans('RA', 'Resultant reaction R<sub>A</sub>', 'kN', r.RA, 'reaction'), ans('RB', 'Resultant reaction R<sub>B</sub>', 'kN', r.RB, 'reaction'));
    else {
      answers.push(ans('Mx', `Bending moment at x = ${trim(p.xs)} m`, 'kN·m', sL.M, 'moment', { signed: true }));
      answers.push(ans('N', `Normal thrust at x = ${trim(p.xs)} m`, 'kN', sL.N, 'thrust', onLoad ? { alt: [sR.N] } : {}));
      answers.push(ans('S', `Radial shear at x = ${trim(p.xs)} m`, 'kN', sL.S, 'shear', Object.assign({ signed: true, tolAbs: 0.1 }, onLoad ? { alt: [sR.S] } : {})));
    }
    const momA = loads.map((l) => l.type === 'P' ? `${g(l.P)}×${g(l.x)}` : `${g(l.w)}×${g(l.x2 - l.x1)}×${g((l.x1 + l.x2) / 2)}`).join(' + ');
    const geo = shape === 'parabolic'
      ? `y = 4hx(L − x)/L² = 4×${g(p.h)}×${g(p.xs)}×(${g(p.L)} − ${g(p.xs)})/${g(p.L)}² = ${c(sL.y, 'm')}<br>tanθ = dy/dx = 4h(L − 2x)/L² = ${c(Math.tan(sL.theta), '')} → θ = ${c(T.deg(sL.theta))}°`
      : `Radius: R = (L²/4 + h²)/2h = (${g(p.L)}²/4 + ${g(p.h)}²)/(2×${g(p.h)}) = ${c(r.R, 'm')}<br>y = √(R² − (L/2 − x)²) − (R − h) = √(${c(r.R)}² − ${c(p.L / 2 - p.xs)}²) − ${c(r.R - p.h)} = ${c(sL.y, 'm')}<br>sinθ = (L/2 − x)/R = ${c(Math.sin(sL.theta), '')} → θ = ${c(T.deg(sL.theta))}°`;
    const steps = [
      { t: 'Why an arch needs H', kid: 'An arch pushes outwards at its feet, like a person doing the splits. The supports must push back inwards; that inward push is the horizontal thrust H.', w: 'Unknowns: V<sub>A</sub>, V<sub>B</sub>, H (H<sub>A</sub> = H<sub>B</sub> = H). Equations: ΣV = 0, ΣM = 0 and the extra condition <b>M = 0 at the crown hinge C</b>.' },
      { t: 'Vertical reactions (like a simple beam)', kid: '', w: `ΣM<sub>A</sub> = 0: V<sub>B</sub> × ${g(p.L)} = ${momA} → V<sub>B</sub> = <b class="ans">${f(r.VB)} kN</b><br>V<sub>A</sub> = total load − V<sub>B</sub> = ${c(r.W)} − ${c(r.VB)} = <b class="ans">${f(r.VA)} kN</b>` },
      { t: 'Horizontal thrust from the crown hinge', kid: 'At the crown hinge the arch cannot hold any bending, so the moment there must be zero.', w: `M<sub>C</sub> = 0: (beam moment at crown) − H × h = 0<br>Beam moment at C = ${c(r.Mc)} kN·m → H = ${c(r.Mc)}/${g(p.h)} = <b class="ans">${f(r.H)} kN</b>` },
    ];
    if (p.ask === 'react') steps.push({ t: 'Resultant reactions', kid: 'Combine the up-push and the side-push with Pythagoras.', w: `R<sub>A</sub> = √(V<sub>A</sub>² + H²) = √(${c(r.VA)}² + ${c(r.H)}²) = <b class="ans">${f(r.RA)} kN</b> at ${f(T.deg(r.angA))}° to horizontal<br>R<sub>B</sub> = √(${c(r.VB)}² + ${c(r.H)}²) = <b class="ans">${f(r.RB)} kN</b> at ${f(T.deg(r.angB))}° to horizontal` });
    else {
      steps.push({ t: `Geometry at x = ${trim(p.xs)} m`, kid: 'Find how high the arch is and how steep it is at the section.', w: geo });
      steps.push({ t: 'Bending moment', kid: 'Arch moment = simple beam moment − H × height. H cancels most of it, which is why arches can be thin.', w: `M<sub>x</sub> = (beam moment) − H·y = ${c(sL.Mb)} − ${c(r.H)}×${c(sL.y)} = <b class="ans">${f(sL.M)} kN·m</b> ${sL.M >= 0 ? '(sagging)' : '(hogging)'}` });
      steps.push({ t: 'Normal thrust and radial shear', kid: 'Split the forces at the cut into a part along the arch (thrust) and a part across it (shear).', w: `Net vertical shear V = ${c(sL.V)} kN${onLoad ? ` (just left of the load; just right: ${c(sR.V)} kN)` : ''}<br>N = V sinθ + H cosθ = <b class="ans">${f(sL.N)} kN</b>${onLoad ? ` (right of load: ${f(sR.N)})` : ''}<br>S = V cosθ − H sinθ = <b class="ans">${f(sL.S)} kN</b>${onLoad ? ` (right of load: ${f(sR.S)})` : ''}` });
    }
    return { scene: { kind: 'arch', shape, L: p.L, h: p.h, loads, r, xs: p.ask === 'full' ? p.xs : null }, answers, steps };
  }

  P['m5-cable-points'] = {
    module: 5, title: 'Cable with concentrated loads', method: 'General cable theorem', family: 'M5-cable',
    presets: [
      { label: 'KTU Nov 2024 · Q15', params: { L: 30, pts: [{ P: 52, x: 7.5, name: 'C' }, { P: 39, x: 15, name: 'D' }, { P: 26, x: 22.5, name: 'E' }], known: 0, y: 0.6 } },
      { label: 'KTU Jun 2024 · Q15', params: { L: 10, pts: [{ P: 50, x: 3, name: 'B' }, { P: 75, x: 7, name: 'C' }], known: 0, y: 1, ends: ['A', 'D'] } },
    ],
    random: () => { const L = rnd.step(16, 40, 4); const n = rnd.pick([2, 3]); const pts = n === 3 ? [1, 2, 3].map((k, i) => ({ P: rnd.int(10, 60), x: L * k / 4, name: 'CDE'[i] })) : [{ P: rnd.int(20, 80), x: L / 3, name: 'C' }, { P: rnd.int(20, 80), x: 2 * L / 3, name: 'D' }]; return { L, pts, known: 0, y: rnd.step(0.5, 3, 0.1) }; },
    loadKeys: [],
    statement: (p) => { const e = p.ends || ['A', 'B']; return `A light cable ${e[0]}…${e[1]} is hinged at two points ${g(p.L, 'm')} apart which are at the same level. It supports concentrated loads ${p.pts.map((q) => `${g(q.P, 'kN')} at ${q.name} (${g(q.x, 'm')} from ${e[0]})`).join(', ')}. If the dip at ${p.pts[p.known].name} is ${g(p.y, 'm')}, determine the support reactions, the dips at the other load points, the tension in each segment and the total length of the cable.`; },
    make(p) {
      const e = p.ends || ['A', 'B'];
      const r = T.cablePoints(p.L, p.pts, { x: p.pts[p.known].x, y: p.y });
      r.pts[0].name = e[0]; r.pts[r.pts.length - 1].name = e[1]; r.segs.forEach((s, k) => { s.from = r.pts[k].name; s.to = r.pts[k + 1].name; });
      const answers = [ans('VA', `Vertical reaction V<sub>${e[0]}</sub>`, 'kN', r.VA, 'reaction'), ans('VB', `Vertical reaction V<sub>${e[1]}</sub>`, 'kN', r.VB, 'reaction'), ans('H', 'Horizontal tension H', 'kN', r.H, 'tension')];
      r.pts.slice(1, -1).forEach((q, k) => { if (k !== p.known) answers.push(ans('y' + q.name, `Dip at ${q.name}`, 'm', q.y, 'geom', { tolAbs: 0.005 })); });
      r.segs.forEach((s) => answers.push(ans('T' + s.from + s.to, `Tension T<sub>${s.from}${s.to}</sub>`, 'kN', s.T, 'tension')));
      answers.push(ans('len', 'Total length of cable', 'm', r.length, 'geom', { tolAbs: 0.01, tolRel: 0.001 }));
      return {
        scene: { kind: 'cable', L: p.L, r, loads: p.pts },
        answers,
        steps: [
          { t: 'General cable theorem', kid: 'A hanging cable takes exactly the shape of the bending-moment diagram of a simple beam with the same loads. So: H × dip = beam moment at that point.', w: 'At any point: <b>H · y = M</b> (M = moment of a simply supported beam of the same span and loads, y = dip below the chord). Valid for supports at the same level.' },
          { t: 'Vertical reactions', kid: 'Same as a simple beam.', w: `ΣM about ${e[0]}: V<sub>${e[1]}</sub> × ${g(p.L)} = ${p.pts.map((q) => `${g(q.P)}×${g(q.x)}`).join(' + ')} → V<sub>${e[1]}</sub> = <b class="ans">${f(r.VB)} kN</b><br>V<sub>${e[0]}</sub> = ${c(r.W)} − ${c(r.VB)} = <b class="ans">${f(r.VA)} kN</b>` },
          { t: 'Horizontal tension H from the known dip', kid: 'We know the dip at one point, so H = moment ÷ dip there.', w: `Beam moment at ${p.pts[p.known].name} = ${c(r.Mk)} kN·m → H = ${c(r.Mk)}/${g(p.y)} = <b class="ans">${f(r.H)} kN</b>` },
          { t: 'Dips at the other points', kid: 'Use the same H everywhere: dip = moment ÷ H.', w: r.pts.slice(1, -1).map((q) => `y<sub>${q.name}</sub> = ${c(q.M)}/${c(r.H)} = <b class="ans">${f(q.y, 3)} m</b>`).join('<br>') },
          { t: 'Tension in each segment', kid: 'Tension = H ÷ cos(angle). Steeper pieces carry more tension.', w: r.segs.map((s) => `T<sub>${s.from}${s.to}</sub> = H × (length/horizontal) = ${c(r.H)} × ${c(s.len, '')}/${c(s.dx, '')} = <b class="ans">${f(s.T)} kN</b>`).join('<br>') },
          { t: 'Total length', kid: 'Add up the straight pieces with Pythagoras.', w: r.segs.map((s) => `${s.from}${s.to} = √(${c(s.dx)}² + ${c(s.dy, '')}²) = ${f(s.len, 3)}`).join('<br>') + `<br>Total = <b class="ans">${f(r.length, 3)} m</b>` },
        ],
      };
    },
  };
  P['m5-cable-udl'] = {
    module: 5, title: 'Cable under UDL + anchor cable', method: 'Cable equation · anchor cables', family: 'M5-cable',
    presets: [{ label: 'Textbook type (suspension bridge)', params: { L: 80, w: 20, d: 8, beta: 30, hp: 15 } }],
    random: () => ({ L: rnd.step(40, 160, 10), w: rnd.int(5, 30), d: rnd.step(4, 16, 1), beta: rnd.pick([25, 30, 35, 40, 45]), hp: rnd.step(8, 20, 1) }),
    loadKeys: ['w'],
    statement: (p, ch) => { const v = V(p, ch); return `A suspension cable of span ${v('L', 'm')} and central dip ${v('d', 'm')} carries a load of ${v('w', 'kN/m')} of horizontal span. Find the horizontal tension, the maximum tension and the length of the cable. The cable passes over a pier of height ${v('hp', 'm')} and is anchored by a back-stay inclined at ${v('beta', '°')} to the horizontal. Find the vertical pressure on the pier and the bending moment at its base if the cable passes over (a) a guide pulley, (b) a saddle on rollers.`; },
    make(p) {
      const r = T.cableUDL(p.L, p.w, p.d); const b = p.beta * Math.PI / 180;
      const an = T.anchorCable(r.Tmax, r.theta, b, p.hp);
      const half = p.L / 2;
      return {
        scene: { kind: 'cableUDL', L: p.L, d: p.d, w: p.w, beta: p.beta, hp: p.hp, r },
        answers: [
          ans('H', 'Horizontal tension H', 'kN', r.H, 'tension', { linear: true }), ans('Tmax', 'Maximum tension T<sub>max</sub>', 'kN', r.Tmax, 'tension', { linear: true }), ans('len', 'Length of cable', 'm', r.length, 'geom', { tolAbs: 0.01, tolRel: 0.0005 }),
          ans('Vp', '(a) Pulley: vertical pressure on pier', 'kN', an.pulley.V, 'reaction', { linear: true }), ans('Mp', '(a) Pulley: BM at base of pier', 'kN·m', an.pulley.Mbase, 'moment', { linear: true }),
          ans('Ts', '(b) Saddle: tension in anchor cable', 'kN', an.saddle.T2, 'tension', { linear: true }), ans('Vs', '(b) Saddle: vertical pressure on pier', 'kN', an.saddle.V, 'reaction', { linear: true }),
        ],
        steps: [
          { t: 'Cable equation (derivation)', kid: 'Under a load spread evenly along the span, a cable hangs in a parabola, like a skipping rope held at both ends.', w: `Take moments of the left part about a point x from the support (origin at a support, y dip below chord): H·y = (wL/2)x − wx²/2 → <b>y = wx(L − x)/2H</b>.<br>At mid span y = d: H = wL²/8d. Substituting: <b>y = 4dx(L − x)/L²</b>.` },
          { t: 'Horizontal tension', kid: '', w: `H = wL²/8d = ${g(p.w)}×${g(p.L)}²/(8×${g(p.d)}) = <b class="ans">${f(r.H)} kN</b>` },
          { t: 'Maximum tension (at the supports)', kid: 'At the supports the cable also carries the vertical load, so the tension is biggest there.', w: `V = wL/2 = ${c(r.V)} kN<br>T<sub>max</sub> = √(H² + V²) = √(${c(r.H)}² + ${c(r.V)}²) = <b class="ans">${f(r.Tmax)} kN</b><br>Slope at support: tanα = 4d/L = ${c(4 * p.d / p.L, '')} → α = ${c(T.deg(r.theta))}°` },
          { t: 'Length', kid: '', w: `S ≈ L + 8d²/3L = ${g(p.L)} + 8×${g(p.d)}²/(3×${g(p.L)}) = <b class="ans">${f(r.length, 3)} m</b>` },
          { t: '(a) Guide pulley', kid: 'A pulley spins freely, so the tension is the SAME on both sides, but the angles differ → the pier gets pushed sideways and bends.', w: `T (both sides) = ${c(r.Tmax)} kN<br>Vertical pressure = T(sinα + sinβ) = ${c(r.Tmax)}×(${f(Math.sin(r.theta), 4)} + ${f(Math.sin(b), 4)}) = <b class="ans">${f(an.pulley.V)} kN</b><br>Net horizontal = T(cosα − cosβ) = ${c(an.pulley.Hnet)} kN → BM at base = ${c(an.pulley.Hnet)} × ${g(p.hp)} = <b class="ans">${f(an.pulley.Mbase)} kN·m</b>` },
          { t: '(b) Saddle on rollers', kid: 'Rollers cannot hold any sideways force, so the horizontal pulls on both sides must be EQUAL. The pier only gets pushed straight down — no bending.', w: `T₁cosα = T₂cosβ → T₂ = ${c(r.Tmax)}×${f(Math.cos(r.theta), 4)}/${f(Math.cos(b), 4)} = <b class="ans">${f(an.saddle.T2)} kN</b><br>Vertical pressure = T₁sinα + T₂sinβ = <b class="ans">${f(an.saddle.V)} kN</b>; BM at base = 0` },
        ],
      };
    },
  };

  /* ---------- scene helper ---------- */
  function beamScene(L, supports, loads, o) {
    return { kind: 'beam', L, supports, loads, names: o.names || [], ei: o.ei || null, bm: o.bm, sf: o.sf, bc: o.bc || 'ss', EI: o.EI || (() => 1) };
  }

  /* ---------- public API ---------- */
  window.PROBLEMS = P;
  window.makeProblem = function (id, params) {
    const def = P[id]; const p = params ? JSON.parse(JSON.stringify(params)) : def.random();
    const prob = def.make(p);
    return Object.assign(prob, { id, def, params: p, statement: def.statement(p) });
  };
  window.restateProblem = function (id, params, keys, factor) {
    const def = P[id]; const q = JSON.parse(JSON.stringify(params)); const ch = new Set();
    keys.forEach((k) => { if (typeof q[k] === 'number' && q[k] !== 0) { q[k] = +(q[k] * factor).toFixed(2); ch.add(k); } });
    return ch.size ? def.statement(q, ch) : null;
  };
})();
