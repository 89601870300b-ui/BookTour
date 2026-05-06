const { sendNewReviewNotification } = require('../services/emailService');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const reviewsPath = path.join(__dirname, '..', 'data', 'reviews.json');
const contactsPath = path.join(__dirname, '..', 'data', 'contacts.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// === ОТЗЫВЫ ===
router.get('/reviews', (req, res) => {
  const reviews = readJSON(reviewsPath);
  res.json(reviews);
});

router.post('/reviews', async (req, res) => {
  const { name, book, rating, text } = req.body;
  if (!name || !book || !rating || !text) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  const reviews = readJSON(reviewsPath);
  const newReview = {
    id: Date.now(),
    name,
    book,
    rating: parseInt(rating),
    text,
    createdAt: new Date().toISOString()
  };
  reviews.push(newReview);
  writeJSON(reviewsPath, reviews);
  
  // Отправляем уведомление администратору (не блокируем ответ)
  try {
    await sendNewReviewNotification(process.env.ADMIN_EMAIL, name, book, rating, text);
  } catch (err) {
    console.error('Ошибка отправки уведомления об отзыве:', err.message);
  }
  
  res.status(201).json({ success: true, message: 'Спасибо за отзыв!' });
});

// === КОНТАКТЫ ===
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  const contacts = readJSON(contactsPath);
  contacts.push({
    id: Date.now(),
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  });
  writeJSON(contactsPath, contacts);
  res.json({ success: true, message: 'Сообщение отправлено' });
});

module.exports = router;