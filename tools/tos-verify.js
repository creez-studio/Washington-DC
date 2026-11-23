/* Independent verification of every engine formula used by the TOS study app.
   Run:  node tools/tos-verify.js
   - Direct-stiffness 2D frame FE (Euler–Bernoulli, with axial), fine mesh,
     loads LUMPED at nodes (does not reuse any fixed-end-moment formula).
   - Static equilibrium checks for arches and cables.
   - Spot values from the official KTU Dec-2022 answer key and textbook results. */
'use strict';
const T = require('../dist/tos/js/engine.js');
let pass = 0, fail = 0;
const near = (a, b, tolAbs = 0.02, tolRel = 0.002) => Math.abs(a - b) <= Math.max(tolAbs, tolRel * Math.abs(b));
function check(name, got, want, tolAbs, tolRel) {
  if (near(got, want, tolAbs, tolRel)) pass++;
  else { fail++; console.log('FAIL', name, 'got', got, 'want', want); }
}

/* ---------------- FE frame ---------------- */
function feSolve(nodes, elems, supports, loads) {
  // nodes: [{x,y}], elems: [{i,j,EI,EA}], supports: {node: [u,v,θ] booleans fixed}, loads: {node:[Fx,Fy,M]}
  const n = nodes.length * 3;
  const K = Array.from({ length: n }, () => new Float64Array(n));
  const Fv = new Float64Array(n);
  const kel = elems.map((e) => {
    const a = nodes[e.i], b = nodes[e.j];
    const L = Math.hypot(b.x - a.x, b.y - a.y), c = (b.x - a.x) / L, s = (b.y - a.y) / L;
    const EA = e.EA, EI = e.EI;
    const kl = [
      [EA / L, 0, 0, -EA / L, 0, 0],
      [0, 12 * EI / L ** 3, 6 * EI / L ** 2, 0, -12 * EI / L ** 3, 6 * EI / L ** 2],
      [0, 6 * EI / L ** 2, 4 * EI / L, 0, -6 * EI / L ** 2, 2 * EI / L],
      [-EA / L, 0, 0, EA / L, 0, 0],
      [0, -12 * EI / L ** 3, -6 * EI / L ** 2, 0, 12 * EI / L ** 3, -6 * EI / L ** 2],
      [0, 6 * EI / L ** 2, 2 * EI / L, 0, -6 * EI / L ** 2, 4 * EI / L],
    ];
    const R = [[c, s, 0, 0, 0, 0], [-s, c, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, c, s, 0], [0, 0, 0, -s, c, 0], [0, 0, 0, 0, 0, 1]];
    const kg = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let p = 0; p < 6; p++) for (let q = 0; q < 6; q++) {
      let sum = 0; for (let r = 0; r < 6; r++) for (let t = 0; t < 6; t++) sum += R[r][p] * kl[r][t] * R[t][q]; kg[p][q] = sum;
    }
    const map = [e.i * 3, e.i * 3 + 1, e.i * 3 + 2, e.j * 3, e.j * 3 + 1, e.j * 3 + 2];
    for (let p = 0; p < 6; p++) for (let q = 0; q < 6; q++) K[map[p]][map[q]] += kg[p][q];
    return { kl, R, map, L };
  });
  Object.entries(loads).forEach(([nd, f]) => { for (let k = 0; k < 3; k++) Fv[nd * 3 + k] += f[k]; });
  elems.forEach((e, idx) => {
    if (!e.q) return;
    const a = nodes[e.i], b = nodes[e.j], L = kel[idx].L, c = (b.x - a.x) / L, s = (b.y - a.y) / L;
    // load q acts toward local -y (right side); local -y in global = (s, -c)
    const fx = s * e.q * L / 2, fy = -c * e.q * L / 2, m = e.q * L * L / 12;
    Fv[e.i * 3] += fx; Fv[e.i * 3 + 1] += fy; Fv[e.i * 3 + 2] -= m;
    Fv[e.j * 3] += fx; Fv[e.j * 3 + 1] += fy; Fv[e.j * 3 + 2] += m;
  });
  const fixed = new Array(n).fill(false);
  Object.entries(supports).forEach(([nd, f]) => f.forEach((b, k) => { if (b) fixed[nd * 3 + k] = true; }));
  const free = []; for (let k = 0; k < n; k++) if (!fixed[k]) free.push(k);
  const A = free.map((p) => free.map((q) => K[p][q])), b = free.map((p) => Fv[p]);
  const sol = T.solveLinear(A, b);
  const d = new Float64Array(n); free.forEach((p, k) => (d[p] = sol[k]));
  const endForces = kel.map((k) => {
    const dg = k.map.map((m) => d[m]);
    const dl = k.R.map((row) => row.reduce((s, v, i) => s + v * dg[i], 0));
    const f = k.kl.map((row) => row.reduce((s, v, i) => s + v * dl[i], 0));
    const q = elems[kel.indexOf(k)].q || 0, h = k.L;
    if (q) { f[1] += q * h / 2; f[2] += q * h * h / 12; f[4] += q * h / 2; f[5] -= q * h * h / 12; }
    return f;
  });
  return { d, endForces };
}
/* Build an FE model of a slope-deflection "model" (members subdivided, lumped loads) */
function feFromModel(model, nsub = 40) {
  const nodes = [], elems = [], loads = {}, supports = {};
  const nodeIndex = {};
  model.nodes.forEach((nd) => { nodeIndex[nd.id] = nodes.length; nodes.push({ x: nd.x, y: nd.y }); });
  const memInfo = [];
  model.members.forEach((m) => {
    const a = model.nodes.find((q) => q.id === m.i), b = model.nodes.find((q) => q.id === m.j);
    const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
    // right-side normal (load direction for positive transverse load)
    const rx = uy, ry = -ux;
    const stations = new Set(); for (let k = 0; k <= nsub; k++) stations.add(+(L * k / nsub).toFixed(9));
    (m.loads || []).forEach((ld) => { if (ld.type === 'P') stations.add(+ld.a.toFixed(9)); });
    const st = [...stations].sort((p, q) => p - q);
    const idx = st.map((s, k) => {
      if (k === 0) return nodeIndex[m.i];
      if (k === st.length - 1) return nodeIndex[m.j];
      nodes.push({ x: a.x + ux * s, y: a.y + uy * s }); return nodes.length - 1;
    });
    const add = (nd, f) => { loads[nd] = loads[nd] || [0, 0, 0]; loads[nd][0] += f * rx; loads[nd][1] += f * ry; };
    for (let k = 0; k < st.length - 1; k++) {
      const q = (m.loads || []).filter((ld) => ld.type === 'UDL').reduce((t, ld) => t + ld.w, 0);
      elems.push({ i: idx[k], j: idx[k + 1], EI: m.I || 1, EA: 1e7, q });
    }
    (m.loads || []).forEach((ld) => { if (ld.type === 'P') add(idx[st.indexOf(+ld.a.toFixed(9))], ld.P); });
    memInfo.push({ m, firstElem: elems.length - (st.length - 1), lastElem: elems.length - 1 });
  });
  model.nodes.forEach((nd) => {
    const k = nodeIndex[nd.id];
    if (nd.sup === 'fixed') supports[k] = [true, true, true];
    else if (nd.sup === 'pinned') supports[k] = [true, true, false];
    else if (nd.sup === 'roller') supports[k] = [false, true, false];
  });
  // a structure with only rollers would be unstable horizontally: pin first support if no x restraint
  const anyX = Object.values(supports).some((s) => s[0]);
  if (!anyX) { const k = Object.keys(supports)[0]; supports[k][0] = true; }
  const res = feSolve(nodes, elems, supports, loads);
  // clockwise moment on member at its ends
  return memInfo.map(({ m, firstElem, lastElem }) => ({
    id: m.i + m.j,
    Mij: -res.endForces[firstElem][2],
    Mji: -res.endForces[lastElem][5],
  }));
}

/* ---------------- 1. Module 1 ---------------- */
{
  // PYQ Nov-2024 Q6: L 3.3, UDL 11, P 22 at free end
  const r = T.cantileverTip(3.3, [{ type: 'P', P: 22, a: 3.3 }, { type: 'UDL', w: 11, a1: 0, a2: 3.3 }]);
  check('Q6 slope', r.slope, 22 * 3.3 ** 2 / 2 + 11 * 3.3 ** 3 / 6);
  check('Q6 defl', r.defl, 22 * 3.3 ** 3 / 3 + 11 * 3.3 ** 4 / 8);
  // PYQ Nov-2024 Q7: L 3, 12 kN at end, 23 kN 1.2 m from free end
  const r7 = T.cantileverTip(3, [{ type: 'P', P: 12, a: 3 }, { type: 'P', P: 23, a: 1.8 }]);
  check('Q7 slope', r7.slope, 91.26); check('Q7 defl', r7.defl, 197.424);
  // June-2024 Q6 stepped EI
  const r6 = T.cantileverTip(3, [{ type: 'P', P: 100, a: 3 }], [{ x1: 0, x2: 1, k: 2 }, { x1: 1, x2: 3, k: 1 }]);
  check('J6 slope', r6.slope, 325); check('J6 defl', r6.defl, 583.3333);
  // Dec-2022 Q6: W at end & centre of 2L -> 5WL²/2, 7WL³/2 (W=1,L=1)
  const d6 = T.cantileverTip(2, [{ type: 'P', P: 1, a: 2 }, { type: 'P', P: 1, a: 1 }]);
  check('D6 slope', d6.slope, 2.5); check('D6 defl', d6.defl, 3.5);
  // June-2024 Q7 SS central 50 kN, 4 m
  const s = T.ssSymmetric(4, 50, 0); check('J7 slope', s.slope, 50); check('J7 defl', s.defl, 66.6667);
  // random cantilevers vs FE
  for (let t = 0; t < 40; t++) {
    const L = 2 + Math.round(Math.random() * 8) / 2, P = 5 + Math.round(Math.random() * 50), a = Math.round(Math.random() * L * 2) / 2 || L;
    const w = Math.round(Math.random() * 30);
    const k1 = Math.random() < 0.4 ? 2 : 1, L1 = Math.round(Math.random() * 4) / 4 * L;
    const segs = [{ x1: 0, x2: L1, k: k1 }, { x1: L1, x2: L, k: 1 }];
    const r = T.cantileverTip(L, [{ type: 'P', P, a }, { type: 'UDL', w, a1: 0, a2: L }], segs);
    // FE cantilever
    const n = 120, nodes = [], elems = [], loads = {};
    for (let k = 0; k <= n; k++) nodes.push({ x: L * k / n, y: 0 });
    for (let k = 0; k < n; k++) { const xm = L * (k + 0.5) / n; elems.push({ i: k, j: k + 1, EI: xm < L1 ? k1 : 1, EA: 1e7, q: w }); }
    const add = (k, f) => { loads[k] = loads[k] || [0, 0, 0]; loads[k][1] -= f; };
    add(Math.round(a / L * n), P);
    const fe = feSolve(nodes, elems, { 0: [true, true, true] }, loads);
    if (Number.isInteger(Math.round(a / L * n)) && Math.abs(Math.round(a / L * n) - a / L * n) < 1e-9) {
      check('rand cant defl', r.defl, -fe.d[n * 3 + 1], 0.05, 0.003);
      check('rand cant slope', r.slope, -fe.d[n * 3 + 2], 0.05, 0.003);
    }
  }
}

/* ---------------- 2. Module 2 ---------------- */
{
  const p = T.proppedUDL(6, 27);
  check('N8 RB', p.RB, 60.75); check('N8 MA', p.MA, 121.5); check('N8 Mmax', p.Mmax, 68.34375);
  const p2 = T.proppedUDL(3, 50); check('J9 RB', p2.RB, 56.25); check('J9 MA', p2.MA, 56.25);
  for (let t = 0; t < 30; t++) {
    const L = 3 + Math.round(Math.random() * 10) / 2, P = 10 + Math.round(Math.random() * 90), a = Math.max(0.5, Math.min(L - 0.5, Math.round(Math.random() * L * 2) / 2));
    const pp = T.proppedPoint(L, P, a);
    const fe = feFromModel({ nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: L, y: 0, sup: 'roller' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'P', P, a }] }] });
    check('propped MA', -fe[0].Mij, pp.MA, 0.02, 0.002);
    const fp = T.fixedPoint(L, P, a);
    const fe2 = feFromModel({ nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: L, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'P', P, a }] }] });
    check('fixed MA', -fe2[0].Mij, fp.MA); check('fixed MB', fe2[0].Mji, fp.MB);
  }
  // three moment theorem vs FE
  const cases = [
    [5, { type: 'P', P: 23, a: 2 }, 4.5, { type: 'UDL', w: 13 }, 'pinned', 'pinned'],
    [5, { type: 'UDL', w: 25 }, 6, { type: 'P', P: 50, a: 2 }, 'fixed', 'pinned'],
  ];
  for (let t = 0; t < 30; t++) {
    const L1 = 3 + Math.round(Math.random() * 8) / 2, L2 = 3 + Math.round(Math.random() * 8) / 2;
    const ld = (L) => Math.random() < 0.5 ? { type: 'UDL', w: 5 + Math.round(Math.random() * 40) } : { type: 'P', P: 10 + Math.round(Math.random() * 80), a: Math.max(0.5, Math.min(L - 0.5, Math.round(Math.random() * L * 2) / 2)) };
    cases.push([L1, ld(L1), L2, ld(L2), Math.random() < 0.5 ? 'fixed' : 'pinned', Math.random() < 0.3 ? 'fixed' : 'pinned']);
  }
  cases.forEach(([L1, l1, L2, l2, le, re], k) => {
    const tm = T.threeMoment2(L1, l1, L2, l2, le, re);
    const sup = (e) => (e === 'fixed' ? 'fixed' : 'pinned');
    const fe = feFromModel({ nodes: [{ id: 'A', x: 0, y: 0, sup: sup(le) }, { id: 'B', x: L1, y: 0, sup: 'roller' }, { id: 'C', x: L1 + L2, y: 0, sup: re === 'fixed' ? 'fixed' : 'roller' }], members: [{ i: 'A', j: 'B', I: 1, loads: [l1] }, { i: 'B', j: 'C', I: 1, loads: [l2] }] });
    check('3M MB #' + k, tm.MB, fe[0].Mji); check('3M MA #' + k, tm.MA, -fe[0].Mij); check('3M MC #' + k, tm.MC, fe[1].Mji);
    if (k === 0) check('N9 MB', tm.MB, (23 * 2 * 3 * 7 / 5 + 13 * 4.5 ** 3 / 4) / 19);
  });
}

/* ---------------- 3/4. Slope deflection & moment distribution ---------------- */
function sdVsFeVsMdm(model, label) {
  const sd = T.slopeDeflection(model);
  const fe = feFromModel(model);
  const md = T.momentDistribution(model);
  sd.members.forEach((m, k) => {
    check(label + ' SD/FE ' + m.i + m.j, m.Mij, fe[k].Mij, 0.03, 0.002);
    check(label + ' SD/FE ' + m.j + m.i, m.Mji, fe[k].Mji, 0.03, 0.002);
    const ci = md.cols.findIndex((c) => c.key === m.i + m.j), cj = md.cols.findIndex((c) => c.key === m.j + m.i);
    check(label + ' MDM ' + m.i + m.j, md.final[ci], m.Mij, 0.02, 0.001);
    check(label + ' MDM ' + m.j + m.i, md.final[cj], m.Mji, 0.02, 0.001);
  });
  // deflected-shape consistency: slope at i from double integration equals -θi
  sd.members.forEach((m) => {
    if (m.loads && m.loads.length) {
      const sh = T.deflectedShape(m.L, (x) => T.memberMoment(m.L, m.loads, m.Mij, m.Mji, x), (x) => m.I || 1, 'ss', 2000);
      check(label + ' shape θ' + m.i, -sh.slope[0], sd.theta[m.i], 0.05, 0.003);
    }
  });
  return sd;
}
{
  // Dec-2022 Q11 (official key: MAB = -229.43, MBA = 441.2, MBC = -441.2)
  const q11 = sdVsFeVsMdm({ nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: 6, y: 0, sup: 'roller' }, { id: 'C', x: 10, y: 0, sup: 'roller' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'UDL', w: 100 }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'UDL', w: 300 }] }] }, 'D11');
  check('Key D11 MAB', q11.members[0].Mij, -229.43, 0.05); check('Key D11 MBA', q11.members[0].Mji, 441.2, 0.05);
  // June-2024 Q10 beam ABCD
  sdVsFeVsMdm({ nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: 4, y: 0, sup: 'roller' }, { id: 'C', x: 9, y: 0, sup: 'roller' }, { id: 'D', x: 15, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'UDL', w: 25 }] }, { i: 'B', j: 'C', I: 2, loads: [{ type: 'P', P: 50, a: 2 }] }, { i: 'C', j: 'D', I: 1, loads: [{ type: 'P', P: 75, a: 3 }] }] }, 'J10');
  // June-2024 Q11 T-frame
  sdVsFeVsMdm({ nodes: [{ id: 'A', x: 0, y: 3, sup: 'fixed' }, { id: 'B', x: 4, y: 3, sup: null }, { id: 'C', x: 9, y: 3, sup: 'fixed' }, { id: 'D', x: 4, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'P', P: 100, a: 2 }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'P', P: 100, a: 2.5 }] }, { i: 'B', j: 'D', I: 1, loads: [] }] }, 'J11');
  // Nov-2024 Q11/13 portal (symmetric -> no sway)
  sdVsFeVsMdm({ nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: 0, y: 4.8, sup: null }, { id: 'C', x: 4, y: 4.8, sup: null }, { id: 'D', x: 4, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: [{ type: 'P', P: 24, a: 2.4 }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'UDL', w: 17 }] }, { i: 'C', j: 'D', I: 1, loads: [{ type: 'P', P: 24, a: 2.4 }] }] }, 'N11');
  // Dec-2022 Q10 beam on elastic column
  sdVsFeVsMdm({ nodes: [{ id: 'A', x: 0, y: 3, sup: 'fixed' }, { id: 'B', x: 5, y: 3, sup: null }, { id: 'C', x: 8, y: 3, sup: 'roller' }, { id: 'D', x: 5, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 2, loads: [{ type: 'P', P: 10, a: 2 }] }, { i: 'B', j: 'C', I: 1, loads: [{ type: 'UDL', w: 2 }] }, { i: 'B', j: 'D', I: 1, loads: [] }] }, 'D10');
  // random continuous beams
  for (let t = 0; t < 40; t++) {
    const n = 2 + Math.floor(Math.random() * 2);
    const nodes = [{ id: 'A', x: 0, y: 0, sup: Math.random() < 0.5 ? 'fixed' : 'pinned' }];
    const members = []; let x = 0; const ids = 'ABCD';
    for (let s = 0; s < n; s++) {
      const L = 3 + Math.round(Math.random() * 8) / 2; x += L;
      nodes.push({ id: ids[s + 1], x, y: 0, sup: s === n - 1 ? (Math.random() < 0.5 ? 'fixed' : 'roller') : 'roller' });
      const loads = Math.random() < 0.5 ? [{ type: 'UDL', w: 5 + Math.round(Math.random() * 40) }] : [{ type: 'P', P: 10 + Math.round(Math.random() * 80), a: Math.max(0.5, Math.min(L - 0.5, Math.round(Math.random() * L * 2) / 2)) }];
      members.push({ i: ids[s], j: ids[s + 1], I: Math.random() < 0.3 ? 2 : 1, loads });
    }
    const sdm = sdVsFeVsMdm({ nodes, members }, 'rand' + t); if (fail && !globalThis.shown) { globalThis.shown = 1; console.log(JSON.stringify({ nodes, members })); }
  }
  // joint DF (June-2024 Part A Q4)
  const df = T.jointDF([{ name: 'OA', L: 1, far: 'fixed' }, { name: 'OB', L: 1, far: 'pinned' }, { name: 'OC', L: 1, far: 'pinned' }, { name: 'OD', L: 1, far: 'fixed' }]);
  check('DF OA', df[0].DF, 4 / 14, 1e-6); check('DF OB', df[1].DF, 3 / 14, 1e-6);
}

/* ---------------- 5. Arches & cables ---------------- */
{
  // Dec-2022 Q14 official key: VA 140, VB 60, H 120, RA 184.4, RB 134.2
  const a = T.threeHingedArch('parabolic', 20, 5, [{ type: 'P', P: 200, x: 6 }]);
  check('Key A VA', a.VA, 140); check('Key A VB', a.VB, 60); check('Key A H', a.H, 120);
  check('Key A RA', a.RA, 184.4, 0.05); check('Key A RB', a.RB, 134.2, 0.05);
  // Nov-2024 Q14 circular
  const c = T.threeHingedArch('circular', 30, 6, [{ type: 'UDL', w: 15, x1: 0, x2: 15 }, { type: 'P', P: 111, x: 22.5 }]);
  check('N14 VA', c.VA, 196.5); check('N14 VB', c.VB, 139.5); check('N14 H', c.H, 210); check('N14 R', c.R, 21.75);
  const s11 = c.at(11);
  check('N14 y', s11.y, Math.sqrt(21.75 ** 2 - 16) - 15.75, 1e-6);
  // equilibrium checks on random arches: crown moment zero and free-body of left part
  for (let t = 0; t < 50; t++) {
    const L = 10 + Math.round(Math.random() * 30), h = Math.min(L / 2, 2 + Math.round(Math.random() * 8));
    const loads = [{ type: 'P', P: 10 + Math.round(Math.random() * 100), x: Math.round(Math.random() * L) }, { type: 'UDL', w: Math.round(Math.random() * 20), x1: 0, x2: L / 2 }];
    const shape = Math.random() < 0.5 ? 'parabolic' : 'circular';
    const r = T.threeHingedArch(shape, L, h, loads);
    check('arch crown M', r.at(L / 2).M, 0, 1e-6);
    // ΣFy = 0
    check('arch ΣFy', r.VA + r.VB, r.W, 1e-6);
    // N,S recompose to (H, V) at a random section
    const x = 0.1 * L + Math.random() * 0.8 * L, s = r.at(x);
    const Hx = s.N * Math.cos(s.theta) - s.S * Math.sin(s.theta), Vy = s.N * Math.sin(s.theta) + s.S * Math.cos(s.theta);
    check('arch N/S H', Hx, r.H, 1e-6); check('arch N/S V', Vy, s.V, 1e-6);
    // shape passes through crown
    check('arch y crown', r.g.y(L / 2), h, 1e-9); check('arch y A', r.g.y(0), 0, 1e-9);
  }
  // cable Nov-2024 Q15
  const cb = T.cablePoints(30, [{ P: 52, x: 7.5, name: 'C' }, { P: 39, x: 15, name: 'D' }, { P: 26, x: 22.5, name: 'E' }], { x: 7.5, y: 0.6 });
  check('N15 VA', cb.VA, 65); check('N15 VB', cb.VB, 52); check('N15 H', cb.H, 812.5); check('N15 yD', cb.pts[2].y, 0.72); check('N15 yE', cb.pts[3].y, 0.48);
  // June-2024 Q15
  const cj = T.cablePoints(10, [{ P: 50, x: 3, name: 'B' }, { P: 75, x: 7, name: 'C' }], { x: 3, y: 1 });
  check('J15 H', cj.H, 172.5); check('J15 VA', cj.VA, 57.5);
  // joint equilibrium of every cable node (random)
  for (let t = 0; t < 30; t++) {
    const L = 20 + Math.round(Math.random() * 20);
    const loads = [1, 2, 3].map((k) => ({ P: 10 + Math.round(Math.random() * 60), x: (L * k) / 4, name: 'CDE'[k - 1] }));
    const r = T.cablePoints(L, loads, { x: loads[0].x, y: 1 + Math.random() * 3 });
    for (let k = 1; k < r.pts.length - 1; k++) {
      const sL = r.segs[k - 1], sR = r.segs[k];
      // vertical: T_left·sin(down slope) ... use dy/dx form: H·(dyR/dxR − dyL/dxL) + P = 0  (y downward)
      const fy = r.H * (sR.dy / sR.dx - sL.dy / sL.dx) + loads[k - 1].P;
      check('cable node Fy', fy, 0, 1e-6);
    }
  }
  const cu = T.cableUDL(100, 20, 10); check('cable UDL H', cu.H, 2500); check('cable UDL Tmax', cu.Tmax, Math.hypot(2500, 1000));
}

console.log(`\n${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
