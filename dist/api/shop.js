// GET /api/shop → what the skyn page needs to open the pre-order: price, shipping
// zones and whether checkout is ready (a price is set and the Stripe key exists).
// It never calls Stripe and never shows the key.
const shop = require("../shop.json");

module.exports = (req, res) => {
  const p = shop.product;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ready: Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(p.amount) && p.amount > 0,
    amount: p.amount,
    currency: p.currency,
    max_quantity: shop.max_quantity,
    shipping: shop.shipping.map(({ id, amount }) => ({ id, amount })),
  });
};
