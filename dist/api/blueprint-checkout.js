// GET  /api/blueprint-checkout → the price for this visitor's country, shown before paying.
// POST /api/blueprint-checkout → a Stripe Checkout page for the pure blueprint (Apple Pay, cards).
// The answers never go to Stripe: they stay in the browser until the paid book is written.
const { stripe } = require("./_stripe");
const { priceFor } = require("./_blueprint");

module.exports = async (req, res) => {
  const country = req.headers["x-vercel-ip-country"] || "";
  const price = priceFor(country);
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return res.status(200).json({ amount: price.amount, currency: price.currency });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
  try {
    const session = await stripe("POST", "checkout/sessions", {
      mode: "payment",
      locale: "auto",
      success_url: `${origin}/pure/blueprint?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pure/blueprint?cancel=1`,
      allow_promotion_codes: true,
      line_items: {
        0: {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: {
              name: "pure blueprint · your personal book",
              description: "about 190 to 200 pages, written from your answers by paul brinkmann's pure method",
            },
          },
        },
      },
      metadata: { product: "blueprint", tier: price.tier, country },
      payment_intent_data: { metadata: { product: "blueprint", tier: price.tier, country } },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
