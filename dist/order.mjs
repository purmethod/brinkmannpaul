const title = document.querySelector('#order-title');
const message = document.querySelector('#order-message');
const list = document.querySelector('#order-items');
const retry = document.querySelector('#order-retry');
const back = document.querySelector('#order-back');
const sessionId = new URLSearchParams(location.search).get('session_id');
let busy = false;
async function checkPayment() {
  if (busy) return;
  if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    title.textContent = 'no order to check';
    message.textContent = 'open your payment confirmation link, or contact me for help.';
    return;
  }
  busy = true;
  retry.disabled = true;
  try {
    const response = await fetch(`/api/order?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Unable to check');
    const order = await response.json();
    list.replaceChildren();
    list.hidden = true;
    if (order.status === 'paid') {
      title.textContent = 'payment confirmed';
      message.textContent = 'thank you for your order. your payment has been confirmed.';
      retry.hidden = true;
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const row = document.createElement('li');
          const name = document.createElement('span');
          const quantity = document.createElement('span');
          name.textContent = item.name;
          quantity.textContent = `× ${item.quantity}`;
          row.append(name, quantity);
          list.append(row);
        }
        list.hidden = !list.children.length;
      }
      back.textContent = 'start a new cart ↗';
      back.addEventListener('click', () => { try { localStorage.removeItem('bp-cart-v1'); } catch {} }, { once: true });
    } else if (order.status === 'pending') {
      title.textContent = 'payment pending';
      message.textContent = 'your payment has not been confirmed yet. check again shortly.';
      retry.hidden = false;
    } else if (order.status === 'not_paid') {
      title.textContent = 'payment not completed';
      message.textContent = 'your payment has not been confirmed. return to your cart to try again.';
      retry.hidden = true;
    } else {
      throw new Error('Invalid status');
    }
  } catch {
    title.textContent = 'unable to check your payment';
    message.textContent = 'please try again or contact me before attempting another payment.';
    retry.hidden = false;
  } finally {
    busy = false;
    retry.disabled = false;
  }
}
retry.addEventListener('click', checkPayment);
checkPayment();
