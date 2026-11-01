(() => {
  const gate = document.querySelector("#intro-gate");
  const animation = document.querySelector("#intro-animation");
  const page = document.querySelector("#site-page");
  const main = document.querySelector("#main-content");
  const skip = document.querySelector(".skip-link");
  if (!gate || !animation || !page || !main) return;

  const source = animation.querySelector("source");
  const portrait = document.querySelector(".intro-portrait");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let open = false;
  let left = false;
  let still = false;
  let loadTimer;
  let touchStart = null;
  let portraitReady = false;
  let playAttempt = 0;
  let suspended = false;

  function showStill() {
    window.clearTimeout(loadTimer);
    still = true;
    playAttempt += 1;
    gate.classList.add("is-complete");
    animation.pause();
  }

  function play() {
    if (still || left || !portraitReady || document.hidden || suspended) return;
    armFallback();
    animation.playbackRate = 1.25;
    const attempt = ++playAttempt;
    const playing = animation.play();
    if (playing) playing.catch(error => {
      if (attempt !== playAttempt || error?.name === 'AbortError') return;
      if (open && !document.hidden && !suspended) showStill();
    });
  }

  function armFallback() {
    window.clearTimeout(loadTimer);
    if (open && !still && !document.hidden && !suspended) loadTimer = window.setTimeout(showStill, 10000);
  }

  // The signature is written over the portrait, so it starts once the
  // portrait is there. Started by the browser on its own, a phone on a slow
  // line showed the name half written before the photo had arrived.
  function whenPortrait(then) {
    if (!portrait || portrait.complete) {
      then();
      return;
    }
    portrait.addEventListener("load", then, { once: true });
    portrait.addEventListener("error", then, { once: true });
  }

  function enter(moveFocus = false) {
    if (!open) return;
    open = false;
    left = true;
    window.clearTimeout(loadTimer);
    page.inert = false;
    page.removeAttribute("aria-hidden");
    document.body.classList.remove("intro-locked");
    gate.classList.add("is-leaving");
    gate.tabIndex = -1;
    if (moveFocus || document.activeElement === gate) main.focus({ preventScroll: true });
    gate.setAttribute("aria-hidden", "true");
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKey);
    // Stop decoding once the gate has faded out.
    window.setTimeout(() => animation.pause(), 600);
  }

  function onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaY) < 2) return;
    event.preventDefault();
    enter();
  }

  function onTouchStart(event) {
    touchStart = event.touches.length === 1 ? event.touches[0].clientY : null;
  }

  function onTouchMove(event) {
    if (touchStart === null || event.touches.length !== 1) return;
    if (Math.abs(event.touches[0].clientY - touchStart) < 12) return;
    if (event.cancelable) event.preventDefault();
    enter();
  }

  function onKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["ArrowDown", "PageDown", "Enter", " ", "Escape"].includes(event.key)) return;
    event.preventDefault();
    enter(true);
  }

  // Bind every escape route before making the page inert.
  gate.addEventListener("click", () => enter(true));
  skip?.addEventListener("click", () => enter(true));
  const onMotion = (event) => { if (event.matches && open) showStill(); };
  if (motion.addEventListener) motion.addEventListener("change", onMotion);
  else if (motion.addListener) motion.addListener(onMotion);

  // Direct links never leave someone stranded behind the intro, and a
  // language switch shows the same page in another language without it.
  let switched = false;
  try {
    switched = window.sessionStorage.getItem("bs-language-switch") !== null;
  } catch {
    switched = false;
  }
  if (window.location.hash || switched) {
    animation.pause();
    return;
  }
  open = true;
  gate.removeAttribute("aria-hidden");
  gate.tabIndex = 0;
  page.inert = true;
  page.setAttribute("aria-hidden", "true");
  document.body.classList.add("intro-enabled", "intro-locked");
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKey);

  if (motion.matches) {
    showStill();
    return;
  }
  // Recover from a stalled connection both before and after the first frame.
  armFallback();
  animation.addEventListener("playing", () => window.clearTimeout(loadTimer));
  animation.addEventListener("waiting", armFallback);
  animation.addEventListener("stalled", () => { if (animation.readyState < 3) armFallback(); });
  animation.addEventListener("ended", showStill, { once: true });
  // A failed <source> reports its error on the <source> element, not on <video>.
  animation.addEventListener("error", showStill, { once: true });
  source?.addEventListener("error", showStill, { once: true });
  const pause = () => { playAttempt += 1; window.clearTimeout(loadTimer); animation.pause(); };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else if (open && !still) { armFallback(); play(); }
  });
  window.addEventListener("pagehide", () => { suspended = true; pause(); });
  window.addEventListener("pageshow", () => { suspended = false; if (open && !still) { armFallback(); play(); } });
  // play() itself loads the clip: iOS does not preload a video it was not
  // asked to play, and muted inline video may play without a tap.
  if (!animation.canPlayType('video/mp4; codecs="avc1.42E01E"')) showStill();
  else whenPortrait(() => { portraitReady = true; play(); });
})();

/* The pure elevation: each pillar and the foundation opens its own chapter. */
(function () {
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  if (!buttons.length) return;
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.getAttribute('aria-expanded') === 'true') return;
      buttons.forEach(function (other) {
        var open = other === button;
        other.setAttribute('aria-expanded', open ? 'true' : 'false');
        var panel = document.getElementById('ph-panel-' + other.dataset.chapter);
        if (panel) panel.hidden = !open;
      });
    });
  });
})();
