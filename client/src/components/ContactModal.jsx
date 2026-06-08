import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, HelpCircle, User, Mail, MessageSquare } from 'lucide-react';
import axios from 'axios';

const ContactModal = ({ isOpen, onClose, user }) => {
  const [data, setData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    question: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/contact', data);
      alert(res.data);
      setData({ ...data, question: '' });
      onClose();
    } catch (err) { alert("Ошибка отправки"); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-om-surface p-8 rounded-[2.5rem] border border-om-accent/30 max-w-md w-full relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-om-gray hover:text-white"><X /></button>
        
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-om-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-om-accent/30">
                <HelpCircle className="text-om-accent" size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Есть вопросы?</h3>
            <p className="text-[10px] text-om-gray uppercase tracking-widest mt-2 font-bold">Мы на связи 24/7</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={16} />
            <input 
              placeholder="Ваше имя"
              className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-white outline-none focus:border-om-accent transition-all"
              value={data.name}
              onChange={e => setData({...data, name: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={16} />
            <input 
              type="email"
              placeholder="Email для ответа"
              className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-white outline-none focus:border-om-accent transition-all"
              value={data.email}
              onChange={e => setData({...data, email: e.target.value})}
              required
            />
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 text-om-gray" size={16} />
            <textarea 
              placeholder="Введите ваш вопрос..."
              className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-sm text-white outline-none focus:border-om-accent transition-all min-h-[120px] resize-none"
              value={data.question}
              onChange={e => setData({...data, question: e.target.value})}
              required
            />
          </div>

          <button className="w-full bg-om-white text-om-bg py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-om-accent hover:text-white transition-all flex items-center justify-center gap-3">
            Отправить сообщение <Send size={14} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ContactModal;