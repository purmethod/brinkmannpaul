// Page bodies. Each returns { title, description, body, head, dock, ... } for layout().
import { esc, money, fill, plain } from "./util.mjs";
import { glass, grainCluster, ridge, icon } from "./art.mjs";
import { LEGAL, makeLegal, vatText } from "./legal.mjs";

const orderBtn = (ctx, cls = "btn-cream", label) =>
  `<a class="btn ${cls}" href="${ctx.routes[ctx.lang].order}">${label || ctx.t.common.orderCta} <span class="btn-price">${money(ctx.shop.product.amount, ctx.lang)}</span></a>`;

const ctaBand = (ctx) => `
      <section class="cta-band theme-dark" aria-label="${plain(ctx.t.common.ctaBandTitle)}">
        <div class="wrap cta-band-inner reveal">
          <div class="cta-band-art">${glass({ shadow: false })}</div>
          <div>
            <h2 class="h2">${ctx.t.common.ctaBandTitle}</h2>
            <p class="lead">${ctx.t.common.ctaBandText}</p>
            ${orderBtn(ctx)}
          </div>
        </div>
      </section>`;

const pageHero = (p, cls = "") => `
      <section class="page-hero ${cls}">
        <div class="wrap">
          <p class="kicker">${p.kicker}</p>
          <h1 class="display">${p.h1}</h1>
          ${p.lead ? `<p class="lead">${p.lead}</p>` : ""}
        </div>
      </section>`;

function unitPrice(ctx) {
  const ml = ctx.shop.product.volume_ml;
  if (!ml) return "";
  return `<span class="unit-price">${money(Math.round((ctx.shop.product.amount * 1000) / ml), ctx.lang)} ${ctx.t.common.perLitre}</span>`;
}

const includesList = (items) => `<ul class="includes">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

/* ---------------------------------------------------------------- home */

export function home(ctx) {
  const { t, lang, routes, shop, site } = ctx;
  const h = t.home;
  const R = routes[lang];
  const band = h.band.map((b) => `<span>${b}</span><span class="band-star" aria-hidden="true">✦</span>`).join("");
  const faqItems = h.faq.items
    .map(
      (f) => `
            <details class="faq-item">
              <summary><span>${f.q}</span>${icon("plus", "icon faq-icon")}</summary>
              <div class="faq-a"><p>${fill(f.a, { tracking: `<a href="${R.tracking}">${h.faq.trackingLink}</a>` })}</p></div>
            </details>`
    )
    .join("");

  const body = `
      <section class="hero theme-dark">
        <div class="hero-glow" aria-hidden="true"></div>
        <div class="wrap hero-inner">
          <div class="hero-copy">
            <p class="kicker">${h.hero.kicker}</p>
            <h1 class="display hero-title">${h.hero.title}</h1>
            <p class="lead hero-lead">${h.hero.lead}</p>
            <div class="hero-cta">
              ${orderBtn(ctx, "btn-cream", h.hero.cta)}
              <a class="text-link" href="#method">${h.hero.secondary}</a>
            </div>
            <ul class="hero-facts">${h.hero.facts.map((f) => `<li>${f}</li>`).join("")}</ul>
          </div>
          <figure class="hero-art">${glass({ label: h.hero.art })}</figure>
        </div>
        ${ridge({ cls: "hero-ridge", fill: true })}
      </section>

      <div class="band" aria-hidden="true">
        <div class="band-track"><div class="band-set">${band}</div><div class="band-set">${band}</div></div>
      </div>
      <p class="sr">${h.band.join(" · ")}</p>

      <section class="intro section">
        <div class="wrap intro-grid">
          <div class="reveal">
            <p class="kicker">${h.intro.kicker}</p>
            <h2 class="h2">${h.intro.title}</h2>
            <figure class="intro-art">${grainCluster({ label: h.intro.art, count: 4, seed: 12 })}</figure>
          </div>
          <div class="prose reveal">
            ${h.intro.p.map((p) => `<p>${p}</p>`).join("")}
            <p class="signature">${h.intro.sign}</p>
            <a class="text-link" href="${R.story}">${t.common.readStory}</a>
          </div>
        </div>
      </section>

      <section class="method section section-cream" id="method">
        <div class="wrap">
          <div class="section-head reveal">
            <p class="kicker">${h.method.kicker}</p>
            <h2 class="h2">${h.method.title}</h2>
            <p class="lead">${h.method.lead}</p>
          </div>
          <ol class="steps">
            ${h.method.steps
              .map(
                (s, i) => `<li class="step reveal" style="--i:${i}">
              <span class="step-n" aria-hidden="true">0${i + 1}</span>
              ${icon(s.icon, "icon step-icon")}
              <h3 class="h3">${s.title}</h3>
              <p>${s.text}</p>
            </li>`
              )
              .join("")}
          </ol>
          <p class="method-note reveal">${h.method.note}</p>
        </div>
      </section>

      <section class="secret section theme-dark">
        <div class="wrap secret-grid">
          <div class="reveal">
            <p class="kicker">${h.secret.kicker}</p>
            <h2 class="h2">${h.secret.title}</h2>
          </div>
          <div class="prose reveal">
            ${h.secret.p.map((p) => `<p>${p}</p>`).join("")}
          </div>
        </div>
        <div class="wrap">
          <ul class="pillars">
            ${h.secret.pillars
              .map(
                (p, i) => `<li class="pillar reveal" style="--i:${i}">
              ${icon(p.icon, "icon pillar-icon")}
              <h3 class="h3">${p.title}</h3>
              <p>${p.text}</p>
            </li>`
              )
              .join("")}
          </ul>
          <p class="source">${h.secret.source}</p>
        </div>
      </section>

      <section class="compare section">
        <div class="wrap">
          <div class="section-head reveal">
            <p class="kicker">${h.compare.kicker}</p>
            <h2 class="h2">${h.compare.title}</h2>
          </div>
          <div class="table-wrap reveal">
            <table class="compare-table">
              <caption class="sr">${h.compare.caption}</caption>
              <thead><tr>${h.compare.head.map((c, i) => `<th scope="col"${i === 1 ? ' class="is-us"' : ""}>${c || `<span class="sr">${lang === "de" ? "Merkmal" : "feature"}</span>`}</th>`).join("")}</tr></thead>
              <tbody>
                ${h.compare.rows.map((r) => `<tr><th scope="row">${r[0]}</th><td class="is-us">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="offer section section-cream" id="offer">
        <div class="wrap offer-card reveal">
          <figure class="offer-art">${glass({ label: t.order.art })}</figure>
          <div class="offer-copy">
            <p class="kicker">${h.offer.kicker}</p>
            <h2 class="display offer-title">${h.offer.title}</h2>
            <p class="lead">${h.offer.text}</p>
            <p class="includes-title">${h.offer.includesTitle}</p>
            ${includesList(t.order.includes)}
            <p class="price"><span class="price-value">${money(shop.product.amount, lang)}</span> <span class="price-note">${vatText(site, t)} ${t.common.shippingNote}</span> ${unitPrice(ctx)}</p>
            ${orderBtn(ctx, "btn-ink")}
            <p class="gift">${h.offer.gift}</p>
          </div>
        </div>
      </section>

      <section class="faq section">
        <div class="wrap faq-grid">
          <div class="reveal">
            <p class="kicker">${h.faq.kicker}</p>
            <h2 class="h2">${h.faq.title}</h2>
          </div>
          <div class="faq-list reveal">${faqItems}
          </div>
        </div>
      </section>

      <section class="founders-strip section section-cream">
        <div class="wrap founders-strip-inner reveal">
          <p class="kicker">${h.founders.kicker}</p>
          <h2 class="h2">${h.founders.title}</h2>
          <p class="lead">${h.founders.text}</p>
          <a class="text-link" href="${R.founders}">${t.common.meetFounders}</a>
        </div>
      </section>`;

  return {
    title: h.title,
    description: h.description,
    body,
    head: "dark",
    dock: true,
    bodyClass: "page-home",
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "qefyr",
          url: site.url,
          logo: `${site.url}/img/icon-512.png`,
          email: site.email,
          founder: site.founders.map((name) => ({ "@type": "Person", name })),
        },
        productLd(ctx),
      ],
    },
  };
}

function productLd(ctx) {
  const { shop, site, routes, lang } = ctx;
  return {
    "@type": "Product",
    name: "qefyr",
    description: shop.product.description[lang],
    brand: { "@type": "Brand", name: "qefyr" },
    image: `${site.url}/img/product.jpg`,
    url: site.url + routes[lang].order,
    offers: {
      "@type": "Offer",
      price: (shop.product.amount / 100).toFixed(2),
      priceCurrency: shop.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      url: site.url + routes[lang].order,
    },
  };
}

/* ---------------------------------------------------------------- order */

export function order(ctx) {
  const { t, lang, routes, shop, site } = ctx;
  const o = t.order;
  const R = routes[lang];
  const L = makeLegal(site, lang);
  const zones = shop.shipping
    .map(
      (z, i) => `
                <label class="zone">
                  <input type="radio" name="zone" value="${z.id}" data-amount="${z.amount}" data-label="${esc(z.label[lang])}"${i === 0 ? " checked" : ""} />
                  <span class="zone-where">${z.label[lang]}</span>
                  <span class="zone-how">${z.service[lang]} · ${fill(o.days, { min: z.delivery_days[0], max: z.delivery_days[1] })}</span>
                  <span class="zone-price">${money(z.amount, lang)}</span>
                </label>`
    )
    .join("");
  const mail = `mailto:${site.email}?subject=${encodeURIComponent(o.mailSubject)}&body=${encodeURIComponent(fill(o.mailBody, { qty: 1, zone: shop.shipping[0].label[lang] }))}`;
  const info = o.details.info;
  const infoRows = [
    [info.name, info.nameValue],
    [info.ingredients, info.ingredientsValue],
    [info.allergens, info.allergensValue],
    shop.product.volume_ml ? [info.volume, `${shop.product.volume_ml} ml`] : null,
    [info.producer, `${L.v("seller")}, ${L.v("street")}, ${L.v("postcode_city")}`],
    site.legal.organic_control_body ? [info.organic, esc(site.legal.organic_control_body)] : null,
  ].filter(Boolean);

  const body = `
      <section class="product">
        <div class="wrap product-grid">
          <figure class="product-art">
            <div class="product-art-inner">${glass({ label: o.art })}</div>
          </figure>
          <div class="product-info">
            <p class="kicker">${o.kicker}</p>
            <h1 class="display product-title">${o.h1}</h1>
            <p class="lead">${o.sub}</p>
            <p class="price"><span class="price-value" data-unit="${shop.product.amount}">${money(shop.product.amount, lang)}</span> <span class="price-note">${vatText(site, t)} · + ${lang === "de" ? "Versand" : "shipping"}</span> ${unitPrice(ctx)}</p>
            <p class="includes-title">${o.includesTitle}</p>
            ${includesList(o.includes)}

            <form class="buy" id="buy" data-max="${shop.max_quantity}" data-mail="${esc(mail)}" novalidate>
              <fieldset class="zones" data-chooser>
                <legend class="field-label">${o.shippingLegend}</legend>${zones}
              </fieldset>
              <div class="buy-row" data-chooser>
                <div class="qty-wrap">
                  <span class="field-label" id="qty-label">${o.qty}</span>
                  <div class="qty" role="group" aria-labelledby="qty-label">
                    <button type="button" class="qty-btn" data-step="-1" aria-label="${o.less}">${icon("minus")}</button>
                    <output class="qty-value" aria-live="polite" data-qty>1</output>
                    <button type="button" class="qty-btn" data-step="1" aria-label="${o.more}">${icon("plus")}</button>
                  </div>
                </div>
                <p class="total"><span class="field-label">${o.total}</span> <span class="total-value" data-total aria-live="polite">${money(shop.product.amount + shop.shipping[0].amount, lang)}</span></p>
              </div>
              <p class="gift" data-chooser>${o.gift}</p>
              <button type="submit" class="btn btn-ink btn-block" data-checkout data-label="${esc(o.cta)}" data-busy="${esc(o.busy)}" data-chooser>${o.cta}</button>
              <p class="buy-secure" data-chooser>${icon("lock", "icon icon-inline")} ${o.secure}</p>
              <div class="buy-note" data-note role="alert" hidden>
                <p data-note-text></p>
                <a class="btn btn-outline" href="${esc(mail)}" data-mail-link>${icon("mail", "icon icon-inline")} ${o.mailCta}</a>
              </div>
              <button type="button" class="text-link back-link" data-back hidden>${o.back}</button>
              <div class="checkout" id="checkout" data-checkout-box hidden></div>
              <noscript><p class="buy-noscript"><a class="btn btn-outline" href="${esc(mail)}">${icon("mail", "icon icon-inline")} ${o.mailCta}</a></p></noscript>
              <p class="buy-legal" data-chooser>${fill(o.legal, { terms: `<a href="${R.terms}">${o.termsLink}</a>`, withdrawal: `<a href="${R.withdrawal}">${o.withdrawalLink}</a>` })}</p>
            </form>
            <script type="application/json" id="buy-text">${JSON.stringify({
              notReady: o.notReady,
              failed: o.failed,
              testMode: o.testMode,
              mailSubject: o.mailSubject,
              mailBody: o.mailBody,
              locale: lang === "de" ? "de-DE" : "en-IE",
            }).replace(/</g, "\\u003c")}</script>

            <ul class="trust">${o.trust.map((x) => `<li>${icon(x.icon, "icon icon-inline")} ${x.text}</li>`).join("")}</ul>

            <div class="details">
              <details class="faq-item">
                <summary><span>${o.details.how.title}</span>${icon("plus", "icon faq-icon")}</summary>
                <div class="faq-a"><ol class="how">${o.details.how.items.map((i) => `<li>${i}</li>`).join("")}</ol></div>
              </details>
              <details class="faq-item">
                <summary><span>${info.title}</span>${icon("plus", "icon faq-icon")}</summary>
                <div class="faq-a"><dl class="facts">${infoRows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl></div>
              </details>
              <details class="faq-item">
                <summary><span>${o.details.shipping.title}</span>${icon("plus", "icon faq-icon")}</summary>
                <div class="faq-a"><p>${o.details.shipping.text}</p><p><a href="${R.shipping}">${o.details.shipping.link}</a></p></div>
              </details>
              <details class="faq-item">
                <summary><span>${o.details.customs.title}</span>${icon("plus", "icon faq-icon")}</summary>
                <div class="faq-a"><p>${o.details.customs.text}</p></div>
              </details>
            </div>
          </div>
        </div>
      </section>`;

  return {
    title: o.title,
    description: o.description,
    body,
    head: "light",
    bodyClass: "page-order",
    preconnectStripe: true,
    ogType: "product",
    jsonld: { "@context": "https://schema.org", ...productLd(ctx) },
  };
}

/* ---------------------------------------------------------------- story */

export function story(ctx) {
  const s = ctx.t.story;
  const body = `${pageHero(s, "page-hero-art")}
      <article class="article section">
        <div class="wrap article-grid">
          <aside class="article-aside" aria-hidden="true">${grainCluster({ count: 3, seed: 21 })}</aside>
          <div class="article-body">
            ${s.sections
              .map(
                (sec, i) => `<section class="chapter reveal">
              <p class="chapter-n" aria-hidden="true">0${i + 1}</p>
              <h2 class="h2-sm">${sec.h}</h2>
              ${sec.p.map((p) => `<p>${p}</p>`).join("")}
              ${sec.sign ? `<p class="signature">${sec.sign}</p>` : ""}
            </section>`
              )
              .join("")}
          </div>
        </div>
      </article>
      ${ctaBand(ctx)}`;
  return { title: s.title, description: s.description, body, head: "light", dock: true, bodyClass: "page-story", ogType: "article" };
}

/* ---------------------------------------------------------------- philosophy */

export function philosophy(ctx) {
  const p = ctx.t.philosophy;
  const body = `${pageHero(p)}
      <section class="section">
        <div class="wrap">
          <ol class="principles">
            ${p.principles
              .map(
                (x, i) => `<li class="principle reveal">
              <span class="principle-n" aria-hidden="true">0${i + 1}</span>
              <h2 class="h2-sm">${x.h}</h2>
              <p>${x.p}</p>
            </li>`
              )
              .join("")}
          </ol>
        </div>
      </section>
      <section class="quote section section-cream">
        <div class="wrap"><blockquote class="quote-text reveal"><p>${p.quote}</p></blockquote></div>
      </section>
      ${ctaBand(ctx)}`;
  return { title: p.title, description: p.description, body, head: "light", dock: true, bodyClass: "page-philosophy" };
}

/* ---------------------------------------------------------------- mission */

export function mission(ctx) {
  const m = ctx.t.mission;
  const body = `${pageHero(m)}
      <section class="section">
        <div class="wrap mission-grid">
          <p class="mission-lead reveal">${m.p}</p>
          <ul class="commitments">
            ${m.commitments
              .map(
                (c, i) => `<li class="commitment reveal" style="--i:${i}">
              <span class="principle-n" aria-hidden="true">0${i + 1}</span>
              <h2 class="h3">${c.h}</h2>
              <p>${c.p}</p>
            </li>`
              )
              .join("")}
          </ul>
        </div>
      </section>
      <section class="quote section section-cream">
        <div class="wrap"><p class="quote-text reveal">${m.closing}</p></div>
      </section>
      ${ctaBand(ctx)}`;
  return { title: m.title, description: m.description, body, head: "light", dock: true, bodyClass: "page-mission" };
}

/* ---------------------------------------------------------------- founders */

export function founders(ctx) {
  const f = ctx.t.founders;
  const body = `${pageHero(f)}
      <section class="section">
        <div class="wrap people">
          ${f.people
            .map(
              (p) => `<article class="person reveal">
            <figure class="person-media">
              ${
                p.photo
                  ? `<img src="${p.photo}" alt="${esc(p.photoAlt)}" width="640" height="800" loading="lazy" decoding="async" />`
                  : `<div class="monogram" aria-hidden="true"><span>${p.monogram}</span></div>`
              }
            </figure>
            <div class="person-copy">
              <p class="kicker">${p.role}</p>
              <h2 class="h2-sm">${p.name}</h2>
              ${p.bio.map((b) => `<p>${b}</p>`).join("")}
              ${p.links ? `<p class="person-links">${p.links.map((l) => `<a class="text-link" href="${l.href}" target="_blank" rel="noopener">${l.text}</a>`).join("")}</p>` : ""}
            </div>
          </article>`
            )
            .join("")}
        </div>
      </section>
      ${ctaBand(ctx)}`;
  return { title: f.title, description: f.description, body, head: "light", dock: true, bodyClass: "page-founders" };
}

/* ---------------------------------------------------------------- tracking */

export function tracking(ctx) {
  const { t, site } = ctx;
  const x = t.tracking;
  const body = `${pageHero(x)}
      <section class="section section-tight">
        <div class="wrap narrow">
          <form class="track" action="${x.action}" method="get" target="_blank" rel="noopener">
            <label class="field-label" for="piececode">${x.label}</label>
            <div class="track-row">
              <input class="input" id="piececode" name="piececode" type="text" inputmode="text" autocomplete="off" spellcheck="false" required minlength="8" maxlength="40" pattern="[A-Za-z0-9 ]{8,40}" placeholder="${esc(x.placeholder)}" />
              <button class="btn btn-ink" type="submit">${x.button}</button>
            </div>
            <p class="small">${x.note}</p>
          </form>
          <p class="small track-help">${fill(x.help, { email: `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` })}</p>
        </div>
      </section>`;
  return { title: x.title, description: x.description, body, head: "light", bodyClass: "page-tracking" };
}

/* ---------------------------------------------------------------- thanks */

export function thanks(ctx) {
  const { t, lang, routes } = ctx;
  const x = t.thanks;
  const R = routes[lang];
  const body = `
      <section class="page-hero thanks" data-thanks>
        <div class="wrap">
          <p class="kicker" data-state="done">${x.kicker}</p>
          <h1 class="display" data-title data-open-title="${esc(x.openTitle)}">${x.h1}</h1>
          <div data-state="done">
            <p class="lead">${x.lead}</p>
            <p class="actions"><a class="btn btn-ink" href="${R.tracking}">${x.track}</a> <a class="text-link" href="${R.home}">${x.home}</a></p>
          </div>
          <div data-state="open" hidden>
            <p class="lead">${x.openLead}</p>
            <p class="actions"><a class="btn btn-ink" href="${R.order}">${x.retry}</a></p>
          </div>
          <div class="thanks-art" aria-hidden="true">${grainCluster({ count: 3, seed: 5 })}</div>
        </div>
      </section>`;
  return { title: x.title, description: x.description, body, head: "light", noindex: true, bodyClass: "page-thanks" };
}

/* ---------------------------------------------------------------- shipping */

export function shipping(ctx) {
  const { t, lang, routes, shop, site } = ctx;
  const x = t.shipping;
  const R = routes[lang];
  const rows = shop.shipping
    .map(
      (z) =>
        `<tr><th scope="row">${z.label[lang]}</th><td>${z.service[lang]}</td><td>${money(z.amount, lang)}</td><td>${fill(t.order.days, { min: z.delivery_days[0], max: z.delivery_days[1] })}</td></tr>`
    )
    .join("");
  const body = `${pageHero(x)}
      <section class="section section-tight">
        <div class="wrap narrow prose-legal">
          <h2>${x.zonesTitle}</h2>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr>${x.head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <p class="small">${x.deliveryNote}</p>
          ${x.sections
            .map(
              (s) =>
                `<h2>${s.h}</h2><p>${fill(s.p, { tracking: `<a href="${R.tracking}">${x.trackingLink}</a>`, vat: vatText(site, t) })}</p>`
            )
            .join("")}
        </div>
      </section>`;
  return { title: x.title, description: x.description, body, head: "light", bodyClass: "page-legal" };
}

/* ---------------------------------------------------------------- legal */

function legalPage(kind) {
  return (ctx) => {
    const { t, lang, routes, site } = ctx;
    const x = makeLegal(site, lang);
    const title = t.legalTitles[kind];
    const content = LEGAL[lang][kind](x, routes[lang], { vat: vatText(site, t) });
    const note = t.common.translationNote ? `<p class="legal-note">${t.common.translationNote} <a href="${routes.de[kind]}" hreflang="de" lang="de">Deutsche Fassung</a></p>` : "";
    const body = `
      <section class="page-hero page-hero-legal">
        <div class="wrap"><h1 class="display display-md">${title}</h1></div>
      </section>
      <section class="section section-tight">
        <div class="wrap narrow prose-legal">${note}${content}
        </div>
      </section>`;
    return { title: `${title} · qefyr`, description: `${title} · qefyr`, body, head: "light", bodyClass: "page-legal" };
  };
}

export const imprint = legalPage("imprint");
export const privacy = legalPage("privacy");
export const terms = legalPage("terms");
export const withdrawal = legalPage("withdrawal");

/* ---------------------------------------------------------------- 404 (both languages) */

export function notFound(ctx) {
  const { t, other } = ctx;
  const n = t.notFound;
  const m = other.t.notFound;
  const body = `
      <section class="page-hero not-found">
        <div class="wrap">
          <p class="kicker">404</p>
          <h1 class="display">${n.h1}</h1>
          <p class="lead">${n.lead}</p>
          <p class="actions"><a class="btn btn-ink" href="${ctx.routes[ctx.lang].home}">${n.home}</a></p>
          <div lang="${other.t.htmlLang}" class="not-found-other">
            <p class="lead">${plain(m.h1)}</p>
            <p><a class="text-link" href="${other.routes.home}">${m.home}</a></p>
          </div>
        </div>
      </section>`;
  return { title: n.title, description: n.lead, body, head: "light", noindex: true, bodyClass: "page-404" };
}
