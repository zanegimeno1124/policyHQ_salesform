import React from 'react';

interface QuestionStepProps {
  title: string;
  children: React.ReactNode;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="bg-transparent">
        {children}
      </div>
    </div>
  );
};