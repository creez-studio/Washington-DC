/* =====================================================================
   Visual walkthroughs: for every problem type, a list of steps.
   Each step = { t: title, say: one plain sentence, eq: [[formula, numbers, result]...],
                 vis: what the animated picture shows, extra?: html }
   Numbers come from the same engine results as the answer key.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  const f = (x, d = 2) => T.fmt(x, d);
  const trim = (x) => String(+(+x).toFixed(3));
  const g = (x, u) => `<b class="g">${trim(x)}${u ? ' ' + u : ''}</b>`;
  const c = (x, u) => `<b class="c">${typeof x === 'number' ? f(x) : x}${u ? ' ' + u : ''}</b>`;
  const A = (x, u, d) => `<b class="ans">${f(x, d === undefined ? 2 : d)}${u ? ' ' + u : ''}</b>`;
  const S = (t, say, eq, vis, extra) => ({ t, say, eq: eq || [], vis: vis || {}, extra });
  const W = {};
  const pos = (x) => Math.max(0, x);

  /* ----------------------------- MODULE 1 ----------------------------- */
  W['m1-cant-udl-point'] = (pr) => {
    const { L, w, P } = pr.params;
    const fP = (x) => P * (L - x), fW = (x) => w * (L - x) ** 2 / 2;
    const A1 = P * L * L / 2, A2 = w * L ** 3 / 6, x1 = 2 * L / 3, x2 = 3 * L / 4;
    const areas = (cent) => [
      { x1: 0, x2: L, fn: fP, label: 'A₁', cent: cent && { ref: L, label: `x̄₁ = ${f(x1)} m`, row: 0 } },
      { x1: 0, x2: L, base: fP, fn: fW, label: 'A₂', cent: cent && { ref: L, label: `x̄₂ = ${f(x2)} m`, row: 1 } },
    ];
    return [
      S('Where does the beam move most?', 'The wall holds end A still. The free end B moves and tilts the most, so we look at B.',
        [['At the wall A: θ = 0 and δ = 0'], ['Maximum slope θ and deflection δ are at B']],
        { defl: { tip: { x: L, label: 'δ' }, tangent: { x: L, label: 'θ' } }, hl: ['sup0'], focus: [L * 0.45, L] }),
      S('Bending moment from each load', 'Each load pushes on a lever arm. The longest arm is at the wall, so the moment is largest there.',
        [['Point load: M = P × L', `${g(P)} × ${g(L)}`, c(P * L, 'kN·m')], ['UDL: M = wL² / 2', `${g(w)} × ${g(L)}² ÷ 2`, c(w * L * L / 2, 'kN·m')]],
        { parts: [{ fn: fP, label: `PL = ${f(P * L)}` }, { fn: fW, label: `wL²/2 = ${f(w * L * L / 2)}` }], hl: ['load0', 'load1'] }),
      S('Area of the M/EI diagram', 'Mohr says: area of this diagram = how much the beam turns. A triangle is ½ × base × height; a curved spandrel is ⅓ × base × height.',
        [['A₁ (triangle) = ½ × L × PL', `½ × ${g(L)} × ${c(P * L)}`, c(A1)], ['A₂ (spandrel) = ⅓ × L × wL²/2', `⅓ × ${g(L)} × ${c(w * L * L / 2)}`, c(A2)]],
        { areas: areas(false) }),
      S('Slope at B = total area', 'Add the two areas. That is the slope at the free end.',
        [['θ<sub>B</sub> = (A₁ + A₂) / EI', `${c(A1)} + ${c(A2)}`, A(pr.answers[0].value, '/EI')]],
        { areas: areas(false), defl: { tangent: { x: L, label: 'θB' } } }),
      S('Balance point of each area', 'For deflection we need how far each area sits from B (its centroid).',
        [['Triangle: x̄₁ = 2L/3', `2 × ${g(L)} ÷ 3`, c(x1, 'm')], ['Spandrel: x̄₂ = 3L/4', `3 × ${g(L)} ÷ 4`, c(x2, 'm')]],
        { areas: areas(true) }),
      S('Deflection at B = area × distance', 'Multiply each area by its distance from B and add.',
        [['δ<sub>B</sub> = (A₁·x̄₁ + A₂·x̄₂) / EI', `${c(A1)}×${c(x1)} + ${c(A2)}×${c(x2)}`, A(pr.answers[1].value, '/EI')]],
        { areas: areas(true), defl: { tip: { x: L, label: 'δB' } } }),
    ];
  };

  W['m1-cant-two-point'] = (pr) => {
    const { L, P1, P2, c: cc } = pr.params; const a = L - cc;
    const f1 = (x) => P1 * (L - x), f2 = (x) => P2 * pos(a - x);
    const A1 = P1 * L * L / 2, A2 = P2 * a * a / 2, x1 = 2 * L / 3, x2 = cc + 2 * a / 3;
    const conj = [{ x: L, type: 'fixed', right: true }];
    const areas = (cent) => [
      { x1: 0, x2: L, fn: f1, label: 'A₁', cent: cent && { ref: L, label: `x̄₁ = ${f(x1)} m`, row: 0 } },
      { x1: 0, x2: a, base: f1, fn: f2, label: 'A₂', cent: cent && { ref: L, label: `x̄₂ = ${f(x2)} m`, row: 1 } },
    ];
    return [
      S('Make the twin (conjugate) beam', 'Swap the supports: the wall moves to the free end. Load the twin with the M/EI diagram.',
        [['Real beam: A fixed, B free'], ['Twin beam: A free, B fixed'], ['Slope = shear of twin · Deflection = moment of twin']],
        { sups: conj, tag: 'Conjugate (twin) beam' }),
      S('Moment from each load', 'Each load makes a triangle, tallest at the wall.',
        [['Load at free end: P₁ × L', `${g(P1)} × ${g(L)}`, c(P1 * L, 'kN·m')], [`Load at C: P₂ × a (a = L − c = ${f(a)} m)`, `${g(P2)} × ${c(a)}`, c(P2 * a, 'kN·m')]],
        { parts: [{ fn: f1, label: `P₁L = ${f(P1 * L)}` }, { fn: f2, label: `P₂a = ${f(P2 * a)}` }], hl: ['load0', 'load1'], dims: [{ x1: 0, x2: a, label: `a = ${f(a)} m` }] }),
      S('These areas become loads on the twin', 'Each triangle area is a "load" on the twin beam.',
        [['A₁ = ½ × L × P₁L', `½ × ${g(L)} × ${c(P1 * L)}`, c(A1)], ['A₂ = ½ × a × P₂a', `½ × ${c(a)} × ${c(P2 * a)}`, c(A2)]],
        { areas: areas(false), sups: conj }),
      S('Slope = shear at the twin\'s wall', 'Shear at the wall = total load on the twin.',
        [['θ<sub>B</sub> = A₁ + A₂', `${c(A1)} + ${c(A2)}`, A(pr.answers[0].value, '/EI')]],
        { areas: areas(false), defl: { tangent: { x: L, label: 'θB' } } }),
      S('Distance of each load from B', 'A triangle\'s balance point is ⅓ of its base from the tall side.',
        [['x̄₁ = 2L/3', `2 × ${g(L)} ÷ 3`, c(x1, 'm')], ['x̄₂ = c + 2a/3', `${g(cc)} + 2 × ${c(a)} ÷ 3`, c(x2, 'm')]],
        { areas: areas(true), sups: conj }),
      S('Deflection = moment at the twin\'s wall', 'Moment = load × distance, added up.',
        [['δ<sub>B</sub> = A₁·x̄₁ + A₂·x̄₂', `${c(A1)}×${c(x1)} + ${c(A2)}×${c(x2)}`, A(pr.answers[1].value, '/EI')]],
        { areas: areas(true), defl: { tip: { x: L, label: 'δB' } } }),
    ];
  };

  W['m1-cant-stepped'] = (pr) => {
    const { L, L1, P } = pr.params; const L2 = L - L1;
    const rect = L1 * P * L2 / 2, tri = P * L1 * L1 / 4, t2 = P * L2 * L2 / 2, xr = L - L1 / 2, xt = L - L1 / 3, x2 = 2 * L2 / 3;
    const split = (cent) => [
      { x1: 0, x2: L1, fn: () => P * L2 / 2, label: 'R', c: 0, cent: cent && { ref: L, label: `${f(xr)} m`, row: 0 } },
      { x1: 0, x2: L1, base: () => P * L2 / 2, fn: (x) => P * (L1 - x) / 2, label: 'T₁', c: 1, cent: cent && { ref: L, label: `${f(xt)} m`, row: 1 } },
      { x1: L1, x2: L, fn: (x) => P * (L - x), label: 'T₂', c: 2, cent: cent && { ref: L, label: `${f(x2)} m`, row: 2 } },
    ];
    return [
      S('Moment diagram', 'One load at the tip gives a straight triangle, tallest at the wall.',
        [['M at wall = P × L', `${g(P)} × ${g(L)}`, c(P * L, 'kN·m')], ['M where EI changes = P × (L − L₁)', `${g(P)} × ${c(L2)}`, c(P * L2, 'kN·m')]],
        { parts: [{ fn: (x) => P * (L - x), label: `PL = ${f(P * L)}` }], hl: ['load0'], seg: [[0, L1]] }),
      S('Divide by stiffness: the thick part bends half as much', 'The 2EI part is twice as stiff, so its M/EI is halved. See the jump where EI changes.',
        [['On 2EI part: M / 2EI'], ['On EI part: M / EI']],
        { areas: [{ x1: 0, x2: L1, fn: (x) => P * (L - x) / 2, label: 'M/2EI', c: 0 }, { x1: L1, x2: L, fn: (x) => P * (L - x), label: 'M/EI', c: 2 }], seg: [[0, L1]] }),
      S('Split into simple shapes', 'A trapezium = a rectangle + a triangle. Find each area and its distance from B.',
        [['Rectangle R = L₁ × P(L−L₁)/2', `${g(L1)} × ${c(P * L2 / 2)}`, c(rect)], ['Triangle T₁ = ½ × L₁ × PL₁/2', `½ × ${g(L1)} × ${c(P * L1 / 2)}`, c(tri)], ['Triangle T₂ = ½ × (L−L₁) × P(L−L₁)', `½ × ${c(L2)} × ${c(P * L2)}`, c(t2)]],
        { areas: split(true) }),
      S('Slope = sum of areas', 'Add the three areas.',
        [['θ<sub>B</sub> = R + T₁ + T₂', `${c(rect)} + ${c(tri)} + ${c(t2)}`, A(pr.answers[0].value, '/EI')]],
        { areas: split(false), defl: { tangent: { x: L, label: 'θB' } } }),
      S('Deflection = area × distance', 'Multiply each area by its distance from B and add.',
        [['δ<sub>B</sub> = R·x̄ + T₁·x̄ + T₂·x̄', `${c(rect)}×${c(xr)} + ${c(tri)}×${c(xt)} + ${c(t2)}×${c(x2)}`, A(pr.answers[1].value, '/EI')]],
        { areas: split(true), defl: { tip: { x: L, label: 'δB' } } }),
    ];
  };

  W['m1-ss'] = (pr) => {
    const { L, P, w } = pr.params; const out = [];
    out.push(S('The twin of a simply supported beam', 'For a beam on two simple supports, the twin beam has the same supports.',
      [['Slope at A = support reaction of the twin'], ['Deflection at centre = moment at centre of the twin']], { hl: ['sup0', 'sup1'], tag: 'Twin beam: same supports' }));
    if (P) {
      const fn = (x) => P * Math.min(x, L - x) / 2, half = P * L * L / 16;
      out.push(S('Central load → triangle', 'Peak moment PL/4 at the centre. Each half of the triangle is one reaction of the twin.',
        [['Peak = PL/4', `${g(P)} × ${g(L)} ÷ 4`, c(P * L / 4, 'kN·m')], ['Half area R′ = PL²/16', `${g(P)} × ${g(L)}² ÷ 16`, c(half, '/EI')], ['δ = R′ × L/2 − R′ × L/6', `${c(half)}×${c(L / 2)} − ${c(half)}×${c(L / 6)}`, c(P * L ** 3 / 48, '/EI')]],
        { areas: [{ x1: 0, x2: L / 2, fn, label: 'half', c: 0, cent: { ref: L / 2, label: `L/6 = ${f(L / 6)}`, row: 0 } }, { x1: L / 2, x2: L, fn, c: 0 }], react: [{ x: 0, label: `R′ = ${f(half)}` }] }));
    }
    if (w) {
      const fn = (x) => w * x * (L - x) / 2, half = w * L ** 3 / 24;
      out.push(S('Full UDL → parabola', 'Peak moment wL²/8. Half the parabola area is one reaction of the twin.',
        [['Peak = wL²/8', `${g(w)} × ${g(L)}² ÷ 8`, c(w * L * L / 8, 'kN·m')], ['Half area R′ = wL³/24', `${g(w)} × ${g(L)}³ ÷ 24`, c(half, '/EI')], ['δ = R′ × L/2 − R′ × 3L/16', `${c(half)}×${c(L / 2)} − ${c(half)}×${c(3 * L / 16)}`, c(5 * w * L ** 4 / 384, '/EI')]],
        { areas: [{ x1: 0, x2: L / 2, fn, label: 'half', c: 1, cent: { ref: L / 2, label: `3L/16 = ${f(3 * L / 16)}`, row: 0 } }, { x1: L / 2, x2: L, fn, c: 1 }], react: [{ x: 0, label: `R′ = ${f(half)}` }] }));
    }
    out.push(S('Answers', 'Add the parts (each load\'s effect simply adds up).',
      [['θ<sub>A</sub> = θ<sub>max</sub>', '', A(pr.answers[0].value, '/EI')], ['δ<sub>max</sub> at centre', '', A(pr.answers[1].value, '/EI')]],
      { defl: { tip: { x: L / 2, label: 'δmax' }, tangent: { x: 0, label: 'θA' } } }));
    return out;
  };

  /* ----------------------------- MODULE 2 ----------------------------- */
  W['m2-propped-udl'] = (pr) => {
    const { L, w } = pr.params; const r = T.proppedUDL(L, w); const d1 = w * L ** 4 / 8;
    return [
      S('One support too many', 'Count unknowns: 4 (R_A, M_A, H_A, R_B). Statics gives only 3 equations. So one extra unknown: R_B.',
        [['Unknowns = 4, equations = 3'], ['Ds = 4 − 3', '', A(1, '', 0)]],
        { react: [{ x: 0, label: 'R_A' }, { x: L, label: 'R_B' }], moments: [{ x: 0, cw: false, side: 1, label: 'M_A' }] }),
      S('Take the prop away', 'Without the prop it is a cantilever, and the tip drops.',
        [['δ₁ = wL⁴ / 8EI', `${g(w)} × ${g(L)}⁴ ÷ 8`, c(d1, '/EI ↓')]],
        { hide: ['sup1'], focus: [L * 0.35, L], defl: { bm: (x) => -w * (L - x) ** 2 / 2, bc: 'cantilever-left', key: 'free', tip: { x: L, label: 'δ₁' } } }),
      S('Push the tip up with R_B alone', 'Now imagine only the prop force pushing the tip up.',
        [['δ₂ = R_B L³ / 3EI', `R_B × ${g(L)}³ ÷ 3`, c(r.deltaR) + ' × R_B /EI ↑']],
        { hide: ['sup1'], focus: [L * 0.35, L], force: [{ x: L, label: 'R_B', dir: 'up' }], defl: { bm: (x) => (L - x), bc: 'cantilever-left', key: 'rb', tip: { x: L, label: 'δ₂' } } }),
      S('The prop does not move', 'Drop = push-back, so the tip stays on the prop. This gives R_B.',
        [['δ₁ = δ₂', `${c(d1)} = ${c(r.deltaR)} × R_B`, 'R_B = ' + A(r.RB, 'kN')], ['Shortcut: R_B = 3wL/8']],
        { defl: true, hl: ['sup1'] }),
      S('The other reactions', 'Up forces = total load. Moments about A give M_A.',
        [['R_A = wL − R_B', `${c(w * L)} − ${c(r.RB)}`, A(r.RA, 'kN')], ['M_A = wL²/2 − R_B·L', `${c(w * L * L / 2)} − ${c(r.RB * L)}`, A(r.MA, 'kN·m')]],
        { react: [{ x: 0, label: `R_A = ${f(r.RA)}` }, { x: L, label: `R_B = ${f(r.RB)}` }], moments: [{ x: 0, cw: false, side: 1, label: `M_A = ${f(r.MA)}` }] }),
      S('Biggest sagging moment', 'It is where the shear force becomes zero, at 3L/8 from the prop.',
        [['x = R_B / w', `${c(r.RB)} ÷ ${g(w)}`, c(r.xMax, 'm from B')], ['M<sub>max</sub> = R_B² / 2w', `${c(r.RB)}² ÷ (2 × ${g(w)})`, A(r.Mmax, 'kN·m')]],
        { bmd: true, marks: [{ x: L - r.xMax, from: L, label: `${f(r.xMax)} m` }] }),
    ];
  };
  W['m2-propped-point'] = (pr) => {
    const { L, P, a } = pr.params; const r = T.proppedPoint(L, P, a);
    return [
      S('One support too many', 'One extra unknown (prop force R_B). We find it from how the beam bends.',
        [['Ds = 4 − 3', '', A(1, '', 0)]], { react: [{ x: 0, label: 'R_A' }, { x: L, label: 'R_B' }], moments: [{ x: 0, cw: false, side: 1, label: 'M_A' }] }),
      S('Take the prop away', 'The load bends the part up to the load; beyond it the beam just tilts straight.',
        [['δ₁ = Pa²(3L − a) / 6EI', `${g(P)} × ${g(a)}² × (3×${g(L)} − ${g(a)}) ÷ 6`, c(r.deltaFree, '/EI ↓')]],
        { hide: ['sup1'], defl: { bm: (x) => -P * pos(a - x), bc: 'cantilever-left', key: 'free', tip: { x: L, label: 'δ₁' } }, dims: [{ x1: 0, x2: a, label: `a = ${trim(a)} m` }] }),
      S('Push up with R_B alone', '',
        [['δ₂ = R_B L³ / 3EI', `R_B × ${g(L)}³ ÷ 3`, c(r.deltaR) + ' × R_B']],
        { hide: ['sup1'], focus: [L * 0.35, L], force: [{ x: L, label: 'R_B', dir: 'up' }], defl: { bm: (x) => (L - x), bc: 'cantilever-left', key: 'rb', tip: { x: L, label: 'δ₂' } } }),
      S('The prop does not move', 'Drop = push-back.',
        [['R_B = δ₁ / (L³/3)', `${c(r.deltaFree)} ÷ ${c(r.deltaR)}`, A(r.RB, 'kN')]], { defl: true, hl: ['sup1'] }),
      S('Statics for the rest', '',
        [['R_A = P − R_B', `${g(P)} − ${c(r.RB)}`, A(r.RA, 'kN')], ['M_A = P·a − R_B·L', `${c(P * a)} − ${c(r.RB * L)}`, A(r.MA, 'kN·m')], ['Under load: R_B × (L − a)', `${c(r.RB)} × ${c(r.b)}`, A(r.Mload, 'kN·m')]],
        { bmd: true, react: [{ x: 0, label: `R_A = ${f(r.RA)}` }, { x: L, label: `R_B = ${f(r.RB)}` }] }),
    ];
  };
  W['m2-fixed'] = (pr) => {
    const p = pr.params, L = p.L, isP = p.type === 'P';
    const r = isP ? T.fixedPoint(L, p.P, p.a) : T.fixedUDL(L, p.w);
    const th0 = isP ? p.P * p.a * p.a / 2 : p.w * L ** 3 / 6, d0 = isP ? p.P * p.a * p.a * (3 * L - p.a) / 6 : p.w * L ** 4 / 8;
    const cantBM = isP ? (x) => -p.P * pos(p.a - x) : (x) => -p.w * (L - x) ** 2 / 2;
    return [
      S('Free the right end', 'Both ends are gripped. Free end B and give back what it held: a push R_B and a twist M_B.',
        [['Unknowns at B: R_B and M_B'], ['Conditions at B: slope = 0, deflection = 0']],
        { hide: ['sup1'], force: [{ x: L, label: 'R_B', dir: 'up' }], moments: [{ x: L, cw: true, side: -1, label: 'M_B' }] }),
      S('Free end under the load', 'As a cantilever, the tip tilts and drops.',
        [[isP ? 'θ₀ = Pa²/2EI' : 'θ₀ = wL³/6EI', '', c(th0, '/EI')], [isP ? 'δ₀ = Pa²(3L−a)/6EI' : 'δ₀ = wL⁴/8EI', '', c(d0, '/EI')]],
        { hide: ['sup1'], defl: { bm: cantBM, bc: 'cantilever-left', key: 'free', tip: { x: L, label: 'δ₀' }, tangent: { x: L, label: 'θ₀' } } }),
      S('Two conditions, two unknowns', 'R_B and M_B must cancel both the tilt and the drop.',
        [[`Slope: ${f(L * L / 2)}·R_B − ${f(L)}·M_B = ${f(th0)}`], [`Deflection: ${f(L ** 3 / 3)}·R_B − ${f(L * L / 2)}·M_B = ${f(d0)}`], ['Solve →', `R_B = ${A(r.RB, 'kN')}`, `M_B = ${A(r.MB, 'kN·m')}`]],
        { force: [{ x: L, label: `R_B = ${f(r.RB)}`, dir: 'up' }], moments: [{ x: L, cw: true, side: -1, label: `M_B = ${f(r.MB)}` }], defl: true, hl: ['sup1'] }),
      S('Back to statics', '',
        [['R_A = load − R_B', '', A(r.RA, 'kN')], ['M_A', isP ? 'Pab²/L²' : 'wL²/12', A(r.MA, 'kN·m')]],
        { react: [{ x: 0, label: `R_A = ${f(r.RA)}` }, { x: L, label: `R_B = ${f(r.RB)}` }], moments: [{ x: 0, cw: false, side: 1, label: `M_A = ${f(r.MA)}` }, { x: L, cw: true, side: -1, label: `M_B = ${f(r.MB)}` }] }),
      S('Bending moment diagram', 'Simple-beam moment minus the fixing-moment line.',
        [[isP ? 'Under load = Pab/L − (M_A·b + M_B·a)/L' : 'Mid span = wL²/8 − wL²/12', '', A(pr.answers[4].value, 'kN·m')]],
        { bmd: true, marks: [{ x: isP ? p.a : L / 2, label: f(pr.answers[4].value) }] }),
    ];
  };
  W['m2-three-moment'] = (pr) => {
    const p = pr.params, r = T.threeMoment2(p.L1, p.l1, p.L2, p.l2, p.left, 'pinned'); const L = p.L1 + p.L2;
    const free = (Lsp, ld, x) => ld.type === 'UDL' ? ld.w * x * (Lsp - x) / 2 : (x <= ld.a ? ld.P * (Lsp - ld.a) * x / Lsp : ld.P * ld.a * (Lsp - x) / Lsp);
    const f1 = (x) => (x <= p.L1 ? free(p.L1, p.l1, x) : 0), f2 = (x) => (x >= p.L1 ? free(p.L2, p.l2, x - p.L1) : 0);
    const fx = p.left === 'fixed';
    const mom = [{ x: 'B', cw: true, label: 'M_B' }].concat(fx ? [{ x: 'A', cw: false, side: 1, label: 'M_A' }] : []);
    return [
      S('Clapeyron\'s equation links 3 supports', 'Write one equation at each middle support. The end C is simple, so its moment is 0.',
        [['M_A·L₁ + 2M_B(L₁ + L₂) + M_C·L₂ = 6A₁x̄₁/L₁ + 6A₂x̄₂/L₂'], [fx ? 'A is fixed → add an imaginary zero span left of A' : 'A is pinned → M_A = 0'], ['M_C = 0']],
        { moments: mom, hl: ['sup1'] }),
      S('Each span as a simple beam', 'First pretend each span stands alone on two supports.',
        [['Span AB peak', p.l1.type === 'UDL' ? 'wL²/8' : 'Pab/L', c(T.freeBMArea(p.L1, p.l1).Mmax, 'kN·m')], ['Span BC peak', p.l2.type === 'UDL' ? 'wL²/8' : 'Pab/L', c(T.freeBMArea(p.L2, p.l2).Mmax, 'kN·m')]],
        { parts: [{ fn: f1, label: 'span AB' }, { fn: f2, label: 'span BC' }] }),
      S('The 6Ax̄/L terms', 'Area × distance of its centre (from A for span 1, from C for span 2). UDL shortcut: wL³/4.',
        [['Span AB (x̄ from A)', p.l1.type === 'UDL' ? `${g(p.l1.w)} × ${g(p.L1)}³ ÷ 4` : 'Pab(L+a)/L', c(r.R1L)], ['Span BC (x̄ from C)', p.l2.type === 'UDL' ? `${g(p.l2.w)} × ${g(p.L2)}³ ÷ 4` : 'Pab(L+a)/L', c(r.R2R)]].concat(fx ? [['Span AB (x̄ from B, for fixed A)', '', c(r.R1R)]] : []),
        { areas: [{ x1: 0, x2: p.L1, fn: f1, label: 'A₁', c: 0, cent: { ref: 0, label: 'x̄₁', row: 0 } }, { x1: p.L1, x2: L, fn: f2, label: 'A₂', c: 1, cent: { ref: L, label: 'x̄₂', row: 0 } }] }),
      S('Solve for the support moments', 'Put the numbers in and solve.',
        r.eqs.map((e) => [`${e.name}: ` + Object.entries(e.coef).map(([k, v]) => `${f(v)}·${k}`).join(' + ') + ` = ${f(e.rhs)}`]).concat([[fx ? `M_A = ${A(r.MA, 'kN·m')}` : '', `M_B = ${A(r.MB, 'kN·m')}`]]),
        { moments: [{ x: 'B', cw: true, label: `M_B = ${f(r.MB)}` }].concat(fx ? [{ x: 'A', cw: false, side: 1, label: `M_A = ${f(r.MA)}` }] : []) }),
      S('Reactions and final diagram', 'Simple reaction + correction from the end moments.',
        [['R_A', '', A(r.RA, 'kN')], ['R_B', '', A(r.RB, 'kN')], ['R_C', '', A(r.RC, 'kN')]],
        { bmd: true, react: [{ x: 0, label: f(r.RA) }, { x: 'B', label: f(r.RB) }, { x: L, label: f(r.RC) }] }),
    ];
  };

  /* -------------------------- MODULES 3 & 4 -------------------------- */
  function adapter(pr) {
    const isFrame = pr.scene.kind === 'frame'; const model = pr.model;
    const X = (id) => model.nodes.find((n) => n.id === id).x;
    return {
      isFrame,
      end(fr, mi, mj, node, val, label, row) { // moment arc at node end of member mi-mj
        if (isFrame) (fr.ends = fr.ends || []).push({ m: mi + mj, node, val, label, row });
        else { const far = node === mi ? mj : mi; (fr.moments = fr.moments || []).push({ x: node, cw: val >= 0, side: X(far) > X(node) ? 1 : -1, label, row }); }
      },
      rot(fr, node, label) { if (isFrame) (fr.rot = fr.rot || []).push({ node, label }); else (fr.rot = fr.rot || []).push({ x: node, label }); },
      share(fr, mKey, node, far, label, row) { if (isFrame) (fr.shares = fr.shares || []).push({ m: mKey, node, label }); else (fr.shares = fr.shares || []).push({ x: node, side: X(far) > X(node) ? 1 : -1, label, row }); },
      flow(fr, mKey, from, to, label) { if (isFrame) (fr.flows = fr.flows || []).push({ m: mKey, from, label }); else (fr.flows = fr.flows || []).push({ from, to, label }); },
    };
  }
  function femEq(m) {
    return m.fem.parts.length ? m.fem.parts.map((pt) => pt.kind === 'UDL'
      ? [`M<sub>F${m.i}${m.j}</sub> = −wL²/12`, `${g(pt.w)} × ${g(pt.L)}² ÷ 12`, `${c(pt.ij)} &nbsp;·&nbsp; M<sub>F${m.j}${m.i}</sub> = ${c(pt.ji)}`]
      : [`M<sub>F${m.i}${m.j}</sub> = −Pab²/L²`, `${g(pt.P)} × ${g(pt.a)} × ${g(pt.b)}² ÷ ${g(pt.L)}²`, `${c(pt.ij)} &nbsp;·&nbsp; M<sub>F${m.j}${m.i}</sub> = ${c(pt.ji)}`])[0] : [`Member ${m.i}${m.j}: no load → FEM = 0`];
  }
  function finalFrame(pr, ad) {
    const fr = { bmd: true };
    pr.sd.members.forEach((m) => { if (Math.abs(m.Mij) > 0.005) ad.end(fr, m.i, m.j, m.i, m.Mij, f(m.Mij)); if (Math.abs(m.Mji) > 0.005) ad.end(fr, m.i, m.j, m.j, m.Mji, f(m.Mji)); });
    return fr;
  }
  function reactStep(pr, ad) {
    if (ad.isFrame) return null;
    const R = {}; pr.sd.members.forEach((m) => { R[m.i] = (R[m.i] || 0) + m.Vi; R[m.j] = (R[m.j] || 0) + m.Vj; });
    return S('Support reactions', 'Each span: simple-beam share ± (end moments ÷ length). Add the two sides at each support.',
      pr.sd.members.map((m) => [`Span ${m.i}${m.j}: V = simple ∓ (M<sub>${m.i}${m.j}</sub> + M<sub>${m.j}${m.i}</sub>)/L`, `${c(m.Ri)} − (${c(m.Mij)} + ${c(m.Mji)}) ÷ ${g(m.L)}`, `${c(m.Vi)} · ${c(m.Vj)}`]).concat([[Object.entries(R).map(([k, v]) => `R<sub>${k}</sub> = ${A(v, 'kN')}`).join(' &nbsp; ')]]),
      { bmd: true, react: Object.entries(R).map(([k, v]) => ({ x: k, label: f(v) })) });
  }
  function sdWalk(pr) {
    const ad = adapter(pr), sd = pr.sd, dofs = sd.dofNodes, model = pr.model;
    const fixed = model.nodes.filter((n) => n.sup === 'fixed').map((n) => n.id);
    const steps = [];
    const f1 = { lock: fixed }; dofs.forEach((d) => ad.rot(f1, d, `θ${d}?`));
    steps.push(S('Which joints can twist?', 'Fixed supports cannot turn (locked). Every other joint can twist a little: those twists θ are our unknowns.',
      [[`Locked: ${fixed.join(', ') || 'none'} → θ = 0`], [`Unknown twists: ${dofs.map((d) => 'θ' + d).join(', ')}`]], f1));
    const f2 = { lock: model.nodes.map((n) => n.id), hl: sd.members.map((m) => 'load:' + m.i + m.j) }; if (!ad.isFrame) f2.hl = pr.scene.loads.map((_, i) => 'load' + i);
    sd.members.forEach((m) => { if (m.fem.Fij) ad.end(f2, m.i, m.j, m.i, m.fem.Fij, f(m.fem.Fij)); if (m.fem.Fji) ad.end(f2, m.i, m.j, m.j, m.fem.Fji, f(m.fem.Fji)); });
    steps.push(S('Fixed end moments', 'Imagine every joint clamped. Each loaded span pushes on its ends: clockwise is +, anticlockwise is −.', sd.members.map(femEq), f2));
    const expr = (m, end) => { const i = end === 'i' ? m.i : m.j, j = end === 'i' ? m.j : m.i; let s = f(end === 'i' ? m.fem.Fij : m.fem.Fji); if (dofs.includes(i)) s += ` + ${f(2 * m.c)}·EIθ${i}`; if (dofs.includes(j)) s += ` + ${f(m.c)}·EIθ${j}`; return s; };
    const f3 = {}; dofs.forEach((d) => ad.rot(f3, d, 'θ' + d));
    steps.push(S('Slope deflection equation for each end', 'End moment = fixed end moment + extra from the joints twisting. Formula: M = M_F + (2EI/L)(2θnear + θfar).',
      sd.members.map((m) => [`M<sub>${m.i}${m.j}</sub> = ${expr(m, 'i')}`, `M<sub>${m.j}${m.i}</sub> = ${expr(m, 'j')}`]), f3));
    const f4 = { tag: 'ΣM = 0 at each free joint' };
    dofs.forEach((d) => sd.members.forEach((m) => { if (m.i === d) ad.end(f4, m.i, m.j, d, 1, `M${m.i}${m.j}`); if (m.j === d) ad.end(f4, m.i, m.j, d, 1, `M${m.j}${m.i}`); }));
    steps.push(S('Each free joint must balance', 'A free joint cannot keep spinning, so the moments meeting there add up to zero.',
      dofs.map((d, r) => [`Joint ${d}: ` + sd.members.filter((m) => m.i === d || m.j === d).map((m) => `M<sub>${m.i === d ? m.i + m.j : m.j + m.i}</sub>`).join(' + ') + ' = 0', dofs.map((e, k) => `${f(sd.K[r][k])}·EIθ${e}`).join(' + ') + ` = ${f(sd.F[r])}`]), f4));
    const f5 = {}; dofs.forEach((d) => ad.rot(f5, d, `EIθ${d} = ${f(sd.theta[d], 2)}`)); f5.defl = true;
    steps.push(S('Solve the twists', 'Solve the joint equations together (like simultaneous equations).', [[dofs.map((d) => `EIθ<sub>${d}</sub> = ${A(sd.theta[d], '', 3)}`).join(' &nbsp; ')]], f5));
    steps.push(S('Final end moments', 'Put the twists back into the equations. This is the answer; the diagram shows the final bending moments.',
      sd.members.map((m) => [`M<sub>${m.i}${m.j}</sub> = ${A(m.Mij)}`, `M<sub>${m.j}${m.i}</sub> = ${A(m.Mji)}`]), finalFrame(pr, ad)));
    const rs = reactStep(pr, ad); if (rs) steps.push(rs);
    return steps;
  }
  function mdWalk(pr) {
    const ad = adapter(pr), md = pr.md, sd = pr.sd, model = pr.model;
    const steps = [];
    const joints = md.joints.map((j) => j.node);
    const f1 = { lock: model.nodes.filter((n) => n.sup !== 'fixed').map((n) => n.id) };
    sd.members.forEach((m) => { if (m.fem.Fij) ad.end(f1, m.i, m.j, m.i, m.fem.Fij, f(m.fem.Fij)); if (m.fem.Fji) ad.end(f1, m.i, m.j, m.j, m.fem.Fji, f(m.fem.Fji)); });
    steps.push(S('Lock every joint', 'With all joints locked, each loaded span pushes on its ends with a fixed end moment.', sd.members.map(femEq), f1));
    const f2 = {};
    md.joints.forEach((j) => j.cols.forEach((k) => { const cl = md.cols[k]; ad.share(f2, cl.m.i + cl.m.j, cl.node, cl.far, `DF ${f(cl.DF, 3)}`); }));
    steps.push(S('Who takes how much? (distribution factor)', 'A stiffer member (short, thick, far end fixed) takes a bigger share. Share = k ÷ total k.',
      md.joints.map((j) => [`Joint ${j.node}`, j.cols.map((k) => { const cl = md.cols[k]; return `k<sub>${cl.key}</sub> = ${cl.farPinned ? '3' : '4'}×${trim(cl.m.I || 1)}/${trim(cl.m.L)}`; }).join(' · '), j.cols.map((k) => `DF<sub>${md.cols[k].key}</sub> = ${A(md.cols[k].DF, '', 3)}`).join(' · ')]), f2));
    let ri = 1; let cycleShown = 0; let running = md.cols.map((_, k) => md.rows[0].vals[k]);
    const addRow = (r) => r.vals.forEach((v, k) => (running[k] += v));
    while (ri < md.rows.length) {
      const row = md.rows[ri];
      if (row.label === 'Release simple end') {
        const fr = { unlock: md.endJoints };
        row.vals.forEach((v, k) => { if (Math.abs(v) > 1e-9) ad.share(fr, md.cols[k].m.i + md.cols[k].m.j, md.cols[k].node, md.cols[k].far, `${v > 0 ? '+' : ''}${f(v)}`, 0); });
        const co = md.rows[ri + 1]; co.vals.forEach((v, k) => { if (Math.abs(v) > 1e-9) { const cl = md.cols[k]; ad.flow(fr, cl.m.i + cl.m.j, cl.far, cl.node, `½ → ${f(v)}`); } });
        steps.push(S('Release the simple end', 'A simply supported end cannot hold a moment, so set it free (cancel its FEM) and pass half to the other end.',
          [[`End ${md.endJoints.join(', ')}: cancel FEM`, 'carry ½ to the far end', '']], fr));
        addRow(row); addRow(co); ri += 2; continue;
      }
      if (row.kind === 'bal' && cycleShown < 2) {
        cycleShown++;
        const fr = { unlock: joints };
        const eq = md.joints.map((j) => { const unb = j.cols.reduce((s, k) => s + running[k], 0); return [`Joint ${j.node}: unbalanced = ${f(unb)}`, `each end gets −(${f(unb)}) × DF`, j.cols.map((k) => `${md.cols[k].key}: ${c(row.vals[k])}`).join(' · ')]; });
        row.vals.forEach((v, k) => { if (Math.abs(v) > 1e-9) ad.share(fr, md.cols[k].m.i + md.cols[k].m.j, md.cols[k].node, md.cols[k].far, `${v > 0 ? '+' : ''}${f(v)}`); });
        steps.push(S(`Round ${cycleShown}: unlock and balance`, 'Unlock the joint: it turns until the moments around it cancel. Each member takes its DF share of the extra moment.', eq, fr));
        addRow(row);
        const co = md.rows[ri + 1];
        if (co) {
          const fr2 = { lock: joints };
          co.vals.forEach((v, k) => { if (Math.abs(v) > 1e-9) { const cl = md.cols[k]; ad.flow(fr2, cl.m.i + cl.m.j, cl.far, cl.node, `${f(v)}`); } });
          steps.push(S(`Round ${cycleShown}: carry half across`, 'Lock again. Half of each share travels to the other end of its member (zero if that end is simply supported).',
            [['Carry over = ½ × balance'], [co.vals.map((v, k) => (Math.abs(v) > 1e-9 ? `${md.cols[k].key}: ${c(v)}` : '')).filter(Boolean).join(' · ')]], fr2));
          addRow(co);
        }
        ri += 2; continue;
      }
      break;
    }
    const table = (() => {
      const head = md.cols.map((cl) => `<th>${cl.key}</th>`).join('');
      const rows = md.rows.map((r) => `<tr class="${r.kind || ''}"><th>${r.label}</th>${r.vals.map((v) => `<td>${Math.abs(v) < 5e-4 ? '' : f(v)}</td>`).join('')}</tr>`).join('');
      return `<div class="tbl"><table class="mdm"><thead><tr><th></th>${head}</tr></thead><tbody><tr class="df"><th>DF</th>${md.cols.map((cl) => `<td>${cl.DF ? f(cl.DF, 3) : '0'}</td>`).join('')}</tr>${rows}<tr class="final"><th>Final</th>${md.final.map((v) => `<td><b>${f(v)}</b></td>`).join('')}</tr></tbody></table></div>`;
    })();
    steps.push(S('Repeat until the numbers are tiny', 'Keep balancing and carrying over. Each round is smaller. Then add every column from top to bottom.', [[`${md.rows.filter((r) => r.kind === 'bal').length} rounds until below 0.01 kN·m`]], { lock: [], defl: true }, table));
    steps.push(S('Final moments', 'The column totals are the answers. The diagram shows the final bending moments.',
      md.cols.filter((cl, k) => Math.abs(md.final[k]) > 0.005).map((cl) => { const k = md.cols.indexOf(cl); return [`M<sub>${cl.key}</sub>`, '', A(md.final[k])]; }), finalFrame(pr, ad)));
    const rs = reactStep(pr, ad); if (rs) steps.push(rs);
    if (pr.params.kind === 'portal') {
      const col = sd.members[0], beam = sd.members[1];
      steps.push(S('Support reactions of the portal', 'The beam passes its end shear down each column. The column moments give the sideways kick at the feet.',
        [['V_A = shear of beam at B', `${c(beam.Ri)} − (${c(beam.Mij)} + ${c(beam.Mji)}) ÷ ${g(beam.L)}`, A(beam.Vi, 'kN')], ['H_A from column AB', `${c(col.Ri)} − (${c(col.Mij)} + ${c(col.Mji)}) ÷ ${g(col.L)}`, A(Math.abs(col.Vi), 'kN')]], { bmd: true }));
    }
    return steps;
  }
  W['m3-beam'] = sdWalk; W['m3-frame'] = (pr) => { const s = sdWalk(pr); if (pr.params.kind === 'portal') { const col = pr.sd.members[0], beam = pr.sd.members[1]; s.push(S('Support reactions of the portal', 'The beam passes its end shear down each column; the column moments give the sideways kick at the feet.', [['V_A = shear of beam at B', `${c(beam.Ri)} − (${c(beam.Mij)} + ${c(beam.Mji)}) ÷ ${g(beam.L)}`, A(beam.Vi, 'kN')], ['H_A from column AB', `${c(col.Ri)} − (${c(col.Mij)} + ${c(col.Mji)}) ÷ ${g(col.L)}`, A(Math.abs(col.Vi), 'kN')]], { bmd: true })); } return s; };
  W['m4-beam'] = mdWalk; W['m4-frame'] = mdWalk;

  W['m4-df'] = (pr) => {
    const mem = pr.scene.mem; const sum = mem.reduce((s, m) => s + m.k, 0);
    return [
      S('Stiffness of each member', 'Far end gripped (fixed) → harder to turn: 4EI/L. Far end hinged → easier: 3EI/L. The bars show the ratio.',
        mem.map((m) => [`k<sub>${m.name}</sub> = ${m.far === 'fixed' ? '4EI/L' : '3EI/L'}`, `${m.far === 'fixed' ? 4 : 3} × ${trim(m.I)} ÷ ${trim(m.L)}`, c(m.k, 'EI')]), { k: true }),
      S('Share = k ÷ total', 'Each member\'s share of the moment is its stiffness divided by the total. All shares add to 1.',
        [['Σk', '', c(sum, 'EI')]].concat(mem.map((m) => [`DF<sub>${m.name}</sub> = k ÷ Σk`, `${c(m.k)} ÷ ${c(sum)}`, A(m.DF, '', 3)])), { df: true }),
    ];
  };

  /* ----------------------------- MODULE 5 ----------------------------- */
  function archWalk(pr) {
    const sc = pr.scene, r = sc.r, p = pr.params, L = p.L;
    const momA = sc.loads.map((l) => l.type === 'P' ? `${g(l.P)}×${g(l.x)}` : `${g(l.w)}×${g(l.x2 - l.x1)}×${g((l.x1 + l.x2) / 2)}`).join(' + ');
    const out = [
      S('Why an arch needs H', 'An arch pushes its feet outwards, like legs doing the splits. The supports push back inwards: that push is H.',
        [['Unknowns: V_A, V_B, H'], ['Extra rule: moment at the top hinge C = 0']], { H: 'H', crown: 'hinge: M = 0' }),
      S('Vertical reactions (like a simple beam)', 'Take moments about A: V_B × span balances the loads.',
        [['V_B × L = Σ(load × distance from A)', `V_B × ${g(L)} = ${momA}`, 'V_B = ' + A(r.VB, 'kN')], ['V_A = total load − V_B', `${c(r.W)} − ${c(r.VB)}`, A(r.VA, 'kN')]],
        { react: [`V_A = ${f(r.VA)}`, `V_B = ${f(r.VB)}`], loadDims: sc.loads.filter((l) => l.type === 'P').map((l) => ({ x: l.x, label: `${trim(l.x)} m` })) }),
      S('Thrust H from the top hinge', 'At hinge C the arch cannot bend, so (beam moment at C) − H × rise = 0.',
        [['H = beam moment at crown ÷ rise', `${c(r.Mc)} ÷ ${g(p.h)}`, A(r.H, 'kN')]], { H: `H = ${f(r.H)}`, crown: 'M = 0', rise: `h = ${trim(p.h)} m` }),
    ];
    if (p.ask === 'react') {
      out.push(S('Total reaction = Pythagoras', 'Join the sideways push H and the up push V into one slanted force.',
        [['R_A = √(V_A² + H²)', `√(${c(r.VA)}² + ${c(r.H)}²)`, A(r.RA, 'kN')], ['R_B = √(V_B² + H²)', `√(${c(r.VB)}² + ${c(r.H)}²)`, A(r.RB, 'kN')]],
        { vectri: `R_A = ${f(r.RA)}`, react: [`V_A`, `V_B`], H: 'H' }));
      return out;
    }
    const sL = r.at(p.xs, 'left'), sR = r.at(p.xs, 'right'); const onLoad = Math.abs(sR.V - sL.V) > 1e-9;
    out.push(S(`Height and steepness at x = ${trim(p.xs)} m`, 'How high is the arch there, and how steep is it?',
      sc.shape === 'parabolic' ? [['y = 4hx(L − x)/L²', `4×${g(p.h)}×${g(p.xs)}×(${g(L)} − ${g(p.xs)}) ÷ ${g(L)}²`, c(sL.y, 'm')], ['tanθ = 4h(L − 2x)/L²', '', `θ = ${c(T.deg(sL.theta))}°`]]
        : [['Radius R = (L²/4 + h²)/2h', `(${g(L)}²/4 + ${g(p.h)}²) ÷ (2×${g(p.h)})`, c(r.R, 'm')], ['y = √(R² − (L/2 − x)²) − (R − h)', '', c(sL.y, 'm')], ['sinθ = (L/2 − x)/R', '', `θ = ${c(T.deg(sL.theta))}°`]],
      { section: { x: p.xs, y: `y = ${f(sL.y)}`, theta: `θ = ${f(T.deg(sL.theta), 1)}°` } }));
    out.push(S('Bending moment = beam moment − H × y', 'H cancels most of the beam moment. The small leftover (shaded gap) is all the arch has to resist.',
      [['M = M_beam − H·y', `${c(sL.Mb)} − ${c(r.H)} × ${c(sL.y)}`, A(sL.M, 'kN·m')]], { beamM: { x: p.xs, label: `M = ${f(sL.M)}` }, section: { x: p.xs } }));
    out.push(S('Thrust along, shear across', 'Split the forces at the cut: one part along the arch (normal thrust N), one part across it (radial shear S).',
      [['V (net vertical force)', '', c(sL.V, 'kN') + (onLoad ? ` (just right: ${f(sR.V)})` : '')], ['N = V sinθ + H cosθ', '', A(sL.N, 'kN') + (onLoad ? ` · right: ${f(sR.N)}` : '')], ['S = V cosθ − H sinθ', '', A(sL.S, 'kN') + (onLoad ? ` · right: ${f(sR.S)}` : '')]],
      { section: { x: p.xs, NS: [`N = ${f(sL.N)}`, `S = ${f(sL.S)}`] }, focus: [Math.max(0, p.xs - L * 0.3), Math.min(L, p.xs + L * 0.3)] }));
    return out;
  }
  W['m5-parabolic'] = archWalk; W['m5-circular'] = archWalk;

  W['m5-cable-points'] = (pr) => {
    const r = pr.scene.r, p = pr.params; const known = r.pts[p.known + 1];
    const others = r.pts.slice(1, -1);
    return [
      S('A cable hangs in the shape of the moment diagram', 'General cable theorem: H × dip = moment of a simple beam with the same loads.',
        [['H · y = M'], ['H is the same everywhere along the cable']], { beamBM: true }),
      S('Vertical reactions', 'Same as a simple beam: moments about the left support.',
        [['V_right × L = Σ load × distance', `V × ${g(p.L)} = ${p.pts.map((q) => `${g(q.P)}×${g(q.x)}`).join(' + ')}`, A(r.VB, 'kN')], ['V_left = total − V_right', `${c(r.W)} − ${c(r.VB)}`, A(r.VA, 'kN')]],
        { react: [f(r.VA), f(r.VB)] }),
      S('Pull H from the known dip', `We know the dip at ${known.name}, so H = moment ÷ dip.`,
        [[`H = M<sub>${known.name}</sub> ÷ y<sub>${known.name}</sub>`, `${c(r.Mk)} ÷ ${g(p.y)}`, A(r.H, 'kN')]], { dips: [{ name: known.name, label: `${trim(p.y)} m`, known: true }], H: `H = ${f(r.H)}`, hl: [known.name] }),
      S('Dips at the other points', 'Same H everywhere: dip = moment ÷ H.',
        others.map((q) => [`y<sub>${q.name}</sub> = M ÷ H`, `${c(q.M)} ÷ ${c(r.H)}`, A(q.y, 'm', 3)]), { dips: others.map((q) => ({ name: q.name, label: `${f(q.y, 3)} m`, known: q === known })) }),
      ...r.segs.map((s, k) => S(`Tension in piece ${s.from}${s.to}`, k === 0 ? 'Each straight piece is the long side of a small triangle (dx across, dy down). Tension = H × length ÷ dx. Steeper piece → bigger tension.' : 'Same rule for this piece: H × length ÷ dx.',
        [['Length = √(dx² + dy²)', `√(${f(s.dx)}² + ${f(Math.abs(s.dy), 3)}²)`, c(s.len, 'm')], [`T<sub>${s.from}${s.to}</sub> = H × length ÷ dx`, `${c(r.H)} × ${f(s.len, 3)} ÷ ${f(s.dx)}`, A(s.T, 'kN')]],
        { segs: [k], focus: [r.pts[k].x, r.pts[k + 1].x] })),
      S('Total length', 'Add up the straight pieces (Pythagoras for each).',
        [[r.segs.map((s) => `${s.from}${s.to} = √(${f(s.dx)}² + ${f(Math.abs(s.dy), 3)}²) = ${f(s.len, 3)}`).join('<br>'), '', 'Total = ' + A(r.length, 'm', 3)]], { segs: r.segs.map((_, k) => k), segLabel: (s) => `${f(s.len, 3)} m` }),
    ];
  };
  W['m5-cable-udl'] = (pr) => {
    const p = pr.params, r = pr.scene.r, b = p.beta * Math.PI / 180; const an = T.anchorCable(r.Tmax, r.theta, b, p.hp);
    return [
      S('Shape of the cable: a parabola', 'Take moments of the left part about a point x along: H·y = (wL/2)x − wx²/2. At mid span y = d.',
        [['y = wx(L − x) / 2H'], ['At centre y = d → H = wL²/8d'], ['So y = 4dx(L − x)/L²']], { dip: `d = ${trim(p.d)} m`, cut: { x: p.L * 0.3, label: 'y' } }),
      S('Horizontal pull H', 'A smaller dip means a much bigger pull. That is why a tight washing line snaps.',
        [['H = wL² / 8d', `${g(p.w)} × ${g(p.L)}² ÷ (8 × ${g(p.d)})`, A(r.H, 'kN')]], { H: `H = ${f(r.H)}`, dip: `d = ${trim(p.d)} m` }),
      S('Biggest pull at the supports', 'At the support the cable carries H sideways and half the load upwards. Combine with Pythagoras.',
        [['V = wL/2', `${g(p.w)} × ${g(p.L)} ÷ 2`, c(r.V, 'kN')], ['T<sub>max</sub> = √(H² + V²)', `√(${c(r.H)}² + ${c(r.V)}²)`, A(r.Tmax, 'kN')]], { vectri: `T = ${f(r.Tmax)}` }),
      S('Length of cable', '',
        [['S ≈ L + 8d²/3L', `${g(p.L)} + 8 × ${g(p.d)}² ÷ (3 × ${g(p.L)})`, A(r.length, 'm', 3)]], { dip: `d = ${trim(p.d)} m` }),
      S('(a) Over a guide pulley', 'A pulley spins freely, so the pull is the same on both sides. The angles differ, so the pier is pushed sideways and bends.',
        [['Vertical = T(sinα + sinβ)', `${c(r.Tmax)} × (${f(Math.sin(r.theta), 3)} + ${f(Math.sin(b), 3)})`, A(an.pulley.V, 'kN')], ['BM at base = T(cosα − cosβ) × h', `${c(an.pulley.Hnet)} × ${g(p.hp)}`, A(an.pulley.Mbase, 'kN·m')]], { pier: 'pulley', pierV: `V = ${f(an.pulley.V)}` }),
      S('(b) On a saddle with rollers', 'Rollers cannot hold sideways force, so the sideways pulls must be equal. The pier is only pushed straight down.',
        [['T₂ = T₁ cosα / cosβ', `${c(r.Tmax)} × ${f(Math.cos(r.theta), 3)} ÷ ${f(Math.cos(b), 3)}`, A(an.saddle.T2, 'kN')], ['Vertical = T₁ sinα + T₂ sinβ', '', A(an.saddle.V, 'kN')]], { pier: 'saddle', pierV: `V = ${f(an.saddle.V)}` }),
    ];
  };

  window.WALKS = W;
})();
