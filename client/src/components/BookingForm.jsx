import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Users, MessageSquare } from 'lucide-react';

const BookingForm = ({ slot, onClose, onConfirm, userBonuses }) => {
  const deposit = Math.round(slot.price * 0.2);
  const [data, setData] = useState({
    client_name: '', client_phone: '', client_email: '',
    players_count: 2, comment: '', use_bonuses: false
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-om-surface p-10 rounded-[2rem] border border-white/10 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
        
        <div className="mb-8 p-6 bg-om-accent/10 border-l-4 border-om-accent">
            <h3 className="text-om-accent font-black uppercase text-sm mb-1">Важное уведомление</h3>
            <p className="text-xs text-gray-300">Для подтверждения брони необходимо внести предоплату <b>{deposit} BYN</b> в течение суток (но не позже чем за 24ч до игры).</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div className="relative"><User className="absolute left-3 top-3 text-om-gray" size={16}/><input placeholder="Имя" className="w-full bg-black border border-white/5 p-3 pl-10 rounded-xl text-sm outline-none focus:border-om-accent" onChange={e => setData({...data, client_name: e.target.value})} /></div>
            <div className="relative"><Phone className="absolute left-3 top-3 text-om-gray" size={16}/><input placeholder="Телефон" className="w-full bg-black border border-white/5 p-3 pl-10 rounded-xl text-sm outline-none focus:border-om-accent" onChange={e => setData({...data, client_phone: e.target.value})} /></div>
            <div className="relative"><Mail className="absolute left-3 top-3 text-om-gray" size={16}/><input placeholder="Email" className="w-full bg-black border border-white/5 p-3 pl-10 rounded-xl text-sm outline-none focus:border-om-accent" onChange={e => setData({...data, client_email: e.target.value})} /></div>
            <div className="relative"><Users className="absolute left-3 top-3 text-om-gray" size={16}/><input type="number" placeholder="Кол-во человек" className="w-full bg-black border border-white/5 p-3 pl-10 rounded-xl text-sm outline-none focus:border-om-accent" onChange={e => setData({...data, players_count: e.target.value})} /></div>
            <textarea placeholder="Комментарий (необязательно)" className="col-span-2 bg-black border border-white/5 p-3 rounded-xl text-sm outline-none focus:border-om-accent h-20" onChange={e => setData({...data, comment: e.target.value})} />
        </div>

        <label className="flex items-center gap-3 mt-6 cursor-pointer group">
            <input type="checkbox" className="accent-om-accent" onChange={e => setData({...data, use_bonuses: e.target.checked})} />
            <span className="text-[10px] uppercase font-bold text-om-gray group-hover:text-white transition">Использовать накопленные бонусы ({userBonuses} OM)</span>
        </label>

        <button onClick={() => onConfirm(data)} className="w-full bg-om-accent text-white py-4 rounded-2xl font-black uppercase mt-8 hover:bg-white hover:text-black transition-all">Забронировать</button>
      </motion.div>
    </div>
  );
};

export default BookingForm;