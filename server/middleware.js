const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Берем токен из заголовка запроса
    const token = req.header("token");

    if (!token) {
        return res.status(403).json("Вы не авторизованы");
    }

    try {
        // Проверяем, настоящий ли токен
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify; // Записываем данные пользователя в запрос
        next(); // Пропускаем дальше
    } catch (err) {
        res.status(401).json("Токен недействителен");
    }
};