import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, MessageSquareQuote } from 'lucide-react';

const ReviewModal = ({ booking, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-om-surface p-10 rounded-[3rem] border border-om-accent/30 max-w-xl w-full relative shadow-[0_0_50px_rgba(230,57,70,0.15)]"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-om-gray hover:text-white transition-all"><X size={28} /></button>
        
        <div className="mb-10 text-left">
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Ваш вердикт</h3>
            <p className="text-om-gray text-[10px] uppercase tracking-widest mt-2">Оставьте след в истории испытания: <span className="text-om-accent">{booking.title}</span></p>
        </div>
        
        <div className="space-y-8 text-left">
          {/* ВЫБОР ЗВЕЗД */}
          <div className="flex flex-col items-center py-6 bg-black/40 rounded-3xl border border-white/5">
            <p className="text-[9px] text-gray-500 uppercase font-bold mb-4 tracking-widest">Оцените уровень погружения</p>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-all duration-300"
                >
                  <Star 
                    size={36} 
                    fill={(hoverRating || rating) >= star ? "#E63946" : "none"} 
                    className={(hoverRating || rating) >= star ? "text-om-accent drop-shadow-[0_0_8px_#E63946]" : "text-white/20"}
                  />
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold text-om-accent uppercase tracking-tighter italic">
                {rating === 5 ? 'Превосходно' : rating === 4 ? 'Очень страшно' : rating === 3 ? 'Неплохо' : rating === 2 ? 'Слабо' : 'Не рекомендую'}
            </p>
          </div>

          {/* ПОЛЕ ВВОДА */}
          <div className="relative">
            <div className="absolute top-4 left-4 text-om-accent opacity-30"><MessageSquareQuote size={20}/></div>
            <textarea 
              placeholder="Опишите ваши эмоции (без спойлеров к сюжету)..."
              className="w-full bg-black border border-white/10 p-6 pl-12 rounded-3xl text-sm outline-none focus:border-om-accent transition-all text-white min-h-[150px] shadow-inner"
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={!comment.trim()}
            onClick={() => onSubmit(booking.id, rating, comment)}
            className="w-full bg-om-white text-om-bg py-5 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-om-accent hover:text-white transition-all disabled:opacity-20 shadow-2xl"
          >
            Опубликовать отзыв <Send size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewModal;