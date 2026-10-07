(() => {
  const root = document.getElementById('site-page');
  if (!root || root.dataset.ready || !window.ResizeObserver || !window.IntersectionObserver) return;
  root.dataset.ready = 'true';

  const scroller = root.querySelector('.bs-scroll');
  const track = root.querySelector('.bs-track');
  const original = root.querySelector('.bs-cycle');
  const macro = root.querySelector('.bs-macro');
  const micro = root.querySelector('.bs-micro');
  const depthA = root.querySelector('.bs-depth-a');
  const depthB = root.querySelector('.bs-depth-b');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 580px)');
  const middle = 8;
  const count = middle * 2 + 1;
  const copies = [];
  const fragment = document.createDocumentFragment();
  const states = Array.from(original.querySelectorAll('details'), item => item.open);

  // A generous native scroll runway preserves the phone's own momentum.
  // The equivalent middle position is restored only after scrolling stops.
  for (let index = 0; index < count; index += 1) {
    const copy = index === middle ? original : original.cloneNode(true);
    copy.dataset.cycle = String(index);
    if (index !== middle) copy.querySelectorAll('[id]').forEach(item => item.removeAttribute('id'));
    copy.querySelectorAll('details').forEach((item, slot) => {
      item.dataset.slot = String(slot);
    });
    copy.querySelectorAll('summary').forEach(item => item.classList.add('cursor-interaction'));
    copy.inert = index !== middle;
    if (copy.inert) copy.setAttribute('aria-hidden', 'true');
    copies.push(copy);
    fragment.append(copy);
  }
  track.replaceChildren(fragment);
  root.classList.add('scroll-ready');
  depthB.src = depthA.src;

  let cycleHeight = 0;
  let previous = 0;
  let distance = 0;
  let wheelTarget = 0;
  let wheelActive = false;
  let frame = 0;
  let frameTime = 0;
  let idleTimer = 0;
  let touchCount = 0;
  let started = false;
  let disposed = false;
  let remappingFocus = false;

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = (low, high, value) => {
    const x = clamp((value - low) / (high - low), 0, 1);
    return x * x * (3 - 2 * x);
  };

  function draw() {
    // Direct, reversible zoom of the existing drawing, beginning at the
    // first scroll pixel. Reduced motion removes easing, not this control.
    const blend = smooth(680, 1150, distance);
    const scale = Math.exp(Math.min(distance, 1200) * 0.00195);
    macro.style.transform = `translate3d(0,0,0) scale(${scale})`;
    macro.style.opacity = String((compact.matches ? 0.60 : 0.74) * (1 - blend));
    micro.style.opacity = String((compact.matches ? 0.38 : 0.50) * blend);

    // At the join, layer B is exactly the size and opacity of layer A at
    // the next cycle. It keeps zooming without a visible scale reset.
    const travel = Math.max(0, distance - 820) / 900;
    const phase = travel - Math.floor(travel);
    depthA.style.transform = `translate3d(0,0,0) scale(${Math.pow(2, phase)})`;
    depthB.style.transform = `translate3d(0,0,0) scale(${Math.pow(2, phase - 1)})`;
    depthB.style.opacity = String(smooth(0.28, 1, phase));
  }

  function quietScroll(value) {
    scroller.scrollTop = value;
    previous = scroller.scrollTop;
    wheelTarget = previous;
  }

  function queueIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(recenter, 180);
  }

  function readScroll() {
    const current = scroller.scrollTop;
    const delta = current - previous;
    previous = current;
    if (delta !== 0) {
      distance = Math.max(0, distance + delta);
      queueIdle();
    }
  }

  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    if (!root.isConnected) {
      dispose();
      return;
    }
    const elapsed = frameTime ? clamp(now - frameTime, 1, 40) : 16.7;
    frameTime = now;
    if (wheelActive) {
      if (scroller.scrollTop < cycleHeight * 2 || scroller.scrollTop > scroller.scrollHeight - scroller.clientHeight - cycleHeight * 2) {
        recenter(true);
      }
      const gap = wheelTarget - scroller.scrollTop;
      const step = gap * (1 - Math.exp(-elapsed / 78));
      if (Math.abs(gap) < 1.5) {
        scroller.scrollTop = wheelTarget;
        wheelActive = false;
        queueIdle();
      } else {
        scroller.scrollTop += Math.sign(step) * Math.max(0.8, Math.abs(step));
      }
    }
    readScroll();
    draw();
    if (wheelActive) schedule();
    else frameTime = 0;
  }

  function stopWheel() {
    wheelActive = false;
    wheelTarget = scroller.scrollTop;
    frameTime = 0;
    clearTimeout(idleTimer);
    readScroll();
    schedule();
  }

  function recenter(keepWheel = false) {
    if (disposed || !started || !cycleHeight || touchCount || (wheelActive && keepWheel !== true)) return;
    readScroll();
    const outstandingWheel = wheelActive ? wheelTarget - scroller.scrollTop : 0;
    const from = Math.floor(scroller.scrollTop / cycleHeight);
    const shift = middle - from;
    if (!shift) return;

    // Preserve the currently focused link or summary across identical copies.
    const active = document.activeElement;
    const activeCopy = active && track.contains(active) ? active.closest('.bs-cycle') : null;
    const selector = 'summary,a,button,input,select,textarea';
    const activeIndex = activeCopy ? Array.from(activeCopy.querySelectorAll(selector)).indexOf(active) : -1;
    const nextCopy = activeCopy ? copies[Number(activeCopy.dataset.cycle) + shift] : null;
    quietScroll(scroller.scrollTop + shift * cycleHeight);
    if (wheelActive) wheelTarget = clamp(previous + outstandingWheel, 0, scroller.scrollHeight - scroller.clientHeight);
    if (nextCopy && activeIndex >= 0) {
      nextCopy.inert = false;
      nextCopy.removeAttribute('aria-hidden');
      remappingFocus = true;
      nextCopy.querySelectorAll(selector)[activeIndex]?.focus({preventScroll: true});
      remappingFocus = false;
    }
  }

  scroller.addEventListener('scroll', () => {
    readScroll();
    schedule();
  }, {passive: true});
  scroller.addEventListener('scrollend', recenter);

  scroller.addEventListener('wheel', event => {
    // Keep browser pinch-zoom and horizontal gestures intact.
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (reduced.matches) {
      stopWheel();
      return;
    }
    event.preventDefault();
    clearTimeout(idleTimer);
    const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? scroller.clientHeight * 0.9 : 1;
    if (!wheelActive) wheelTarget = scroller.scrollTop;
    wheelTarget = clamp(wheelTarget + event.deltaY * unit, 0, scroller.scrollHeight - scroller.clientHeight);
    wheelActive = true;
    schedule();
  }, {passive: false});

  // Touch scrolling stays native: a flick coasts, touching again stops it.
  scroller.addEventListener('touchstart', event => {
    touchCount = event.touches.length;
    stopWheel();
  }, {passive: true});
  const finishTouch = event => {
    touchCount = event.touches.length;
    if (!touchCount) queueIdle();
  };
  scroller.addEventListener('touchend', finishTouch, {passive: true});
  scroller.addEventListener('touchcancel', finishTouch, {passive: true});
  scroller.addEventListener('pointerdown', stopWheel, {passive: true});
  scroller.addEventListener('keydown', stopWheel);
  track.addEventListener('focusin', () => {
    if (!remappingFocus) stopWheel();
  });

  // Keep every turn of the roll identical, including expanded descriptions.
  track.addEventListener('toggle', event => {
    const detail = event.target;
    if (!(detail instanceof HTMLDetailsElement)) return;
    const slot = Number(detail.dataset.slot);
    if (states[slot] === detail.open) return;
    states[slot] = detail.open;
    stopWheel();
    const summary = detail.querySelector('summary');
    const anchor = summary.getBoundingClientRect().top;
    copies.forEach(copy => {
      const equivalent = copy.querySelector(`details[data-slot="${slot}"]`);
      if (equivalent !== detail && equivalent.open !== detail.open) equivalent.open = detail.open;
    });
    const displacement = summary.getBoundingClientRect().top - anchor;
    cycleHeight = original.getBoundingClientRect().height;
    quietScroll(scroller.scrollTop + displacement);
    queueIdle();
    schedule();
  }, true);

  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const focused = entry.target.contains(document.activeElement);
      const available = entry.isIntersecting || focused;
      entry.target.inert = !available;
      if (available) entry.target.removeAttribute('aria-hidden');
      else entry.target.setAttribute('aria-hidden', 'true');
    });
  }, {root: scroller, rootMargin: '80px 0px'});
  copies.forEach(copy => visibility.observe(copy));

  function measure() {
    const nextHeight = original.getBoundingClientRect().height;
    if (nextHeight <= 0) return;
    if (!started) {
      cycleHeight = nextHeight;
      quietScroll(cycleHeight * middle);
      started = true;
    } else if (Math.abs(nextHeight - cycleHeight) > 0.5) {
      const turn = Math.floor(scroller.scrollTop / cycleHeight);
      const offset = scroller.scrollTop - turn * cycleHeight;
      cycleHeight = nextHeight;
      quietScroll(turn * cycleHeight + Math.min(offset, cycleHeight - 1));
    }
    schedule();
  }
  const resize = new ResizeObserver(measure);
  resize.observe(original);
  resize.observe(root);
  reduced.addEventListener('change', stopWheel);
  compact.addEventListener('change', schedule);

  function followHash() {
    if (!started || !window.location.hash) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    const target = document.getElementById(id);
    if (!target || !original.contains(target)) return;
    stopWheel();
    original.inert = false;
    original.removeAttribute('aria-hidden');
    quietScroll(scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
  }
  window.addEventListener('hashchange', followHash);

  function dispose() {
    disposed = true;
    clearTimeout(idleTimer);
    cancelAnimationFrame(frame);
    visibility.disconnect();
    resize.disconnect();
    reduced.removeEventListener('change', stopWheel);
    compact.removeEventListener('change', schedule);
    window.removeEventListener('hashchange', followHash);
  }

  measure();
  followHash();
  draw();
})();
