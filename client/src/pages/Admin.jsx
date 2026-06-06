import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Database, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Zap,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Edit3
} from 'lucide-react';
import axios from 'axios';

// Импорт BonusModal
import BonusModal from "../components/BonusModal";

const Admin = ({ quests, allBookings, allReviews, totalRevenue, onAction, setView }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Состояние для мобильного меню
  const [replyText, setReplyText] = useState({ id: null, text: '' });
  const [editingQuest, setEditingQuest] = useState(null);
  const [bonusBooking, setBonusBooking] = useState(null);

  // Функция для переключения вкладок с авто-закрытием меню на мобилке и скроллом наверх
  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleCreditBonuses = async (id, amount) => {
    try {
      await onAction('patch', `/api/admin/credit-bonuses/${id}`, { bonusAmount: amount });
      setBonusBooking(null);
    } catch (e) { 
      alert("Ошибка при зачислении бонусов"); 
    }
  };

  const rejectReview = async (reviewId) => {
    const reason = prompt("Укажите причину отклонения отзыва (будет видна пользователю):");
    if (!reason) return;

    try {
      await onAction('patch', `/api/admin/reviews/${reviewId}`, {
        status: 'rejected',
        rejection_reason: reason
      });
      alert("Отзыв отклонен, причина сохранена.");
    } catch (err) {
      alert("Ошибка при сохранении решения");
    }
  };

  const stats = [
    { label: 'Общая выручка', value: `${totalRevenue} BYN`, icon: <Zap className="text-om-accent" />, color: 'border-om-accent' },
    { label: 'Всего заказов', value: allBookings.length, icon: <Calendar className="text-blue-500" />, color: 'border-blue-500' },
    { label: 'На модерации', value: allReviews.filter(r => r.status === 'pending').length, icon: <MessageSquare className="text-om-gold" />, color: 'border-om-gold' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-left relative font-sans">
      
      {/* 1. МОБИЛЬНЫЙ ХЕДЕР */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-black border-b border-white/5 z-[100] px-4 py-3 flex justify-between items-center shadow-lg">
        <h1 className="text-lg font-black text-white italic tracking-tighter uppercase">Omenum_Admin</h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2 bg-om-accent text-white rounded-xl shadow-lg shadow-om-accent/20"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. SIDEBAR (Выезжающий / Адаптивный) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-72 bg-black border-r border-white/5 p-8 flex flex-col transition-transform duration-300
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="mb-12 hidden lg:block">
          <h1 className="text-xl font-black text-white italic tracking-widest uppercase">Omenum_Admin</h1>
          <p className="text-[9px] text-om-gray uppercase tracking-[0.4em] mt-2 font-bold">Control Terminal</p>
        </div>

        <nav className="flex-1 space-y-2 mt-10 lg:mt-0">
          {/* Кнопка возврата на сайт */}
          <button 
            onClick={() => setView('main')}
            className="w-full flex items-center gap-4 px-5 py-3 mb-6 rounded-xl text-[10px] font-bold uppercase tracking-widest text-om-gray border border-white/5 hover:text-white transition-all"
          >
            <ChevronLeft size={16} /> На главную
          </button>

          {[
            { id: 'overview', label: 'Обзор системы', icon: <LayoutDashboard size={18}/> },
            { id: 'bookings', label: 'Реестр броней', icon: <Calendar size={18}/> },
            { id: 'reviews', label: 'Модерация', icon: <MessageSquare size={18}/> },
            { id: 'schedule', label: 'Расписание', icon: <Zap size={18}/> },
            { id: 'inventory', label: 'База квестов', icon: <Database size={18}/> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'bg-om-accent text-white shadow-lg shadow-om-accent/20' : 'text-gray-500 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Кнопка Выход */}
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }} 
          className="text-[9px] text-gray-700 hover:text-red-500 uppercase font-black tracking-widest mt-auto pt-4 text-left border-t border-white/5"
        >
          Выход
        </button>
      </aside>

      {/* 3. ОСНОВНОЙ КОНТЕНТ */}
      <main className="flex-1 p-4 md:p-12 lg:ml-72 mt-14 lg:mt-0">
        
        <AnimatePresence mode="wait">
          
          {/* ВКЛАДКА: ОБЗОР */}
          {activeTab === 'overview' && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key="overview" className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Аналитика</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                {stats.map((stat, i) => (
                  <div key={i} className={`bg-om-surface p-6 lg:p-8 rounded-[2rem] border-b-4 ${stat.color} shadow-2xl relative overflow-hidden group`}>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">{stat.icon}</div>
                    <p className="text-[9px] text-om-gray uppercase font-bold tracking-widest mb-4">{stat.label}</p>
                    <p className="text-3xl lg:text-4xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ВКЛАДКА: БРОНИРОВАНИЯ (АДАПТИВНАЯ) */}
          {activeTab === 'bookings' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} key="bookings" className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Реестр броней</h2>
              
              {/* Вид карточками для мобилок */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {allBookings.map(b => (
                  <div key={b.id} className="bg-om-surface p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-base font-black text-white uppercase tracking-tight mb-1">{b.client_name || 'Не указано'}</p>
                        <p className="text-xs font-bold text-om-accent font-mono">{b.client_phone}</p>
                        <p className="text-[11px] text-gray-400 font-medium break-all">{b.client_email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded bg-black border border-white/10 ${b.is_deposit_paid ? 'text-green-500' : 'text-red-600'}`}>
                          {b.is_deposit_paid ? '● ОПЛАЧЕНО' : '○ ОЖИДАЕТ'}
                        </span>
                        <p className="text-[8px] text-gray-500 uppercase font-bold">Статус: {b.status}</p>
                      </div>
                    </div>

                    {b.comment && (
                      <div className="p-3 bg-white/5 rounded-xl border-l-2 border-om-gold">
                        <p className="text-[11px] text-om-gold leading-relaxed italic">«{b.comment}»</p>
                      </div>
                    )}

                    <div className="py-3 border-y border-white/5 space-y-1">
                      <p className="text-sm font-bold text-white uppercase italic tracking-tighter">{b.quest_title}</p>
                      <p className="text-xs text-om-gray font-bold uppercase">{new Date(b.booking_date).toLocaleDateString()} в {b.booking_time.slice(0,5)}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Группа: {b.players_count} чел</p>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="text-xl font-black text-white">{b.deposit_amount} <span className="text-xs text-om-gray">BYN</span></p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {b.status === 'paid' && (
                          <button 
                            onClick={() => setBonusBooking(b)} 
                            className="bg-om-gold text-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-white transition-all shadow-lg"
                          >
                            Бонусы
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button 
                            onClick={() => onAction('patch', `/api/admin/bookings/${b.id}`, { status: 'completed' })}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all shadow-lg"
                          >
                            Завершить
                          </button>
                        )}
                        <button 
                          onClick={() => onAction('delete', `/api/admin/bookings/${b.id}`)} 
                          className="bg-red-900/20 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ТАБЛИЦА (Только для больших экранов ПК) */}
              <div className="hidden lg:block bg-om-surface border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-white/5 text-[9px] uppercase text-om-gray font-bold tracking-widest">
                    <tr>
                      <th className="p-6">Клиент / Данные формы</th>
                      <th className="p-6">Испытание</th>
                      <th className="p-6">Предоплата</th>
                      <th className="p-6 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allBookings.map(b => (
                      <tr key={b.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-6">
                          <p className="text-lg font-black text-white uppercase tracking-tight mb-1">{b.client_name || 'Не указано'}</p>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold text-om-accent font-mono">{b.client_phone}</p>
                            <p className="text-xs text-gray-400 font-medium border-b border-white/5 pb-2 w-fit">{b.client_email}</p>
                          </div>
                          {b.comment && (
                            <div className="mt-3 p-3 bg-white/5 rounded-xl border-l-2 border-om-gold">
                              <p className="text-[11px] text-om-gold leading-relaxed italic">«{b.comment}»</p>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <p className="text-base font-bold text-white uppercase italic tracking-tighter">{b.quest_title}</p>
                          <p className="text-xs text-om-gray font-bold mt-1 uppercase">{new Date(b.booking_date).toLocaleDateString()} в {b.booking_time.slice(0,5)}</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Группа: {b.players_count} чел</p>
                        </td>
                        <td className="p-6">
                          <p className="text-2xl font-black text-white">{b.deposit_amount} <span className="text-xs text-om-gray">BYN</span></p>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${b.is_deposit_paid ? 'text-green-500' : 'text-red-600'}`}>
                            {b.is_deposit_paid ? '● ОПЛАЧЕНО' : '○ ОЖИДАЕТ ОПЛАТЫ'}
                          </span>
                        </td>
                        <td className="p-5 text-right space-y-2">
                          <div className="flex justify-end gap-2">
                            {b.status === 'paid' && (
                              <button 
                                onClick={() => setBonusBooking(b)} 
                                className="bg-om-gold text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-white transition-all shadow-lg"
                              >
                                Зачислить бонусы
                              </button>
                            )}
                            {b.status === 'confirmed' && (
                              <button 
                                onClick={() => onAction('patch', `/api/admin/bookings/${b.id}`, { status: 'completed' })}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all shadow-lg"
                              >
                                Завершить сеанс
                              </button>
                            )}
                            <button 
                              onClick={() => onAction('delete', `/api/admin/bookings/${b.id}`)} 
                              className="bg-red-900/20 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              title="Удалить бронирование"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">
                            Текущий статус: {b.status}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ВКЛАДКА: ОТЗЫВЫ */}
          {activeTab === 'reviews' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} key="reviews" className="space-y-6">
               <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Модерация</h2>
               {allReviews.map(r => (
                 <div key={r.id} className={`bg-om-surface p-6 lg:p-8 rounded-[2.5rem] border ${r.status === 'pending' ? 'border-om-accent/30 shadow-[0_0_30px_rgba(230,57,70,0.05)]' : 'border-white/5'}`}>
                   <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                     <div>
                       <p className="font-bold text-white uppercase">{r.full_name} <span className="text-[10px] text-om-gray ml-2">на квест {r.quest_title}</span></p>
                       <p className="text-om-accent text-xs mt-1">{'★'.repeat(r.rating)}</p>
                     </div>
                     <div className="flex gap-2">
                       {r.status === 'pending' && (
                         <>
                           <button onClick={() => onAction('patch', `/api/admin/reviews/${r.id}`, {status: 'approved'})} className="bg-green-500 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Одобрить</button>
                           <button onClick={() => rejectReview(r.id)} className="bg-om-accent text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Отказ</button>
                         </>
                       )}
                     </div>
                   </div>
                   <p className="text-gray-400 italic text-sm border-l border-om-accent/20 pl-6 mb-6">
                     "{r.text}"
                   </p>
                 </div>
               ))}
            </motion.div>
          )}

          {/* ВКЛАДКА: РАСПИСАНИЕ */}
          {activeTab === 'schedule' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} key="schedule" className="grid grid-cols-1 gap-6">
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Реестр сеансов</h2>
                {quests.map(q => (
                  <div key={q.id} className="bg-om-surface p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-om-accent/20 transition-all">
                    <div>
                      <h4 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter group-hover:text-om-accent transition-colors">{q.title}</h4>
                      <p className="text-[10px] text-om-gray uppercase font-bold tracking-[0.3em] mt-2 italic">Генерация сетки на 30 суток</p>
                    </div>
                    <button 
                      onClick={() => onAction('post', `/api/admin/generate-schedule/${q.id}`)}
                      className="w-full sm:w-auto bg-om-white text-om-bg px-8 lg:px-10 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-om-accent hover:text-white transition-all shadow-xl"
                    >
                      Сформировать
                    </button>
                  </div>
                ))}
              </motion.div>
          )}

          {/* ВКЛАДКА: БАЗА КВЕСТОВ */}
          {activeTab === 'inventory' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} key="inventory" className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">База испытаний</h2>
                <button 
                  onClick={() => setEditingQuest({ 
                    title: '', description: '', short_description: '', 
                    price: 80, difficulty: 'Средне', max_players: 4, 
                    genre: 'Классический', fear_level: 'Не страшный', 
                    min_age: 12, address: 'м. Академия наук', image_url: '',
                    is_active: true,
                    price_config: []
                  })}
                  className="w-full sm:w-auto bg-om-accent text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg"
                >
                  + Создать квест
                </button>
              </div>

              {/* МЕГА-ФОРМА АДАПТИРОВАННАЯ */}
              {editingQuest && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-om-surface p-6 md:p-10 rounded-[2rem] border border-om-accent/30 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-om-accent"></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Блок 1: Основное */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-om-accent uppercase font-bold tracking-widest border-b border-white/5 pb-2">01. Базовые данные</p>
                      <input 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-om-accent/50"
                        placeholder="Название квеста"
                        value={editingQuest.title}
                        onChange={e => setEditingQuest({...editingQuest, title: e.target.value})}
                      />
                      <input 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-om-accent/50"
                        placeholder="Ссылка на обложку (URL)"
                        value={editingQuest.image_url || ''}
                        onChange={e => setEditingQuest({...editingQuest, image_url: e.target.value})}
                      />
                      <input 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm text-white outline-none focus:border-om-accent/50"
                        placeholder="Адрес (локация)"
                        value={editingQuest.address || ''}
                        onChange={e => setEditingQuest({...editingQuest, address: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Цена (от)</label>
                          <input type="number" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none text-white focus:border-om-accent/50" 
                            value={editingQuest.price} onChange={e => setEditingQuest({...editingQuest, price: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Сложность</label>
                          <select className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none text-white focus:border-om-accent/50"
                            value={editingQuest.difficulty} onChange={e => setEditingQuest({...editingQuest, difficulty: e.target.value})}>
                            <option value="Легко">Легко</option>
                            <option value="Средне">Средне</option>
                            <option value="Сложно">Сложно</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Блок 2: Атмосфера */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-om-accent uppercase font-bold tracking-widest border-b border-white/5 pb-2">02. Настройка атмосферы</p>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Жанр погружения</label>
                        <select className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-om-accent/50 text-white"
                          value={editingQuest.genre || 'Классический'} onChange={e => setEditingQuest({...editingQuest, genre: e.target.value})}>
                          <option value="Классический">Классический</option>
                          <option value="Экшн">Экшн</option>
                          <option value="Хоррор">Хоррор</option>
                          <option value="Перформанс">Перформанс</option>
                          <option value="Мистика">Мистика</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Уровень страха</label>
                        <select className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-om-accent/50 text-white"
                          value={editingQuest.fear_level || 'Не страшный'} onChange={e => setEditingQuest({...editingQuest, fear_level: e.target.value})}>
                          <option value="Не страшный">Не страшный (логика)</option>
                          <option value="Немного страшный">Немного страшный</option>
                          <option value="Страшный">Страшный</option>
                          <option value="Очень страшный">Очень страшный (шок)</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Возраст</label>
                          <input type="number" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none text-white focus:border-om-accent/50" 
                            value={editingQuest.min_age || 12} onChange={e => setEditingQuest({...editingQuest, min_age: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-500 uppercase ml-2 mb-1 block">Макс. игроков</label>
                          <input type="number" className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm outline-none text-white focus:border-om-accent/50" 
                            value={editingQuest.max_players || 4} onChange={e => setEditingQuest({...editingQuest, max_players: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Блок 3: Описания и Кнопки */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-om-accent uppercase font-bold tracking-widest border-b border-white/5 pb-2">03. Контент и Действие</p>
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-om-accent/50 text-xs h-16 text-white resize-none"
                        placeholder="Краткое описание"
                        value={editingQuest.short_description || ''}
                        onChange={e => setEditingQuest({...editingQuest, short_description: e.target.value})}
                      />
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-om-accent/50 text-xs h-24 text-white resize-none"
                        placeholder="Полное описание сюжета..."
                        value={editingQuest.description || ''}
                        onChange={e => setEditingQuest({...editingQuest, description: e.target.value})}
                      />

                      {/* Дополнительные фото */}
                      {editingQuest.id && (
                        <div className="space-y-2 mt-2">
                          <p className="text-[9px] text-om-accent uppercase font-bold tracking-widest">Галерея фото</p>
                          <div className="flex gap-2">
                            <input 
                              id="new-img-url"
                              className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-om-accent/50 text-white"
                              placeholder="Ссылка на фото"
                            />
                            <button 
                              type="button"
                              onClick={async () => {
                                const url = document.getElementById('new-img-url').value;
                                if(!url) return;
                                try {
                                  await axios.post(`/api/admin/quests/${editingQuest.id}/images`, { image_url: url }, { headers: { token: localStorage.getItem('token') } });
                                  alert("Добавлено в галерею!");
                                  document.getElementById('new-img-url').value = '';
                                } catch (err) {
                                  alert("Ошибка при добавлении фото");
                                  console.error(err);
                                }
                              }}
                              className="bg-white/10 hover:bg-om-accent text-white px-4 rounded-xl text-[10px] font-bold uppercase transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-4 pt-2">
                        <button 
                          onClick={() => {
                            const method = editingQuest.id ? 'patch' : 'post';
                            const url = editingQuest.id ? `/api/admin/quests/${editingQuest.id}` : '/api/admin/quests';
                            
                            const finalData = {
                              ...editingQuest,
                              price_config: editingQuest.price_config || []
                            };

                            onAction(method, url, finalData);
                            setEditingQuest(null);
                          }}
                          className="flex-1 bg-om-accent text-white font-black uppercase text-[10px] py-4 rounded-xl hover:bg-white hover:text-black transition-all shadow-xl"
                        >
                          Сохранить
                        </button>
                        <button 
                          onClick={() => setEditingQuest(null)} 
                          className="px-4 text-om-gray text-[10px] font-bold uppercase hover:text-white"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>

                    {/* Блок 4: Динамические цены */}
                    <div className="col-span-1 lg:col-span-3 space-y-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-om-accent uppercase font-bold tracking-widest">04. Настройка стоимости от количества игроков</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(editingQuest.price_config || []).map((item, index) => (
                          <div key={index} className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                            <input 
                              type="number" placeholder="Чел" 
                              className="w-16 bg-transparent outline-none text-center text-xs border-r border-white/10 text-white"
                              value={item.players}
                              onChange={e => {
                                const newConfig = [...editingQuest.price_config];
                                newConfig[index].players = e.target.value;
                                setEditingQuest({...editingQuest, price_config: newConfig});
                              }}
                            />
                            <input 
                              type="number" placeholder="Цена" 
                              className="w-20 bg-transparent outline-none text-center text-xs text-white"
                              value={item.price}
                              onChange={e => {
                                const newConfig = [...editingQuest.price_config];
                                newConfig[index].price = e.target.value;
                                setEditingQuest({...editingQuest, price_config: newConfig});
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const newConfig = editingQuest.price_config.filter((_, i) => i !== index);
                                setEditingQuest({...editingQuest, price_config: newConfig});
                              }}
                              className="text-red-500 hover:text-white px-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        
                        <button 
                          type="button"
                          onClick={() => {
                            const currentConfig = editingQuest.price_config || [];
                            setEditingQuest({...editingQuest, price_config: [...currentConfig, {players: '', price: ''}]});
                          }}
                          className="border-2 border-dashed border-white/10 rounded-xl p-2 text-[10px] uppercase font-bold text-gray-500 hover:border-om-accent hover:text-om-accent transition-all text-center"
                        >
                          + Добавить вариант
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* Список квестов в виде адаптивных карточек */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quests.map(q => (
                  <div key={q.id} className={`bg-om-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between group transition-all ${!q.is_active ? 'opacity-40' : 'hover:border-white/10'}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <img 
                        src={q.image_url || "https://images.unsplash.com/photo-1519074063911-29d2451ec0d4?q=80&w=300"} 
                        className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all shrink-0"
                        alt={q.title}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white uppercase truncate">{q.title}</p>
                        <p className="text-[9px] text-om-accent font-bold uppercase tracking-widest truncate">
                          {q.genre} | {q.difficulty} | {q.price} BYN
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button 
                        onClick={() => setEditingQuest(q)} 
                        className="p-3 bg-white/5 rounded-xl text-om-gray hover:text-white transition-all"
                        title="Редактировать"
                      >
                        <Edit3 size={16}/>
                      </button>
                      <button 
                        onClick={() => onAction('patch', `/api/admin/quests/${q.id}`, { ...q, is_active: !q.is_active })}
                        className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-colors ${q.is_active ? 'border-red-900 text-red-500 hover:bg-red-900/20' : 'border-green-900 text-green-500 hover:bg-green-900/20'}`}
                      >
                        {q.is_active ? 'Стоп' : 'Старт'}
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm("ВНИМАНИЕ: Это закроет квест и начислит бонусы ВСЕМ пострадавшим клиентам. Продолжить?")) {
                            onAction('post', `/api/admin/panic/${q.id}`);
                          }
                        }}
                        className="p-2 bg-black border border-om-accent text-om-accent rounded-xl text-[8px] font-black uppercase hover:bg-om-accent hover:text-white transition-all"
                        title="Panic Button"
                      >
                        Закрыть квест
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* OVERLAY ДЛЯ МОБИЛЬНОГО МЕНЮ С БЛУРОМ */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[80] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ НАЧИСЛЕНИЯ БОНУСОВ */}
      {bonusBooking && (
        <BonusModal 
          booking={bonusBooking} 
          onClose={() => setBonusBooking(null)} 
          onConfirm={handleCreditBonuses} 
        />
      )}
    </div>
  );
};

export default Admin;