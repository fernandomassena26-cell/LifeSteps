
import React from 'react';

interface StepCircleProps {
  current: number;
  goal: number;
  isDark: boolean;
}

export const StepCircle: React.FC<StepCircleProps> = ({ current, goal, isDark }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(current / goal, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className="relative flex items-center justify-center py-10">
      <svg className="w-72 h-72 transform -rotate-90">
        <circle
          cx="144"
          cy="144"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className={isDark ? "text-white/5" : "text-black/5"}
        />
        <circle
          cx="144"
          cy="144"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="step-progress-ring"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
        <span className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          {current.toLocaleString()}
        </span>
        <span className={`${isDark ? 'text-white/40' : 'text-black/40'} text-sm font-medium mt-1`}>
          Meta: {goal.toLocaleString()}
        </span>
        <div className="mt-4 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">
            {Math.round(percentage * 100)}% Atingido
          </span>
        </div>
      </div>
    </div>
  );
};
