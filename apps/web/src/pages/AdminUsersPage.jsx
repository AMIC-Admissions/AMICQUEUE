import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Monitor, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
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
import { getCanonicalCounters, getCounterOptions, getNextCounterNumber, isCounterActive } from '@/lib/counterOptions.js';

const getDisplayName = (user) => {
  const name = String(user?.name || '').trim();
  if (name) return name;

  const username = String(user?.username || '').trim();
  if (username) return username;

  const email = String(user?.email || '').trim();
  if (email) return email.split('@')[0];

  return 'Unknown User';
};

const AdminUsersPageContent = () => {
  const { data: syncData, refetchUsers, refetch } = useSyncContext();
  const [loading, setLoading] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [counterSaving, setCounterSaving] = useState(false);
  const [counterForm, setCounterForm] = useState({ counterNumber: '', name: '' });

  const usersList = useMemo(
    () => [...(syncData?.users || [])]
      .sort((a, b) => new Date(b?.updated || 0) - new Date(a?.updated || 0)),
    [syncData?.users],
  );

  const countersList = useMemo(
    () => getCanonicalCounters(syncData?.counters),
    [syncData?.counters],
  );

  const nextCounterNumber = useMemo(() => String(getNextCounterNumber(countersList)), [countersList]);
  const activeCounterOptions = useMemo(
    () => getCounterOptions(countersList, { fallbackCount: 0 }),
    [countersList],
  );

  useEffect(() => {
    setCounterForm((prev) => ({
      counterNumber: prev.counterNumber || nextCounterNumber,
      name: prev.name || `Counter ${nextCounterNumber}`,
    }));
  }, [nextCounterNumber]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refetch();
      toast.success('Staff and counter lists refreshed');
    } catch (err) {
      toast.error('Failed to refresh the latest data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!user?.id) return;
    if (!window.confirm(`Are you sure you want to delete staff member ${user.email || getDisplayName(user)}?`)) return;

    setLoading(true);
    try {
      await pb.collection('users').delete(user.id, { $autoCancel: false });
      toast.success('Staff member deleted successfully');
      await refetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error?.message || 'Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCounter = async (event) => {
    event.preventDefault();

    const counterNumber = Number(counterForm.counterNumber);
    const name = counterForm.name.trim();

    if (!Number.isFinite(counterNumber) || counterNumber < 1) {
      toast.error('Enter a valid counter number');
      return;
    }

    if (!name) {
      toast.error('Counter name is required');
      return;
    }

    if (countersList.some((counter) => Number(counter?.counterNumber) === counterNumber)) {
      toast.error(`Counter ${counterNumber} already exists`);
      return;
    }

    setCounterSaving(true);
    try {
      await pb.collection('counters').create({
        counterNumber,
        name,
        status: 'active',
        isPaused: false,
        lastUpdated: new Date().toISOString(),
      }, { $autoCancel: false });

      toast.success(`Counter ${counterNumber} added`);
      await refetch();
      setCounterForm({
        counterNumber: String(counterNumber + 1),
        name: `Counter ${counterNumber + 1}`,
      });
    } catch (error) {
      console.error('Counter creation error:', error);
      toast.error(error?.response?.message || error?.message || 'Failed to create counter');
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

      toast.success(`Counter ${counter.counterNumber} ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
      await refetch();
    } catch (error) {
      console.error('Counter update error:', error);
      toast.error('Failed to update counter status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>Staff Management - AMIC Queue</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">Team & Counters</h1>
            <p className="text-muted-foreground text-sm">Add staff accounts, expand counters, and keep assignments under one admin screen.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full md:w-auto interactive-element rounded-xl h-12">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setStaffModalOpen(true)} className="w-full md:w-auto rounded-xl shadow-lg shadow-primary/20 interactive-element h-12 px-6 font-bold">
            <Plus className="w-5 h-5 mr-2" /> Add Staff Account
          </Button>
        </div>
      </div>

      <section className="mb-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-[2rem] shadow-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Monitor className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-black text-foreground">Counter Setup</h2>
              <p className="text-sm text-muted-foreground">Create extra counters here, then assign staff to them from the same system.</p>
            </div>
          </div>

          <form onSubmit={handleCreateCounter} className="grid gap-4 md:grid-cols-[140px_1fr_auto]">
            <Input
              type="number"
              min="1"
              value={counterForm.counterNumber}
              onChange={(event) => setCounterForm((prev) => ({ ...prev, counterNumber: event.target.value }))}
              className="h-12 rounded-xl bg-background"
              placeholder="Number"
              disabled={counterSaving}
            />
            <Input
              value={counterForm.name}
              onChange={(event) => setCounterForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-12 rounded-xl bg-background"
              placeholder="Counter name"
              disabled={counterSaving}
            />
            <Button type="submit" disabled={counterSaving} className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Counter
            </Button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {countersList.map((counter) => (
              <div
                key={counter.id}
                className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Counter {counter.counterNumber}
                    </p>
                    <p className="text-base font-black text-foreground">{counter.name || `Counter ${counter.counterNumber}`}</p>
                  </div>
                  <Badge variant={isCounterActive(counter) ? 'default' : 'secondary'} className="capitalize">
                    {counter.status || 'active'}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleToggleCounter(counter)}
                  disabled={loading}
                  className="mt-4 w-full rounded-xl font-bold"
                >
                  {isCounterActive(counter) ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-[2rem] shadow-xl p-6">
          <h2 className="text-xl font-black text-foreground mb-3">Quick Summary</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Counters</p>
              <p className="mt-2 text-3xl font-black text-foreground">{activeCounterOptions.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Staff Accounts</p>
              <p className="mt-2 text-3xl font-black text-foreground">{usersList.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Counter Number</p>
              <p className="mt-2 text-3xl font-black text-foreground">{nextCounterNumber}</p>
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
                <TableHead className="font-bold py-5 text-foreground">Name / Username</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Email</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Role</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Counter</TableHead>
                <TableHead className="font-bold py-5 text-right text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-bold text-foreground">No staff members found</p>
                      <p className="text-sm mt-1">Create the first account from this page.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usersList.map((user) => {
                const counterDisplay = user?.counterNumber ?? user?.counter ?? null;

                return (
                  <TableRow key={user?.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <p className="font-bold text-foreground">{getDisplayName(user)}</p>
                      {user?.name && user?.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 font-medium">{user?.email || '---'}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="capitalize px-3 py-1 rounded-lg font-bold">
                        {user?.role || 'operator'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-primary/10 text-primary font-black text-sm border border-primary/20">
                        {counterDisplay ? `Counter ${counterDisplay}` : 'Not assigned'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        aria-label="Delete User"
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
