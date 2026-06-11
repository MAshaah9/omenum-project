const authorize = require('./middleware');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- ЛОГИКА АВТО-ОТМЕНЫ БРОНИРОВАНИЙ ---
// Если до квеста осталось менее 24 часов, а предоплата так и не внесена ('awaiting_deposit') — освобождаем слот и удаляем бронь.
const autoCancelBookings = async () => {
    try {
        // 1. Освобождаем временные слоты
        await pool.query(`
            UPDATE time_slots SET is_booked = false 
            WHERE id IN (
                SELECT ts.id FROM time_slots ts
                JOIN bookings b ON ts.quest_id = b.quest_id 
                               AND ts.slot_date = b.booking_date 
                               AND ts.slot_time = b.booking_time
                WHERE b.status = 'awaiting_deposit' 
                AND (ts.slot_date + ts.slot_time)::timestamp < (NOW() + INTERVAL '24 hours')
            )
        `);

        // 2. Удаляем просроченные бронирования
        await pool.query(`
            DELETE FROM bookings 
            WHERE status = 'awaiting_deposit' 
            AND (booking_date + booking_time)::timestamp < (NOW() + INTERVAL '24 hours')
        `);
    } catch (err) {
        console.error("Ошибка при автоматической отмене броней:", err.message);
    }
};

// Промежуточное ПО (Middleware) для автоматического запуска очистки при запросах к расписанию или квестам
const triggerAutoCancel = async (req, res, next) => {
    await autoCancelBookings();
    next();
};


// --- ОБЩИЕ МАРШРУТЫ ---

app.get('/', (req, res) => {
    res.send('Сервер Omenum работает!');
});

// 1. ПОЛУЧЕНИЕ ВСЕХ КВЕСТОВ (ОБНОВЛЕННЫЙ)
app.get('/api/quests', triggerAutoCancel, async (req, res) => {
    try {
        const allQuests = await pool.query(`
            SELECT q.*, 
            COALESCE(ROUND(AVG(r.rating), 1), 0) as average_rating
            FROM quests q
            LEFT JOIN reviews r ON q.id = r.quest_id AND r.status = 'approved'
            GROUP BY q.id ORDER BY q.id ASC
        `);
        res.json(allQuests.rows);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка сервера"); 
    }
});

// 2. ДЕТАЛИ КВЕСТА (ОБНОВЛЕННЫЙ — поле 'text' и 'approvedReviews')
app.get('/api/quests/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const quest = await pool.query("SELECT * FROM quests WHERE id = $1", [id]);
        
        if (quest.rows.length === 0) {
            return res.status(404).json("Квест не найден");
        }

        const images = await pool.query("SELECT * FROM quest_images WHERE quest_id = $1", [id]);
        const reviews = await pool.query(`
            SELECT r.id, r.rating, r.comment_text as text, r.admin_reply, u.full_name, u.avatar_border, u.nick_style 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.quest_id = $1 AND r.status = 'approved' 
            ORDER BY r.created_at DESC`, [id]);
        
        res.json({ 
            ...quest.rows[0], 
            gallery: images.rows, 
            approvedReviews: reviews.rows 
        });
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка"); 
    }
});


// --- АВТОРИЗАЦИЯ ---

// ОБНОВЛЕННЫЙ МАРШРУТ РЕГИСТРАЦИИ (Авто-логин + дефолтные значения полей)
app.post('/api/register', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length !== 0) return res.status(401).json("Email уже занят");

        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // ВАЖНО: Прописываем все дефолтные значения вручную для надежности
        const newUser = await pool.query(
            `INSERT INTO users 
            (full_name, email, password, role, bonuses, pending_discount, avatar_border, nick_style, is_blocked) 
            VALUES ($1, $2, $3, 'client', 0, 0, 'none', 'normal', false) RETURNING *`,
            [full_name, email, bcryptPassword]
        );

        // Сразу создаем токен, чтобы пользователь мог бронировать без перелогина
        const token = jwt.sign(
            { id: newUser.rows[0].id, role: newUser.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token, user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Ошибка при регистрации");
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(401).json("Неверный email или пароль");

        // Проверка на блокировку аккаунта администратором
        if (user.rows[0].is_blocked) {
            return res.status(403).json("Ваш аккаунт заблокирован администратором. Доступ ограничен.");
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(401).json("Неверный email или пароль");

        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({ 
            token, 
            user: { 
                full_name: user.rows[0].full_name, 
                bonuses: user.rows[0].bonuses, 
                role: user.rows[0].role 
            } 
        });
    } catch (err) {
        res.status(500).send("Ошибка при входе");
    }
});


// --- ЛИЧНЫЙ КАБИНЕТ (КЛИЕНТ) ---

app.patch('/api/user/update', authorize, async (req, res) => {
    try {
        const { full_name, avatar_url } = req.body;
        const userId = req.user.id;

        const checkName = await pool.query("SELECT * FROM users WHERE full_name = $1 AND id != $2", [full_name, userId]);
        if (checkName.rows.length > 0) {
            return res.status(400).json("Это имя уже занято другим игроком");
        }

        const updatedUser = await pool.query(
            "UPDATE users SET full_name = $1, avatar_url = $2 WHERE id = $3 RETURNING full_name, avatar_url",
            [full_name, avatar_url, userId]
        );

        res.json({ 
            message: "Профиль успешно обновлен", 
            full_name: updatedUser.rows[0].full_name,
            avatar_url: updatedUser.rows[0].avatar_url 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Ошибка при обновлении профиля");
    }
});

app.get('/api/user/me', authorize, async (req, res) => {
    try {
        const user = await pool.query(
            "SELECT id, full_name, email, role, bonuses, avatar_url, avatar_border, nick_style, pending_discount FROM users WHERE id = $1", 
            [req.user.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Ошибка сервера");
    }
});

app.get('/api/user/bookings', authorize, async (req, res) => {
    try {
        const userBookings = await pool.query(`
            SELECT 
                bookings.id, 
                quests.title, 
                bookings.booking_date, 
                bookings.booking_time, 
                bookings.status,
                bookings.total_price,
                bookings.deposit_amount,
                bookings.players_count
            FROM bookings
            JOIN quests ON bookings.quest_id = quests.id
            WHERE bookings.user_id = $1
            ORDER BY bookings.booking_date DESC
        `, [req.user.id]);
        
        res.json(userBookings.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка загрузки ваших бронирований");
    }
});

app.get('/api/user/reviews', authorize, async (req, res) => {
    try {
        const reviews = await pool.query(
            "SELECT reviews.*, quests.title FROM reviews JOIN quests ON reviews.quest_id = quests.id WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(reviews.rows);
    } catch (err) { 
        res.status(500).send("Ошибка загрузки ваших отзывов"); 
    }
});

app.post('/api/user/waitlist', authorize, async (req, res) => {
    try {
        const { quest_id, date, slot_date } = req.body;
        const targetDate = slot_date || date; 
        const user_id = req.user.id;

        if (!quest_id || !targetDate) {
            return res.status(400).json("Не все данные переданы (quest_id или date)");
        }

        const check = await pool.query(
            "SELECT * FROM waitlist WHERE user_id = $1 AND quest_id = $2 AND slot_date = $3",
            [user_id, quest_id, targetDate]
        );

        if (check.rows.length > 0) {
            return res.status(400).json("Вы уже в очереди на эту дату");
        }

        await pool.query(
            "INSERT INTO waitlist (user_id, quest_id, slot_date) VALUES ($1, $2, $3)",
            [user_id, quest_id, targetDate]
        );

        res.json("Вы успешно добавлены в лист ожидания!");
    } catch (err) {
        console.error("ОШИБКА WAITLIST:", err.message);
        res.status(500).send("Ошибка сервера при записи");
    }
});

app.get('/api/user/waitlist', authorize, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT w.*, q.title as quest_title 
             FROM waitlist w 
             JOIN quests q ON w.quest_id = q.id 
             WHERE w.user_id = $1 
             ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Ошибка загрузки очереди");
    }
});


// --- ИМИТАЦИЯ ОПЛАТЫ ПРЕДОПЛАТЫ КЛИЕНТОМ ---
app.patch('/api/user/pay-deposit/:id', authorize, async (req, res) => {
    try {
        const { sender_card } = req.body;
        const bookingId = req.params.id;

        await pool.query(
            "UPDATE bookings SET is_deposit_paid = true, status = 'paid', sender_card = $1 WHERE id = $2",
            [sender_card, bookingId]
        );
        res.json("Оплата произведена успешно. Ожидайте начисления бонусов админом.");
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка оплаты"); 
    }
});

// УДАЛЕНИЕ (ОТМЕНА) БРОНИ КЛИЕНТОМ
app.delete('/api/user/cancel-booking/:id', authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await pool.query("SELECT * FROM bookings WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (booking.rows.length === 0) return res.status(404).json("Бронь не найдена");

        const questDate = new Date(booking.rows[0].booking_date);
        const now = new Date();
        if ((questDate - now) / (1000 * 60 * 60) < 24) {
            return res.status(400).json("До квеста меньше 24 часов. Отмена невозможна.");
        }

        await pool.query("UPDATE time_slots SET is_booked = false WHERE slot_date = $1 AND slot_time = $2", [booking.rows[0].booking_date, booking.rows[0].booking_time]);
        await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
        res.json("Бронирование отменено");
    } catch (err) { res.status(500).send("Ошибка сервера"); }
});


// --- ИЗБРАННОЕ (FAVORITES) ---

app.post('/api/favorites/toggle', authorize, async (req, res) => {
    try {
        const { quest_id } = req.body;
        const user_id = req.user.id;

        const exists = await pool.query("SELECT * FROM favorites WHERE user_id = $1 AND quest_id = $2", [user_id, quest_id]);

        if (exists.rows.length > 0) {
            await pool.query("DELETE FROM favorites WHERE user_id = $1 AND quest_id = $2", [user_id, quest_id]);
            return res.json({ status: 'removed' });
        } else {
            await pool.query("INSERT INTO favorites (user_id, quest_id) VALUES ($1, $2)", [user_id, quest_id]);
            return res.json({ status: 'added' });
        }
    } catch (err) { res.status(500).send("Ошибка избранного"); }
});

app.get('/api/user/favorites', authorize, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT q.* FROM quests q JOIN favorites f ON q.id = f.quest_id WHERE f.user_id = $1",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).send("Ошибка загрузки избранного"); }
});


// --- ОТЗЫВЫ (REVIEWS) ---

app.get('/api/reviews/:questId', async (req, res) => {
    try {
        const { questId } = req.params;
        const reviews = await pool.query(`
            SELECT reviews.*, users.full_name, users.avatar_url, users.avatar_border, users.nick_style 
            FROM reviews 
            JOIN users ON reviews.user_id = users.id 
            WHERE quest_id = $1 AND status = 'approved' 
            ORDER BY created_at DESC`, 
            [questId]
        );
        res.json(reviews.rows);
    } catch (err) { 
        res.status(500).send("Ошибка загрузки отзывов"); 
    }
});

app.post('/api/reviews', authorize, async (req, res) => {
    try {
        const { booking_id, rating, comment_text } = req.body;
        const user_id = req.user.id;

        const booking = await pool.query(
            "SELECT quest_id FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'completed'",
            [booking_id, user_id]
        );

        if (booking.rows.length === 0) {
            return res.status(403).json("Вы не можете оставить отзыв. Квест должен быть пройден (статус 'Завершено').");
        }

        const existingReview = await pool.query("SELECT * FROM reviews WHERE booking_id = $1", [booking_id]);
        if (existingReview.rows.length > 0) {
            return res.status(400).json("Вы уже оставили отзыв для этого посещения.");
        }

        await pool.query(
            "INSERT INTO reviews (booking_id, user_id, quest_id, rating, comment_text, status) VALUES ($1, $2, $3, $4, $5, 'pending')",
            [booking_id, user_id, booking.rows[0].quest_id, rating, comment_text]
        );

        res.json("Отзыв отправлен на модерацию!");
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка при сохранении отзыва"); 
    }
});


// --- РАСПИСАНИЕ И БРОНИРОВАНИЕ ---

app.get('/api/slots/:questId', async (req, res) => {
    try {
        const { questId } = req.params;
        
        const slots = await pool.query(
            `SELECT * FROM time_slots 
             WHERE quest_id = $1 
             AND (slot_date + slot_time) > (NOW() + INTERVAL '3 hours')
             ORDER BY slot_date, slot_time`,
            [questId]
        );
        res.json(slots.rows);
    } catch (err) {
        res.status(500).send("Ошибка сервера");
    }
});

app.post('/api/book-slot', authorize, async (req, res) => {
    try {
        const { 
            slot_id, 
            players_count, 
            use_bonuses,
            final_price,      
            deposit_amount,   
            client_name, 
            client_phone, 
            client_email, 
            comment 
        } = req.body;
        
        const userId = req.user.id;

        const slot = await pool.query("SELECT * FROM time_slots WHERE id = $1", [slot_id]);
        if (slot.rows[0].is_booked) return res.status(400).json("Слот уже занят");

        const newBooking = await pool.query(
            `INSERT INTO bookings 
            (user_id, quest_id, booking_date, booking_time, status, total_price, deposit_amount, 
             client_name, client_phone, client_email, players_count, comment, use_bonuses, is_deposit_paid) 
            VALUES ($1, $2, $3, $4, 'awaiting_deposit', $5, $6, $7, $8, $9, $10, $11, $12, false) RETURNING id`,
            [
                userId, 
                slot.rows[0].quest_id, 
                slot.rows[0].slot_date, 
                slot.rows[0].slot_time, 
                final_price,      
                deposit_amount,   
                client_name, 
                client_phone, 
                client_email, 
                players_count, 
                comment, 
                use_bonuses
            ]
        );

        await pool.query("UPDATE time_slots SET is_booked = true WHERE id = $1", [slot_id]);

        res.json({ message: "Заявка создана! Оплатите предоплату в кабинете.", bookingId: newBooking.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка сервера");
    }
});


// --- АДМИН-ПАНЕЛЬ ---

app.get('/api/admin/users', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const allUsers = await pool.query(
            "SELECT id, full_name, email, role, bonuses, is_blocked FROM users ORDER BY id ASC"
        );
        res.json(allUsers.rows);
    } catch (err) { res.status(500).send("Ошибка сервера"); }
});

app.patch('/api/admin/users/:id/toggle-block', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { id } = req.params;
        const { is_blocked } = req.body;

        await pool.query("UPDATE users SET is_blocked = $1 WHERE id = $2", [is_blocked, id]);
        res.json(`Статус пользователя изменен на ${is_blocked ? 'Заблокирован' : 'Активен'}`);
    } catch (err) { res.status(500).send("Ошибка сервера"); }
});

app.post('/api/admin/quests', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");

        const { 
            title, description, short_description, price, 
            difficulty, max_players, genre, fear_level, 
            min_age, image_url, address, price_config 
        } = req.body;

        const newQuest = await pool.query(
            `INSERT INTO quests 
            (title, description, short_description, price, difficulty, max_players, genre, fear_level, min_age, image_url, address, price_config, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true) RETURNING *`,
            [
                title, description, short_description, price, 
                difficulty, max_players, genre, fear_level, 
                min_age, image_url, address, 
                JSON.stringify(price_config || []),
            ]
        );
        res.json(newQuest.rows[0]);
    } catch (err) {
        console.error("ОШИБКА ПРИ СОЗДАНИИ:", err.message);
        res.status(500).send("Ошибка сервера при создании");
    }
});

app.patch('/api/admin/quests/:id', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { id } = req.params;
        
        const { 
            title, description, short_description, price, 
            difficulty, max_players, genre, fear_level, 
            min_age, image_url, address, is_active, price_config 
        } = req.body;

        await pool.query(
            `UPDATE quests SET 
                title = $1, description = $2, short_description = $3, price = $4, 
                difficulty = $5, max_players = $6, genre = $7, fear_level = $8, 
                min_age = $9, image_url = $10, address = $11, is_active = $12, 
                price_config = $13 
            WHERE id = $14`,
            [
                title, description, short_description, price, 
                difficulty, max_players, genre, fear_level, 
                min_age, image_url, address, is_active, 
                JSON.stringify(price_config), 
                id
            ]
        );
        res.json("Данные квеста обновлены");
    } catch (err) {
        console.error("ОШИБКА СЕРВЕРА:", err.message);
        res.status(500).send("Ошибка сервера при обновлении");
    }
});

app.post('/api/admin/quests/:id/images', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");

        const { id } = req.params;
        const { image_url } = req.body;
        
        await pool.query("INSERT INTO quest_images (quest_id, image_url) VALUES ($1, $2)", [id, image_url]);
        res.json("Картинка добавлена");
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка при добавлении картинки"); 
    }
});

app.get('/api/admin/bookings', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");

        const result = await pool.query(`
            SELECT b.*, q.title as quest_title 
            FROM bookings b 
            JOIN quests q ON b.quest_id = q.id 
            ORDER BY b.booking_date DESC
        `);
        const revenue = await pool.query("SELECT SUM(deposit_amount) FROM bookings WHERE is_deposit_paid = true");
        res.json({ bookings: result.rows, totalRevenue: revenue.rows[0].sum || 0 });
    } catch (err) { res.status(500).send("Ошибка"); }
});

app.patch('/api/admin/bookings/:id', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { id } = req.params;
        const { status } = req.body;

        await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, id]);
        res.json("Статус успешно обновлен");
    } catch (err) {
        res.status(500).send("Ошибка при обновлении статуса");
    }
});

app.delete('/api/admin/bookings/:id', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { id } = req.params;
        const booking = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
        if (booking.rows.length > 0) {
            await pool.query("UPDATE time_slots SET is_booked = false WHERE slot_date = $1 AND slot_time = $2", [booking.rows[0].booking_date, booking.rows[0].booking_time]);
        }
        await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
        res.json("Запись удалена из реестра");
    } catch (err) { res.status(500).send("Ошибка удаления"); }
});

app.patch('/api/admin/credit-bonuses/:id', authorize, async (req, res) => {
    try {
        const { bonusAmount } = req.body; 
        const bookingId = req.params.id;

        const booking = await pool.query("SELECT user_id, use_bonuses FROM bookings WHERE id = $1", [bookingId]);
        const { user_id, use_bonuses } = booking.rows[0];

        if (use_bonuses) {
            await pool.query("UPDATE users SET bonuses = bonuses - 30 WHERE id = $1", [user_id]);
        }

        await pool.query("UPDATE users SET bonuses = bonuses + $1 WHERE id = $2", [bonusAmount, user_id]);
        await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);

        res.json("Бонусы пересчитаны, бронь подтверждена");
    } catch (err) { res.status(500).send("Ошибка"); }
});

app.post('/api/admin/panic/:questId', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { questId } = req.params;

        await pool.query("UPDATE quests SET is_active = false WHERE id = $1", [questId]);

        const affectedBookings = await pool.query(
            "SELECT user_id FROM bookings WHERE quest_id = $1 AND booking_date >= CURRENT_DATE",
            [questId]
        );

        for (let row of affectedBookings.rows) {
            await pool.query("UPDATE users SET bonuses = bonuses + 50 WHERE id = $1", [row.user_id]);
        }

        res.json({ 
            message: `Квест закрыт. Компенсация начислена ${affectedBookings.rows.length} пользователям.` 
        });
    } catch (err) { 
        res.status(500).send("Ошибка системы паники"); 
    }
});

app.get('/api/admin/reviews', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const allReviews = await pool.query(`
            SELECT r.id, r.rating, r.comment_text as text, r.status, r.admin_reply, u.full_name, q.title as quest_title 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            JOIN quests q ON r.quest_id = q.id 
            ORDER BY r.created_at DESC`);
        res.json(allReviews.rows);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send("Ошибка"); 
    }
});

app.patch('/api/admin/reviews/:id', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        await pool.query(
            "UPDATE reviews SET status = $1, rejection_reason = $2 WHERE id = $3",
            [status, rejection_reason, id]
        );
        res.json("Статус отзыва обновлен");
    } catch (err) { res.status(500).send("Ошибка при модерации"); }
});

app.post('/api/admin/generate-schedule/:questId', authorize, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Нет доступа");
        const { questId } = req.params;

        const weekdayTimes = ['10:00', '13:00', '16:00', '19:00', '22:00'];
        const weekendTimes = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00', '01:00', '03:00'];

        const basePrice = 80;
        const weekendPremium = 20;
        const nightPremium = 30;

        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const timesToGenerate = isWeekend ? weekendTimes : weekdayTimes;

            for (let time of timesToGenerate) {
                let finalPrice = basePrice;
                if (isWeekend) finalPrice += weekendPremium;
                
                const hour = parseInt(time.split(':')[0]);
                if (hour >= 22 || hour < 6) finalPrice += nightPremium;

                const exists = await pool.query(
                    "SELECT * FROM time_slots WHERE quest_id = $1 AND slot_date = $2 AND slot_time = $3",
                    [questId, dateString, time]
                );

                if (exists.rows.length === 0) {
                    await pool.query(
                        "INSERT INTO time_slots (quest_id, slot_date, slot_time, price, is_booked) VALUES ($1, $2, $3, $4, false)",
                        [questId, dateString, time, finalPrice]
                    );
                }
            }
        }

        res.json("Расписание на 30 дней успешно сформировано!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Ошибка при генерации расписания");
    }
});


// --- МАГАЗИН: ПОКУПКА ТОВАРОВ ЗА БОНУСЫ ---
app.post('/api/user/buy', authorize, async (req, res) => {
    console.log("!!! СЕРВЕР ПОЛУЧИЛ ЗАПРОС НА ПОКУПКУ !!!");
    try {
        const { itemType, cost, value } = req.body;
        const userId = req.user.id;

        const userRes = await pool.query("SELECT bonuses FROM users WHERE id = $1", [userId]);
        if (userRes.rows.length === 0) {
            console.log("Ошибка: Пользователь не найден в БД");
            return res.status(404).json("Пользователь не найден");
        }
        
        const currentBonuses = userRes.rows[0].bonuses;
        console.log(`Пользователь ID:${userId}, Баланс:${currentBonuses}, Цена:${cost}`);

        if (currentBonuses < cost) {
            console.log("Ошибка: Мало бонусов");
            return res.status(400).json("Недостаточно оменов");
        }

        let sql = "";
        if (itemType === 'discount') sql = "UPDATE users SET bonuses = bonuses - $1, pending_discount = $2 WHERE id = $3";
        else if (itemType === 'border') sql = "UPDATE users SET bonuses = bonuses - $1, avatar_border = $2 WHERE id = $3";
        else if (itemType === 'style') sql = "UPDATE users SET bonuses = bonuses - $1, nick_style = $2 WHERE id = $3";

        if (!sql) {
            throw new Error("Неизвестный тип товара: " + itemType);
        }

        await pool.query(sql, [cost, value, userId]);
        console.log("УСПЕХ: База данных обновлена");

        res.json({ message: "Успешно активировано!" });

    } catch (err) {
        console.error("ОШИБКА ВНУТРИ /api/user/buy:");
        console.error(err.stack);
        res.status(500).send("Ошибка сервера");
    }
});

// Обратная связь (Вопросы от пользователей)
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, question } = req.body;
        console.log(`НОВЫЙ ВОПРОС ОТ ${name} (${email}): ${question}`);
        res.json("Ваш вопрос успешно отправлен! Администратор ответит вам на указанную почту.");
    } catch (err) {
        res.status(500).send("Ошибка отправки");
    }
});


app.listen(PORT, () => {
    console.log(`Сервер запустился на порту ${PORT}`);
});