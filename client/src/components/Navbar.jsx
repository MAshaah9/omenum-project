import React, { useState } from 'react';
import { User, LogOut, Sword, Menu, X, ShieldCheck } from 'lucide-react';

const Navbar = ({ user, setView, onLogout, onAuthClick }) => {
  const [isOpen, setIsOpen] = useState(false); // Состояние: открыто ли меню на телефоне

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-om-bg/80 backdrop-blur-md border-b border-white/5 px-6 md:px-10 py-4 flex justify-between items-center">
      {/* Логотип */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('main'); setIsOpen(false); }}>
        <div className="w-8 h-8 bg-om-accent flex items-center justify-center rounded-lg text-white"><Sword size={20} /></div>
        <h1 className="text-xl font-extrabold text-white uppercase italic tracking-tighter">OMENUM</h1>
      </div>

      {/* Кнопка открытия меню для МОБИЛОК */}
      <button className="md:hidden text-white p-2" onClick={toggleMenu}>
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* МЕНЮ ДЛЯ КОМПЬЮТЕРА (скрыто на мобилках через hidden md:flex) */}
      <div className="hidden md:flex items-center gap-10">
        <button onClick={() => setView('main')} className="text-[11px] font-bold uppercase tracking-widest hover:text-om-accent transition">Испытания</button>
        {user ? (
          <div className="flex items-center gap-6 border-l border-white/10 pl-8">
            <button onClick={() => setView(user.role === 'admin' ? 'admin' : 'profile')} className="flex items-center gap-2 text-[11px] font-bold uppercase text-om-accent">
              <User size={16} /> Кабинет
            </button>
            <button onClick={onLogout} className="text-om-gray hover:text-white transition"><LogOut size={18} /></button>
          </div>
        ) : (
          <button onClick={onAuthClick} className="bg-om-accent text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:shadow-lg transition-all">Вход</button>
        )}
      </div>

      {/* ВЫПЛАВАЮЩЕЕ МЕНЮ ДЛЯ ТЕЛЕФОНА */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-om-surface border-b border-white/10 flex flex-col p-6 gap-6 md:hidden animate-in slide-in-from-top duration-300">
          <button onClick={() => { setView('main'); setIsOpen(false); }} className="text-left text-sm font-bold uppercase tracking-widest">Квесты</button>
          {user ? (
            <>
              <button onClick={() => { setView(user.role === 'admin' ? 'admin' : 'profile'); setIsOpen(false); }} className="text-left text-sm font-bold uppercase tracking-widest text-om-accent">Мой Кабинет</button>
              <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-left text-sm font-bold uppercase tracking-widest text-red-500">Выйти</button>
            </>
          ) : (
            <button onClick={() => { onAuthClick(); setIsOpen(false); }} className="bg-om-accent text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-[0.2em]">Войти в систему</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;