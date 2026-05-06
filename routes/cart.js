const express = require('express');
const router = express.Router();

// Получить корзину
router.get('/', (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  res.json(req.session.cart);
});

// Добавить товар
router.post('/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Не указан productId' });
  }

  if (!req.session.cart) req.session.cart = [];

  const existing = req.session.cart.find(item => item.id == productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    req.session.cart.push({ id: productId, quantity });
  }

  res.json({ success: true, cart: req.session.cart });
});

// Удалить товар
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.filter(item => item.id != productId);
  res.json({ success: true, cart: req.session.cart });
});

// Очистить корзину
router.post('/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
});

module.exports = router;