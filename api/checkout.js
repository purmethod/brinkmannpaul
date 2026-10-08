// POST /api/checkout { quantity, shipping, lang } → embedded Stripe Checkout Session
// for a skyn pre-order. Product, price and shipping rates come from /shop.json; the
// browser only chooses quantity, shipping zone and the language to come back to.
const { stripe } = require("./_stripe");
const shop = require("../shop.json");

const LANGS = ["de", "fr", "es", "ar", "ru"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const p = shop.product;
  if (!Number.isInteger(p.amount) || p.amount <= 0) return res.status(503).json({ error: "No price set yet" });
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const qty = Math.min(shop.max_quantity, Math.max(1, parseInt(body.quantity, 10) || 1));
  const zone = shop.shipping.find((z) => z.id === body.shipping) || shop.shipping[0];
  const lang = LANGS.includes(body.lang) ? `${body.lang}/` : "";
  const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

  try {
    const session = await stripe("POST", "checkout/sessions", {
      ui_mode: "embedded",
      mode: "payment",
      locale: "auto",
      return_url: `${origin}/${lang}skyn/thanks/?session_id={CHECKOUT_SESSION_ID}`,
      line_items: {
        0: {
          quantity: qty,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: shop.max_quantity },
          price_data: {
            currency: p.currency,
            unit_amount: p.amount,
            product_data: {
              name: p.name,
              description: p.description,
              images: { 0: `${origin}/assets/video-skyn-poster.webp` },
            },
          },
        },
      },
      shipping_address_collection: { allowed_countries: Object.fromEntries(zone.countries.map((c, i) => [i, c])) },
      shipping_options: {
        0: {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${zone.service} (${zone.label})`,
            fixed_amount: { amount: zone.amount, currency: p.currency },
          },
        },
      },
      custom_text: { submit: { message: "Pre-order: your skyn ships as soon as the batch is ready." } },
      phone_number_collection: { enabled: true },
      metadata: { product: p.id, shipping_zone: zone.id, pre_order: "yes" },
    });
    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
