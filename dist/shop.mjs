import { productMap, reconcileCart, cartTotal } from './cart-state.mjs';

const dialog = document.querySelector('#cart-dialog');
const openCartButton = document.querySelector('#cart-open');
const lines = document.querySelector('#cart-lines');
const empty = document.querySelector('#cart-empty');
const summary = document.querySelector('#cart-summary');
const totalLabel = document.querySelector('#cart-total');
const checkoutButton = document.querySelector('#checkout-button');
const status = document.querySelector('#cart-status');
const announcement = document.querySelector('#shop-announcement');
const storageKey = 'bp-cart-v1';
let catalog = new Map();
let items = [];
let enabled = false;
let pending = false;
let requestId = null;
let lastFocus = null;

function money(amount, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100);
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch { /* The cart also works without storage. */ }
}
function changeCart(next) {
  items = reconcileCart(next, catalog);
  requestId = null;
  persist();
  status.textContent = '';
  renderCart();
}
function cartButton(label, accessibleLabel, onClick) {
  const button = element('button', 'quantity-button', label);
  button.type = 'button';
  button.setAttribute('aria-label', accessibleLabel);
  button.addEventListener('click', onClick);
  return button;
}
function renderCart() {
  lines.replaceChildren();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('#cart-count').textContent = String(count);
  openCartButton.setAttribute('aria-label', `open cart, ${count} items`);
  empty.hidden = count !== 0;
  summary.hidden = count === 0;
  for (const item of items) {
    const product = catalog.get(item.id);
    const row = element('li', 'cart-line');
    const info = element('div', 'cart-line-info');
    info.append(element('h3', '', product.name), element('p', '', money(product.unitAmount, product.currency)));
    const controls = element('div', 'quantity-controls');
    const update = (difference) => {
      if (pending) return;
      const next = items.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + difference } : entry).filter((entry) => entry.quantity > 0);
      changeCart(next);
      const replacement = [...lines.querySelectorAll('button')].find((button) => button.dataset.product === item.id && button.dataset.change === String(difference));
      const fallback = [replacement, ...lines.querySelectorAll('button'), checkoutButton, document.querySelector('#cart-browse'), document.querySelector('#cart-close')]
        .find((node) => node && !node.disabled && !node.closest('[hidden]'));
      fallback?.focus();
    };
    const minus = cartButton('−', `remove one ${product.name}`, () => update(-1));
    const plus = cartButton('+', `add one ${product.name}`, () => update(1));
    for (const [button, difference] of [[minus, -1], [plus, 1]]) {
      button.dataset.product = item.id;
      button.dataset.change = String(difference);
      button.disabled = pending || (difference === 1 && item.quantity >= product.maxQuantity);
    }
    const quantity = element('span', 'quantity-value', String(item.quantity));
    quantity.setAttribute('aria-label', `quantity ${item.quantity}`);
    controls.append(minus, quantity, plus);
    row.append(info, controls, element('p', 'line-total', money(product.unitAmount * item.quantity, product.currency)));
    lines.append(row);
  }
  try {
    const total = cartTotal(items, catalog);
    totalLabel.textContent = money(total.amount, total.currency);
    checkoutButton.disabled = !enabled || !count || pending;
  } catch {
    checkoutButton.disabled = true;
    status.textContent = 'these items cannot be purchased together. please contact me.';
  }
  checkoutButton.textContent = pending ? 'opening checkout…' : 'continue to payment ↗';
}
function showCart() {
  lastFocus = document.activeElement;
  renderCart();
  if (!dialog.open) dialog.showModal();
}
openCartButton.hidden = false;
openCartButton.addEventListener('click', showCart);
document.querySelector('#cart-close').addEventListener('click', () => dialog.close());
document.querySelector('#cart-browse').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); });

async function loadCatalog() {
  try {
    const response = await fetch('/api/catalog', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('Invalid catalog');
    enabled = data.checkoutEnabled === true;
    catalog = productMap(data.products);
    let saved;
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { saved = []; }
    items = enabled ? reconcileCart(saved, catalog) : [];
    if (enabled) persist();
    for (const product of data.products) {
      if (typeof product.id !== 'string') continue;
      const row = document.getElementById(product.id);
      if (!row?.classList.contains('product-row')) continue;
      if (typeof product.name === 'string') row.querySelector('h3').textContent = product.name;
      if (typeof product.description === 'string') row.querySelector('.product-description').textContent = product.description;
    }
    for (const [id, product] of catalog) {
      if (!enabled) break;
      const anchor = document.querySelector(`[data-product="${CSS.escape(id)}"]`);
      if (!anchor) continue;
      const purchase = element('div', 'product-purchase');
      const add = element('button', 'product-action', 'add to cart +');
      add.type = 'button';
      add.setAttribute('aria-label', `add ${product.name} to cart`);
      add.addEventListener('click', () => {
        if (pending) return;
        const prior = items.find((item) => item.id === id)?.quantity || 0;
        if (prior >= product.maxQuantity) {
          announcement.textContent = `maximum quantity of ${product.name} is already in your cart.`;
        } else {
          changeCart([...items, { id, quantity: 1 }]);
          announcement.textContent = `${product.name} added to your cart.`;
        }
        showCart();
      });
      purchase.append(element('p', 'product-price', money(product.unitAmount, product.currency)), add);
      anchor.replaceWith(purchase);
    }
    renderCart();
  } catch {
    enabled = false;
    renderCart();
    // The server-rendered inquiry links remain usable if selling is unavailable.
  }
}

checkoutButton.addEventListener('click', async () => {
  if (pending || !enabled || !items.length) return;
  pending = true;
  status.textContent = '';
  renderCart();
  try {
    requestId ||= crypto.randomUUID();
    const response = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, requestId }), signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error('Checkout unavailable');
    const target = new URL(result.url);
    if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw new Error('Invalid payment address');
    window.location.assign(target.href);
  } catch {
    pending = false;
    status.textContent = 'checkout could not be opened. your cart is saved — please try again or contact orders@brinkmannpaul.com.';
    renderCart();
  }
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    pending = false;
    renderCart();
  }
});
loadCatalog();
