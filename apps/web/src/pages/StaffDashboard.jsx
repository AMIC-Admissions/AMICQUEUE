import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, LogOut, Play, PauseCircle, CheckCircle2, XCircle, Users, ArrowRightLeft, Clock, Loader2, Volume2, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import EnableSoundButton from '@/components/EnableSoundButton.jsx';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement.js';
import { getCounterOptions } from '@/lib/counterOptions.js';
import { getBranchLabel, normalizeBranch } from '@/lib/branchOptions.js';

const STATUSES = ['Pending', 'Called', 'Waiting', 'Served', 'Cancelled'];

const BRANCH_LABELS = {
  AMIS: 'Ajyal',
  Ajyal: 'Ajyal',
  KIDS: 'Kids Gate',
  KidsGate: 'Kids Gate',
  'Kids Gate': 'Kids Gate',
};

const getRecordTime = (record) => new Date(record?.created || record?.createdAt || 0).getTime();
const formatBranch = (branch) => BRANCH_LABELS[branch] || branch || '-';
const getTicketCounterNumber = (ticket) => Number(ticket?.counter ?? ticket?.counterNumber ?? 0);
const formatCounter = (ticket, label) => {
  const counter = ticket?.counter || ticket?.counterNumber || '-';
  return counter === '-' ? '-' : `${label} ${counter}`;
};
const getWaitingTimestamp = (ticket) => new Date(ticket?.waitingAt || ticket?.updated || ticket?.created || 0).getTime();

const StaffDashboardContent = () => {
  const { selectedCounter, selectedBranch, logout } = useAuth();
  const { data: syncData } = useSyncContext();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { addToVoiceQueue, isPlayingVoice } = useVoiceAnnouncement();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterService, setFilterService] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [transferCounter, setTransferCounter] = useState('');

  const dashboardT = t.dashboard || {};
  const messagesT = t.dashboardMessages || {};
  const commonT = t.common || {};
  const statusT = t.status || {};
  const branchT = t.branches || {};
  const serviceT = t.services || {};

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const records = await pb.collection('tickets').getFullList({
          sort: 'created',
          $autoCancel: false,
        });
        setTickets(records || []);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error(messagesT.failedLoadQueue || 'Failed to load queue');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    const subscribe = async () => {
      try {
        await pb.collection('tickets').subscribe('*', (event) => {
          if (event.action === 'create') {
            setTickets((prev) => [...prev, event.record]);
          } else if (event.action === 'update') {
            setTickets((prev) => prev.map((ticket) => (ticket.id === event.record.id ? event.record : ticket)));
          } else if (event.action === 'delete') {
            setTickets((prev) => prev.filter((ticket) => ticket.id !== event.record.id));
          }
        });
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    subscribe();
    return () => {
      pb.collection('tickets').unsubscribe('*').catch(() => {});
    };
  }, [messagesT.failedLoadQueue]);

  const counterNum = parseInt(selectedCounter, 10);
  const branchCode = normalizeBranch(selectedBranch);
  const getLocalizedBranch = (branch) => branchT[branch] || formatBranch(branch);
  const getLocalizedService = (service) => serviceT[service] || service || commonT.service || 'Service';
  const activeBranchLabel = getLocalizedBranch(branchCode) || getBranchLabel(branchCode, language);

  const serviceOptions = useMemo(() => {
    const configured = Array.isArray(syncData?.services)
      ? syncData.services.map((service) => service?.name).filter(Boolean)
      : [];
    const fromTickets = tickets
      .filter((ticket) => normalizeBranch(ticket?.branch) === branchCode)
      .map((ticket) => ticket?.service)
      .filter(Boolean);
    return Array.from(new Set([...configured, ...fromTickets]));
  }, [syncData?.services, tickets, branchCode]);

  const counterOptions = useMemo(
    () => getCounterOptions(syncData?.counters, { branch: branchCode }),
    [syncData?.counters, branchCode],
  );

  const branchTickets = useMemo(
    () => tickets.filter((ticket) => normalizeBranch(ticket?.branch) === branchCode),
    [tickets, branchCode],
  );

  const allPending = useMemo(
    () => branchTickets.filter((ticket) => ticket.status === 'Pending').sort((left, right) => getRecordTime(left) - getRecordTime(right)),
    [branchTickets],
  );

  const activeTicket = useMemo(
    () => branchTickets.find((ticket) => getTicketCounterNumber(ticket) === counterNum && ticket.status === 'Called') || null,
    [branchTickets, counterNum],
  );

  const waitingTickets = useMemo(
    () => branchTickets
      .filter((ticket) => getTicketCounterNumber(ticket) === counterNum && ticket.status === 'Waiting')
      .sort((left, right) => getWaitingTimestamp(left) - getWaitingTimestamp(right)),
    [branchTickets, counterNum],
  );

  const nextWaitingTicket = waitingTickets[0] || null;

  const filteredTickets = useMemo(
    () => branchTickets
      .filter((ticket) => {
        const matchesService = filterService === 'All' || ticket.service === filterService;
        const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
        return matchesService && matchesStatus;
      })
      .sort((left, right) => getRecordTime(left) - getRecordTime(right)),
    [branchTickets, filterService, filterStatus],
  );

  const mergeTicketIntoState = (updatedTicket) => {
    if (!updatedTicket?.id) return;
    setTickets((prev) => prev.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)));
  };

  const updateTicketStatus = async (ticketId, status, extraData = {}) => {
    setActionLoading(true);
    try {
      const updatedTicket = await pb.collection('tickets').update(ticketId, { status, ...extraData }, { $autoCancel: false });
      mergeTicketIntoState(updatedTicket);
      toast.success((messagesT.ticketMarkedAs || 'Ticket marked as {status}').replace('{status}', statusT[status] || status));
    } catch (error) {
      toast.error(messagesT.failedUpdateTicket || 'Failed to update ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (activeTicket) {
      toast.error(messagesT.counterHasActiveTicket || 'Counter already has an active ticket');
      return;
    }

    const availablePending = filterService !== 'All'
      ? allPending.filter((ticket) => ticket.service === filterService)
      : allPending;

    if (availablePending.length === 0) {
      toast.info(messagesT.noPendingTickets || 'No pending tickets available to call');
      return;
    }

    const nextTicket = availablePending[0];
    setActionLoading(true);

    try {
      const updatedTicket = await pb.collection('tickets').update(nextTicket.id, {
        status: 'Called',
        counter: counterNum,
        counterNumber: counterNum,
        calledAt: new Date().toISOString(),
        waitingAt: null,
      }, { $autoCancel: false });

      mergeTicketIntoState(updatedTicket);
      addToVoiceQueue(updatedTicket);
      toast.success((messagesT.callingTicket || 'Calling ticket {ticket}').replace('{ticket}', updatedTicket.ticketNumber));
    } catch (error) {
      toast.error(messagesT.failedCallNext || 'Failed to call next ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferTicket = async () => {
    if (!activeTicket) {
      toast.error(messagesT.noActiveTransfer || 'No active ticket to transfer');
      return;
    }

    const targetCounter = parseInt(transferCounter, 10);
    if (!targetCounter) {
      toast.error(messagesT.selectCounterFirst || 'Select a counter first');
      return;
    }

    if (targetCounter === counterNum) {
      toast.error(messagesT.chooseDifferentCounter || 'Choose a different counter');
      return;
    }

    setActionLoading(true);
    try {
      const updatedTicket = await pb.collection('tickets').update(activeTicket.id, {
        counter: targetCounter,
        counterNumber: targetCounter,
        transferredAt: new Date().toISOString(),
      }, { $autoCancel: false });

      mergeTicketIntoState(updatedTicket);
      setTransferCounter('');
      toast.success(
        (messagesT.transferred || 'Transferred {ticket} to Counter {counter}')
          .replace('{ticket}', activeTicket.ticketNumber)
          .replace('{counter}', targetCounter),
      );
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(messagesT.failedTransfer || 'Failed to transfer ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecallWaitingTicket = async (ticket = nextWaitingTicket) => {
    if (!ticket) {
      toast.error(messagesT.noWaitingRecall || 'No waiting ticket to recall');
      return;
    }

    if (activeTicket) {
      toast.error(messagesT.finishCurrentFirst || 'Finish the current called ticket first');
      return;
    }

    setActionLoading(true);
    try {
      const updatedTicket = await pb.collection('tickets').update(ticket.id, {
        status: 'Called',
        counter: counterNum,
        counterNumber: counterNum,
        calledAt: new Date().toISOString(),
        waitingAt: null,
      }, { $autoCancel: false });

      mergeTicketIntoState(updatedTicket);
      addToVoiceQueue(updatedTicket);
      toast.success((messagesT.recalled || 'Recalled {ticket}').replace('{ticket}', updatedTicket.ticketNumber));
    } catch (error) {
      console.error('Recall waiting error:', error);
      toast.error(messagesT.failedRecall || 'Failed to recall waiting ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnWaitingTicket = async (ticket) => {
    if (!ticket?.id) return;

    setActionLoading(true);
    try {
      const updatedTicket = await pb.collection('tickets').update(ticket.id, {
        status: 'Pending',
        counter: null,
        counterNumber: null,
        waitingAt: null,
      }, { $autoCancel: false });

      mergeTicketIntoState(updatedTicket);
      toast.success((messagesT.ticketMarkedAs || 'Ticket marked as {status}').replace('{status}', statusT.Pending || 'Pending'));
    } catch (error) {
      console.error('Return waiting error:', error);
      toast.error(messagesT.failedUpdateTicket || 'Failed to update ticket');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full py-4 max-w-7xl mx-auto px-4">
      <Helmet><title>{`${dashboardT.pageTitle || commonT.dashboard || 'Dashboard'} - ${activeBranchLabel} - ${commonT.counter || 'Counter'} ${selectedCounter}`}</title></Helmet>

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{`${commonT.counter || 'Counter'} ${selectedCounter}`}</h1>
            <p className="text-muted-foreground font-medium text-sm">
              {activeBranchLabel} · {dashboardT.subtitle || 'All tickets are visible below with service filters.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <EnableSoundButton />
          <Button variant="outline" onClick={() => navigate('/counter-select')} className="font-bold rounded-xl border-border/60 bg-background hover:bg-muted">
            <ArrowRightLeft className="w-4 h-4 mr-2" /> {dashboardT.changeCounter || 'Change'}
          </Button>
          <Button variant="destructive" onClick={logout} className="font-bold rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <LogOut className="w-4 h-4 mr-2" /> {commonT.logout || 'Logout'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full relative">
            {isPlayingVoice && activeTicket ? (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-full z-10 font-bold text-xs border border-blue-500/20">
                <Volume2 className="w-3 h-3 animate-pulse" /> {dashboardT.announcing || 'Announcing'}
              </div>
            ) : null}

            <div className="bg-primary/5 p-6 border-b border-border/50 flex flex-col items-center justify-center text-center min-h-[220px]">
              {activeTicket ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{dashboardT.currentlyServing || 'Currently Serving'}</p>
                  <p className="text-[80px] font-black leading-none font-variant-tabular tracking-tighter text-foreground drop-shadow-sm mb-4">
                    {activeTicket.ticketNumber}
                  </p>
                  <div className="flex flex-col gap-2 items-center">
                    <p className="text-sm font-medium bg-background px-4 py-1.5 rounded-full border border-border/50">
                      {getLocalizedService(activeTicket.service)}
                    </p>
                    <p className="text-sm text-muted-foreground">{getLocalizedBranch(activeTicket.branch)}</p>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground/60 flex flex-col items-center">
                  <Monitor className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-xl font-bold uppercase tracking-wider">{dashboardT.noActiveTicket || 'No Active Ticket'}</p>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col gap-3 flex-1 bg-muted/10">
              <Button
                size="lg"
                onClick={handleCallNext}
                disabled={actionLoading || !!activeTicket || allPending.length === 0}
                className="w-full h-16 text-lg font-black rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 interactive-element"
              >
                {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 mr-3" />}
                {dashboardT.callNext || 'Call Next'}
              </Button>

              {waitingTickets.length > 0 ? (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm">
                  <p className="font-black text-orange-700">{dashboardT.waitingAtCounter || 'Waiting at this counter'}</p>
                  <div className="mt-3 space-y-3">
                    {waitingTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-xl border border-orange-500/20 bg-background/80 px-3 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black text-foreground">{ticket.ticketNumber}</p>
                            <p className="mt-1 font-semibold text-orange-600">
                              {getLocalizedService(ticket.service)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleRecallWaitingTicket(ticket)}
                              disabled={actionLoading || !!activeTicket}
                              className="rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                            >
                              <Play className="w-4 h-4 mr-2" /> {dashboardT.recallWaiting || 'Recall Waiting'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReturnWaitingTicket(ticket)}
                              disabled={actionLoading}
                              className="rounded-xl font-bold"
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-2" /> {dashboardT.returnQueue || 'Return Queue'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  onClick={() => updateTicketStatus(activeTicket.id, 'Waiting', { waitingAt: new Date().toISOString() })}
                  disabled={actionLoading || !activeTicket}
                  variant="outline"
                  className="h-14 font-bold rounded-xl border-orange-500/30 text-orange-600 bg-orange-500/5 hover:bg-orange-500/10"
                >
                  <PauseCircle className="w-4 h-4 mr-2" /> {dashboardT.waiting || statusT.Waiting || 'Waiting'}
                </Button>
                <Button
                  onClick={() => updateTicketStatus(activeTicket.id, 'Pending', { counter: null, counterNumber: null })}
                  disabled={actionLoading || !activeTicket}
                  variant="outline"
                  className="h-14 font-bold rounded-xl"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> {dashboardT.returnQueue || 'Return Queue'}
                </Button>
                <Button
                  onClick={() => updateTicketStatus(activeTicket.id, 'Served', { servedAt: new Date().toISOString() })}
                  disabled={actionLoading || !activeTicket}
                  className="h-14 font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> {dashboardT.served || statusT.Served || 'Served'}
                </Button>
                <Button
                  onClick={() => updateTicketStatus(activeTicket.id, 'Cancelled')}
                  disabled={actionLoading || !activeTicket}
                  variant="outline"
                  className="h-14 font-bold rounded-xl border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4 mr-2" /> {dashboardT.cancel || commonT.cancel || 'Cancel'}
                </Button>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3 mt-2">
                <Select value={transferCounter} onValueChange={setTransferCounter} disabled={actionLoading || !activeTicket}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-border/60">
                    <SelectValue placeholder={dashboardT.transferToCounter || 'Transfer to counter'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {counterOptions
                      .filter((counter) => counter !== counterNum)
                      .map((counter) => (
                        <SelectItem key={counter} value={String(counter)}>
                          {(commonT.counter || 'Counter')} {counter}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleTransferTicket}
                  disabled={actionLoading || !activeTicket || !transferCounter}
                  className="h-12 px-5 font-bold rounded-xl"
                >
                  <Shuffle className="w-4 h-4 mr-2" /> {dashboardT.transfer || 'Transfer'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[640px]">
          <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Users className="w-5 h-5 text-primary" /> {dashboardT.allTickets || 'All Tickets'}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-full sm:w-[220px] bg-background border-border/60 rounded-xl font-medium h-10">
                  <SelectValue placeholder={commonT.allServices || 'All Services'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="All">{commonT.allServices || 'All Services'}</SelectItem>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service} value={service}>{getLocalizedService(service)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border/60 rounded-xl font-medium h-10">
                  <SelectValue placeholder={commonT.allStatuses || 'All Statuses'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="All">{commonT.allStatuses || 'All Statuses'}</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{statusT[status] || status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-card">
            {filteredTickets.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.ticketNumber || 'Ticket Number'}</th>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.branch || commonT.branch || 'Branch'}</th>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.service || commonT.service || 'Service'}</th>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.counter || commonT.counter || 'Counter'}</th>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.status || commonT.status || 'Status'}</th>
                    <th className="px-6 py-4 font-bold tracking-wider">{dashboardT.time || commonT.time || 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-black font-variant-tabular text-base">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4 font-medium text-foreground/80">{getLocalizedBranch(ticket.branch)}</td>
                      <td className="px-6 py-4 font-medium text-foreground/80">{getLocalizedService(ticket.service)}</td>
                      <td className="px-6 py-4 font-semibold text-foreground/80">{formatCounter(ticket, commonT.counter || 'Counter')}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                            ${ticket.status === 'Called' ? 'bg-green-500/10 text-green-600' :
                              ticket.status === 'Pending' ? 'bg-blue-500/10 text-blue-600' :
                              ticket.status === 'Waiting' ? 'bg-orange-500/10 text-orange-600' :
                              ticket.status === 'Served' ? 'bg-muted text-muted-foreground' :
                              'bg-destructive/10 text-destructive'}`}
                        >
                          {statusT[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-variant-tabular text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {new Date(ticket.updated || ticket.created || ticket.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                <Users className="w-16 h-16 mb-4" />
                <p className="font-bold text-xl">{dashboardT.noTicketsFound || 'No tickets found'}</p>
                <p className="text-sm mt-1">{dashboardT.adjustFilters || 'Try adjusting your filters'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => (
  <ErrorBoundary>
    <StaffDashboardContent />
  </ErrorBoundary>
);

export default StaffDashboard;
