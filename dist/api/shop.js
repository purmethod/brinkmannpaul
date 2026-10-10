// GET /api/shop?product=skyn|rye → what a pre-order page needs to open its
// checkout: price, shipping zones and whether checkout is ready (a price is set
// and the Stripe key exists). It never calls Stripe and never shows the key.
const shop = require("../shop.json");

module.exports = (req, res) => {
  const id = String((req.query && req.query.product) || "skyn");
  const p = shop.products[id];
  res.setHeader("Cache-Control", "no-store");
  if (!p) return res.status(404).json({ error: "Unknown product" });
  res.status(200).json({
    product: id,
    ready: Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(p.amount) && p.amount > 0,
    amount: p.amount,
    currency: p.currency,
    max_quantity: shop.max_quantity,
    shipping: shop.shipping.map(({ id, amount }) => ({ id, amount })),
  });
};
