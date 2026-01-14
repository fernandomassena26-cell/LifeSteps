
import React, { useState } from 'react';
import { calculateActivityCalories } from '../services/geminiService';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onAddCalories: (kcal: number) => void;
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
      onAddCalories(result.calories);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setResult(null);
        setInput('');
      }, 2000);
    }
  };

  if (!isPremium) return null;

  return (
    <div className="px-4 mb-8">
      <div className={`glass-card rounded-[32px] p-6 border-blue-500/20 border relative overflow-hidden group ${!isDark && 'shadow-sm'}`}>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>Calculadora AI</h3>
              <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase tracking-widest font-black`}>Recurso Premium Ativo</p>
            </div>
          </div>
        </div>

        <p className={`${isDark ? 'text-white/60' : 'text-black/60'} text-xs mb-4 leading-relaxed`}>
          Informe sua atividade e a IA calculará o gasto calórico baseado no seu perfil.
        </p>
        
        <div className="relative z-10">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Corri 5km em 30 min..."
              className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-black/5 border-black/10 text-black placeholder:text-black/20'} border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all pr-14`}
              onKeyPress={(e) => e.key === 'Enter' && handleCalculate()}
            />
            <button 
              onClick={handleCalculate}
              disabled={loading || !input}
              className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-blue-700 active:scale-90 transition-all"
            >
              {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
            </button>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-5 ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 border`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-blue-600 text-[9px] font-black uppercase block tracking-widest mb-1">Estimativa de Queima</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{result.calories}</span>
                  <span className={`text-xs font-bold uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>kcal</span>
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={added}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${added ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white shadow-xl hover:bg-blue-700'}`}
              >
                {added ? <><i className="fa-solid fa-check mr-2"></i> Salvo</> : 'Registrar'}
              </button>
            </div>
            <div className={`flex gap-3 items-start border-t ${isDark ? 'border-white/5' : 'border-black/5'} pt-3`}>
              <i className="fa-solid fa-quote-left text-blue-500/40 text-xs mt-1"></i>
              <p className={`${isDark ? 'text-white/70' : 'text-black/70'} text-[11px] leading-relaxed italic`}>{result.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
