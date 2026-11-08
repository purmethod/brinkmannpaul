// The price of the pure blueprint, by the buyer's country (Vercel's x-vercel-ip-country).
// Paul, 8.11.: 19 € where people earn well, 9 € in the middle, 5 $ where 19 € is a week's food.
const MIDDLE = "AL AM AR AZ BA BG BR BY CN CO DZ EC GE IQ JO KZ LB MA MD ME MK MX MY PE RO RS RU TH TN TR UA ZA".split(" ");
const LOW = "AF BD BO BT CD CI CM EG ET GH GT HN ID IN KE KG KH LA LK MG MM MW MZ NE NG NI NP PH PK RW SD SL SN SY TJ TZ UG UZ VN YE ZM ZW".split(" ");

function priceFor(country) {
  const c = String(country || "").toUpperCase();
  if (LOW.includes(c)) return { tier: "low", amount: 500, currency: "usd" };
  if (MIDDLE.includes(c)) return { tier: "middle", amount: 900, currency: "eur" };
  return { tier: "standard", amount: 1900, currency: "eur" };
}

// a paid checkout writes one book; a few more tries cover a book that failed while it was being written
const MAX_BOOKS = 3;

module.exports = { priceFor, MAX_BOOKS };
