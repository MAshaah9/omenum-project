import React, { useState } from 'react';
import { motion } from 'framer-motion';

const BonusModal = ({ booking, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('10');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-om-surface p-8 md:p-10 rounded-[2rem] border border-om-accent/30 max-w-xl w-full relative"
      >
        <h3 className="text-xl font-black text-white uppercase mb-8 italic tracking-widest text-left">
          Зачислить Омены
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
           <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[8px] text-om-accent uppercase font-bold mb-2">Клиент</p>
              <p className="text-sm font-bold text-white uppercase leading-tight">{booking.client_name}</p>
              <p className="text-[10px] text-om-gray mt-1">{booking.client_phone}</p>
           </div>
           <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[8px] text-om-gold uppercase font-bold mb-2">Оплата</p>
              <p className="text-lg font-black text-white">{booking.deposit_amount} BYN</p>
              <p className="text-[8px] text-gray-500 mt-1 uppercase">Карта: {booking.sender_card || 'Не указана'}</p>
           </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
           <p className="text-[10px] text-gray-400 uppercase font-bold mb-4">Бонусов к зачислению:</p>
           <div className="flex flex-col gap-4">
              <input 
                type="number" 
                className="w-full bg-black border border-white/10 p-4 rounded-xl text-2xl font-black text-om-accent text-center outline-none focus:border-om-accent"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <button 
                onClick={() => onConfirm(booking.id, amount)}
                className="w-full bg-om-accent text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Подтвердить и закрыть
              </button>
           </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="mt-4 text-[9px] text-gray-600 uppercase font-bold hover:text-white transition-colors"
        >
          Отмена
        </button>
      </motion.div>
    </div>
  );
};

export default BonusModal;