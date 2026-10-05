// GET /api/health → is the shop ready to take payments? Shows only safe facts, never a key.
const { stripe, VERSION } = require("./_stripe");
const shop = require("../shop.json");

// The account part of a Stripe key, e.g. "51UJWskCGh7EzGI7m" from sk_test_51UJWskCGh7EzGI7m…
const account = (k) => (/^(?:sk|rk|pk)_(?:test|live)_([A-Za-z0-9]{16})/.exec(k || "") || [])[1] || null;
const mode = (k) => (/^(?:sk|rk|pk)_(test|live)_/.exec(k || "") || [])[1] || (k ? "unknown" : null);

module.exports = async (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY || "";
  const pk = process.env.STRIPE_PUBLISHABLE_KEY || "";
  const out = {
    secret_key_mode: mode(sk),
    publishable_key_mode: mode(pk),
    keys_same_account: sk && pk ? account(sk) === account(pk) : null,
    keys_same_mode: sk && pk ? mode(sk) === mode(pk) : null,
    stripe_api_version: VERSION,
    stripe_reachable: null,
    error: null,
    product: `${shop.product.name} ${(shop.product.amount / 100).toFixed(2)} ${shop.currency.toUpperCase()}`,
    shipping_zones: shop.shipping.map((z) => `${z.label.en} ${(z.amount / 100).toFixed(2)}`),
  };
  if (sk) {
    try {
      await stripe("GET", "checkout/sessions", { limit: 1 });
      out.stripe_reachable = true;
    } catch (err) {
      out.stripe_reachable = false;
      out.error = err.message;
    }
  }
  out.ready = Boolean(
    out.stripe_reachable &&
      ["test", "live"].includes(out.publishable_key_mode) &&
      out.keys_same_account !== false &&
      out.keys_same_mode !== false
  );
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(out);
};
