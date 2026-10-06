// POST /api/checkout { quantity, zone, lang } → embedded Stripe Checkout Session for qefyr.
// Product, price and shipping come from /shop.json (one source for pages and server);
// the browser only chooses quantity, shipping zone and language.
const { stripe, list, readBody, origin } = require("./_stripe");
const shop = require("../shop.json");
const routes = require("../routes.json");

const TEXT = {
  en: {
    submit: (o) =>
      `By paying you accept our [terms](${o}${routes.en.terms}). qefyr is a fresh, living food and is excluded from the right of withdrawal ([details](${o}${routes.en.withdrawal})).`,
    address: "Please check your address carefully. Outside the EU, import duties and local rules for dairy products may apply.",
  },
  de: {
    submit: (o) =>
      `Mit der Zahlung akzeptierst du unsere [AGB](${o}${routes.de.terms}). qefyr ist ein frisches, lebendes Lebensmittel und vom Widerrufsrecht ausgeschlossen ([Details](${o}${routes.de.withdrawal})).`,
    address: "Bitte prüfe deine Adresse genau. Außerhalb der EU können Einfuhrabgaben und lokale Regeln für Milchprodukte gelten.",
  },
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const pk = process.env.STRIPE_PUBLISHABLE_KEY || "";
  if (!pk) return res.status(503).json({ error: "STRIPE_PUBLISHABLE_KEY is not set" });

  const body = readBody(req);
  const lang = body.lang === "de" ? "de" : "en";
  const zone = shop.shipping.find((z) => z.id === body.zone);
  if (!zone) return res.status(400).json({ error: "Unknown shipping zone" });
  const qty = Math.min(shop.max_quantity, Math.max(1, parseInt(body.quantity, 10) || 1));
  const o = origin(req);
  const p = shop.product;
  const [minDays, maxDays] = zone.delivery_days;

  try {
    const session = await stripe("POST", "checkout/sessions", {
      ui_mode: "embedded",
      mode: "payment",
      locale: lang,
      submit_type: "pay",
      return_url: `${o}${routes[lang].thanks}?session_id={CHECKOUT_SESSION_ID}`,
      line_items: {
        0: {
          quantity: qty,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: shop.max_quantity },
          price_data: {
            currency: shop.currency,
            unit_amount: p.amount,
            product_data: {
              name: p.name,
              description: p.description[lang],
              // Stripe fetches the image itself, so only send it from a public https origin.
              images: o.startsWith("https://") ? list([`${o}/img/product.jpg`]) : undefined,
            },
          },
        },
      },
      shipping_address_collection: { allowed_countries: list(zone.countries) },
      shipping_options: {
        0: {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${zone.service[lang]} (${zone.label[lang]})`,
            fixed_amount: { amount: zone.amount, currency: shop.currency },
            delivery_estimate: {
              minimum: { unit: "business_day", value: minDays },
              maximum: { unit: "business_day", value: maxDays },
            },
          },
        },
      },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: shop.allow_promotion_codes ? true : undefined,
      custom_text: {
        submit: { message: TEXT[lang].submit(o) },
        shipping_address: { message: TEXT[lang].address },
      },
      metadata: { shipping_zone: zone.id, lang },
      payment_intent_data: { metadata: { shipping_zone: zone.id, lang } },
    });
    if (!session.client_secret) return res.status(502).json({ error: "Stripe returned no client secret" });
    return res.status(200).json({ clientSecret: session.client_secret, publishableKey: pk });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};
