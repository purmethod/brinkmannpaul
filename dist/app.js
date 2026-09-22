const introGate = document.querySelector("#intro-gate");
const introVideo = document.querySelector("#intro-video");
const sitePage = document.querySelector("#site-page");
const mainContent = document.querySelector("#main-content");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introOpen = false;
let completionTimer;

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
introGate.addEventListener("click", () => {
  if (introVideo.dataset.playbackBlocked === "true" && !introVideo.ended) {
    const playback = introVideo.play();
    if (playback) {
      playback
        .then(() => {
          delete introVideo.dataset.playbackBlocked;
        })
        .catch(() => revealSite(true));
    }
    return;
  }

  revealSite(true);
});
window.addEventListener("wheel", revealFromWheel, { passive: false });
window.addEventListener("touchmove", revealFromTouch, { passive: false });
window.addEventListener("keydown", revealFromKey);

if (reducedMotion.matches) {
  showCompleteHandwriting();
} else {
  introVideo.addEventListener("ended", showCompleteHandwriting, { once: true });
  introVideo.addEventListener("error", showCompleteHandwriting, { once: true });
  introVideo.addEventListener(
    "playing",
    () => {
      window.clearTimeout(completionTimer);
      completionTimer = window.setTimeout(showCompleteHandwriting, 11000);
    },
    { once: true },
  );

  const playback = introVideo.play();
  if (playback) {
    playback.catch(() => {
      // iOS can reject muted autoplay (for example in Low Power Mode).
      // Keep the first video frame visible and let the first tap start the animation.
      introVideo.dataset.playbackBlocked = "true";
    });
  }
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
