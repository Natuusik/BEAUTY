// 1. Инициализация Supabase (замени на свои ключи из настроек проекта)
const SUPABASE_URL = 'https://qjdeukalfoxpuolejuzg.supabase.co/rest/v1/products';
const SUPABASE_ANON_KEY = 'sb_publishable_z2OWHa9xj1JMjHttwIqHQQ_G7Di2NrJ';

// 1. База товаров прямо в коде (работает стабильно и быстро)
const products = [
  {
    id: 1,
    badge: 'Хит продаж',
    icon: '🧴',
    title: 'Увлажняющий крем с центеллой',
    desc: 'Интенсивное увлажнение на 24 часа без липкости. Успокаивает и укрепляет защитный барьер.',
    volume: '50 мл • Все типы кожи',
    price: 1890
  },
  {
    id: 2,
    badge: 'Тренд',
    icon: '💄',
    title: 'Масло-тинт для губ Mirror Glow',
    desc: 'Зеркальный глянцевый финиш и уход бальзама. Подстраивается под естественный pH губ.',
    volume: '4.5 мл • Нежный розовый',
    price: 1250
  },
  {
    id: 3,
    badge: 'Очищение',
    icon: '✨',
    title: 'Энзимная пудра с витамином С',
    desc: 'Деликатное обновление кожи без скрабирующих частиц. Сужает поры и выравнивает тон.',
    volume: '75 г • Хватает на 4 мес.',
    price: 1650
  },
  {
    id: 4,
    badge: 'Новинка',
    icon: '💧',
    title: 'Сыворотка с пептидами и ниацинамидом',
    desc: 'Повышает упругость кожи, разглаживает мелкие морщинки и возвращает здоровое сияние.',
    volume: '30 мл • Антивозрастной уход',
    price: 2400
  }
];

// 2. Состояние корзины и скидки (загрузка из localStorage — «базы» браузера)
let cart = JSON.parse(localStorage.getItem('aura_cart')) || {};
let discountPercent = Number(localStorage.getItem('aura_discount')) || 0;

// Функция сохранения данных корзины в браузер
function saveCartToStorage() {
  localStorage.setItem('aura_cart', JSON.stringify(cart));
  localStorage.setItem('aura_discount', discountPercent);
}

function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₽';
}

// Управление выдвижной корзиной (Drawer)
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');

function openCart() {
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  cartDrawer.setAttribute('aria-hidden', 'false');
}

function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  cartDrawer.setAttribute('aria-hidden', 'true');
}

document.getElementById('open-cart-btn').addEventListener('click', openCart);
document.getElementById('close-cart-btn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCart();
});

// 3. Отрисовка карточек товаров в каталоге
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  products.forEach(product => {
    const qty = cart[product.id] || 0;

    const buttonHTML = qty > 0
      ? `<button class="btn-in-cart" onclick="openCart()">В корзине (${qty}) →</button>`
      : `<button class="btn-add" onclick="addToCart(${product.id})">В корзину</button>`;

    const cardHTML = `
      <article class="card">
        <div>
          <span class="card-badge">${product.badge}</span>
          <div class="card-img-placeholder">${product.icon}</div>
          <h3 class="card-title">${product.title}</h3>
          <p class="card-desc">${product.desc}</p>
        </div>
        <div>
          <div class="card-meta">${product.volume}</div>
          <div class="card-footer">
            <span class="card-price">${formatPrice(product.price)}</span>
            ${buttonHTML}
          </div>
        </div>
      </article>
    `;

    grid.insertAdjacentHTML('beforeend', cardHTML);
  });
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  saveCartToStorage(); // Сохраняем в localStorage
  renderProducts();
  updateCart();
}

function changeQty(productId, delta) {
  const newQty = (cart[productId] || 0) + delta;
  if (newQty <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = newQty;
  }
  saveCartToStorage(); // Сохраняем в localStorage
  renderProducts();
  updateCart();
}

function removeItem(productId) {
  delete cart[productId];
  saveCartToStorage(); // Сохраняем в localStorage
  renderProducts();
  updateCart();
}

// 4. Расчеты и обновление корзины
function updateCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';

  let totalCount = 0;
  let subtotal = 0;

  for (const id in cart) {
    const product = products.find(p => p.id === Number(id));
    if (!product) continue;
    const qty = cart[id];
    const itemTotal = product.price * qty;

    totalCount += qty;
    subtotal += itemTotal;

    const itemHTML = `
      <div class="cart-item">
        <div class="cart-item-icon">${product.icon}</div>
        <div class="cart-item-body">
          <div class="cart-item-title">${product.title}</div>
          <div class="cart-item-unit-price">${formatPrice(product.price)} / шт.</div>
          <div class="qty-control">
            <button type="button" onclick="changeQty(${product.id}, -1)">−</button>
            <span>${qty}</span>
            <button type="button" onclick="changeQty(${product.id}, 1)">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <button type="button" class="remove-item-btn" onclick="removeItem(${product.id})">✕</button>
          <span class="cart-item-sum">${formatPrice(itemTotal)}</span>
        </div>
      </div>
    `;
    cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
  }

  if (totalCount === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пока пуста.<br>Добавьте понравившиеся средства из каталога!</p>';
  }

  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const afterDiscount = subtotal - discountAmount;
  let delivery = (totalCount > 0 && afterDiscount < 3500) ? 350 : 0;
  const finalTotal = afterDiscount + delivery;

  document.getElementById('header-count').textContent = totalCount;
  document.getElementById('header-total').textContent = formatPrice(finalTotal);
  document.getElementById('drawer-count').textContent = totalCount;
  document.getElementById('subtotal-price').textContent = formatPrice(subtotal);

  const discountRow = document.getElementById('discount-row');
  if (discountAmount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('discount-amount').textContent = '−' + formatPrice(discountAmount);
    document.getElementById('promo-input').value = 'BEAUTY15';
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('delivery-price').textContent =
    totalCount === 0 ? '0 ₽' : (delivery === 0 ? 'Бесплатно' : formatPrice(delivery));

  const hint = document.getElementById('delivery-hint');
  if (totalCount === 0) {
    hint.textContent = 'Бесплатная доставка при заказе от 3 500 ₽';
  } else if (afterDiscount < 3500) {
    hint.textContent = `Добавьте товаров еще на ${formatPrice(3500 - afterDiscount)} для бесплатной доставки`;
  } else {
    hint.textContent = '🎉 Вам доступна бесплатная доставка!';
  }

  document.getElementById('final-price').textContent = formatPrice(finalTotal);
  document.getElementById('checkout-btn').disabled = totalCount === 0;
  document.getElementById('clear-cart-btn').style.display = totalCount > 0 ? 'block' : 'none';
}

document.getElementById('clear-cart-btn').addEventListener('click', () => {
  cart = {};
  discountPercent = 0;
  localStorage.removeItem('aura_cart');
  localStorage.removeItem('aura_discount');
  document.getElementById('promo-input').value = '';
  document.getElementById('promo-message').textContent = '';
  renderProducts();
  updateCart();
});

document.getElementById('apply-promo-btn').addEventListener('click', () => {
  const input = document.getElementById('promo-input').value.trim().toUpperCase();
  const msg = document.getElementById('promo-message');

  if (input === 'BEAUTY15') {
    discountPercent = 15;
    msg.style.color = '#2e8b57';
    msg.textContent = 'Промокод BEAUTY15 применен: скидка 15%!';
  } else {
    discountPercent = 0;
    msg.style.color = '#c0392b';
    msg.textContent = 'Неверный промокод. Попробуйте BEAUTY15';
  }

  saveCartToStorage();
  updateCart();
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  const totalText = document.getElementById('final-price').textContent;
  alert(`Спасибо за заказ! Итоговая сумма: ${totalText}`);
  cart = {};
  discountPercent = 0;
  localStorage.removeItem('aura_cart');
  localStorage.removeItem('aura_discount');
  document.getElementById('promo-input').value = '';
  document.getElementById('promo-message').textContent = '';
  renderProducts();
  updateCart();
  closeCart();
});

// Запуск при загрузке страницы
renderProducts();
updateCart();
renderProducts();
updateCart();
