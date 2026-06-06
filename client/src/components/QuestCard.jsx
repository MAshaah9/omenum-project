import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Skull, MapPin, Heart, Calendar } from 'lucide-react';

const QuestCard = ({ quest, onSelect, user, onFavorite, isFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Иконки черепов в зависимости от уровня страха
  const renderSkulls = (level) => {
    const count = level === 'Очень страшный' ? 3 : level === 'Страшный' ? 2 : 1;
    return Array(count).fill(0).map((_, i) => <Skull key={i} size={14} className="text-white" />);
  };

  const handleHeartClick = (e) => {
    e.stopPropagation(); // Чтобы не открывалось окно деталей квеста
    if (onFavorite) {
      onFavorite(quest.id);
    }
  };

  return (
    <div 
      className="group relative bg-[#1c1c1e] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ИЗОБРАЖЕНИЕ */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={quest.image_url || "https://images.unsplash.com/photo-1505628346881-b72b27e84530?q=80&w=800"} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={quest.title}
        />
        
        {/* Затемнение при наведении */}
        <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Бейдж Новинка */}
        <div className="absolute top-4 left-4 bg-[#2ecc71] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
          Новинка
        </div>

        {/* Правые индикаторы (Возраст, Люди, Страх) */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-white">
          <span className="text-sm font-bold">{quest.min_age}+</span>
          <div className="flex items-center gap-1 text-xs bg-black/20 px-2 py-0.5 rounded">
            <Users size={14} /> <span>2–{quest.max_players}</span>
          </div>
          <div className="flex gap-0.5 bg-black/20 px-2 py-0.5 rounded">
            {renderSkulls(quest.fear_level)}
          </div>
        </div>

        {/* Текст при наведении */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 p-6 text-center z-10"
            >
              <p className="text-white text-xs leading-relaxed font-light italic">
                {quest.short_description || (quest.description ? quest.description.slice(0, 80) + '...' : '')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ИНФОРМАЦИЯ ВНИЗУ */}
      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-lg font-bold text-white mb-1 group-hover:text-om-accent transition-colors">
            {quest.title}
          </h4>
          <div className="flex items-center gap-2 text-[#2ecc71] text-xs">
            <span className="opacity-80">👻</span> {quest.genre}
          </div>
        </div>

        <div className="flex items-center gap-2 text-om-gray text-xs">
          <MapPin size={12} className="text-blue-500" />
          <span>{quest.address || 'ул. Пушкина'}</span>
        </div>

        {/* ОБНОВЛЕННЫЙ БЛОК РЕЙТИНГА */}
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          Рейтинг: {quest.average_rating ? (
            <span className="text-om-gold">{quest.average_rating} ★</span>
          ) : (
            <span className="text-om-gray">нет данных</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Предотвращает всплытие события к родителю
              onSelect(quest.id);
            }}
            className="flex-1 bg-[#c0392b] hover:bg-[#a93226] text-white py-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Calendar size={14} /> Бронировать
          </button>
          
          <button 
            onClick={handleHeartClick}
            className={`ml-4 p-3 rounded-xl transition-all ${
              isFavorite 
                ? 'text-om-accent bg-om-accent/10' 
                : 'text-om-gray hover:text-om-accent'
            }`}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestCard;