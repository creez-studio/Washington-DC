/* =====================================================================
   Walkthrough player. Screen 0 = game plan (what we do and why, in order).
   Then one step per screen: animated picture, plain sentence,
   "why this step" card, and formula → numbers → answer.
   Keyboard: ← → Esc. Swipe on phones.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  let open = null;
  function close() { if (!open) return; open.root.remove(); document.removeEventListener('keydown', open.key); document.body.classList.remove('walk-open'); if (open.back && open.back.focus) open.back.focus(); open = null; }
  function eqBlock(groups) {
    if (!groups || !groups.length) return '';
    return `<div class="weqs">${groups.map((gq, gi) => {
      const [fml, sub, res] = gq;
      return `<div class="weq" style="animation-delay:${0.2 + gi * 0.45}s">
        ${fml ? `<div class="wf">${fml}</div>` : ''}
        ${sub ? `<div class="ws" style="animation-delay:${0.4 + gi * 0.45}s"><span class="eqs-sym">=</span>${sub}</div>` : ''}
        ${res ? `<div class="wr" style="animation-delay:${0.65 + gi * 0.45}s"><span class="eqs-sym">=</span>${res}</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }
  function buildSteps(prob) {
    const steps = (window.WALKS[prob.id] ? window.WALKS[prob.id](prob) : prob.steps.map((s) => ({ t: s.t, say: s.kid, eq: [], vis: {}, extra: s.w })));
    steps.forEach((s) => { s.why = s.why || (window.WHY ? window.WHY.why(s.t) : ''); });
    steps.push({ t: 'All answers', say: 'Here is everything the question asked for. Now try it yourself with new numbers.', why: window.WHY ? window.WHY.why('All answers') : '', eq: prob.answers.map((a) => [a.label, '', `<b class="ans">${T.fmt(a.value, a.kind === 'df' || a.kind === 'geom' ? 3 : 2)} ${a.unit.replace(/\s*\(.*\)/, '')}</b>`]), vis: prob.scene.kind === 'beam' ? { defl: true, bmd: true } : prob.scene.kind === 'frame' ? { bmd: true } : {} });
    return steps;
  }
  function planHTML(prob, steps, compact) {
    const [goal, strat] = window.WHY ? window.WHY.goal(prob.id) : ['', ''];
    const seen = new Set(); const list = [];
    steps.forEach((s, i) => { const key = s.t.replace(/Round \d+: /, 'Round: ').replace(/^Tension in piece .*/, 'Tension in each piece'); if (seen.has(key)) return; seen.add(key); list.push({ i, t: key.replace('Round: ', 'Rounds: '), why: s.why }); });
    return `<div class="plan">
      <div class="plan-goal"><span class="plan-k">Goal</span><p>${goal}</p></div>
      <div class="plan-goal"><span class="plan-k">Strategy</span><p>${strat}</p></div>
      <ol class="plan-list">${list.map((s, k) => `<li style="animation-delay:${0.08 * k}s"><button class="plan-step" data-go="${s.i}" ${compact ? 'tabindex="-1"' : ''}><span class="pn">${k + 1}</span><span class="pt"><b>${s.t}</b>${s.why ? `<small>${s.why.split('. ')[0].replace(/\.$/, '')}.</small>` : ''}</span></button></li>`).join('')}</ol>
    </div>`;
  }
  function openWalk(prob, startAt) {
    close();
    const steps = buildSteps(prob);
    const screens = [{ plan: true, t: 'Game plan', vis: {} }].concat(steps);
    const root = document.createElement('div');
    root.className = 'walk'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Step by step solution');
    root.innerHTML = `
      <div class="walk-in">
        <header class="walk-top">
          <div class="wdots" aria-hidden="true">${screens.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
          <span class="wcount"></span>
          <button class="wguide" aria-label="Show me around this screen" title="Guide">?</button>
          <button class="wclose" aria-label="Close">✕</button>
        </header>
        <div class="walk-stage"></div>
        <section class="walk-text" aria-live="polite"></section>
        <footer class="walk-nav">
          <button class="btn wprev">← Back</button>
          <button class="btn primary wnext">Start →</button>
        </footer>
      </div>`;
    document.body.appendChild(root); document.body.classList.add('walk-open');
    const stage = window.Stage.create(root.querySelector('.walk-stage'), prob.scene);
    let i = Math.min(startAt || 0, screens.length - 1);
    const text = root.querySelector('.walk-text');
    const render = () => {
      const s = screens[i];
      root.querySelectorAll('.wdots i').forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'on' : ''; });
      root.querySelector('.wcount').textContent = i === 0 ? 'Game plan' : `Step ${i} of ${screens.length - 1}`;
      if (s.plan) {
        text.innerHTML = `<h2 class="wt">Before we start: the game plan</h2><p class="wsay">Every step below has a reason. Read the plan once, then press Start. Tap any step to jump to it.</p>${planHTML(prob, steps)}`;
        text.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { i = +b.dataset.go + 1; render(); }));
      } else {
        text.innerHTML = `<h2 class="wt"><span class="wnum">${i}</span>${s.t}</h2>${s.say ? `<p class="wsay">${s.say}</p>` : ''}${s.why ? `<div class="wwhy"><span class="wwhy-k">Why this step?</span><p>${s.why}</p></div>` : ''}${eqBlock(s.eq)}${s.extra ? `<details class="wmore"><summary>Show the full table</summary>${s.extra}</details>` : ''}`;
      }
      stage.show(s.vis);
      root.querySelector('.wprev').disabled = i === 0;
      root.querySelector('.wnext').textContent = i === 0 ? 'Start →' : i === screens.length - 1 ? 'Done ✓' : 'Next →';
      text.scrollTop = 0;
    };
    const go = (d) => { if (i + d >= screens.length) return close(); i = Math.max(0, i + d); render(); };
    root.querySelector('.wprev').addEventListener('click', () => go(-1));
    root.querySelector('.wnext').addEventListener('click', () => go(1));
    root.querySelector('.wclose').addEventListener('click', close);
    root.querySelector('.wguide').addEventListener('click', () => window.Tour && window.Tour.start(window.Tour.walk()));
    root.querySelectorAll('.wdots i').forEach((d) => d.addEventListener('click', () => { i = +d.dataset.i; render(); }));
    const key = (e) => { if (document.querySelector('.tour')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key);
    let x0 = null; root.querySelector('.walk-stage').addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    root.querySelector('.walk-stage').addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); x0 = null; });
    open = { root, key, back: document.activeElement };
    render();
    root.querySelector('.wnext').focus();
    return { steps };
  }
  window.Walk = { open: openWalk, close, buildSteps, planHTML };
})();
