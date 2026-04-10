
import React from 'react';

interface WaterTrackerProps {
  current: number;
  onAdd: (amount: number) => void;
  onRemove: (amount: number) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  isDark: boolean;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ 
  current, 
  onAdd, 
  onRemove,
  notificationsEnabled, 
  onToggleNotifications,
  isDark
}) => {
  const target = 2000;
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="px-4 mb-8">
      <div className={`glass-card rounded-2xl p-5 overflow-hidden relative ${!isDark && 'shadow-sm'}`}>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Consumo de Água</h3>
            <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-xs`}>Hidrate-se para continuar no ritmo!</p>
          </div>
          <button 
            onClick={onToggleNotifications}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${notificationsEnabled ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/30'}`}
          >
            <i className={`fa-solid ${notificationsEnabled ? 'fa-bell' : 'fa-bell-slash'} text-xs`}></i>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {notificationsEnabled ? 'Ativado' : 'Notificar'}
            </span>
          </button>
        </div>

        <div className="flex justify-between items-end mb-4 relative z-10">
          <div className="text-left flex items-center gap-3">
            <div>
              <span className="text-2xl font-black text-blue-600">{current}</span>
              <span className={`${isDark ? 'text-white/20' : 'text-black/20'} text-sm`}> / {target} ml</span>
            </div>
            {current > 0 && (
              <button 
                onClick={() => onRemove(250)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-500' : 'bg-black/5 text-black/40 hover:bg-red-500/10 hover:text-red-600'}`}
                title="Remover 250ml"
              >
                <i className="fa-solid fa-minus text-[10px]"></i>
              </button>
            )}
          </div>
        </div>
        
        <div className={`h-2 w-full ${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-full mb-6 relative z-10 overflow-hidden`}>
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex gap-2 relative z-10">
          {[250, 500].map(amount => (
            <button
              key={amount}
              onClick={() => onAdd(amount)}
              className={`flex-1 py-3 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} active:scale-95 transition-all rounded-xl border border-transparent flex items-center justify-center gap-2 group`}
            >
              <i className="fa-solid fa-glass-water text-blue-500 group-hover:scale-110 transition-transform"></i>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>+{amount}ml</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
