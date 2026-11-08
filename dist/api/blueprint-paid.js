// GET /api/blueprint-paid?session_id=cs_…[&check=1|&claim=1] → { paid } for a pure blueprint checkout.
// The book server (purmethod.com) asks with check=1 before writing a book (paid and no book written yet)
// and with claim=1 once the book is written, which counts it on the payment. One payment, one book;
// a book that fails while it is written is not counted, so the buyer can try again.
const { stripe } = require("./_stripe");
const { MAX_BOOKS } = require("./_blueprint");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const id = String(req.query.session_id || "");
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ paid: false, error: "Invalid session" });
  let session;
  try {
    session = await stripe("GET", `checkout/sessions/${id}`);
  } catch (err) {
    return res.status(err.status === 404 ? 404 : 502).json({ paid: false, error: err.message });
  }
  const paid = session.status === "complete" && session.payment_status === "paid" && session.metadata && session.metadata.product === "blueprint";
  if (!paid) return res.status(402).json({ paid: false });
  const wants = req.query.claim ? "claim" : req.query.check ? "check" : "";
  if (!wants || !session.payment_intent) return res.status(200).json({ paid: true });
  // count the book on the payment itself, no database needed
  try {
    const pi = await stripe("GET", `payment_intents/${session.payment_intent}`);
    const books = parseInt(pi.metadata && pi.metadata.books, 10) || 0;
    if (books >= MAX_BOOKS) return res.status(409).json({ paid: false, error: "Already used" });
    if (wants === "check") return res.status(200).json({ paid: true });
    await stripe("POST", `payment_intents/${session.payment_intent}`, { metadata: { books: String(books + 1) } });
  } catch (err) {
    // a key without write access to payments must not stop a paid book; the payment itself is verified
    console.error("blueprint claim not counted", err.status, err.message);
  }
  return res.status(200).json({ paid: true });
};
