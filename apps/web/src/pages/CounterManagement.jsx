
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Phone, CheckCircle, Clock, Volume2, Settings2, Users, ArrowRightLeft, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement.js';
import { SERVICES } from '@/config.js';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const CounterManagement = () => {
  const { currentUser } = useAuth();
  const counterNum = currentUser?.counter || 0;
  
  const [tickets, setTickets] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmServeOpen, setConfirmServeOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  
  const { soundEnabled, setSoundEnabled, playAnnouncement } = useVoiceAnnouncement();
  const t = useTranslation();
  const { language } = useLanguage();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const records = await pb.collection('tickets').getFullList({
          filter: `createdAt >= "${todayStr}"`,
          sort: '-createdAt',
          $autoCancel: false
        });
        setTickets(records);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    
    fetchTickets();
    pb.collection('tickets').subscribe('*', () => fetchTickets());
    return () => pb.collection('tickets').unsubscribe('*');
  }, []);

  const activeTicket = tickets.find(ticket => ticket.counter === counterNum && ticket.status === 'Called');
  const pendingTickets = tickets.filter(ticket => ticket.status === 'Pending' && (serviceFilter === 'All Services' || ticket.service === serviceFilter));
  const waitingTickets = tickets.filter(ticket => ticket.status === 'Waiting' && ticket.counter === counterNum);

  const handleCallNext = async () => {
    if (activeTicket) {
      toast.error(`Counter ${counterNum} already has an active ticket (${activeTicket.ticketNumber})`);
      return;
    }
    if (pendingTickets.length === 0) {
      toast.info('No pending tickets available for selected service');
      return;
    }

    const earliestPending = [...pendingTickets].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    
    setIsProcessing(true);
    try {
      await pb.collection('tickets').update(earliestPending.id, {
        status: 'Called',
        counter: counterNum,
        calledAt: new Date().toISOString()
      }, { $autoCancel: false });
      
      playAnnouncement(earliestPending.ticketNumber, counterNum);
      toast.success(`Ticket ${earliestPending.ticketNumber} called`);
    } catch (e) {
      toast.error('Failed to call ticket');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (action, ticket = activeTicket) => {
    if (!ticket) return;
    if (action === 'serveConfirm') return setConfirmServeOpen(true);
    if (action === 'transferDialog') return setTransferOpen(true);

    setIsProcessing(true);
    try {
      if (action === 'recall') {
        playAnnouncement(ticket.ticketNumber, counterNum);
        toast.success('Announcement repeated');
      } else if (action === 'serve') {
        setConfirmServeOpen(false);
        await pb.collection('tickets').update(ticket.id, { status: 'Served', servedAt: new Date().toISOString() }, { $autoCancel: false });
        toast.success('Ticket marked as served');
      } else if (action === 'wait') {
        await pb.collection('tickets').update(ticket.id, { status: 'Waiting' }, { $autoCancel: false });
        toast.info('Ticket moved to waiting list');
      } else if (action === 'transfer') {
        if(!transferTarget) return;
        setTransferOpen(false);
        await pb.collection('tickets').update(ticket.id, { counter: parseInt(transferTarget), status: 'Waiting' }, { $autoCancel: false });
        toast.success(`Transferred to Counter ${transferTarget}`);
      }
    } catch (e) {
      toast.error('Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet><title>{`${t?.nav?.counter ?? 'Counter'} Management - AMIC Queue Management`}</title></Helmet>
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 items-start md:items-center bg-card/90 backdrop-blur-sm p-6 rounded-[2rem] border border-border/50 shadow-xl">
          <div className="flex items-center gap-4 text-start">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-3xl font-black font-display shadow-lg shadow-primary/20">
              {counterNum}
            </div>
            <div>
              <h1 className="text-2xl font-black font-display">{t?.counter?.counterActive ?? 'Counter Active'}</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> {pendingTickets.length} {t?.counter?.pending ?? 'Pending'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button 
              variant={soundEnabled ? "outline" : "default"} 
              onClick={setSoundEnabled}
              className={!soundEnabled ? "bg-warning text-warning-foreground hover:bg-warning/90 animate-pulse font-bold" : "bg-background/50 font-bold"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 me-2" /> : <VolumeX className="w-4 h-4 me-2" />}
              {soundEnabled ? (t?.counter?.audioActive ?? 'Audio Active') : (t?.counter?.enableAudio ?? 'Enable Audio')}
            </Button>

            <Select value={serviceFilter} onValueChange={setServiceFilter} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectTrigger className="w-full md:w-64 h-12 bg-background/50 font-bold">
                <SelectValue placeholder={t?.common?.allServices ?? 'All Services'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Services">{t?.common?.allServices ?? 'All Services'}</SelectItem>
                {SERVICES.map(opt => <SelectItem key={opt} value={opt}>{t?.services?.[opt] || opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`bg-card/95 backdrop-blur-sm rounded-[2.5rem] p-8 border-2 transition-all ${activeTicket ? 'border-primary shadow-2xl shadow-primary/20 animate-pulse-glow' : 'border-border/50 shadow-xl'}`}>
              <div className="flex justify-between items-center mb-8 border-b border-border/50 pb-4">
                <h2 className="text-xl font-bold font-display uppercase tracking-widest text-muted-foreground">{t?.counter?.nowServing ?? 'Now Serving'}</h2>
                {activeTicket && <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">{t?.counter?.active ?? 'Active'}</span>}
              </div>

              {activeTicket ? (
                <div className="text-center space-y-8">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase mb-2">{t?.success?.ticketNumber ?? 'Ticket Number'}</p>
                    <p className="text-[100px] md:text-[120px] font-black leading-none font-display text-primary font-variant-tabular">{activeTicket.ticketNumber}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-start bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-inner">
                    <div><p className="text-sm text-muted-foreground font-bold uppercase">{t?.checkIn?.service ?? 'Service'}</p><p className="font-bold text-lg">{t?.services?.[activeTicket.service] || activeTicket.service}</p></div>
                    <div><p className="text-sm text-muted-foreground font-bold uppercase">{t?.checkIn?.fullName ?? 'Full Name'}</p><p className="font-bold text-lg truncate">{activeTicket.parentName}</p></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" onClick={() => handleAction('recall')} disabled={isProcessing} className="h-14 bg-background/50 font-bold">
                      <Volume2 className="w-5 h-5 me-2" /> {t?.counter?.recall ?? 'Recall'}
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('wait')} disabled={isProcessing} className="h-14 text-warning border-warning/30 hover:bg-warning/10 bg-background/50 font-bold">
                      <Clock className="w-5 h-5 me-2" /> {t?.counter?.wait ?? 'Wait'}
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('transferDialog')} disabled={isProcessing} className="h-14 text-info border-info/30 hover:bg-info/10 bg-background/50 font-bold">
                      <ArrowRightLeft className="w-5 h-5 me-2" /> {t?.counter?.transfer ?? 'Transfer'}
                    </Button>
                    <Button onClick={() => handleAction('serveConfirm')} disabled={isProcessing} className="h-14 bg-success hover:bg-success/90 text-white font-bold shadow-lg shadow-success/20">
                      <CheckCircle className="w-5 h-5 me-2" /> {t?.counter?.served ?? 'Served'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Settings2 className="w-10 h-10 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">{t?.counter?.counterIdle ?? 'Counter Idle'}</h3>
                  <p className="text-muted-foreground font-medium mb-8">{t?.counter?.readyToServe ?? 'Ready to serve next ticket'}</p>
                  <Button 
                    onClick={handleCallNext} 
                    disabled={isProcessing || pendingTickets.length === 0} 
                    className="h-16 px-12 text-xl font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white rounded-2xl active:scale-[0.98] transition-all"
                  >
                    <Phone className="w-6 h-6 me-3" /> {t?.counter?.callNext ?? 'Call Next'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card/90 backdrop-blur-sm rounded-[2rem] border border-border/50 p-6 shadow-xl h-full">
              <h3 className="text-lg font-bold font-display uppercase tracking-widest text-muted-foreground mb-6 flex items-center">
                <Clock className="w-5 h-5 me-2 text-warning" /> {t?.counter?.waitingList ?? 'Waiting List'} ({waitingTickets.length})
              </h3>
              
              <div className="space-y-3">
                {waitingTickets.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground font-medium border-2 border-dashed border-border/50 rounded-2xl">
                    {t?.counter?.noWaiting ?? 'No waiting tickets'}
                  </div>
                ) : (
                  waitingTickets.map(wt => (
                    <div key={wt.id} className="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex justify-between items-center hover:bg-warning/10 transition-colors">
                      <div className="text-start">
                        <p className="font-black text-xl text-warning font-variant-tabular">{wt.ticketNumber}</p>
                        <p className="text-xs text-muted-foreground font-bold truncate w-32">{t?.services?.[wt.service] || wt.service}</p>
                      </div>
                      <Button size="sm" onClick={() => handleAction('recall', wt)} disabled={isProcessing || activeTicket} className="bg-background/80 border-border/50 text-foreground hover:bg-muted font-bold rounded-xl">
                        {t?.counter?.recall ?? 'Recall'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmServeOpen} onOpenChange={setConfirmServeOpen}>
        <AlertDialogContent className="rounded-[2rem]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t?.counter?.confirmService ?? 'Confirm Service'}</AlertDialogTitle>
            <AlertDialogDescription>{(t?.counter?.confirmServiceDesc ?? 'Mark ticket {t} as served?').replace('{t}', activeTicket?.ticketNumber)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">{t?.common?.cancel ?? 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('serve')} className="bg-success text-white hover:bg-success/90 rounded-xl font-bold">{t?.counter?.confirmServed ?? 'Confirm Served'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
        <AlertDialogContent className="rounded-[2rem]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t?.counter?.transferTicket ?? 'Transfer Ticket'}</AlertDialogTitle>
            <AlertDialogDescription>{(t?.counter?.transferDesc ?? 'Transfer ticket {t} to another counter?').replace('{t}', activeTicket?.ticketNumber)}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={transferTarget} onValueChange={setTransferTarget} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <SelectTrigger className="rounded-xl font-bold"><SelectValue placeholder={t?.counter?.selectCounter ?? 'Select Counter'} /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7,8,9,10].map(c => c !== counterNum && <SelectItem key={c} value={c.toString()}>{t?.track?.counter ?? 'Counter'} {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransferTarget('')} className="rounded-xl font-bold">{t?.common?.cancel ?? 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('transfer')} disabled={!transferTarget} className="rounded-xl font-bold">{t?.counter?.confirmTransfer ?? 'Confirm Transfer'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CounterManagement;
