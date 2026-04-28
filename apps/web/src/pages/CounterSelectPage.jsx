import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { getCounterOptions } from '@/lib/counterOptions.js';
import { BRANCH_OPTIONS, getBranchLabel, normalizeBranch } from '@/lib/branchOptions.js';

const CounterSelectPageContent = () => {
  const { currentUser, setSelectedCounter, selectedCounter, selectedBranch, setSelectedBranch } = useAuth();
  const { data: syncData } = useSyncContext();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const counterSelectT = t.counterSelect || {};
  const commonT = t.common || {};
  const preferredBranch = normalizeBranch(currentUser?.branch || selectedBranch || 'AMIS');

  const [branch, setBranch] = React.useState(preferredBranch);

  const handleSelect = (num) => {
    setSelectedBranch(branch);
    setSelectedCounter(num);
    navigate('/dashboard');
  };

  React.useEffect(() => {
    setBranch(preferredBranch);
  }, [preferredBranch]);

  const counters = getCounterOptions(syncData?.counters, { branch });
  const getLocalizedBranch = (value) => t.branches?.[value] || getBranchLabel(value, language);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Helmet><title>{`${counterSelectT.title || 'Select Counter'} - AMIC Queue`}</title></Helmet>

      <div className="max-w-4xl w-full text-center mb-10">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Monitor className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">{counterSelectT.title || 'Select Your Counter'}</h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          {counterSelectT.subtitle || 'Choose the counter number you are operating from today. This will route relevant tickets to your dashboard.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl w-full mb-8">
        {BRANCH_OPTIONS.map((branchOption) => {
          const active = branch === branchOption.value;
          return (
            <Button
              key={branchOption.value}
              variant={active ? 'default' : 'outline'}
              onClick={() => setBranch(branchOption.value)}
              className={`h-20 rounded-2xl text-base font-bold justify-between px-6 ${
                active
                  ? 'shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <span>{getLocalizedBranch(branchOption.value)}</span>
              <span className="text-xs uppercase tracking-[0.2em] opacity-70">
                {commonT.branch || 'Branch'}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl w-full">
        {counters.map((num) => (
          <Button
            key={`${branch}-${num}`}
            variant={selectedCounter === num.toString() && selectedBranch === branch ? 'default' : 'outline'}
            onClick={() => handleSelect(num)}
            className={`h-24 rounded-2xl text-xl font-bold flex flex-col gap-2 shadow-sm ${
              selectedCounter === num.toString() && selectedBranch === branch
                ? 'shadow-lg shadow-primary/20 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <span className="text-sm font-medium opacity-80 uppercase tracking-widest">{counterSelectT.counter || commonT.counter || 'Counter'}</span>
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
