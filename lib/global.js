// ==================== ГЛОБАЛЬНЫЙ СКРИПТ ====================
// Работает на всех страницах: авторизация (модальное окно), корзина, добавление товаров

// ========== 1. Обновление счётчика корзины ==========
async function updateCartCount() {
  try {
    const res = await fetch('/api/cart');
    if (res.ok) {
      const cart = await res.json();
      const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const counter = document.getElementById('cartCount');
      if (counter) counter.textContent = total;
    }
  } catch (err) {
    console.warn('Не удалось обновить корзину');
  }
}

// ========== 2. Добавление товара в корзину ==========
async function addToCart(productId) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    if (res.ok) {
      await updateCartCount();
      return true;
    }
  } catch (err) {
    console.error('Ошибка добавления в корзину', err);
  }
  return false;
}

// ========== 3. Обработчик клика по кнопке "Положить в корзину" ==========
// Храним действие, которое нужно выполнить после авторизации
let pendingAction = null;

async function handleCartClick(e) {
  const btn = e.currentTarget;
  const productId = btn.dataset.id;
  if (!productId) return;

  // Проверяем авторизацию
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  if (!data.user) {
    // Не авторизован – сохраняем действие и показываем модалку
    pendingAction = async () => {
      await addToCart(productId);
      btn.classList.add('btn--pulse');
      setTimeout(() => btn.classList.remove('btn--pulse'), 200);
    };
    showModal();
    return;
  }
  // Авторизован – добавляем сразу
  await addToCart(productId);
  btn.classList.add('btn--pulse');
  setTimeout(() => btn.classList.remove('btn--pulse'), 200);
}

// ========== 4. Привязка обработчиков ко всем кнопкам .js-add-to-cart ==========
function bindCartButtons() {
  document.querySelectorAll('.js-add-to-cart').forEach(btn => {
    btn.removeEventListener('click', handleCartClick);
    btn.addEventListener('click', handleCartClick);
  });
}

// ========== 5. Модальное окно (создаём один раз) ==========
function createModal() {
  if (document.getElementById('authModal')) return;

  const modalHTML = `
    <div id="authModal" class="modal" style="display:none;">
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div class="modal-tabs">
          <button class="modal-tab active" data-tab="login">Вход</button>
          <button class="modal-tab" data-tab="register">Регистрация</button>
        </div>
        <div id="modal-login" class="modal-form active">
          <form id="modalLoginForm">
            <div class="form-row">
              <label>Email</label>
              <input type="email" id="modalLoginEmail" required>
            </div>
            <div class="form-row">
              <label>Пароль</label>
              <input type="password" id="modalLoginPassword" required>
            </div>
            <button type="submit" class="btn">Войти</button>
          </form>
          <div id="modalLoginMessage" class="modal-message"></div>
        </div>
        <div id="modal-register" class="modal-form">
          <form id="modalRegisterForm">
            <div class="form-row">
              <label>Имя</label>
              <input type="text" id="modalRegName" required>
            </div>
            <div class="form-row">
              <label>Email</label>
              <input type="email" id="modalRegEmail" required>
            </div>
            <div class="form-row">
              <label>Пароль (мин. 6 символов)</label>
              <input type="password" id="modalRegPassword" required>
            </div>
            <button type="submit" class="btn">Зарегистрироваться</button>
          </form>
          <div id="modalRegisterMessage" class="modal-message"></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('authModal');
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.onclick = () => {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};
window.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
};

  // Переключение вкладок
  const tabs = modal.querySelectorAll('.modal-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('modal-login').classList.toggle('active', target === 'login');
      document.getElementById('modal-register').classList.toggle('active', target === 'register');
      // Очищаем сообщения об ошибках
      document.getElementById('modalLoginMessage').innerHTML = '';
      document.getElementById('modalRegisterMessage').innerHTML = '';
    });
  });
}

function showModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'flex';
    // Небольшая задержка, чтобы display успел примениться
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }
}
function bindModalForms() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  // Обработчик входа
  const loginForm = document.getElementById('modalLoginForm');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('modalLoginEmail').value.trim();
      const password = document.getElementById('modalLoginPassword').value;
      const msgDiv = document.getElementById('modalLoginMessage');
      msgDiv.innerHTML = '';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          modal.style.display = 'none';
          await loadUser();        // обновить шапку
          await updateCartCount(); // обновить корзину
          if (pendingAction) {
            pendingAction();
            pendingAction = null;
          }
        } else {
          msgDiv.innerHTML = `<div class="modal-message error">${data.error || 'Ошибка входа'}</div>`;
        }
      } catch (err) {
        msgDiv.innerHTML = '<div class="modal-message error">Ошибка соединения</div>';
      }
    };
  }

  // Обработчик регистрации
  const registerForm = document.getElementById('modalRegisterForm');
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('modalRegName').value.trim();
      const email = document.getElementById('modalRegEmail').value.trim();
      const password = document.getElementById('modalRegPassword').value;
      const msgDiv = document.getElementById('modalRegisterMessage');
      msgDiv.innerHTML = '';
      if (password.length < 6) {
        msgDiv.innerHTML = '<div class="modal-message error">Пароль должен содержать минимум 6 символов</div>';
        return;
      }
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
          modal.style.display = 'none';
          await loadUser();
          await updateCartCount();
          if (pendingAction) {
            pendingAction();
            pendingAction = null;
          }
        } else {
          msgDiv.innerHTML = `<div class="modal-message error">${data.error || 'Ошибка регистрации'}</div>`;
        }
      } catch (err) {
        msgDiv.innerHTML = '<div class="modal-message error">Ошибка соединения</div>';
      }
    };
  }
}

// ========== 6. Загрузка пользователя и модификация шапки (только "Войти") ==========
async function loadUser() {
  try {
    const res = await fetch('/api/auth/me');
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (res.ok) {
      const { user } = await res.json();
      userArea.innerHTML = '';

      if (user) {
        // Авторизован: показываем имя + выпадающее меню
        const nameSpan = document.createElement('span');
        nameSpan.className = 'user-name';
        nameSpan.textContent = user.name;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Выйти';
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch('/api/auth/logout');
          window.location.href = '/';
        });
        dropdown.appendChild(logoutLink);
        
        userArea.appendChild(nameSpan);
        userArea.appendChild(dropdown);
      } else {
        // Не авторизован: иконка пользователя
        const iconLink = document.createElement('div');
        iconLink.className = 'user-icon';
        iconLink.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        iconLink.addEventListener('click', (e) => {
          e.preventDefault();
          pendingAction = null;
          showModal();
        });
        userArea.appendChild(iconLink);
      }
    } else {
      // Ошибка – показываем иконку
      const iconLink = document.createElement('div');
      iconLink.className = 'user-icon';
      iconLink.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      iconLink.addEventListener('click', (e) => {
        e.preventDefault();
        pendingAction = null;
        showModal();
      });
      userArea.appendChild(iconLink);
    }
  } catch (err) {
    console.warn('Не удалось загрузить пользователя');
  }
}

// ========== 7. Инициализация при загрузке страницы ==========
document.addEventListener('DOMContentLoaded', () => {
  createModal();          // создаём модальное окно
  bindModalForms();       // привязываем обработчики форм
  updateCartCount();      // обновляем счётчик корзины
  loadUser();             // загружаем пользователя и обновляем шапку
  bindCartButtons();      // привязываем кнопки "В корзину"
});

// Экспортируем функции для использования в других скриптах (например, gallery.html)
window.global = { updateCartCount, addToCart, bindCartButtons, loadUser };

// Гамбургер-меню (открытие/закрытие)
const hamburger = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
let overlay = document.querySelector('.menu-overlay');
if (!overlay) {
  overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  document.body.appendChild(overlay);
}
function closeMenu() {
  mobileMenu.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}
if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}
overlay.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-nav a').forEach(link => {
  link.addEventListener('click', closeMenu);
});