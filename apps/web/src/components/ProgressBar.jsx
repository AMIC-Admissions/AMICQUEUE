
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProgressBar = ({ status, peopleBefore }) => {
  const steps = [
    { id: 'pending', label: 'Waiting', desc: 'In queue' },
    { id: 'near', label: 'Near Turn', desc: '< 3 people' },
    { id: 'called', label: 'Called', desc: 'Go to counter' },
    { id: 'served', label: 'Served', desc: 'Completed' }
  ];

  let currentStepIndex = 0;
  if (status === 'Served') currentStepIndex = 3;
  else if (status === 'Called') currentStepIndex = 2;
  else if (status === 'Pending' || status === 'Waiting') {
    currentStepIndex = peopleBefore <= 2 ? 1 : 0;
  }

  const progressPercentage = ((currentStepIndex) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-6">
      <div className="relative mb-8">
        <div className="absolute top-1/2 left-0 w-full h-2 bg-muted -translate-y-1/2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary animate-progress-fill rounded-full transition-all duration-500" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="relative flex justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            
            return (
              <div key={step.id} className="flex flex-col items-center group relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10",
                  isCompleted ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-card border-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20 scale-110"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                </div>
                <div className="absolute top-12 whitespace-nowrap text-center">
                  <p className={cn(
                    "text-sm font-bold transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>{step.label}</p>
                  <p className="text-xs text-muted-foreground/70 hidden sm:block">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
