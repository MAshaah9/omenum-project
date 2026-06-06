import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Skull, Users, ChevronRight, RefreshCcw, Sparkles } from 'lucide-react';

const questions = [
  {
    id: 1,
    text: "Сколько искателей в вашей команде?",
    icon: <Users className="text-om-accent" />,
    options: [
      { text: "Я один", value: "solo", weight: "Легко" },
      { text: "2-4 человека", value: "small", weight: "Средне" },
      { text: "Большая компания (5+)", value: "large", weight: "Сложно" }
    ]
  },
  {
    id: 2,
    text: "Какой порог страха вы готовы переступить?",
    icon: <Skull className="text-om-accent" />,
    options: [
      { text: "Хочу только логику (0%)", value: "logic", weight: "Легко" },
      { text: "Легкий мандраж (50%)", value: "thriller", weight: "Средне" },
      { text: "Полный ужас (100%)", value: "horror", weight: "Сложно" }
    ]
  },
  {
    id: 3,
    text: "Что важнее: разум или инстинкты?",
    icon: <Brain className="text-om-accent" />,
    options: [
      { text: "Сложные механизмы", value: "hard_logic", weight: "Сложно" },
      { text: "Активное действие", value: "action", weight: "Средне" }
    ]
  }
];

const QuestMatcher = ({ isOpen, onClose, quests }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState([]);
  const [result, setResult] = useState(null);

  const handleAnswer = (weight) => {
    const newScores = [...scores, weight];
    setScores(newScores);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Логика подбора: ищем квест, сложность которого чаще всего совпадала с ответами
      const mostFrequent = newScores.sort((a,b) =>
          newScores.filter(v => v===a).length - newScores.filter(v => v===b).length
      ).pop();
      
      const recommendation = quests.find(q => q.difficulty === mostFrequent) || quests[0];
      setResult(recommendation);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setScores([]);
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-om-bg/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-om-surface border border-white/5 p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-om-accent/5 blur-[100px] rounded-full -mr-32 -mt-32" />

        <button onClick={onClose} className="absolute top-8 right-8 text-om-gray hover:text-white transition uppercase text-[10px] font-bold tracking-widest">Закрыть</button>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                {questions[currentStep].icon}
                <span className="text-[10px] font-bold text-om-accent uppercase tracking-[0.3em]">
                  Анализ предпочтений: {currentStep + 1} / {questions.length}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-10 tracking-tighter uppercase">
                {questions[currentStep].text}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {questions[currentStep].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.weight)}
                    className="group flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-om-accent/50 hover:bg-om-accent/5 transition-all duration-300 text-left"
                  >
                    <span className="text-sm font-semibold group-hover:text-white transition-colors">{opt.text}</span>
                    <ChevronRight size={18} className="text-om-gray group-hover:text-om-accent group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-om-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-om-accent/30">
                <Sparkles className="text-om-accent" size={32} />
              </div>
              <h3 className="text-sm uppercase tracking-[0.4em] text-om-gray mb-2 font-bold">Оптимальный выбор:</h3>
              <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">
                {result.title}
              </h2>
              <div className="p-6 bg-black/40 border border-white/5 rounded-2xl mb-10">
                <p className="text-om-gray text-sm font-light italic leading-relaxed">
                  "{result.description}"
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    onClose();
                    document.getElementById('schedule-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-om-accent text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(230,57,70,0.3)] transition-all"
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