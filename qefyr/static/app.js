// qefyr: header state, mobile menu, reveals, floating order button, order + Stripe Embedded Checkout,
// thank-you status. Vanilla, no dependencies. Every feature degrades to plain HTML without JS.
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var lang = doc.body.getAttribute("data-lang") === "de" ? "de" : "en";

  /* ---------- header: solid once the page scrolls ---------- */

  function initHeader() {
    var head = doc.querySelector(".head");
    if (!head) return;
    var ticking = false;
    function update() {
      ticking = false;
      head.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- mobile menu ---------- */

  function initMenu() {
    var menu = doc.getElementById("menu");
    var open = doc.querySelector("[data-menu-open]");
    var close = doc.querySelector("[data-menu-close]");
    if (!menu || !open || !close) return;
    var main = doc.getElementById("main");

    function focusables() {
      return Array.prototype.slice.call(menu.querySelectorAll("a[href], button:not([disabled])"));
    }
    function show() {
      menu.hidden = false;
      open.setAttribute("aria-expanded", "true");
      doc.body.classList.add("menu-open");
      if (main) main.setAttribute("aria-hidden", "true");
      close.focus();
    }
    function hide(restore) {
      menu.hidden = true;
      open.setAttribute("aria-expanded", "false");
      doc.body.classList.remove("menu-open");
      if (main) main.removeAttribute("aria-hidden");
      if (restore !== false) open.focus();
    }
    open.addEventListener("click", show);
    close.addEventListener("click", function () {
      hide();
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a[href]")) hide(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") {
        hide();
      } else if (e.key === "Tab") {
        var f = focusables();
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    window.addEventListener("resize", function () {
      if (!menu.hidden && window.innerWidth >= 960) hide(false);
    });
  }

  /* ---------- reveal on scroll ---------- */

  function initReveals() {
    var items = doc.querySelectorAll(".reveal");
    if (!items.length || !("IntersectionObserver" in window) || reduced.matches) return;
    root.classList.add("reveal-ready");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
    // Safety net: never leave content invisible (e.g. print, odd viewports).
    window.setTimeout(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
    }, 1200);
    window.addEventListener("beforeprint", function () {
      items.forEach(function (el) {
        el.classList.add("is-in");
      });
    });
  }

  /* ---------- floating order button: after the hero, away from the footer ---------- */

  function initDock() {
    var dock = doc.querySelector("[data-dock]");
    if (!dock || !("IntersectionObserver" in window)) return;
    var hero = doc.querySelector(".hero, .page-hero");
    var foot = doc.querySelector(".foot");
    var offer = doc.querySelector(".offer, .cta-band");
    var state = { hero: true, foot: false, offer: false };
    function update() {
      var on = !state.hero && !state.foot && !state.offer;
      dock.classList.toggle("is-visible", on);
      dock.setAttribute("aria-hidden", on ? "false" : "true");
      dock.tabIndex = on ? 0 : -1;
    }
    function watch(el, key) {
      if (!el) {
        state[key] = false;
        return;
      }
      new IntersectionObserver(function (entries) {
        state[key] = entries[0].isIntersecting;
        update();
      }).observe(el);
    }
    watch(hero, "hero");
    watch(foot, "foot");
    watch(offer, "offer");
  }

  /* ---------- money ---------- */

  function money(cents) {
    var whole = cents % 100 === 0;
    var n = whole ? String(cents / 100) : (cents / 100).toFixed(2);
    return lang === "de" ? n.replace(".", ",") + " €" : "€" + n;
  }

  /* ---------- order page ---------- */

  function initOrder() {
    var form = doc.getElementById("buy");
    if (!form) return;
    var textEl = doc.getElementById("buy-text");
    var text = textEl ? JSON.parse(textEl.textContent) : {};
    var unitEl = doc.querySelector(".price-value[data-unit]");
    var unit = unitEl ? Number(unitEl.getAttribute("data-unit")) : 0;
    var max = Number(form.getAttribute("data-max")) || 6;
    var qtyOut = form.querySelector("[data-qty]");
    var totalOut = form.querySelector("[data-total]");
    var minus = form.querySelector('[data-step="-1"]');
    var plus = form.querySelector('[data-step="1"]');
    var cta = form.querySelector("[data-checkout]");
    var note = form.querySelector("[data-note]");
    var noteText = form.querySelector("[data-note-text]");
    var mailLink = form.querySelector("[data-mail-link]");
    var back = form.querySelector("[data-back]");
    var box = form.querySelector("[data-checkout-box]");
    var chooser = Array.prototype.slice.call(form.querySelectorAll("[data-chooser]"));
    var state = { qty: 1, busy: false, checkout: null };

    function zone() {
      return form.querySelector('input[name="zone"]:checked');
    }

    function mailHref() {
      var z = zone();
      var body = String(text.mailBody || "")
        .replace("{qty}", String(state.qty))
        .replace("{zone}", z ? z.getAttribute("data-label") : "");
      var base = (form.getAttribute("data-mail") || "").split("?")[0];
      return base + "?subject=" + encodeURIComponent(text.mailSubject || "qefyr") + "&body=" + encodeURIComponent(body);
    }

    function update() {
      var z = zone();
      var ship = z ? Number(z.getAttribute("data-amount")) : 0;
      qtyOut.textContent = String(state.qty);
      totalOut.textContent = money(unit * state.qty + ship);
      minus.disabled = state.qty <= 1;
      plus.disabled = state.qty >= max;
      if (mailLink) mailLink.setAttribute("href", mailHref());
    }

    form.querySelectorAll(".qty-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.qty = Math.min(max, Math.max(1, state.qty + Number(btn.getAttribute("data-step"))));
        update();
      });
    });
    form.querySelectorAll('input[name="zone"]').forEach(function (r) {
      r.addEventListener("change", update);
    });

    function showNote(message, test) {
      noteText.textContent = "";
      if (test) {
        var badge = doc.createElement("span");
        badge.className = "test";
        badge.textContent = text.testMode || "Test";
        noteText.appendChild(badge);
      }
      noteText.appendChild(doc.createTextNode(message));
      note.hidden = false;
    }

    function setBusy(on) {
      state.busy = on;
      cta.disabled = on;
      cta.textContent = on ? cta.getAttribute("data-busy") : cta.getAttribute("data-label");
    }

    function loadStripe() {
      if (window.Stripe) return Promise.resolve(window.Stripe);
      return new Promise(function (resolve, reject) {
        var s = doc.createElement("script");
        s.src = "https://js.stripe.com/v3/";
        s.async = true;
        s.onload = function () {
          if (window.Stripe) resolve(window.Stripe);
          else reject(new Error("Stripe.js unavailable"));
        };
        s.onerror = function () {
          reject(new Error("Stripe.js could not be loaded"));
        };
        doc.head.appendChild(s);
      });
    }

    function closeCheckout() {
      if (state.checkout && state.checkout.destroy) state.checkout.destroy();
      state.checkout = null;
      box.hidden = true;
      back.hidden = true;
      chooser.forEach(function (el) {
        el.hidden = false;
      });
      cta.focus();
    }
    back.addEventListener("click", closeCheckout);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (state.busy) return;
      var z = zone();
      note.hidden = true;
      if (!window.fetch || !z) {
        window.location.href = mailHref();
        return;
      }
      setBusy(true);
      var publishable = "";
      fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: state.qty, zone: z.value, lang: lang }),
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!res.ok || !data.clientSecret || !data.publishableKey) {
                var err = new Error(data.error || "Checkout API " + res.status);
                err.status = res.status;
                throw err;
              }
              return data;
            });
        })
        .then(function (data) {
          publishable = data.publishableKey;
          return loadStripe().then(function (StripeJs) {
            var stripe = StripeJs(data.publishableKey, { locale: lang });
            var init = stripe.initEmbeddedCheckout || stripe.createEmbeddedCheckoutPage;
            if (!init) throw new Error("Stripe.js has no embedded checkout");
            if (state.checkout && state.checkout.destroy) state.checkout.destroy();
            return init.call(stripe, {
              fetchClientSecret: function () {
                return Promise.resolve(data.clientSecret);
              },
            });
          });
        })
        .then(function (checkout) {
          state.checkout = checkout;
          chooser.forEach(function (el) {
            el.hidden = true;
          });
          box.hidden = false;
          back.hidden = false;
          checkout.mount(box);
          box.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
        })
        .catch(function (err) {
          var notConfigured = err && err.status === 503;
          var test = publishable.indexOf("pk_test_") === 0 || notConfigured;
          if (window.console) console.warn("qefyr checkout:", err && err.message);
          showNote(notConfigured ? text.notReady : text.failed + (test && err && err.message ? " (" + err.message + ")" : ""), test && !notConfigured);
        })
        .then(function () {
          setBusy(false);
        });
    });

    update();
  }

  /* ---------- thank-you page: was the payment really completed? ---------- */

  function initThanks() {
    var wrap = doc.querySelector("[data-thanks]");
    if (!wrap || !window.fetch) return;
    var id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) return;
    fetch("/api/session-status?session_id=" + encodeURIComponent(id))
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (d && d.status === "open") {
          var title = wrap.querySelector("[data-title]");
          if (title) title.innerHTML = title.getAttribute("data-open-title");
          wrap.querySelectorAll('[data-state="done"]').forEach(function (el) {
            el.hidden = true;
          });
          wrap.querySelector('[data-state="open"]').hidden = false;
        }
      })
      .catch(function () {});
  }

  initHeader();
  initMenu();
  initReveals();
  initDock();
  initOrder();
  initThanks();
})();
