// ========== 1. Карусель обложек ==========
(function setupHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  let index = 0;
  function showSlide(i) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('hero-slide--active', idx === i);
    });
  }
  function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide(index);
  }
  showSlide(index);
  setInterval(nextSlide, 4000);
})();

// ========== 2. Смена текстовых карточек new releases ==========
(function setupFeaturedBooks() {
  const books = document.querySelectorAll('.featured-book');
  if (!books.length) return;
  let current = 0;
  function show(i) {
    books.forEach((book, idx) => {
      book.classList.toggle('featured-book--active', idx === i);
    });
  }
  function next() {
    current = (current + 1) % books.length;
    show(current);
  }
  show(current);
  setInterval(next, 5000);
})();

// ========== 3. Флешмоб – получаем статус с сервера ==========
(async function setupFlashmobTimer() {
  const timerElement = document.getElementById('flashmob-timer');
  const endedElement = document.getElementById('flashmob-ended');
  const goButton = document.getElementById('flashmob-go');
  if (!timerElement) return;

  try {
    const res = await fetch('/api/flashmob-status');
    const data = await res.json();
    if (!data.active) {
      if (timerElement) timerElement.textContent = '00:00:00';
      if (endedElement) endedElement.hidden = false;
      if (goButton) {
        goButton.disabled = true;
        goButton.textContent = 'Акция завершена';
        goButton.classList.add('btn--disabled');
      }
      return;
    }

    let remaining = data.remainingSeconds;
    function format(sec) {
      const minutes = String(Math.floor(sec / 60)).padStart(2, '0');
      const seconds = String(sec % 60).padStart(2, '0');
      return `00:${minutes}:${seconds}`;
    }
    timerElement.textContent = format(remaining);
    const interval = setInterval(() => {
      if (remaining <= 1) {
        clearInterval(interval);
        location.reload();
      } else {
        remaining--;
        timerElement.textContent = format(remaining);
      }
    }, 1000);
  } catch (err) {
    console.error('Ошибка загрузки флешмоба', err);
  }
})();