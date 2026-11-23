/* =====================================================================
   TOS-III calculation engine (KTU AET201)
   Pure functions, no DOM. Works in the browser (window.TOS) and in Node
   (module.exports) so every number can be verified by tools/tos-verify.js.

   Sign conventions
   - Slope deflection / moment distribution: clockwise end moment on the
     member is positive (Indian textbook convention).
   - Beam bending moment diagrams: sagging positive.
   - Three moment theorem: support moments are reported as HOGGING-positive
     magnitudes, exactly as in Punmia / Ramamrutham.
   - Slopes / deflections of determinate beams are returned as the
     coefficient of 1/EI (units kN·m² and kN·m³).
   ===================================================================== */
(function (root) {
  'use strict';
  const E = {};

  /* ---------- helpers ---------- */
  E.round = (x, d = 2) => {
    if (!isFinite(x)) return x;
    const f = Math.pow(10, d);
    const r = Math.round(Math.abs(x) * f + 1e-9) / f;
    return x < 0 ? -r : r;
  };
  E.fmt = (x, d = 2) => {
    const v = E.round(x, d);
    if (Object.is(v, -0) || v === 0) return (0).toFixed(d);
    return v.toFixed(d);
  };
  E.deg = (rad) => (rad * 180) / Math.PI;

  E.solveLinear = function (A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.slice().concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-14) throw new Error('Singular system');
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((row, i) => row[n] / row[i]);
  };

  /* =====================================================================
     MODULE 1 — determinate beams (moment area / conjugate beam)
     ===================================================================== */

  /** Cantilever fixed at A (x = 0), free at B (x = L).
   *  loads: [{type:'P', P, a}] a = distance from FIXED end
   *         [{type:'UDL', w, a1, a2}] UDL from a1 to a2 (from fixed end)
   *  eiSegments: [{x1, x2, k}] flexural rigidity = k·EI on [x1, x2] (default k=1)
   *  Returns slope and deflection at free end as coefficient of 1/EI, using
   *  exact piecewise Simpson integration of the M/EI diagram (moment-area). */
  E.cantileverTip = function (L, loads, eiSegments) {
    const segs = eiSegments && eiSegments.length ? eiSegments : [{ x1: 0, x2: L, k: 1 }];
    // hogging moment magnitude at section x (from fixed end): moment of loads to the right
    const M = (x) => {
      let m = 0;
      for (const ld of loads) {
        if (ld.type === 'P') { if (ld.a > x) m += ld.P * (ld.a - x); }
        else {
          const s = Math.max(ld.a1, x), e = ld.a2;
          if (e > s) m += ld.w * (e - s) * ((s + e) / 2 - x);
        }
      }
      return m;
    };
    const kAt = (x) => { for (const s of segs) if (x >= s.x1 - 1e-12 && x <= s.x2 + 1e-12) return s.k; return 1; };
    const br = new Set([0, L]);
    loads.forEach((ld) => { if (ld.type === 'P') br.add(ld.a); else { br.add(ld.a1); br.add(ld.a2); } });
    segs.forEach((s) => { br.add(s.x1); br.add(s.x2); });
    const pts = [...br].filter((v) => v >= 0 && v <= L).sort((a, b) => a - b);
    let area = 0, mom = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (b - a < 1e-12) continue;
      const m = (a + b) / 2, eps = 1e-9 * (b - a);
      const k = kAt(m);
      const f = (x) => M(x) / k;
      const fa = f(a + eps), fm = f(m), fb = f(b - eps);
      area += ((b - a) / 6) * (fa + 4 * fm + fb);
      mom += ((b - a) / 6) * (fa * (L - a) + 4 * fm * (L - m) + fb * (L - b));
    }
    return { slope: area, defl: mom, M };
  };

  /** Simply supported beam: central point load and/or full UDL (symmetric). */
  E.ssSymmetric = function (L, P, w) {
    return {
      slope: (P * L * L) / 16 + (w * Math.pow(L, 3)) / 24,
      defl: (P * Math.pow(L, 3)) / 48 + (5 * w * Math.pow(L, 4)) / 384,
      RA: P / 2 + (w * L) / 2,
      Mmax: (P * L) / 4 + (w * L * L) / 8,
    };
  };

  /* =====================================================================
     MODULE 2 — propped cantilever, fixed beam, three moment theorem
     ===================================================================== */

  /** Propped cantilever: fixed at A (x=0), prop at B (x=L). */
  E.proppedUDL = function (L, w) {
    const RB = (3 * w * L) / 8, RA = (5 * w * L) / 8, MA = (w * L * L) / 8;
    const xMax = (3 * L) / 8; // from prop B
    const Mmax = (9 * w * L * L) / 128;
    const xPOC = (3 * L) / 4; // point of contraflexure from B
    return { RB, RA, MA, Mmax, xMax, xPOC, deltaFree: (w * Math.pow(L, 4)) / 8, deltaR: Math.pow(L, 3) / 3 };
  };
  /** Propped cantilever with point load P at distance a from fixed end A. */
  E.proppedPoint = function (L, P, a) {
    const b = L - a;
    const deltaFree = (P * a * a * (3 * L - a)) / 6; // ×1/EI
    const deltaR = Math.pow(L, 3) / 3; // ×R/EI
    const RB = deltaFree / deltaR;
    const RA = P - RB;
    const MA = P * a - RB * L; // hogging magnitude
    const Mload = RB * b; // sagging under the load
    return { RB, RA, MA, Mload, deltaFree, deltaR, b };
  };
  /** Fixed beam, single point load at a from A, or full UDL. */
  E.fixedPoint = function (L, P, a) {
    const b = L - a;
    const MA = (P * a * b * b) / (L * L), MB = (P * a * a * b) / (L * L);
    const RA = (P * b * b * (3 * a + b)) / Math.pow(L, 3);
    const RB = P - RA;
    const Mfree = (P * a * b) / L;
    const Mload = Mfree - (MA * b + MB * a) / L;
    return { MA, MB, RA, RB, Mfree, Mload };
  };
  E.fixedUDL = function (L, w) {
    return { MA: (w * L * L) / 12, MB: (w * L * L) / 12, RA: (w * L) / 2, RB: (w * L) / 2, Mfree: (w * L * L) / 8, Mmid: (w * L * L) / 24 };
  };

  /** 6·A·x̄/L for a simply supported span, x̄ measured from the reference end.
   *  load: {type:'UDL', w} or {type:'P', P, a} (a measured from LEFT end of span)
   *  ref: 'left' | 'right' */
  E.sixAxL = function (L, load, ref) {
    if (load.type === 'UDL') return (load.w * Math.pow(L, 3)) / 4;
    const aRef = ref === 'left' ? load.a : L - load.a; // distance of load from reference end
    const bRef = L - aRef;
    return (load.P * aRef * bRef * (L + aRef)) / L;
  };
  E.freeBMArea = function (L, load) {
    if (load.type === 'UDL') return { A: (2 / 3) * L * (load.w * L * L / 8), Mmax: load.w * L * L / 8 };
    return { A: (load.P * load.a * (L - load.a)) / 2, Mmax: (load.P * load.a * (L - load.a)) / L };
  };

  /** Two-span continuous beam A–B–C by Clapeyron's three moment theorem.
   *  leftEnd: 'fixed' | 'pinned'; rightEnd: 'fixed' | 'pinned'; constant EI.
   *  Returns hogging-positive support moments. */
  E.threeMoment2 = function (L1, load1, L2, load2, leftEnd, rightEnd) {
    const R1L = E.sixAxL(L1, load1, 'left');  // span AB, x̄ from A
    const R1R = E.sixAxL(L1, load1, 'right'); // span AB, x̄ from B
    const R2L = E.sixAxL(L2, load2, 'left');  // span BC, x̄ from B
    const R2R = E.sixAxL(L2, load2, 'right'); // span BC, x̄ from C
    // unknowns ordered [MA, MB, MC] — only the needed ones
    const eqs = [], names = [];
    const idx = {};
    if (leftEnd === 'fixed') { idx.MA = names.length; names.push('MA'); }
    idx.MB = names.length; names.push('MB');
    if (rightEnd === 'fixed') { idx.MC = names.length; names.push('MC'); }
    const n = names.length;
    const row = () => new Array(n).fill(0);
    const rowsDesc = [];
    if (leftEnd === 'fixed') {
      // imaginary span A0–A of zero length: 2MA·L1 + MB·L1 = 6A1x̄1/L1 (x̄ from B)
      const r = row(); r[idx.MA] = 2 * L1; r[idx.MB] = L1; eqs.push({ r, b: R1R });
      rowsDesc.push({ name: 'A0-A-B', coef: { MA: 2 * L1, MB: L1 }, rhs: R1R });
    }
    {
      const r = row(); r[idx.MB] = 2 * (L1 + L2);
      if (idx.MA !== undefined) r[idx.MA] = L1;
      if (idx.MC !== undefined) r[idx.MC] = L2;
      eqs.push({ r, b: R1L + R2R });
      const coef = { MB: 2 * (L1 + L2) };
      if (idx.MA !== undefined) coef.MA = L1;
      if (idx.MC !== undefined) coef.MC = L2;
      rowsDesc.push({ name: 'A-B-C', coef, rhs: R1L + R2R });
    }
    if (rightEnd === 'fixed') {
      const r = row(); r[idx.MC] = 2 * L2; r[idx.MB] = L2; eqs.push({ r, b: R2L });
      rowsDesc.push({ name: 'B-C-C0', coef: { MB: L2, MC: 2 * L2 }, rhs: R2L });
    }
    const sol = E.solveLinear(eqs.map((e) => e.r), eqs.map((e) => e.b));
    const out = { MA: 0, MB: 0, MC: 0, R1L, R1R, R2L, R2R, eqs: rowsDesc };
    names.forEach((nm, i) => (out[nm] = sol[i]));
    // reactions (hogging moments → end moments)
    const simple = (L, ld) => ld.type === 'UDL' ? [ld.w * L / 2, ld.w * L / 2] : [ld.P * (L - ld.a) / L, ld.P * ld.a / L];
    const s1 = simple(L1, load1), s2 = simple(L2, load2);
    const RA = s1[0] + (out.MA - out.MB) / L1;
    const RB1 = s1[1] + (out.MB - out.MA) / L1;
    const RB2 = s2[0] + (out.MB - out.MC) / L2;
    const RC = s2[1] + (out.MC - out.MB) / L2;
    Object.assign(out, { RA, RB: RB1 + RB2, RC, RB1, RB2 });
    return out;
  };

  /* =====================================================================
     MODULES 3 & 4 — slope deflection & moment distribution (no sway)
     Model: { nodes:[{id,x,y,sup}], members:[{id,i,j,I,loads}] }
       sup: 'fixed' | 'pinned' | 'roller' | null (rigid joint)
       loads (transverse, acting to the RIGHT side when walking i→j;
       for a left→right beam that is downward):
         {type:'P', P, a}  a from end i
         {type:'UDL', w}   full span
     ===================================================================== */
  E.memberLength = (model, m) => {
    const ni = model.nodes.find((n) => n.id === m.i), nj = model.nodes.find((n) => n.id === m.j);
    return m.L || Math.hypot(nj.x - ni.x, nj.y - ni.y);
  };
  E.femOf = function (L, loads) {
    let Fij = 0, Fji = 0;
    const parts = [];
    for (const ld of loads || []) {
      if (ld.type === 'UDL') {
        const v = (ld.w * L * L) / 12; Fij -= v; Fji += v;
        parts.push({ kind: 'UDL', w: ld.w, L, ij: -v, ji: v });
      } else {
        const a = ld.a, b = L - a;
        const vij = (ld.P * a * b * b) / (L * L), vji = (ld.P * a * a * b) / (L * L);
        Fij -= vij; Fji += vji;
        parts.push({ kind: 'P', P: ld.P, a, b, L, ij: -vij, ji: vji });
      }
    }
    return { Fij, Fji, parts };
  };
  /** simple-span reaction at i and j for loads (on the load side) */
  E.simpleReactions = function (L, loads) {
    let Ri = 0, Rj = 0;
    for (const ld of loads || []) {
      if (ld.type === 'UDL') { Ri += ld.w * L / 2; Rj += ld.w * L / 2; }
      else { Ri += ld.P * (L - ld.a) / L; Rj += ld.P * ld.a / L; }
    }
    return { Ri, Rj };
  };
  /** sagging-positive moment at distance x from end i (tension on load side) */
  E.memberMoment = function (L, loads, Mij, Mji, x) {
    const { Ri } = E.simpleReactions(L, loads);
    let m = Ri * x;
    for (const ld of loads || []) {
      if (ld.type === 'UDL') m -= ld.w * x * x / 2;
      else if (x > ld.a) m -= ld.P * (x - ld.a);
    }
    return m + Mij * (1 - x / L) - Mji * (x / L);
  };
  E.memberShear = function (L, loads, Mij, Mji, x, side) {
    const { Ri } = E.simpleReactions(L, loads);
    let v = Ri - (Mij + Mji) / L;
    for (const ld of loads || []) {
      if (ld.type === 'UDL') v -= ld.w * x;
      else if (x > ld.a + 1e-9 || (side === 'right' && Math.abs(x - ld.a) < 1e-9)) v -= ld.P;
    }
    return v;
  };

  const isEndSupport = (model, node) => {
    const cnt = model.members.filter((m) => m.i === node.id || m.j === node.id).length;
    return cnt === 1;
  };

  E.slopeDeflection = function (model) {
    const nodes = model.nodes;
    const dofNodes = nodes.filter((n) => n.sup !== 'fixed');
    const dIdx = {}; dofNodes.forEach((n, k) => (dIdx[n.id] = k));
    const N = dofNodes.length;
    const K = Array.from({ length: N }, () => new Array(N).fill(0));
    const F = new Array(N).fill(0);
    const mem = model.members.map((m) => {
      const L = E.memberLength(model, m);
      const fem = E.femOf(L, m.loads);
      const c = (2 * (m.I || 1)) / L; // 2EI/L (E·I0 = 1)
      return { ...m, L, fem, c };
    });
    for (const m of mem) {
      // Mij = Fij + c(2θi + θj) ; Mji = Fji + c(2θj + θi)
      if (dIdx[m.i] !== undefined) {
        const r = dIdx[m.i];
        K[r][r] += 2 * m.c; if (dIdx[m.j] !== undefined) K[r][dIdx[m.j]] += m.c;
        F[r] -= m.fem.Fij;
      }
      if (dIdx[m.j] !== undefined) {
        const r = dIdx[m.j];
        K[r][r] += 2 * m.c; if (dIdx[m.i] !== undefined) K[r][dIdx[m.i]] += m.c;
        F[r] -= m.fem.Fji;
      }
    }
    // external joint moments (clockwise +) — rarely used
    (model.jointMoments || []).forEach((jm) => { if (dIdx[jm.node] !== undefined) F[dIdx[jm.node]] += jm.M; });
    const theta = N ? E.solveLinear(K, F) : [];
    const th = {}; nodes.forEach((n) => (th[n.id] = dIdx[n.id] !== undefined ? theta[dIdx[n.id]] : 0));
    const results = mem.map((m) => {
      const Mij = m.fem.Fij + m.c * (2 * th[m.i] + th[m.j]);
      const Mji = m.fem.Fji + m.c * (2 * th[m.j] + th[m.i]);
      const Vi = E.memberShear(m.L, m.loads, Mij, Mji, 0);
      const { Ri, Rj } = E.simpleReactions(m.L, m.loads);
      const Vj = Rj + (Mij + Mji) / m.L; // reaction-type force at j on load side (upward for beam)
      return { ...m, Mij, Mji, Vi, Vj, Ri, Rj };
    });
    return { theta: th, dofNodes: dofNodes.map((n) => n.id), K, F, members: results };
  };

  /** Moment distribution (no sway). Pinned/roller END supports use the
   *  modified stiffness 3EI/L after first releasing the end.  */
  E.momentDistribution = function (model, opts) {
    opts = opts || {};
    const tol = opts.tol || 0.005, maxCycles = opts.maxCycles || 30;
    const nodeById = {}; model.nodes.forEach((n) => (nodeById[n.id] = n));
    const mem = model.members.map((m) => {
      const L = E.memberLength(model, m);
      return { ...m, L, fem: E.femOf(L, m.loads) };
    });
    const pinnedEnd = (nid) => {
      const n = nodeById[nid];
      return (n.sup === 'pinned' || n.sup === 'roller') && isEndSupport(model, n);
    };
    // columns: one per member end
    const cols = [];
    mem.forEach((m) => {
      cols.push({ key: m.i + m.j, node: m.i, far: m.j, m, end: 'i', fem: m.fem.Fij });
      cols.push({ key: m.j + m.i, node: m.j, far: m.i, m, end: 'j', fem: m.fem.Fji });
    });
    const colByKey = {}; cols.forEach((c, k) => (colByKey[c.key] = k));
    // stiffness at each end
    cols.forEach((c) => {
      const I = c.m.I || 1;
      const farPinned = pinnedEnd(c.far);
      c.kFormula = farPinned ? '3EI/L' : '4EI/L';
      c.k = farPinned ? (3 * I) / c.m.L : (4 * I) / c.m.L;
      c.kRel = farPinned ? 0.75 * I / c.m.L : I / c.m.L; // relative stiffness (×4EI)
      c.cof = pinnedEnd(c.far) ? 0 : 0.5; // carry over INTO far end
      c.farPinned = farPinned;
    });
    // joints that get balanced every cycle (rigid joints / pinned supports with >1 member)
    const joints = model.nodes.filter((n) => n.sup !== 'fixed' && !pinnedEnd(n.id)).map((n) => {
      const cs = cols.filter((c) => c.node === n.id);
      const sumK = cs.reduce((s, c) => s + c.k, 0);
      cs.forEach((c) => (c.DF = c.k / sumK));
      return { node: n.id, cols: cs.map((c) => colByKey[c.key]), sumK };
    });
    const endJoints = model.nodes.filter((n) => pinnedEnd(n.id));
    cols.forEach((c) => {
      if (c.DF === undefined) c.DF = pinnedEnd(c.node) ? 1 : 0;
    });
    const rows = [];
    const zero = () => new Array(cols.length).fill(0);
    rows.push({ label: 'FEM', vals: cols.map((c) => c.fem) });
    // release simple ends
    if (endJoints.length) {
      const bal = zero(), co = zero();
      endJoints.forEach((n) => {
        cols.forEach((c, k) => {
          if (c.node === n.id) {
            bal[k] = -c.fem;
            // carry over to the far end (far end is not pinned)
            const back = colByKey[c.far + c.node];
            co[back] += 0.5 * bal[k];
          }
        });
      });
      rows.push({ label: 'Release simple end', vals: bal, kind: 'bal' });
      rows.push({ label: 'Carry over', vals: co, kind: 'co' });
    }
    // current unbalanced = sum of everything at each joint so far
    let pending = cols.map((c, k) => rows.reduce((s, r) => s + r.vals[k], 0));
    let cycle = 0;
    while (cycle < maxCycles) {
      const bal = zero();
      let maxUnb = 0;
      joints.forEach((j) => {
        const unb = j.cols.reduce((s, k) => s + pending[k], 0);
        maxUnb = Math.max(maxUnb, Math.abs(unb));
        j.cols.forEach((k) => (bal[k] = -cols[k].DF * unb));
      });
      if (maxUnb < tol) break;
      cycle++;
      rows.push({ label: 'Balance', vals: bal, kind: 'bal', cycle });
      const co = zero();
      cols.forEach((c, k) => {
        if (bal[k] !== 0) {
          const back = colByKey[c.far + c.node];
          co[back] += c.cof * bal[k];
        }
      });
      const coSum = co.reduce((s, v) => s + Math.abs(v), 0);
      if (coSum < 1e-12) break;
      rows.push({ label: 'Carry over', vals: co, kind: 'co', cycle });
      pending = co.slice();
      // rigid joints only receive their own carry over; already the pending
    }
    const final = cols.map((c, k) => rows.reduce((s, r) => s + r.vals[k], 0));
    return { cols, rows, final, joints, endJoints: endJoints.map((n) => n.id) };
  };

  /** Distribution factors at a single joint: members [{name, L, I, far:'fixed'|'pinned'}] */
  E.jointDF = function (members) {
    const ks = members.map((m) => (m.far === 'pinned' ? 3 : 4) * (m.I || 1) / m.L);
    const s = ks.reduce((a, b) => a + b, 0);
    return members.map((m, i) => ({ ...m, k: ks[i], DF: ks[i] / s }));
  };

  /* =====================================================================
     MODULE 5 — three hinged arches & cables
     ===================================================================== */
  /** loads: [{type:'P', P, x}] [{type:'UDL', w, x1, x2}] — x from LEFT support */
  E.beamReactions = function (L, loads) {
    let W = 0, Mab = 0;
    for (const ld of loads) {
      if (ld.type === 'P') { W += ld.P; Mab += ld.P * ld.x; }
      else { const F = ld.w * (ld.x2 - ld.x1); W += F; Mab += F * (ld.x1 + ld.x2) / 2; }
    }
    const VB = Mab / L; return { VA: W - VB, VB, W };
  };
  /** simply supported beam moment at x (sagging +) and shear (left part, upward +) */
  E.beamMoment = function (L, loads, x) {
    const { VA } = E.beamReactions(L, loads);
    let m = VA * x;
    for (const ld of loads) {
      if (ld.type === 'P') { if (ld.x < x) m -= ld.P * (x - ld.x); }
      else {
        const e = Math.min(x, ld.x2);
        if (e > ld.x1) m -= ld.w * (e - ld.x1) * (x - (ld.x1 + e) / 2);
      }
    }
    return m;
  };
  E.beamShear = function (L, loads, x, side) {
    const { VA } = E.beamReactions(L, loads);
    let v = VA;
    for (const ld of loads) {
      if (ld.type === 'P') {
        if (ld.x < x - 1e-9 || (side === 'right' && Math.abs(ld.x - x) < 1e-9)) v -= ld.P;
      } else {
        const e = Math.min(x, ld.x2);
        if (e > ld.x1) v -= ld.w * (e - ld.x1);
      }
    }
    return v;
  };

  E.archGeom = function (shape, L, h) {
    if (shape === 'parabolic') {
      return {
        y: (x) => (4 * h * x * (L - x)) / (L * L),
        slope: (x) => (4 * h * (L - 2 * x)) / (L * L), // tanθ
        theta: (x) => Math.atan((4 * h * (L - 2 * x)) / (L * L)),
      };
    }
    const R = ((L * L) / 4 + h * h) / (2 * h);
    return {
      R,
      y: (x) => Math.sqrt(R * R - Math.pow(L / 2 - x, 2)) - (R - h),
      theta: (x) => Math.asin((L / 2 - x) / R),
      slope: (x) => Math.tan(Math.asin((L / 2 - x) / R)),
    };
  };
  /** Three hinged arch, supports at same level, crown hinge at mid-span. */
  E.threeHingedArch = function (shape, L, h, loads) {
    const g = E.archGeom(shape, L, h);
    const { VA, VB, W } = E.beamReactions(L, loads);
    const Mc = E.beamMoment(L, loads, L / 2);
    const H = Mc / h;
    const RA = Math.hypot(VA, H), RB = Math.hypot(VB, H);
    const at = (x, side) => {
      const y = g.y(x), th = g.theta(x);
      const Mb = E.beamMoment(L, loads, x);
      const V = E.beamShear(L, loads, x, side);
      const M = Mb - H * y;
      const N = V * Math.sin(th) + H * Math.cos(th);
      const S = V * Math.cos(th) - H * Math.sin(th);
      return { x, y, theta: th, Mb, V, M, N, S };
    };
    return { g, VA, VB, W, H, Mc, RA, RB, angA: Math.atan2(VA, H), angB: Math.atan2(VB, H), at, R: g.R };
  };

  /** Cable with point loads, supports at same level, one known sag (general cable theorem). */
  E.cablePoints = function (L, loads, known) {
    const bl = loads.map((l) => ({ type: 'P', P: l.P, x: l.x }));
    const { VA, VB, W } = E.beamReactions(L, bl);
    const Mk = E.beamMoment(L, bl, known.x);
    const H = Mk / known.y;
    const pts = [{ x: 0, y: 0, name: 'A' }]
      .concat(loads.map((l) => ({ x: l.x, y: E.beamMoment(L, bl, l.x) / H, name: l.name, M: E.beamMoment(L, bl, l.x) })))
      .concat([{ x: L, y: 0, name: 'B' }]);
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
      const len = Math.hypot(dx, dy);
      segs.push({ from: pts[i].name, to: pts[i + 1].name, dx, dy, len, T: (H * len) / dx, ang: Math.atan2(Math.abs(dy), dx) });
    }
    const length = segs.reduce((s, q) => s + q.len, 0);
    const Tmax = Math.max(...segs.map((s) => s.T));
    return { VA, VB, W, H, Mk, pts, segs, length, Tmax };
  };
  /** Cable under UDL w per horizontal metre, span L, central dip d. */
  E.cableUDL = function (L, w, d) {
    const H = (w * L * L) / (8 * d), V = (w * L) / 2;
    const Tmax = Math.hypot(H, V);
    const Tmin = H;
    const theta = Math.atan((4 * d) / L);
    const length = L + (8 * d * d) / (3 * L);
    return { H, V, Tmax, Tmin, theta, length };
  };
  /** Anchor cable over a pier of height hp. T = main cable tension, alpha =
   *  main cable angle with horizontal, beta = anchor cable angle (radians). */
  E.anchorCable = function (T, alpha, beta, hp) {
    const pulley = {
      T2: T,
      V: T * Math.sin(alpha) + T * Math.sin(beta),
      Hnet: Math.abs(T * Math.cos(alpha) - T * Math.cos(beta)),
    };
    pulley.Mbase = pulley.Hnet * hp;
    const T2 = (T * Math.cos(alpha)) / Math.cos(beta);
    const saddle = { T2, V: T * Math.sin(alpha) + T2 * Math.sin(beta), Hnet: 0, Mbase: 0 };
    return { pulley, saddle };
  };

  /* =====================================================================
     Generic deflected shape of a member from its sagging BM diagram
     (double integration, ends at zero deflection unless cantilever)
     ===================================================================== */
  E.deflectedShape = function (L, Mfun, EIfun, bc, n) {
    n = n || 120;
    const xs = [], m = [];
    for (let k = 0; k <= n; k++) { const x = (L * k) / n; xs.push(x); m.push(Mfun(x) / (EIfun ? EIfun(x) : 1)); }
    const h = L / n;
    const slope = [0], v = [0];
    for (let k = 1; k <= n; k++) {
      slope[k] = slope[k - 1] + (h * (m[k - 1] + m[k])) / 2;
      v[k] = v[k - 1] + (h * (slope[k - 1] + slope[k])) / 2;
    }
    if (bc === 'cantilever-left') return { xs, v, slope };
    // v(L)=0 with v(0)=0 -> add C1·x
    const C1 = -v[n] / L;
    return { xs, v: v.map((val, k) => val + C1 * xs[k]), slope: slope.map((s) => s + C1) };
  };

  /* ---------- Indeterminacy reference table ---------- */
  E.indeterminacyBank = [
    { id: 'ss', name: 'Simply supported beam (hinge + roller)', r: 3, Ds: 0, Dk: 3, DkNA: 2, note: 'Unknown joint displacements: θA, θB and horizontal movement at roller B.' },
    { id: 'cant', name: 'Cantilever beam', r: 3, Ds: 0, Dk: 3, DkNA: 2, note: 'Free end can move horizontally, vertically and rotate.' },
    { id: 'prop', name: 'Propped cantilever (fixed + roller)', r: 4, Ds: 1, Dk: 2, DkNA: 1, note: 'At the prop: rotation θB and horizontal movement.' },
    { id: 'fixed', name: 'Fixed beam (general loading)', r: 6, Ds: 3, Dk: 0, DkNA: 0, note: 'Both ends fully restrained: no joint can move.' },
    { id: 'cont2', name: 'Two span continuous beam (hinge + 2 rollers)', r: 4, Ds: 1, Dk: 5, DkNA: 3, note: 'θA, θB, θC plus horizontal movement at B and C.' },
    { id: 'cont3fix', name: 'Three span beam, both ends fixed, 2 inner rollers', r: 8, Ds: 5, Dk: 4, DkNA: 2, note: 'θB, θC and horizontal movement at B and C.' },
    { id: 'portalF', name: 'Portal frame, both feet fixed', r: 6, m: 3, j: 4, Ds: 3, Dk: 6, DkNA: 3, note: 'Ds = 3m + r − 3j = 9 + 6 − 12 = 3. Joints B, C: (u, v, θ) each = 6; neglecting axial change: θB, θC and one sway = 3.' },
    { id: 'portalH', name: 'Portal frame, both feet hinged', r: 4, m: 3, j: 4, Ds: 1, Dk: 8, DkNA: 5, note: 'Ds = 9 + 4 − 12 = 1. Dk = 3j − r = 8; neglecting axial: θA, θB, θC, θD + sway = 5.' },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  else root.TOS = E;
})(typeof window !== 'undefined' ? window : globalThis);
