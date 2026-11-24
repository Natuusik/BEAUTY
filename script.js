// 1. Инициализация Supabase (замени на свои ключи из настроек проекта)
const SUPABASE_URL = 'https://qjdeukalfoxpuolejuzg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_z2OWHa9xj1JMjHttwIqHQQ_G7Di2NrJ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Массив товаров будет заполняться данными из базы
let products = [];

// Состояние корзины: загружаем из localStorage
let cart = JSON.parse(localStorage.getItem('aura_cart')) || {};
let discountPercent = Number(localStorage.getItem('aura_discount')) || 0;

// Сохранение корзины в localStorage
function saveCartToStorage() {
  localStorage.setItem('aura_cart', JSON.stringify(cart));
  localStorage.setItem('aura_discount', discountPercent);
}

// Форматирование цены
function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₽';
}

// Управление открытием и закрытием корзины
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

// 2. Асинхронная загрузка товаров из базы данных Supabase
async function fetchProductsFromSupabase() {
  const loadingEl = document.getElementById('loading-catalog');
  
  try {
    // Делаем запрос к таблице 'products' в Supabase
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    products = data;
    loadingEl.style.display = 'none'; // Скрываем текст загрузки
    renderProducts();
    updateCart();

  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    loadingEl.textContent = 'Не удалось загрузить каталог из базы данных. Проверьте подключения.';
    loadingEl.style.color = '#c0392b';
  }
}

// 3. Отрисовка карточек в каталоге
function renderProducts() {
  const grid = document.getElementById('products-grid');
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

// 4. Добавление товара
function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  saveCartToStorage();
  renderProducts();
  updateCart();
}

// 5. Изменение количества внутри корзины
function changeQty(productId, delta) {
  const newQty = (cart[productId] || 0) + delta;

  if (newQty <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = newQty;
  }

  saveCartToStorage();
  renderProducts();
  updateCart();
}

// 6. Удаление товара
function removeItem(productId) {
  delete cart[productId];
  saveCartToStorage();
  renderProducts();
  updateCart();
}

// 7. Отрисовка корзины и расчеты
function updateCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = '';

  let totalCount = 0;
  let subtotal = 0;

  for (const id in cart) {
    // Ищем товар по id среди данных, загруженных из Supabase
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
            <button type="button" onclick="changeQty(${product.id}, -1)" title="Уменьшить">−</button>
            <span>${qty}</span>
            <button type="button" onclick="changeQty(${product.id}, 1)" title="Увеличить">+</button>
          </div>
        </div>

        <div class="cart-item-right">
          <button type="button" class="remove-item-btn" onclick="removeItem(${product.id})" title="Удалить товар">✕</button>
          <span class="cart-item-sum">${formatPrice(itemTotal)}</span>
        </div>
      </div>
    `;
    cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
  }

  if (totalCount === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пока пуста.<br>Добавьте понравившиеся средства из каталога!</p>';
  }

  // Расчет скидки
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const afterDiscount = subtotal - discountAmount;

  // Расчет доставки (бесплатно от 3 500 ₽)
  let delivery = 0;
  if (totalCount > 0 && afterDiscount < 3500) {
    delivery = 350;
  }

  const finalTotal = afterDiscount + delivery;

  // Обновление интерфейса
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

// Очистка корзины
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

// Промокод
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

// Оформление заказа
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

// Запуск приложения — загружаем данные из Supabase при старте
fetchProductsFromSupabase();