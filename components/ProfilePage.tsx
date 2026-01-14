
import React from 'react';
import { UserProfile } from '../types';

interface ProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
  onViewPremium?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  onLogout, 
  onViewPremium, 
  theme, 
  onToggleTheme 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const goalLabels = {
    weight_loss: 'Emagrecer',
    muscle_gain: 'Ganhar Massa',
    maintenance: 'Manter a Forma'
  };

  const isDark = theme === 'dark';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col items-center mt-4 mb-8">
        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-900/40 mb-4 border-4 border-white/10">
          {getInitials(user.name)}
        </div>
        <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{user.name}</h2>
        <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-xs mb-3`}>{user.email}</p>
        
        {user.isPremium ? (
          <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-black px-3 py-1 rounded-full uppercase border border-yellow-500/20 flex items-center gap-1.5">
            <i className="fa-solid fa-crown"></i> Membro Premium
          </span>
        ) : (
          <button 
            onClick={onViewPremium}
            className={`${isDark ? 'bg-white/5 text-white/40 border-white/5' : 'bg-black/5 text-black/40 border-black/10'} hover:text-yellow-600 hover:bg-yellow-500/5 transition-all text-[10px] font-black px-3 py-1 rounded-full uppercase border flex items-center gap-2`}
          >
            Plano Básico • <span className="text-yellow-600">Ver Vantagens PRO</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          { label: 'Peso', val: user.weight, unit: 'kg' },
          { label: 'Altura', val: user.height, unit: 'cm' },
          { label: 'Idade', val: user.age, unit: 'anos' }
        ].map((item, i) => (
          <div key={i} className={`glass-card rounded-2xl p-4 flex flex-col items-center ${!isDark && 'shadow-sm'}`}>
            <span className={`${isDark ? 'text-white/20' : 'text-black/40'} text-[10px] uppercase font-black tracking-widest mb-1`}>{item.label}</span>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{item.val}</span>
              <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-3">
        <div className={`glass-card rounded-2xl p-5 border ${isDark ? 'border-white/5' : 'border-black/5 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-black/60'} flex items-center justify-center`}>
                <i className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
              </div>
              <div>
                <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase font-black tracking-widest`}>Aparência</p>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{isDark ? 'Modo Escuro' : 'Modo Claro'}</p>
              </div>
            </div>
            <button 
              onClick={onToggleTheme}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-zinc-700' : 'bg-blue-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isDark ? 'left-1' : 'left-7'}`}></div>
            </button>
          </div>
        </div>

        <div className={`glass-card rounded-2xl p-5 border ${isDark ? 'border-white/5' : 'border-black/5 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-bullseye"></i>
            </div>
            <div>
              <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase font-black tracking-widest`}>Objetivo Atual</p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{goalLabels[user.goal]}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-shoe-prints"></i>
            </div>
            <div>
              <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase font-black tracking-widest`}>Meta Diária</p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{user.stepGoal.toLocaleString()} passos</p>
            </div>
          </div>
        </div>

        <button className={`w-full glass-card rounded-2xl p-4 flex items-center justify-between border group transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/50'} flex items-center justify-center`}>
              <i className="fa-solid fa-gear"></i>
            </div>
            <span className={`font-bold text-sm ${isDark ? 'text-white/80' : 'text-black'}`}>Configurações de Conta</span>
          </div>
          <i className="fa-solid fa-chevron-right text-black/20 group-hover:text-blue-600 transition-colors"></i>
        </button>

        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 transition-all mt-6 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/20">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </div>
          <span className="text-red-600 font-black uppercase tracking-widest text-xs">Sair da Conta</span>
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className={`${isDark ? 'text-white/10' : 'text-black/10'} text-[8px] uppercase tracking-[0.4em] font-black`}>lifesteps pro v1.0.4</p>
      </div>
    </div>
  );
};
