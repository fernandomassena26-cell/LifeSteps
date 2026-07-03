
import React, { useState, useEffect } from 'react';
import { getDietBuilderOptions, validateUserDiet } from '../services/fitnessService';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  isDark: boolean;
}

export const DietBuilder: React.FC<Props> = ({ profile, isDark }) => {
  const [options, setOptions] = useState<any>(null);
  const [selected, setSelected] = useState<any>({ breakfast: null, lunch: null, dinner: null, snacks: null });
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [savedDiet, setSavedDiet] = useState<any>(null);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const DIET_STORAGE_KEY = `fitpulse_saved_diet_${profile.id}`;

  useEffect(() => {
    // Carrega opções da API
    getDietBuilderOptions(profile.goal).then(data => {
      if (data) setOptions(data);
      setLoading(false);
    });

    // Carrega dieta salva vinculada ao usuário
    const saved = localStorage.getItem(DIET_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedDiet(parsed);
      setSelected(parsed.meals);
    }
  }, [profile.goal, profile.id]);

  const toggleSelect = (category: string, item: any) => {
    setSelected(prev => ({
      ...prev,
      [category]: prev[category]?.id === item.id ? null : item
    }));
    setValidationResult(null);
  };

  const handleValidate = async () => {
    const meals = Object.values(selected).filter(Boolean);
    if (meals.length === 0) return;
    setValidating(true);
    const result = await validateUserDiet(meals, profile);
    setValidationResult(result);
    setValidating(false);
  };

  const handleSaveDiet = () => {
    const dietToSave = {
      meals: selected,
      date: new Date().toISOString(),
      goal: profile.goal
    };
    localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify(dietToSave));
    setSavedDiet(dietToSave);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const clearSavedDiet = () => {
    localStorage.removeItem(DIET_STORAGE_KEY);
    setSavedDiet(null);
    setSelected({ breakfast: null, lunch: null, dinner: null, snacks: null });
    setValidationResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-20 h-20 mb-6">
          <i className="fa-solid fa-utensils text-4xl text-blue-600 absolute inset-0 flex items-center justify-center animate-pulse"></i>
          <div className="absolute inset-0 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className={`font-black uppercase tracking-[0.3em] text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>Carregando Opções...</p>
      </div>
    );
  }

  const categories = [
    { key: 'breakfast', label: 'Café da Manhã', icon: 'fa-coffee' },
    { key: 'lunch', label: 'Almoço', icon: 'fa-sun' },
    { key: 'dinner', label: 'Jantar', icon: 'fa-moon' },
    { key: 'snacks', label: 'Lanches', icon: 'fa-apple-whole' },
  ];

  const hasSelection = Object.values(selected).some(Boolean);

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-700">
      
      {/* Aviso Profissional de Saúde */}
      <div className={`mx-2 p-4 rounded-2xl border flex gap-3.5 items-start ${
        isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-200/80' : 'bg-amber-50 border-amber-200 text-amber-850'
      }`}>
        <i className="fa-solid fa-circle-exclamation text-base text-amber-500 mt-0.5 shrink-0 animate-pulse"></i>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider">Aviso Importante</h4>
          <p className="text-[10px] leading-relaxed font-medium">
            Este gerador de dieta é apenas de caráter sugestivo para fins demonstrativos. Ele <strong className={isDark ? 'text-white font-bold' : 'text-black font-bold'}>não substitui</strong> o acompanhamento e a prescrição médica ou de um profissional nutricionista qualificado. Sempre consulte um profissional antes de realizar qualquer alteração drástica na sua alimentação.
          </p>
        </div>
      </div>

      {savedDiet && (
        <div className={`mx-2 p-6 rounded-[32px] border shadow-xl ${isDark ? 'bg-blue-600/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'} animate-in slide-in-from-top-4 duration-500 relative overflow-hidden`}>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <i className="fa-solid fa-check-to-slot text-white text-[10px]"></i>
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-widest text-[11px] ${isDark ? 'text-white' : 'text-black'}`}>Dieta Planejada</h3>
              </div>
            </div>
            
            <button onClick={clearSavedDiet} className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20">
              <i className="fa-solid fa-trash-can text-[10px]"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Apagar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {Object.entries(savedDiet.meals).map(([key, meal]: [string, any]) => meal && (
              <div key={key} className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <p className="text-[8px] font-black uppercase text-blue-500 mb-1">{key}</p>
                <p className={`text-[10px] font-black leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{meal.name}</p>
                <p className={`text-[8px] font-bold mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{meal.calories} kcal</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat.key} className="group">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-blue-600/10' : 'bg-blue-600/5'} flex items-center justify-center`}>
                <i className={`fa-solid ${cat.icon} text-blue-500 text-xs`}></i>
              </div>
              <h3 className={`font-black uppercase tracking-widest text-[11px] ${isDark ? 'text-white' : 'text-black'}`}>{cat.label}</h3>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
            {options[cat.key]?.map((item: any) => (
              <div key={item.id} className="shrink-0">
                <button
                  onClick={() => toggleSelect(cat.key, item)}
                  className={`w-72 glass-card rounded-2xl p-5 border text-left transition-all h-full flex flex-col ${
                    selected[cat.key]?.id === item.id 
                    ? 'border-blue-600 bg-blue-600/10 shadow-lg' 
                    : isDark ? 'border-white/5 hover:border-white/20' : 'border-black/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-black text-sm pr-2 ${isDark ? 'text-white' : 'text-black'}`}>{item.name}</h4>
                    <span className="bg-blue-600/10 text-blue-500 text-[9px] font-black px-2 py-1 rounded-md shrink-0">{item.calories} kcal</span>
                  </div>
                  <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-[10px] leading-relaxed italic`}>{item.description}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="fixed bottom-24 left-0 right-0 px-4 z-40 max-w-md mx-auto grid grid-cols-2 gap-3">
        <button onClick={handleValidate} disabled={validating || !hasSelection} className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-blue-600 text-white shadow-2xl disabled:opacity-30">
          {validating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check-double mr-2"></i>} Validar Dieta
        </button>
        <button onClick={handleSaveDiet} disabled={!hasSelection} className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all ${showSavedFeedback ? 'bg-emerald-600 text-white' : isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'} disabled:opacity-30`}>
          {showSavedFeedback ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-floppy-disk mr-2"></i>} {showSavedFeedback ? 'Salvo!' : 'Salvar Dieta'}
        </button>
      </div>

      {validationResult && (
        <div className={`mx-2 p-6 rounded-3xl border shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 ${
          validationResult.status === 'compatible' ? 'bg-emerald-500/10 border-emerald-500/20' :
          validationResult.status === 'partial' ? 'bg-yellow-500/10 border-yellow-500/20' :
          'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              validationResult.status === 'compatible' ? 'bg-emerald-500 text-white' :
              validationResult.status === 'partial' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <i className={`fa-solid ${
                validationResult.status === 'compatible' ? 'fa-check-double text-xl' :
                validationResult.status === 'partial' ? 'fa-triangle-exclamation text-xl' : 'fa-circle-xmark text-xl'
              }`}></i>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/30' : 'text-black/30'}`}>Análise Nutricional</p>
              <h4 className={`font-black text-lg uppercase tracking-tight ${
                validationResult.status === 'compatible' ? 'text-emerald-500' :
                validationResult.status === 'partial' ? 'text-yellow-600' : 'text-red-500'
              }`}>{validationResult.status}</h4>
            </div>
          </div>
          <p className={`${isDark ? 'text-white/80' : 'text-black/80'} text-xs leading-relaxed font-medium bg-black/5 p-4 rounded-xl`}>{validationResult.analysis}</p>
          <div className="mt-4 flex justify-center">
             <button onClick={() => setValidationResult(null)} className="text-[9px] font-black uppercase tracking-widest text-white/20">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
