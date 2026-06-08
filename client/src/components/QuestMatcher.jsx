import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Skull, Users, ChevronRight, RefreshCcw, Sparkles } from 'lucide-react';

const questions = [
  {
    id: 1,
    text: "Сколько участников в вашей команде?",
    key: "max_players",
    options: [
      { text: "Я один (1 чел)", value: 1 },
      { text: "Небольшая группа (2-4)", value: 4 },
      { text: "Нас много (5+)", value: 10 }
    ]
  },
  {
    id: 2,
    text: "Какой уровень страха вы ищете?",
    key: "fear_level",
    options: [
      { text: "Не страшный", value: "Не страшный" },
      { text: "Немного испугаться", value: "Страшный" },
      { text: "Очень страшный", value: "Очень страшный" }
    ]
  },
  {
    id: 3,
    text: "Какой уровень сложности вы бы хотели?",
    key: "difficulty",
    options: [
      { text: "Легкое задания", value: "Легко" },
      { text: "Можно было подумать", value: "Средне" },
      { text: "Сложные схемы", value: "Сложно" }
    ]
  }
];

const QuestMatcher = ({ isOpen, onClose, quests, onResultSelect }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleAnswer = (key, value) => {
    const newAnswers = { ...userAnswers, [key]: value };
    setUserAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // --- УЛУЧШЕННЫЙ АЛГОРИТМ ПОДБОРА ---
      // Ищем квест, который совпадает по большинству критериев
      const scoredQuests = quests.map(q => {
        let score = 0;
        if (q.fear_level === newAnswers.fear_level) score += 3;
        if (q.difficulty === newAnswers.difficulty) score += 2;
        if (q.max_players >= newAnswers.max_players) score += 1;
        return { ...q, matchScore: score };
      });

      // Сортируем по баллу совпадения и берем лучший
      const bestMatch = scoredQuests.sort((a, b) => b.matchScore - a.matchScore)[0];
      setResult(bestMatch);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setUserAnswers({});
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-om-bg/95 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-om-surface border border-white/5 p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-om-gray hover:text-white transition uppercase text-[10px] font-bold">Закрыть</button>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="q" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <span className="text-[10px] font-bold text-om-accent uppercase tracking-[0.3em]">Шаг {currentStep + 1} / 3</span>
              <h3 className="text-3xl font-bold text-white mt-4 mb-10 uppercase">{questions[currentStep].text}</h3>
              <div className="grid gap-4">
                {questions[currentStep].options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(questions[currentStep].key, opt.value)} className="w-full flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-om-accent/50 transition-all text-left group">
                    <span className="text-sm font-semibold group-hover:text-white">{opt.text}</span>
                    <ChevronRight size={18} className="text-om-gray group-hover:text-om-accent" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <Sparkles className="text-om-accent mx-auto mb-6" size={40} />
              <h3 className="text-xs uppercase tracking-[0.4em] text-om-gray mb-2">Идеально подходит:</h3>
              <h2 className="text-4xl font-black text-white mb-6 uppercase italic">{result.title}</h2>
              
              <div className="p-6 bg-black/40 border border-white/5 rounded-2xl mb-10">
                <p className="text-om-gray text-sm font-light italic leading-relaxed">"{result.short_description || result.description.slice(0, 100) + '...'}"</p>
              </div>

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    onClose(); 
                    onResultSelect(result.id); // <--- ВЫЗОВ ФУНКЦИИ БРОНИ
                  }}
                  className="bg-om-accent text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all"
                >
                  Забронировать этот квест
                </button>
                <button onClick={reset} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <RefreshCcw size={20} className="text-om-gray" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default QuestMatcher;