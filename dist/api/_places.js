// Places left on each weekend date: the date's places minus the places in
// paid checkouts for it (metadata.date, metadata.places), counted in Stripe
// so the count is always the real one. A date that has begun is closed.
const { stripe } = require("./_stripe");

async function placesLeft(p) {
  const today = new Date().toISOString().slice(0, 10);
  const booked = {};
  let after;
  for (let page = 0; page < 20; page++) {
    const list = await stripe("GET", "checkout/sessions", { status: "complete", limit: 100, starting_after: after });
    for (const s of list.data || []) {
      const m = s.metadata || {};
      if (m.product === "weekend" && m.date) booked[m.date] = (booked[m.date] || 0) + (parseInt(m.places, 10) || 0);
    }
    if (!list.has_more || !list.data.length) break;
    after = list.data[list.data.length - 1].id;
  }
  return p.dates.map((d) => ({ id: d.id, left: d.id < today ? 0 : Math.max(0, d.places - (booked[d.id] || 0)) }));
}

module.exports = { placesLeft };
