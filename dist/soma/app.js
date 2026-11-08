// soma flow club: the videos open the page, a tap or a scroll leads to the sessions,
// a name reserves one place (max 15), the thank-you page holds the whatsapp group and the cancel button.
// vanilla, no dependencies. sessions and places come from /api/soma.
(function () {
  "use strict";
  const T = {
    en: {
      cue: "tap or scroll", tag: "soma flow club", h1: "breathe together.",
      lead: "breathwork in a small group. max 15 people.",
      next: "choose your session", none: "the next date follows soon. join the whatsapp group and you will hear it first.",
      left: "{n} of {max} places free", full: "full",
      name: "your name", reserve: "reserve my place", wait: "one moment…",
      errName: "please write your name.", errSession: "please choose a session.", errFull: "this session is full. please choose another one.", errAny: "that did not work. please try again.",
      thanks: "thank you, {name}. we are happy you are coming.", reserved: "your place is reserved.",
      r1: "places are limited: max 15 people.", r2: "if you cannot come, cancel in time, so someone else can take part.", r3: "it is up to you to bring good energy.",
      group: "join the whatsapp group", cancel: "i cannot come, cancel my place", sure: "cancel your place?",
      cancelled: "your place is free again. thank you for letting us know.", again: "choose another session",
      loading: "loading the sessions…", test: "test session",
    },
    de: {
      cue: "tippen oder scrollen", tag: "soma flow club", h1: "gemeinsam atmen.",
      lead: "atemarbeit in einer kleinen gruppe. maximal 15 personen.",
      next: "wähle deinen termin", none: "der nächste termin folgt bald. tritt der whatsapp-gruppe bei, dann erfährst du ihn zuerst.",
      left: "{n} von {max} plätzen frei", full: "voll",
      name: "dein name", reserve: "platz reservieren", wait: "einen moment…",
      errName: "bitte schreib deinen namen.", errSession: "bitte wähle einen termin.", errFull: "dieser termin ist voll. bitte wähle einen anderen.", errAny: "das hat nicht geklappt. bitte versuch es noch einmal.",
      thanks: "danke, {name}. wir freuen uns, dass du kommst.", reserved: "dein platz ist reserviert.",
      r1: "die plätze sind begrenzt: maximal 15 personen.", r2: "wenn du nicht kommen kannst, sag rechtzeitig ab, damit andere teilnehmen können.", r3: "es liegt an dir, gute energie zu verbreiten.",
      group: "zur whatsapp-gruppe", cancel: "ich kann nicht kommen, platz absagen", sure: "deinen platz absagen?",
      cancelled: "dein platz ist wieder frei. danke, dass du abgesagt hast.", again: "anderen termin wählen",
      loading: "termine werden geladen…", test: "testtermin",
    },
    fr: {
      cue: "touche ou fais défiler", tag: "soma flow club", h1: "respirer ensemble.",
      lead: "respiration en petit groupe. 15 personnes maximum.",
      next: "choisis ta séance", none: "la prochaine date arrive bientôt. rejoins le groupe whatsapp, tu la sauras en premier.",
      left: "{n} places libres sur {max}", full: "complet",
      name: "ton prénom", reserve: "réserver ma place", wait: "un instant…",
      errName: "écris ton prénom, s'il te plaît.", errSession: "choisis une séance, s'il te plaît.", errFull: "cette séance est complète. choisis-en une autre.", errAny: "ça n'a pas marché. réessaie.",
      thanks: "merci, {name}. nous sommes heureux que tu viennes.", reserved: "ta place est réservée.",
      r1: "les places sont limitées : 15 personnes maximum.", r2: "si tu ne peux pas venir, annule à temps pour que quelqu'un d'autre puisse participer.", r3: "c'est à toi d'apporter une bonne énergie.",
      group: "rejoindre le groupe whatsapp", cancel: "je ne peux pas venir, annuler ma place", sure: "annuler ta place ?",
      cancelled: "ta place est de nouveau libre. merci de nous avoir prévenus.", again: "choisir une autre séance",
      loading: "chargement des séances…", test: "séance test",
    },
    es: {
      cue: "toca o desliza", tag: "soma flow club", h1: "respirar juntos.",
      lead: "respiración en un grupo pequeño. máximo 15 personas.",
      next: "elige tu sesión", none: "la próxima fecha llega pronto. únete al grupo de whatsapp y la sabrás primero.",
      left: "{n} de {max} plazas libres", full: "completo",
      name: "tu nombre", reserve: "reservar mi plaza", wait: "un momento…",
      errName: "escribe tu nombre, por favor.", errSession: "elige una sesión, por favor.", errFull: "esta sesión está completa. elige otra.", errAny: "no ha funcionado. inténtalo de nuevo.",
      thanks: "gracias, {name}. nos alegra que vengas.", reserved: "tu plaza está reservada.",
      r1: "las plazas son limitadas: máximo 15 personas.", r2: "si no puedes venir, cancela a tiempo para que otra persona pueda participar.", r3: "depende de ti traer buena energía.",
      group: "unirme al grupo de whatsapp", cancel: "no puedo ir, cancelar mi plaza", sure: "¿cancelar tu plaza?",
      cancelled: "tu plaza vuelve a estar libre. gracias por avisar.", again: "elegir otra sesión",
      loading: "cargando las sesiones…", test: "sesión de prueba",
    },
    ar: {
      cue: "المس أو مرّر", tag: "soma flow club", h1: "نتنفّس معًا.",
      lead: "تمارين تنفّس في مجموعة صغيرة. 15 شخصًا كحد أقصى.",
      next: "اختر موعدك", none: "الموعد القادم قريبًا. انضم إلى مجموعة واتساب لتعرفه أولًا.",
      left: "{n} من {max} أماكن متاحة", full: "مكتمل",
      name: "اسمك", reserve: "احجز مكاني", wait: "لحظة…",
      errName: "اكتب اسمك من فضلك.", errSession: "اختر موعدًا من فضلك.", errFull: "هذا الموعد مكتمل. اختر موعدًا آخر.", errAny: "لم ينجح ذلك. حاول مرة أخرى.",
      thanks: "شكرًا، {name}. يسعدنا أنك قادم.", reserved: "مكانك محجوز.",
      r1: "الأماكن محدودة: 15 شخصًا كحد أقصى.", r2: "إذا لم تستطع الحضور، ألغِ في الوقت المناسب ليتمكن شخص آخر من المشاركة.", r3: "الأمر بيدك أن تنشر طاقة طيبة.",
      group: "انضم إلى مجموعة واتساب", cancel: "لا أستطيع الحضور، ألغِ مكاني", sure: "إلغاء مكانك؟",
      cancelled: "مكانك متاح من جديد. شكرًا لأنك أخبرتنا.", again: "اختر موعدًا آخر",
      loading: "جارٍ تحميل المواعيد…", test: "موعد تجريبي",
    },
    ru: {
      cue: "коснись или прокрути", tag: "soma flow club", h1: "дышать вместе.",
      lead: "дыхательные практики в маленькой группе. максимум 15 человек.",
      next: "выбери занятие", none: "следующая дата скоро. вступи в группу whatsapp, и ты узнаешь первым.",
      left: "свободно {n} из {max} мест", full: "мест нет",
      name: "твоё имя", reserve: "забронировать место", wait: "минуту…",
      errName: "пожалуйста, напиши своё имя.", errSession: "пожалуйста, выбери занятие.", errFull: "на это занятие мест нет. выбери другое.", errAny: "не получилось. попробуй ещё раз.",
      thanks: "спасибо, {name}. мы рады, что ты придёшь.", reserved: "твоё место забронировано.",
      r1: "мест мало: максимум 15 человек.", r2: "если не сможешь прийти, отмени заранее, чтобы пришёл кто-то другой.", r3: "от тебя зависит, какую энергию ты принесёшь.",
      group: "вступить в группу whatsapp", cancel: "не смогу прийти, отменить место", sure: "отменить твоё место?",
      cancelled: "твоё место снова свободно. спасибо, что предупредил.", again: "выбрать другое занятие",
      loading: "загружаем занятия…", test: "тестовое занятие",
    },
  };
  const LANGS = Object.keys(T);
  const KEY = "soma-flow-club";
  const TEST = new URLSearchParams(location.search).get("test") === "1";
  const API = "/api/soma" + (TEST ? "?test=1" : "");
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const saved = store.get();
  const st = {
    lang: LANGS.includes(saved.lang) ? saved.lang : LANGS.find((l) => (navigator.language || "en").toLowerCase().startsWith(l)) || "en",
    sessions: null, group: "", max: 15, pick: null, name: "", busy: false, error: "",
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
    const d = new Date(s.when + ":00Z");
    const tag = { ar: "ar-TN", en: "en-GB" }[st.lang] || st.lang;
    try {
      return new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
    } catch { return s.when.replace("T", " · "); }
  }
  const place = (s) => (s.place === "test" ? t("test") : s.place);

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
    store.set({ ...store.get(), lang: l });
    render();
  }
  document.querySelectorAll(".lb").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  // ---------- the page ----------
  function render() {
    app.replaceChildren();
    if (st.booking) return renderDone();
    app.append(
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("h1")),
      el("p", { class: "lead" }, t("lead")),
      st.cancelled ? el("p", { class: "fine", role: "status" }, t("cancelled")) : null,
      el("h2", {}, t("next")));
    if (!st.sessions) return app.append(el("p", { class: "fine" }, t("loading")));
    if (!st.sessions.length) {
      app.append(el("p", {}, t("none")));
      if (st.group) app.append(el("div", { class: "acts" }, el("a", { class: "btn", href: st.group, target: "_blank", rel: "noopener" }, t("group"))));
      return;
    }
    const rows = el("div", { class: "rows", role: "radiogroup", "aria-label": t("next") });
    for (const s of st.sessions) {
      const full = s.left <= 0;
      rows.append(el("button", {
        class: "slot", type: "button", role: "radio", disabled: full,
        "aria-checked": String(st.pick === s.id),
        onclick: () => { st.pick = s.id; st.error = ""; render(); },
      },
        el("span", { class: "dot", "aria-hidden": "true" }),
        el("span", {}, when(s), el("span", { class: "place" }, place(s))),
        el("span", { class: "left" }, full ? t("full") : t("left", { n: s.left, max: st.max }))));
    }
    const input = el("input", { type: "text", id: "nm", autocomplete: "given-name", maxlength: "60", value: st.name });
    input.addEventListener("input", () => { st.name = input.value; });
    const form = el("form", { class: "form", novalidate: true, onsubmit: (e) => { e.preventDefault(); reserve(form); } },
      el("label", { for: "nm" }, t("name")), input,
      el("div", { class: "hp", "aria-hidden": "true" }, el("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off" })),
      el("div", {}, el("button", { class: "btn", type: "submit", disabled: st.busy }, st.busy ? t("wait") : t("reserve"))),
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null);
    app.append(rows, form);
  }

  function renderDone() {
    const b = st.booking;
    const acts = el("div", { class: "acts" });
    if (st.group || b.group) acts.append(el("a", { class: "btn", href: b.group || st.group, target: "_blank", rel: "noopener" }, t("group")));
    acts.append(el("button", { class: "ghost", type: "button", onclick: cancel }, t("cancel")));
    app.append(el("section", { class: "done", "aria-live": "polite" },
      el("p", { class: "tag" }, t("tag")),
      el("h1", {}, t("thanks", { name: b.name })),
      el("p", { class: "when" }, when(b)),
      el("p", { class: "fine" }, place(b)),
      el("p", { class: "lead" }, t("reserved")),
      el("ul", { class: "rules" }, ["r1", "r2", "r3"].map((k) => el("li", {}, t(k)))),
      acts,
      st.error ? el("p", { class: "err", role: "alert" }, st.error) : null));
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: "no-store" });
      const d = await r.json();
      st.sessions = d.sessions || [];
      st.group = d.group || "";
      st.max = d.places || 15;
      const open = st.sessions.filter((s) => s.left > 0);
      if (!st.pick && open.length === 1) st.pick = open[0].id;
    } catch { st.sessions = []; }
    // a reservation for a session that has passed is forgotten
    if (st.booking && st.booking.when < new Date().toISOString().slice(0, 16)) { st.booking = null; store.set({ ...store.get(), booking: null }); }
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
      st.booking = { id: d.id, name, when: d.when, place: d.place, group: d.group || st.group };
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
