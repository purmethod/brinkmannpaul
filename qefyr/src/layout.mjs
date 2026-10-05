// Page shell: <head>, header, mobile menu, footer, floating order button.
import { esc, plain, money } from "./util.mjs";
import { icon, ridge } from "./art.mjs";

export function layout(ctx, page) {
  const { t, lang, routes, site, shop, assets, other, key } = ctx;
  const R = routes[lang];
  const url = (path) => site.url + (path === "/" ? "/" : path);
  const self = R[key] ? url(R[key]) : null;
  const price = money(shop.product.amount, lang);
  const navItems = ["story", "philosophy", "mission", "founders"];
  const current = (k) => (k === key ? ' aria-current="page"' : "");
  const switchHref = other.routes[key] || other.routes.home;
  const alternates = R[key]
    ? `<link rel="alternate" hreflang="en" href="${url(routes.en[key])}" />
    <link rel="alternate" hreflang="de" href="${url(routes.de[key])}" />
    <link rel="alternate" hreflang="x-default" href="${url(routes.en[key])}" />`
    : "";

  return `<!doctype html>
<html lang="${t.htmlLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    ${page.noindex ? '<meta name="robots" content="noindex" />' : ""}
    ${self && !page.noindex ? `<link rel="canonical" href="${self}" />` : ""}
    ${page.noindex ? "" : alternates}
    <meta name="theme-color" content="${page.head === "dark" ? "#1c2a21" : "#fbf8f2"}" />
    <meta property="og:type" content="${page.ogType || "website"}" />
    <meta property="og:site_name" content="qefyr" />
    <meta property="og:locale" content="${t.ogLocale}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    ${self ? `<meta property="og:url" content="${self}" />` : ""}
    <meta property="og:image" content="${site.url}/img/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(plain(t.home.hero.art))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/img/icon-180.png" />
    <link rel="preload" href="/fonts/fraunces-opsz.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/styles.css?v=${assets.css}" />
    ${page.preconnectStripe ? '<link rel="preconnect" href="https://js.stripe.com" />' : ""}
    ${page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld)}</script>` : ""}
    <script>document.documentElement.classList.add("js")</script>
    <script src="/app.js?v=${assets.js}" defer></script>
  </head>
  <body class="${page.bodyClass || ""}" data-lang="${lang}">
    <a class="skip" href="#main">${t.nav.skip}</a>
    <header class="head" data-head="${page.head || "light"}">
      <div class="head-inner">
        <a class="wordmark" href="${R.home}" aria-label="${t.nav.home}">qefyr</a>
        <nav class="nav" aria-label="${lang === "de" ? "Hauptnavigation" : "Main"}">
          <ul>${navItems.map((k) => `<li><a href="${R[k]}"${current(k)}>${t.nav[k]}</a></li>`).join("")}</ul>
        </nav>
        <div class="head-actions">
          <a class="lang-link" href="${switchHref}" hreflang="${other.t.lang}" lang="${other.t.lang}" aria-label="${t.nav.switchLabel}">${other.t.short}</a>
          <a class="btn btn-sm head-cta" href="${R.order}"${current("order")}>${t.nav.order}</a>
          <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-open>
            ${icon("menu")}<span class="sr">${t.nav.menu}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t.nav.menu}" hidden>
      <div class="menu-top">
        <a class="wordmark" href="${R.home}" aria-label="${t.nav.home}">qefyr</a>
        <button class="menu-btn" type="button" data-menu-close>${icon("close")}<span class="sr">${t.nav.close}</span></button>
      </div>
      <nav class="menu-nav" aria-label="${t.nav.menu}">
        <ul>
          ${navItems.map((k) => `<li><a href="${R[k]}"${current(k)}>${t.nav[k]}</a></li>`).join("")}
          <li><a href="${R.order}"${current("order")}>${t.nav.order}</a></li>
        </ul>
      </nav>
      <div class="menu-foot">
        <a class="btn btn-cream" href="${R.order}">${t.common.orderCta} <span class="btn-price">${price}</span></a>
        <a class="lang-link" href="${switchHref}" hreflang="${other.t.lang}" lang="${other.t.lang}">${other.t.name}</a>
      </div>
    </div>

    <main id="main" tabindex="-1">
${page.body}
    </main>

    <footer class="foot">
      ${ridge({ cls: "foot-ridge" })}
      <div class="foot-inner wrap">
        <div class="foot-brand">
          <a class="wordmark wordmark-xl" href="${R.home}" aria-label="${t.nav.home}">qefyr</a>
          <p>${t.footer.tagline}</p>
        </div>
        <nav class="foot-cols" aria-label="Footer">
          <div>
            <p class="foot-h">${t.footer.shop}</p>
            <ul>
              <li><a href="${R.order}">${t.footer.order}</a></li>
              <li><a href="${R.shipping}">${t.footer.shipping}</a></li>
              <li><a href="${R.tracking}">${t.footer.tracking}</a></li>
            </ul>
          </div>
          <div>
            <p class="foot-h">${t.footer.about}</p>
            <ul>${navItems.map((k) => `<li><a href="${R[k]}">${t.nav[k]}</a></li>`).join("")}</ul>
          </div>
          <div>
            <p class="foot-h">${t.footer.legal}</p>
            <ul>
              <li><a href="${R.imprint}">${t.footer.imprint}</a></li>
              <li><a href="${R.privacy}">${t.footer.privacy}</a></li>
              <li><a href="${R.terms}">${t.footer.terms}</a></li>
              <li><a href="${R.withdrawal}">${t.footer.withdrawal}</a></li>
            </ul>
          </div>
          <div class="foot-contact">
            <p class="foot-h">${t.footer.contact}</p>
            <ul>
              <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
              <li><a href="${switchHref}" hreflang="${other.t.lang}" lang="${other.t.lang}">${other.t.name}</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="wrap">
        <div class="foot-base">
          <p>© ${ctx.year} qefyr · ${t.footer.rights}</p>
          <p>${t.footer.founded}</p>
        </div>
      </div>
    </footer>
    ${page.dock ? `<a class="dock" href="${R.order}" data-dock tabindex="-1" aria-hidden="true">${t.common.orderCta} · ${price}</a>` : ""}
  </body>
</html>
`;
}
