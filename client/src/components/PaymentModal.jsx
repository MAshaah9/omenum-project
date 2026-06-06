import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Calendar, Users, Clock, Lock } from 'lucide-react';

const PaymentModal = ({ booking, onClose, onPay }) => {
  const [senderCard, setSenderCard] = useState('');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-om-surface p-8 md:p-12 rounded-[3rem] border border-white/10 max-w-xl w-full relative shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all"><X size={30} /></button>
        
        <div className="mb-10 text-left">
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Подтверждение оплаты</h3>
            <p className="text-om-gray text-xs uppercase tracking-widest mt-2">Omenum Secure Payment Gateway</p>
        </div>
        
        <div className="space-y-6 text-left">
          {/* ПОЛНАЯ ИНФОРМАЦИЯ О БРОНИРОВАНИИ */}
          <div className="bg-black/60 p-8 rounded-3xl border border-white/5 space-y-4">
            <div className="border-b border-white/10 pb-4">
                <p className="text-[10px] text-om-accent font-black uppercase mb-1">Выбранное испытание</p>
                <p className="text-2xl font-bold text-white uppercase">{booking.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-om-gray" />
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">Дата и время</p>
                        <p className="text-sm font-bold text-white">{new Date(booking.booking_date).toLocaleDateString()} в {booking.booking_time.slice(0,5)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Users size={18} className="text-om-gray" />
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">Состав команды</p>
                        <p className="text-sm font-bold text-white">{booking.players_count} человек</p>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-white/10">
                <p className="text-sm font-bold text-om-gray uppercase">Сумма предоплаты:</p>
                <p className="text-3xl font-black text-om-accent">{booking.deposit_amount} BYN</p>
            </div>
          </div>

          {/* Реквизиты ПОЛУЧАТЕЛЯ */}
          <div className="bg-om-accent/5 border border-om-accent/20 p-6 rounded-2xl">
            <p className="text-[10px] text-om-accent font-bold uppercase mb-2">Реквизиты лаборатории</p>
            <p className="text-lg text-white font-mono tracking-widest text-center italic">4400 1122 3344 5566</p>
          </div>

          {/* Ввод карты ОТПРАВИТЕЛЯ */}
          <div className="space-y-3">
            <label className="text-xs uppercase text-gray-400 font-bold ml-2">Ваша карта</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000"
              maxLength="19"
              className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xl outline-none focus:border-om-accent transition-all font-mono tracking-widest text-white text-center"
              value={senderCard}
              onChange={e => setSenderCard(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
            />
          </div>

          <button 
            disabled={senderCard.length < 19}
            onClick={() => onPay(booking.id, senderCard)}
            className="w-full bg-om-accent text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all disabled:opacity-20 shadow-2xl"
          >
            Подтвердить платеж
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;