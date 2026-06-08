import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Добавлена иконка Heart для вкладки Избранное
import { CreditCard, Calendar, MessageSquare, Settings, ShieldCheck, Trash2, CornerDownRight, Zap, ShoppingBag, Heart } from 'lucide-react';
import axios from 'axios';
// Импортируем компоненты модальных окон
import PaymentModal from "../components/PaymentModal";  
import ReviewModal from '../components/ReviewModal'; // Импорт окна отзывов

// Array of atmospheric quest-style avatars
const AVATAR_LIST = [
  "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop"
];

// Обновленный список пропсов: добавлен onNavigateToBooking
const Profile = ({ user, myBookings, myReviews, myWaitlist = [], myFavorites = [], onUpdateName, refreshData, onNavigateToBooking }) => {
  const [activeTab, setActiveTab] = useState('status');
  const [newName, setNewName] = useState(user?.full_name || '');
  
  // Local state for avatar selection gallery
  const [tempAvatar, setTempAvatar] = useState(user?.avatar_url || '');

  // State for opening the new payment modal
  const [paymentBooking, setPaymentBooking] = useState(null);

  // Стейт для хранения выбранного бронирования для отзыва
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

  // Sync temp avatar when updated from backend
  useEffect(() => {
    if (user?.avatar_url) {
      setTempAvatar(user.avatar_url);
    }
  }, [user?.avatar_url]);

  // Handler for custom payment processing
  const handlePayment = async (id, card) => {
    try {
      await axios.patch(`/api/user/pay-deposit/${id}`, { sender_card: card }, {
        headers: { token: localStorage.getItem('token') }
      });
      alert("Оплата успешно отправлена на проверку!");
      setPaymentBooking(null);
      refreshData();
    } catch (e) { 
      alert("Ошибка оплаты"); 
    }
  };

  // Cancel booking logic
  const handleCancel = async (id) => {
    if (!window.confirm("Вы уверены, что хотите отменить бронь?")) return;
    try {
      const res = await axios.delete(`/api/user/cancel-booking/${id}`, {
        headers: { token: localStorage.getItem('token') }
      });
      alert(res.data);
      refreshData();
    } catch (err) {
      alert(err.response?.data || "Ошибка при отмене");
    }
  };

  // Store privilege purchases logic
  const handlePurchase = async (item) => {
    if (!user) {
      console.error("Ошибка: Пользователь не найден в состоянии React");
      return alert("Ошибка авторизации. Попробуйте перезайти.");
    }

    if (Number(user.bonuses) < Number(item.cost)) {
      return alert(`Недостаточно оменов! Нужно: ${item.cost}, у вас: ${user.bonuses}`);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Токен отсутствует в localStorage");

      const res = await axios.post('/api/user/buy', item, {
        headers: { token: token }
      });

      alert(res.data.message);
      
      if (refreshData) {
        await refreshData();
      } else {
        window.location.reload();
      }

    } catch (err) {
      console.error("ПОЛНАЯ ОШИБКА AXIOS:", err);
      const errorMessage = err.response?.data || err.message || "Неизвестная ошибка";
      alert("Ошибка: " + errorMessage);
    }
  };

  // Dynamic visual styling functions
  const getBorderStyle = () => {
    if (user?.avatar_border === 'red_neon') return "border-om-accent shadow-[0_0_20px_rgba(230,57,70,0.5)]";
    if (user?.avatar_border === 'gold_glow' || user?.avatar_border === 'gold_neon') return "border-om-gold shadow-[0_0_20px_rgba(184,134,11,0.5)]";
    return "border-white/10";
  };

  const getNickStyle = () => {
    if (user?.nick_style === 'gold_neon') return "text-om-gold drop-shadow-[0_0_8px_rgba(184,134,11,0.8)] italic";
    return "text-white";
  };

  const rankInfo = (bonuses) => {
    if (bonuses >= 150) return { name: "Мастер Оменума", color: "text-om-accent", icon: "🔥" };
    if (bonuses >= 50) return { name: "Искатель", color: "text-[#b8860b]", icon: "🗝️" };
    return { name: "Новичок", color: "text-gray-500", icon: "🌑" };
  };

  const rank = rankInfo(user?.bonuses || 0);

  return (
    <div className="max-w-6xl mx-auto pt-32 pb-20 px-4 sm:px-6 lg:px-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 text-left text-white">
      
      {/* Информационный блок пользователя — Компактный на мобилках */}
      <div className="bg-om-surface p-6 sm:p-8 border border-white/5 text-center mb-6 rounded-3xl shadow-xl flex flex-row lg:flex-col items-center lg:justify-center gap-4 lg:gap-0 max-w-xs lg:max-w-none">
        <div className={`w-14 h-14 sm:w-20 sm:h-20 bg-om-accent/10 rounded-full flex items-center justify-center text-xl sm:text-3xl font-black transition-all duration-500 border-2 overflow-hidden shrink-0 lg:mx-auto lg:mb-4 ${getBorderStyle()}`}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{user?.full_name ? user.full_name[0] : '?'}</span>
          )}
        </div>
        <div className="text-left lg:text-center">
          <p className={`font-bold text-base sm:text-lg transition-all duration-500 ${getNickStyle()}`}>{user?.full_name}</p>
          <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-black mt-1 lg:mt-2 ${rank.color}`}>
            {rank.icon} {rank.name}
          </p>
        </div>
      </div>

      {/* Главный контейнер */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
        
        {/* Sidebar превращается в горизонтальный список на мобилках */}
        <aside className="w-full lg:w-72 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 custom-scrollbar sticky top-20 z-30 bg-om-bg/50 backdrop-blur-sm lg:bg-transparent snap-x">
          {[
            { id: 'status', label: 'Статус', icon: <CreditCard size={16}/> },
            { id: 'history', label: 'Игры', icon: <Calendar size={16}/> },
            { id: 'favorites', label: 'Избранное', icon: <Heart size={16}/> },
            { id: 'waitlist', label: 'Очередь', icon: <Zap size={16}/> },
            { id: 'shop', label: 'Магазин', icon: <ShoppingBag size={16}/> },
            { id: 'feedback', label: 'Отзывы', icon: <MessageSquare size={16}/> },
            { id: 'settings', label: 'Настройки', icon: <Settings size={16}/> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all snap-start ${
                activeTab === item.id ? 'bg-om-accent text-white shadow-lg shadow-om-accent/20' : 'bg-om-surface/40 text-om-gray hover:bg-white/5'
              }`}
            >
              {item.icon} <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Основной контент (уменьшаем паддинги для мобилок) */}
        <main className="flex-1 bg-om-surface border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-12 shadow-2xl relative min-h-[500px] lg:min-h-[600px]">
          
          {/* TAB: STATUS CARD */}
          {activeTab === 'status' && (
            <div className="relative z-10 animate-in fade-in duration-500">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 tracking-tighter uppercase italic">Ваш статус</h2>
              
              <div className={`relative w-full max-w-md aspect-[1.6/1] bg-gradient-to-br from-[#1c1c1e] to-black border-2 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden group transition-all duration-500 ${getBorderStyle()}`}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <ShieldCheck size={60} className="text-om-accent" />
                </div>
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div>
                    <p className="text-[10px] text-om-gray uppercase tracking-[0.4em] font-bold mb-1">Omenum ID Card</p>
                    <h3 className={`text-xl sm:text-2xl font-bold tracking-tight transition-all duration-500 ${getNickStyle()}`}>{user?.full_name}</h3>
                    
                    {user?.pending_discount > 0 && (
                      <div className="mt-2 inline-block bg-green-500/20 border border-green-500/50 px-2 py-1 rounded text-[9px] text-green-400 font-bold uppercase animate-fade-in">
                        Активная скидка: {user.pending_discount} BYN
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-om-gray">Бонусный баланс</span>
                      <span className="text-xl sm:text-2xl font-black text-white">{user?.bonuses} <span className="text-xs text-om-accent">OM</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((user?.bonuses || 0) / 150) * 100, 100)}%` }}
                        className="h-full bg-om-accent shadow-[0_0_15px_#E63946] transition-all duration-1000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISIT HISTORY */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-10 tracking-tighter uppercase italic border-l-4 border-om-accent pl-4 lg:pl-6">История погружений</h2>
              <div className="space-y-6">
                {myBookings.length === 0 ? (
                  <p className="text-om-gray italic uppercase text-xs">Записей не обнаружено...</p>
                ) : (
                  myBookings.map(b => (
                    <div key={b.id} className="p-6 sm:p-8 bg-om-surface border border-white/5 rounded-3xl lg:rounded-[2.5rem] flex flex-col justify-between gap-6 shadow-2xl relative overflow-hidden min-h-[250px] group hover:border-om-accent/30 transition-all">
                      
                      {/* Статус в углу */}
                      <div className="sm:absolute sm:top-6 sm:right-8 self-start sm:self-auto mb-2 sm:mb-0">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border tracking-widest ${
                          b.status === 'awaiting_deposit' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 
                          b.status === 'paid' ? 'text-om-gold border-om-gold/20 bg-om-gold/5' : 
                          b.status === 'completed' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                          'text-green-500 border-green-500/20 bg-green-500/5'
                        }`}>
                          ● {b.status === 'awaiting_deposit' ? 'Ожидает предоплаты' : b.status === 'paid' ? 'На проверке' : b.status === 'completed' ? 'Пройдено' : 'Подтверждено'}
                        </span>
                      </div>

                      {/* Информация о квесте */}
                      <div className="text-left">
                        <h3 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-om-accent transition-colors">{b.title}</h3>
                        <p className="text-xs text-om-gray font-mono mt-1 uppercase tracking-widest">
                          {new Date(b.booking_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} — {b.booking_time.slice(0,5)}
                        </p>
                      </div>

                      {/* Комментарий пользователя */}
                      {b.comment && (
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 italic text-xs text-om-gray mt-2">
                          <span className="font-bold uppercase text-[9px] text-gray-600 block mb-1">Ваш комментарий:</span>
                          "{b.comment}"
                        </div>
                      )}

                      {/* Нижняя интерактивная часть с защищенным выводом цен */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/5 mt-auto">
                        <div className="flex flex-wrap gap-6 sm:gap-10">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Общая сумма</p>
                            <p className="text-base sm:text-lg font-bold text-white">
                              {b.total_price ? b.total_price : '0'} BYN
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Предоплата</p>
                            <p className="text-base sm:text-lg font-bold text-om-accent">
                              {b.deposit_amount ? b.deposit_amount : '0'} BYN
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Игроки</p>
                            <p className="text-base sm:text-lg font-bold text-white">
                              {b.players_count ? `${b.players_count} чел` : '— чел'}
                            </p> 
                          </div>
                        </div>

                        {/* Действия */}
                        <div className="flex gap-4 items-center w-full sm:w-auto justify-end">
                          {b.status === 'awaiting_deposit' && (
                            <button 
                              onClick={() => setPaymentBooking(b)}
                              className="w-full sm:w-auto bg-om-accent text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-lg shadow-om-accent/10 text-center"
                            >
                              Внести предоплату
                            </button>
                          )}
                          
                          {/* Обновленная кнопка написания отзыва для завершенных игр */}
                          {b.status === 'completed' && (
                            <button 
                              onClick={() => setSelectedBookingForReview(b)}
                              className="w-full sm:w-auto bg-white/5 hover:bg-om-accent text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center"
                            >
                              Написать отзыв
                            </button>
                          )}
                          
                          {/* Мусорка доступна только для неоплаченных броней */}
                          {b.status === 'awaiting_deposit' && (
                            <button 
                              onClick={() => handleCancel(b.id)} 
                              className="p-3 bg-white/5 hover:bg-red-500/20 text-om-gray hover:text-red-500 rounded-xl transition-all shrink-0"
                              title="Отменить бронирование"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-10 tracking-tighter uppercase italic border-l-4 border-om-accent pl-4 lg:pl-6">Сохраненные испытания</h2>
              {myFavorites.length === 0 ? (
                <p className="text-om-gray italic uppercase text-xs">Список пуст. Добавьте квесты в избранное на главной странице.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myFavorites.map(quest => (
                    <div key={quest.id} className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden group hover:border-om-accent/30 transition-all">
                      <img src={quest.image_url} className="h-32 w-full object-cover opacity-50 group-hover:opacity-100 transition-all" alt={quest.title} />
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-white uppercase">{quest.title}</h4>
                        {/* Новая кнопка с рабочим переходом */}
                        <button 
                          onClick={() => onNavigateToBooking(quest.id)}
                          className="mt-4 text-[10px] font-black text-om-accent uppercase tracking-widest border-b border-om-accent pb-1 hover:text-white hover:border-white transition-all"
                        >
                          Перейти к бронированию
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: WAITLIST */}
          {activeTab === 'waitlist' && (
            <div className="animate-in fade-in duration-500 text-left">
              <h2 className="text-3xl font-black text-white mb-10 tracking-tighter uppercase italic border-l-4 border-om-accent pl-6">Ваша очередь</h2>
              <div className="space-y-4">
                {myWaitlist.length === 0 ? (
                  <p className="text-om-gray italic">Вы пока не записывались в очередь на закрытые даты...</p>
                ) : (
                  myWaitlist.map(w => (
                    <div key={w.id} className="p-6 bg-om-accent/5 border border-om-accent/20 rounded-2xl flex justify-between items-center group hover:bg-om-accent/10 transition-all">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{w.quest_title}</p>
                        <p className="text-[10px] text-om-gray mt-1 uppercase tracking-widest font-mono">
                          Заявка на: {new Date(w.slot_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-om-accent uppercase px-3 py-1 bg-om-accent/10 rounded-full animate-pulse border border-om-accent/20">
                          Мониторинг мест
                        </span>
                        <p className="text-[7px] text-gray-600 uppercase">Менеджер свяжется с вами</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: PRIVILEGE SHOP */}
          {activeTab === 'shop' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 lg:mb-4 tracking-tighter uppercase italic">Магазин привилегий</h2>
              <p className="text-om-gray text-xs uppercase tracking-widest mb-6 lg:mb-10 font-bold">Ваш баланс: <span className="text-om-accent">{user?.bonuses || 0} OM</span></p>
              
              {/* Обновленный класс сетки для адаптивности на телефонах */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CARD: DISCOUNT */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${user?.pending_discount > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-black/40 hover:border-green-500/30'}`}>
                  <p className="text-[10px] text-green-500 font-bold uppercase mb-2">Разовый бонус</p>
                  <h4 className="text-xl font-bold text-white mb-2">Скидка 20 BYN</h4>
                  <p className="text-xs text-om-gray mb-4">Применяется автоматически при следующем бронировании квеста.</p>
                  <button 
                    disabled={user?.pending_discount > 0}
                    onClick={() => handlePurchase({ itemType: 'discount', cost: 5, value: 20 })}
                    className={`w-full py-3 mt-2 rounded-xl text-[10px] font-bold uppercase border transition-all text-center ${
                      user?.pending_discount > 0 
                        ? 'border-green-500/20 text-green-400 bg-green-500/10 cursor-not-allowed' 
                        : 'border-white/10 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    {user?.pending_discount > 0 ? 'Уже активирована' : 'Купить за 5 OM'}
                  </button>
                </div>

                {/* CARD: NEON BORDER */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${user?.avatar_border === 'red_neon' ? 'border-om-accent bg-om-accent/5' : 'border-white/5 bg-black/40 hover:border-om-accent/30'}`}>
                  <p className="text-[10px] text-om-accent font-bold uppercase mb-2">Визуальный эффект</p>
                  <h4 className="text-xl font-bold text-white mb-2">Красный неон</h4>
                  <p className="text-xs text-om-gray mb-4">Добавляет яркое неоновое свечение вокруг вашей аватарки и статус-карты.</p>
                  <button 
                    disabled={user?.avatar_border === 'red_neon'}
                    onClick={() => handlePurchase({ itemType: 'border', cost: 10, value: 'red_neon' })}
                    className={`w-full py-3 mt-2 rounded-xl text-[10px] font-bold uppercase border transition-all text-center ${
                      user?.avatar_border === 'red_neon' 
                        ? 'border-om-accent/30 text-om-accent bg-om-accent/10 cursor-not-allowed' 
                        : 'border-white/10 hover:bg-om-accent hover:text-white'
                    }`}
                  >
                    {user?.avatar_border === 'red_neon' ? 'Используется' : 'Купить за 10 OM'}
                  </button>
                </div>

                {/* CARD: GOLD NICKNAME */}
                <div className={`p-6 rounded-3xl border transition-all duration-500 ${user?.nick_style === 'gold_neon' ? 'border-om-gold bg-om-gold/5' : 'border-white/5 bg-black/40 hover:border-om-gold/30'}`}>
                  <p className="text-[10px] text-om-gold font-bold uppercase mb-2">Элитный стиль</p>
                  <h4 className="text-xl font-bold text-white mb-2 italic">Золотое имя</h4>
                  <p className="text-xs text-om-gray mb-4 font-light">Ваш позывной засияет золотым неоном в отзывах и профиле системы.</p>
                  <button 
                    disabled={user?.nick_style === 'gold_neon'}
                    onClick={() => handlePurchase({ itemType: 'style', cost: 15, value: 'gold_neon' })}
                    className={`w-full py-3 mt-2 rounded-xl text-[10px] font-bold uppercase border transition-all text-center ${
                      user?.nick_style === 'gold_neon' 
                        ? 'border-om-gold/30 text-om-gold bg-om-gold/10 cursor-not-allowed' 
                        : 'border-white/10 hover:bg-om-gold hover:text-black'
                    }`}
                  >
                    {user?.nick_style === 'gold_neon' ? 'Используется' : 'Купить за 15 OM'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-10 tracking-tighter uppercase italic">Ваши голоса</h2>
              {myReviews.length === 0 ? <p className="text-om-gray italic">Вы еще не оставляли отзывов...</p> : 
                myReviews.map(r => (
                  <div key={r.id} className="p-6 bg-black/20 border border-white/5 rounded-3xl">
                    <div className="flex justify-between items-center mb-4 gap-2">
                      <span className="text-om-accent font-bold tracking-tight shrink-0">{'★'.repeat(r.rating)}</span>
                      <span className="text-[9px] text-om-gray uppercase font-bold tracking-widest text-right break-all">{r.title}</span>
                    </div>
                    
                    {/* Исправленное поле вывода текста отзыва */}
                    <p className="text-sm italic text-gray-300 mb-4 font-serif leading-relaxed">
                      "{r.comment_text}"
                    </p>
                    
                    {r.admin_reply && (
                      <div className="mt-6 flex gap-3 animate-in slide-in-from-left-2 duration-500">
                        <CornerDownRight size={16} className="text-om-accent shrink-0 mt-1" />
                        <div className="bg-om-accent/5 border border-om-accent/10 p-4 rounded-2xl rounded-tl-none">
                          <p className="text-[9px] font-black text-om-accent uppercase mb-1 tracking-tighter">Omenum Team:</p>
                          <p className="text-xs text-gray-300 italic">"{r.admin_reply}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* TAB: CONFIGURATION / SETTINGS */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-10 tracking-tighter uppercase italic">Конфигурация</h2>
              <div className="space-y-10">
                
                {/* RENAME INPUT */}
                <div>
                  <label className="text-[10px] uppercase text-om-gray font-bold tracking-[0.3em] mb-3 block italic">Изменить позывной</label>
                  <input 
                    type="text" 
                    className="w-full max-w-sm bg-black/40 border border-white/5 p-4 rounded-2xl outline-none focus:border-om-accent/40 text-white transition-all text-sm"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>

                {/* AVATAR GALLERY */}
                <div>
                  <label className="text-[10px] uppercase text-om-gray font-bold tracking-[0.3em] mb-5 block italic">Личность искателя</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-4">
                    {AVATAR_LIST.map((url, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => setTempAvatar(url)}
                        className={`aspect-square rounded-full overflow-hidden border-2 transition-all duration-300 ${
                          tempAvatar === url ? 'border-om-accent scale-110 shadow-[0_0_15px_#E63946]' : 'border-white/5 opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Avatar option" />
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => onUpdateName(newName, tempAvatar)}
                  className="w-full sm:w-auto bg-white text-black px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-om-accent hover:text-white transition-all shadow-lg active:scale-95 text-center"
                >
                  Применить изменения
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Рендеринг модального окна оплаты при наличии выбранного бронирования */}
      {paymentBooking && (
        <PaymentModal 
          booking={paymentBooking} 
          onClose={() => setPaymentBooking(null)} 
          onPay={handlePayment} 
        />
      )}

      {/* Рендеринг модального окна отправки отзыва */}
      {selectedBookingForReview && (
        <ReviewModal  
          booking={selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onSubmit={async (id, rating, text) => {
            try {
              await axios.post('/api/reviews', { 
                booking_id: id, 
                rating: rating, 
                comment_text: text 
              }, {
                headers: { token: localStorage.getItem('token') }
              });
              alert("Ваш голос услышан. Отзыв отправлен на модерацию!");
              setSelectedBookingForReview(null);
              refreshData(); // Обновить данные
            } catch (err) {
              alert(err.response?.data || "Ошибка при отправке");
            }
          }}
        />
      )}
    </div>
  );
};

export default Profile;