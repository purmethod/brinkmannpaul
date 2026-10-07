(() => {
  'use strict';

  // Picker wheel over a scroll-driven dive into the brain drawing.
  // Turning the wheel zooms slowly from the approved brain drawing through the
  // approved microstructure into a cubic millimetre of cortex and on into a
  // universe of neurons that streams past like stars, until the next brain
  // appears in the distance: the dive never turns back. Everything is drawn
  // in graphite on white. Without JavaScript the plain project list remains.

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
  const TAU = Math.PI * 2;
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
    const body = make('div', 'bs-reader-content');
    if (item.content) body.append(item.content);
    block.append(head, body);
    return { block, head, title };
  });
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

  // Depth only grows while the wheel turns on, and the dive carries on into
  // the next brain without a seam.
  function depthAt(rowsTurned) {
    return rowsTurned * dive.pace;
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
    eased = reduced.matches ? travel : eased + (travel - eased) * (1 - Math.exp(-elapsed / 280));
    if (Math.abs(travel - eased) < 0.0005) eased = travel;
    // The universe never stands quite still: it floats on by itself, except
    // while a text is read or motion is reduced.
    const floating = reading < 0 && !reduced.matches;
    if (floating) drift += elapsed * DRIFT;
    dive.draw(depthAt(eased) + drift);
    if (pos !== lastPosition) {
      layoutWheel(pos);
      lastPosition = pos;
    }
    if (eased !== travel || floating) schedule();
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

  reader.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  closer.addEventListener('click', () => close());
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

  measure();
  openFromHash();
  schedule();

  /* =================================================================== */

  function createDive(host, macro) {
    const canvas = make('canvas', 'bs-canvas');
    host.append(canvas);
    const context = canvas.getContext('2d', { alpha: false });

    // The way in, each drawing nested at the focus point of the one before:
    // the approved brain and microstructure, the inside of one cubic
    // millimetre of cortex (after the H01 reconstruction, Harvard and Google)
    // and its network drawn as a cosmos whose stars are neurons.
    const MICRO_FOCUS = [1000, 506];
    const MICRO_SOMA = [1108, 462];
    const MACRO_NODE = { wide: [1050, 284], tall: [563, 412] };
    const CHAIN = [
      { name: 'micro', src: 'assets/neuroscience-microstructure.webp', focus: MICRO_FOCUS, size: [1536, 1024] },
      { name: 'inside', src: 'assets/neuro-inside.webp', focus: [975, 959], size: [1920, 1920], scale: 1 / Math.E, enter: 0.3, ink: 0.8 },
      { name: 'cosmos', src: 'assets/neuro-cosmos.webp', focus: [964, 947], size: [1920, 1920], scale: Math.exp(-0.8), enter: 0.3, ink: 0.85 },
    ];
    // Then the flight: neurons cut from the drawings stream out of the
    // distance like stars, galaxies of neurons pass now and then, fine dust
    // drifts between, and at the end the next brain waits in the distance.
    const stars = { src: 'assets/neuro-stars.webp', plain: true, mips: true, state: 'idle', image: null };
    const galaxy = { src: 'assets/neuro-galaxy.webp', mips: true, state: 'idle', image: null };
    const TILE = 400; // one neuron in the star sheet, 4 x 4 of them
    const GALAXY = { radius: 600, centre: [964, 967] };
    const FLIGHT = 5; // depth of open universe before the next brain
    const SPIN = 0.22; // radians the stream turns per depth unit

    const api = { pace: 0.14, cycle: 12, resize, draw };
    const chain = CHAIN.map(level => ({ ...level, image: null, state: 'idle' }));
    let width = 0;
    let height = 0;
    let ratio = 1;
    let camera = null;
    let lastDepth = NaN;

    function soften(image) {
      // Fade each drawing's border to paper, so a smaller drawing blooms
      // inside the larger one instead of showing an edge.
      const sheet = document.createElement('canvas');
      sheet.width = image.naturalWidth;
      sheet.height = image.naturalHeight;
      const pen = sheet.getContext('2d');
      pen.drawImage(image, 0, 0);
      const edge = Math.round(Math.min(sheet.width, sheet.height) * 0.07);
      [[0, 0, edge, 0], [sheet.width, 0, sheet.width - edge, 0], [0, 0, 0, edge], [0, sheet.height, 0, sheet.height - edge]]
        .forEach(([x0, y0, x1, y1]) => {
          const gradient = pen.createLinearGradient(x0, y0, x1, y1);
          gradient.addColorStop(0, 'rgba(255,255,255,1)');
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          pen.fillStyle = gradient;
          pen.fillRect(0, 0, sheet.width, sheet.height);
        });
      return sheet;
    }

    // The same sheet at half, quarter and eighth size: small things are drawn
    // from small copies, which keeps them sharp and cheap.
    function halves(image) {
      const copies = [image];
      for (let level = 1; level < 4; level += 1) {
        const last = copies[level - 1];
        const copy = document.createElement('canvas');
        copy.width = Math.round(last.width / 2);
        copy.height = Math.round(last.height / 2);
        const pen = copy.getContext('2d');
        pen.imageSmoothingQuality = 'high';
        pen.drawImage(last, 0, 0, copy.width, copy.height);
        copies.push(copy);
      }
      return copies;
    }

    // The copy whose pixels come closest to the screen without falling short.
    function pick(copies, scale) {
      let level = 0;
      while (level < copies.length - 1 && scale * 2 ** (level + 1) <= 1) level += 1;
      return level;
    }

    function load(level) {
      if (level.state !== 'idle') return;
      level.state = 'loading';
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        level.image = level.plain ? image : soften(image);
        if (level.mips) level.mips = halves(level.image);
        level.state = 'ready';
        lastDepth = NaN;
        schedule();
      };
      image.onerror = () => { level.state = 'failed'; };
      image.src = level.src;
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
      const node = [0, 1].map(axis => brainNode[axis] + (MICRO_FOCUS[axis] - MICRO_SOMA[axis]) * relative);
      const scaleBrain = Math.max(width / imageWidth, height / imageHeight);
      const start = [(width - imageWidth * scaleBrain) * (portrait ? 0.5 : 1) + node[0] * scaleBrain, node[1] * scaleBrain];
      // The universe streams out of a point beside the wheel on wide screens
      // and above it on tall ones.
      const landscape = width > height * 1.1;
      const side = width / 2 - Math.min(248, (width - 40) / 2);
      const finish = landscape ? [width - side / 2, height * 0.5] : [width * 0.5, height * 0.3];

      // Scales: screen pixels per drawing pixel before any zoom.
      const [micro, inside, cosmos] = chain;
      micro.k = scaleBrain * relative;
      inside.k = micro.k * inside.scale;
      cosmos.k = inside.k * cosmos.scale;
      // The microstructure takes over once it covers the screen.
      const reach = Math.max(
        start[0] / (micro.focus[0] * micro.k),
        start[1] / (micro.focus[1] * micro.k),
        (width - start[0]) / ((micro.size[0] - micro.focus[0]) * micro.k),
        (height - start[1]) / ((micro.size[1] - micro.focus[1]) * micro.k),
      );
      micro.handover = Math.log(reach * 1.12);
      inside.handover = Math.log(1 / inside.k) - inside.enter;
      cosmos.handover = Math.log(1 / cosmos.k) - cosmos.enter;
      // The open universe begins where the cosmos drawing is at full size and
      // still sharp; after the flight the next brain grows out of the distance
      // until the dive begins again.
      const opening = cosmos.handover + cosmos.enter;
      const cycle = opening + FLIGHT + 1.6;
      camera = {
        node, start, finish, scaleBrain,
        ink: portrait ? 0.6 : 0.74,
        inkMicro: portrait ? 0.5 : 0.58,
        out: [0.4, opening],
        back: [cycle - 3.2, cycle - 1.6],
        span: Math.hypot(width, height) / 2,
      };
      api.open = opening;
      api.cycle = cycle;
      lastDepth = NaN;
      load(micro);
    }

    function spread(image, focus, scale, cx, cy) {
      const s = scale * ratio;
      return [ratio * cx - focus[0] * s, ratio * cy - focus[1] * s, image.width * s, image.height * s];
    }

    function draw(travelled) {
      if (!camera) return;
      const depth = mod(travelled, api.cycle);
      // Floating alone moves the picture by a fraction of a pixel per frame;
      // about two dozen redraws a second keep it smooth and spare the battery.
      if (Math.abs(depth - lastDepth) < 4e-4) return;
      lastDepth = depth;
      // Fetch each drawing a little before the dive reaches it.
      chain.forEach(level => { if (depth > level.handover - 1.4) load(level); });
      if (depth > api.open - 1.4) {
        load(stars);
        load(galaxy);
      }
      // The view drifts from the brain to beside the wheel and, on the way to
      // the next brain, back again.
      const away = smooth(camera.out[0], camera.out[1], depth) * (1 - smooth(camera.back[0], camera.back[1], depth));
      const cx = camera.start[0] + (camera.finish[0] - camera.start[0]) * away;
      const cy = camera.start[1] + (camera.finish[1] - camera.start[1]) * away;
      // A drawing that has not arrived yet leaves the previous one in place.
      const ready = chain.map(level => level.state === 'ready');

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.globalCompositeOperation = 'multiply';

      brain(depth, ready[0], cx, cy);
      chain.forEach((level, index) => {
        if (!ready[index]) return;
        const next = chain[index + 1];
        // Each drawing hands over while it is still sharp.
        const kept = next ? (ready[index + 1] ? 1 - smooth(next.handover - 0.3, next.handover + 0.1, depth) : 1)
          : stars.state === 'ready' ? 1 - smooth(api.open, api.open + 0.45, depth)
            : 1 - smooth(api.cycle - 1, api.cycle - 0.2, depth);
        let alpha = smooth(level.handover - 0.5, level.handover, depth) * kept;
        if (alpha < 0.002) return;
        if (index === 0) alpha *= camera.inkMicro;
        if (level.ink) alpha *= level.ink;
        context.globalAlpha = alpha;
        context.drawImage(level.image, ...spread(level.image, level.focus, level.k * Math.exp(depth), cx, cy));
      });
      flight(depth, cx, cy);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.imageSmoothingQuality = 'high';
      // The next brain, already growing out of the distance.
      if (depth > api.cycle - 1.6) brain(depth - api.cycle, ready[0], cx, cy);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
    }

    function brain(depth, microReady, cx, cy) {
      const micro = chain[0];
      const fade = microReady ? 1 - smooth(micro.handover - 0.02, micro.handover + 0.35, depth) : 1;
      const alpha = camera.ink * smooth(-1.5, -0.7, depth) * fade;
      if (alpha < 0.002 || !macro.complete || !macro.naturalWidth) return;
      const s = camera.scaleBrain * Math.exp(depth) * ratio;
      context.globalAlpha = alpha;
      context.drawImage(macro, ratio * cx - camera.node[0] * s, ratio * cy - camera.node[1] * s, macro.naturalWidth * s, macro.naturalHeight * s);
    }

    // Steady pseudo-random numbers, so each star keeps its place and look.
    function random(index, salt) {
      let x = Math.imul(index ^ Math.imul(salt, 0x9e3779b1), 0x85ebca6b);
      x ^= x >>> 13;
      x = Math.imul(x, 0xc2b2ae35);
      x ^= x >>> 16;
      return (x >>> 0) / 4294967296;
    }

    // Everything in the flight is born at a depth and grows with
    // e^(depth - born): it comes out of the distance at the centre, spirals
    // outward and leaves the screen, or fades before it would turn soft.
    function flight(depth, cx, cy) {
      const presence = smooth(api.open - 0.35, api.open + 0.25, depth) * (1 - smooth(api.cycle - 1.7, api.cycle - 0.2, depth));
      if (presence < 0.002) return;
      const span = camera.span;
      const place = (index, salt, grow, near) => {
        const angle = random(index, salt) * TAU + SPIN * Math.log(grow);
        const far = span * (near + (1 - near) * random(index, salt + 1) ** 0.8) * grow;
        return [cx + Math.cos(angle) * far, cy + Math.sin(angle) * far, far];
      };

      // Dust: crisp points, sharp at any depth.
      context.fillStyle = '#5f5f59';
      context.globalAlpha = 0.5 * presence;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.beginPath();
      const dustGap = 0.012;
      for (let index = Math.floor((depth - 2.2) / dustGap); index <= Math.floor((depth + 1.6) / dustGap); index += 1) {
        const grow = Math.exp(depth - index * dustGap);
        const [x, y, far] = place(index, 11, grow, 0.02);
        if (far > span * 1.1 || grow < 0.3) continue;
        const dot = Math.min(2.4, (0.5 + random(index, 13)) * Math.sqrt(grow));
        context.rect(x - dot / 2, y - dot / 2, dot, dot);
      }
      context.fill();

      if (galaxy.state === 'ready') {
        const gap = 1.3;
        for (let index = Math.floor((depth - 3) / gap); index <= Math.floor((depth + 3) / gap); index += 1) {
          const grow = Math.exp(depth - index * gap);
          const reachOut = span * (0.14 + 0.1 * random(index, 21)) * grow;
          const [x, y, far] = place(index, 22, grow, 0.18);
          const sharp = 1.3 * GALAXY.radius / ratio;
          const alpha = presence * 0.8 * smooth(10, 70, reachOut) * (1 - smooth(sharp * 0.5, sharp, reachOut));
          if (alpha < 0.01 || far - reachOut > span * 1.2) continue;
          const level = pick(galaxy.mips, reachOut / GALAXY.radius * ratio);
          const s = reachOut / GALAXY.radius * ratio * 2 ** level;
          const turn = random(index, 24) * TAU + SPIN * Math.log(grow);
          context.globalAlpha = alpha;
          context.setTransform(Math.cos(turn) * s, Math.sin(turn) * s, -Math.sin(turn) * s, Math.cos(turn) * s, x * ratio, y * ratio);
          context.drawImage(galaxy.mips[level], -GALAXY.centre[0] / 2 ** level, -GALAXY.centre[1] / 2 ** level);
        }
      }

      if (stars.state === 'ready') {
        context.imageSmoothingQuality = 'low';
        const gap = 0.055;
        const sharp = 1.25 * TILE / ratio;
        for (let index = Math.floor((depth - 3) / gap); index <= Math.floor((depth + 3.4) / gap); index += 1) {
          const grow = Math.exp(depth - index * gap);
          const size = span * (0.05 + 0.08 * random(index, 1)) * grow;
          if (size < 3) continue;
          const [x, y, far] = place(index, 2, grow, 0.05);
          if (far - size > span * 1.15) continue;
          const alpha = presence * (0.5 + 0.4 * random(index, 4)) * smooth(3, 34, size) * (1 - smooth(sharp * 0.8, sharp, size));
          if (alpha < 0.01) continue;
          const tile = Math.floor(random(index, 5) * 16);
          const turn = random(index, 6) * TAU;
          const level = pick(stars.mips, size / TILE * ratio);
          const cell = TILE / 2 ** level;
          const s = size / cell * ratio;
          context.globalAlpha = alpha;
          context.setTransform(Math.cos(turn) * s, Math.sin(turn) * s, -Math.sin(turn) * s, Math.cos(turn) * s, x * ratio, y * ratio);
          context.drawImage(stars.mips[level], (tile % 4) * cell, Math.floor(tile / 4) * cell, cell, cell, -cell / 2, -cell / 2, cell, cell);
        }
      }
    }

    return api;
  }
})();
