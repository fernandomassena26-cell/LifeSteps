
import React, { useState } from 'react';
import { calculateActivityCalories } from '../services/geminiService';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onAddCalories: (kcal: number, activityName: string) => void;
  isPremium: boolean;
  isDark: boolean;
}

export const ActivityCalculator: React.FC<Props> = ({ profile, onAddCalories, isPremium, isDark }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ calories: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleCalculate = async () => {
    if (!input || loading) return;
    setLoading(true);
    setResult(null);
    setAdded(false);
    try {
      const data = await calculateActivityCalories(input, profile);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (result) {
      onAddCalories(result.calories, input);
      setAdded(true);
      // Feedback visual e limpa após 2 segundos
      setTimeout(() => {
        setAdded(false);
        setResult(null);
        setInput('');
      }, 2500);
    }
  };

  if (!isPremium) return null;

  return (
    <div className="px-4 mb-8">
      <div className={`glass-card rounded-[32px] p-6 border-blue-500/30 border relative overflow-hidden group transition-all duration-500 ${!isDark && 'shadow-lg shadow-blue-500/5'}`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <i className="fa-solid fa-bolt-lightning text-white text-xl"></i>
          </div>
          <div>
            <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>Cálculo de Calorias AI</h3>
            <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-[9px] uppercase tracking-widest font-black`}>Módulo de Precisão Bio-Métrica</p>
          </div>
        </div>

        <p className={`${isDark ? 'text-white/60' : 'text-black/60'} text-xs mb-5 leading-relaxed font-medium`}>
          Digite o que você fez (ex: "Joguei futebol por 40 min") e nossa IA calculará o gasto baseado no seu perfil físico.
        </p>
        
        <div className="relative z-10 space-y-3">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva sua atividade..."
              className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-black/5 border-black/10 text-black placeholder:text-black/30'} border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all pr-14 font-medium`}
              onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            />
            <button 
              onClick={handleCalculate}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-magnifying-glass text-xs"></i>}
            </button>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'} rounded-3xl animate-in fade-in zoom-in-95 duration-500 border`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className={`text-blue-600 text-[9px] font-black uppercase block tracking-widest mb-1`}>Gasto Estimado</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{result.calories}</span>
                  <span className={`text-xs font-bold uppercase ${isDark ? 'text-white/30' : 'text-black/40'}`}>kcal</span>
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={added}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${added ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-90'}`}
              >
                {added ? <><i className="fa-solid fa-check mr-2"></i> Adicionado</> : 'Registrar'}
              </button>
            </div>
            <div className={`flex gap-3 items-start border-t ${isDark ? 'border-white/5' : 'border-black/5'} pt-4`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-500/20' : 'bg-blue-600/10'}`}>
                <i className="fa-solid fa-comment-dots text-blue-500 text-[10px]"></i>
              </div>
              <p className={`${isDark ? 'text-white/70' : 'text-black/70'} text-[11px] leading-relaxed italic font-medium`}>"{result.feedback}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
