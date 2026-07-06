/* ==========================================================
   BUY PAGE — app picker + form logic
   ========================================================== */
(function initBuyPage() {
  const picker = document.getElementById('app-picker');
  const hiddenApp = document.getElementById('selected-app');
  const noteEl = document.getElementById('buy-form-note');
  const submitBtn = document.getElementById('buy-submit-btn');
  const form = document.getElementById('buy-form');
  const status = document.getElementById('buy-form-status');

  if (!picker || typeof PROJECTS === 'undefined') return;

  // Filter only apps that have a price
  const apps = PROJECTS.filter(p => p.category === 'apps' && p.price);

  if (apps.length === 0) {
    picker.innerHTML = '<p class="buy-empty" data-i18n="buy_no_apps">No apps available for purchase yet.</p>';
    return;
  }

  // If we arrived via a project card's "Buy" button (buy.html?app=Title),
  // lock the picker to that one app and don't show the others at all.
  const params = new URLSearchParams(window.location.search);
  const requestedTitle = params.get('app');
  const isCrypto = params.get('method') === 'crypto';
  const preselected = requestedTitle ? apps.find(p => p.title === requestedTitle) : null;

  const cryptoNotice = document.getElementById('crypto-notice');
  if (isCrypto && cryptoNotice) cryptoNotice.hidden = false;

  let selectedTitle = preselected ? preselected.title : '';

  function priceLabel(p) {
    return isCrypto
      ? `$${p.price.toFixed(2)} (${t('buy_crypto_price_suffix')})`
      : `$${p.price.toFixed(2)}`;
  }

  function selectApp(p) {
    selectedTitle = p.title;
    hiddenApp.value = isCrypto
      ? `${p.title} — $${p.price.toFixed(2)} — USDT / crypto`
      : `${p.title} — $${p.price.toFixed(2)}`;
    submitBtn.disabled = false;
    noteEl.hidden = true;
  }

  function renderPicker() {
    picker.innerHTML = '';

    if (preselected) {
      // Locked mode: show only the app the user came from, not clickable/swappable.
      const card = document.createElement('div');
      card.className = 'app-pick-card is-selected app-pick-card--locked';
      card.innerHTML = `
        <span class="app-pick-card__name">${preselected.title}</span>
        <span class="app-pick-card__price">${priceLabel(preselected)}</span>
      `;
      picker.appendChild(card);
      return;
    }

    // Fallback (e.g. visiting buy.html directly, with no ?app= param):
    // show every purchasable app so the person can pick one.
    apps.forEach(p => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'app-pick-card' + (selectedTitle === p.title ? ' is-selected' : '');
      card.innerHTML = `
        <span class="app-pick-card__name">${p.title}</span>
        <span class="app-pick-card__price">${priceLabel(p)}</span>
      `;
      card.addEventListener('click', () => {
        selectApp(p);
        renderPicker();
      });
      picker.appendChild(card);
    });
  }

  if (preselected) selectApp(preselected);
  renderPicker();

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = t('sending');
    status.textContent = '';
    status.className = 'form-status';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        status.textContent = t('sent_success');
        status.className = 'form-status is-success';
        form.reset();

        if (preselected) {
          // Still locked to the same app — just re-arm the hidden field.
          selectApp(preselected);
        } else {
          selectedTitle = '';
          hiddenApp.value = '';
          submitBtn.disabled = true;
          noteEl.hidden = false;
        }
        renderPicker();
      } else {
        status.textContent = t('sent_error');
        status.className = 'form-status is-error';
      }
    } catch {
      status.textContent = t('network_error');
      status.className = 'form-status is-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('buy_submit');
    }
  });
})();