
import React from 'react';

interface PremiumOverlayProps {
  onUpgrade: () => void;
}

export const PremiumOverlay: React.FC<PremiumOverlayProps> = ({ onUpgrade }) => {
  return (
    <div className="p-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-bounce">
        <i className="fa-solid fa-crown text-white text-4xl"></i>
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Desbloquear Premium</h2>
      <p className="text-white/60 mb-8 text-sm leading-relaxed px-4">
        Tenha acesso à Calculadora de Atividades AI, Rotinas de Treino Personalizadas e Planos de Dieta por apenas <span className="text-yellow-400 font-bold">R$ 9,90</span>.
      </p>
      
      <div className="space-y-4 mb-8 text-left max-w-xs mx-auto">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-check text-yellow-500"></i>
          <span className="text-white/80 text-sm">Calculadora de Calorias AI</span>
        </div>
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-check text-yellow-500"></i>
          <span className="text-white/80 text-sm">Treinos Passo a Passo</span>
        </div>
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-check text-yellow-500"></i>
          <span className="text-white/80 text-sm">Planos de Nutrição Profissionais</span>
        </div>
      </div>

      <button 
        onClick={onUpgrade}
        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
      >
        Assinar Agora - R$ 9,90
      </button>
      <p className="mt-4 text-[10px] text-white/20">Pagamento único. Acesso vitalício.</p>
    </div>
  );
};
