const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '..', 'data', 'products.json');

function readProducts() {
  const data = fs.readFileSync(productsPath, 'utf8');
  return JSON.parse(data);
}

// GET /api/products – все книги по жанрам
router.get('/', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки каталога' });
  }
});

// GET /api/products/:id – конкретная книга
router.get('/:id', (req, res) => {
  try {
    const products = readProducts();
    const allBooks = products.flatMap(genre => genre.books);
    const book = allBooks.find(b => b.id == req.params.id);
    if (!book) return res.status(404).json({ error: 'Книга не найдена' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки книги' });
  }
});

module.exports = router;