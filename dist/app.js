(() => {
  const gate = document.querySelector("#intro-gate");
  const animation = document.querySelector("#intro-animation");
  const page = document.querySelector("#site-page");
  const main = document.querySelector("#main-content");
  const skip = document.querySelector(".skip-link");
  if (!gate || !animation || !page || !main) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let open = false;
  let loadTimer;
  let touchStart = null;

  function showStill() {
    window.clearTimeout(loadTimer);
    gate.classList.add("is-complete");
  }

  function enter(moveFocus = false) {
    if (!open) return;
    open = false;
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
  animation.addEventListener("error", showStill, { once: true });
  animation.addEventListener("load", () => window.clearTimeout(loadTimer), { once: true });
  const onMotion = (event) => { if (event.matches && open) showStill(); };
  if (motion.addEventListener) motion.addEventListener("change", onMotion);
  else if (motion.addListener) motion.addListener(onMotion);

  // Direct links never leave someone stranded behind the intro.
  if (window.location.hash) return;
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

  if (motion.matches || (animation.complete && animation.naturalWidth === 0)) showStill();
  else if (!animation.complete) loadTimer = window.setTimeout(showStill, 12000);
})();

// Native details work independently of JavaScript; readers may open multiple topics.
