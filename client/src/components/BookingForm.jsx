import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Users, Info, AlertCircle } from 'lucide-react';

const BookingForm = ({ slot, user, selectedPlayers, onClose, onConfirm }) => {
  const [data, setData] = useState({
    client_name: user?.full_name || '',
    client_email: user?.email || '',
    players_count: selectedPlayers?.players || 2,
    client_phone: '',
    comment: '',
    use_bonuses: false
  });

  // Логика цен
  const basePrice = selectedPlayers?.price || slot.price;
  const userBonuses = user?.bonuses || 0;
  const finalPrice = data.use_bonuses ? Math.max(basePrice - 20, 0) : basePrice;
  const currentDeposit = Math.round(finalPrice * 0.2);

  // --- ВАЛИДАЦИЯ (ПРОВЕРКА) ---
  // Проверяем, что телефон не пустой и в нем хотя бы 7 цифр
  const isPhoneValid = data.client_phone.trim().length >= 7;
  const isToday = new Date(slot.slot_date).toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-om-surface p-8 md:p-10 rounded-[2.5rem] border border-white/10 max-w-2xl w-full relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-om-gray hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {/* ИНФОРМАЦИЯ О СЕАНСЕ И ЦЕНАХ */}
        <div className={`mb-8 p-6 border-l-4 transition-all duration-500 ${isToday ? 'bg-red-600/10 border-red-600' : 'bg-om-accent/10 border-om-accent'}`}>
            <h3 className={`${isToday ? 'text-red-500' : 'text-om-accent'} font-black uppercase text-sm mb-2 flex items-center gap-2`}>
                <Info size={16} /> {isToday ? 'Срочное подтверждение' : 'Информация о сеансе'}
            </h3>
            
            <div className="flex flex-col gap-1 text-left">
              <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Стоимость сеанса:</span>
                <span className="text-sm font-bold text-white">
                    {data.use_bonuses ? (
                        <><span className="line-through opacity-30 mr-2">{basePrice}</span> {finalPrice} BYN</>
                    ) : `${basePrice} BYN`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-300 font-bold uppercase tracking-widest text-[10px]">Предоплата (20%):</span>
                <span className="text-xl font-black text-om-accent italic">{currentDeposit} BYN</span>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* ИМЯ */}
            <div className="relative opacity-50">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={16}/>
                <input readOnly value={data.client_name} className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-gray-400 cursor-not-allowed"/>
            </div>

            {/* ТЕЛЕФОН - С ПРОВЕРКОЙ */}
            <div className="relative">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${!isPhoneValid ? 'text-red-500' : 'text-om-accent'}`} size={16}/>
                <input 
                  placeholder="Контактный телефон *" 
                  className={`w-full bg-black border p-4 pl-12 rounded-2xl text-sm outline-none transition-all text-white ${
                    !isPhoneValid ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-om-accent'
                  }`}
                  value={data.client_phone}
                  onChange={e => setData({...data, client_phone: e.target.value})}
                />
                {!isPhoneValid && data.client_phone.length > 0 && (
                    <span className="text-[8px] text-red-500 absolute -bottom-4 left-4 uppercase font-bold">Введите корректный номер</span>
                )}
            </div>

            {/* EMAIL */}
            <div className="relative opacity-50">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={16}/>
                <input readOnly value={data.client_email} className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-gray-400 cursor-not-allowed"/>
            </div>

            {/* КОЛ-ВО ЧЕЛОВЕК */}
            <div className="relative opacity-50">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={16}/>
                <input readOnly value={`${data.players_count} человек`} className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-gray-400 cursor-not-allowed"/>
            </div>

            <textarea 
              placeholder="Комментарии..." 
              className="md:col-span-2 bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-om-accent h-20 text-white resize-none"
              onChange={e => setData({...data, comment: e.target.value})}
            />
        </div>

        {/* ГАЛОЧКА СКИДКИ */}
        <div className="mt-6">
           <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${userBonuses < 30 ? 'opacity-20 grayscale border-white/5' : 'cursor-pointer hover:bg-white/5 border-white/10'}`}>
                <input 
                  type="checkbox" 
                  disabled={userBonuses < 30}
                  checked={data.use_bonuses}
                  onChange={e => setData({...data, use_bonuses: e.target.checked})}
                  className="w-5 h-5 accent-om-accent"
                />
                <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase tracking-tighter">Использовать 30 оменов для скидки (20 BYN)</p>
                    <p className="text-[9px] text-om-gray font-bold">Ваш баланс: {userBonuses} OM</p>
                </div>
           </label>
        </div>

        {/* КНОПКА БРОНИРОВАНИЯ - ЗАБЛОКИРОВАНА ЕСЛИ ТЕЛЕФОН НЕ ВВЕДЕН */}
        <button 
          disabled={!isPhoneValid}
          onClick={() => onConfirm({...data, final_price: finalPrice, deposit_amount: currentDeposit})} 
          className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] mt-10 transition-all shadow-xl shadow-om-accent/20 ${
            isPhoneValid 
            ? 'bg-om-accent text-white hover:bg-white hover:text-black active:scale-[0.98]' 
            : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5 shadow-none'
          }`}
        >
          {!isPhoneValid ? 'Введите номер телефона' : 'Забронировать'}
        </button>
      </motion.div>
    </div>
  );
};

export default BookingForm;