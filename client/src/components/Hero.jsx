import React from 'react';

function Hero({ onOpenQuiz }) {
  return (
    <section className="relative h-[80vh] flex items-center justify-center text-center px-6">
      <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center opacity-40"></div>

      <div className="relative z-10 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase text-white drop-shadow-lg">
          Найди свой квест
        </h1>

        <p className="mt-6 text-lg md:text-xl text-om-gray font-light tracking-wide">
          Пройди путь героя, выбери квест или доверься системе подбора.
        </p>

        <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6">
          
            <button 
  onClick={() => document.getElementById('quest-catalog')?.scrollIntoView({ behavior: 'smooth' })}
  className="bg-om-accent text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
>
            Смотреть квесты
</button>

          {/* 🔥 Кнопка запуска квиза */}
          <button
            onClick={onOpenQuiz}
            className="px-10 py-4 rounded-xl border border-white/10 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Не знаете, что выбрать?
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
