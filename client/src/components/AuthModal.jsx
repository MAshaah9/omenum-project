import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, isLogin, setIsLogin, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Затемнение фона */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Само окно */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-om-surface border border-white/10 p-10 rounded-[2rem] shadow-2xl shadow-om-accent/10"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-om-gray hover:text-white transition">
            <X size={20} />
          </button>

          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-white uppercase tracking-tighter">
              {isLogin ? 'Авторизация' : 'Регистрация'}
            </h3>
            <p className="text-om-gray text-xs mt-2 uppercase tracking-widest font-medium">
              {isLogin ? 'Добро пожаловать в Omenum' : 'Станьте частью лаборатории'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={18} />
                <input 
                  type="text" 
                  placeholder="Ваше имя"
                  className="w-full bg-black/50 border border-white/5 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-om-accent/50 transition-all text-sm"
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={18} />
              <input 
                type="email" 
                placeholder="Электронная почта"
                className="w-full bg-black/50 border border-white/5 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-om-accent/50 transition-all text-sm"
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-om-gray" size={18} />
              <input 
                type="password" 
                placeholder="Пароль"
                className="w-full bg-black/50 border border-white/5 py-4 pl-12 pr-4 rounded-2xl outline-none focus:border-om-accent/50 transition-all text-sm"
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <button className="w-full bg-om-white text-om-bg py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-om-accent hover:text-white transition-all duration-500 mt-6 group">
              {isLogin ? 'Войти в систему' : 'Создать аккаунт'}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] text-om-gray uppercase tracking-widest font-bold hover:text-om-accent transition-colors"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;