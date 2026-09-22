const introGate = document.querySelector("#intro-gate");
const introAnimation = document.querySelector("#intro-animation");
const sitePage = document.querySelector("#site-page");
const mainContent = document.querySelector("#main-content");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introOpen = false;

function showCompleteHandwriting() {
  introGate.classList.add("is-complete");
}

function revealSite(moveFocus = false) {
  if (!introOpen) return;
  introOpen = false;
  introGate.classList.add("is-leaving");
  sitePage.inert = false;
  sitePage.removeAttribute("aria-hidden");
  document.body.classList.remove("intro-locked");
  window.removeEventListener("wheel", revealFromWheel);
  window.removeEventListener("touchmove", revealFromTouch);
  window.removeEventListener("keydown", revealFromKey);
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

introOpen = true;
sitePage.inert = true;
sitePage.setAttribute("aria-hidden", "true");
document.body.classList.add("intro-enabled", "intro-locked");
introGate.addEventListener("click", () => revealSite(true));
window.addEventListener("wheel", revealFromWheel, { passive: false });
window.addEventListener("touchmove", revealFromTouch, { passive: false });
window.addEventListener("keydown", revealFromKey);

if (reducedMotion.matches) {
  showCompleteHandwriting();
} else {
  introAnimation.addEventListener("error", showCompleteHandwriting, { once: true });
}

reducedMotion.addEventListener("change", (event) => {
  if (event.matches && introOpen) showCompleteHandwriting();
});

const projects = document.querySelectorAll(".project-item");

projects.forEach((project) => {
  project.addEventListener("toggle", () => {
    if (!project.open) return;
    projects.forEach((otherProject) => {
      if (otherProject !== project) otherProject.open = false;
    });
  });
});
