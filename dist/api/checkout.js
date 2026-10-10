// POST /api/checkout { product, quantity, shipping, lang } → embedded Stripe Checkout
// Session for a pre-order (skyn, rye). Product, price and shipping rates come from
// /shop.json; the browser only chooses the product, quantity, shipping zone and the
// language to come back to.
const { stripe } = require("./_stripe");
const shop = require("../shop.json");

const LANGS = ["de", "fr", "es", "ar", "ru"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const id = Object.prototype.hasOwnProperty.call(shop.products, body.product) ? body.product : "skyn";
  const p = shop.products[id];
  if (!Number.isInteger(p.amount) || p.amount <= 0) return res.status(503).json({ error: "No price set yet" });
  const qty = Math.min(shop.max_quantity, Math.max(1, parseInt(body.quantity, 10) || 1));
  const zone = shop.shipping.find((z) => z.id === body.shipping) || shop.shipping[0];
  const lang = LANGS.includes(body.lang) ? `${body.lang}/` : "";
  const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

  try {
    const session = await stripe("POST", "checkout/sessions", {
      ui_mode: "embedded",
      mode: "payment",
      locale: "auto",
      return_url: `${origin}/${lang}${id}/thanks/?session_id={CHECKOUT_SESSION_ID}`,
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
              images: p.image ? { 0: `${origin}${p.image}` } : undefined,
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
      custom_text: { submit: { message: p.note } },
      phone_number_collection: { enabled: true },
      metadata: { product: id, shipping_zone: zone.id, pre_order: "yes" },
    });
    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
