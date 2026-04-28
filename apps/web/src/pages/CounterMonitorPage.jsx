import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Activity, MonitorSpeaker, Users } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { useSyncData } from '@/contexts/SyncContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { getCanonicalCounters, getCounterBranchValue, isCounterActive } from '@/lib/counterOptions.js';
import { BRANCH_OPTIONS, getBranchLabel, normalizeBranch } from '@/lib/branchOptions.js';

const CounterMonitorPageContent = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const syncData = useSyncData();
  const { language, t } = useLanguage();
  const counterMonitorT = t.counterMonitor || {};
  const selectedBranch = normalizeBranch(params?.branchKey || searchParams.get('branch') || '', '');

  const counters = useMemo(() => getCanonicalCounters(syncData?.counters), [syncData?.counters]);

  const staffByCounter = useMemo(() => {
    const map = new Map();

    (syncData?.users || []).forEach((user) => {
      const role = String(user?.role || '').trim().toLowerCase();
      if (!['staff', 'operator'].includes(role)) return;

      const counterNumber = Number(user?.counterNumber || user?.counter || 0);
      if (!Number.isFinite(counterNumber) || counterNumber <= 0) return;
      const branch = normalizeBranch(user?.branch);
      const key = `${branch}:${counterNumber}`;

      const currentUsers = map.get(key) || [];
      currentUsers.push(user);
      map.set(key, currentUsers);
    });

    return map;
  }, [syncData?.users]);

  const filteredCounters = useMemo(
    () => counters.filter((counter) => !selectedBranch || getCounterBranchValue(counter) === selectedBranch),
    [counters, selectedBranch],
  );

  const activeCounters = useMemo(
    () => filteredCounters.filter((counter) => isCounterActive(counter)),
    [filteredCounters],
  );

  const assignedStaffCount = useMemo(
    () => (syncData?.users || []).filter((user) => {
      const role = String(user?.role || '').toLowerCase();
      if (!['staff', 'operator'].includes(role)) return false;
      return !selectedBranch || normalizeBranch(user?.branch) === selectedBranch;
    }).length,
    [syncData?.users, selectedBranch],
  );

  const getDisplayName = (user) => {
    const name = String(user?.name || '').trim();
    if (name) return name;

    const username = String(user?.username || '').trim();
    if (username) return username;

    const email = String(user?.email || '').trim();
    if (email) return email.split('@')[0];

    return counterMonitorT.operatorFallback || 'Operator';
  };

  const branchSections = selectedBranch
    ? [normalizeBranch(selectedBranch)]
    : BRANCH_OPTIONS.map((branch) => branch.value);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet><title>{`${counterMonitorT.title || 'Counter Monitor'}${selectedBranch ? ` - ${getBranchLabel(selectedBranch, language)}` : ''} - AMIC Queue`}</title></Helmet>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-primary">
            <MonitorSpeaker className="h-4 w-4" />
            {counterMonitorT.badge || 'Live Counter Monitor'}
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground">{counterMonitorT.title || 'Active counters overview'}</h1>
          <p className="mt-2 max-w-3xl text-base font-medium text-muted-foreground">
            {selectedBranch
              ? `${counterMonitorT.subtitle || 'This public page shows which counters are currently open and which staff members are assigned to each one.'} ${getBranchLabel(selectedBranch, language)}`
              : (counterMonitorT.subtitle || 'This public page shows which counters are currently open and which staff members are assigned to each one.')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{counterMonitorT.totalCounters || 'Total Counters'}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{filteredCounters.length}</p>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{counterMonitorT.activeNow || 'Active Now'}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{activeCounters.length}</p>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{counterMonitorT.assignedStaff || 'Assigned Staff'}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{assignedStaffCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {branchSections.map((branchCode) => {
          const branchCounters = filteredCounters.filter((counter) => getCounterBranchValue(counter) === branchCode);

          if (branchCounters.length === 0) return null;

          return (
            <section key={branchCode}>
              {!selectedBranch ? (
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-foreground">{getBranchLabel(branchCode, language)}</h2>
                  <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                    {branchCounters.length} {counterMonitorT.counter || 'Counter'}
                  </span>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {branchCounters.map((counter) => {
                  const key = `${branchCode}:${counter.counterNumber}`;
                  const assignedUsers = staffByCounter.get(key) || [];
                  const active = isCounterActive(counter);

                  return (
                    <section
                      key={counter.id || key}
                      className="rounded-[2rem] border border-border/50 bg-card/92 p-6 shadow-lg shadow-primary/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                            {`${counterMonitorT.counter || 'Counter'} ${counter.counterNumber}`}
                          </p>
                          <h2 className="mt-2 text-2xl font-black text-foreground">
                            {counter.name || `${counterMonitorT.counter || 'Counter'} ${counter.counterNumber}`}
                          </h2>
                          <p className="mt-2 text-sm font-semibold text-muted-foreground">{getBranchLabel(branchCode, language)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {active ? (counterMonitorT.active || 'Active') : (counterMonitorT.inactive || 'Inactive')}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {counterMonitorT.assignedStaffLabel || 'Assigned staff'}
                        </div>
                        {assignedUsers.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {assignedUsers.map((user) => (
                              <li key={user.id} className="rounded-xl bg-background px-4 py-3 text-sm font-bold text-foreground">
                                {getDisplayName(user)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm font-medium text-muted-foreground">{counterMonitorT.noStaffAssigned || 'No staff assigned yet.'}</p>
                        )}
                      </div>

                      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        {active ? (counterMonitorT.readyToReceive || 'Ready to receive tickets') : (counterMonitorT.paused || 'Currently paused')}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const CounterMonitorPage = () => (
  <ErrorBoundary>
    <CounterMonitorPageContent />
  </ErrorBoundary>
);

export default CounterMonitorPage;
