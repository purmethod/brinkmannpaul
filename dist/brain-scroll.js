(() => {
  'use strict';

  // Picker wheel over a scroll-driven dive into the brain drawing.
  // Turning the wheel zooms from the approved brain drawing through the
  // approved microstructure into a vector neuron, down to a single synapse,
  // and back out again. Without JavaScript the plain project list remains.

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

  const TAU = Math.PI * 2;
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
  const picker = make('ul', 'bs-picker', { 'aria-label': 'projects' });
  const picks = items.map(item => {
    const entry = make('li');
    const button = make('button', 'bs-pick', { type: 'button', 'aria-controls': 'bs-reader', 'aria-expanded': 'false' });
    button.textContent = item.type ? `${item.label}, ${item.type}` : item.label;
    entry.append(button);
    picker.append(entry);
    return button;
  });

  const reader = make('dialog', 'bs-reader', { id: 'bs-reader', 'aria-labelledby': 'bs-reader-title' });
  const readerScroll = make('div', 'bs-reader-scroll');
  const article = make('article', 'bs-reader-body');
  const head = make('header', 'bs-reader-head');
  const title = make('h2', 'bs-reader-title', { id: 'bs-reader-title', tabindex: '-1' });
  const kind = make('p', 'bs-reader-type');
  head.append(title, kind);
  const content = make('div', 'bs-reader-content');
  const entries = items.map(item => {
    const entry = make('div', 'bs-entry');
    entry.hidden = true;
    if (item.content) entry.append(item.content);
    content.append(entry);
    return entry;
  });
  article.append(head, content);
  readerScroll.append(article);
  const closer = make('button', 'bs-close', { type: 'button', 'aria-label': 'close' });
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
  let rowHeight = 0;
  let viewHeight = 0;
  let offset = 0;
  let radius = 0;
  let step = 0.29; // radians per row on the wheel
  let previous = 0;
  let travel = 0; // rows turned, signed; drives the zoom
  let eased = 0;
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
  let readerPrevious = 0;
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
      const tone = Math.round(146 - 111 * near);
      face.face.style.transform = `translate(-50%,-50%) translate(0,${y.toFixed(2)}px) scale(${scale.toFixed(4)},${(cos * scale).toFixed(4)})`;
      face.face.style.opacity = fade.toFixed(3);
      face.name.style.color = `rgb(${tone},${tone},${tone - 3})`;
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

  // One revolution of the wheel dives down to the synapse, the next one
  // rises back to the whole brain. The ends ease, so the turn is soft.
  function depthAt(rowsTurned) {
    const phase = mod(rowsTurned / (2 * count), 1);
    const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    return (tri - 0.72 * Math.sin(TAU * tri) / TAU) * dive.depth;
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
    const still = reduced.matches;
    eased = still ? travel : eased + (travel - eased) * (1 - Math.exp(-elapsed / 130));
    if (Math.abs(travel - eased) < 0.0005) eased = travel;
    dive.draw(still ? 0 : depthAt(eased));
    if (eased !== travel) schedule();
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

  function open(index, fromHistory = false) {
    if (index < 0 || index >= count || reading === index) return;
    clearTimeout(closeTimer);
    const item = items[index];
    entries.forEach((entry, slot) => { entry.hidden = slot !== index; });
    title.innerHTML = item.html;
    kind.textContent = item.type;
    kind.hidden = !item.type;
    picks.forEach((button, slot) => button.setAttribute('aria-expanded', String(slot === index)));
    // Park the wheel on the opened project, so closing returns to it.
    const row = nearestRow(index);
    if (Math.round(position()) !== row) quiet(row * rowHeight + offset);
    reading = index;
    readerScroll.scrollTop = 0;
    readerPrevious = 0;
    root.classList.add('is-reading');
    if (!reader.open) reader.showModal();
    requestAnimationFrame(() => reader.classList.add('is-shown'));
    title.focus({ preventScroll: true });
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
    reading = -1;
    picks.forEach(button => button.setAttribute('aria-expanded', 'false'));
    root.classList.remove('is-reading');
    reader.classList.remove('is-shown');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (reading < 0 && reader.open) reader.close();
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

  reader.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  closer.addEventListener('click', () => close());
  reader.addEventListener('click', event => {
    if (event.target === reader || event.target === readerScroll) close();
  });
  readerScroll.addEventListener('scroll', () => {
    const top = readerScroll.scrollTop;
    if (rowHeight) travel += (top - readerPrevious) / rowHeight * 0.5;
    readerPrevious = top;
    schedule();
  }, { passive: true });

  const indexOf = id => items.findIndex(item => item.id === id);

  window.addEventListener('popstate', () => {
    const id = history.state && history.state.bsReader;
    const index = id ? indexOf(id) : -1;
    if (index >= 0) {
      if (reading !== index) {
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

  measure();
  openFromHash();
  schedule();

  /* =================================================================== */

  function createDive(host, macro) {
    const rasterCanvas = make('canvas', 'bs-canvas bs-raster');
    const vectorCanvas = make('canvas', 'bs-canvas bs-vector');
    host.append(rasterCanvas, vectorCanvas);
    const raster = rasterCanvas.getContext('2d', { alpha: false });
    const vector = vectorCanvas.getContext('2d');

    // Matching points in the two approved drawings: the zoom enters the
    // brain at a neuron and arrives at a dendrite of the large neuron.
    const MICRO_SOURCE = 'assets/neuroscience-microstructure.webp';
    const MICRO_FOCUS = [1000, 506];
    const MICRO_SOMA = [1108, 462];
    const MACRO_NODE = { wide: [1050, 284], tall: [563, 412] };
    const SOMA = [38, -1.55]; // the same neuron in vector units
    const TURN = Math.atan2(MICRO_SOMA[1] - MICRO_FOCUS[1], MICRO_SOMA[0] - MICRO_FOCUS[0]) - Math.atan2(SOMA[1], SOMA[0]);
    const PAPER = 'rgb(253,253,251)';
    const BODY = 0.13; // tone of the inside of tubes and cells

    const api = { depth: 6, resize, draw };
    let micro = null;
    let world = null;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let camera = null;
    let lastDepth = NaN;
    let rasterBlank = false;
    let vectorBlank = true;

    function resize() {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      const backingWidth = Math.round(width * ratio);
      const backingHeight = Math.round(height * ratio);
      [rasterCanvas, vectorCanvas].forEach(canvas => {
        if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
          canvas.width = backingWidth;
          canvas.height = backingHeight;
        }
      });
      raster.fillStyle = '#fff';
      raster.fillRect(0, 0, backingWidth, backingHeight);
      const imageWidth = macro.naturalWidth || 1536;
      const imageHeight = macro.naturalHeight || 1024;
      const portrait = imageHeight > imageWidth;
      const relative = portrait ? 0.6 : 0.45;
      const brainNode = portrait ? MACRO_NODE.tall : MACRO_NODE.wide;
      const node = [0, 1].map(axis => brainNode[axis] + (MICRO_FOCUS[axis] - MICRO_SOMA[axis]) * relative);
      const scaleMacro = Math.max(width / imageWidth, height / imageHeight);
      const start = [(width - imageWidth * scaleMacro) * (portrait ? 0.5 : 1) + node[0] * scaleMacro, node[1] * scaleMacro];
      // The synapse lands beside the wheel on wide screens and above it on
      // tall ones, so the names never sit on top of it.
      const landscape = width > height * 1.1;
      const side = width / 2 - Math.min(248, (width - 40) / 2);
      const above = height / 2 - Math.round(clamp(height * 0.086, 60, 84)) / 2 - 66;
      const closest = landscape ? clamp(side / 0.95, 0.35 * height, 0.62 * height) : Math.max(60, Math.min(0.62 * width, above / 1.35));
      const finish = landscape ? [width - side / 2, height * 0.5] : [width * 0.5, 66 + closest * 0.7];
      const scaleMicro = scaleMacro * relative;
      const scaleVector = scaleMicro * Math.hypot(MICRO_SOMA[0] - MICRO_FOCUS[0], MICRO_SOMA[1] - MICRO_FOCUS[1]) / Math.hypot(SOMA[0], SOMA[1]);
      const deepest = Math.log(closest / scaleVector);
      const [mw, mh] = [1536, 1024];
      const cover = Math.max(
        start[0] / (MICRO_FOCUS[0] * scaleMicro),
        start[1] / (MICRO_FOCUS[1] * scaleMicro),
        (width - start[0]) / ((mw - MICRO_FOCUS[0]) * scaleMicro),
        (height - start[1]) / ((mh - MICRO_FOCUS[1]) * scaleMicro),
      );
      const covered = Math.log(cover * 1.12);
      const blurStart = Math.max(Math.log(2.1 / scaleMicro), covered + 0.2);
      camera = {
        imageWidth,
        imageHeight,
        node,
        start,
        finish,
        scaleMacro,
        scaleMicro,
        scaleVector,
        inkMacro: portrait ? 0.6 : 0.74,
        inkMicro: portrait ? 0.5 : 0.58,
        macroOut: [covered - 0.3, covered + 0.05],
        microIn: [covered - 0.85, covered - 0.25],
        microOut: [blurStart, blurStart + 1.5],
        vectorIn: [blurStart - 0.5, blurStart + 0.05],
        drift: [0.4, deepest * 0.55],
      };
      api.depth = deepest;
      lastDepth = NaN;
      rasterBlank = false;
      vectorBlank = false;
      if (!world && !reduced.matches) idle(() => {
        world = buildWorld();
        lastDepth = NaN;
        schedule();
      });
      if (!micro && !reduced.matches) loadMicro();
    }

    function idle(callback) {
      if (window.requestIdleCallback) window.requestIdleCallback(callback, { timeout: 900 });
      else setTimeout(callback, 120);
    }

    function loadMicro() {
      micro = false;
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        // Fade the drawing's borders into paper so it blooms inside the brain.
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const edge = Math.round(Math.min(canvas.width, canvas.height) * 0.07);
        const sides = [[0, 0, edge, 0], [canvas.width, 0, canvas.width - edge, 0], [0, 0, 0, edge], [0, canvas.height, 0, canvas.height - edge]];
        sides.forEach(([x0, y0, x1, y1]) => {
          const gradient = context.createLinearGradient(x0, y0, x1, y1);
          gradient.addColorStop(0, 'rgba(255,255,255,1)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, canvas.height);
        });
        micro = canvas;
        lastDepth = NaN;
        schedule();
      };
      image.onerror = () => { micro = false; };
      image.src = MICRO_SOURCE;
    }

    function draw(depth) {
      if (!camera) return;
      if (Math.abs(depth - lastDepth) < 1e-4) return;
      lastDepth = depth;
      const zoom = Math.exp(depth);
      const travelled = smooth(camera.drift[0], camera.drift[1], depth);
      const cx = camera.start[0] + (camera.finish[0] - camera.start[0]) * travelled;
      const cy = camera.start[1] + (camera.finish[1] - camera.start[1]) * travelled;

      const macroAlpha = camera.inkMacro * (1 - smooth(camera.macroOut[0], camera.macroOut[1], depth));
      const microAlpha = micro ? camera.inkMicro * smooth(camera.microIn[0], camera.microIn[1], depth) * (1 - smooth(camera.microOut[0], camera.microOut[1], depth)) : 0;
      const blank = macroAlpha < 0.002 && microAlpha < 0.002;
      if (!blank || !rasterBlank) {
        raster.setTransform(1, 0, 0, 1, 0, 0);
        raster.globalCompositeOperation = 'source-over';
        raster.globalAlpha = 1;
        raster.fillStyle = '#fff';
        raster.fillRect(0, 0, rasterCanvas.width, rasterCanvas.height);
        raster.imageSmoothingEnabled = true;
        raster.imageSmoothingQuality = 'high';
        if (macroAlpha >= 0.002 && macro.complete && macro.naturalWidth) {
          const scale = camera.scaleMacro * zoom * ratio;
          raster.globalAlpha = macroAlpha;
          raster.drawImage(macro, ratio * cx - camera.node[0] * scale, ratio * cy - camera.node[1] * scale, macro.naturalWidth * scale, macro.naturalHeight * scale);
        }
        if (microAlpha >= 0.002) {
          const scale = camera.scaleMicro * zoom * ratio;
          raster.globalCompositeOperation = 'multiply';
          raster.globalAlpha = microAlpha;
          raster.drawImage(micro, ratio * cx - MICRO_FOCUS[0] * scale, ratio * cy - MICRO_FOCUS[1] * scale, micro.width * scale, micro.height * scale);
          raster.globalCompositeOperation = 'source-over';
        }
        raster.globalAlpha = 1;
        rasterBlank = blank;
      }

      const vectorAlpha = world ? smooth(camera.vectorIn[0], camera.vectorIn[1], depth) : 0;
      vectorCanvas.style.opacity = vectorAlpha.toFixed(3);
      if (vectorAlpha > 0.002) {
        renderWorld(camera.scaleVector * zoom, cx, cy);
        vectorBlank = false;
      } else if (!vectorBlank) {
        vector.setTransform(1, 0, 0, 1, 0, 0);
        vector.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);
        vectorBlank = true;
      }
    }

    /* ----- vector world: neurons, spines and one synapse ----- */

    function renderWorld(scale, cx, cy) {
      const context = vector;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.clearRect(0, 0, vectorCanvas.width, vectorCanvas.height);
      const cos = Math.cos(TURN) * scale;
      const sin = Math.sin(TURN) * scale;
      context.setTransform(ratio * cos, ratio * sin, -ratio * sin, ratio * cos, ratio * cx, ratio * cy);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      // Visible area in world units: the rotated screen's bounding box.
      const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => {
        const dx = x - cx;
        const dy = y - cy;
        return [(dx * cos + dy * sin) / (scale * scale), (-dx * sin + dy * cos) / (scale * scale)];
      });
      const view = {
        x0: Math.min(...corners.map(c => c[0])),
        y0: Math.min(...corners.map(c => c[1])),
        x1: Math.max(...corners.map(c => c[0])),
        y1: Math.max(...corners.map(c => c[1])),
      };
      world.layers.forEach(layer => drawLayer(context, layer, scale, view));
      drawSynapse(context, scale, view);
    }

    const tone = (ink, amount) => {
      const mix = channel => Math.round(255 - (255 - channel) * clamp(amount, 0, 1));
      return `rgb(${mix(ink[0])},${mix(ink[1])},${mix(ink[2])})`;
    };
    const overlaps = (box, view) => !(box.x1 < view.x0 || box.x0 > view.x1 || box.y1 < view.y0 || box.y0 > view.y1);

    function paint(context, bucket, view, mode) {
      if (!overlaps(bucket.box, view)) return;
      const box = bucket.box;
      const viewArea = (view.x1 - view.x0) * (view.y1 - view.y0);
      const area = Math.max(1e-6, (box.x1 - box.x0) * (box.y1 - box.y0));
      if (bucket.cells.length < 3 || viewArea > area * 0.25) {
        if (mode === 'fill') context.fill(bucket.all);
        else context.stroke(bucket.all);
        return;
      }
      for (const cell of bucket.cells) {
        if (!overlaps(cell.box, view)) continue;
        if (mode === 'fill') context.fill(cell.path);
        else context.stroke(cell.path);
      }
    }

    // Layers with a focus range fade out once they grow past it, like a
    // shallow depth of field: only the dive's own structures stay sharp.
    const focus = (layer, size) => (layer.fade ? 1 - smooth(layer.fade[0], layer.fade[1], size) : 1);

    // Every tube is stroked dark, then its inside is painted over in a pale
    // tone once it is wider than a few pixels: thin processes stay pencil
    // lines, close ones become outlined forms. Joints fuse without seams.
    function drawLayer(context, layer, scale, view) {
      if (!overlaps(layer.box, view)) return;
      const pixel = 1 / scale;
      const inside = tone(layer.ink, BODY);
      for (const bucket of layer.tubes) {
        const size = bucket.size * scale;
        const sharp = focus(layer, size);
        if (size < 0.2 || sharp < 0.02) continue;
        context.globalAlpha = sharp;
        context.lineWidth = Math.max(bucket.size, 0.85 * pixel);
        context.strokeStyle = tone(layer.ink, Math.min(1, size / 0.85));
        paint(context, bucket, view, 'stroke');
      }
      for (const bucket of layer.tubes) {
        const size = bucket.size * scale;
        const sharp = focus(layer, size);
        if (size <= 3 || sharp < 0.02) continue;
        context.globalAlpha = sharp;
        context.lineWidth = (size - 2.1) * pixel;
        context.strokeStyle = tone(layer.ink, 1 - (1 - BODY) * smooth(3, 6, size));
        paint(context, bucket, view, 'stroke');
      }
      // A paler core gives wide processes their roundness.
      for (const bucket of layer.tubes) {
        const size = bucket.size * scale;
        const sharp = focus(layer, size) * smooth(10, 24, size);
        if (sharp < 0.02) continue;
        context.globalAlpha = sharp;
        context.lineWidth = bucket.size * 0.6;
        context.strokeStyle = tone(layer.ink, BODY * 0.6);
        paint(context, bucket, view, 'stroke');
      }
      for (const bucket of layer.blobs) {
        const size = bucket.size * scale;
        const sharp = focus(layer, size);
        if (size < 0.3 || sharp < 0.02) continue;
        context.globalAlpha = sharp;
        if (bucket.dot) {
          // Graphite dots stay dots; up close they dissolve.
          const amount = Math.min(1, size / 0.9) * (1 - smooth(2.5, 6, size));
          if (amount < 0.02) continue;
          context.fillStyle = tone(layer.ink, amount);
          paint(context, bucket, view, 'fill');
          continue;
        }
        const ring = smooth(1.8, 3.6, size);
        context.fillStyle = tone(layer.ink, Math.min(1, size / 0.9) * (1 - ring) + BODY * ring);
        paint(context, bucket, view, 'fill');
        if (ring > 0.01) {
          context.lineWidth = 1.05 * pixel;
          context.strokeStyle = tone(layer.ink, ring);
          paint(context, bucket, view, 'stroke');
        }
      }
      context.globalAlpha = 1;
      for (const shape of layer.shapes) {
        if (!overlaps(shape.box, view)) continue;
        const size = shape.size * scale;
        const ring = smooth(1.8, 3.6, size);
        context.fillStyle = ring > 0.5 ? inside : tone(layer.ink, 1 - ring * (1 - BODY));
        context.fill(shape.fill);
        if (ring > 0.01) {
          context.lineWidth = 1.05 * pixel;
          context.strokeStyle = tone(layer.ink, ring);
          context.stroke(shape.stroke);
        }
      }
    }

    function drawSynapse(context, scale, view) {
      const synapse = world.synapse;
      if (!overlaps(synapse.box, view)) return;
      const detail = smooth(26, 95, scale);
      if (detail <= 0) return;
      const pixel = 1 / scale;
      const ink = tone(synapse.ink, 1);
      const soft = tone(synapse.ink, 0.62);
      context.globalAlpha = detail;
      context.lineWidth = pixel;
      context.strokeStyle = ink;
      context.fillStyle = PAPER;
      context.fill(synapse.mito);
      context.stroke(synapse.mito);
      context.fill(synapse.vesicles);
      context.stroke(synapse.vesicles);
      context.stroke(synapse.fusion);
      context.stroke(synapse.psd);
      context.strokeStyle = soft;
      context.lineWidth = 0.85 * pixel;
      context.stroke(synapse.cristae);
      context.stroke(synapse.receptors);
      context.stroke(synapse.apparatus);
      context.fillStyle = soft;
      context.fill(synapse.projections);
      context.fill(synapse.transmitters);
      const near = smooth(150, 340, scale);
      if (near > 0) {
        context.globalAlpha = detail * near * 0.6;
        context.fill(synapse.cores);
        context.globalAlpha = detail * near * 0.55;
        context.lineWidth = 0.8 * pixel;
        context.stroke(synapse.membranes);
        context.stroke(synapse.hatch);
        context.globalAlpha = detail * near * 0.6;
        context.fill(synapse.stipple);
      }
      context.globalAlpha = 1;
    }

    function buildWorld() {
      const random = seeded(20261007);
      const far = sheet([182, 182, 177], [7, 18]);
      const fibers = sheet([174, 174, 169], [4, 13]);
      const neuron = sheet([124, 124, 119]);
      const contact = sheet([108, 108, 104]);
      const clear = (points, keep) => {
        for (let index = 0; index < points.length; index += 2) {
          if (Math.hypot(points[index], points[index + 1]) < keep) return false;
        }
        return true;
      };

      const grow = (target, x, y, angle, length, size, depth, options) => {
        const steps = Math.max(3, Math.round(length / options.step));
        const bend = (random() - 0.5) * 0.06;
        const points = [x, y];
        for (let index = 0; index < steps; index += 1) {
          angle += bend + (random() - 0.5) * 0.24;
          x += Math.cos(angle) * length / steps;
          y += Math.sin(angle) * length / steps;
          points.push(x, y);
        }
        if (!clear(points, 1.7)) return;
        target.tube(points, size, options.spines);
        if (size < 1.1) {
          for (let index = 2; index < points.length - 2; index += 2) {
            if (random() < 0.4) target.dot(points[index] + (random() - 0.5) * 0.4, points[index + 1] + (random() - 0.5) * 0.4, 0.1 + random() * 0.05);
          }
        }
        const next = size * 0.72;
        if (depth >= options.depth || next < 0.3) {
          target.dot(x, y, 0.15 + random() * 0.07);
          return;
        }
        const forks = random() < 0.2 ? 3 : 2;
        for (let fork = 0; fork < forks; fork += 1) {
          const spread = forks === 2 ? (fork ? 1 : -1) * (0.28 + random() * 0.3) : (fork - 1) * (0.42 + random() * 0.2);
          grow(target, x, y, angle + spread, length * (0.66 + random() * 0.22), next, depth + 1, options);
        }
      };

      const cell = (target, x, y, size, options) => {
        target.blob(x, y, size, size * 0.84, random() * Math.PI);
        target.blob(x + size * 0.1, y - size * 0.05, size * 0.36, size * 0.33, 0);
        target.blob(x + size * 0.16, y - size * 0.1, size * 0.1, size * 0.1, 0);
        const turn = random() * TAU;
        const skip = options.skip === undefined ? -1 : options.skip;
        for (let index = 0; index < options.primaries; index += 1) {
          const angle = options.angles ? options.angles[index] : turn + index * TAU / options.primaries + (random() - 0.5) * 0.5;
          if (index === skip) continue;
          grow(target, x + Math.cos(angle) * size * 0.6, y + Math.sin(angle) * size * 0.6, angle, options.length * (0.7 + random() * 0.6), options.size * (0.8 + random() * 0.4), 0, options);
        }
        const axon = options.axon === undefined ? random() * TAU : options.axon;
        grow(target, x + Math.cos(axon) * size * 0.6, y + Math.sin(axon) * size * 0.6, axon, options.length * 2.6, 0.42, options.depth - 1, { ...options, spines: false, step: 4 });
      };

      // Neighbouring neurons, lighter, so depth reads from tone alone.
      [[-150, -95, 7], [-100, 128, 6.5], [168, -125, 7.5], [182, 108, 6], [-238, 18, 6], [60, -205, 6.5], [30, 196, 6]]
        .forEach(([x, y, size]) => cell(far, x, y, size, { primaries: 6, length: 40, size: 1.45, depth: 4, step: 3.2, spines: false }));

      // Neuropil: fine meandering fibres near the synapse, never through it.
      for (let index = 0; index < 18; index += 1) {
        const angle = random() * Math.PI;
        const distance = (random() < 0.5 ? -1 : 1) * (1.8 + Math.pow(random(), 1.6) * 36);
        const direction = [Math.cos(angle), Math.sin(angle)];
        const normal = [-direction[1], direction[0]];
        const waves = [[1.5 + random() * 3, 18 + random() * 22, random() * TAU], [0.4 + random() * 0.8, 5 + random() * 6, random() * TAU], [0.08 + random() * 0.12, 1.2 + random() * 1.4, random() * TAU]];
        const span = 80 + random() * 110;
        const points = [];
        for (let t = -span; t <= span; t += Math.abs(t) < 14 ? 0.25 : 2.5) {
          const lateral = distance + waves.reduce((sum, [amplitude, length, phase]) => sum + amplitude * Math.sin(t / length + phase), 0);
          points.push(direction[0] * t + normal[0] * lateral, direction[1] * t + normal[1] * lateral);
        }
        if (!clear(points, 1.5)) continue;
        const size = 0.06 + random() * 0.05;
        fibers.tube(points, size, false);
        for (let point = 0; point < points.length; point += 2) {
          if (random() < 0.03 && Math.hypot(points[point], points[point + 1]) > 2.4) fibers.blob(points[point], points[point + 1], size * 1.7, size * 1.25, random() * Math.PI);
        }
      }

      // The neuron whose dendrite carries the synapse.
      const dendrite = spline([[31.5, -0.6], [24, 0.2], [16, 0.95], [8, 1.55], [0, 1.9], [-8, 2.2], [-17, 2.9], [-27, 4.1], [-36, 5.7]], 0.35);
      const split = dendrite.findIndex((value, index) => index % 2 === 0 && value < 14);
      neuron.tube(dendrite.slice(0, split + 2), 1.45, true);
      neuron.tube(dendrite.slice(split), 1, true);
      const options = { primaries: 7, length: 34, size: 1.3, depth: 5, step: 2.2, spines: true, skip: 3, axon: 0.95,
        angles: [-2.25, -1.35, -0.45, Math.PI, 0.45, 1.35, 2.35] };
      cell(neuron, SOMA[0], SOMA[1], 8.5, options);
      grow(neuron, 18, 0.7, -2.3, 30, 0.8, 2, options);
      grow(neuron, -12, 2.55, 2.45, 28, 0.74, 2, options);
      grow(neuron, -36, 5.7, 2.8, 26, 0.74, 2, options);
      grow(neuron, -36, 5.7, 3.5, 24, 0.7, 2, options);

      // Dendritic spines close to the synapse.
      neuron.tubes.slice().forEach(({ points, size, spines }) => {
        if (!spines || size < 0.5) return;
        let walked = 0;
        let next = 0.5;
        for (let index = 2; index < points.length; index += 2) {
          const x0 = points[index - 2];
          const y0 = points[index - 1];
          const dx = points[index] - x0;
          const dy = points[index + 1] - y0;
          const length = Math.hypot(dx, dy);
          while (walked + length >= next) {
            const t = (next - walked) / length;
            const x = x0 + dx * t;
            const y = y0 + dy * t;
            next += 1 + random() * 0.8;
            if (Math.hypot(x, y) > 70) continue;
            const side = random() < 0.5 ? -1 : 1;
            const angle = Math.atan2(dy, dx) + side * (Math.PI / 2 + (random() - 0.5) * 1.1);
            const form = random(); // mushroom, thin or stubby
            const reach = form < 0.6 ? 0.7 + random() * 0.5 : form < 0.85 ? 0.9 + random() * 0.6 : 0.35 + random() * 0.15;
            const knob = form < 0.6 ? 0.14 + random() * 0.07 : form < 0.85 ? 0.08 + random() * 0.03 : 0.14 + random() * 0.05;
            const ux = Math.cos(angle);
            const uy = Math.sin(angle);
            const bx = x + ux * (size * 0.5 - 0.12);
            const by = y + uy * (size * 0.5 - 0.12);
            const ex = bx + ux * (reach + 0.12);
            const ey = by + uy * (reach + 0.12);
            const hx = ex + ux * knob * 0.7;
            const hy = ey + uy * knob * 0.7;
            if (Math.hypot(hx, hy) < 1.3 || Math.hypot((bx + ex) / 2, (by + ey) / 2) < 1) continue;
            const wobble = (random() - 0.5) * 0.3;
            neuron.tube([bx, by, (bx + ex) / 2 - uy * wobble, (by + ey) / 2 + ux * wobble, ex, ey], 0.07 + random() * 0.035, false);
            neuron.blob(hx, hy, knob, knob * (0.78 + random() * 0.12), angle);
          }
          walked += length;
        }
      });

      // The synapse: a mushroom spine below, a terminal bouton above.
      neuron.tube([0.02, 1.5, 0.05, 1.2, 0.03, 0.9, 0, 0.62, -0.01, 0.5], 0.13, false);
      neuron.shape(spineHead(), spineHead(true), 0.3);
      neuron.tube([0.95, 1.45, 1.02, 1.12, 1.12, 0.86], 0.09, false);
      neuron.blob(1.2, 0.74, 0.14, 0.12, -1.2);
      const axon = spline([[-52, -40], [-41, -36.5], [-30, -22], [-21, -17.5], [-13, -9], [-7.5, -6.2], [-4, -2.6], [-1.6, -1.6], [-0.45, -0.85], [-0.12, -0.58]], 0.3);
      contact.tube(axon, 0.17, false);
      for (let index = 0; index < axon.length - 12; index += 2 * (10 + Math.floor(random() * 14))) {
        if (Math.hypot(axon[index], axon[index + 1]) > 3) contact.blob(axon[index], axon[index + 1], 0.21, 0.15, Math.atan2(axon[index + 3] - axon[index + 1], axon[index + 2] - axon[index]));
      }
      contact.shape(bouton(), bouton(true), 0.3);
      const passing = spline([[30, -24], [8, -5.2], [2.4, -1.5], [1.05, -0.62], [0.82, 0.3], [1.15, 1.25], [3.6, 5.5], [14, 26]], 0.2);
      contact.tube(passing, 0.085, false);
      contact.blob(1.05, -0.62, 0.12, 0.085, -1.4);

      return { layers: [far, fibers, neuron, contact].map(finishLayer), synapse: buildSynapse(random) };
    }

    // Closed outline for filling; the open variant leaves the joint to the
    // neck or axon unstroked, so the tube flows into the shape.
    function spineHead(outline = false) {
      const path = new Path2D();
      path.moveTo(-0.065, 0.56);
      path.bezierCurveTo(-0.09, 0.5, -0.17, 0.47, -0.24, 0.38);
      path.bezierCurveTo(-0.33, 0.26, -0.31, 0.07, -0.2, 0.05);
      path.quadraticCurveTo(0, 0.035, 0.2, 0.05);
      path.bezierCurveTo(0.31, 0.07, 0.33, 0.26, 0.24, 0.38);
      path.bezierCurveTo(0.17, 0.47, 0.09, 0.5, 0.065, 0.56);
      if (!outline) path.closePath();
      return path;
    }

    function bouton(outline = false) {
      const path = new Path2D();
      path.moveTo(-0.04, -0.64);
      path.bezierCurveTo(0.06, -0.655, 0.22, -0.6, 0.3, -0.47);
      path.bezierCurveTo(0.38, -0.33, 0.36, -0.07, 0.24, -0.05);
      path.quadraticCurveTo(0, -0.035, -0.24, -0.05);
      path.bezierCurveTo(-0.36, -0.15, -0.33, -0.45, -0.2, -0.55);
      if (!outline) path.closePath();
      return path;
    }

    function buildSynapse(random) {
      const ink = [98, 98, 94];
      const vesicles = new Path2D();
      const cores = new Path2D();
      const placed = [];
      const circle = (path, x, y, r) => {
        path.moveTo(x + r, y);
        path.arc(x, y, r, 0, TAU);
      };
      const mito = { x: -0.1, y: -0.47, rx: 0.12, ry: 0.048, turn: -0.35 };
      const insideMito = (x, y, margin) => {
        const c = Math.cos(-mito.turn);
        const s = Math.sin(-mito.turn);
        const lx = (x - mito.x) * c - (y - mito.y) * s;
        const ly = (x - mito.x) * s + (y - mito.y) * c;
        return (lx / (mito.rx + margin)) ** 2 + (ly / (mito.ry + margin)) ** 2 < 1;
      };
      const add = (x, y, r) => {
        placed.push({ x, y, r });
        circle(vesicles, x, y, r);
        circle(cores, x, y, r * 0.16);
      };
      [-0.16, -0.085, 0.11, 0.18].forEach(x => add(x, -0.074, 0.022));
      let guard = 0;
      while (placed.length < 42 && guard < 6000) {
        guard += 1;
        const x = -0.27 + random() * 0.56;
        const y = -0.6 + random() * 0.5;
        if (((x - 0.03) / 0.27) ** 2 + ((y + 0.32) / 0.25) ** 2 > 1 || y > -0.1) continue;
        if (random() > 0.2 + 0.8 * clamp((y + 0.55) / 0.42, 0, 1)) continue;
        const r = 0.02 + random() * 0.007;
        if (insideMito(x, y, r + 0.01)) continue;
        if (placed.some(other => Math.hypot(other.x - x, other.y - y) < other.r + r + 0.008)) continue;
        add(x, y, r);
      }

      // A vesicle fusing with the membrane, releasing transmitter.
      const fusion = new Path2D();
      fusion.arc(0.03, -0.068, 0.024, Math.PI / 2 + 0.6, Math.PI / 2 - 0.6 + TAU);
      const transmitters = new Path2D();
      for (let index = 0; index < 26; index += 1) {
        const x = 0.03 + (random() - 0.5) * 0.24 * (0.4 + random());
        const y = -0.04 + random() * 0.08;
        const r = 0.0028 + random() * 0.0016;
        transmitters.moveTo(x + r, y);
        transmitters.arc(x, y, r, 0, TAU);
      }

      const mitoPath = new Path2D();
      mitoPath.ellipse(mito.x, mito.y, mito.rx, mito.ry, mito.turn, 0, TAU);
      mitoPath.moveTo(mito.x + (mito.rx - 0.012) * Math.cos(mito.turn), mito.y + (mito.rx - 0.012) * Math.sin(mito.turn));
      mitoPath.ellipse(mito.x, mito.y, mito.rx - 0.012, mito.ry - 0.012, mito.turn, 0, TAU);
      const cristae = new Path2D();
      for (let index = -3; index <= 3; index += 1) {
        const along = index * 0.03;
        const c = Math.cos(mito.turn);
        const s = Math.sin(mito.turn);
        const px = mito.x + along * c;
        const py = mito.y + along * s;
        const reach = (mito.ry - 0.014) * Math.sqrt(1 - (along / mito.rx) ** 2);
        const side = index % 2 ? 1 : -1;
        cristae.moveTo(px - s * reach * side, py + c * reach * side);
        cristae.quadraticCurveTo(px + c * 0.012, py + s * 0.012, px + s * reach * side * 0.15, py - c * reach * side * 0.15);
      }

      // Postsynaptic density: a hatched band under the cleft.
      const surface = x => 0.05 - 0.015 * (1 - (x / 0.2) ** 2);
      const psd = new Path2D();
      const hatch = new Path2D();
      const receptors = new Path2D();
      psd.moveTo(-0.19, surface(-0.19));
      for (let x = -0.19; x <= 0.19; x += 0.01) psd.lineTo(x, surface(x) + 0.004);
      for (let x = 0.19; x >= -0.19; x -= 0.01) psd.lineTo(x, surface(x) + 0.032);
      psd.closePath();
      for (let x = -0.18; x <= 0.18; x += 0.011) {
        hatch.moveTo(x, surface(x) + 0.006);
        hatch.lineTo(x + 0.006, surface(x) + 0.03);
      }
      for (let x = -0.16; x <= 0.165; x += 0.036) {
        const y = surface(x);
        receptors.moveTo(x, y);
        receptors.lineTo(x, y - 0.018);
        receptors.moveTo(x - 0.007, y - 0.027);
        receptors.lineTo(x, y - 0.018);
        receptors.lineTo(x + 0.007, y - 0.027);
      }
      const projections = new Path2D();
      [-0.2, -0.12, -0.045, 0.075, 0.145, 0.21].forEach(x => {
        projections.moveTo(x - 0.008, -0.044);
        projections.quadraticCurveTo(x, -0.066, x + 0.008, -0.044);
        projections.closePath();
      });
      const apparatus = new Path2D();
      [0.4, 0.43, 0.46].forEach((y, index) => {
        apparatus.moveTo(-0.05 + index * 0.006, y);
        apparatus.quadraticCurveTo(0, y - 0.018, 0.05 - index * 0.006, y);
      });

      // Second membrane line: lipid bilayers show at close range.
      const membranes = new Path2D();
      const inner = (shape, cx, cy, factor) => {
        const matrix = new DOMMatrix().translate(cx, cy).scale(factor).translate(-cx, -cy);
        membranes.addPath(shape, matrix);
      };
      inner(bouton(true), 0.02, -0.34, 0.965);
      inner(spineHead(true), 0, 0.3, 0.955);

      const stipple = new Path2D();
      const dot = (x, y) => {
        stipple.moveTo(x + 0.0017, y);
        stipple.arc(x, y, 0.0017, 0, TAU);
      };
      for (let index = 0; index < 900; index += 1) {
        const angle = random() * TAU;
        const reach = Math.sqrt(random());
        const shade = 0.55 + 0.45 * reach;
        if (random() > shade) continue;
        if (index % 2) dot(0.02 + Math.cos(angle) * reach * 0.31, -0.33 + Math.sin(angle) * reach * 0.27);
        else dot(Math.cos(angle) * reach * 0.27, 0.27 + Math.sin(angle) * reach * 0.2);
      }

      return {
        ink,
        box: { x0: -0.45, y0: -0.75, x1: 0.45, y1: 0.65 },
        vesicles, cores, fusion, transmitters, mito: mitoPath, cristae, psd, hatch, receptors, projections, apparatus, membranes, stipple,
      };
    }

    function sheet(ink, fade = null) {
      return {
        ink,
        fade,
        tubes: [],
        blobs: [],
        shapes: [],
        tube(points, size, spines) { this.tubes.push({ points, size, spines }); },
        blob(x, y, rx, ry = rx, turn = 0) { this.blobs.push({ x, y, rx, ry, turn, dot: false }); },
        dot(x, y, r) { this.blobs.push({ x, y, rx: r, ry: r, turn: 0, dot: true }); },
        shape(fill, stroke, size) {
          this.shapes.push({ fill, stroke, size, box: { x0: -0.45, y0: -0.75, x1: 0.45, y1: 0.65 } });
        },
      };
    }

    // Bucket paths by width and space so each frame strokes only what shows.
    function finishLayer(source) {
      const GRID = 16;
      const empty = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
      const extend = (box, x, y, pad) => {
        box.x0 = Math.min(box.x0, x - pad);
        box.y0 = Math.min(box.y0, y - pad);
        box.x1 = Math.max(box.x1, x + pad);
        box.y1 = Math.max(box.y1, y + pad);
      };
      const bucketFor = (map, size, dot = false) => {
        const level = Math.round(Math.log(size) / Math.log(1.16));
        const key = `${dot ? 'd' : 'b'}${level}`;
        if (!map.has(key)) map.set(key, { size: Math.pow(1.16, level), dot, all: new Path2D(), cells: new Map(), box: empty() });
        return map.get(key);
      };
      const cellFor = (bucket, x, y) => {
        const key = `${Math.floor(x / GRID)},${Math.floor(y / GRID)}`;
        if (!bucket.cells.has(key)) bucket.cells.set(key, { key, path: new Path2D(), box: empty() });
        return bucket.cells.get(key);
      };
      const box = empty();
      const tubes = new Map();
      source.tubes.forEach(({ points, size }) => {
        const bucket = bucketFor(tubes, size);
        const pad = bucket.size;
        bucket.all.moveTo(points[0], points[1]);
        let current = null;
        for (let index = 2; index < points.length; index += 2) {
          const x0 = points[index - 2];
          const y0 = points[index - 1];
          const x1 = points[index];
          const y1 = points[index + 1];
          bucket.all.lineTo(x1, y1);
          const cell = cellFor(bucket, x0, y0);
          if (cell !== current) {
            cell.path.moveTo(x0, y0);
            current = cell;
          }
          cell.path.lineTo(x1, y1);
          extend(cell.box, x0, y0, pad);
          extend(cell.box, x1, y1, pad);
          extend(bucket.box, x0, y0, pad);
          extend(bucket.box, x1, y1, pad);
        }
        extend(box, bucket.box.x0, bucket.box.y0, 0);
        extend(box, bucket.box.x1, bucket.box.y1, 0);
      });
      const blobs = new Map();
      source.blobs.forEach(({ x, y, rx, ry, turn, dot }) => {
        const bucket = bucketFor(blobs, Math.max(rx, ry), dot);
        const cell = cellFor(bucket, x, y);
        const sx = x + rx * Math.cos(turn);
        const sy = y + rx * Math.sin(turn);
        [bucket.all, cell.path].forEach(path => {
          path.moveTo(sx, sy);
          path.ellipse(x, y, rx, ry, turn, 0, TAU);
        });
        const pad = Math.max(rx, ry);
        extend(cell.box, x, y, pad);
        extend(bucket.box, x, y, pad);
        extend(box, x, y, pad);
      });
      source.shapes.forEach(shape => {
        extend(box, shape.box.x0, shape.box.y0, 0);
        extend(box, shape.box.x1, shape.box.y1, 0);
      });
      const order = (map, direction) => Array.from(map.values())
        .sort((a, b) => (a.size - b.size) * direction)
        .map(bucket => ({ ...bucket, cells: Array.from(bucket.cells.values()) }));
      return { ink: source.ink, fade: source.fade, box, tubes: order(tubes, 1), blobs: order(blobs, -1), shapes: source.shapes };
    }

    function spline(control, spacing) {
      const points = [];
      for (let index = 0; index < control.length - 1; index += 1) {
        const p0 = control[Math.max(0, index - 1)];
        const p1 = control[index];
        const p2 = control[index + 1];
        const p3 = control[Math.min(control.length - 1, index + 2)];
        const parts = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
        for (let part = 0; part < parts; part += 1) {
          const t = part / parts;
          const t2 = t * t;
          const t3 = t2 * t;
          const at = axis => 0.5 * ((2 * p1[axis]) + (-p0[axis] + p2[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3);
          points.push(at(0), at(1));
        }
      }
      const last = control[control.length - 1];
      points.push(last[0], last[1]);
      return points;
    }

    function seeded(seed) {
      let state = seed >>> 0;
      return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    return api;
  }
})();
