-- Таблица для расписания
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    quest_id INT REFERENCES quests(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    price INT -- Можно сделать разную цену для утра и вечера
);

-- Давай создадим тестовое расписание на ближайшие 3 дня для нашего квеста (ID: 1)
-- День 1
INSERT INTO time_slots (quest_id, slot_date, slot_time, is_booked, price) VALUES 
(1, CURRENT_DATE, '10:00', false, 80), (1, CURRENT_DATE, '13:00', true, 90), 
(1, CURRENT_DATE, '16:00', false, 99), (1, CURRENT_DATE, '19:00', false, 99);
-- День 2
INSERT INTO time_slots (quest_id, slot_date, slot_time, is_booked, price) VALUES 
(1, CURRENT_DATE + 1, '10:00', false, 80), (1, CURRENT_DATE + 1, '13:00', false, 90), 
(1, CURRENT_DATE + 1, '16:00', false, 99), (1, CURRENT_DATE + 1, '19:00', false, 99);