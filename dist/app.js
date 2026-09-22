const introGate = document.querySelector("#intro-gate");
const introVideo = document.querySelector("#intro-video");
const sitePage = document.querySelector("#site-page");
const mainContent = document.querySelector("#main-content");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introOpen = false;
let completionTimer;
let introSeen = false;
try { introSeen = sessionStorage.getItem("bp-intro-seen") === "1"; } catch { /* Storage is optional. */ }

function showCompleteHandwriting() {
  window.clearTimeout(completionTimer);
  introGate.classList.add("is-complete");
  introVideo.pause();
}

function revealSite(moveFocus = false) {
  if (!introOpen) return;
  introOpen = false;
  window.clearTimeout(completionTimer);
  introVideo.pause();
  introGate.classList.add("is-leaving");
  sitePage.inert = false;
  sitePage.removeAttribute("aria-hidden");
  document.body.classList.remove("intro-locked");
  window.removeEventListener("wheel", revealFromWheel);
  window.removeEventListener("touchmove", revealFromTouch);
  window.removeEventListener("keydown", revealFromKey);
  try { sessionStorage.setItem("bp-intro-seen", "1"); } catch { /* Storage is optional. */ }
  if (moveFocus || document.activeElement === introGate) mainContent.focus({ preventScroll: true });
}

function revealFromWheel(event) {
  if (Math.abs(event.deltaY) < 2) return;
  event.preventDefault();
  revealSite();
}

function revealFromTouch(event) {
  event.preventDefault();
  revealSite();
}

function revealFromKey(event) {
  if (!["ArrowDown", "PageDown", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  revealSite(true);
}

if (!introSeen && !reducedMotion.matches) {
  introOpen = true;
  sitePage.inert = true;
  sitePage.setAttribute("aria-hidden", "true");
  document.body.classList.add("intro-locked");
  introGate.addEventListener("click", () => revealSite(true));
  window.addEventListener("wheel", revealFromWheel, { passive: false });
  window.addEventListener("touchmove", revealFromTouch, { passive: false });
  window.addEventListener("keydown", revealFromKey);
  introVideo.addEventListener("ended", showCompleteHandwriting, { once: true });
  introVideo.addEventListener("error", showCompleteHandwriting, { once: true });
  // A finite fallback also covers stalled loads and missing metadata.
  completionTimer = window.setTimeout(showCompleteHandwriting, 11000);
  const playback = introVideo.play();
  if (playback) playback.catch(showCompleteHandwriting);
}

reducedMotion.addEventListener("change", (event) => {
  if (event.matches) revealSite();
});

const categories = document.querySelectorAll(".category-item");

categories.forEach((category) => {
  category.addEventListener("toggle", () => {
    if (!category.open) return;

    categories.forEach((otherCategory) => {
      if (otherCategory !== category) otherCategory.open = false;
    });
  });

  const projects = category.querySelectorAll(".project-item");

  projects.forEach((project) => {
    project.addEventListener("toggle", () => {
      if (!project.open) return;

      projects.forEach((otherProject) => {
        if (otherProject !== project) otherProject.open = false;
      });
    });
  });
});

