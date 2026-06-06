import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, options, selectedValues, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие при клике вне списка
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-300 min-w-[160px] ${
          selectedValues.length > 0 
          ? 'border-om-accent bg-om-accent/5 text-white' 
          : 'border-white/10 bg-black/20 text-om-gray hover:border-white/30'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest truncate">
          {selectedValues.length > 0 ? `${label}: ${selectedValues.length}` : label}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-om-surface border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden p-2"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((opt) => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => onToggle(opt)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs hover:bg-white/5 transition-colors text-left mb-1 last:mb-0"
                  >
                    <span className={isSelected ? 'text-om-accent font-bold' : 'text-om-gray'}>{opt}</span>
                    {isSelected && <Check size={14} className="text-om-accent" />}
                  </button>
                );
              })}
            </div>
            {selectedValues.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle('CLEAR_ALL'); }}
                className="w-full mt-2 pt-2 border-t border-white/5 text-[9px] uppercase font-bold text-gray-500 hover:text-white transition-colors py-1"
              >
                Сбросить всё
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterDropdown;