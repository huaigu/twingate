/* Presentation only: motion never advances consent, delivery or payment state. */
(async () => {
  'use strict';
  await window.SignalPass?.ready;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1181px) and (hover: hover) and (pointer: fine)');
  const active = new Set(), revealed = new WeakSet(), cards = new WeakSet(), tilts = new Set();
  const ease = 'cubic-bezier(.23, 1, .32, 1)';
  let scanFrame = 0;
  const play = (element, keyframes, options = {}) => {
    if (reduce.matches || document.hidden || !element.animate) return;
    const animation = element.animate(keyframes, { duration: 320, easing: ease, ...options });
    active.add(animation);
    animation.onfinish = () => { active.delete(animation); animation.cancel(); };
    animation.oncancel = () => active.delete(animation);
    return animation;
  };
  const enter = (element, index = 0) => {
    if (revealed.has(element)) return;
    revealed.add(element); element.dataset.spEntered = 'true';
    play(element, { opacity: [.55, 1], translate: ['0 12px', '0 0'] }, { duration: 360, delay: Math.min(index, 3) * 45, fill: 'backwards' });
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach((entry, index) => { enter(entry.target, index); observer.unobserve(entry.target); });
  }, { threshold: .06, rootMargin: '0px 0px -24px 0px' }) : null;
  const tilt = card => {
    if (cards.has(card)) return;
    cards.add(card); card.classList.add('sp-motion-card');
    if (card.matches('.person-card') && !card.querySelector('.person-card-cue')) {
      const cue = document.createElement('span'); cue.className = 'person-card-cue'; cue.setAttribute('aria-hidden', 'true'); cue.textContent = 'View profile →'; card.append(cue);
    }
    let frame = 0, pointer;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0;
      card.style.removeProperty('--sp-rotate-x'); card.style.removeProperty('--sp-rotate-y');
    };
    const state = { card, reset }; tilts.add(state);
    card.addEventListener('pointermove', event => {
      if (!desktop.matches || reduce.matches || event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!card.isConnected || !desktop.matches || reduce.matches) return reset();
        const box = card.getBoundingClientRect();
        const x = Math.max(-.5, Math.min(.5, (pointer.x - box.left) / box.width - .5));
        const y = Math.max(-.5, Math.min(.5, (pointer.y - box.top) / box.height - .5));
        card.style.setProperty('--sp-rotate-x', (-y * 2.4).toFixed(2) + 'deg');
        card.style.setProperty('--sp-rotate-y', (x * 2.4).toFixed(2) + 'deg');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('focusin', reset);
  };
  const draftReadiness = () => {
    const section = document.querySelector('.intro-edit-section');
    if (!section || section.querySelector('.sp-draft-readiness')) return;
    const fields = [...section.querySelectorAll('textarea')];
    if (!fields.length) return;
    const rail = document.createElement('div'); rail.className = 'sp-draft-readiness';
    const label = document.createElement('span'); label.className = 'sp-draft-label'; label.setAttribute('aria-live', 'polite');
    const track = document.createElement('div'); track.className = 'sp-draft-track';
    track.setAttribute('role', 'progressbar'); track.setAttribute('aria-label', 'Introduction sections drafted');
    track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', String(fields.length));
    const fill = document.createElement('span'); track.append(fill); rail.append(label, track);
    section.querySelector('h3').after(rail);
    let previous = -1;
    const update = () => {
      const count = fields.filter(field => field.value.trim()).length;
      fields.forEach(field => field.closest('.intro-field').classList.toggle('sp-field-complete', Boolean(field.value.trim())));
      if (previous === count) return;
      previous = count;
      label.textContent = count + ' of ' + fields.length + ' sections drafted';
      track.setAttribute('aria-valuenow', String(count)); track.setAttribute('aria-valuetext', label.textContent);
      fill.style.transform = 'scaleX(' + count / fields.length + ')';
      rail.classList.toggle('is-ready', count === fields.length);
    };
    fields.forEach(field => { field.addEventListener('input', update); field.addEventListener('change', update); });
    section.addEventListener('focusin', update);
    // Template and rewrite actions set textarea values programmatically.
    document.addEventListener('click', () => requestAnimationFrame(update));
    update();
  };
  const seal = () => {
    const icon = document.querySelector('.v4-receipt-icon');
    if (!icon || document.body.dataset.receiptState !== 'accepted' || icon.dataset.spSealed) return;
    icon.dataset.spSealed = 'true'; icon.textContent = '✓';
    const ring = document.createElement('span'); ring.className = 'sp-seal-ring'; ring.setAttribute('aria-hidden', 'true'); icon.append(ring);
    let firstView = true;
    try { const key = 'signalpass-seal:' + location.pathname; firstView = sessionStorage.getItem(key) !== 'seen'; sessionStorage.setItem(key, 'seen'); } catch {}
    if (!firstView) return;
    play(icon, { transform: ['rotate(-8deg) scale(.94)', 'rotate(0deg) scale(1)'] }, { duration: 360 });
    play(ring, { opacity: [.45, 0], transform: ['scale(.9)', 'scale(1.65)'] }, { duration: 520 });
  };
  const scan = () => {
    scanFrame = 0;
    const surfaces = document.querySelectorAll('.paper, .landing-step, .landing-outro, .v4-summary-card, .v4-chain-card, .v4-empty-state');
    for (const surface of surfaces) {
      if (revealed.has(surface) || surface.parentElement.closest('.paper, .v4-summary-card, .v4-empty-state')) continue;
      if (reduce.matches || !observer) enter(surface); else observer.observe(surface);
    }
    document.querySelectorAll('.person-card, .live-widget').forEach(tilt);
    for (const entry of tilts) if (!entry.card.isConnected) { entry.reset(); tilts.delete(entry); }
    draftReadiness(); seal();
  };
  const queueScan = () => { if (!scanFrame) scanFrame = requestAnimationFrame(scan); };
  const updates = new MutationObserver(records => {
    if (records.some(record => record.type === 'attributes')) seal();
    if (records.some(record => record.addedNodes.length)) queueScan();
  });
  updates.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-receipt-state'] });
  const preference = () => {
    document.documentElement.dataset.motion = reduce.matches ? 'reduced' : 'enabled';
    if (reduce.matches) for (const animation of active) animation.cancel();
    for (const entry of tilts) entry.reset();
    queueScan();
  };
  reduce.addEventListener('change', preference);
  desktop.addEventListener('change', () => { for (const entry of tilts) entry.reset(); });
  document.addEventListener('focusin', event => {
    for (const animation of active) if (animation.effect?.target?.contains(event.target)) animation.finish();
  });
  document.addEventListener('visibilitychange', () => {
    for (const animation of active) { if (document.hidden) animation.pause(); else if (animation.playState === 'paused') animation.play(); }
    if (document.hidden) for (const entry of tilts) entry.reset();
  });
  window.addEventListener('pagehide', event => {
    for (const animation of active) animation.cancel();
    for (const entry of tilts) entry.reset();
    if (!event.persisted) { cancelAnimationFrame(scanFrame); updates.disconnect(); observer?.disconnect(); }
  });
  preference();
})();
