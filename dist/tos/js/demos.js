/* =====================================================================
   Animated illustrations for every theory card (Learn tab).
   DEMOS[module][sectionIndex] = () => ({ scene, frames: [{...vis, cap}] })
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  const f = (x, d = 2) => T.fmt(x, d);
  const pos = (x) => Math.max(0, x);
  const beam = (L, sups, loads, bm, bc, names) => ({ kind: 'beam', L, supports: sups, loads, names: names || [[0, 'A'], [L, 'B']], bm, sf: () => 0, bc: bc || 'ss', EI: () => 1 });
  const cantP = (L, P) => beam(L, [{ x: 0, type: 'fixed' }], [{ type: 'P', x: L, P, label: `${P} kN` }], (x) => -P * (L - x), 'cantilever-left');
  const cantW = (L, w) => beam(L, [{ x: 0, type: 'fixed' }], [{ type: 'UDL', x1: 0, x2: L, w, label: `${w} kN/m` }], (x) => -w * (L - x) ** 2 / 2, 'cantilever-left');
  const ssP = (L, P) => beam(L, [{ x: 0, type: 'pin' }, { x: L, type: 'roller' }], [{ type: 'P', x: L / 2, P, label: `${P} kN` }], (x) => P * Math.min(x, L - x) / 2, 'ss', [[0, 'A'], [L / 2, 'C'], [L, 'B']]);
  const ssW = (L, w) => beam(L, [{ x: 0, type: 'pin' }, { x: L, type: 'roller' }], [{ type: 'UDL', x1: 0, x2: L, w, label: `${w} kN/m` }], (x) => w * x * (L - x) / 2);
  const fromWalk = (gen, params, pick) => () => { const pr = window.makeProblem(gen, params); let st = window.WALKS[gen](pr); if (pick) st = pick(st); return { scene: pr.scene, frames: st.map((s) => Object.assign({}, s.vis, { cap: `<b>${s.t}.</b> ${s.say || ''}` })) }; };

  const D = {
    1: [
      () => ({ scene: cantP(4, 20), frames: [{ cap: 'A cantilever: held by a wall at A, free at B.' }, { defl: { tip: { x: 4, label: 'δ' } }, cap: 'Load it: end B moves down. That distance is the <b>deflection δ</b>.' }, { defl: { tangent: { x: 4, label: 'θ' } }, cap: 'End B also tilts. That angle is the <b>slope θ</b> (in radians).' }] }),
      () => ({ scene: { kind: 'section' }, frames: [{ d: 1, cap: 'Two beams with the same width b and the same depth d have the same stiffness.' }, { d: 1.5, cap: 'Make one 1.5× deeper → I = bd³/12 grows 1.5³ = 3.4×.' }, { d: 2, cap: 'Make it 2× deeper → it is <b>8× stiffer</b> and bends 8× less. Depth matters most.' }] }),
      () => { const L = 4, P = 20; return { scene: cantP(L, P), frames: [
        { parts: [{ fn: (x) => P * (L - x), label: 'M = P(L − x)' }], cap: 'Draw the bending moment diagram, divided by EI.' },
        { areas: [{ x1: 0, x2: L, fn: (x) => P * (L - x), label: 'area A' }], defl: { tangent: { x: L, label: 'θ' } }, cap: '<b>Mohr I:</b> the area of M/EI between two points = the change in slope.' },
        { areas: [{ x1: 0, x2: L, fn: (x) => P * (L - x), label: 'A', cent: { ref: L, label: 'x̄ from B', row: 0 } }], cap: 'Find the balance point (centroid) of the area, measured from B.' },
        { areas: [{ x1: 0, x2: L, fn: (x) => P * (L - x), label: 'A', cent: { ref: L, label: 'x̄', row: 0 } }], defl: { tip: { x: L, label: 'δ = A·x̄/EI' } }, cap: '<b>Mohr II:</b> area × distance = deflection of B from the tangent at A.' }] }; },
      () => { const L = 4, P = 20; return { scene: cantP(L, P), frames: [
        { cap: 'The real beam: fixed at A, free at B.', hl: ['sup0'] },
        { sups: [{ x: L, type: 'fixed', right: true }], tag: 'Twin (conjugate) beam', cap: 'The twin: supports swapped. Free at A, fixed at B.' },
        { sups: [{ x: L, type: 'fixed', right: true }], areas: [{ x1: 0, x2: L, fn: (x) => P * (L - x), label: 'M/EI as load' }], cap: 'Load the twin with the M/EI diagram.' },
        { areas: [{ x1: 0, x2: L, fn: (x) => P * (L - x), label: 'load' }], defl: { tip: { x: L, label: 'moment = δ' }, tangent: { x: L, label: 'shear = θ' } }, cap: 'Shear in the twin = slope. Moment in the twin = deflection.' }] }; },
      () => ({ scene: cantP(4, 20), frames: [
        { areas: [{ x1: 0, x2: 4, fn: (x) => 20 * (4 - x), label: '½ b h', cent: { ref: 4, label: '2b/3 from apex', row: 0 } }], cap: 'Triangle (point load): area = ½ × base × height; centroid at ⅓ of the base from the tall side.' },
        { scene: cantW(4, 10), areas: [{ x1: 0, x2: 4, fn: (x) => 10 * (4 - x) ** 2 / 2, label: '⅓ b h', cent: { ref: 4, label: '3b/4 from apex', row: 0 } }], cap: 'Spandrel (UDL on cantilever): area = ⅓ × base × height; centroid at ¾ of the base from the apex.' },
        { scene: ssW(6, 10), areas: [{ x1: 0, x2: 6, fn: (x) => 10 * x * (6 - x) / 2, label: '⅔ b h', cent: { ref: 0, label: 'b/2', row: 0 } }], cap: 'Parabola (UDL on simple beam): area = ⅔ × base × height; centroid at the middle.' }] }),
      () => ({ scene: cantP(4, 20), frames: [
        { defl: { tip: { x: 4, label: 'PL³/3EI' }, tangent: { x: 4, label: 'PL²/2EI' } }, cap: 'Cantilever, load P at the end.' },
        { scene: cantW(4, 10), defl: { tip: { x: 4, label: 'wL⁴/8EI' }, tangent: { x: 4, label: 'wL³/6EI' } }, cap: 'Cantilever, full UDL w.' },
        { scene: ssP(6, 20), defl: { tip: { x: 3, label: 'PL³/48EI' }, tangent: { x: 0, label: 'PL²/16EI' } }, cap: 'Simply supported beam, central load P.' },
        { scene: ssW(6, 10), defl: { tip: { x: 3, label: '5wL⁴/384EI' }, tangent: { x: 0, label: 'wL³/24EI' } }, cap: 'Simply supported beam, full UDL w.' }] }),
    ],
    2: [
      () => ({ scene: ssW(6, 10), frames: [
        { react: [{ x: 0, label: 'R_A' }, { x: 6, label: 'R_B' }], tag: '3 unknowns, 3 equations → Ds = 0', cap: 'Simple beam: statics alone finds every reaction. <b>Determinate.</b>' },
        { scene: beam(6, [{ x: 0, type: 'fixed' }, { x: 6, type: 'roller' }], [{ type: 'UDL', x1: 0, x2: 6, w: 10, label: '10 kN/m' }], (x) => -45 + 37.5 * x - 5 * x * x), react: [{ x: 0, label: 'R_A' }, { x: 6, label: 'R_B' }], moments: [{ x: 0, cw: false, side: 1, label: 'M_A' }], tag: '4 unknowns, 3 equations → Ds = 1', cap: 'Add a prop: one unknown too many. <b>Indeterminate</b>, degree 1.' }] }),
      () => ({ scene: beam(6, [{ x: 0, type: 'fixed' }, { x: 6, type: 'fixed', right: true }], [{ type: 'UDL', x1: 0, x2: 6, w: 10, label: '10 kN/m' }], (x) => -30 + 30 * x - 5 * x * x), frames: [
        { react: [{ x: 0, label: 'V_A' }, { x: 6, label: 'V_B' }], moments: [{ x: 0, cw: false, side: 1, label: 'M_A' }, { x: 6, cw: true, side: -1, label: 'M_B' }], tag: 'r = 6 (H, V, M at each end) → Ds = 6 − 3 = 3', cap: 'Fixed beam: each end gives H, V and M. Ds = r − 3 = 3.' }] }),
      () => ({ scene: cantP(4, 20), frames: [
        { lock: [0], force: [{ x: 4, label: 'moves ↓', dir: 'down' }], rot: [{ x: 4, label: 'turns' }], tag: 'free end: u, v, θ → Dk = 3', cap: 'Kinematic indeterminacy = how many ways the joints can still move. A free end can slide, drop and turn: Dk = 3.' },
        { scene: beam(6, [{ x: 0, type: 'fixed' }, { x: 6, type: 'fixed', right: true }], [{ type: 'UDL', x1: 0, x2: 6, w: 10, label: '10 kN/m' }], (x) => -30 + 30 * x - 5 * x * x), lock: [0, 6], tag: 'Dk = 0', cap: 'A fixed beam: no joint can move at all → Dk = 0 (but Ds = 3).' }] }),
      () => ({ scene: beam(6, [{ x: 0, type: 'fixed' }, { x: 6, type: 'roller' }], [{ type: 'UDL', x1: 0, x2: 6, w: 10, label: '10 kN/m' }], (x) => -45 + 37.5 * x - 5 * x * x), frames: [
        { hide: ['sup1'], force: [{ x: 6, label: 'unknown FORCE', dir: 'up' }], tag: 'Force method', cap: '<b>Force method:</b> remove a support and find the force it must push with.' },
        { rot: [{ x: 6, label: 'unknown TWIST' }], defl: true, tag: 'Displacement method', cap: '<b>Displacement method:</b> find how much the joints twist; the forces follow.' }] }),
      () => { const L = 6, w = 10, r = T.proppedUDL(L, w); return { scene: beam(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'roller' }], [{ type: 'UDL', x1: 0, x2: L, w, label: '10 kN/m' }], (x) => -r.MA + r.RA * x - w * x * x / 2), frames: [
        { defl: true, cap: 'A propped cantilever. How hard does the prop push?' },
        { hide: ['sup1'], defl: { bm: (x) => -w * (L - x) ** 2 / 2, bc: 'cantilever-left', key: 'f', tip: { x: L, label: 'δ₁ = wL⁴/8EI' } }, cap: 'Take the prop away: the tip drops δ₁.' },
        { hide: ['sup1'], force: [{ x: L, label: 'R_B', dir: 'up' }], defl: { bm: (x) => (L - x), bc: 'cantilever-left', key: 'r', tip: { x: L, label: 'δ₂ = R_B L³/3EI' } }, cap: 'Push the tip up with the prop force alone: it rises δ₂.' },
        { defl: true, hl: ['sup1'], tag: 'δ₁ = δ₂ → R_B = 3wL/8', cap: 'The real prop does not move, so δ₁ = δ₂. That one equation gives R_B.' }] }; },
      () => { const pr = window.makeProblem('m2-three-moment', { L1: 5, l1: { type: 'UDL', w: 20 }, L2: 4, l2: { type: 'P', P: 40, a: 2 }, left: 'pinned' }); return { scene: pr.scene, frames: [
        { moments: [{ x: 'B', cw: true, label: 'M_B' }], cap: 'Three supports in a row: A, B, C. The unknown is the moment over B.' },
        { parts: [{ fn: (x) => (x <= 5 ? 20 * x * (5 - x) / 2 : 0), label: 'free BM AB' }, { fn: (x) => (x >= 5 ? 40 * Math.min(x - 5, 9 - x) / 2 : 0), label: 'free BM BC' }], cap: 'Pretend each span is a simple beam and draw its free moment.' },
        { bmd: true, moments: [{ x: 'B', cw: true, label: `M_B = ${f(pr.answers[0].value)}` }], cap: 'Clapeyron\'s equation gives M_B. The final diagram = free moment − support moment line.' }] }; },
    ],
    3: [
      () => { const pr = window.makeProblem('m3-beam', { spans: [{ L: 5, I: 1, load: { type: 'UDL', w: 20 } }, { L: 4, I: 1, load: { type: 'P', P: 40, a: 2 } }], left: 'fixed', right: 'fixed' }); return { scene: pr.scene, frames: [{ lock: ['A', 'C'], cap: 'Fixed ends A and C cannot turn.' }, { rot: [{ x: 'B', label: 'θB' }], defl: true, cap: 'Joint B can twist a little. Find θ<sub>B</sub> and every moment follows.' }] }; },
      () => { const L = 6, P = 30, a = 2, r = T.fixedPoint(L, P, a); return { scene: beam(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'fixed', right: true }], [{ type: 'P', x: a, P, label: '30 kN' }], (x) => -r.MA + r.RA * x - (x > a ? P * (x - a) : 0)), frames: [
        { moments: [{ x: 0, cw: false, side: 1, label: 'M_F (load alone)' }], cap: '<b>M_F</b>: fixed end moment from the load, with both ends locked.' },
        { rot: [{ x: 0, label: '2θA' }, { x: L, label: 'θB' }], cap: '<b>(2EI/L)(2θ<sub>near</sub> + θ<sub>far</sub>)</b>: extra moment when the ends twist.' },
        { defl: true, tag: 'M = M_F + (2EI/L)(2θA + θB − 3Δ/L)', cap: 'Δ is sideways movement (sway). In our syllabus Δ = 0.' }] }; },
      () => { const L = 6, P = 30, a = 2, r = T.fixedPoint(L, P, a); return { scene: beam(L, [{ x: 0, type: 'fixed' }, { x: L, type: 'fixed', right: true }], [{ type: 'P', x: a, P, label: '30 kN' }], (x) => -r.MA + r.RA * x - (x > a ? P * (x - a) : 0)), frames: [
        { moments: [{ x: 0, cw: false, side: 1, label: `−Pab²/L² = ${f(-r.MA)}` }, { x: L, cw: true, side: -1, label: `+Pa²b/L² = ${f(r.MB)}` }], dims: [{ x1: 0, x2: a, label: 'a' }, { x1: a, x2: L, label: 'b', c: 2 }], cap: 'Clockwise = +, anticlockwise = −. Left end of a loaded span is −, right end is +.' }] }; },
      fromWalk('m3-beam', { spans: [{ L: 4.4, I: 1, load: { type: 'UDL', w: 18 } }, { L: 5.6, I: 1, load: { type: 'P', P: 25, a: 3 } }], left: 'fixed', right: 'fixed' }),
      () => { const pr = window.makeProblem('m3-frame', { kind: 'T', L1: 4, P1: 100, L2: 5, P2: 100, h: 3 }); return { scene: pr.scene, frames: [{ cap: 'A rigid joint: the members are welded together.' }, { defl: true, rot: [{ node: 'B', label: 'all turn together' }], cap: 'The joint turns as one piece: the angle between members stays 90°.' }] }; },
      () => { const pr = window.makeProblem('m3-frame', { kind: 'portal', h: 4, L: 6, w: 10, Pc: 0, Ic: 1, Ib: 1 }); return { scene: pr.scene, frames: [{ defl: true, tag: 'symmetric → no sway', cap: 'Symmetric frame + symmetric load: the top does not move sideways.' }, { bmd: true, cap: 'Sway happens with unequal columns, different supports, unsymmetric or sideways loads.' }] }; },
    ],
    4: [
      fromWalk('m4-beam', { spans: [{ L: 5, I: 1, load: { type: 'UDL', w: 20 } }, { L: 4, I: 1, load: { type: 'P', P: 40, a: 2 } }], left: 'fixed', right: 'fixed' }, (st) => st.slice(0, 5)),
      () => ({ scene: { kind: 'joint', mem: T.jointDF([{ name: 'OA', L: 4, I: 1, far: 'fixed' }, { name: 'OB', L: 4, I: 1, far: 'pinned' }]) }, frames: [{ k: true, cap: 'Far end fixed: k = 4EI/L. Far end hinged: k = 3EI/L (easier to turn).' }] }),
      () => ({ scene: { kind: 'joint', mem: T.jointDF([{ name: 'OA', L: 4, I: 1, far: 'fixed' }, { name: 'OB', L: 4, I: 1, far: 'pinned' }, { name: 'OC', L: 4, I: 1, far: 'pinned' }, { name: 'OD', L: 4, I: 1, far: 'fixed' }]) }, frames: [{ k: true, cap: 'Stiffness of each member at joint O.' }, { df: true, cap: 'Share = k ÷ Σk. The shares add up to 1 (the whole pie).' }] }),
      () => ({ scene: beam(6, [{ x: 0, type: 'pin' }, { x: 6, type: 'fixed', right: true }], [], () => 0), frames: [{ moments: [{ x: 0, cw: true, side: 1, label: 'M' }], cap: 'Apply a moment M at the near end.' }, { moments: [{ x: 0, cw: true, side: 1, label: 'M' }, { x: 6, cw: true, side: -1, label: 'M/2' }], flows: [{ from: 0, to: 6, label: '× ½' }], cap: 'Half of it (same direction) appears at the fixed far end: <b>carry over factor = ½</b>.' }] }),
      fromWalk('m4-beam', { spans: [{ L: 5, I: 1, load: { type: 'UDL', w: 20 } }, { L: 4, I: 1, load: { type: 'P', P: 40, a: 2 } }], left: 'fixed', right: 'fixed' }),
    ],
    5: [
      () => { const pr = window.makeProblem('m5-parabolic', { L: 20, h: 5, pts: [{ P: 200, x: 6 }], udl: null, xs: 6, ask: 'react' }); return { scene: pr.scene, frames: [{ H: 'feet push out', cap: 'Under load the arch tries to spread its feet.' }, { H: `H = ${f(pr.scene.r.H)}`, cap: 'The supports push back inwards: the thrust H.' }, { beamM: {}, cap: 'Arch moment = beam moment − H × y. Only the small shaded gap is left.' }] }; },
      () => { const pr = window.makeProblem('m5-parabolic', { L: 20, h: 5, pts: [{ P: 200, x: 6 }], udl: null, xs: 6, ask: 'react' }); const r = pr.scene.r; return { scene: pr.scene, frames: [{ crown: 'hinge: M = 0', cap: 'Three hinges: A, B and the crown C. A hinge cannot hold a moment.' }, { react: [`V_A = ${f(r.VA)}`, `V_B = ${f(r.VB)}`], cap: 'Vertical reactions: like a simple beam.' }, { H: `H = ${f(r.H)}`, crown: 'M = 0', rise: 'h', cap: 'M = 0 at C gives H = (beam moment at C) ÷ h.' }] }; },
      () => { const pr = window.makeProblem('m5-circular', { L: 30, h: 6, pts: [{ P: 111, x: 22.5 }], udl: { w: 15, x1: 0, x2: 15 }, xs: 11, ask: 'full' }); const s = pr.scene.r.at(11); return { scene: pr.scene, frames: [{ section: { x: 11, y: `y = ${f(s.y)}` }, cap: 'Height y of the arch at the section.' }, { section: { x: 11, theta: `θ = ${f(T.deg(s.theta), 1)}°` }, cap: 'Steepness θ of the arch there.' }, { section: { x: 11, NS: ['N along', 'S across'] }, focus: [3, 19], cap: 'Split the forces: N along the arch, S across it.' }] }; },
      () => { const pr = window.makeProblem('m5-cable-points', { L: 30, pts: [{ P: 52, x: 7.5, name: 'C' }, { P: 39, x: 15, name: 'D' }, { P: 26, x: 22.5, name: 'E' }], known: 0, y: 0.6 }); return { scene: pr.scene, frames: [{ cap: 'A cable with point loads: straight pieces with corners.' }, { beamBM: true, cap: 'Its shape is the same as the bending moment diagram of a simple beam.' }, { H: 'H', dips: [{ name: 'D', label: 'y' }], cap: '<b>H × y = M</b> at every point.' }] }; },
      () => { const mk = (d) => { const r = T.cableUDL(40, 10, d); return { kind: 'cableUDL', L: 40, d, w: 10, beta: 30, hp: 12, r }; }; return { scene: mk(8), frames: [{ dip: 'd = 8 m', H: `H = ${f(T.cableUDL(40, 10, 8).H)} kN`, cap: 'Dip 8 m: moderate pull.' }, { scene: mk(4), dip: 'd = 4 m', H: `H = ${f(T.cableUDL(40, 10, 4).H)} kN`, cap: 'Halve the dip → the pull doubles (H = wL²/8d).' }, { scene: mk(2), dip: 'd = 2 m', H: `H = ${f(T.cableUDL(40, 10, 2).H)} kN`, cap: 'A tight line pulls very hard. That is why it snaps.' }] }; },
      () => { const sc = { kind: 'cableUDL', L: 40, d: 6, w: 10, beta: 30, hp: 12, r: T.cableUDL(40, 10, 6) }; return { scene: sc, frames: [{ cap: 'The main cable passes over a pier to an anchor cable.' }, { pier: 'pulley', cap: '<b>Guide pulley:</b> same pull on both sides, angles differ → the pier is pushed sideways and bends.' }, { pier: 'saddle', cap: '<b>Saddle on rollers:</b> sideways pulls must be equal → the pier is only pushed down.' }] }; },
      () => { const pr = window.makeProblem('m5-cable-points', { L: 30, pts: [{ P: 52, x: 7.5, name: 'C' }, { P: 39, x: 15, name: 'D' }, { P: 26, x: 22.5, name: 'E' }], known: 0, y: 2 }); const ar = window.makeProblem('m5-parabolic', { L: 30, h: 6, pts: [], udl: { w: 10, x1: 0, x2: 30 }, xs: 7, ask: 'react' }); return { scene: pr.scene, frames: [{ H: 'pulls in', cap: 'A cable hangs in pure tension and pulls its supports inwards.' }, { scene: ar.scene, H: 'pushes out', cap: 'Flip it upside down: an arch, in compression, pushing its supports outwards.' }] }; },
    ],
  };
  window.DEMOS = D;
})();
