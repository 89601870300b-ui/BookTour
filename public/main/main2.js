// ========== 1. Аккордеон для жанров (работает на статических секциях) ==========
function initAccordion() {
  const sections = document.querySelectorAll('.genre-section');
  sections.forEach(section => {
    const row = section.querySelector('.genre-books-row');
    if (!row) return;
    // Начальное состояние: все ленты скрыты
    row.style.display = 'none';
    // Удаляем старые обработчики, чтобы не дублировать
    section.removeEventListener('click', accordionHandler);
    section.addEventListener('click', accordionHandler);
  });
}

function accordionHandler(e) {
  // Если клик по кнопке или карточке книги – не сворачиваем/разворачиваем
  if (e.target.closest('.book-card--mini') || e.target.closest('.js-add-to-cart')) return;
  const currentRow = this.querySelector('.genre-books-row');
  if (!currentRow) return;
  const isHidden = currentRow.style.display === 'none';
  // Скрываем все ленты
  document.querySelectorAll('.genre-section .genre-books-row').forEach(row => {
    row.style.display = 'none';
  });
  // Если была скрыта – показываем
  if (isHidden) currentRow.style.display = 'flex';
}

// ========== 2. Применение скидок флешмоба для фантастики (без удаления секций) ==========
async function applyFlashmobDiscounts() {
  try {
    const res = await fetch('/api/flashmob-status');
    const { active } = await res.json();
    if (!active) return;

    // Ищем статическую секцию фантастики по ID
    const scifiSection = document.getElementById('genre-scifi');
    if (!scifiSection) return;
    const prices = scifiSection.querySelectorAll('.book-card__price');
    prices.forEach(priceEl => {
      const base = parseInt(priceEl.dataset.basePrice);
      if (base) {
        const discounted = Math.round(base * 0.8);
        priceEl.textContent = discounted + ' ₽';
        priceEl.classList.add('price--discount');
      }
    });
  } catch (err) {
    console.warn('Не удалось применить скидки');
  }
}

// ========== 3. Дополнительно: привязываем кнопки корзины (если global уже загружен) ==========
function bindCartButtonsFromGlobal() {
  if (window.global && window.global.bindCartButtons) {
    window.global.bindCartButtons();
  } else {
    // Если global ещё не загрузился, ждём
    setTimeout(bindCartButtonsFromGlobal, 100);
  }
}

// ========== 4. Запуск при загрузке страницы ==========
document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем аккордеон (скрываем все ленты книг)
  initAccordion();
  // Применяем скидки флешмоба, если активен
  applyFlashmobDiscounts();
  // Привязываем обработчики к кнопкам "Положить в корзину"
  bindCartButtonsFromGlobal();
});