import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  isLastStep: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({ 
  onBack, 
  onNext, 
  disableBack, 
  isLastStep 
}) => {
  return (
    <div className="flex justify-between items-center w-full gap-3">
      <button
        onClick={onBack}
        disabled={disableBack}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
          disableBack 
            ? 'opacity-0 pointer-events-none' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
        }`}
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back
      </button>

      <button
        onClick={onNext}
        className={`flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg font-bold text-xs transition-all transform active:scale-[0.98] ${
            isLastStep 
            ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/10' 
            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
        }`}
      >
        <span>
          {isLastStep ? 'Submit Policy' : 'Continue'}
        </span>
        {isLastStep ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};