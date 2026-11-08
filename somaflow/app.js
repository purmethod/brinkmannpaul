// soma flow club: the videos open the page, a tap or a scroll leads to the sessions,
// a name reserves one place (max 15), the thank-you page holds the whatsapp group and the cancel button.
// vanilla, no dependencies. sessions and places come from /api/soma.
(function () {
  "use strict";
  const T = {
    en: {
      cue: "tap or scroll", tag: "soma flow club", h1: "feel your body.",
      lead: "an unforgettable retreat for your body. you have earned it.", limit: "places are limited: max 15 people.", nextName: "next session", nextPlace: "date and place follow in the whatsapp group", placeLater: "the place follows in the whatsapp group", nextReserved: "your place for the next session is reserved. date and place follow in the whatsapp group.",
      next: "choose your session", none: "the sessions could not be loaded. please reload the page.",
      left: "{n} of {max} places free", full: "full",
      name: "your name", reserve: "reserve my place", wait: "one moment…",
      errName: "please write your name.", errSession: "please choose a session.", errFull: "this session is full. please choose another one.", errAny: "that did not work. please try again.",
      thanks: "thank you, {name}. we are happy you are coming.", reserved: "your place is reserved.",
      r1: "places are limited: max 15 people.", r2: "if you cannot come, cancel in time, so someone else can take part.", r3: "it is up to you to bring good energy.",
      group: "join our whatsapp group", follow: "follow on instagram", placeIs: "the place:", cancel: "i cannot come, cancel my place", sure: "cancel your place?",
      cancelled: "your place is free again. thank you for letting us know.", again: "choose another session",
      loading: "loading the sessions…", test: "test session",
    },
    de: {
      cue: "tippen oder scrollen", tag: "soma flow club", h1: "fühle deinen körper.",
      lead: "ein unvergessliches retreat für deinen körper. du hast es dir verdient.", limit: "die plätze sind begrenzt: maximal 15 personen.", nextName: "nächster termin", nextPlace: "datum und ort kommen in der whatsapp-gruppe", placeLater: "der ort kommt in der whatsapp-gruppe", nextReserved: "dein platz für den nächsten termin ist reserviert. datum und ort bekommst du in der whatsapp-gruppe.",
      next: "wähle deinen termin", none: "die termine konnten nicht geladen werden. bitte lade die seite neu.",
      left: "{n} von {max} plätzen frei", full: "voll",
      name: "dein name", reserve: "platz reservieren", wait: "einen moment…",
      errName: "bitte schreib deinen namen.", errSession: "bitte wähle einen termin.", errFull: "dieser termin ist voll. bitte wähle einen anderen.", errAny: "das hat nicht geklappt. bitte versuch es noch einmal.",
      thanks: "danke, {name}. wir freuen uns, dass du kommst.", reserved: "dein platz ist reserviert.",
      r1: "die plätze sind begrenzt: maximal 15 personen.", r2: "wenn du nicht kommen kannst, sag rechtzeitig ab, damit andere teilnehmen können.", r3: "es liegt an dir, gute energie zu verbreiten.",
      group: "tritt unserer whatsapp-gruppe bei", follow: "folge uns auf instagram", placeIs: "der ort:", cancel: "ich kann nicht kommen, platz absagen", sure: "deinen platz absagen?",
      cancelled: "dein platz ist wieder frei. danke, dass du abgesagt hast.", again: "anderen termin wählen",
      loading: "termine werden geladen…", test: "testtermin",
    },
    fr: {
      cue: "touche ou fais défiler", tag: "soma flow club", h1: "ressens ton corps.",
      lead: "une retraite inoubliable pour ton corps. tu l'as méritée.", limit: "les places sont limitées : 15 personnes maximum.", nextName: "prochaine séance", nextPlace: "la date et le lieu arrivent dans le groupe whatsapp", placeLater: "le lieu arrive dans le groupe whatsapp", nextReserved: "ta place pour la prochaine séance est réservée. la date et le lieu arrivent dans le groupe whatsapp.",
      next: "choisis ta séance", none: "les séances n'ont pas pu être chargées. recharge la page.",
      left: "{n} places libres sur {max}", full: "complet",
      name: "ton prénom", reserve: "réserver ma place", wait: "un instant…",
      errName: "écris ton prénom, s'il te plaît.", errSession: "choisis une séance, s'il te plaît.", errFull: "cette séance est complète. choisis-en une autre.", errAny: "ça n'a pas marché. réessaie.",
      thanks: "merci, {name}. nous sommes heureux que tu viennes.", reserved: "ta place est réservée.",
      r1: "les places sont limitées : 15 personnes maximum.", r2: "si tu ne peux pas venir, annule à temps pour que quelqu'un d'autre puisse participer.", r3: "c'est à toi d'apporter une bonne énergie.",
      group: "rejoins notre groupe whatsapp", follow: "suis-nous sur instagram", placeIs: "le lieu :", cancel: "je ne peux pas venir, annuler ma place", sure: "annuler ta place ?",
      cancelled: "ta place est de nouveau libre. merci de nous avoir prévenus.", again: "choisir une autre séance",
      loading: "chargement des séances…", test: "séance test",
    },
    es: {
      cue: "toca o desliza", tag: "soma flow club", h1: "siente tu cuerpo.",
      lead: "un retiro inolvidable para tu cuerpo. te lo has ganado.", limit: "las plazas son limitadas: máximo 15 personas.", nextName: "próxima sesión", nextPlace: "la fecha y el lugar llegan en el grupo de whatsapp", placeLater: "el lugar llega en el grupo de whatsapp", nextReserved: "tu plaza para la próxima sesión está reservada. la fecha y el lugar llegan en el grupo de whatsapp.",
      next: "elige tu sesión", none: "no se pudieron cargar las sesiones. vuelve a cargar la página.",
      left: "{n} de {max} plazas libres", full: "completo",
      name: "tu nombre", reserve: "reservar mi plaza", wait: "un momento…",
      errName: "escribe tu nombre, por favor.", errSession: "elige una sesión, por favor.", errFull: "esta sesión está completa. elige otra.", errAny: "no ha funcionado. inténtalo de nuevo.",
      thanks: "gracias, {name}. nos alegra que vengas.", reserved: "tu plaza está reservada.",
      r1: "las plazas son limitadas: máximo 15 personas.", r2: "si no puedes venir, cancela a tiempo para que otra persona pueda participar.", r3: "depende de ti traer buena energía.",
      group: "únete a nuestro grupo de whatsapp", follow: "síguenos en instagram", placeIs: "el lugar:", cancel: "no puedo ir, cancelar mi plaza", sure: "¿cancelar tu plaza?",
      cancelled: "tu plaza vuelve a estar libre. gracias por avisar.", again: "elegir otra sesión",
      loading: "cargando las sesiones…", test: "sesión de prueba",
    },
    ar: {
      cue: "المس أو مرّر", tag: "soma flow club", h1: "اشعر بجسدك.",
      lead: "خلوة لا تُنسى لجسدك. أنت تستحق ذلك.", limit: "الأماكن محدودة: 15 شخصًا كحد أقصى.", nextName: "الموعد القادم", nextPlace: "التاريخ والمكان في مجموعة واتساب", placeLater: "المكان في مجموعة واتساب", nextReserved: "مكانك في الموعد القادم محجوز. يصلك التاريخ والمكان في مجموعة واتساب.",
      next: "اختر موعدك", none: "تعذّر تحميل المواعيد. أعد تحميل الصفحة.",
      left: "{n} من {max} أماكن متاحة", full: "مكتمل",
      name: "اسمك", reserve: "احجز مكاني", wait: "لحظة…",
      errName: "اكتب اسمك من فضلك.", errSession: "اختر موعدًا من فضلك.", errFull: "هذا الموعد مكتمل. اختر موعدًا آخر.", errAny: "لم ينجح ذلك. حاول مرة أخرى.",
      thanks: "شكرًا، {name}. يسعدنا أنك قادم.", reserved: "مكانك محجوز.",
      r1: "الأماكن محدودة: 15 شخصًا كحد أقصى.", r2: "إذا لم تستطع الحضور، ألغِ في الوقت المناسب ليتمكن شخص آخر من المشاركة.", r3: "الأمر بيدك أن تنشر طاقة طيبة.",
      group: "انضم إلى مجموعة واتساب الخاصة بنا", follow: "تابعنا على إنستغرام", placeIs: "المكان:", cancel: "لا أستطيع الحضور، ألغِ مكاني", sure: "إلغاء مكانك؟",
      cancelled: "مكانك متاح من جديد. شكرًا لأنك أخبرتنا.", again: "اختر موعدًا آخر",
      loading: "جارٍ تحميل المواعيد…", test: "موعد تجريبي",
    },
    ru: {
      cue: "коснись или прокрути", tag: "soma flow club", h1: "почувствуй своё тело.",
      lead: "незабываемый ретрит для твоего тела. ты это заслуживаешь.", limit: "мест мало: максимум 15 человек.", nextName: "следующее занятие", nextPlace: "дата и место будут в группе whatsapp", placeLater: "место будет в группе whatsapp", nextReserved: "твоё место на следующем занятии забронировано. дату и место узнаешь в группе whatsapp.",
      next: "выбери занятие", none: "не удалось загрузить занятия. обнови страницу.",
      left: "свободно {n} из {max} мест", full: "мест нет",
      name: "твоё имя", reserve: "забронировать место", wait: "минуту…",
      errName: "пожалуйста, напиши своё имя.", errSession: "пожалуйста, выбери занятие.", errFull: "на это занятие мест нет. выбери другое.", errAny: "не получилось. попробуй ещё раз.",
      thanks: "спасибо, {name}. мы рады, что ты придёшь.", reserved: "твоё место забронировано.",
      r1: "мест мало: максимум 15 человек.", r2: "если не сможешь прийти, отмени заранее, чтобы пришёл кто-то другой.", r3: "от тебя зависит, какую энергию ты принесёшь.",
      group: "вступи в нашу группу whatsapp", follow: "подписывайся в instagram", placeIs: "место:", cancel: "не смогу прийти, отменить место", sure: "отменить твоё место?",
      cancelled: "твоё место снова свободно. спасибо, что предупредил.", again: "выбрать другое занятие",
      loading: "загружаем занятия…", test: "тестовое занятие",
    },
  };
  const LANGS = Object.keys(T);
  const KEY = "soma-flow-club";
  const TEST = new URLSearchParams(location.search).get("test") === "1";
  const IG = "https://www.instagram.com/buildpaul/";
  const API = "/api/soma" + (TEST ? "?test=1" : "");
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const saved = store.get();
  // the page opens in the visitor's own language (the device's list, in order); a choice made here
  // holds for this visit only, so the next visit opens in their language again
  const device = () => {
    for (const tag of navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]) {
      const l = String(tag).toLowerCase().slice(0, 2);
      if (LANGS.includes(l)) return l;
    }
    return "en";
  };
  let chosen = null;
  try { chosen = sessionStorage.getItem(KEY + "-lang"); } catch { /* private mode */ }
  const st = {
    lang: LANGS.includes(chosen) ? chosen : device(),
    sessions: null, max: 15, pick: null, name: "", busy: false, error: "",
    booking: saved.booking || null, cancelled: false,
  };
  const app = document.getElementById("book");
  const t = (k, v) => String(T[st.lang][k] || T.en[k]).replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null ? v[x] : ""));
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  }
  // the session time is the local time at the place, so it is shown exactly as written
  function when(s) {
    if (!s.when) return t("nextName");
    const d = new Date(s.when + ":00Z");
    const tag = { ar: "ar-TN", en: "en-GB" }[st.lang] || st.lang;
    try {
      return new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
    } catch { return s.when.replace("T", " · "); }
  }
  // no date yet: date and place follow in the group; a date without a place: the place follows there
  // "the place: creative hub, sidi bou said · google maps"
  const where = (s) => el("p", { class: "where" }, t("placeIs") + " " + s.place + " · ",
    el("a", { href: s.map, target: "_blank", rel: "noopener" }, "google maps"));
  const place = (s) => (s.place === "test" ? t("test") : s.place || (s.when ? t("placeLater") : t("nextPlace")));

  // ---------- the opening ----------
  const flow = document.getElementById("flow");
  const clip = document.getElementById("clip");
  const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) { clip.removeAttribute("autoplay"); clip.pause(); }
  else {
    const play = () => clip.play().catch(() => {});
    play();
    // some phones block autoplay until the first touch; low power mode too
    document.addEventListener("touchstart", play, { once: true, passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) play(); });
  }
  flow.addEventListener("click", () => {
    document.getElementById("top").scrollIntoView({ behavior: still ? "auto" : "smooth" });
  });

  // ---------- language ----------
  function setLang(l) {
    st.lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.querySelectorAll(".lb").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    document.getElementById("cue").textContent = t("cue");
    render();
  }
  document.querySelectorAll(".lb").forEach((b) => b.addEventListener("click", () => {
    try { sessionStorage.setItem(KEY + "-lang", b.dataset.lang); } catch { /* private mode */ }
    setLang(b.dataset.lang);
  }));

  // ---------- the page ----------
  // append, skipping the parts that are not there (a bare null would show as the word "null")
  const put = (...kids) => app.append(...kids.flat().filter((k) => k != null && k !== false));
  function render() {
    app.replaceChildren();
    if (st.booking) return renderDone();
    put(
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("h1")),
      // each sentence of the lead on its own line: the retreat, then "you have earned it."
      el("p", { class: "lead" }, t("lead").split(/(?<=\.)\s+/).flatMap((line, i) => (i ? [el("br"), line] : [line]))),
      el("p", { class: "fine" }, t("limit")),
      st.cancelled ? el("p", { class: "fine", role: "status" }, t("cancelled")) : null,
      el("h2", {}, t("next")));
    if (!st.sessions) return put(el("p", { class: "fine" }, t("loading")));
    if (!st.sessions.length) return put(el("p", {}, t("none")));
    const rows = el("div", { class: "rows", role: "radiogroup", "aria-label": t("next") });
    for (const s of st.sessions) {
      const full = s.left <= 0;
      rows.append(el("button", {
        class: "slot", type: "button", role: "radio", disabled: full,
        "aria-checked": String(st.pick === s.id),
        onclick: () => { st.pick = s.id; st.error = ""; render(); },
      },
        el("span", { class: "dot", "aria-hidden": "true" }),
        el("span", {}, when(s), s.map ? null : el("span", { class: "place" }, place(s))),
        el("span", { class: "left" }, full ? t("full") : t("left", { n: s.left, max: st.max }))));
      if (s.map) rows.append(where(s));
    }
    const input = el("input", { type: "text", id: "nm", autocomplete: "given-name", maxlength: "60", value: st.name });
    input.addEventListener("input", () => { st.name = input.value; });
    const form = el("form", { class: "form", novalidate: true, onsubmit: (e) => { e.preventDefault(); reserve(form); } },
      el("label", { for: "nm" }, t("name")), input,
      el("div", { class: "hp", "aria-hidden": "true" }, el("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off" })),
      el("div", {}, el("button", { class: "btn", type: "submit", disabled: st.busy }, st.busy ? t("wait") : t("reserve"))),
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null);
    put(rows, form);
  }

  function renderDone() {
    const b = st.booking;
    const acts = el("div", { class: "acts" });
    if (b.group) acts.append(el("a", { class: "btn", href: b.group, target: "_blank", rel: "noopener" }, t("group")));
    acts.append(el("a", { class: "ghost", href: IG, target: "_blank", rel: "noopener" }, t("follow")));
    if (b.map) acts.append(el("a", { class: "ghost", href: b.map, target: "_blank", rel: "noopener" }, b.place.split(",")[0] + " · google maps"));
    const leave = el("div", { class: "acts leave" }, el("button", { class: "ghost", type: "button", onclick: cancel }, t("cancel")));
    put(el("section", { class: "done", "aria-live": "polite" },
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("thanks", { name: b.name })),
      el("p", { class: "when" }, when(b)),
      b.when ? (b.map ? where(b) : el("p", { class: "fine" }, place(b))) : null,
      el("p", { class: "lead" }, b.when ? t("reserved") : t("nextReserved")),
      el("ul", { class: "rules" }, ["r1", "r2", "r3"].map((k) => el("li", {}, t(k)))),
      acts,
      leave,
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null));
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      const d = await r.json();
      st.sessions = d.sessions || [];
      st.max = d.places || 15;
      const open = st.sessions.filter((s) => s.left > 0);
      if (!st.pick && open.length === 1) st.pick = open[0].id;
    } catch { st.sessions = []; }
    // a reservation for a session that has passed is forgotten
    if (st.booking && st.booking.when && st.booking.when < new Date().toISOString().slice(0, 16)) { st.booking = null; store.set({ ...store.get(), booking: null }); }
    render();
  }

  async function reserve(form) {
    if (st.busy) return;
    st.error = "";
    const name = st.name.trim();
    if (name.length < 2) { st.error = t("errName"); return render(); }
    if (!st.pick) { st.error = t("errSession"); return render(); }
    st.busy = true; render();
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: st.pick, name, company: form.company ? form.company.value : "" }) });
      const d = await r.json().catch(() => ({}));
      st.busy = false;
      if (r.status === 409) { st.error = t("errFull"); await load(); return; }
      if (!r.ok || !d.id) { st.error = t("errAny"); return render(); }
      st.booking = { id: d.id, name, when: d.when, place: d.place, map: d.map || "", group: d.group || "" };
      st.cancelled = false;
      store.set({ ...store.get(), booking: st.booking });
      render();
      app.focus({ preventScroll: true });
      document.getElementById("top").scrollIntoView();
    } catch { st.busy = false; st.error = t("errAny"); render(); }
  }

  async function cancel() {
    if (!st.booking || !window.confirm(t("sure"))) return;
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancel: st.booking.id }) });
      if (!r.ok) throw new Error("cancel");
      st.booking = null; st.cancelled = true; st.error = ""; st.pick = null;
      store.set({ ...store.get(), booking: null });
      await load();
    } catch { st.error = t("errAny"); render(); }
  }

  setLang(st.lang);
  load();
})();
