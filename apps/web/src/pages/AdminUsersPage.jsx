import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ExternalLink, Monitor, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { AddStaffModal } from '@/components/AddStaffModal.jsx';
import { getCanonicalCounters, getCounterBranchValue, getCounterOptions, getNextCounterNumber, isCounterActive } from '@/lib/counterOptions.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { BRANCH_OPTIONS, getBranchLabel, normalizeBranch } from '@/lib/branchOptions.js';

const AdminUsersPageContent = () => {
  const { t } = useLanguage();
  const { data: syncData, refetchUsers, refetch } = useSyncContext();
  const [loading, setLoading] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [counterSaving, setCounterSaving] = useState(false);
  const [counterForm, setCounterForm] = useState({ branch: 'AMIS', counterNumber: '', name: '' });

  const teamT = t.team || {};
  const commonT = t.common || {};
  const staffModalT = t.staffModal || {};

  const usersList = useMemo(
    () => [...(syncData?.users || [])].sort((a, b) => new Date(b?.updated || 0) - new Date(a?.updated || 0)),
    [syncData?.users],
  );

  const countersList = useMemo(() => getCanonicalCounters(syncData?.counters), [syncData?.counters]);
  const nextCounterNumber = useMemo(
    () => String(getNextCounterNumber(countersList, { branch: counterForm.branch })),
    [counterForm.branch, countersList],
  );
  const activeCounterOptions = useMemo(
    () => getCounterOptions(countersList, { branch: counterForm.branch, fallbackCount: 0 }),
    [counterForm.branch, countersList],
  );
  const groupedCounters = useMemo(() => {
    const map = new Map(BRANCH_OPTIONS.map((branch) => [branch.value, []]));
    countersList.forEach((counter) => {
      const branch = getCounterBranchValue(counter);
      const items = map.get(branch) || [];
      items.push(counter);
      map.set(branch, items);
    });
    return map;
  }, [countersList]);

  useEffect(() => {
    setCounterForm((prev) => ({
      counterNumber: prev.counterNumber || nextCounterNumber,
      name: prev.name || `${commonT.counter || 'Counter'} ${nextCounterNumber}`,
    }));
  }, [commonT.counter, nextCounterNumber]);

  const getDisplayName = (user) => {
    const name = String(user?.name || '').trim();
    if (name) return name;

    const username = String(user?.username || '').trim();
    if (username) return username;

    const email = String(user?.email || '').trim();
    if (email) return email.split('@')[0];

    return teamT.unknownUser || 'Unknown User';
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refetch();
      toast.success(teamT.refreshSuccess || 'Staff and counter lists refreshed');
    } catch (error) {
      toast.error(teamT.refreshFail || 'Failed to refresh the latest data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!user?.id) return;
    const label = user.email || getDisplayName(user);
    if (!window.confirm((teamT.deleteConfirm || 'Are you sure you want to delete staff member {user}?').replace('{user}', label))) {
      return;
    }

    setLoading(true);
    try {
      await pb.collection('users').delete(user.id, { $autoCancel: false });
      toast.success(teamT.deleteSuccess || 'Staff member deleted successfully');
      await refetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error?.message || teamT.deleteFail || 'Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCounter = async (event) => {
    event.preventDefault();

    const counterNumber = Number(counterForm.counterNumber);
    const name = counterForm.name.trim();
    const branch = normalizeBranch(counterForm.branch);
    const branchLabel = getBranchLabel(branch);
    const storedName = name.toLowerCase().includes(branchLabel.toLowerCase()) ? name : `${branchLabel} - ${name}`;

    if (!Number.isFinite(counterNumber) || counterNumber < 1) {
      toast.error(teamT.invalidCounterNumber || 'Enter a valid counter number');
      return;
    }

    if (!name) {
      toast.error(teamT.counterNameRequired || 'Counter name is required');
      return;
    }

    if (countersList.some((counter) => getCounterBranchValue(counter) === branch && Number(counter?.counterNumber) === counterNumber)) {
      toast.error((teamT.counterExists || 'Counter {counter} already exists').replace('{counter}', counterNumber));
      return;
    }

    setCounterSaving(true);
    try {
      try {
        await pb.collection('counters').create({
          branch,
          counterNumber,
          name: storedName,
          status: 'active',
          isPaused: false,
          lastUpdated: new Date().toISOString(),
        }, { $autoCancel: false });
      } catch (error) {
        await pb.collection('counters').create({
          counterNumber,
          name: storedName,
          status: 'active',
          isPaused: false,
          lastUpdated: new Date().toISOString(),
        }, { $autoCancel: false });
      }

      toast.success((teamT.counterAdded || 'Counter {counter} added').replace('{counter}', counterNumber));
      await refetch();
      setCounterForm({
        branch,
        counterNumber: String(counterNumber + 1),
        name: `${commonT.counter || 'Counter'} ${counterNumber + 1}`,
      });
    } catch (error) {
      console.error('Counter creation error:', error);
      toast.error(error?.response?.message || error?.message || teamT.createCounterFail || 'Failed to create counter');
    } finally {
      setCounterSaving(false);
    }
  };

  const handleToggleCounter = async (counter) => {
    if (!counter?.id) return;
    const nextStatus = isCounterActive(counter) ? 'inactive' : 'active';

    setLoading(true);
    try {
      await pb.collection('counters').update(counter.id, {
        status: nextStatus,
        lastUpdated: new Date().toISOString(),
      }, { $autoCancel: false });

      toast.success(
        (nextStatus === 'active'
          ? (teamT.counterActivated || 'Counter {counter} activated')
          : (teamT.counterDeactivated || 'Counter {counter} deactivated')
        ).replace('{counter}', counter.counterNumber)
      );
      await refetch();
    } catch (error) {
      console.error('Counter update error:', error);
      toast.error(teamT.counterUpdateFail || 'Failed to update counter status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{`${teamT.title || 'Team & Counters'} - AMIC Queue`}</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">{teamT.title || 'Team & Counters'}</h1>
            <p className="text-muted-foreground text-sm">{teamT.subtitle || 'Add staff accounts, expand counters, and keep assignments under one admin screen.'}</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button asChild variant="outline" className="w-full md:w-auto interactive-element rounded-xl h-12">
            <Link to="/counter-monitor">
              <ExternalLink className="w-4 h-4 mr-2" /> {teamT.publicMonitor || commonT.publicMonitor || 'Public Monitor'}
            </Link>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full md:w-auto interactive-element rounded-xl h-12">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {commonT.refresh || 'Refresh'}
          </Button>
          <Button onClick={() => setStaffModalOpen(true)} className="w-full md:w-auto rounded-xl shadow-lg shadow-primary/20 interactive-element h-12 px-6 font-bold">
            <Plus className="w-5 h-5 mr-2" /> {teamT.addStaffAccount || 'Add Staff Account'}
          </Button>
        </div>
      </div>

      <section className="mb-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-[2rem] shadow-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Monitor className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-black text-foreground">{teamT.counterSetup || 'Counter Setup'}</h2>
              <p className="text-sm text-muted-foreground">{teamT.counterSetupHint || 'Create extra counters here, then assign staff to them from the same system.'}</p>
            </div>
          </div>

          <form onSubmit={handleCreateCounter} className="grid gap-4 md:grid-cols-[180px_140px_1fr_auto]">
            <select
              value={counterForm.branch}
              onChange={(event) => setCounterForm((prev) => ({ ...prev, branch: event.target.value, counterNumber: '', name: '' }))}
              className="h-12 rounded-xl border border-input bg-background px-3 text-sm font-medium"
              disabled={counterSaving}
            >
              {BRANCH_OPTIONS.map((branchOption) => (
                <option key={branchOption.value} value={branchOption.value}>
                  {getBranchLabel(branchOption.value)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="1"
              value={counterForm.counterNumber}
              onChange={(event) => setCounterForm((prev) => ({ ...prev, counterNumber: event.target.value }))}
              className="h-12 rounded-xl bg-background"
              placeholder={teamT.numberPlaceholder || 'Number'}
              disabled={counterSaving}
            />
            <Input
              value={counterForm.name}
              onChange={(event) => setCounterForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-12 rounded-xl bg-background"
              placeholder={teamT.counterNamePlaceholder || 'Counter name'}
              disabled={counterSaving}
            />
            <Button type="submit" disabled={counterSaving} className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> {teamT.addCounter || 'Add Counter'}
            </Button>
          </form>

          <div className="mt-6 space-y-6">
            {BRANCH_OPTIONS.map((branchOption) => {
              const branchCounters = groupedCounters.get(branchOption.value) || [];
              return (
                <div key={branchOption.value}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {getBranchLabel(branchOption.value)}
                    </h3>
                    <Badge variant="outline">{branchCounters.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {branchCounters.map((counter) => (
                      <div key={counter.id} className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                              {(commonT.counter || 'Counter')} {counter.counterNumber}
                            </p>
                            <p className="text-base font-black text-foreground">{counter.name || `${commonT.counter || 'Counter'} ${counter.counterNumber}`}</p>
                          </div>
                          <Badge variant={isCounterActive(counter) ? 'default' : 'secondary'} className="capitalize">
                            {isCounterActive(counter) ? (commonT.active || 'Active') : (commonT.inactive || 'Inactive')}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleToggleCounter(counter)}
                          disabled={loading}
                          className="mt-4 w-full rounded-xl font-bold"
                        >
                          {isCounterActive(counter) ? (teamT.deactivate || 'Deactivate') : (teamT.activate || 'Activate')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-[2rem] shadow-xl p-6">
          <h2 className="text-xl font-black text-foreground mb-3">{teamT.quickSummary || 'Quick Summary'}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{teamT.activeCounters || 'Active Counters'}</p>
              <p className="mt-2 text-3xl font-black text-foreground">{activeCounterOptions.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{teamT.staffAccounts || 'Staff Accounts'}</p>
              <p className="mt-2 text-3xl font-black text-foreground">{usersList.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{teamT.nextCounterNumber || 'Next Counter Number'}</p>
              <p className="mt-2 text-3xl font-black text-foreground">{`${getBranchLabel(counterForm.branch)} - ${nextCounterNumber}`}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card-primary overflow-hidden bg-card/95 backdrop-blur-xl border-border/40">
        {loading && usersList.length === 0 ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-5 text-foreground">{teamT.nameUsername || 'Name / Username'}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{teamT.email || commonT.email || 'Email'}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{teamT.role || commonT.role || 'Role'}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{teamT.counter || commonT.counter || 'Counter'}</TableHead>
                <TableHead className="font-bold py-5 text-right text-foreground">{teamT.actions || commonT.actions || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-bold text-foreground">{teamT.noStaffFound || 'No staff members found'}</p>
                      <p className="text-sm mt-1">{teamT.createFirstAccount || 'Create the first account from this page.'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usersList.map((user) => {
                const counterDisplay = user?.counterNumber ?? user?.counter ?? null;

                return (
                  <TableRow key={user?.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <p className="font-bold text-foreground">{getDisplayName(user)}</p>
                      {user?.name && user?.username ? <p className="text-xs text-muted-foreground">@{user.username}</p> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 font-medium">{user?.email || '---'}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="capitalize px-3 py-1 rounded-lg font-bold">
                        {staffModalT[user?.role] || user?.role || staffModalT.operator || 'Operator'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-primary/10 text-primary font-black text-sm border border-primary/20">
                        {counterDisplay ? `${commonT.counter || 'Counter'} ${counterDisplay}` : (commonT.notAssigned || 'Not assigned')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        aria-label={teamT.deleteUserAria || 'Delete User'}
                        disabled={loading}
                        className="interactive-element hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5 text-destructive transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <AddStaffModal
        open={staffModalOpen}
        onOpenChange={setStaffModalOpen}
        onSuccess={async () => {
          await refetch();
        }}
      />
    </div>
  );
};

const AdminUsersPage = () => (
  <ErrorBoundary>
    <AdminUsersPageContent />
  </ErrorBoundary>
);

export default AdminUsersPage;
