// GET /api/shop?product=skyn|rye|weekend → what an order page needs to open its
// checkout: price, shipping zones, the weekend dates with their places left, and
// whether checkout is ready (a price is set and the Stripe key exists). It never
// shows the key.
const shop = require("../shop.json");
const { placesLeft } = require("./_places");

module.exports = async (req, res) => {
  const id = String((req.query && req.query.product) || "skyn");
  const p = shop.products[id];
  res.setHeader("Cache-Control", "no-store");
  if (!p) return res.status(404).json({ error: "Unknown product" });
  const ready = Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(p.amount) && p.amount > 0;
  let dates;
  if (p.dates) {
    // Without a count the dates still show, without places left.
    dates = ready ? await placesLeft(p).catch(() => p.dates.map((d) => ({ id: d.id, left: null }))) : [];
  }
  res.status(200).json({
    product: id,
    ready,
    amount: p.amount,
    currency: p.currency,
    max_quantity: p.max_quantity || shop.max_quantity,
    shipping: p.shipping === false ? [] : shop.shipping.map(({ id, amount }) => ({ id, amount })),
    dates,
  });
};
