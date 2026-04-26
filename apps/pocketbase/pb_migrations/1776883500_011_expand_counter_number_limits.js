import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { getCounterOptions } from '@/lib/counterOptions.js';

const CounterSelectPageContent = () => {
  const { setSelectedCounter, selectedCounter } = useAuth();
  const { data: syncData } = useSyncContext();
  const navigate = useNavigate();

  const handleSelect = (num) => {
    setSelectedCounter(num);
    navigate('/dashboard');
  };

  const counters = getCounterOptions(syncData?.counters);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Helmet><title>Select Counter - AMIC Queue</title></Helmet>
      
      <div className="max-w-4xl w-full text-center mb-10">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Monitor className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">Select Your Counter</h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Choose the counter number you are operating from today. This will route relevant tickets to your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl w-full">
        {counters.map((num) => (
          <Button
            key={num}
            variant={selectedCounter === num.toString() ? "default" : "outline"}
            onClick={() => handleSelect(num)}
            className={`h-24 rounded-2xl text-xl font-bold flex flex-col gap-2 shadow-sm ${
              selectedCounter === num.toString() 
                ? 'shadow-lg shadow-primary/20 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : 'hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <span className="text-sm font-medium opacity-80 uppercase tracking-widest">Counter</span>
            <span className="text-3xl font-black">{num}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

const CounterSelectPage = () => (
  <ErrorBoundary>
    <CounterSelectPageContent />
  </ErrorBoundary>
);

export default CounterSelectPage;
