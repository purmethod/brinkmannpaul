(() => {
  'use strict';

  // Picker wheel over a scroll-driven dive into the brain drawing.
  // Turning the wheel zooms from the approved brain drawing ever finer: the
  // folds, the neurons, a cubic millimetre of wiring, a dendrite, a synapse,
  // the molecules of a vesicle. There the smallest turns into the universe:
  // galaxies, the cosmic web and its endless depth, until the next brain
  // grows: the dive never turns back and no drawing repeats on the way.
  // Everything is drawn in graphite on white. Without JavaScript the plain
  // project list remains.

  // Pure's chapters read one at a time: opening one closes the others, also
  // where <details name> is unsupported, and the tapped chapter stays under
  // the finger instead of jumping when a longer one above it closes.
  let tapped = null;
  document.addEventListener('click', event => {
    const summary = event.target.closest && event.target.closest('details.pure-branch > summary');
    if (summary) tapped = { summary, top: summary.getBoundingClientRect().top };
  }, true);
  document.addEventListener('toggle', event => {
    const opened = event.target;
    if (!opened.matches || !opened.matches('details.pure-branch') || !opened.open) return;
    const others = [...document.querySelectorAll('details.pure-branch')].filter(other => other !== opened);
    others.forEach(other => {
      other.classList.add('is-snapping');
      other.open = false;
    });
    const summary = opened.querySelector('summary');
    if (tapped && tapped.summary === summary) {
      const shift = summary.getBoundingClientRect().top - tapped.top;
      if (Math.abs(shift) > 1) (opened.closest('.bs-reader-scroll') || window).scrollBy(0, shift);
    }
    tapped = null;
    requestAnimationFrame(() => others.forEach(other => other.classList.remove('is-snapping')));
  }, true);

  // Switching language changes only the language: no intro again, the open
  // project stays open, and the wheel and the dive stay where they were.
  const SWITCH = 'bs-language-switch';
  let wheelState = () => null;
  document.querySelectorAll('.bs-langs a').forEach(link => link.addEventListener('click', () => {
    try { window.sessionStorage.setItem(SWITCH, JSON.stringify(wheelState())); } catch { /* storage off: the intro shows */ }
    if (window.location.hash) link.href = link.getAttribute('href').split('#')[0] + window.location.hash;
  }));

  const root = document.getElementById('site-page');
  const list = root && root.querySelector('.project-list');
  const section = root && root.querySelector('.index');
  const art = root && root.querySelector('.bs-art');
  const macroImage = art && art.querySelector('.bs-macro img');
  const main = document.getElementById('main-content');
  const supported = list && section && art && macroImage && !root.dataset.ready &&
    window.ResizeObserver && window.Path2D && window.requestAnimationFrame &&
    typeof HTMLDialogElement === 'function' && typeof HTMLDialogElement.prototype.showModal === 'function';
  if (!supported) return;
  const details = Array.from(list.querySelectorAll(':scope > details.project-item'));
  if (!details.length) return;
  root.dataset.ready = 'true';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = (low, high, value) => {
    const x = clamp((value - low) / (high - low), 0, 1);
    return x * x * (3 - 2 * x);
  };
  const mod = (value, size) => ((value % size) + size) % size;
  const make = (tag, className, attributes) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (attributes) Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const items = details.map((detail, index) => {
    const name = detail.querySelector('.item-name');
    const type = detail.querySelector('.item-type');
    const label = (name ? name.textContent : '').replace(/\s+/g, ' ').trim();
    return {
      index,
      id: detail.id || label.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      html: name ? name.innerHTML : '',
      label,
      type: type ? type.textContent.replace(/\s+/g, ' ').trim() : '',
      content: detail.querySelector('.item-content'),
    };
  });
  const count = items.length;

  /* ---------- markup ---------- */

  // Native scroll surface: momentum and snapping come from the browser.
  // Its rows are invisible; the visible wheel is drawn from its position, so
  // jumping by whole revolutions never shows.
  const CYCLES = 41;
  const MIDDLE = 20;
  const scroller = make('div', 'bs-scroll', { 'aria-hidden': 'true', tabindex: '-1' });
  const runway = make('div', 'bs-runway');
  const rows = document.createDocumentFragment();
  for (let index = 0; index < CYCLES * count; index += 1) rows.append(make('div', 'bs-slot'));
  runway.append(rows);
  scroller.append(runway);

  const veil = make('div', 'bs-veil', { 'aria-hidden': 'true' });
  const wheel = make('div', 'bs-wheel', { 'aria-hidden': 'true' });
  const REACH = 5;
  const faces = [];
  for (let offset = -REACH; offset <= REACH; offset += 1) {
    const face = make('div', 'bs-face');
    const name = make('span', 'bs-name');
    const type = make('span', 'bs-type');
    face.append(name, type);
    wheel.append(face);
    faces.push({ face, name, type, item: -1, shown: false });
  }
  const band = make('div', 'bs-band', { 'aria-hidden': 'true' });
  band.append(make('span', 'plus'));

  // Keyboard and screen reader access: one real button per project.
  const picker = make('ul', 'bs-picker', { 'aria-label': root.dataset.labelProjects || 'projects' });
  const picks = items.map(item => {
    const entry = make('li');
    const button = make('button', 'bs-pick', { type: 'button', 'aria-controls': 'bs-reader', 'aria-expanded': 'false' });
    button.textContent = item.type ? `${item.label}, ${item.type}` : item.label;
    entry.append(button);
    picker.append(entry);
    return button;
  });

  // The reader shows the one project opened.
  const reader = make('dialog', 'bs-reader', { id: 'bs-reader' });
  const readerScroll = make('div', 'bs-reader-scroll');
  const article = make('div', 'bs-reader-body');
  const sections = items.map(item => {
    const block = make('section', 'bs-entry', { 'aria-labelledby': `bs-title-${item.id}` });
    const head = make('header', 'bs-reader-head');
    const title = make('h2', 'bs-reader-title', { id: `bs-title-${item.id}`, tabindex: '-1' });
    title.innerHTML = item.html;
    head.append(title);
    if (item.type) {
      const kind = make('p', 'bs-reader-type');
      kind.textContent = item.type;
      head.append(kind);
    }
    // Where the wheel showed "+", the open project shows "×" to close it.
    const shut = make('button', 'bs-head-close', { type: 'button', 'aria-label': root.dataset.labelClose || 'close' });
    head.append(shut);
    const body = make('div', 'bs-reader-content');
    if (item.content) body.append(item.content);
    block.append(head, body);
    return { block, head, title, shut };
  });
  readerScroll.append(article);
  const closer = make('button', 'bs-close', { type: 'button', 'aria-label': root.dataset.labelClose || 'close' });
  reader.append(readerScroll, closer);

  list.hidden = true;
  section.append(scroller, veil, wheel, band, picker, reader);
  root.classList.add('scroll-ready');

  /* ---------- haptics ---------- */

  // Android: Vibration API. iOS 17.4 to 26.4: a switch toggle plays the
  // system tick. Newer iOS blocks scripted haptics; the snap stays visual.
  const haptic = (() => {
    const vibrate = typeof navigator.vibrate === 'function' ? navigator.vibrate.bind(navigator) : null;
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let toggle = null;
    if (!vibrate && apple) {
      toggle = make('label', 'bs-haptic', { 'aria-hidden': 'true' });
      toggle.append(make('input', '', { type: 'checkbox', switch: '', tabindex: '-1' }));
      document.body.append(toggle);
    }
    let last = 0;
    return (strong = false) => {
      const now = performance.now();
      if (now - last < 34) return;
      last = now;
      try {
        if (vibrate) {
          const active = !navigator.userActivation || navigator.userActivation.hasBeenActive;
          if (coarse.matches && active) vibrate(strong ? 14 : 7);
        } else if (toggle) {
          toggle.click();
        }
      } catch {
        // Haptics are a bonus; never let them interrupt scrolling.
      }
    };
  })();

  /* ---------- background dive ---------- */

  const dive = createDive(art, macroImage);

  /* ---------- wheel ---------- */

  const LIMIT = 1.38; // rows beyond ~79 degrees are hidden
  const PERSPECTIVE = 900;
  const DRIFT = 0.000012; // depth per millisecond the universe floats on
  let rowHeight = 0;
  let viewHeight = 0;
  let offset = 0;
  let radius = 0;
  let step = 0.29; // radians per row on the wheel
  let previous = 0;
  let travel = 0; // rows turned, signed; drives the zoom
  let eased = 0;
  let drift = 0; // depth the universe has floated on by itself
  let lastPosition = NaN;
  let detent = null;
  let touching = 0;
  let idleTimer = 0;
  let frame = 0;
  let clock = 0;
  let started = false;
  let focusing = false;
  let reading = -1;
  let pushed = false;
  let closeTimer = 0;
  let aim = null; // row a glide is heading to; repeated keys add up

  const position = () => (scroller.scrollTop - offset) / rowHeight;

  function measure() {
    const height = scroller.clientHeight;
    if (!height) return;
    const keep = started ? position() : MIDDLE * count;
    rowHeight = Math.round(clamp(height * 0.086, 60, 84));
    root.style.setProperty('--row', `${rowHeight}px`);
    viewHeight = height;
    // The wheel never reaches under the header or footer; short screens
    // get a tighter, more curved wheel.
    radius = Math.min(rowHeight / 0.29, Math.max(rowHeight * 1.5, height / 2 - 66) / 0.98);
    step = rowHeight / radius;
    const pad = Math.floor((height - rowHeight) / 2);
    runway.style.paddingTop = `${pad}px`;
    runway.style.paddingBottom = `${height - rowHeight - pad}px`;
    offset = pad + rowHeight / 2 - height / 2;
    quiet(keep * rowHeight + offset);
    detent = Math.round(position());
    started = true;
    lastPosition = NaN;
    dive.resize();
    schedule();
  }

  // Programmatic jumps (resize, recentering) never count as turning.
  function quiet(top) {
    readScroll();
    const before = scroller.scrollTop;
    scroller.scrollTop = top;
    previous = scroller.scrollTop;
    if (detent !== null && rowHeight) detent += Math.round((previous - before) / rowHeight);
  }

  function readScroll() {
    const top = scroller.scrollTop;
    const delta = top - previous;
    previous = top;
    if (delta && rowHeight) travel += delta / rowHeight;
  }

  function layoutWheel(pos) {
    const base = Math.round(pos);
    const edge = Math.cos(LIMIT);
    for (let index = 0; index < faces.length; index += 1) {
      const face = faces[index];
      const row = base + index - REACH;
      const theta = (row - pos) * step;
      if (Math.abs(theta) >= LIMIT) {
        if (face.shown) {
          face.face.style.visibility = 'hidden';
          face.shown = false;
        }
        continue;
      }
      const item = mod(row, count);
      if (face.item !== item) {
        face.name.innerHTML = items[item].html;
        face.type.textContent = items[item].type;
        face.item = item;
      }
      const cos = Math.cos(theta);
      const scale = PERSPECTIVE / (PERSPECTIVE + radius * (1 - cos));
      const y = radius * Math.sin(theta) * scale;
      const near = smooth(0, 1, 1 - Math.abs(row - pos));
      const fade = Math.pow((cos - edge) / (1 - edge), 1.35);
      // Centre in the site's dark grey (#5c5c56), never black; neighbours fade lighter.
      const tone = Math.round(146 - 54 * near);
      face.face.style.transform = `translate(-50%,-50%) translate(0,${y.toFixed(2)}px) scale(${scale.toFixed(4)},${(cos * scale).toFixed(4)})`;
      face.face.style.opacity = fade.toFixed(3);
      face.name.style.color = `rgb(${tone},${tone},${tone - 6})`;
      face.type.style.opacity = (near * near).toFixed(3);
      if (!face.shown) {
        face.face.style.visibility = 'visible';
        face.shown = true;
      }
    }
  }

  function tickDetent(pos) {
    const row = Math.round(pos);
    if (detent === null) detent = row;
    if (row === detent) return;
    detent = row;
    const current = mod(row, count);
    picks.forEach((button, index) => {
      if (index === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (reading < 0) haptic();
  }

  // Depth only grows while the wheel turns on, and the dive carries on into
  // the next brain without a seam.
  function depthAt(rowsTurned) {
    return rowsTurned * dive.pace;
  }

  let veiled = -1;
  function paint(amount) {
    const cover = Math.round(amount * 50) / 50;
    if (cover === veiled) return;
    veiled = cover;
    root.style.setProperty('--veil', String(cover));
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    frame = 0;
    if (!root.isConnected) return;
    const elapsed = clock ? clamp(now - clock, 1, 64) : 16.7;
    clock = now;
    if (!rowHeight) return;
    readScroll();
    const pos = position();
    if (pos !== lastPosition) {
      layoutWheel(pos);
      tickDetent(pos);
      lastPosition = pos;
    }
    // Reduced motion removes the easing, not the zoom: it follows the
    // wheel the visitor turns by hand.
    eased = reduced.matches ? travel : eased + (travel - eased) * (1 - Math.exp(-elapsed / 420));
    if (Math.abs(travel - eased) < 0.0005) eased = travel;
    // Deep in the universe nothing stands quite still: it floats on by
    // itself, except while a text is read or motion is reduced. The brain the
    // visitor arrives at, and the one the flight ends in, stays calm and whole.
    const floating = reading < 0 && !reduced.matches && mod(depthAt(eased) + drift, dive.cycle) > dive.open;
    if (floating) drift += elapsed * DRIFT;
    dive.draw(depthAt(eased) + drift);
    paint(dive.veil);
    if (pos !== lastPosition) {
      layoutWheel(pos);
      lastPosition = pos;
    }
    if (eased !== travel || floating || dive.arriving) schedule();
    else clock = 0;
  }

  function settle() {
    aim = null;
    if (touching || reading >= 0 || !rowHeight) return;
    const pos = position();
    const shift = MIDDLE - Math.floor(Math.round(pos) / count);
    if (shift) quiet(scroller.scrollTop + shift * count * rowHeight);
    schedule();
  }

  function glide(row) {
    aim = row;
    scroller.scrollTo({ top: row * rowHeight + offset, behavior: reduced.matches ? 'auto' : 'smooth' });
  }

  function nearestRow(index) {
    const base = Math.round(position());
    let delta = mod(index - base, count);
    if (delta > count / 2) delta -= count;
    return base + delta;
  }

  // Faces sit on a cylinder, so a tap is mapped back through the projection.
  function rowAt(x, y) {
    const rect = scroller.getBoundingClientRect();
    if (Math.abs(x - (rect.left + rect.width / 2)) > band.offsetWidth / 2 + 24) return null;
    const target = y - (rect.top + viewHeight / 2);
    const pos = position();
    const base = Math.round(pos);
    let best = null;
    let gap = Infinity;
    for (let row = base - REACH; row <= base + REACH; row += 1) {
      const theta = (row - pos) * step;
      if (Math.abs(theta) >= LIMIT) continue;
      const cos = Math.cos(theta);
      const scale = PERSPECTIVE / (PERSPECTIVE + radius * (1 - cos));
      const distance = Math.abs(target - radius * Math.sin(theta) * scale);
      if (distance < gap) {
        gap = distance;
        best = row;
      }
    }
    return gap <= rowHeight * 0.62 ? best : null;
  }

  scroller.addEventListener('scroll', () => {
    schedule();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 150);
  }, { passive: true });
  scroller.addEventListener('scrollend', () => {
    clearTimeout(idleTimer);
    settle();
  });
  scroller.addEventListener('touchstart', event => {
    touching = event.touches.length;
    aim = null;
  }, { passive: true });
  scroller.addEventListener('wheel', () => { aim = null; }, { passive: true });
  const release = event => {
    touching = event.touches.length;
    if (!touching) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, 150);
    }
  };
  scroller.addEventListener('touchend', release, { passive: true });
  scroller.addEventListener('touchcancel', release, { passive: true });

  scroller.addEventListener('click', event => {
    if (reading >= 0) return;
    const row = rowAt(event.clientX, event.clientY);
    if (row === null) return;
    if (Math.abs(row - position()) < 0.35) open(mod(row, count));
    else {
      haptic();
      glide(row);
    }
  });

  scroller.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const row = rowAt(event.clientX, event.clientY);
    const centered = row !== null && Math.abs(row - position()) < 0.35;
    scroller.style.cursor = row === null ? '' : 'pointer';
    root.classList.toggle('is-pointing', centered);
  }, { passive: true });
  scroller.addEventListener('pointerleave', () => root.classList.remove('is-pointing'));

  document.addEventListener('keydown', event => {
    if (reading >= 0 || document.body.classList.contains('intro-locked')) return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const onPick = picks.includes(target);
    const neutral = onPick || target === document.body || target === document.documentElement || target === main || target === scroller;
    if (!neutral) return;
    const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: 3, PageUp: -3 }[event.key];
    if (steps) {
      event.preventDefault();
      const row = (aim === null ? Math.round(position()) : aim) + steps;
      glide(row);
      if (onPick) {
        focusing = true;
        picks[mod(row, count)].focus({ preventScroll: true });
        focusing = false;
      }
    } else if (!onPick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      open(mod(Math.round(position()), count));
    }
  });

  picker.addEventListener('focusin', event => {
    const index = picks.indexOf(event.target);
    if (index < 0) return;
    root.classList.toggle('picker-focus', event.target.matches(':focus-visible'));
    if (!focusing && reading < 0) glide(nearestRow(index));
  });
  picker.addEventListener('focusout', () => root.classList.remove('picker-focus'));
  picks.forEach((button, index) => button.addEventListener('click', () => open(index)));

  /* ---------- reader ---------- */

  function mark(index) {
    reading = index;
    reader.setAttribute('aria-labelledby', `bs-title-${items[index].id}`);
    picks.forEach((button, slot) => button.setAttribute('aria-expanded', String(slot === index)));
  }

  function open(index, fromHistory = false) {
    if (index < 0 || index >= count || reading >= 0) return;
    clearTimeout(closeTimer);
    const item = items[index];
    article.replaceChildren(sections[index].block);
    // Park the wheel on the opened project, so closing returns to it. The
    // zoom stays where the wheel left it while the text is read.
    const row = nearestRow(index);
    if (Math.round(position()) !== row) quiet(row * rowHeight + offset);
    mark(index);
    readerScroll.scrollTop = 0;
    root.classList.add('is-reading');
    if (!reader.open) reader.showModal();
    requestAnimationFrame(() => reader.classList.add('is-shown'));
    sections[index].title.focus({ preventScroll: true });
    if (!fromHistory) {
      try {
        history.pushState({ bsReader: item.id }, '', `#${item.id}`);
        pushed = true;
      } catch {
        pushed = false;
      }
    }
    haptic(true);
    schedule();
  }

  function close(fromHistory = false) {
    if (reading < 0) return;
    const last = reading;
    reading = -1;
    picks.forEach(button => button.setAttribute('aria-expanded', 'false'));
    root.classList.remove('is-reading');
    reader.classList.remove('is-shown');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (reading >= 0 || !reader.open) return;
      // Closing hands focus back to the picker; keep it on the project read
      // instead of letting the restored focus turn the wheel elsewhere.
      focusing = true;
      reader.close();
      if (picker.contains(document.activeElement)) picks[last].focus({ preventScroll: true });
      focusing = false;
    }, reduced.matches ? 0 : 340);
    if (!fromHistory) {
      if (pushed) {
        pushed = false;
        history.back();
      } else if (window.location.hash) {
        history.replaceState(history.state, '', window.location.pathname + window.location.search);
      }
    }
    lastPosition = NaN;
    schedule();
  }

  // Clips in the text load only when they come near and play while in view,
  // so the page stays light and the loop runs smoothly.
  const clips = sections.flatMap(({ block }) => [...block.querySelectorAll('video[data-src]')]);
  if (clips.length && 'IntersectionObserver' in window) {
    const watch = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return target.pause();
      if (!target.getAttribute('src')) {
        target.preload = 'auto';
        target.src = target.dataset.src;
      }
      if (!reduced.matches) target.play().catch(() => {});
    }), { rootMargin: '300px 0px' });
    clips.forEach(clip => {
      clip.muted = true;
      watch.observe(clip);
    });
  }

  reader.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  closer.addEventListener('click', () => close());
  // The whole band between the two lines closes, where the row was tapped open;
  // the × inside it stays the keyboard's way out.
  sections.forEach(entry => entry.head.addEventListener('click', () => close()));
  reader.addEventListener('click', event => {
    if (event.target === reader || event.target === readerScroll) close();
  });

  const indexOf = id => items.findIndex(item => item.id === id);

  window.addEventListener('popstate', () => {
    const id = history.state && history.state.bsReader;
    const index = id ? indexOf(id) : -1;
    if (index >= 0) {
      if (reading < 0) {
        pushed = true;
        open(index, true);
      }
    } else if (reading >= 0) {
      pushed = false;
      close(true);
    }
  });

  function openFromHash() {
    let id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const index = indexOf(id);
    if (index < 0) return;
    quiet((MIDDLE * count + index) * rowHeight + offset);
    detent = Math.round(position());
    pushed = false;
    open(index, true);
  }
  window.addEventListener('hashchange', () => {
    if (reading < 0) openFromHash();
  });

  const observer = new ResizeObserver(measure);
  observer.observe(scroller);
  if (reduced.addEventListener) reduced.addEventListener('change', schedule);
  macroImage.addEventListener('load', () => {
    dive.resize();
    schedule();
  });

  wheelState = () => ({ id: items[mod(Math.round(position()), count)].id, travel, drift });

  function restoreAfterSwitch() {
    let state = null;
    try {
      state = JSON.parse(window.sessionStorage.getItem(SWITCH));
      window.sessionStorage.removeItem(SWITCH);
    } catch { return; }
    if (!state || window.location.hash) return;
    const index = indexOf(state.id);
    if (index < 0) return;
    quiet((MIDDLE * count + index) * rowHeight + offset);
    detent = Math.round(position());
    if (Number.isFinite(state.travel)) eased = travel = state.travel;
    if (Number.isFinite(state.drift)) drift = state.drift;
  }

  measure();
  restoreAfterSwitch();
  openFromHash();
  schedule();

  /* =================================================================== */

  function createDive(host, macro) {
    const canvas = make('canvas', 'bs-canvas');
    host.append(canvas);
    const context = canvas.getContext('2d', { alpha: false });

    // One journey from large to ever finer, every drawing exactly once:
    // the brain, its folds (gyri) with their neurons, one cubic millimetre
    // of cortex wiring (after the H01 reconstruction, Harvard and Google),
    // a dendrite with its spines (about 1 um), one synapse with its 40 nm
    // vesicles (cryo-electron tomography), the molecules inside a vesicle,
    // which already read as stars. There the smallest becomes the largest:
    // galaxies, the cosmic web (Vazza and Feletti, 2020, found it structured
    // like the brain's network) and its endless depth, then the next brain.
    const MACRO_NODE = { wide: [1050, 284], tall: [563, 412] };
    const SHEETS = {
      gyri: { src: '/assets/neuro-gyri.webp', focus: [1013, 900], size: [1920, 1920] },
      inside: { src: '/assets/neuro-inside.webp', focus: [975, 959], size: [1920, 1920] },
      dendrite: { src: '/assets/neuro-dendrite.webp', focus: [1037, 860], size: [1920, 1920] },
      synapse: { src: '/assets/neuro-synapse.webp', focus: [947, 1057], size: [1920, 1920] },
      molecule: { src: '/assets/neuro-molecule.webp', focus: [947, 953], size: [1920, 1920] },
      cosmos: { src: '/assets/neuro-cosmos.webp', focus: [964, 947], size: [1920, 1920] },
      web: { src: '/assets/neuro-web.webp', focus: [1003, 973], size: [1920, 1920] },
      deep: { src: '/assets/neuro-deep.webp', focus: [947, 937], size: [1920, 1920] },
    };
    // Ink per drawing: the close-ups are held back so their lines stay as fine
    // as the H01 drawing while they grow.
    const INK = { gyri: 0.85, inside: 0.8, dendrite: 0.7, synapse: 0.68, molecule: 0.8, cosmos: 0.85, web: 0.82, deep: 0.72 };
    // The way in through the brain, then the flight through the universe.
    // Each drawing grows out of the centre of the one before: the neuron in
    // the folds, the synapse on the dendrite, the docking vesicle, the
    // densest cluster of molecules, the knot where the cosmic filaments meet.
    const WAY = [
      { name: 'gyri' },
      { name: 'inside', scale: Math.exp(-1.1) },
      { name: 'dendrite', scale: Math.exp(-0.9) },
      { name: 'synapse', scale: Math.exp(-0.9) },
      { name: 'molecule', scale: Math.exp(-0.9) },
    ];
    const FLIGHT = ['cosmos', 'web', 'deep'];
    const STEP = 0.85; // depth between two spheres of the flight
    const ENTER = 0.3; // a sphere takes over this far before its natural size
    const ARRIVE = 600; // ms a drawing takes to fade in once it has loaded

    const api = { pace: 0.14, cycle: 12, open: 12, veil: 0.5, arriving: false, resize, draw };
    const sheets = Object.fromEntries(Object.entries(SHEETS).map(([name, sheet]) => [name, { ...sheet, state: 'idle', image: null }]));
    const chain = [
      ...WAY,
      ...FLIGHT.map(name => ({ name, scale: Math.exp(-STEP) })),
    ].map(level => ({ ...level, sheet: sheets[level.name], ink: INK[level.name] }));
    let width = 0;
    let height = 0;
    let ratio = 1;
    let camera = null;
    let lastDepth = NaN;
    let prefetched = false;

    // Each drawing's border already fades to paper in its file
    // (scripts/bake_dive_edges.py), so a smaller drawing blooms inside the
    // larger one instead of showing an edge. It is decoded off the main
    // thread and handed to the canvas once, a pixel in a corner the next
    // frame paints over, so the frame that first shows it does not stall.
    function load(level) {
      const sheet = level.sheet;
      if (sheet.state !== 'idle') return;
      sheet.state = 'loading';
      const image = new Image();
      image.decoding = 'async';
      // After the intro and the page itself: the drawings are needed a few turns later.
      image.fetchPriority = 'low';
      image.src = sheet.src;
      const decoded = typeof image.decode === 'function' ? image.decode()
        : new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      decoded.then(() => {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        context.drawImage(image, 0, 0, 1, 1);
        sheet.image = image;
        sheet.state = 'ready';
        sheet.since = performance.now();
        lastDepth = NaN;
        schedule();
      }, () => { sheet.state = 'failed'; });
    }

    function resize() {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      const backingWidth = Math.round(width * ratio);
      const backingHeight = Math.round(height * ratio);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      const imageWidth = macro.naturalWidth || 1536;
      const imageHeight = macro.naturalHeight || 1024;
      const portrait = imageHeight > imageWidth;
      const relative = portrait ? 0.6 : 0.45;
      const brainNode = portrait ? MACRO_NODE.tall : MACRO_NODE.wide;
      // The dive enters the brain where its fibres meet: the centre of the folds.
      const node = brainNode;
      // On phones the visitor arrives at the whole drawing, exactly as Paul
      // chose it: 97.5 % of the width, centred, its top 32 px below the page
      // edge. Wide screens keep the drawing filling the view.
      const scaleBrain = portrait ? width * 0.975 / imageWidth : Math.max(width / imageWidth, height / imageHeight);
      const start = [(width - imageWidth * scaleBrain) * (portrait ? 0.5 : 1) + node[0] * scaleBrain, (portrait ? 32 : 0) + node[1] * scaleBrain];
      // The deep spheres open just right of the wheel on wide screens, so
      // each drawing still reaches the left edge, and above it on tall ones.
      const landscape = width > height * 1.1;
      const finish = landscape ? [width * 0.56, height * 0.5] : [width * 0.5, height * 0.3];

      // Scales: screen pixels per drawing pixel before any zoom.
      const first = chain[0];
      first.k = scaleBrain * relative;
      chain.slice(1).forEach((level, index) => { level.k = chain[index].k * level.scale; });
      // The folds take over once they cover the screen; every other
      // sphere a little before its natural size, while it is still sharp.
      const [mx, my] = first.sheet.focus;
      const [mw, mh] = first.sheet.size;
      const reach = Math.max(start[0] / (mx * first.k), start[1] / (my * first.k), (width - start[0]) / ((mw - mx) * first.k), (height - start[1]) / ((mh - my) * first.k));
      first.handover = Math.log(reach * 1.12);
      chain.slice(1).forEach(level => { level.handover = Math.log(1 / level.k) - ENTER; });
      // The flight begins with the cosmos at its natural size. Nothing turns:
      // the view only ever goes deeper.
      const opening = chain[WAY.length - 1].handover + ENTER;
      const cycle = chain[chain.length - 1].handover + 1.6;
      camera = {
        node, start, finish, scaleBrain,
        ink: 0.95,
        inkMicro: portrait ? 0.5 : 0.58,
        out: [0.4, opening],
        back: [cycle - 3.2, cycle - 1.6],
      };
      // Each drawing is seen from where it takes over until the next one has.
      chain.forEach((level, index) => { level.until = index < chain.length - 1 ? chain[index + 1].handover + 0.1 : cycle - 0.2; });
      api.open = opening;
      api.cycle = cycle;
      lastDepth = NaN;
      load(first);
      // Turned backwards, the wheel first reaches the deep universe, so it is
      // fetched once the page has settled, not only when it is needed.
      if (!prefetched) {
        prefetched = true;
        setTimeout(() => load(chain[chain.length - 1]), 2500);
      }
    }

    /* ---------- depth ---------- */

    // A field of fine points the view flies through, so the zoom is felt as
    // a journey and not only seen as a picture growing. Inside the brain
    // they are vesicles drifting in the tissue. Past the threshold, where the
    // smallest becomes the largest, they are stars, a few of them sparkling,
    // and spiral galaxies gliding past. Every point is a function of depth
    // alone, so turning back flies back through the same field; turned fast,
    // the points draw short trails. All of it graphite on paper.
    const NEAR = 0.06; // closest a point comes before it fades away
    const SPAN = 1.5; // depth a point takes from the far end to the eye
    const GRAPHITE = 'rgb(74,74,68)';
    const field = (() => {
      let seed = 20261009;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      // x and y in half screens, so the field fills phones and wide screens alike.
      const points = Array.from({ length: 300 }, (_, index) => {
        let x;
        let y;
        do {
          x = random() * 2.5 - 1.25;
          y = random() * 2.5 - 1.25;
        } while (Math.hypot(x, y) < 0.12);
        return { x, y, z: random(), size: 0.45 + 1.5 * random() * random(), ring: index % 5 === 0, spark: index % 11 === 0, phase: random() * Math.PI * 2, rate: 0.4 + random() };
      });
      // Galaxies start near the middle of the view and glide outwards past it.
      const galaxies = Array.from({ length: 5 }, (_, index) => {
        const angle = index * 2.4 + random() * 0.8;
        const reach = 0.16 + random() * 0.32;
        return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, z: (index + random() * 0.5) / 5, turn: random() * Math.PI, tilt: 0.38 + random() * 0.5, size: 0.3 + random() * 0.14, sprite: index % 3 };
      });
      return { points, galaxies, random, sprites: null };
    })();
    let fieldTravel = NaN;
    let fieldTime = 0;
    let speed = 0; // depth per second, smoothed

    // Three spiral galaxies drawn once in graphite dots: a soft core and
    // logarithmic arms, like the drawings around them.
    function galaxies() {
      if (field.sprites) return field.sprites;
      const random = field.random;
      field.sprites = [2, 2, 3].map((arms, variant) => {
        const size = 256;
        const sprite = document.createElement('canvas');
        sprite.width = size;
        sprite.height = size;
        const pen = sprite.getContext('2d');
        pen.translate(size / 2, size / 2);
        const core = pen.createRadialGradient(0, 0, 0, 0, 0, size * 0.15);
        core.addColorStop(0, 'rgba(74,74,68,0.5)');
        core.addColorStop(1, 'rgba(74,74,68,0)');
        pen.fillStyle = core;
        pen.fillRect(-size / 2, -size / 2, size, size);
        pen.fillStyle = GRAPHITE;
        const pitch = 0.22 + variant * 0.06;
        const dot = (x, y, r, alpha) => {
          pen.globalAlpha = alpha;
          pen.beginPath();
          pen.arc(x, y, r, 0, Math.PI * 2);
          pen.fill();
        };
        for (let arm = 0; arm < arms; arm += 1) {
          for (let i = 0; i < 480; i += 1) {
            const u = i / 480;
            const r = size * (0.035 + 0.42 * u);
            const theta = arm * Math.PI * 2 / arms + Math.log(r / (size * 0.035)) / pitch;
            const spread = r * 0.14 * (0.4 + u);
            dot(r * Math.cos(theta) + (random() - 0.5) * spread, r * Math.sin(theta) + (random() - 0.5) * spread,
              0.6 + 1.5 * (1 - u) * random(), 0.25 + 0.65 * (1 - u) * random());
          }
        }
        for (let i = 0; i < 240; i += 1) {
          const angle = random() * Math.PI * 2;
          const r = size * 0.47 * Math.sqrt(random());
          dot(r * Math.cos(angle), r * Math.sin(angle), 0.7, 0.15 + 0.3 * random());
        }
        return sprite;
      });
      return field.sprites;
    }

    function depthField(travelled, depth, threshold, cx, cy, now) {
      if (Number.isFinite(fieldTravel)) {
        const elapsed = Math.max(now - fieldTime, 1);
        speed += ((travelled - fieldTravel) / elapsed * 1000 - speed) * Math.min(1, elapsed / 120);
      }
      fieldTravel = travelled;
      fieldTime = now;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // The light at the threshold: the view passes through a membrane of
      // light, one fine ring opening outwards, and comes out among the stars.
      const gate = Math.exp(-(((depth - threshold) / 0.22) ** 2));
      if (reduced.matches) {
        if (gate > 0.01) light(gate, depth, threshold, cx, cy);
        return;
      }
      const inside = smooth(chain[0].handover - 0.2, chain[0].handover + 0.5, depth) * (1 - smooth(threshold - 0.45, threshold, depth));
      const space = smooth(threshold - 0.15, threshold + 0.45, depth) * (1 - smooth(api.cycle - 1.3, api.cycle - 0.45, depth));
      if (inside > 0.01 || space > 0.01) {
        const fx = width * 0.55;
        const fy = height * 0.55;
        // Trails only on a fast turn; at reading pace the points stay points.
        const trail = Math.sign(speed) * clamp((Math.abs(speed) - 0.8) * 0.06, 0, 0.3);
        const streaking = Math.abs(trail) > 0.004;
        const buckets = Array.from({ length: 6 }, () => ({ dots: new Path2D(), rings: new Path2D(), lines: new Path2D() }));
        const seconds = now / 1000;
        context.globalCompositeOperation = 'multiply';
        if (space > 0.01) {
          const sprites = galaxies();
          field.galaxies.forEach(galaxy => {
            const zz = NEAR + mod(galaxy.z - depth / (SPAN * 2.2), 1);
            const alpha = space * 0.85 * smooth(1 + NEAR, 0.6, zz) * smooth(0.12, 0.42, zz);
            if (alpha < 0.01) return;
            const size = galaxy.size * Math.min(width, height) / zz;
            const sx = cx + galaxy.x * fx / zz;
            const sy = cy + galaxy.y * fy / zz;
            if (sx + size < 0 || sy + size < 0 || sx - size > width || sy - size > height) return;
            context.globalAlpha = alpha;
            context.setTransform(ratio, 0, 0, ratio, ratio * sx, ratio * sy);
            context.rotate(galaxy.turn);
            context.scale(1, galaxy.tilt);
            context.drawImage(sprites[galaxy.sprite], -size / 2, -size / 2, size, size);
          });
          context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }
        const stars = space >= inside;
        field.points.forEach(point => {
          const zz = NEAR + mod(point.z - depth / SPAN, 1);
          let alpha = smooth(1 + NEAR, 0.72, zz) * smooth(NEAR, 0.24, zz) * (inside * 0.42 + space * 0.78);
          if (alpha < 0.02) return;
          const sx = cx + point.x * fx / zz;
          const sy = cy + point.y * fy / zz;
          if (sx < -24 || sy < -24 || sx > width + 24 || sy > height + 24) return;
          const r = Math.min(point.size * (stars ? 0.34 : 0.28) / zz, 3.4);
          if (stars && point.spark) alpha *= 0.7 + 0.3 * Math.sin(seconds * point.rate * Math.PI + point.phase);
          const bucket = buckets[Math.min(5, Math.floor(alpha * 6))];
          if (streaking) {
            // Where the point was a moment ago; turning back it was nearer, never behind the eye.
            const from = clamp(zz + trail, NEAR * 0.6, 1 + NEAR);
            bucket.lines.moveTo(cx + point.x * fx / from, cy + point.y * fy / from);
            bucket.lines.lineTo(sx, sy);
          } else if (!stars && point.ring) {
            bucket.rings.moveTo(sx + r * 1.4, sy);
            bucket.rings.arc(sx, sy, r * 1.4, 0, Math.PI * 2);
          } else {
            bucket.dots.moveTo(sx + r, sy);
            bucket.dots.arc(sx, sy, r, 0, Math.PI * 2);
          }
          if (stars && point.spark) {
            const reach = r * 4;
            bucket.rings.moveTo(sx - reach, sy);
            bucket.rings.lineTo(sx + reach, sy);
            bucket.rings.moveTo(sx, sy - reach);
            bucket.rings.lineTo(sx, sy + reach);
          }
        });
        context.fillStyle = GRAPHITE;
        context.strokeStyle = GRAPHITE;
        context.lineCap = 'round';
        buckets.forEach((bucket, index) => {
          context.globalAlpha = (index + 0.5) / 6;
          context.fill(bucket.dots);
          context.lineWidth = 0.6;
          context.stroke(bucket.rings);
          context.lineWidth = 1.1;
          context.stroke(bucket.lines);
        });
      }
      if (gate > 0.01) light(gate, depth, threshold, cx, cy);
    }

    function light(gate, depth, threshold, cx, cy) {
      const radius = Math.hypot(width, height) * 0.62;
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, `rgba(255,255,255,${(0.92 * gate).toFixed(3)})`);
      glow.addColorStop(0.4, `rgba(255,255,255,${(0.5 * gate).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'multiply';
      context.globalAlpha = 0.32 * gate;
      context.strokeStyle = GRAPHITE;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(cx, cy, 6 + smooth(threshold - 0.3, threshold + 0.35, depth) * radius * 1.15, 0, Math.PI * 2);
      context.stroke();
    }

    // Draws a drawing with its focus on the camera point.
    function place(image, focus, scale, cx, cy) {
      const s = scale * ratio;
      context.setTransform(s, 0, 0, s, ratio * cx, ratio * cy);
      context.drawImage(image, -focus[0], -focus[1]);
    }

    function draw(travelled) {
      if (!camera) return;
      const depth = mod(travelled, api.cycle);
      // A drawing that has just arrived fades in instead of appearing at once.
      const now = performance.now();
      const shown = chain.map(level => (level.sheet.state === 'ready' ? smooth(0, ARRIVE, now - level.sheet.since) : 0));
      api.arriving = shown.some(value => value > 0 && value < 1);
      // Every change is drawn, so floating and scrolling run like a film.
      if (!api.arriving && Math.abs(depth - lastDepth) < 1e-4) return;
      lastDepth = depth;
      // Fetch each drawing a little before the dive reaches it, turning
      // forwards or backwards; never all of them at once.
      chain.forEach(level => { if (depth > level.handover - 1.4 && depth < level.until + 1) load(level); });
      // The view drifts from the brain to beside the wheel and, on the way to
      // the next brain, back again.
      const away = smooth(camera.out[0], camera.out[1], depth) * (1 - smooth(camera.back[0], camera.back[1], depth));
      const cx = camera.start[0] + (camera.finish[0] - camera.start[0]) * away;
      const cy = camera.start[1] + (camera.finish[1] - camera.start[1]) * away;
      // The brain the visitor arrives at stays clearly visible behind a light
      // veil; deeper in, the veil grows so the names stay clear of the web.
      const deep = smooth(chain[0].handover - 0.5, chain[0].handover + 0.3, depth) * (1 - smooth(api.cycle - 1.5, api.cycle - 0.2, depth));
      api.veil = 0.5 + 0.35 * deep;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.globalCompositeOperation = 'multiply';

      brain(depth, shown[0], cx, cy);
      chain.forEach((level, index) => {
        if (!shown[index]) return;
        const next = chain[index + 1];
        // Each drawing hands over while it is still sharp.
        const kept = !next ? 1 - smooth(api.cycle - 1, api.cycle - 0.2, depth)
          : stay(1 - smooth(next.handover - 0.3, next.handover + 0.1, depth), next.handover, depth, shown[index + 1]);
        let alpha = smooth(level.handover - 0.5, level.handover, depth) * kept * shown[index];
        if (alpha < 0.002) return;
        if (index === 0) alpha *= camera.inkMicro;
        if (level.ink) alpha *= level.ink;
        context.globalAlpha = alpha;
        place(level.sheet.image, level.sheet.focus, level.k * Math.exp(depth), cx, cy);
      });
      // The next brain, already growing out of the last neuron.
      if (depth > api.cycle - 1.6) brain(depth - api.cycle, shown[0], cx, cy);
      depthField(travelled, depth, chain[WAY.length].handover - 0.1, cx, cy, now);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
    }

    // How much of a drawing stays while the next one takes over at
    // `handover`: `passed` once the next is shown. While the next has not
    // arrived, it stays a little longer and then gives way to paper: grown far
    // past its size it would turn into grey fog, and where its centre is a
    // dark line, into black.
    function stay(passed, handover, depth, next) {
      const waiting = 1 - smooth(handover + 0.3, handover + 0.9, depth);
      return waiting + (passed - waiting) * next;
    }

    function brain(depth, firstShown, cx, cy) {
      const first = chain[0];
      const fade = stay(1 - smooth(first.handover - 0.02, first.handover + 0.35, depth), first.handover + 0.25, depth, firstShown);
      const alpha = camera.ink * smooth(-1.5, -0.7, depth) * fade;
      if (alpha < 0.002 || !macro.complete || !macro.naturalWidth) return;
      context.globalAlpha = alpha;
      place(macro, camera.node, camera.scaleBrain * Math.exp(depth), cx, cy);
    }

    return api;
  }
})();
