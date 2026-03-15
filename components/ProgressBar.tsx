import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progressPercentage = ((current + 1) / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-widest">
        <span>Step {current + 1} / {total}</span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-yellow-400 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(250,204,21,0.4)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};