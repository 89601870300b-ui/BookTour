// services/emailService.js
const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null; // сохраним для логина

async function getTransporter() {
    if (transporter) return transporter;
    // Создаём тестовый аккаунт один раз
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    console.log(`\n📧 Ethereal тестовый аккаунт создан:`);
    console.log(`   Логин: ${testAccount.user}`);
    console.log(`   Пароль: ${testAccount.pass}`);
    console.log(`🔗 Веб-интерфейс: https://ethereal.email/login (используйте логин/пароль выше)\n`);
    return transporter;
}

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: '"BookTour" <booktour@ethereal.email>',
            to,
            subject,
            html,
        });
        console.log(`✅ Письмо отправлено на ${to}. Ethereal ID: ${info.messageId}`);
        
        // Безопасно получаем URL для просмотра письма (если доступен)
        let previewUrl = null;
        try {
            previewUrl = nodemailer.getTestMessageUrl(info);
        } catch (urlErr) {
            // Если метод не сработал – игнорируем
        }
        if (previewUrl) {
            console.log(`🔗 Превью письма: ${previewUrl}`);
        } else {
            console.log(`💡 Совет: для просмотра письма войдите в веб-интерфейс Ethereal по ссылке выше.`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при отправке на ${to}:`, error.message);
        return false;
    }
};

// Уведомление администратору о новой регистрации
const sendNewUserNotification = async (adminEmail, name, userEmail) => {
    const subject = '🔔 Новый пользователь зарегистрировался в BookTour';
    const html = `
        <div>
            <h2>Новая регистрация</h2>
            <p><b>Имя:</b> ${name}</p>
            <p><b>Email:</b> ${userEmail}</p>
            <p>Пользователь успешно создан.</p>
        </div>
    `;
    await sendEmail({ to: adminEmail, subject, html });
};

// Уведомление администратору о новом отзыве
const sendNewReviewNotification = async (adminEmail, userName, bookTitle, rating, reviewText) => {
    const subject = '📖 Новый отзыв на BookTour';
    const html = `
        <div>
            <h2>Новый отзыв</h2>
            <p><b>Пользователь:</b> ${userName}</p>
            <p><b>Книга:</b> ${bookTitle}</p>
            <p><b>Оценка:</b> ${rating}/5</p>
            <p><b>Текст:</b></p>
            <p>${reviewText}</p>
        </div>
    `;
    await sendEmail({ to: adminEmail, subject, html });
};

module.exports = { sendNewUserNotification, sendNewReviewNotification };