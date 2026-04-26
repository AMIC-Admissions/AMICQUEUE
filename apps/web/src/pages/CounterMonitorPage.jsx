import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Activity, MonitorSpeaker, Users } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { useSyncData } from '@/contexts/SyncContext.jsx';
import { getCanonicalCounters, isCounterActive } from '@/lib/counterOptions.js';

const getDisplayName = (user) => {
  const name = String(user?.name || '').trim();
  if (name) return name;

  const username = String(user?.username || '').trim();
  if (username) return username;

  const email = String(user?.email || '').trim();
  if (email) return email.split('@')[0];

  return 'Operator';
};

const CounterMonitorPageContent = () => {
  const syncData = useSyncData();

  const counters = useMemo(() => getCanonicalCounters(syncData?.counters), [syncData?.counters]);

  const staffByCounter = useMemo(() => {
    const map = new Map();

    (syncData?.users || []).forEach((user) => {
      const role = String(user?.role || '').trim().toLowerCase();
      if (!['staff', 'operator'].includes(role)) return;

      const counterNumber = Number(user?.counterNumber || user?.counter || 0);
      if (!Number.isFinite(counterNumber) || counterNumber <= 0) return;

      const currentUsers = map.get(counterNumber) || [];
      currentUsers.push(user);
      map.set(counterNumber, currentUsers);
    });

    return map;
  }, [syncData?.users]);

  const activeCounters = useMemo(
    () => counters.filter((counter) => isCounterActive(counter)),
    [counters],
  );

  const assignedStaffCount = useMemo(
    () => (syncData?.users || []).filter((user) => ['staff', 'operator'].includes(String(user?.role || '').toLowerCase())).length,
    [syncData?.users],
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet><title>Counter Monitor - AMIC Queue</title></Helmet>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-primary">
            <MonitorSpeaker className="h-4 w-4" />
            Live Counter Monitor
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground">Active counters overview</h1>
          <p className="mt-2 max-w-3xl text-base font-medium text-muted-foreground">
            This public page shows which counters are currently open and which staff members are assigned to each one.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Total Counters</p>
            <p className="mt-2 text-3xl font-black text-foreground">{counters.length}</p>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Active Now</p>
            <p className="mt-2 text-3xl font-black text-foreground">{activeCounters.length}</p>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/90 px-5 py-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Assigned Staff</p>
            <p className="mt-2 text-3xl font-black text-foreground">{assignedStaffCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {counters.map((counter) => {
          const assignedUsers = staffByCounter.get(counter.counterNumber) || [];
          const active = isCounterActive(counter);

          return (
            <section
              key={counter.id || counter.counterNumber}
              className="rounded-[2rem] border border-border/50 bg-card/92 p-6 shadow-lg shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">Counter {counter.counterNumber}</p>
                  <h2 className="mt-2 text-2xl font-black text-foreground">{counter.name || `Counter ${counter.counterNumber}`}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Assigned staff
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
                  <p className="mt-3 text-sm font-medium text-muted-foreground">No staff assigned yet.</p>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                {active ? 'Ready to receive tickets' : 'Currently paused'}
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
