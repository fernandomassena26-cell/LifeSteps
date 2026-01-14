
import React from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface WeeklyChartProps {
  data: { day: string; steps: number; isToday?: boolean }[];
  isDark?: boolean;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, isDark = true }) => {
  return (
    <div className="px-4 mb-8">
      <div className={`glass-card rounded-2xl p-5 ${!isDark && 'shadow-sm border-black/5'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>Atividade Semanal</h3>
          <span className={`text-[8px] font-black px-2 py-1 ${isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'} rounded-lg uppercase tracking-widest`}>Últimos 7 Dias</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: 900 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={`${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10 shadow-xl'} border p-2 rounded-lg`}>
                        <p className={`${isDark ? 'text-white' : 'text-black'} text-[10px] font-black`}>{payload[0].value?.toLocaleString()} passos</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
