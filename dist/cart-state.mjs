export function productMap(products) {
  return new Map(products.filter((p) => p && typeof p.id === 'string' && p.available === true && Number.isSafeInteger(p.unitAmount) && p.unitAmount > 0 && ['eur', 'usd', 'gbp', 'chf'].includes(p.currency) && Number.isSafeInteger(p.maxQuantity) && p.maxQuantity > 0).map((p) => [p.id, p]));
}

export function reconcileCart(value, catalog) {
  if (!Array.isArray(value)) return [];
  const quantities = new Map();
  for (const item of value.slice(0, 100)) {
    if (!item || typeof item.id !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const product = catalog.get(item.id);
    if (!product) continue;
    const quantity = Math.min(product.maxQuantity, (quantities.get(item.id) || 0) + item.quantity);
    quantities.set(item.id, quantity);
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

export function cartTotal(items, catalog) {
  const currencies = new Set();
  let amount = 0;
  for (const item of items) {
    const product = catalog.get(item.id);
    if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > product.maxQuantity) throw new Error('Invalid cart');
    currencies.add(product.currency);
    amount += product.unitAmount * item.quantity;
    if (!Number.isSafeInteger(amount)) throw new Error('Invalid total');
  }
  if (currencies.size > 1) throw new Error('Mixed currencies');
  return { amount, currency: currencies.values().next().value || 'eur' };
}
