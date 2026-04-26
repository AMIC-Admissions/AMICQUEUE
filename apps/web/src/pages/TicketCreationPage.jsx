import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Phone, ArrowRight, Printer, Loader2, Plus, MessageCircle, User, Building2, Clock3, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useSyncData } from '@/contexts/SyncContext.jsx';
import { QRCodeSVG } from 'qrcode.react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { getAppPath, getAppUrl } from '@/lib/runtimeUrls.js';
import { useTicketNumbering } from '@/hooks/useTicketNumbering.js';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';
import { getAvailableServices } from '@/lib/serviceOptions.js';
import TicketBarcode from '@/components/TicketBarcode.jsx';

const BRANCH_OPTIONS = [
  { value: 'AMIS', label: 'Ajyal' },
  { value: 'KIDS', label: 'Kids Gate' },
];

const getBranchLabel = (value) => BRANCH_OPTIONS.find((branch) => branch.value === value)?.label || value;

const formatRecordError = (error) => {
  const responseMessage = error?.response?.message || error?.message || 'Unknown error';
  const details = error?.response?.data || error?.data;

  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return responseMessage;
  }

  const fieldMessages = Object.entries(details)
    .map(([field, value]) => {
      const message = value?.message || value?.code || String(value || '').trim();
      return message ? `${field}: ${message}` : field;
    })
    .filter(Boolean);

  return fieldMessages.length > 0 ? `${responseMessage} (${fieldMessages.join(' | ')})` : responseMessage;
};

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
};

const TicketCreationPageContent = () => {
  const { language, t } = useLanguage();
  const syncData = useSyncData();
  const isRtl = language === 'ar';
  const { generateTicketNumber } = useTicketNumbering();
  const settings = Array.isArray(syncData?.settings) && syncData.settings.length > 0 ? syncData.settings[0] : null;
  const serviceOptions = useMemo(() => getAvailableServices(syncData?.services), [syncData?.services]);
  const logoUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'logoImage',
    pathField: 'logoPath',
    fallbackPath: '/assets/amic-logo.png'
  });
  const fallbackLogoUrl = getAppPath('/assets/amic-logo.png');

  const [formData, setFormData] = useState({
    parentName: '',
    mobile: '',
    branch: '',
    service: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const { parentName, mobile, branch, service } = formData;
    if (!parentName || !mobile || !branch || !service) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      let cleanNumber = mobile.trim();
      if (cleanNumber.startsWith('05')) {
        cleanNumber = `+966${cleanNumber.substring(1)}`;
      } else if (!cleanNumber.startsWith('+') && cleanNumber.startsWith('966')) {
        cleanNumber = `+${cleanNumber}`;
      }

      const ticketNumber = await generateTicketNumber(branch);
      const payload = {
        ticketNumber,
        branch,
        service,
        mobileNumber: cleanNumber,
        parentName: parentName.trim(),
        status: 'Pending',
      };

      const record = await pb.collection('tickets').create(payload, { $autoCancel: false });

      playSuccessSound();
      setSuccess(true);
      setCreatedTicket(record);
      setFormData({ parentName: '', mobile: '', branch: '', service: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Ticket creation error:', err);
      setError(`Failed to create ticket: ${formatRecordError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedTicket(null);
    setSuccess(false);
    setError('');
  };

  const trackingUrl = createdTicket ? getAppUrl(`/track?ticket=${encodeURIComponent(createdTicket.ticketNumber)}`) : '';
  const createdAtLabel = createdTicket
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(createdTicket.createdAt || createdTicket.created || Date.now()))
    : '';

  const openWhatsAppManual = () => {
    if (!createdTicket || !createdTicket.mobileNumber) return;

    let waNumber = createdTicket.mobileNumber;
    if (waNumber.startsWith('+')) waNumber = waNumber.substring(1);

    const message = [
      'Welcome to Admissions & Registration Office',
      `Your ticket: ${createdTicket.ticketNumber}`,
      `Track here: ${trackingUrl}`,
    ].join('\n');

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex-1 mx-auto py-8 sm:py-12 w-full z-10 relative ${success ? 'max-w-5xl print-ticket-shell' : 'max-w-2xl'}`}>
      <Helmet><title>{`${t.ticket.issueNew} - AMIC`}</title></Helmet>

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border/40"
          >
            <div className="bg-primary/5 p-8 sm:p-10 border-b border-border/50 flex items-center gap-5">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Ticket className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">{t.ticket.issueNew}</h1>
                <p className="text-muted-foreground font-medium text-sm mt-1">
                  {isRtl ? 'Fill in the details to issue a ticket' : 'Please fill in your details to get a ticket'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8" noValidate>
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-bold text-center text-sm break-words">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="parentName" className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Parent Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentName"
                  name="parentName"
                  type="text"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="h-14 rounded-xl bg-background border border-border/60 focus-visible:ring-primary/20"
                  placeholder="Enter parent name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="branch" className="text-base font-bold">{t.ticket.selectBranch} <span className="text-destructive">*</span></Label>
                <Select name="branch" value={formData.branch} onValueChange={(value) => handleSelectChange('branch', value)} disabled={loading}>
                  <SelectTrigger id="branch" className="h-14 text-lg rounded-xl bg-background border border-border/60 focus:ring-primary/20 hover:border-primary/50">
                    <SelectValue placeholder={t.ticket.selectBranch} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BRANCH_OPTIONS.map((branchOption) => (
                      <SelectItem key={branchOption.value} value={branchOption.value} className="py-3 text-base font-medium">
                        {branchOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="service" className="text-base font-bold">{t.ticket.selectService} <span className="text-destructive">*</span></Label>
                <Select name="service" value={formData.service} onValueChange={(value) => handleSelectChange('service', value)} disabled={loading}>
                  <SelectTrigger id="service" className="h-14 text-lg rounded-xl bg-background border border-border/60 focus:ring-primary/20 hover:border-primary/50">
                    <SelectValue placeholder={t.ticket.selectService} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {serviceOptions.map((serviceOption) => (
                      <SelectItem key={serviceOption.id || serviceOption.name} value={serviceOption.name} className="py-3 text-base font-medium hover:bg-primary/5">
                        {t.services[serviceOption.name] || serviceOption.nameAr || serviceOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="mobile" className="text-base font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {t.ticket.mobileNumber} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="h-14 rounded-xl bg-background border border-border/60 focus-visible:ring-primary/20"
                  placeholder="05XXXXXXXX"
                  disabled={loading}
                  dir="ltr"
                />
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button type="submit" className="w-full h-16 text-xl font-bold rounded-xl shadow-lg shadow-primary/20 interactive-element" disabled={loading}>
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      {t.ticket.issueButton}
                      <ArrowRight className={`w-6 h-6 mx-3 ${isRtl ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="print-ticket-card overflow-hidden rounded-[2rem] border border-[#222D64]/10 bg-white text-left shadow-[0_28px_70px_rgba(34,45,100,0.12)]"
          >
            <div className="screen-only">
              <div className="border-b border-[#222D64]/10 bg-[linear-gradient(135deg,rgba(34,45,100,0.04),rgba(111,206,181,0.12))] px-8 py-8 sm:px-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="inline-flex items-center rounded-full bg-[#6FCEB5]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-[#1b6957] sm:text-sm">
                      Ticket Ready
                    </div>
                    <div className="mt-5 rounded-[28px] border border-[#222D64]/10 bg-white/90 px-5 py-4 shadow-sm">
                      <img
                        src={logoUrl}
                        alt="AMIC group logo"
                        className="h-14 w-auto max-w-full object-contain sm:h-16"
                        onError={(event) => {
                          if (event.currentTarget.src !== fallbackLogoUrl) {
                            event.currentTarget.src = fallbackLogoUrl;
                          }
                        }}
                      />
                    </div>
                    <h2 className="mt-6 text-3xl font-black tracking-tight text-[#222D64] sm:text-4xl">
                      Your queue ticket is ready
                    </h2>
                    <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#222D64]/65 sm:text-lg">
                      This page now shows the ticket directly after creation, with a clean print layout that includes the logo and a scannable code.
                    </p>
                  </div>

                  <div className="w-full max-w-xs rounded-[28px] border border-[#222D64]/10 bg-white/95 p-5 text-center shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#222D64]/6 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#222D64]/55">
                      <ScanLine className="h-4 w-4" />
                      Track Online
                    </div>
                    <div className="mt-4 flex justify-center">
                      <QRCodeSVG value={trackingUrl} size={156} level="H" includeMargin={true} className="rounded-2xl bg-white p-3 shadow-sm" />
                    </div>
                    <Link to={`/track?ticket=${createdTicket?.ticketNumber}`} className="mt-4 block break-all rounded-2xl bg-[#222D64]/5 px-4 py-3 text-sm font-bold text-[#222D64] hover:bg-[#222D64]/10">
                      {trackingUrl}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-8 py-8 sm:px-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[32px] bg-[#222D64] p-8 text-white shadow-[0_24px_60px_rgba(34,45,100,0.2)]">
                  <p className="text-sm font-black uppercase tracking-[0.34em] text-white/60">
                    {t.ticket.yourNumber}
                  </p>
                  <div className="mt-5 text-[64px] font-black leading-none tracking-tight sm:text-[88px]">
                    {createdTicket?.ticketNumber}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-white/10 px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-white/55">
                        <Building2 className="h-4 w-4" />
                        Branch
                      </div>
                      <p className="mt-3 text-2xl font-black">
                        {getBranchLabel(createdTicket?.branch)}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-white/10 px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-white/55">
                        <Clock3 className="h-4 w-4" />
                        Issued
                      </div>
                      <p className="mt-3 text-lg font-bold leading-7 text-white">
                        {createdAtLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-[28px] bg-white px-4 py-5 text-center shadow-inner">
                    <TicketBarcode value={createdTicket?.ticketNumber} />
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="rounded-[28px] border border-[#222D64]/10 bg-[#f8fbfd] p-6 shadow-sm">
                    <p className="text-sm font-black uppercase tracking-[0.32em] text-[#222D64]/45">
                      Ticket Details
                    </p>
                    <dl className="mt-5 space-y-4">
                      <div className="flex items-start justify-between gap-4 border-b border-[#222D64]/8 pb-4">
                        <dt className="text-sm font-bold text-[#222D64]/55">Parent Name</dt>
                        <dd className="text-right text-base font-black text-[#222D64]">{createdTicket?.parentName}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4 border-b border-[#222D64]/8 pb-4">
                        <dt className="text-sm font-bold text-[#222D64]/55">Service</dt>
                        <dd className="text-right text-base font-black text-[#222D64]">{t.services[createdTicket?.service] || createdTicket?.service}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-sm font-bold text-[#222D64]/55">Mobile</dt>
                        <dd className="text-right text-base font-black text-[#222D64]" dir="ltr">{createdTicket?.mobileNumber}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[28px] border border-dashed border-[#222D64]/20 bg-white px-6 py-5">
                    <p className="text-base font-bold text-[#222D64]/70">
                      Keep this ticket for tracking and counter announcements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="no-print border-t border-[#222D64]/10 px-8 py-6 sm:px-10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Button className="h-14 font-bold shadow-md interactive-element rounded-2xl w-full bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={openWhatsAppManual}>
                    <MessageCircle className="w-5 h-5 mx-2" />
                    Send via WhatsApp
                  </Button>

                  <Button variant="outline" className="h-14 font-bold interactive-element rounded-2xl w-full bg-background hover:bg-muted border-[#222D64]/10" onClick={handlePrint}>
                    <Printer className="w-5 h-5 mx-2" />
                    Print Ticket
                  </Button>

                  <Button variant="ghost" className="h-14 font-bold text-muted-foreground hover:text-foreground interactive-element w-full rounded-2xl" onClick={handleCreateAnother}>
                    <Plus className="w-5 h-5 mx-2" />
                    Create Another
                  </Button>
                </div>
              </div>
            </div>

            <div className="print-only px-8 py-8 sm:px-10">
              <div className="mx-auto max-w-[760px] rounded-[28px] border border-[#d8e1ee] bg-white p-8">
                <div className="flex items-center justify-between gap-6 border-b border-[#e7edf5] pb-6">
                  <img
                    src={logoUrl}
                    alt="AMIC group logo"
                    className="h-16 w-auto max-w-[320px] object-contain"
                    onError={(event) => {
                      if (event.currentTarget.src !== fallbackLogoUrl) {
                        event.currentTarget.src = fallbackLogoUrl;
                      }
                    }}
                  />
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#222D64]/45">Queue Ticket</p>
                    <p className="mt-2 text-sm font-bold text-[#222D64]/65">{createdAtLabel}</p>
                  </div>
                </div>

                <div className="pt-8 text-center">
                  <p className="text-sm font-black uppercase tracking-[0.32em] text-[#222D64]/45">{t.ticket.yourNumber}</p>
                  <p className="mt-4 text-[72px] font-black leading-none tracking-tight text-[#222D64]">
                    {createdTicket?.ticketNumber}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f7f9fc] px-4 py-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#222D64]/45">Branch</p>
                    <p className="mt-2 text-lg font-black text-[#222D64]">{getBranchLabel(createdTicket?.branch)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f9fc] px-4 py-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#222D64]/45">Service</p>
                    <p className="mt-2 text-lg font-black text-[#222D64]">{t.services[createdTicket?.service] || createdTicket?.service}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f7f9fc] px-4 py-4 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#222D64]/45">Parent</p>
                    <p className="mt-2 text-lg font-black text-[#222D64]">{createdTicket?.parentName}</p>
                  </div>
                </div>

                <div className="mt-8 rounded-[28px] border border-[#e7edf5] bg-[#fbfcfe] px-5 py-6">
                  <TicketBarcode value={createdTicket?.ticketNumber} />
                </div>

                <div className="mt-8 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#222D64]/45">Mobile</p>
                    <p className="mt-2 text-lg font-black text-[#222D64]" dir="ltr">{createdTicket?.mobileNumber}</p>
                    <p className="mt-4 text-xs font-bold text-[#222D64]/55">Track: {trackingUrl}</p>
                  </div>
                  <div className="justify-self-center">
                    <QRCodeSVG value={trackingUrl} size={120} level="H" includeMargin={true} className="rounded-2xl bg-white p-2" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketCreationPage = () => (
  <ErrorBoundary>
    <TicketCreationPageContent />
  </ErrorBoundary>
);

export default TicketCreationPage;
