/* =====================================================================
   TOS-III Study Lab — application shell
   Views (hash routes): home, m1..m5 (+ -lab, -practice, -parta), pyq, exam
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS, V = window.Viz, C = window.CONTENT, P = window.PROBLEMS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const f = (x, d = 2) => T.fmt(x, d);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const view = () => $('#view');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tos3-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tos3-' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const progress = store.get('progress', {});
  const mark = (gen, solved) => { const p = progress[gen] || { tried: 0, solved: 0 }; p.tried++; if (solved) p.solved++; progress[gen] = p; store.set('progress', progress); };

  /* ------------------------------ routing ------------------------------ */
  const routes = { home: renderHome, pyq: renderPYQ, exam: renderExam };
  let pending = null; // {gen, preset}
  function route() {
    const hash = (location.hash || '#home').slice(1);
    const mm = hash.match(/^m([1-5])(?:-(learn|lab|practice|parta))?$/);
    $$('.nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + (mm ? 'm' + mm[1] : hash)));
    window.scrollTo(0, 0);
    if (mm) return renderModule(+mm[1], mm[2] || 'learn');
    (routes[hash] || renderHome)();
  }
  window.addEventListener('hashchange', route);

  /* ------------------------------ HOME ------------------------------ */
  const TAG = { 1: 'How far a beam bends and tilts', 2: 'Beams with one support too many', 3: 'Let the joints twist, then balance them', 4: 'Share moments between joints, round by round', 5: 'Arches that push, cables that pull' };
  function renderHome() {
    view().innerHTML = `
      <section class="home-hero">
        <div class="hh-text">
          <p class="eyebrow">AET201 · Theory of Structures III</p>
          <h1>See how structures <span class="grad">bend, push and pull</span>.</h1>
          <p class="lede">Pick a module below. Every module works the same simple way:</p>
          <ol class="path">
            <li><span class="pi">1</span><b>Learn</b><small>the idea, animated</small></li>
            <li><span class="pi">2</span><b>Play</b><small>in the lab</small></li>
            <li><span class="pi">3</span><b>Solve</b><small>real questions, step by step</small></li>
          </ol>
          <div class="cta"><a class="btn primary big" href="#m1">Start with Module 1 →</a><button class="btn ghost big" data-tour>Show me around</button></div>
        </div>
        <div class="hh-viz"><div class="demo hero-demo"><div class="dstage"></div><div class="dbar"><button class="dplay" aria-label="Pause">❚❚</button><p class="dcap"></p><span class="ddots"></span></div></div></div>
      </section>
      <section>
        <h2 class="sec-h">Choose a module</h2>
        <div class="mgrid">${C.MODULES.map((m) => { const solved = m.gens.reduce((t, g) => t + ((progress[g] || {}).solved || 0), 0); return `
          <article class="mcard" style="--i:${m.n}">
            <a class="mc-top" href="#m${m.n}"><span class="mc-n">0${m.n}</span>${m.n === 1 ? '<span class="mc-badge">Start here</span>' : ''}<h3>${m.name}</h3><p>${TAG[m.n]}</p></a>
            <p class="mc-k">Questions you will solve</p>
            <div class="qchips">${m.gens.map((g) => `<a class="qchip" href="#m${m.n}-practice" data-gen="${g}">${P[g].title}</a>`).join('')}</div>
            <div class="mc-actions"><a href="#m${m.n}">Learn</a><a href="#m${m.n}-lab">Lab</a><a href="#m${m.n}-practice">Practise</a>${solved ? `<span class="mc-solved">✓ ${solved}</span>` : ''}</div>
          </article>`; }).join('')}</div>
      </section>`;
    $$('a[data-gen]', view()).forEach((a) => a.addEventListener('click', () => { pending = { gen: a.dataset.gen, preset: null }; }));
    $('[data-tour]', view()).addEventListener('click', startTour);
    const hd = $('.hero-demo', view()); const d = mountDemo(hd, window.DEMOS[2][4]); d.resume();
  }

  /* ------------------------------ MODULE ------------------------------ */
  function renderModule(n, tab) {
    const M = C.MODULES[n - 1];
    const tabs = [['learn', 'Learn'], ['lab', 'Lab'], ['practice', 'Practise'], ['parta', 'Theory questions']];
    view().innerHTML = `
      <section class="mhead">
        <p class="eyebrow">Module ${n}</p>
        <h1>${M.name}</h1>
        <p class="muted">${M.syllabus}</p>
        <nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<a role="tab" href="#m${n}-${k}" class="${k === tab ? 'on' : ''}" aria-selected="${k === tab}">${l}</a>`).join('')}</nav>
      </section>
      <section id="mbody"></section>`;
    const body = $('#mbody');
    if (tab === 'learn') renderLearn(M, body);
    if (tab === 'lab') renderLab(n, body);
    if (tab === 'practice') renderPractice(M, body);
    if (tab === 'parta') renderPartA(M, body);
  }

  function renderLearn(M, body) {
    const demos = (window.DEMOS || {})[M.n] || [];
    body.innerHTML = `<div class="learn">${M.theory.map((s, i) => `
      <article class="tcard" data-i="${i}">
        <h2><span class="idx">${M.n}.${i + 1}</span>${s.h}</h2>
        ${demos[i] ? `<div class="demo"><div class="dstage"></div><div class="dbar"><button class="dplay" aria-label="Pause">❚❚</button><p class="dcap"></p><span class="ddots"></span></div></div>` : ''}
        ${s.kid ? `<p class="simple">${s.kid}</p>` : ''}
        <details class="exam"><summary>Exam notes & formulas</summary><div class="tbody">${s.body}</div></details>
      </article>`).join('')}
      <div class="next-row"><a class="btn" href="#m${M.n}-lab">Try it in the lab</a><a class="btn primary" href="#m${M.n}-practice">Practise KTU questions</a></div>
    </div>`;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((e) => { const c = e.target; if (e.isIntersecting) { if (!c._demo) c._demo = mountDemo(c, demos[+c.dataset.i]); c._demo.resume(); } else if (c._demo) c._demo.pause(); }), { threshold: 0.35 }) : null;
    $$('.tcard', body).forEach((c) => { if (!demos[+c.dataset.i]) return; if (io) io.observe(c); else c._demo = mountDemo(c, demos[+c.dataset.i]); });
  }
  function mountDemo(card, builder) {
    let d; try { d = builder(); } catch (e) { $('.demo', card).remove(); return { pause() {}, resume() {} }; }
    const st = window.Stage.create($('.dstage', card), d.scene);
    const cap = $('.dcap', card), dots = $('.ddots', card), btn = $('.dplay', card);
    dots.innerHTML = d.frames.map((_, k) => `<i data-k="${k}"></i>`).join('');
    let i = 0, timer = null, userPaused = false;
    const show = () => { const fr = d.frames[i]; st.show(Object.assign({}, fr, { scene: fr.scene || d.scene })); cap.innerHTML = fr.cap || ''; $$('i', dots).forEach((x, k) => x.classList.toggle('on', k === i)); };
    const tick = () => { i = (i + 1) % d.frames.length; show(); };
    const start = () => { clearInterval(timer); if (d.frames.length > 1) timer = setInterval(tick, 4200); btn.textContent = '❚❚'; btn.setAttribute('aria-label', 'Pause'); };
    const stop = () => { clearInterval(timer); timer = null; btn.textContent = '▶'; btn.setAttribute('aria-label', 'Play'); };
    btn.addEventListener('click', () => { if (timer) { userPaused = true; stop(); } else { userPaused = false; tick(); start(); } });
    $$('i', dots).forEach((x) => x.addEventListener('click', () => { i = +x.dataset.k; show(); userPaused = true; stop(); }));
    $('.dstage', card).addEventListener('click', () => { tick(); userPaused = true; stop(); });
    show();
    return { pause() { clearInterval(timer); }, resume() { if (!userPaused && !reducedMotion()) start(); else if (reducedMotion()) stop(); } };
  }
  const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ PART A ------------------------------ */
  function renderPartA(M, body) {
    const extra = M.n === 2 ? `<article class="tcard"><h2>Quick quiz: count Ds and Dk</h2><p class="kid"><span class="kid-tag">Simply put</span>Pick a structure, type your answers, then check. Dk is counted including axial deformation, as in Punmia; the value neglecting axial deformation is also accepted.</p><div id="indet"></div></article>` : '';
    body.innerHTML = `<div class="learn">${extra}${M.partA.map((q, i) => `
      <article class="tcard pa" data-i="${i}">
        <p class="eyebrow">${q.src} · 4 marks</p>
        <h3>${q.q}</h3>
        <label class="sr" for="pa${M.n}-${i}">Your answer</label>
        <textarea id="pa${M.n}-${i}" rows="4" placeholder="Write your answer as you would in the exam. Then reveal the model answer."></textarea>
        <div class="row"><button class="btn" data-act="reveal">Reveal model answer</button><span class="kw muted small"></span></div>
        <div class="model" hidden>${q.a}</div>
      </article>`).join('')}</div>`;
    $$('.pa', body).forEach((card) => {
      const q = M.partA[+card.dataset.i];
      $('[data-act=reveal]', card).addEventListener('click', () => {
        $('.model', card).hidden = false;
        const t = $('textarea', card).value.toLowerCase();
        const hits = q.keys.filter((k) => t.includes(k.toLowerCase()));
        $('.kw', card).innerHTML = t.trim() ? `Key ideas you mentioned: <b>${hits.length}/${q.keys.length}</b>${hits.length < q.keys.length ? ` · missing: ${q.keys.filter((k) => !hits.includes(k)).join(', ')}` : ' · well covered'}` : 'Key ideas examiners look for: ' + q.keys.join(', ');
      });
    });
    if (M.n === 2) renderIndetQuiz($('#indet'));
  }
  function renderIndetQuiz(el) {
    const bank = T.indeterminacyBank;
    el.innerHTML = `<div class="row wrap"><label for="iq-s">Structure</label><select id="iq-s">${bank.map((b, i) => `<option value="${i}">${b.name}</option>`).join('')}</select>
      <label for="iq-ds">Ds</label><input id="iq-ds" type="number" inputmode="numeric" class="num sm">
      <label for="iq-dk">Dk</label><input id="iq-dk" type="number" inputmode="numeric" class="num sm">
      <button class="btn" id="iq-go">Check</button></div><p id="iq-out" class="small"></p>`;
    $('#iq-go', el).addEventListener('click', () => {
      const b = bank[+$('#iq-s', el).value]; const ds = +$('#iq-ds', el).value, dk = +$('#iq-dk', el).value;
      const okS = ds === b.Ds, okK = dk === b.Dk || dk === b.DkNA;
      $('#iq-out', el).innerHTML = `${okS ? '✔' : '✘'} Ds = <b>${b.Ds}</b> (r = ${b.r}${b.m ? `, m = ${b.m}, j = ${b.j}` : ''}) · ${okK ? '✔' : '✘'} Dk = <b>${b.Dk}</b> (neglecting axial deformation: ${b.DkNA}). ${b.note}`;
      $('#iq-out', el).className = 'small ' + (okS && okK ? 'good' : 'bad');
    });
  }

  /* ------------------------------ PRACTICE ------------------------------ */
  function renderPractice(M, body) {
    const first = pending && M.gens.includes(pending.gen) ? pending : { gen: M.gens[0], preset: null };
    pending = null;
    body.innerHTML = `<div class="prac">
      <nav class="chips" aria-label="Question types">${M.gens.map((g) => { const d = P[g]; const pr = progress[g] || {}; return `<button class="chip${g === first.gen ? ' on' : ''}" data-gen="${g}">${d.title}${pr.solved ? ` <span class="tick">✓${pr.solved}</span>` : ''}</button>`; }).join('')}</nav>
      <div id="pmain" class="pmain"></div></div>`;
    $$('.chip', body).forEach((b) => b.addEventListener('click', () => { $$('.chip', body).forEach((x) => x.classList.toggle('on', x === b)); mountProblem($('#pmain'), b.dataset.gen, null); }));
    mountProblem($('#pmain'), first.gen, first.preset);
  }

  function mountProblem(host, gen, presetIdx, opts) {
    opts = opts || {};
    const def = P[gen];
    const preset = presetIdx !== null && presetIdx !== undefined && def.presets[presetIdx] ? def.presets[presetIdx] : null;
    const prob = window.makeProblem(gen, preset ? preset.params : null);
    window.__lastProb = prob; // used by automated tests
    host.innerHTML = `
      <div class="qcard">
        <div class="qhead">
          <span class="qmeta">${def.method} · 8 marks${preset ? ' · <b>' + preset.label + '</b>' : ''}</span>
          ${opts.exam ? '' : `<span class="qtools">
            ${def.presets.length ? `<label class="sr" for="pre-${gen}">Past paper numbers</label><select id="pre-${gen}" class="sm ghost"><option value="">Past papers</option>${def.presets.map((p, i) => `<option value="${i}" ${preset === p ? 'selected' : ''}>${p.label}</option>`).join('')}</select>` : ''}
            <button class="btn sm ghost" data-act="new" title="Same question, new numbers">↻ New numbers</button></span>`}
        </div>
        <p class="qtext">${prob.statement}</p>
        ${opts.exam ? '' : `<details class="approach"><summary><span class="ap-t">How to approach this question</span><span class="ap-s">Goal, strategy and why each step is needed</span></summary><div class="ap-body"></div></details>`}
        <div class="vizbox">
          <div class="vstage"></div>
          <div class="vtabs" role="tablist"></div>
          <div class="vextra"></div>
        </div>
        ${opts.exam ? '' : `<button class="btn primary big howbtn" type="button" data-act="solve">▶ Show me how, step by step</button>`}
        <form class="answers" novalidate>
          <p class="atitle">Your answers${prob.signNote ? ' <span class="muted small">(clockwise moments +)</span>' : ''}</p>
          ${prob.answers.map((a, i) => `<div class="arow" data-i="${i}"><label for="${gen}-a${i}">${a.label}</label><div class="ain"><input id="${gen}-a${i}" class="num" type="text" inputmode="decimal" autocomplete="off" placeholder="?"><span class="unit">${a.unit}</span><span class="mark" aria-live="polite"></span></div></div>`).join('')}
          <button class="btn primary" type="submit">Check</button>
        </form>
        <div class="feedback" aria-live="polite"></div>
      </div>`;
    const card = $('.qcard', host);
    mountViz(card, prob);
    if (!opts.exam) {
      $('[data-act=new]', card).addEventListener('click', () => mountProblem(host, gen, null));
      const sel = $('select', card); if (sel) sel.addEventListener('change', () => mountProblem(host, gen, sel.value === '' ? null : +sel.value));
      $('[data-act=solve]', card).addEventListener('click', () => window.Walk.open(prob));
      const ap = $('.approach', card);
      ap.addEventListener('toggle', () => { if (!ap.open || ap._done) return; ap._done = true; const steps = window.Walk.buildSteps(prob); $('.ap-body', ap).innerHTML = window.Walk.planHTML(prob, steps) + '<p class="small muted">Tap a step to watch it explained.</p>'; $$('[data-go]', ap).forEach((b) => b.addEventListener('click', () => window.Walk.open(prob, +b.dataset.go + 1))); });
    }
    const form = $('form', card);
    form.addEventListener('submit', (e) => { e.preventDefault(); const res = checkAnswers(card, prob, opts.exam); if (opts.onCheck) opts.onCheck(res); });
    return prob;
  }

  function mountViz(card, prob) {
    const tabsEl = $('.vtabs', card), stage = $('.vstage', card), extra = $('.vextra', card);
    const sc = prob.scene; let api = null;
    const tabs = [];
    if (sc.kind === 'beam') {
      tabs.push(['struct', 'Deflected shape'], ['stress', 'Stress (tension / compression)'], ['sfd', 'SFD'], ['bmd', 'BMD']);
    } else if (sc.kind === 'frame') tabs.push(['defl', 'Deflected shape'], ['bmd', 'BMD']);
    else if (sc.kind === 'arch') tabs.push(['arch', 'Arch & reactions'], ['mom', 'Why arches work']);
    else tabs.push(['main', 'Diagram']);
    tabsEl.innerHTML = tabs.map(([k, l], i) => `<button role="tab" data-k="${k}" class="${i ? '' : 'on'}" aria-selected="${!i}">${l}</button>`).join('') + '<button class="replay" data-k="replay" title="Replay animation">↻ Replay</button>';
    const keyX = sc.kind === 'beam' ? [...new Set(sc.names.map((n) => n[0]))] : [];
    const show = (k) => {
      extra.innerHTML = '';
      if (sc.kind === 'beam') {
        if (k === 'sfd') { stage.innerHTML = ''; V.diagram(stage, sc.L, sc.sf, sc.loads, 'Shear force diagram', 'kN', { keyX }); return; }
        if (k === 'bmd') { stage.innerHTML = ''; V.diagram(stage, sc.L, sc.bm, sc.loads, 'Bending moment diagram (sagging +)', 'kN·m', { keyX }); return; }
        api = V.beam(stage, sc); card._beam = api; api.play();
        if (k === 'stress') { api.stress(true); extra.innerHTML = '<p class="legend"><span class="sw ten"></span>Tension (fibres stretch) <span class="sw comp"></span>Compression (fibres squeeze). Darker means more stress. The colours swap sides where the moment changes sign (point of contraflexure).</p>'; }
        else extra.innerHTML = '<p class="legend">Deflection exaggerated for visibility. The beam always bends toward the side that is in tension.</p>';
      } else if (sc.kind === 'frame') { api = V.frame(stage, sc, k); card._frame = api; }
      else if (sc.kind === 'arch') { api = V.arch(stage, sc); if (k === 'mom') api.showMoments(); card._arch = api; }
      else if (sc.kind === 'cable') V.cable(stage, sc);
      else if (sc.kind === 'cableUDL') V.cableUDL(stage, sc);
      else if (sc.kind === 'joint') V.joint(stage, sc);
    };
    let cur = tabs[0][0];
    $$('button', tabsEl).forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.k === 'replay') return show(cur);
      cur = b.dataset.k; $$('button[role=tab]', tabsEl).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); show(cur);
    }));
    show(cur);
  }

  /* ---------------- answer checking + consequences ---------------- */
  const parseNum = (s) => { const v = parseFloat(String(s).replace(/[,\s]/g, '').replace(/[−–]/g, '-')); return isFinite(v) ? v : null; };
  function judge(a, user) {
    if (user === null) return { status: 'empty' };
    const tolRel = a.tolRel !== undefined ? a.tolRel : 0.01, tolAbs = a.tolAbs !== undefined ? a.tolAbs : 0.05;
    const targets = [a.value].concat(a.alt || []);
    const ok = (u, t) => Math.abs(u - t) <= Math.max(tolAbs, tolRel * Math.abs(t));
    if (a.signed) {
      if (targets.some((t) => ok(user, t))) return { status: 'ok' };
      if (targets.some((t) => ok(-user, t)) && Math.abs(a.value) > tolAbs) return { status: 'sign' };
    } else if (targets.some((t) => ok(Math.abs(user), Math.abs(t)))) return { status: 'ok' };
    return { status: 'wrong', ratio: Math.abs(a.value) > 1e-9 ? Math.abs(user) / Math.abs(a.value) : null };
  }
  function diagnose(ratio) {
    if (ratio === null || !isFinite(ratio)) return '';
    const near = (x) => Math.abs(ratio - x) < 0.03 * x;
    if (near(2)) return 'Your value is exactly <b>double</b> the correct one: check for a missing ½ (e.g. triangle area ½·b·h, or carry over ½).';
    if (near(0.5)) return 'Your value is exactly <b>half</b>: a factor of 2 is missing (e.g. 2EI/L, or 2θ in the slope deflection equation).';
    if (near(1.5) || near(2 / 3)) return 'Off by a factor of 1.5: check the centroid (⅔ vs ½ of the length) or the parabola area (⅔ vs ⅓).';
    if (near(4 / 3) || near(0.75)) return 'Off by 4/3: you may have mixed up 3EI/L and 4EI/L stiffness, or ⅓ and ¼ in a spandrel.';
    if (near(3) || near(1 / 3)) return 'Off by a factor of 3: check PL³/3EI vs PL³/EI, or the spandrel area (⅓ b h).';
    if (near(10) || near(0.1) || near(1000) || near(0.001)) return 'Off by a power of 10: check units (kN vs N, m vs mm).';
    return '';
  }
  function consequence(a, prob, ratio) {
    const pct = (x) => Math.round(x * 100);
    const under = ratio < 1;
    const k = a.kind;
    let title = '', text = '', u = null;
    if (k === 'defl' || k === 'slope') {
      title = under ? 'Your beam would sag more than you planned' : 'Your beam is over-designed';
      text = under
        ? `You predicted ${pct(ratio)}% of the real ${k === 'defl' ? 'deflection' : 'rotation'}. The real beam moves <b>${f(1 / ratio, 1)}×</b> more than you expect. In a building that means cracked plaster and floor tiles, doors and windows that jam, water ponding on flat roofs, and a floor that feels bouncy.`
        : `You predicted ${pct(ratio)}% of the real value. You would order a deeper, heavier, more expensive beam than needed. It is safe, but it wastes material and money.`;
    } else if (k === 'moment' || k === 'shear') {
      u = 1 / ratio;
      title = under ? 'Designing for your moment would crack the beam' : 'Safe, but uneconomical';
      text = under
        ? `If reinforcement were designed for your value, the real moment would push the steel to <b>${pct(u / 1.5)}% of its yield stress</b> (design normally keeps it near 67%). ${u / 1.5 > 1 ? 'The steel yields, wide cracks open on the tension face and the beam sags permanently.' : 'Cracks wider than allowed would appear on the tension face.'}`
        : `The section would be designed for ${pct(ratio)}% of what is needed: more steel and concrete than necessary.`;
    } else if (k === 'reaction') {
      u = 1 / ratio;
      title = under ? 'The support would be overloaded' : 'Oversized support';
      text = under ? `The bearing, column or foundation designed for your value would actually carry <b>${pct(u)}%</b> of its design load. It could crush the bearing or cause the foundation to settle, and settlement of one support changes every moment in the beam.` : `The support would be sized for ${pct(ratio)}% of the real load: safe but wasteful.`;
    } else if (k === 'thrust') {
      u = 1 / ratio;
      title = under ? 'The arch feet would slide apart' : 'Abutments bigger than needed';
      text = under ? `The abutments must resist the outward thrust. Sized for your value they get <b>${pct(u)}%</b> of their design thrust: they slide or rotate outwards, the crown drops and the arch can collapse. This is how many old masonry arches failed.` : 'Abutments sized for a larger thrust than real: safe but costly.';
    } else if (k === 'tension') {
      u = 1 / ratio;
      title = under ? 'The cable could snap' : 'Thicker cable than needed';
      text = under ? `A cable chosen for your tension is pulled to <b>${pct(u)}%</b> of its design force. High-strength wire has little ductility: overload means sudden fracture, with no warning sag.` : 'You would buy a thicker cable than required.';
    } else if (k === 'geom') {
      title = 'Geometry off';
      text = `Your value is ${pct(ratio)}% of the real one. A cable cut to the wrong length or hung with the wrong dip changes the tension in every segment (H = M/y), and clearance under the cable changes.`;
    } else if (k === 'df') {
      title = 'Wrong share of moment';
      text = 'With the wrong distribution factor the joint is never balanced: the final moments do not add to zero at the joint, so the answer violates equilibrium.';
    }
    return { title, text, u };
  }
  function checkAnswers(card, prob, exam) {
    const fb = $('.feedback', card); fb.innerHTML = '';
    let ok = 0, firstWrong = null;
    prob.answers.forEach((a, i) => {
      const row = $(`.arow[data-i="${i}"]`, card); const inp = $('input', row); const mk = $('.mark', row);
      const r = judge(a, parseNum(inp.value));
      row.classList.remove('ok', 'bad', 'sign');
      if (r.status === 'ok') { ok++; row.classList.add('ok'); mk.textContent = '✔'; }
      else if (r.status === 'empty') { mk.textContent = ''; }
      else { row.classList.add(r.status === 'sign' ? 'sign' : 'bad'); mk.textContent = r.status === 'sign' ? '± sign' : '✘'; if (!firstWrong) firstWrong = { a, r, i }; }
    });
    const total = prob.answers.length;
    mark(prob.id, ok === total);
    const head = h(`<div class="score ${ok === total ? 'good' : 'bad'}"><b>${ok}/${total}</b> correct${ok === total ? '. Well done: this is exactly what the examiner expects.' : '. Fix the red ones, or watch the solution.'}</div>`);
    fb.appendChild(head);
    if (firstWrong) {
      const { a, r } = firstWrong;
      if (r.status === 'sign') {
        fb.appendChild(h(`<div class="cons"><h4>Right size, wrong direction</h4><p>${a.label}: the magnitude is correct but the sign is not. In slope deflection and moment distribution, <b>clockwise moments are positive</b>. A hogging end moment at the left end of a span is anticlockwise (−), and at the right end it is clockwise (+).</p></div>`));
      } else if (r.ratio !== null) {
        const c = consequence(a, prob, r.ratio);
        const diag = diagnose(r.ratio);
        const def = prob.def;
        const restated = a.linear && def.loadKeys.length ? window.restateProblem(prob.id, prob.params, def.loadKeys, r.ratio) : null;
        const more = (diag || restated) ? `<details class="why"><summary>Why is my number off?</summary>${diag ? `<p class="diag">${diag}</p>` : ''}${restated ? `<div class="restate"><p class="small muted">Your number is right for this question, with the load${def.loadKeys.length > 1 ? 's' : ''} changed:</p><p>${restated}</p></div>` : ''}</details>` : '';
        const box = h(`<div class="cons"><h4>${c.title}</h4><div class="cons-grid"><div><p>${c.text}</p>${more}${exam ? '' : '<button class="btn sm" data-act="how2">▶ Show me how</button>'}</div><div class="gaugebox"></div></div></div>`);
        fb.appendChild(box);
        const h2 = $('[data-act=how2]', box); if (h2) h2.addEventListener('click', () => window.Walk.open(prob));
        if (c.u !== null) V.gauge($('.gaugebox', box), c.u, 'Real stress if built from your answer');
        else { $('.gaugebox', box).remove(); $('.cons-grid', box).classList.add('one'); }
        // structure animation: switch to the matching diagram first
        const tab = (k) => { const b = $(`.vtabs button[data-k="${k}"]`, card); if (b) b.click(); };
        if (prob.scene.kind === 'beam') tab(a.kind === 'moment' && c.u > 1.05 ? 'stress' : 'struct');
        if (prob.scene.kind === 'frame' && a.kind === 'moment') tab('bmd');
        if (card._beam && (a.kind === 'defl' || a.kind === 'slope')) card._beam.ghost(r.ratio, `your answer (${Math.round(r.ratio * 100)}%)`);
        if (card._beam && a.kind === 'moment' && c.u > 1.05) { card._beam.stress(true); card._beam.crack(a.at, Math.min(2, c.u - 1)); }
      }
    } else if (ok === total) {
      const box = h('<div class="cons good"><h4>Safe and economical</h4><div class="cons-grid"><div><p>Built from your numbers, the structure works exactly as designed: stresses stay in the elastic range with the normal safety margin.</p></div><div class="gaugebox"></div></div></div>');
      fb.appendChild(box); V.gauge($('.gaugebox', box), 1, 'Real stress if built from your answer');
      if (card._beam) { card._beam.clearGhost(); }
    }
    return { ok, total };
  }

  /* ------------------------------ LABS ------------------------------ */
  function slider(id, label, min, max, step, val, unit) {
    return `<div class="sl"><label for="${id}">${label} <output id="${id}-o">${val}</output> ${unit}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  }
  function renderLab(n, body) {
    if (n === 1) return lab1(body);
    if (n === 2) return lab2(body);
    if (n === 3) return lab3(body);
    if (n === 4) return lab4(body);
    return lab5(body);
  }
  function missions(body, list) {
    const ctl = $('.lab-ctl', body); const box = h('<div class="mission" aria-live="polite"></div>'); ctl.prepend(box);
    let i = 0, done = false;
    const dots = () => `<span class="m-dots">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</span>`;
    const target = (m) => { $$('.pulse-target', body).forEach((x) => x.classList.remove('pulse-target')); const t = m && m.el && $(m.el, body); if (t) (t.closest('.sl') || t).classList.add('pulse-target'); };
    const render = () => {
      done = false;
      if (i >= list.length) { target(null); box.className = 'mission all'; box.innerHTML = `<div class="m-head"><span class="m-k">All missions complete</span>${dots()}</div><p class="m-do">Now play freely: every number and picture updates live.</p><button class="btn sm ghost" data-m="again">Do them again</button>`; $('[data-m=again]', box).addEventListener('click', () => { i = 0; render(); }); return; }
      const m = list[i]; box.className = 'mission';
      box.innerHTML = `<div class="m-head"><span class="m-k">Mission ${i + 1} of ${list.length}</span>${dots()}</div><p class="m-do">${m.do}</p>${m.look ? `<p class="m-look">Watch: ${m.look}</p>` : ''}${m.manual ? '<button class="btn sm primary" data-m="ok">I have looked</button>' : ''}`;
      target(m);
      if (m.manual) $('[data-m=ok]', box).addEventListener('click', win);
      setTimeout(check, 30);
    };
    function win() {
      if (done) return; done = true; const m = list[i]; target(null);
      box.className = 'mission won';
      box.innerHTML = `<div class="m-head"><span class="m-k">✓ Mission ${i + 1} done</span>${dots()}</div><p class="m-why"><b>What happened, and why:</b> ${m.why}</p><button class="btn sm primary" data-m="next">${i === list.length - 1 ? 'Finish' : 'Next mission →'}</button>`;
      $('[data-m=next]', box).addEventListener('click', () => { i++; render(); });
    }
    function check() { if (done || i >= list.length) return; const m = list[i]; if (!m.manual && m.check()) win(); }
    body.addEventListener('input', () => setTimeout(check, 60));
    body.addEventListener('click', (e) => { if (!box.contains(e.target)) setTimeout(check, 120); });
    body.addEventListener('change', () => setTimeout(check, 120));
    render();
  }
  const valOf = (body, id) => +$('#' + id, body).value;
  function bindSliders(body, ids, fn) { ids.forEach((id) => { const i = $('#' + id, body); i.addEventListener('input', () => { $('#' + id + '-o', body).textContent = i.value; fn(); }); }); fn(); }

  function lab1(body) {
    body.innerHTML = `<div class="lab"><div class="lab-ctl card">
      <h3>Beam playground</h3>
      <div class="seg" role="radiogroup" aria-label="Support"><button class="on" data-s="cant">Cantilever</button><button data-s="ss">Simply supported</button></div>
      ${slider('l1L', 'Span L', 2, 8, 0.5, 4, 'm')}${slider('l1P', 'Point load P', 0, 100, 5, 40, 'kN')}${slider('l1a', 'P position (% of L from A)', 10, 100, 5, 100, '%')}${slider('l1w', 'UDL w', 0, 40, 1, 10, 'kN/m')}
      <div class="seg" role="radiogroup" aria-label="Material"><button class="on" data-m="rc">RCC (E = 25 GPa)</button><button data-m="st">Steel (E = 200 GPa)</button></div>
      ${slider('l1b', 'Width b', 150, 400, 10, 230, 'mm')}${slider('l1d', 'Depth D', 150, 750, 10, 450, 'mm')}
      </div>
      <div class="lab-out"><div id="l1viz" class="vizbox"></div><div class="readouts" id="l1r"></div><div id="l1bmd"></div></div></div>
      <p class="small muted">Gross-section stiffness, linear elastic. The L/250 check refers to IS 456:2000 cl. 23.2 (real-world context; not needed in the AET201 exam).</p>`;
    let sup = 'cant', mat = 'rc';
    $$('[data-s]', body).forEach((b) => b.addEventListener('click', () => { sup = b.dataset.s; $$('[data-s]', body).forEach((x) => x.classList.toggle('on', x === b)); run(); }));
    $$('[data-m]', body).forEach((b) => b.addEventListener('click', () => { mat = b.dataset.m; $$('[data-m]', body).forEach((x) => x.classList.toggle('on', x === b)); run(); }));
    const run = () => {
      const L = +$('#l1L', body).value, Pl = +$('#l1P', body).value, a = L * +$('#l1a', body).value / 100, w = +$('#l1w', body).value;
      const b = +$('#l1b', body).value / 1000, D = +$('#l1d', body).value / 1000;
      const Ei = (mat === 'rc' ? 25e6 : 200e6) * b * D ** 3 / 12; // kN·m²
      const loads = []; if (w) loads.push({ type: 'UDL', x1: 0, x2: L, w, label: `${w} kN/m` }); if (Pl) loads.push({ type: 'P', x: a, P: Pl, label: `${Pl} kN` });
      let bm, sf, sc;
      if (sup === 'cant') {
        bm = (x) => -((x < a ? Pl * (a - x) : 0) + w * (L - x) ** 2 / 2); sf = (x) => (x < a ? Pl : 0) + w * (L - x);
        sc = { kind: 'beam', L, supports: [{ x: 0, type: 'fixed' }], loads, names: [[0, 'A'], [L, 'B']], bm, sf, bc: 'cantilever-left', EI: () => 1 };
      } else {
        const RA = Pl * (L - a) / L + w * L / 2;
        bm = (x) => RA * x - (x > a ? Pl * (x - a) : 0) - w * x * x / 2; sf = (x) => RA - (x > a ? Pl : 0) - w * x;
        sc = { kind: 'beam', L, supports: [{ x: 0, type: 'pin' }, { x: L, type: 'roller' }], loads, names: [[0, 'A'], [L, 'B']], bm, sf, bc: 'ss', EI: () => 1 };
      }
      const api = V.beam($('#l1viz', body), sc); api.stress(true); api.show();
      const sh = T.deflectedShape(L, bm, () => 1, sup === 'cant' ? 'cantilever-left' : 'ss', 400);
      const dmax = Math.max(...sh.v.map(Math.abs)), smax = Math.max(...sh.slope.map(Math.abs));
      let Mmax = 0; for (let k = 0; k <= 200; k++) Mmax = Math.max(Mmax, Math.abs(bm(L * k / 200)));
      const dmm = dmax / Ei * 1000, lim = L * 1000 / 250;
      const sig = Mmax * 1e6 / (b * 1000 * (D * 1000) ** 2 / 6);
      const pct = Math.min(100, dmm / lim * 100);
      $('#l1r', body).innerHTML = `
        <div class="ro"><span>Max slope</span><b>${f(smax, 2)}/EI</b><small>${f(smax / Ei * 1000, 3)} ×10⁻³ rad</small></div>
        <div class="ro"><span>Max deflection</span><b>${f(dmax, 2)}/EI</b><small>${f(dmm, 1)} mm</small></div>
        <div class="ro"><span>Max BM</span><b>${f(Mmax)} kN·m</b><small>σ = M/Z = ${f(sig, 1)} N/mm²</small></div>
        <div class="ro meter ${dmm > lim ? 'bad' : 'good'}"><span>Deflection vs span/250 = ${f(lim, 1)} mm</span><div class="bar"><i style="width:${pct}%"></i></div><small>${dmm > lim ? 'Too flexible: make the beam deeper. Depth has a cubic effect: +26% depth halves the deflection.' : 'Within the limit.'}</small></div>`;
      V.diagram($('#l1bmd', body), L, bm, loads, 'Bending moment diagram', 'kN·m', { keyX: [0, L, a] });
    };
    bindSliders(body, ['l1L', 'l1P', 'l1a', 'l1w', 'l1b', 'l1d'], run);
    const ss = () => $('[data-s="ss"]', body).classList.contains('on');
    missions(body, [
      { do: 'Drag <b>Point load P</b> up to 80 kN or more.', el: '#l1P', look: 'the tip and the "Max deflection" number.', check: () => valOf(body, 'l1P') >= 80, why: 'The beam bent about twice as much. Beams are linear: double the load gives double the moment and double the deflection. That is why every exam answer simply scales with the load.' },
      { do: 'Drag <b>Depth D</b> up to 700 mm or more.', el: '#l1d', look: 'the deflection bar.', check: () => valOf(body, 'l1d') >= 700, why: 'The deflection dropped sharply. Stiffness I = bD³/12 grows with the cube of the depth: 1.5× deeper is 3.4× stiffer. That is why real beams are deep, not wide.' },
      { do: 'Switch the support to <b>Simply supported</b>.', el: '[data-s="ss"]', look: 'where the red (tension) colour goes.', check: ss, why: 'The beam now sags in the middle, so the tension (red) moves from the top to the bottom. That is why steel bars go at the top of a cantilever but at the bottom of a simple beam.' },
      { do: 'Drag <b>P position</b> to the middle (50%).', el: '#l1a', look: 'the peak of the bending moment diagram.', check: () => ss() && Math.abs(valOf(body, 'l1a') - 50) <= 5, why: 'The biggest moment sits right under the load, and it is largest when the load is in the middle: PL/4. Designers check this worst position.' },
    ]);
  }

  function lab2(body) {
    body.innerHTML = `<div class="lab"><div class="lab-ctl card"><h3>More supports: the moment moves, the sag drops</h3><p class="small">One span, one UDL, three ways of holding it. Move the sliders and compare.</p>
      ${slider('l2L', 'Span L', 3, 10, 0.5, 6, 'm')}${slider('l2w', 'UDL w', 5, 60, 1, 27, 'kN/m')}
      <p class="small muted">Every extra restraint is one more redundant (Ds = 0, 1, 2 for vertical load). The propped cantilever still has wL²/8, but now as hogging at the wall, and only 9wL²/128 sagging in the span. The fixed beam halves the peak to wL²/12. Deflection drops by about 2.4× and 5×.</p></div>
      <div class="lab-out" id="l2out"></div></div>`;
    const run = () => {
      const L = +$('#l2L', body).value, w = +$('#l2w', body).value;
      const pr = T.proppedUDL(L, w), fx = T.fixedUDL(L, w);
      const cases = [
        { n: 'Simply supported (Ds = 0)', sup: [{ x: 0, type: 'pin' }, { x: L, type: 'roller' }], bm: (x) => w * x * (L - x) / 2, sf: (x) => w * (L / 2 - x), max: w * L * L / 8, d: 5 * w * L ** 4 / 384 },
        { n: 'Propped cantilever (Ds = 1)', sup: [{ x: 0, type: 'fixed' }, { x: L, type: 'roller' }], bm: (x) => -pr.MA + pr.RA * x - w * x * x / 2, sf: (x) => pr.RA - w * x, max: pr.MA, d: w * L ** 4 / 185 },
        { n: 'Fixed beam (Ds = 2)', sup: [{ x: 0, type: 'fixed' }, { x: L, type: 'fixed', right: true }], bm: (x) => -fx.MA + fx.RA * x - w * x * x / 2, sf: (x) => fx.RA - w * x, max: fx.MA, d: w * L ** 4 / 384 },
      ];
      const out = $('#l2out', body); out.innerHTML = '';
      const big = cases[0].max;
      cases.forEach((cs) => {
        const box = h(`<div class="cmp card"><h4>${cs.n}</h4><div class="v"></div><div class="d"></div><div class="row wrap small"><span>Largest |M| = <b>${f(cs.max)} kN·m</b></span><span class="barw"><i style="width:${cs.max / big * 100}%"></i></span><span>Max deflection ≈ <b>${f(cs.d)}/EI</b></span></div></div>`);
        out.appendChild(box);
        const sc = { kind: 'beam', L, supports: cs.sup, loads: [{ type: 'UDL', x1: 0, x2: L, w, label: `${w} kN/m` }], names: [[0, 'A'], [L, 'B']], bm: cs.bm, sf: cs.sf, bc: 'ss', EI: () => 1 };
        const api = V.beam($('.v', box), sc); api.stress(true); api.show();
        V.diagram($('.d', box), L, cs.bm, sc.loads, 'BMD', 'kN·m', { keyX: [0, L] });
      });
    };
    bindSliders(body, ['l2L', 'l2w'], run);
    missions(body, [
      { do: 'Drag the <b>UDL w</b> to 50 kN/m or more.', el: '#l2w', look: 'all three moment diagrams.', check: () => valOf(body, 'l2w') >= 50, why: 'All three grew by the same factor, because moment is proportional to load. Their ratio stays fixed: wL²/8 for the first two, wL²/12 for the fixed beam.' },
      { do: 'Drag the <b>Span L</b> to 10 m.', el: '#l2L', look: 'the "Max deflection" numbers.', check: () => valOf(body, 'l2L') >= 10, why: 'Moment grows with L² but deflection with L⁴: a span 1.7× longer bends about 8× more. Long spans need much deeper beams or extra supports.' },
      { do: 'Compare the three deflection numbers, top to bottom.', manual: true, why: 'Each extra restraint cuts the sag: 5wL⁴/384 → wL⁴/185 → wL⁴/384, roughly 1 : 0.4 : 0.2. Indeterminate beams are stiffer. The price is that statics alone cannot solve them, which is what this module is about.' },
    ]);
  }

  function lab3(body) {
    body.innerHTML = `<div class="lab"><div class="lab-ctl card"><h3>Twist joint B until it balances</h3>
      <p class="small">Beam ABC, A and C fixed. Only joint B can rotate. Drag θ<sub>B</sub>; the slope deflection equations update live. The right twist is the one that makes ΣM<sub>B</sub> = 0, which is exactly what the joint equation solves.</p>
      ${slider('l3w', 'UDL on AB', 0, 40, 1, 18, 'kN/m')}${slider('l3P', 'Central load on BC', 0, 100, 5, 25, 'kN')}${slider('l3L1', 'AB length', 3, 8, 0.5, 4.5, 'm')}${slider('l3L2', 'BC length', 3, 8, 0.5, 5.5, 'm')}
      ${slider('l3t', 'EIθ<sub>B</sub> (your guess)', -60, 60, 0.5, 0, '')}
      <button class="btn" id="l3snap">Snap to the solution</button></div>
      <div class="lab-out"><div id="l3viz" class="vizbox"></div><div id="l3eq" class="card eqs"></div></div></div>`;
    const run = () => {
      const w = +$('#l3w', body).value, Pl = +$('#l3P', body).value, L1 = +$('#l3L1', body).value, L2 = +$('#l3L2', body).value, th = +$('#l3t', body).value;
      const FBA = w * L1 * L1 / 12, FAB = -FBA, FBC = -Pl * L2 / 8, FCB = Pl * L2 / 8;
      const MAB = FAB + 2 / L1 * th, MBA = FBA + 4 / L1 * th, MBC = FBC + 4 / L2 * th, MCB = FCB + 2 / L2 * th;
      const sum = MBA + MBC; const sol = -(FBA + FBC) / (4 / L1 + 4 / L2);
      body._sol = sol;
      const model = { nodes: [{ id: 'A', x: 0, y: 0, sup: 'fixed' }, { id: 'B', x: L1, y: 0, sup: 'roller' }, { id: 'C', x: L1 + L2, y: 0, sup: 'fixed' }], members: [{ i: 'A', j: 'B', I: 1, loads: w ? [{ type: 'UDL', w }] : [] }, { i: 'B', j: 'C', I: 1, loads: Pl ? [{ type: 'P', P: Pl, a: L2 / 2 }] : [] }] };
      const mem = [{ L: L1, loads: model.members[0].loads, Mij: MAB, Mji: MBA }, { L: L2, loads: model.members[1].loads, Mij: MBC, Mji: MCB }];
      const bm = (x) => x <= L1 ? T.memberMoment(L1, mem[0].loads, MAB, MBA, x) : T.memberMoment(L2, mem[1].loads, MBC, MCB, x - L1);
      const loads = []; if (w) loads.push({ type: 'UDL', x1: 0, x2: L1, w, label: `${w} kN/m` }); if (Pl) loads.push({ type: 'P', x: L1 + L2 / 2, P: Pl, label: `${Pl} kN` });
      const balanced = Math.abs(sum) < 0.5;
      $('#l3viz', body).innerHTML = '';
      V.diagram($('#l3viz', body), L1 + L2, bm, loads, 'BMD with your θB (sagging +)', 'kN·m', { keyX: [0, L1, L1 + L2] });
      $('#l3eq', body).innerHTML = `
        <p>M<sub>AB</sub> = ${f(FAB)} + (2/${L1})·EIθ<sub>B</sub> = <b>${f(MAB)}</b></p>
        <p>M<sub>BA</sub> = ${f(FBA)} + (4/${L1})·EIθ<sub>B</sub> = <b>${f(MBA)}</b></p>
        <p>M<sub>BC</sub> = ${f(FBC)} + (4/${L2})·EIθ<sub>B</sub> = <b>${f(MBC)}</b></p>
        <p>M<sub>CB</sub> = ${f(FCB)} + (2/${L2})·EIθ<sub>B</sub> = <b>${f(MCB)}</b></p>
        <div class="ro meter ${balanced ? 'good' : 'bad'}"><span>ΣM at joint B = M<sub>BA</sub> + M<sub>BC</sub> = <b>${f(sum)}</b> kN·m</span><div class="bar mid"><i style="left:50%;width:${Math.min(50, Math.abs(sum) / 2)}%;${sum < 0 ? 'transform:translateX(-100%)' : ''}"></i></div><small>${balanced ? 'Balanced. This θ is the slope deflection answer.' : sum > 0 ? 'Too much clockwise moment at B: turn θ the other way (more negative).' : 'Too much anticlockwise moment: increase θ.'}</small></div>`;
    };
    bindSliders(body, ['l3w', 'l3P', 'l3L1', 'l3L2', 'l3t'], run);
    const balanced = () => !!$('#l3eq .meter.good', body);
    missions(body, [
      { do: 'Drag <b>EIθB</b> until the ΣM bar turns green.', el: '#l3t', look: 'the ΣM at joint B bar.', check: balanced, why: 'You just solved slope deflection by hand: the twist that makes the moments at joint B add to zero is exactly what the joint equation finds.' },
      { do: 'Now push the <b>UDL on AB</b> up to 35 or more.', el: '#l3w', look: 'the bar turns red again.', check: () => valOf(body, 'l3w') >= 35 && !balanced(), why: 'More load on AB pushes more moment into joint B, so the old twist no longer balances it. Every load case has its own θ.' },
      { do: 'Press <b>Snap to the solution</b>.', el: '#l3snap', check: () => valOf(body, 'l3w') >= 35 && balanced(), why: 'The exact θ from the joint equation balances it at once. In the exam you calculate this θ instead of hunting for it.' },
    ]);
    $('#l3snap', body).addEventListener('click', () => { const i = $('#l3t', body); i.value = Math.round(body._sol * 2) / 2; $('#l3t-o', body).textContent = i.value; run(); const exact = body._sol; $('#l3eq', body).insertAdjacentHTML('beforeend', `<p class="small muted">Exact: EIθ<sub>B</sub> = ${f(exact, 3)} (slider rounds to 0.5)</p>`); });
  }

  function lab4(body) {
    const presets = P['m4-beam'].presets;
    body.innerHTML = `<div class="lab"><div class="lab-ctl card"><h3>Watch the moments flow</h3>
      <p class="small">Each press of <b>Next</b> adds one row of the moment distribution table. The dials under each joint show how much moment is still unbalanced. When every dial reads about 0, the joints are in equilibrium.</p>
      <label for="l4p">Beam</label><select id="l4p">${presets.map((p, i) => `<option value="${i}">${p.label}</option>`).join('')}<option value="r">Random new beam</option></select>
      <div class="row wrap"><button class="btn primary" id="l4n">Next row</button><button class="btn" id="l4a">Play all</button><button class="btn" id="l4r">Reset</button></div></div>
      <div class="lab-out"><div id="l4viz" class="vizbox"></div><div id="l4dials" class="dials"></div><div id="l4tbl"></div></div></div>`;
    let md, model, shown = 1, timer = null;
    const load = () => {
      const v = $('#l4p', body).value; const params = v === 'r' ? P['m4-beam'].random() : presets[+v].params;
      const prob = window.makeProblem('m4-beam', params); md = prob.md; model = prob.model; shown = 1;
      const api = V.beam($('#l4viz', body), prob.scene); api.show(); draw();
    };
    const draw = () => {
      const rows = md.rows.slice(0, shown);
      const head = md.cols.map((cl) => `<th>${cl.key}</th>`).join('');
      const df = md.cols.map((cl) => `<td>${cl.DF ? f(cl.DF, 3) : '0'}</td>`).join('');
      const body2 = rows.map((r, k) => `<tr class="${r.kind || ''} ${k === shown - 1 ? 'new' : ''}"><th>${r.label}</th>${r.vals.map((v) => `<td>${Math.abs(v) < 5e-4 ? '' : f(v)}</td>`).join('')}</tr>`).join('');
      const sums = md.cols.map((cl, k) => rows.reduce((s, r) => s + r.vals[k], 0));
      const done = shown >= md.rows.length;
      $('#l4tbl', body).innerHTML = `<div class="tbl"><table class="mdm"><thead><tr><th></th>${head}</tr></thead><tbody><tr class="df"><th>DF</th>${df}</tr>${body2}<tr class="final"><th>${done ? 'Final' : 'Running total'}</th>${sums.map((v) => `<td><b>${f(v)}</b></td>`).join('')}</tr></tbody></table></div>`;
      $('#l4dials', body).innerHTML = md.joints.map((j) => { const unb = j.cols.reduce((s, k) => s + sums[k], 0); const a = Math.min(1, Math.abs(unb) / 30); return `<div class="dial ${Math.abs(unb) < 0.05 ? 'good' : ''}"><span>Joint ${j.node}</span><b>${f(unb)}</b><i style="transform:rotate(${Math.sign(unb) * a * 120}deg)"></i><small>unbalanced kN·m</small></div>`; }).join('') || '<p class="small muted">No interior joints.</p>';
    };
    $('#l4p', body).addEventListener('change', () => { clearInterval(timer); load(); });
    $('#l4n', body).addEventListener('click', () => { if (shown < md.rows.length) { shown++; draw(); } });
    $('#l4r', body).addEventListener('click', () => { clearInterval(timer); shown = 1; draw(); });
    $('#l4a', body).addEventListener('click', () => { clearInterval(timer); timer = setInterval(() => { if (shown >= md.rows.length || !document.body.contains(body)) return clearInterval(timer); shown++; draw(); }, 650); });
    load();
    const first = $('#l4p', body).value;
    missions(body, [
      { do: 'Press <b>Next row</b> a few times.', el: '#l4n', look: 'the dials under each joint.', check: () => $$('#l4tbl tbody tr', body).length >= 6, why: 'Each Balance row cancels the unbalanced moment at a joint. Each Carry over sends half of it to the far end, which slightly unbalances the neighbour again.' },
      { do: 'Press <b>Play all</b> and wait until every dial is green.', el: '#l4a', check: () => $$('#l4dials .dial', body).length > 0 && $$('#l4dials .dial', body).every((d) => d.classList.contains('good')) && /Final/.test($('#l4tbl .final th', body).textContent), why: 'Each round is smaller than the last, so the totals settle to the exact answer. Moment distribution is just repeated sharing, with no simultaneous equations.' },
      { do: 'Choose <b>another beam</b> from the list.', el: '#l4p', check: () => $('#l4p', body).value !== first, why: 'The same routine works for any beam or frame without sway: lock, balance, carry over, repeat.' },
    ]);
  }

  function lab5(body) {
    body.innerHTML = `<div class="lab"><div class="lab-ctl card"><h3>Arch: why the thrust matters</h3>
      ${slider('l5L', 'Span', 10, 40, 2, 20, 'm')}${slider('l5h', 'Rise h', 1, 12, 0.5, 5, 'm')}${slider('l5P', 'Point load', 0, 300, 10, 200, 'kN')}${slider('l5x', 'Load position (% span)', 5, 95, 5, 30, '%')}${slider('l5w', 'Full span UDL', 0, 30, 1, 0, 'kN/m')}
      <p class="small muted">Try P = 0 and only the UDL: the arch moment becomes zero everywhere (a parabola is the perfect shape for a uniform load).</p>
      <h3>Cable: why a tight line snaps</h3>
      ${slider('l5d', 'Cable dip d', 0.5, 15, 0.5, 6, 'm')}${slider('l5cw', 'Cable load w', 1, 40, 1, 10, 'kN/m')}
      </div>
      <div class="lab-out"><div id="l5arch" class="vizbox"></div><div id="l5ar" class="readouts"></div><div id="l5cab" class="vizbox"></div><div id="l5cr" class="readouts"></div></div></div>`;
    const run = () => {
      const L = +$('#l5L', body).value, hh = Math.min(+$('#l5h', body).value, L / 2), Pl = +$('#l5P', body).value, x = L * +$('#l5x', body).value / 100, w = +$('#l5w', body).value;
      const loads = []; if (Pl) loads.push({ type: 'P', P: Pl, x }); if (w) loads.push({ type: 'UDL', w, x1: 0, x2: L });
      if (!loads.length) loads.push({ type: 'P', P: 0.0001, x });
      const r = T.threeHingedArch('parabolic', L, hh, loads);
      const api = V.arch($('#l5arch', body), { L, h: hh, r, loads: loads.filter((l) => l.type === 'UDL' || l.P > 0.01), xs: null }); api.showMoments();
      let Mb = 0, Ma = 0; for (let k = 0; k <= 200; k++) { const xx = L * k / 200; Mb = Math.max(Mb, Math.abs(T.beamMoment(L, loads, xx))); Ma = Math.max(Ma, Math.abs(r.at(xx).M)); }
      $('#l5ar', body).innerHTML = `<div class="ro"><span>Thrust H</span><b>${f(r.H)} kN</b><small>H = M<sub>crown</sub>/h: a flatter arch pushes harder</small></div><div class="ro"><span>Max beam BM</span><b>${f(Mb)} kN·m</b></div><div class="ro"><span>Max arch BM</span><b>${f(Ma)} kN·m</b><small>${Mb > 0 ? f(100 * (1 - Ma / Mb), 0) + '% less than the beam' : ''}</small></div>`;
      const cd = +$('#l5d', body).value, cw = +$('#l5cw', body).value; const cL = 40;
      const cr = T.cableUDL(cL, cw, cd);
      V.cableUDL($('#l5cab', body), { L: cL, d: cd, w: cw, beta: 30, hp: 12, r: cr });
      const level = Math.min(100, cr.Tmax / 3000 * 100);
      $('#l5cr', body).innerHTML = `<div class="ro"><span>H = wL²/8d</span><b>${f(cr.H)} kN</b></div><div class="ro"><span>T<sub>max</sub></span><b>${f(cr.Tmax)} kN</b></div><div class="ro meter ${cr.Tmax > 2400 ? 'bad' : 'good'}"><span>Pull on a cable rated 2400 kN (span 40 m)</span><div class="bar"><i style="width:${level}%"></i></div><small>${cr.Tmax > 2400 ? 'Over capacity: give the cable more dip.' : 'OK'}</small></div>`;
    };
    bindSliders(body, ['l5L', 'l5h', 'l5P', 'l5x', 'l5w', 'l5d', 'l5cw'], run);
    missions(body, [
      { do: 'Lower the arch <b>Rise h</b> to 2 m.', el: '#l5h', look: 'the Thrust H number.', check: () => valOf(body, 'l5h') <= 2, why: 'H went up: H = (beam moment at crown) ÷ h. A flat arch pushes its supports much harder, so it needs bigger abutments.' },
      { do: 'Set the <b>Point load</b> to 0 and the <b>Full span UDL</b> to 10 or more.', el: '#l5P', look: 'the shaded arch moment.', check: () => valOf(body, 'l5P') === 0 && valOf(body, 'l5w') >= 10, why: 'The arch moment vanished. A parabola is the perfect (funicular) shape for a uniform load, so the arch is in pure compression with no bending.' },
      { do: 'Pull the <b>Cable dip d</b> down to 2 m.', el: '#l5d', look: 'the T max and the capacity bar.', check: () => valOf(body, 'l5d') <= 2, why: 'The pull shot up: H = wL²/8d, so halving the dip doubles the pull. That is why a tight washing line snaps.' },
    ]);
  }

  /* ------------------------------ PYQ ------------------------------ */
  function renderPYQ() {
    const papers = C.PAPERS;
    const rows = C.FAMILIES.map((fa) => {
      const cells = papers.map((p) => fa[p.id] ? `<td class="hit${/deleted/.test(fa[p.id]) ? ' del' : ''}">${fa[p.id]}</td>` : '<td class="miss">—</td>').join('');
      const n = papers.filter((p) => fa[p.id] && !/deleted/.test(fa[p.id])).length;
      const go = fa.gen ? `<a class="mini" href="#m${fa.m}-practice" data-gen="${fa.gen}" data-preset="">Practise</a>` : `<a class="mini" href="#m${fa.m}-parta">Revise</a>`;
      return `<tr><td><span class="pill p${fa.part}">${fa.part}</span></td><td>M${fa.m}</td><td class="fam">${fa.name}</td>${cells}<td><span class="freq f${n}">${n}/3</span></td><td>${go}</td></tr>`;
    }).join('');
    view().innerHTML = `<section class="mhead"><p class="eyebrow">Previous year questions</p><h1>Past papers</h1><p class="muted">Dec 2022, Jun 2024 and Nov 2024. The same question families repeat; only the numbers change. Open any question with its exact exam numbers.</p></section>
      <section>
        <h2 class="sec-h">What repeats</h2>
        <div class="tbl"><table class="heat"><thead><tr><th>Part</th><th>Mod</th><th>Question family</th>${papers.map((p) => `<th>${p.name}<small>${p.sub.split(' · ')[0]}</small></th>`).join('')}<th>Freq.</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="grid2">
          <div class="card note-card"><h3>Exam pattern</h3><p>60 marks, 3 hours. Part A: 5 theory questions × 4 marks, one per module, answer all. Part B: 2 questions per module, answer one, 8 marks each.</p></div>
          <div class="card note-card"><h3>Indian code books</h3><p>None are prescribed for AET201, and no past question needs one. Values such as E are always given in the question.</p></div>
        </div>
      </section>
      <section class="papers">${C.PAPERS.map((p) => `<article class="paper card"><h2>${p.name}</h2><p class="small muted">${p.sub}</p>${C.PYQ.filter((q) => q.p === p.id).map((q) => `<div class="pq"><span class="qno">Q${q.q}</span><span class="pill">M${q.m}</span><div><p>${q.t}</p>${q.note ? `<p class="small note">${q.note}</p>` : ''}</div>${q.gen ? `<a class="mini" href="#m${q.m}-practice" data-gen="${q.gen}" data-preset="${q.preset}">Solve</a>` : '<span class="mini off">—</span>'}</div>`).join('')}</article>`).join('')}</section>`;
    $$('a[data-gen]', view()).forEach((a) => a.addEventListener('click', () => { pending = { gen: a.dataset.gen, preset: a.dataset.preset === '' ? null : +a.dataset.preset }; }));
  }

  /* ------------------------------ MOCK EXAM ------------------------------ */
  let examTimer = null;
  function renderExam() {
    clearInterval(examTimer);
    view().innerHTML = `<section class="mhead"><p class="eyebrow">KTU pattern · 60 marks · 3 hours</p><h1>Mock exam</h1>
      <p class="muted">Part A: five 4-mark theory questions (answer all, then mark yourself against the model answer). Part B: in every module choose one of the two questions; your numerical answers are marked automatically. Fresh numbers every attempt.</p>
      <div class="row wrap"><button class="btn primary" id="exStart">Start a new paper</button>${store.get('lastExam') ? `<span class="small muted">Last score: <b>${store.get('lastExam').score}/60</b> on ${store.get('lastExam').date}</span>` : ''}</div></section><section id="exBody"></section>`;
    $('#exStart').addEventListener('click', startExam);
  }
  function startExam() {
    const end = Date.now() + 3 * 3600 * 1000;
    const pa = C.MODULES.map((m) => m.partA[Math.floor(Math.random() * m.partA.length)]);
    const pb = C.MODULES.map((m) => { const g = m.gens.slice().sort(() => Math.random() - 0.5); return [g[0], g[1] || g[0]]; });
    const scores = { A: [0, 0, 0, 0, 0], B: [0, 0, 0, 0, 0] };
    const body = $('#exBody');
    body.innerHTML = `<div class="exbar"><span id="exClock">3:00:00</span><span id="exScore">0 / 60</span><button class="btn sm" id="exEnd">Submit paper</button></div>
      <h2>Part A <small class="muted">answer all · 4 marks each</small></h2>
      ${pa.map((q, i) => `<article class="tcard pa"><p class="eyebrow">Q${i + 1} · Module ${i + 1} · 4 marks</p><h3>${q.q}</h3><label class="sr" for="exA${i}">Answer</label><textarea id="exA${i}" rows="4"></textarea><div class="row wrap"><button class="btn sm" data-rev="${i}">Show model answer & mark</button><label class="small" for="exAm${i}">Your marks</label><select id="exAm${i}" data-am="${i}" disabled>${[0, 1, 2, 3, 4].map((v) => `<option>${v}</option>`).join('')}</select><span class="small muted" id="exAk${i}"></span></div><div class="model" hidden>${q.a}</div></article>`).join('')}
      <h2>Part B <small class="muted">answer any one per module · 8 marks each</small></h2>
      ${pb.map((pair, i) => `<article class="tcard"><p class="eyebrow">Module ${i + 1}</p><div class="seg" role="radiogroup" aria-label="Choose question">${pair.map((g, k) => `<button data-m="${i}" data-g="${g}" class="${k ? '' : 'on'}">Q${6 + i * 2 + k}: ${P[g].title}</button>`).join('')}</div><div id="exB${i}"></div></article>`).join('')}`;
    const total = () => { const s = scores.A.reduce((a, b) => a + b, 0) + scores.B.reduce((a, b) => a + b, 0); $('#exScore').textContent = `${s} / 60`; return s; };
    $$('[data-rev]', body).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.rev; const card = b.closest('.pa'); $('.model', card).hidden = false; const sel = $(`#exAm${i}`); sel.disabled = false;
      const t = $(`#exA${i}`).value.toLowerCase(); const hits = pa[i].keys.filter((k) => t.includes(k.toLowerCase())).length;
      const sug = Math.min(4, Math.round(hits / pa[i].keys.length * 4)); sel.value = sug; scores.A[i] = sug; $(`#exAk${i}`).textContent = `suggested from key ideas: ${sug}/4`; total();
    }));
    $$('[data-am]', body).forEach((s) => s.addEventListener('change', () => { scores.A[+s.dataset.am] = +s.value; total(); }));
    const mountB = (i, g) => {
      scores.B[i] = 0; total();
      mountProblem($(`#exB${i}`), g, null, { exam: true, onCheck: (r) => { scores.B[i] = Math.round(8 * r.ok / r.total * 2) / 2; total(); } });
    };
    $$('.seg button[data-m]', body).forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.m; $$(`.seg button[data-m="${i}"]`, body).forEach((x) => x.classList.toggle('on', x === b)); mountB(i, b.dataset.g); }));
    pb.forEach((pair, i) => mountB(i, pair[0]));
    const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); const el = $('#exClock'); if (!el) return clearInterval(examTimer); el.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; if (!s) finish(); };
    const finish = () => {
      clearInterval(examTimer); const s = total();
      store.set('lastExam', { score: s, date: new Date().toLocaleDateString() });
      const res = h(`<div class="cons ${s >= 24 ? 'good' : ''}"><h4>Paper submitted: ${s} / 60</h4><p>Part A ${scores.A.reduce((a, b) => a + b, 0)}/20 · Part B ${scores.B.reduce((a, b) => a + b, 0)}/40. Weakest module: <b>M${scores.B.indexOf(Math.min(...scores.B)) + 1}</b>. Open its Practise tab and use <i>Solve for me</i> on two questions before trying again.</p></div>`);
      body.prepend(res); res.scrollIntoView({ behavior: 'smooth' });
    };
    $('#exEnd').addEventListener('click', finish);
    examTimer = setInterval(tick, 1000);
  }

  /* ------------------------------ guided tours ------------------------------ */
  function startTour() {
    if (document.querySelector('.walk')) return window.Tour.start(window.Tour.walk());
    const hash = (location.hash || '#home').slice(1); const mm = hash.match(/^m([1-5])(?:-(\w+))?$/); const tab = mm ? (mm[2] || 'learn') : hash;
    const T0 = {
      home: [
        { sel: '.home-hero h1', title: 'Hi! I am your guide', text: 'This app teaches Theory of Structures III by letting you <b>see</b> beams, frames, arches and cables move.' },
        { sel: '.path', title: 'The 3-step path', text: 'Every module works the same way: <b>Learn</b> the idea with animations, <b>Play</b> with it in the lab, then <b>Solve</b> real questions with a step-by-step guide.' },
        { sel: '.mcard', title: 'Start here', text: 'Modules build on each other, so begin with Module 1. Tap a card to open it.' },
        { sel: '.mcard .qchips', title: 'Or jump straight to a question', text: 'Each chip is a type of question that keeps coming back. Tap one to practise it directly.' },
        { sel: '.nav', title: 'The menu', text: 'Switch modules here. Past papers and a mock exam are here too when you are ready.' },
        { sel: '.guide-fab', title: 'Need me again?', text: 'Tap this button on any page and I will show you around that page.' },
      ],
      learn: [
        { sel: '.tabs', title: 'Four tabs per module', text: '<b>Learn</b> the idea, play in the <b>Lab</b>, <b>Practise</b> questions, and revise <b>Theory questions</b>.' },
        { sel: '.demo', title: 'Watch the idea move', text: 'Each card plays a short animation with a caption. Tap the picture to go to the next frame.' },
        { sel: '.dplay', title: 'Pause any time', text: 'Pause to read the caption, then play again.' },
        { sel: '.simple', title: 'In plain words', text: 'The same idea in one simple sentence. No formulas needed yet.' },
        { sel: 'details.exam', title: 'Exam formulas', text: 'Open this when you want the formulas and the exact definitions to write in the exam.' },
        { sel: '.next-row', title: 'Then play', text: 'When the idea makes sense, try it in the lab, then practise real questions.' },
      ],
      lab: [
        { sel: '.mission', title: 'Follow the missions', text: 'Each mission tells you one thing to try. When you do it, you get an explanation of what happened and why.' },
        { sel: '.pulse-target', title: 'This control glows', text: 'The glowing control is the one to use for this mission. Drag or tap it.' },
        { sel: '.lab-out', title: 'Watch here', text: 'The picture and the numbers react instantly, so you can see cause and effect.' },
      ],
      practice: [
        { sel: '.chips', title: 'Pick a question type', text: 'These are the question types that repeat in KTU papers for this module.' },
        { sel: '.qtools select', title: 'Real exam numbers', text: 'Load the exact numbers from a past paper.' },
        { sel: '[data-act=new]', title: 'Fresh numbers', text: 'Same question, new numbers, as many times as you like.' },
        { sel: '.qtext', title: 'The question', text: '<b class="g">Highlighted</b> numbers are the data you will use.' },
        { sel: 'details.approach', title: 'Plan first', text: 'Open this before solving. It shows the goal, the strategy, and why each step is needed.' },
        { sel: '.vizbox', title: 'The structure', text: 'Switch between deflected shape, tension/compression, shear and moment diagrams.' },
        { sel: '.howbtn', title: 'Stuck? Watch it solved', text: 'A guided, animated solution, one step at a time, with the reason for every step.' },
        { sel: '.answers', title: 'Try it yourself', text: 'Type your answers and press Check. If one is wrong you will see what would happen to the real structure.' },
      ],
      parta: [
        { sel: '.pa textarea', title: 'Write first', text: 'Write your answer as in the exam. Short is fine.' },
        { sel: '.pa [data-act=reveal]', title: 'Then compare', text: 'See a model answer and which key ideas you included.' },
      ],
      pyq: [
        { sel: '.heat', title: 'What repeats', text: 'Each row is a question type, each column is a paper. Most types appear every time.' },
        { sel: '.pq .mini', title: 'Solve it here', text: 'Opens the question with its exact exam numbers, ready to solve or watch.' },
      ],
      exam: [{ sel: '#exStart', title: 'A full paper', text: 'Five theory questions plus one problem per module, with a 3-hour timer. Problems are marked automatically.' }],
    };
    window.Tour.start(T0[tab] || T0.home);
  }
  const fab = $('#guideFab');
  if (fab) { fab.addEventListener('click', startTour); if (!store.get('toured', false)) { fab.classList.add('hello'); fab.addEventListener('click', () => { store.set('toured', true); fab.classList.remove('hello'); }, { once: true }); } }

  /* ------------------------------ theme ------------------------------ */
  const tbtn = $('#themeBtn');
  if (tbtn) {
    const saved = store.get('theme', null); if (saved) document.documentElement.setAttribute('data-theme', saved);
    tbtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nx); store.set('theme', nx);
    });
  }
  route();
})();
