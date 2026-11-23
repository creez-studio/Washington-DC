/* =====================================================================
   Guided tour: a small friendly cursor glides to each part of the page,
   taps it, and explains what it is for in a speech bubble.
   Tour.start([{ sel, title, text }]) ; Tour.stop()
   ===================================================================== */
(function () {
  'use strict';
  let cur = null;
  const CURSOR = `<svg viewBox="0 0 48 56" width="44" height="52" aria-hidden="true">
    <defs><linearGradient id="tourg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cf3ff"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>
    <path d="M6 3 L6 44 L16 35 L23 51 L31 47.5 L24 32 L38 32 Z" fill="url(#tourg)" stroke="#0b1222" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="13" cy="22" r="2.6" fill="#0b1222"/><circle cx="20" cy="25" r="2.6" fill="#0b1222"/>
    <circle cx="13.8" cy="21.2" r=".9" fill="#fff"/><circle cx="20.8" cy="24.2" r=".9" fill="#fff"/>
    <path d="M12 29 q4 4 9 1" fill="none" stroke="#0b1222" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
  function stop() {
    if (!cur) return;
    cur.root.remove(); document.removeEventListener('keydown', cur.key); window.removeEventListener('resize', cur.place); cur = null;
  }
  function start(steps) {
    stop();
    steps = (steps || []).filter((s) => !s.sel || document.querySelector(s.sel));
    if (!steps.length) return;
    const root = document.createElement('div');
    root.className = 'tour';
    root.innerHTML = `<div class="tour-spot"></div><div class="tour-cursor">${CURSOR}<span class="tour-ripple"></span></div>
      <div class="tour-bubble" role="dialog" aria-live="polite"><p class="tour-k"></p><h4></h4><p class="tour-t"></p>
      <div class="tour-nav"><button class="tour-skip">Skip</button><span class="tour-count"></span><button class="tour-back">Back</button><button class="tour-next">Next</button></div></div>`;
    document.body.appendChild(root);
    const spot = root.querySelector('.tour-spot'), cursor = root.querySelector('.tour-cursor'), bub = root.querySelector('.tour-bubble');
    let i = 0;
    // start the cursor from the bottom-left guide button
    const gb = document.querySelector('.guide-fab');
    const r0 = gb ? gb.getBoundingClientRect() : { left: 30, top: innerHeight - 60, width: 0, height: 0 };
    cursor.style.transform = `translate(${r0.left + r0.width / 2}px, ${r0.top}px)`;
    const place = () => {
      const s = steps[i];
      const el = s.sel ? document.querySelector(s.sel) : null;
      let r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 1, top: innerHeight / 2 - 1, width: 2, height: 2 };
      const pad = 8;
      spot.style.cssText = el ? `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;opacity:1` : 'left:50%;top:50%;width:0;height:0;opacity:1';
      const tx = Math.min(innerWidth - 50, Math.max(8, r.left + Math.min(r.width * 0.5, 160))), ty = Math.min(innerHeight - 60, Math.max(8, r.top + Math.min(r.height * 0.5, 60)));
      cursor.style.transform = `translate(${tx}px, ${ty}px)`;
      cursor.classList.remove('tap'); setTimeout(() => cursor.classList.add('tap'), 650);
      // bubble: below the target if room, else above
      const bw = Math.min(340, innerWidth - 24); bub.style.width = bw + 'px';
      const bh = bub.offsetHeight || 180;
      const below = r.top + r.height + bh + 30 < innerHeight;
      const bx = Math.min(innerWidth - bw - 12, Math.max(12, tx - 40));
      let by = el ? (below ? r.top + r.height + 22 : r.top - bh - 22) : innerHeight / 2 - bh / 2;
      by = Math.max(12, Math.min(innerHeight - bh - 12, by));
      bub.style.left = bx + 'px'; bub.style.top = by + 'px';
    };
    const show = () => {
      const s = steps[i]; const el = s.sel ? document.querySelector(s.sel) : null;
      bub.querySelector('.tour-k').textContent = s.kicker || 'Guide';
      bub.querySelector('h4').textContent = s.title || '';
      bub.querySelector('.tour-t').innerHTML = s.text;
      bub.querySelector('.tour-count').textContent = `${i + 1} / ${steps.length}`;
      bub.querySelector('.tour-back').disabled = i === 0;
      bub.querySelector('.tour-next').textContent = i === steps.length - 1 ? 'Got it' : 'Next';
      bub.classList.remove('in'); void bub.offsetWidth; bub.classList.add('in');
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > innerHeight - 40) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(place, 450); } else place();
      } else place();
    };
    const next = () => { if (i >= steps.length - 1) return stop(); i++; show(); };
    const back = () => { if (i > 0) { i--; show(); } };
    bub.querySelector('.tour-next').addEventListener('click', next);
    bub.querySelector('.tour-back').addEventListener('click', back);
    bub.querySelector('.tour-skip').addEventListener('click', stop);
    root.querySelector('.tour-spot').addEventListener('click', next);
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); stop(); } if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') back(); };
    document.addEventListener('keydown', key);
    window.addEventListener('resize', place);
    cur = { root, key, place };
    setTimeout(show, 60);
    bub.querySelector('.tour-next').focus();
  }
  const walkSteps = () => [
    { sel: '.walk .wdots', title: 'Your progress', text: 'Each dot is one step. The first is the game plan. Tap any dot to jump.' },
    { sel: '.walk .walk-stage', title: 'The moving picture', text: 'It zooms into exactly the part of the structure this step uses. Glowing lines are what we are calculating right now. On a phone, swipe it left or right.' },
    { sel: '.walk .wwhy, .walk .plan', title: 'Why we do it', text: 'Every step says why it is needed and what goes wrong if you skip it. Read this first; the maths makes sense after.' },
    { sel: '.walk .weqs', title: 'The maths, in three lines', text: 'First the formula, then the numbers put in, then the answer. <b class="g">Orange</b> numbers come from the question; <b class="c">teal</b> ones were worked out in an earlier step; <b class="ans">green</b> is the answer.' },
    { sel: '.walk .wnext', title: 'Next step', text: 'Go at your own pace. The arrow keys work too.' },
  ];
  window.Tour = { start, stop, walk: walkSteps };
})();
