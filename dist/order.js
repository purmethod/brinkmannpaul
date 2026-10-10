// Pre-order pages (skyn, rye): the order opens once the product has a price and
// the stripe key is set (/api/shop). Payment stays on the page with stripe's
// embedded checkout, as on souralf.com. The product is the order block's
// data-product.
(function () {
  var order = document.getElementById('order');
  var soon = document.getElementById('soon');
  if (!order || !window.fetch) return;
  var product = order.dataset.product || 'skyn';
  var lang = document.documentElement.lang || 'en';
  var KEY = 'pk_live_51UJWsTC8fTaq0EZMhykhQH1BLysHNIzNWPPSUk5UiTwT14y9mzQqRCkjf2bu6uuWpT3FSSnIUcJ8ROXtAvjudzdB00D8OVtfX2';
  var state = { qty: 1, zone: 'de', shop: null, active: null };
  var money = function (cents, currency) {
    return new Intl.NumberFormat(lang, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  };
  var pay = order.querySelector('.pay');
  var back = order.querySelector('.back');
  var box = document.getElementById('checkout');
  var error = order.querySelector('.error');
  var chooser = [].slice.call(order.querySelectorAll('.price, .legend, .zones, .buy-row, .pay'));
  var payLabel = pay.textContent;

  function update() {
    var shop = state.shop;
    var zone = shop.shipping.filter(function (z) { return z.id === state.zone; })[0] || shop.shipping[0];
    order.querySelector('output').textContent = String(state.qty);
    order.querySelector('[data-total]').textContent = money(shop.amount * state.qty + zone.amount, shop.currency);
  }
  function loadStripe() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = function () { window.Stripe ? resolve(window.Stripe) : reject(new Error('stripe unavailable')); };
      s.onerror = function () { reject(new Error('stripe unavailable')); };
      document.head.appendChild(s);
    });
  }

  fetch('/api/shop?product=' + encodeURIComponent(product)).then(function (r) { return r.json(); }).then(function (shop) {
    if (!shop.ready) return;
    state.shop = shop;
    order.querySelector('[data-price]').textContent = money(shop.amount, shop.currency);
    shop.shipping.forEach(function (z) {
      var cost = order.querySelector('[data-zone="' + z.id + '"]');
      if (cost) cost.textContent = money(z.amount, shop.currency);
    });
    [].forEach.call(order.querySelectorAll('input[name="shipping"]'), function (r) {
      r.addEventListener('change', function () { state.zone = r.value; update(); });
    });
    [].forEach.call(order.querySelectorAll('.qty button'), function (b) {
      b.addEventListener('click', function () {
        state.qty = Math.min(shop.max_quantity, Math.max(1, state.qty + Number(b.dataset.step)));
        update();
      });
    });
    update();
    soon.hidden = true;
    order.hidden = false;
  }).catch(function () {});

  pay.addEventListener('click', function (event) {
    event.preventDefault();
    if (pay.getAttribute('aria-busy') === 'true') return;
    pay.setAttribute('aria-busy', 'true');
    pay.textContent = order.dataset.labelWait;
    error.hidden = true;
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: product, quantity: state.qty, shipping: state.zone, lang: lang === 'en' ? '' : lang })
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.clientSecret) throw new Error(d.error || 'checkout'); return d; }); })
      .then(function (data) {
        return loadStripe().then(function (Stripe) {
          var stripe = Stripe(KEY);
          if (state.active) state.active.destroy();
          return stripe.initEmbeddedCheckout({ fetchClientSecret: function () { return Promise.resolve(data.clientSecret); } });
        });
      })
      .then(function (checkout) {
        state.active = checkout;
        chooser.forEach(function (el) { el.hidden = true; });
        back.hidden = false;
        box.hidden = false;
        checkout.mount(box);
        box.scrollIntoView({ block: 'start' });
      })
      .catch(function () {
        error.textContent = order.dataset.labelError;
        error.hidden = false;
      })
      .then(function () {
        pay.removeAttribute('aria-busy');
        pay.textContent = payLabel;
      });
  });
  back.addEventListener('click', function (event) {
    event.preventDefault();
    if (state.active) state.active.destroy();
    state.active = null;
    box.hidden = true;
    back.hidden = true;
    chooser.forEach(function (el) { el.hidden = false; });
  });
})();
