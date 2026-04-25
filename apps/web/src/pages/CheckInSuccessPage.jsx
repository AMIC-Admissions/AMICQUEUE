
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle, Home, Copy, Share2, Clock, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeDisplay } from '@/components/QRCodeDisplay.jsx';
import { useQueueTracking } from '@/hooks/useQueueTracking.js';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/hooks/useTranslation.js';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const CheckInSuccessPage = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const [ticketData, setTicketData] = useState(location.state?.ticket || null);
  const [loading, setLoading] = useState(!ticketData);
  const [error, setError] = useState(null);
  
  const t = useTranslation();
  const { language } = useLanguage();

  const fetchTicketData = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await pb.collection('tickets').getOne(ticketId, { $autoCancel: false });
      if (!data) throw new Error('Ticket data is empty');
      setTicketData(data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      setError(err?.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ticketData && ticketId) {
      fetchTicketData();
    }
  }, [ticketId, ticketData]);

  const { peopleBefore, estWaitMins, loading: trackingLoading } = useQueueTracking(ticketData?.ticketNumber);

  useEffect(() => {
    if (ticketData?.ticketNumber) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.3 } });
    }
  }, [ticketData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col py-12 px-4 items-center">
        <Helmet><title>{'Check In Success - AMIC Queue Management'}</title></Helmet>
        <div className="bg-card/95 max-w-md w-full rounded-[2rem] p-8 border border-border/50 shadow-lg text-center space-y-6">
          <Skeleton className="w-20 h-20 rounded-full mx-auto" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Helmet><title>{'Check In Success - AMIC Queue Management'}</title></Helmet>
        <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Could not load ticket</h2>
          <p className="text-muted-foreground mb-6">{error || 'Ticket not found.'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={fetchTicketData} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
            <Link to="/"><Button><Home className="w-4 h-4 mr-2" /> Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const safeTicketNumber = ticketData?.ticketNumber ?? 'UNKNOWN';
  const trackingUrl = `${window.location.origin}/track?ticket=${encodeURIComponent(safeTicketNumber)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success(t?.success?.copied ?? 'Link copied!');
  };

  const shareWhatsApp = () => {
    const text = `Track my ticket ${safeTicketNumber} here: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col py-12 px-4 items-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Helmet><title>{`Ticket Confirmed - ${safeTicketNumber} - AMIC Queue Management`}</title></Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card/95 backdrop-blur-xl max-w-md w-full rounded-[2rem] p-8 border border-border/50 shadow-2xl text-center relative z-10"
      >
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-black font-display mb-2">{t?.success?.inQueue ?? 'You are in queue!'}</h1>
        <p className="text-muted-foreground font-medium mb-8">{t?.success?.scanQr ?? 'Scan to track on your phone'}</p>

        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 mb-8 shadow-inner">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">{t?.success?.ticketNumber ?? 'Ticket Number'}</p>
          <p className="text-6xl font-black text-primary font-variant-tabular">{safeTicketNumber}</p>
        </div>

        <div className="flex justify-center mb-8">
          <QRCodeDisplay ticketNumber={safeTicketNumber} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-background/50 rounded-2xl p-4 flex flex-col items-center border border-border/50 shadow-sm">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t?.success?.beforeYou ?? 'People Ahead'}</p>
            {trackingLoading ? <Skeleton className="h-8 w-8 mt-1" /> : <p className="text-2xl font-black font-variant-tabular">{peopleBefore ?? 0}</p>}
          </div>
          <div className="bg-background/50 rounded-2xl p-4 flex flex-col items-center border border-border/50 shadow-sm">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{t?.success?.estWait ?? 'Est Wait'}</p>
            {trackingLoading ? <Skeleton className="h-8 w-12 mt-1" /> : <p className="text-2xl font-black font-variant-tabular">~{estWaitMins ?? 0}m</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={`/track?ticket=${safeTicketNumber}`}>
            <Button className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20">{t?.success?.trackLive ?? 'Track Live Status'}</Button>
          </Link>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold bg-background/50" onClick={copyLink}>
              <Copy className="w-4 h-4 me-2" /> {t?.success?.copyLink ?? 'Copy Link'}
            </Button>
            <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 bg-background/50" onClick={shareWhatsApp}>
              <Share2 className="w-4 h-4 me-2" /> {t?.success?.whatsapp ?? 'WhatsApp'}
            </Button>
          </div>
          <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-foreground mt-4 inline-flex items-center justify-center">
            <Home className="w-4 h-4 me-2" /> {t?.common?.backToHome ?? 'Back to Home'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckInSuccessPage;
