import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Добавлена иконка MessageSquare для секции отзывов
import { X, MapPin, Skull, Users, ShieldCheck, Calendar, MessageSquare } from 'lucide-react';

const QuestDetails = ({ quest, onClose, onBook }) => {
  const [activeImg, setActiveImg] = useState(quest.image_url);

  // Безопасное извлечение списка одобренных отзывов из объекта квеста
  const approvedReviews = quest.approvedReviews || [];

  // Блокируем прокрутку основной страницы при открытии окна
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex justify-center bg-black/90 backdrop-blur-md overflow-y-auto pt-20 pb-10 px-4 custom-scrollbar">
      
      {/* Кнопка закрытия вне окна (чтобы всегда была под рукой) */}
      <button 
        onClick={onClose} 
        className="fixed top-6 right-6 z-[160] p-4 bg-om-accent text-white rounded-full shadow-2xl hover:scale-110 transition-all"
      >
        <X size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-6xl bg-om-surface rounded-[1.5rem] sm:rounded-[2.5rem] lg:rounded-[3rem] border border-white/10 shadow-2xl h-fit overflow-hidden flex flex-col lg:flex-row"
      >
        
        {/* ЛЕВАЯ ЧАСТЬ: ФОТО (НА МОБИЛЬНЫХ СВЕРХУ, НА ПК СЛЕВА) */}
        <div className="w-full lg:w-1/2 p-5 sm:p-8 lg:p-10 space-y-6 bg-black/20">
          <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <img src={activeImg} className="w-full h-full object-cover" alt="Quest view" />
          </div>
          
          <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
            <img 
              src={quest.image_url} 
              onClick={() => setActiveImg(quest.image_url)}
              className={`w-20 h-16 shrink-0 object-cover rounded-xl cursor-pointer border-2 transition-all ${activeImg === quest.image_url ? 'border-om-accent scale-105' : 'border-transparent opacity-40'}`} 
            />
            {(quest.gallery || []).map((img, i) => (
              <img 
                key={i} 
                src={img.image_url} 
                onClick={() => setActiveImg(img.image_url)}
                className={`w-20 h-16 shrink-0 object-cover rounded-xl cursor-pointer border-2 transition-all ${activeImg === img.image_url ? 'border-om-accent scale-105' : 'border-transparent opacity-40'}`} 
              />
            ))}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ОПИСАНИЕ И ИНФОРМАЦИЯ */}
        <div className="w-full lg:w-1/2 p-5 sm:p-8 lg:p-12 text-left flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-om-accent text-[10px] font-bold uppercase tracking-[0.3em]">
              <ShieldCheck size={14} /> Испытание доступно
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none italic">
              {quest.title}
            </h2>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase text-om-gray tracking-widest">{quest.genre}</span>
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase text-om-gray tracking-widest">{quest.difficulty}</span>
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase text-om-gray tracking-widest">{quest.min_age}+</span>
            </div>

            <p className="text-om-gray text-sm sm:text-base lg:text-lg leading-relaxed font-light italic border-l-2 border-om-accent/30 pl-4 sm:pl-6 py-1 sm:py-2">
              {quest.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Где проходит</p>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  <MapPin size={14} className="text-om-accent" /> {quest.address}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Вместимость</p>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  <Users size={14} className="text-om-accent" /> до {quest.max_players} человек
                </div>
              </div>
            </div>

            {/* МИНИ-КАРТА */}
            <div className="w-full h-40 sm:h-44 rounded-2xl overflow-hidden border border-white/5 grayscale invert contrast-125 opacity-50 hover:opacity-100 transition-all duration-500">
               <iframe 
                width="100%" height="100%" 
                frameBorder="0" 
                src={`https://yandex.ru/map-widget/v1/?mode=search&text=${encodeURIComponent(quest.address)}`}
               ></iframe>
            </div>

            {/* СЕКЦИЯ ОТЗЫВОВ */}
            <div className="pt-6 border-t border-white/5 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-wider italic flex items-center gap-2">
                <MessageSquare size={18} className="text-om-accent" /> Голоса искателей ({approvedReviews.length})
              </h3>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {approvedReviews.length === 0 ? (
                  <p className="text-om-gray italic text-xs">Отзывов об этом квесте пока нет...</p>
                ) : (
                  approvedReviews.map(r => (
                    <div key={r.id} className="border-l-2 border-white/5 pl-4 sm:pl-6 pb-2 relative">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3">
                        {/* АВАТАРКА С КУПЛЕННОЙ РАМКОЙ */}
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold bg-om-surface border text-xs sm:text-sm text-white transition-all shrink-0 ${
                          r.avatar_border === 'red_neon' ? 'border-om-accent shadow-[0_0_10px_#E63946]' : 'border-white/10'
                        }`}>
                          {r.full_name ? r.full_name[0] : '?'}
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                          {/* НИКНЕЙМ С КУПЛЕННЫМ СТИЛЕМ */}
                          <span className={`text-sm font-bold uppercase tracking-tighter truncate transition-all ${
                            r.nick_style === 'gold_neon' ? 'text-om-gold drop-shadow-[0_0_5px_#b8860b]' : 'text-white'
                          }`}>
                            {r.full_name}
                          </span>
                          {r.rating && (
                            <span className="text-om-accent text-[10px] mt-0.5">{'★'.repeat(r.rating)}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-om-gray italic font-serif text-base sm:text-lg leading-relaxed px-3 sm:px-4 border-l border-om-red/30 break-words">
                        "{r.text}" 
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => { onClose(); onBook(quest.id); }}
            className="mt-8 sm:mt-10 w-full bg-om-accent text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl shadow-om-accent/20 active:scale-95 text-sm sm:text-base"
          >
            Забронировать сеанс
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default QuestDetails;