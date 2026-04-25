import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Hourglass,
  MapPin,
  Search,
  Ticket,
  UserRoundCheck,
  Users
} from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useQueueTracking } from '@/hooks/useQueueTracking.js';

const activeStatuses = new Set(['Pending', 'Waiting', 'Called']);

const TrackingPageContent = () => {
  const { language, t } = useLanguage();
  const isRtl = language === 'ar';

  const [searchParams, setSearchParams] = useSearchParams();
  const ticketQuery = (searchParams.get('ticket') || '').trim().toUpperCase();
  const [searchInput, setSearchInput] = useState(ticketQuery);
  const tracking = useQueueTracking(ticketQuery);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalized = searchInput.trim().toUpperCase();
    if (normalized) setSearchParams({ ticket: normalized });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Called':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'Waiting':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'Served':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'Cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Pending':
      default:
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      Pending: isRtl ? 'قيد الانتظار' : 'Pending',
      Called: isRtl ? 'تم النداء' : 'Called',
      Waiting: isRtl ? 'مؤجل مؤقتا' : 'Waiting',
      Served: isRtl ? 'تمت الخدمة' : 'Served',
      Cancelled: isRtl ? 'ملغية' : 'Cancelled'
    };
    return labels[status] || t.status?.[status] || status;
  };

  const SearchPanel = () => (
    <div className="min-h-[70vh] flex items-center justify-center p-4 w-full">
      <Helmet><title>{isRtl ? 'تتبع تذكرتك - AMIC' : 'Track Ticket - AMIC'}</title></Helmet>
      <div className="bg-card border border-border/50 max-w-md w-full rounded-[2rem] p-10 shadow-xl text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-black mb-3">{isRtl ? 'تتبع تذكرتك' : 'Track Your Ticket'}</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          {isRtl ? 'أدخل رقم التذكرة لمعرفة دورك حسب الخدمة' : 'Enter your ticket number to view your service queue position'}
        </p>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="e.g. AMIS-001"
            className="text-center text-xl h-14 font-bold bg-background/50 rounded-xl"
            dir="ltr"
            required
          />
          <Button type="submit" className="h-14 text-lg font-bold w-full rounded-xl shadow-lg interactive-element">
            {isRtl ? 'بحث' : 'Track Status'}
            <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </Button>
        </form>
      </div>
    </div>
  );

  if (!ticketQuery) return <SearchPanel />;

  if (tracking.error && !tracking.ticket && !tracking.loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 w-full">
        <Helmet><title>{isRtl ? 'التذكرة غير موجودة - AMIC' : 'Ticket Not Found - AMIC'}</title></Helmet>
        <div className="bg-card border border-border/50 max-w-md w-full rounded-[2rem] p-10 shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6 opacity-80" />
          <h1 className="text-2xl font-bold mb-4">
            {isRtl ? 'التذكرة غير موجودة. تأكد من الرقم وحاول مرة أخرى.' : 'Ticket not found. Please check the number and try again.'}
          </h1>
          <Button onClick={() => setSearchParams({})} className="h-14 px-8 rounded-xl font-bold mt-2 interactive-element w-full">
            {isRtl ? 'البحث عن تذكرة أخرى' : 'Track Another Ticket'}
          </Button>
        </div>
      </div>
    );
  }

  if (tracking.loading || !tracking.ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center w-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-muted-foreground">{isRtl ? 'جاري البحث...' : 'Locating ticket...'}</p>
      </div>
    );
  }

  const { ticket, peopleBefore, peopleAfter, queuePosition, serviceQueueSize, estWaitMins } = tracking;
  const isCalled = ticket.status === 'Called';
  const isServed = ticket.status === 'Served';
  const isCancelled = ticket.status === 'Cancelled';
  const isActive = activeStatuses.has(ticket.status);
  const serviceName = t.services?.[ticket.service] || ticket.service;
  const branchName = t.branches?.[ticket.branch] || ticket.branch || '-';
  const createdAt = ticket.created || ticket.createdAt;

  const StatPanel = ({ icon: Icon, label, value, hint }) => (
    <div className="bg-card/95 border border-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-muted-foreground">{label}</p>
      </div>
      <p className="text-4xl font-black font-variant-tabular text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 py-8 md:py-12 w-full">
      <Helmet><title>{`${ticket.ticketNumber} - ${getStatusLabel(ticket.status)}`}</title></Helmet>

      <div className="bg-card border border-border/60 rounded-[2rem] shadow-xl overflow-hidden relative">
        <div className="p-8 md:p-10 flex flex-col items-center border-b border-border/50 relative">
          <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} px-4 py-1.5 rounded-full border text-sm font-bold shadow-sm ${getStatusColor(ticket.status)}`}>
            {getStatusLabel(ticket.status)}
          </div>

          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 mt-6">
            <Ticket className="w-8 h-8" />
          </div>

          <p className="text-[56px] md:text-[80px] font-black font-variant-tabular text-foreground leading-none tracking-tighter drop-shadow-sm mb-2 text-center">
            {ticket.ticketNumber}
          </p>

          <div className="flex items-center gap-2 text-muted-foreground font-medium bg-muted/30 px-4 py-2 rounded-lg border border-border/50 mt-4">
            <MapPin className="w-4 h-4" />
            {serviceName}
          </div>
        </div>

        {isCalled ? (
          <div className="p-10 bg-blue-50/70 text-center">
            <p className="text-blue-700 font-bold uppercase tracking-widest mb-4">
              {isRtl ? 'يرجى التوجه إلى' : 'Please Proceed To'}
            </p>
            <div className="inline-block bg-white border-2 border-blue-500 rounded-3xl p-6 shadow-lg shadow-blue-500/20">
              <p className="text-xl font-bold text-slate-500 mb-1">{isRtl ? 'كاونتر' : 'Counter'}</p>
              <p className="text-7xl font-black text-blue-700 font-variant-tabular leading-none">{ticket.counter || ticket.counterNumber || '-'}</p>
            </div>
          </div>
        ) : isServed ? (
          <div className="p-10 text-center bg-green-50/70">
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <p className="text-3xl font-black text-green-800 mb-2">
              {isRtl ? 'تمت الخدمة' : 'Service Completed'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'شكرا لزيارتكم.' : 'Thank you for visiting us.'}
            </p>
          </div>
        ) : isCancelled ? (
          <div className="p-10 text-center bg-red-50/70">
            <div className="w-20 h-20 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="text-3xl font-black text-red-800 mb-2">
              {isRtl ? 'تم إلغاء التذكرة' : 'Ticket Cancelled'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'يرجى إنشاء تذكرة جديدة إذا لزم الأمر.' : 'Please create a new ticket if needed.'}
            </p>
          </div>
        ) : (
          <div className="p-10 text-center bg-orange-50/70">
            <p className="text-3xl font-black text-orange-800 mb-2">
              {isRtl ? 'قيد الانتظار' : 'Waiting'}
            </p>
            <p className="text-muted-foreground font-medium">
              {isRtl ? 'سيتم تحديث دورك تلقائيا حسب نفس الخدمة.' : 'Your position updates automatically within the same service queue.'}
            </p>
          </div>
        )}

        <div className="bg-muted/30 p-6 flex flex-col sm:flex-row justify-between items-center border-t border-border/50 text-sm font-medium text-muted-foreground gap-2">
          <span>
            {isRtl ? 'وقت الإصدار' : 'Created at'}: {createdAt ? new Date(createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </span>
          <span>{isRtl ? 'الفرع' : 'Branch'}: {branchName}</span>
        </div>
      </div>

      {isActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatPanel
            icon={UserRoundCheck}
            label={isRtl ? 'ترتيبك في الخدمة' : 'Service Position'}
            value={`${queuePosition}/${serviceQueueSize || queuePosition}`}
            hint={isRtl ? 'حسب نوع الخدمة المختارة' : 'Within the selected service'}
          />
          <StatPanel
            icon={Users}
            label={isRtl ? 'قبلك' : 'Before You'}
            value={peopleBefore}
            hint={isRtl ? 'تذاكر نفس الخدمة قبلك' : 'Same-service tickets ahead'}
          />
          <StatPanel
            icon={Hourglass}
            label={isRtl ? 'الوقت المتوقع' : 'Estimated Wait'}
            value={estWaitMins === 0 ? (isRtl ? 'قريب' : 'Soon') : `${estWaitMins}m`}
            hint={isRtl ? 'تقديري حسب التذاكر المخدومة' : 'Based on served tickets'}
          />
          <StatPanel
            icon={Clock3}
            label={isRtl ? 'بعدك' : 'After You'}
            value={peopleAfter}
            hint={isRtl ? 'تذاكر نفس الخدمة بعدك' : 'Same-service tickets behind'}
          />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <Button variant="outline" onClick={() => setSearchParams({})} className="h-14 font-bold rounded-xl w-full">
          <Search className="w-5 h-5 mx-2" />
          {isRtl ? 'تتبع تذكرة أخرى' : 'Track Another Ticket'}
        </Button>
        <Button asChild variant="ghost" className="h-14 font-bold text-muted-foreground hover:text-foreground">
          <Link to="/create-ticket">{isRtl ? 'إصدار تذكرة جديدة' : 'Create New Ticket'}</Link>
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
