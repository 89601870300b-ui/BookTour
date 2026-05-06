require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');

// Импорт роутов
const productsRouter = require('./routes/products');
const feedbackRouter = require('./routes/feedback');
const cartRouter = require('./routes/cart');
const authRouter = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/lib', express.static(path.join(__dirname, 'lib')));

// Флешмоб активен 1 час после старта сервера
let flashmobEndTime = Date.now() + 5 * 60 * 1000;

app.get('/api/flashmob-status', (req, res) => {
  const now = Date.now();
  const active = now < flashmobEndTime;
  const remainingSeconds = active ? Math.floor((flashmobEndTime - now) / 1000) : 0;
  res.json({ active, remainingSeconds });
});

// Сессии (обязательно перед роутами)
app.use(session({
  secret: 'booktour-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// API роуты – ВАЖНО: все с префиксом /api
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/auth', authRouter);

// Корневой маршрут – отдаём index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));