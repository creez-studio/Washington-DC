/* =====================================================================
   Walkthrough player: one step per screen, animated picture on top,
   formula → numbers → answer below. Keyboard: ← → Esc.
   ===================================================================== */
(function () {
  'use strict';
  const T = window.TOS;
  let open = null;
  function close() { if (!open) return; open.root.remove(); document.removeEventListener('keydown', open.key); document.body.classList.remove('walk-open'); if (open.back) open.back.focus(); open = null; }
  function eqBlock(groups) {
    if (!groups || !groups.length) return '';
    return `<div class="weqs">${groups.map((gq, gi) => {
      const [fml, sub, res] = gq;
      return `<div class="weq" style="animation-delay:${0.15 + gi * 0.5}s">
        ${fml ? `<div class="wf">${fml}</div>` : ''}
        ${sub ? `<div class="ws" style="animation-delay:${0.35 + gi * 0.5}s"><span class="eqs-sym">=</span>${sub}</div>` : ''}
        ${res ? `<div class="wr" style="animation-delay:${0.6 + gi * 0.5}s"><span class="eqs-sym">=</span>${res}</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }
  function openWalk(prob, startAt) {
    close();
    const steps = (window.WALKS[prob.id] ? window.WALKS[prob.id](prob) : prob.steps.map((s) => ({ t: s.t, say: s.kid, eq: [], vis: {}, extra: s.w })));
    // final summary step
    steps.push({ t: 'All answers', say: 'Here is everything the question asked for. Now try it yourself with new numbers.', eq: prob.answers.map((a) => [a.label, '', `<b class="ans">${T.fmt(a.value, a.kind === 'df' || a.kind === 'geom' ? 3 : 2)} ${a.unit.replace(/\s*\(.*\)/, '')}</b>`]), vis: prob.scene.kind === 'beam' ? { defl: true, bmd: true } : prob.scene.kind === 'frame' ? { bmd: true } : {} });
    const root = document.createElement('div');
    root.className = 'walk'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Step by step solution');
    root.innerHTML = `
      <div class="walk-in">
        <header class="walk-top">
          <div class="wdots" aria-hidden="true">${steps.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
          <span class="wcount"></span>
          <button class="wclose" aria-label="Close">✕</button>
        </header>
        <div class="walk-stage"></div>
        <section class="walk-text" aria-live="polite"></section>
        <footer class="walk-nav">
          <button class="btn wprev">← Back</button>
          <button class="btn primary wnext">Next →</button>
        </footer>
      </div>`;
    document.body.appendChild(root); document.body.classList.add('walk-open');
    const stage = window.Stage.create(root.querySelector('.walk-stage'), prob.scene);
    let i = Math.min(startAt || 0, steps.length - 1);
    const text = root.querySelector('.walk-text');
    const render = () => {
      const s = steps[i];
      root.querySelectorAll('.wdots i').forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'on' : ''; });
      root.querySelector('.wcount').textContent = `Step ${i + 1} of ${steps.length}`;
      text.innerHTML = `<h2 class="wt">${s.t}</h2>${s.say ? `<p class="wsay">${s.say}</p>` : ''}${eqBlock(s.eq)}${s.extra ? `<details class="wmore"><summary>Show the full table</summary>${s.extra}</details>` : ''}`;
      stage.show(s.vis);
      root.querySelector('.wprev').disabled = i === 0;
      const nx = root.querySelector('.wnext'); nx.textContent = i === steps.length - 1 ? 'Done ✓' : 'Next →';
      text.scrollTop = 0;
    };
    const go = (d) => { if (i + d >= steps.length) return close(); i = Math.max(0, i + d); render(); };
    root.querySelector('.wprev').addEventListener('click', () => go(-1));
    root.querySelector('.wnext').addEventListener('click', () => go(1));
    root.querySelector('.wclose').addEventListener('click', close);
    root.querySelectorAll('.wdots i').forEach((d) => d.addEventListener('click', () => { i = +d.dataset.i; render(); }));
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    document.addEventListener('keydown', key);
    // swipe on touch
    let x0 = null; root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); x0 = null; });
    open = { root, key, back: document.activeElement };
    render();
    root.querySelector('.wnext').focus();
    return { steps };
  }
  window.Walk = { open: openWalk, close };
})();
