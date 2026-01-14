
import React from 'react';
import { DailyStats } from '../types';

interface StatsGridProps {
  stats: DailyStats;
  isDark: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, isDark }) => {
  const items = [
    { label: 'Calorias', value: Math.round(stats.calories), unit: 'kcal', icon: 'fa-fire-flame-curved', color: 'text-orange-500' },
    { label: 'Distância', value: stats.distance.toFixed(2), unit: 'km', icon: 'fa-location-dot', color: 'text-emerald-500' },
    { label: 'Tempo', value: Math.round(stats.activeTime), unit: 'min', icon: 'fa-clock', color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-4 mb-8">
      {items.map((item, idx) => (
        <div key={idx} className={`glass-card rounded-2xl p-4 flex flex-col items-center justify-center ${!isDark && 'shadow-sm'}`}>
          <i className={`fa-solid ${item.icon} ${item.color} text-lg mb-2`}></i>
          <span className={`text-xl font-bold leading-none ${isDark ? 'text-white' : 'text-black'}`}>{item.value}</span>
          <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{item.unit}</span>
          <span className={`text-[10px] mt-0.5 ${isDark ? 'text-white/20' : 'text-black/20'}`}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
