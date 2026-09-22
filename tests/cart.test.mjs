import test from 'node:test';
import assert from 'node:assert/strict';
import { productMap, reconcileCart, cartTotal } from '../dist/cart-state.mjs';

const products = [
  { id: 'guide', unitAmount: 1299, currency: 'eur', available: true, maxQuantity: 1 },
  { id: 'starter', unitAmount: 850, currency: 'eur', available: true, maxQuantity: 3 },
  { id: 'draft', unitAmount: null, currency: null, available: false, maxQuantity: 1 },
];
const catalog = productMap(products);

test('unpriced or unavailable items never become cart products', () => {
  assert.equal(catalog.size, 2);
  assert.equal(productMap([{ ...products[0], unitAmount: -1 }]).size, 0);
  assert.equal(productMap([{ ...products[0], unitAmount: 12.3 }]).size, 0);
});
test('tampered stored cart is reduced to allowed quantities and known products', () => {
  assert.deepEqual(reconcileCart([
    { id: 'guide', quantity: 1 }, { id: 'guide', quantity: 1 },
    { id: 'starter', quantity: 9999 }, { id: 'draft', quantity: 1 },
    { id: 'fake', quantity: 1 }, { id: 'starter', quantity: -4 }, null,
  ], catalog), [{ id: 'guide', quantity: 1 }, { id: 'starter', quantity: 3 }]);
  assert.deepEqual(reconcileCart({ id: 'guide' }, catalog), []);
});
test('totals use integer minor units and current catalog prices, not stored amounts', () => {
  assert.deepEqual(cartTotal([{ id: 'guide', quantity: 1, unitAmount: 1 }, { id: 'starter', quantity: 2 }], catalog), { amount: 2999, currency: 'eur' });
});
test('mixed currencies and invalid quantities cannot produce a checkout total', () => {
  const mixed = productMap([products[0], { ...products[1], currency: 'usd' }]);
  assert.throws(() => cartTotal([{ id: 'guide', quantity: 1 }, { id: 'starter', quantity: 1 }], mixed));
  assert.throws(() => cartTotal([{ id: 'starter', quantity: 4 }], catalog));
  assert.throws(() => cartTotal([{ id: 'guide', quantity: 0.5 }], catalog));
});
test('catalog availability change removes an item retained in an old cart', () => {
  const changed = productMap([{ ...products[0], available: false }, products[1]]);
  assert.deepEqual(reconcileCart([{ id: 'guide', quantity: 1 }, { id: 'starter', quantity: 1 }], changed), [{ id: 'starter', quantity: 1 }]);
});
