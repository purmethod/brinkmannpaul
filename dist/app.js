const introGate = document.querySelector("#intro-gate");
const introVideo = document.querySelector("#intro-video");
const sitePage = document.querySelector("#site-page");
const mainContent = document.querySelector("#main-content");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let introOpen = false;
let completionTimer;

// Temporary diagnostic overlay for issue #10 (iOS autoplay report). Remove after root cause is confirmed.
const debugMode = new URLSearchParams(location.search).has("debug");
let debugBox;
function debugLog(line) {
  if (!debugMode) return;
  if (!debugBox) {
    debugBox = document.createElement("pre");
    debugBox.style.cssText =
      "position:fixed;inset:auto 0 0 0;z-index:99999;background:#000;color:#0f0;font:11px/1.4 monospace;padding:8px;margin:0;max-height:60vh;overflow:auto;white-space:pre-wrap;";
    document.body.appendChild(debugBox);
  }
  debugBox.textContent += line + "\n";
}
debugLog("reducedMotion.matches=" + reducedMotion.matches);
debugLog("UA=" + navigator.userAgent);

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
introGate.addEventListener("click", () => revealSite(true));
window.addEventListener("wheel", revealFromWheel, { passive: false });
window.addEventListener("touchmove", revealFromTouch, { passive: false });
window.addEventListener("keydown", revealFromKey);

if (reducedMotion.matches) {
  debugLog("branch: reducedMotion -> showCompleteHandwriting immediately");
  showCompleteHandwriting();
} else {
  debugLog("branch: attempting video playback");
  debugLog("networkState=" + introVideo.networkState + " readyState=" + introVideo.readyState);
  introVideo.addEventListener("loadedmetadata", () => debugLog("event: loadedmetadata"));
  introVideo.addEventListener("canplay", () => debugLog("event: canplay"));
  introVideo.addEventListener("playing", () => debugLog("event: playing (animation visibly started)"));
  introVideo.addEventListener("ended", () => debugLog("event: ended (played through)"));
  introVideo.addEventListener("error", () => {
    const err = introVideo.error;
    debugLog("event: error code=" + (err && err.code) + " message=" + (err && err.message));
  });
  introVideo.addEventListener("ended", showCompleteHandwriting, { once: true });
  introVideo.addEventListener("error", showCompleteHandwriting, { once: true });
  // A finite fallback also covers stalled loads and missing metadata.
  completionTimer = window.setTimeout(() => {
    debugLog("fallback timer fired after 11s -> showCompleteHandwriting");
    showCompleteHandwriting();
  }, 11000);
  const playback = introVideo.play();
  debugLog("play() returned: " + (playback ? "promise" : String(playback)));
  if (playback) {
    playback
      .then(() => debugLog("play() promise resolved"))
      .catch((e) => {
        debugLog("play() promise REJECTED: " + e.name + " - " + e.message);
        showCompleteHandwriting();
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
