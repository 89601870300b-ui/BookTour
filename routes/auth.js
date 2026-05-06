const { sendNewUserNotification } = require('../services/emailService');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
    const data = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

// Регистрация
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Заполните все поля (пароль минимум 6 символов)' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, passwordHash };
    users.push(newUser);
    writeUsers(users);

    req.session.user = { id: newUser.id, name, email };

    // Отправляем уведомление администратору (только на подтверждённый email)
    if (process.env.ADMIN_EMAIL) {
        await sendNewUserNotification(process.env.ADMIN_EMAIL, name, email);
    }

    res.json({ success: true, redirect: '/' });
});

// Логин
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Неверный email или пароль' });
    req.session.user = { id: user.id, name: user.name, email };
    res.json({ success: true, redirect: '/' });
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, redirect: '/' });
});

// Получить текущего пользователя
router.get('/me', (req, res) => {
    res.json({ user: req.session.user || null });
});

// Удаление пользователя по email
router.delete('/user/:email', async (req, res) => {
    const email = req.params.email;
    let users = readUsers();
    const initialLength = users.length;
    users = users.filter(u => u.email !== email);
    if (users.length === initialLength) return res.status(404).json({ error: 'Пользователь не найден' });
    writeUsers(users);
    res.json({ success: true, message: `Пользователь ${email} удалён` });
});

module.exports = router;