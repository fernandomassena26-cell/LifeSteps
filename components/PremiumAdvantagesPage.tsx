
import React from 'react';

interface PremiumAdvantagesPageProps {
  onUpgrade: () => void;
  onBack?: () => void;
  isDark: boolean;
}

export const PremiumAdvantagesPage: React.FC<PremiumAdvantagesPageProps> = ({ onUpgrade, onBack, isDark }) => {
  const advantages = [
    {
      icon: 'fa-ban',
      title: 'Sem Anúncios',
      description: 'Experiência 100% limpa. Foque apenas no que importa: seu progresso e sua saúde.',
      color: 'text-red-500'
    },
    {
      icon: 'fa-wand-magic-sparkles',
      title: 'Calculadora AI',
      description: 'Registre qualquer atividade física e deixe nossa IA calcular o gasto calórico exato.',
      color: 'text-blue-500'
    },
    {
      icon: 'fa-dumbbell',
      title: 'Treinos Ilimitados',
      description: 'Receba rotinas de treino personalizadas geradas pela AI para fazer onde quiser.',
      color: 'text-purple-500'
    },
    {
      icon: 'fa-apple-whole',
      title: 'Nutrição Inteligente',
      description: 'Planos de dieta específicos para seu objetivo, adaptados ao seu peso e altura.',
      color: 'text-emerald-500'
    },
    {
      icon: 'fa-chart-line',
      title: 'Análise Avançada',
      description: 'Acesse o histórico completo de treinos e métricas detalhadas da sua evolução.',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {onBack && (
        <button onClick={onBack} className={`p-4 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>
          <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
        </button>
      )}
      
      <div className="text-center px-6 mt-4 mb-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-[28px] mx-auto mb-6 flex items-center justify-center shadow-xl">
          <i className="fa-solid fa-crown text-white text-4xl"></i>
        </div>
        <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-black'}`}>lifesteps <span className="text-yellow-600">PRO</span></h1>
        <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-sm max-w-xs mx-auto`}>Tudo que você precisa para atingir sua melhor versão.</p>
      </div>

      <div className="px-4 space-y-4 mb-12">
        {advantages.map((adv, idx) => (
          <div key={idx} className={`glass-card rounded-[24px] p-5 border flex gap-5 transition-all ${isDark ? 'border-white/5 hover:border-white/10' : 'border-black/5 hover:border-black/10 shadow-sm'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'} ${adv.color}`}>
              <i className={`fa-solid ${adv.icon} text-xl`}></i>
            </div>
            <div>
              <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{adv.title}</h3>
              <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-xs leading-relaxed`}>{adv.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6">
        <div className={`rounded-[32px] p-8 text-center relative overflow-hidden ${isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200 shadow-lg'}`}>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.3em] block mb-2">Acesso Vitalício</span>
            <div className="flex items-center justify-center gap-1 mb-6">
              <span className={`${isDark ? 'text-white/40' : 'text-black/30'} text-lg font-bold`}>R$</span>
              <span className={`text-5xl font-black ${isDark ? 'text-white' : 'text-black'}`}>9,90</span>
            </div>
            
            <button 
              onClick={onUpgrade}
              className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl text-white font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mb-4"
            >
              Quero ser Premium
            </button>
            
            <p className={`text-[9px] uppercase font-bold tracking-tighter ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              <i className="fa-solid fa-shield-halved mr-1"></i> Pagamento único • Sem assinaturas mensais
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
