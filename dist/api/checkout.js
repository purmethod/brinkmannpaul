// POST /api/checkout { product, quantity, shipping, lang } → embedded Stripe Checkout
// Session for a pre-order (skyn, rye) or a place in a wim hof weekend. Product,
// price and shipping rates come from /shop.json; the browser only chooses the
// product, quantity, shipping zone, the weekend date and the language to come
// back to. A product with "shipping": false (the weekend) is not shipped, so no
// address is asked; a product with dates sells only the places a date has left.
const { stripe } = require("./_stripe");
const shop = require("../shop.json");
const { placesLeft } = require("./_places");

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
  let max = p.max_quantity || shop.max_quantity;
  let date = null;
  if (p.dates) {
    date = p.dates.find((d) => d.id === body.date);
    if (!date) return res.status(400).json({ error: "Choose a date" });
    try {
      const left = (await placesLeft(p)).find((d) => d.id === date.id).left;
      if (left < 1) return res.status(409).json({ error: "Fully booked" });
      max = Math.min(max, left);
    } catch (err) {
      return res.status(502).json({ error: "Places could not be counted" });
    }
  }
  const qty = Math.min(max, Math.max(1, parseInt(body.quantity, 10) || 1));
  const ships = p.shipping !== false;
  const zone = shop.shipping.find((z) => z.id === body.shipping) || shop.shipping[0];
  const lang = LANGS.includes(body.lang) ? `${body.lang}/` : "";
  const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

  try {
    const session = await stripe("POST", "checkout/sessions", {
      ui_mode: "embedded",
      mode: "payment",
      locale: "auto",
      return_url: `${origin}/${lang}${p.path || id}/thanks/?session_id={CHECKOUT_SESSION_ID}`,
      line_items: {
        0: {
          quantity: qty,
          // A dated place is counted from metadata.places, so its number is fixed here.
          adjustable_quantity: date ? undefined : { enabled: true, minimum: 1, maximum: max },
          price_data: {
            currency: p.currency,
            unit_amount: p.amount,
            product_data: {
              name: date ? `${p.name} · ${date.label}` : p.name,
              description: p.description,
              images: p.image ? { 0: `${origin}${p.image}` } : undefined,
            },
          },
        },
      },
      shipping_address_collection: ships ? { allowed_countries: Object.fromEntries(zone.countries.map((c, i) => [i, c])) } : undefined,
      shipping_options: ships ? {
        0: {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${zone.service} (${zone.label})`,
            fixed_amount: { amount: zone.amount, currency: p.currency },
          },
        },
      } : undefined,
      custom_text: { submit: { message: p.note } },
      phone_number_collection: { enabled: true },
      metadata: ships ? { product: id, shipping_zone: zone.id, pre_order: "yes" } : { product: id, date: date ? date.id : "", places: String(qty) },
    });
    res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
