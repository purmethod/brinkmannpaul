const introGate = document.querySelector("#intro-gate");
const introVideo = document.querySelector("#intro-video");
const sitePage = document.querySelector("#site-page");
let introOpen = true;
let completionTimer;

function showCompleteHandwriting() {
  introGate.classList.add("is-complete");
}

if (introVideo) {
  introVideo.addEventListener("ended", showCompleteHandwriting, { once: true });
  introVideo.addEventListener("error", showCompleteHandwriting, { once: true });
  introVideo.addEventListener("loadedmetadata", () => {
    window.clearTimeout(completionTimer);
    completionTimer = window.setTimeout(
      showCompleteHandwriting,
      Math.ceil(introVideo.duration * 1000) + 350,
    );
  }, { once: true });
  completionTimer = window.setTimeout(showCompleteHandwriting, 11000);

  const playback = introVideo.play();
  if (playback) playback.catch(showCompleteHandwriting);
}

function revealSite() {
  if (!introOpen) return;
  introOpen = false;
  window.clearTimeout(completionTimer);
  introGate.classList.add("is-leaving");
  sitePage.classList.add("is-visible");
  sitePage.setAttribute("aria-hidden", "false");
  document.body.classList.remove("intro-locked");
  window.removeEventListener("wheel", revealFromWheel);
  window.removeEventListener("touchmove", revealFromTouch);
  window.removeEventListener("keydown", revealFromKey);
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
  revealSite();
}

introGate.addEventListener("click", revealSite);
window.addEventListener("wheel", revealFromWheel, { passive: false });
window.addEventListener("touchmove", revealFromTouch, { passive: false });
window.addEventListener("keydown", revealFromKey);

const items = document.querySelectorAll(".link-item");

items.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    items.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

const index = document.querySelector(".index");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      index.classList.add("is-visible");
      observer.disconnect();
    }
  }, { threshold: 0.08 });

  observer.observe(index);
} else {
  index.classList.add("is-visible");
}
