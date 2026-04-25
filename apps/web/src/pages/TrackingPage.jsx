
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, CheckCircle2, ArrowRight, MapPin, Ticket } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { getAppPath } from '@/lib/runtimeUrls.js';

const TrackingPageContent = () => {
  const { language, t } = useLanguage();
  const isRtl = language === 'ar';

  const [searchParams, setSearchParams] = useSearchParams();
  const ticketQuery = searchParams.get('ticket');
  const [searchInput, setSearchInput] = useState(ticketQuery || '');
  
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTicket = async (ticketNumber) => {
    setIsLoading(true);
    setError(null);
    try {
      const record = await pb.collection('tickets').getFirstListItem(`ticketNumber="${ticketNumber}"`, { $autoCancel: false });
      setTicket(record);
    } catch (err) {
      console.error('Error loading ticket:', err);
      alert('التذكرة غير موجودة');
      setError(isRtl ? 'التذكرة غير موجودة. يرجى التحقق من الرقم.' : 'Ticket not found. Please check your number.');
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketNumber = urlParams.get('ticket');
    
    if (ticketNumber) {
      loadTicket(ticketNumber);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ ticket: searchInput.trim().toUpperCase() });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Called':
      case 'Waiting':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Served':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Near':
      case 'Pending':
      default:
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'Cancelled') return isRtl ? 'ملغية' : 'Cancelled';
    return t.status[status] || status;
  };

  if (!ticketQuery) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 w-full">
        <Helmet><title>{isRtl ? 'تتبع تذكرتك - AMIC' : 'Track Ticket - AMIC'}</title></Helmet>
        <div className="bg-card border border-border/50 max-w-md w-full rounded-[2rem] p-10 shadow-xl text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-3">{isRtl ? 'تتبع تذكرتك' : 'Track Your Ticket'}</h1>
          <p className="text-muted-foreground mb-8 text-lg">{isRtl ? 'أدخل رقم التذكرة لمعرفة دورك مباشرة' : 'Enter your ticket number to view live status'}</p>
          
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <Input 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              placeholder="e.g. AMIS-001"
              className="text-center text-xl h-14 font-bold bg-background/50 rounded-xl"
              dir="ltr"
              required
            />
            <Button type="submit" className="h-14 text-lg font-bold w-full rounded-xl shadow-lg interactive-element">
              {isRtl ? 'بحث' : 'Track Status'} <ArrowRight className={`w-5 h-5 ml-2 ${isRtl ? 'rotate-180 mr-2 ml-0' : ''}`} />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 w-full">
        <Helmet><title>{isRtl ? 'غير موجود - AMIC' : 'Not Found - AMIC'}</title></Helmet>
        <div className="bg-card border border-border/50 max-w-md w-full rounded-[2rem] p-10 shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6 opacity-80" />
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <Button onClick={() => setSearchParams({})} className="h-14 px-8 rounded-xl font-bold mt-2 interactive-element w-full">
            {isRtl ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center w-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-muted-foreground">{isRtl ? 'جاري البحث...' : 'Locating ticket...'}</p>
      </div>
    );
  }

  const isCalled = ticket.status === 'Called';
  const isServed = ticket.status === 'Served';
  const isCancelled = ticket.status === 'Cancelled';
  const serviceName = t.services[ticket.service] || ticket.service;

  return (
    <div className="max-w-lg mx-auto p-4 py-8 md:py-12 w-full">
      <Helmet><title>{`${ticket.ticketNumber} - ${getStatusLabel(ticket.status)}`}</title></Helmet>

      <div className="bg-card border border-border/60 rounded-[2.5rem] shadow-xl overflow-hidden relative">
        
        {/* Ticket Header */}
        <div className="p-8 md:p-10 flex flex-col items-center border-b border-border/50 relative">
          <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} px-4 py-1.5 rounded-full border text-sm font-bold shadow-sm ${getStatusColor(ticket.status)}`}>
            {getStatusLabel(ticket.status)}
          </div>
          
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 mt-6">
            <Ticket className="w-8 h-8" />
          </div>
          
          <p className="text-[64px] md:text-[80px] font-black font-variant-tabular text-foreground leading-none tracking-tighter drop-shadow-sm mb-2 text-center">
            {ticket.ticketNumber}
          </p>
          
          <div className="flex items-center gap-2 text-muted-foreground font-medium bg-muted/30 px-4 py-2 rounded-lg border border-border/50 mt-4">
            <MapPin className="w-4 h-4" />
            {serviceName}
          </div>
        </div>

        {/* Dynamic Content Body */}
        {isCalled ? (
          <div className="p-10 bg-blue-50/50 dark:bg-blue-950/20 text-center">
            <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-4">
              {isRtl ? 'يرجى التوجه إلى' : 'Please Proceed To'}
            </p>
            <div className="inline-block bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 shadow-lg shadow-blue-500/20">
              <p className="text-xl font-bold text-slate-500 mb-1">{isRtl ? 'كاونتر' : 'Counter'}</p>
              <p className="text-7xl font-black text-blue-600 dark:text-blue-400 font-variant-tabular leading-none">{ticket.counter || ticket.counterNumber || '-'}</p>
            </div>
          </div>
        ) : isServed ? (
          <div className="p-10 text-center bg-green-50/50 dark:bg-green-950/20">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <p className="text-3xl font-black text-green-700 dark:text-green-400 mb-2">
              {isRtl ? 'تمت الخدمة' : 'Service Completed'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'شكراً لزيارتكم.' : 'Thank you for visiting us.'}
            </p>
          </div>
        ) : isCancelled ? (
          <div className="p-10 text-center bg-red-50/50 dark:bg-red-950/20">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="text-3xl font-black text-red-700 dark:text-red-400 mb-2">
              {isRtl ? 'تم إلغاء التذكرة' : 'Ticket Cancelled'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'يرجى إنشاء تذكرة جديدة إذا لزم الأمر.' : 'Please create a new ticket if needed.'}
            </p>
          </div>
        ) : (
          <div className="p-10 text-center bg-orange-50/50 dark:bg-orange-950/20">
            <p className="text-3xl font-black text-orange-700 dark:text-orange-400 mb-2">
              {isRtl ? 'قيد الانتظار' : 'Waiting'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'يرجى الانتظار حتى يتم النداء على رقمك.' : 'Please wait until your number is called.'}
            </p>
          </div>
        )}

        {/* Footer Details */}
        <div className="bg-muted/30 p-6 flex flex-col sm:flex-row justify-between items-center border-t border-border/50 text-sm font-medium text-muted-foreground gap-2">
          <span>{isRtl ? 'وقت الإصدار' : 'Created at'}: {new Date(ticket.created).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{isRtl ? 'فرع' : 'Branch'}: {t.branches[ticket.branch] || ticket.branch}</span>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col gap-4">
        <Button variant="outline" onClick={() => setSearchParams({})} className="h-14 font-bold rounded-xl w-full">
          <Search className="w-5 h-5 mx-2" />
          {isRtl ? 'تتبع تذكرة أخرى' : 'Track Another Ticket'}
        </Button>
        <Button variant="ghost" onClick={() => window.location.href = getAppPath('/create-ticket')} className="h-14 font-bold text-muted-foreground hover:text-foreground">
          {isRtl ? 'إصدار تذكرة جديدة' : 'Create New Ticket'}
        </Button>
      </div>
    </div>
  );
};

const TrackingPage = () => (
  <ErrorBoundary>
    <TrackingPageContent />
  </ErrorBoundary>
);

export default TrackingPage;
