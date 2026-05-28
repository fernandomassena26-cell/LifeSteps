
import React from 'react';
import { WorkoutHistoryItem } from '../types';

interface WorkoutHistoryProps {
  history: WorkoutHistoryItem[];
  isDark: boolean;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history, isDark }) => {
  if (history.length === 0) {
    return (
      <div className={`text-center py-10 px-6 border-2 border-dashed rounded-3xl ${isDark ? 'border-white/5' : 'border-black/10'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <i className={`fa-solid fa-clock-rotate-left ${isDark ? 'text-white/20' : 'text-black/20'}`}></i>
        </div>
        <p className={`${isDark ? 'text-white/30' : 'text-black/30'} text-xs font-medium uppercase tracking-widest`}>Nenhum treino registrado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`text-[9px] ${isDark ? 'text-white/30' : 'text-zinc-500'} flex items-center gap-1.5 px-1 py-0.5 font-medium`}>
        <i className="fa-solid fa-circle-info text-[10px] text-blue-500 shrink-0"></i>
        <span>Histórico retém treinos dos últimos 30 dias (itens anteriores são limpos automaticamente).</span>
      </div>
      {history.map((item) => (
        <div 
          key={item.id} 
          className={`glass-card rounded-2xl p-4 border flex items-center justify-between group transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/5 shadow-sm'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 transition-all ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5 group-hover:bg-blue-600 group-hover:text-white'}`}>
              <i className="fa-solid fa-person-running"></i>
            </div>
            <div>
              <h4 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-black'}`}>{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] uppercase font-black tracking-tighter`}>
                  {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
                <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></span>
                <span className="text-blue-600 text-[10px] font-black uppercase tracking-tighter">
                  {item.duration} min
                </span>
              </div>
            </div>
          </div>
          
          {item.caloriesBurned && (
            <div className="text-right">
              <span className={`block font-black text-xs ${isDark ? 'text-white' : 'text-black'}`}>{item.caloriesBurned}</span>
              <span className={`text-[8px] uppercase font-bold ${isDark ? 'text-white/20' : 'text-black/20'}`}>kcal</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
