import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Phone, CheckCircle2, ArrowRight, Printer, Loader2, Plus, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { QRCodeSVG } from 'qrcode.react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { getAppUrl } from '@/lib/runtimeUrls.js';
import { useTicketNumbering } from '@/hooks/useTicketNumbering.js';

const SERVICES_KEYS = [
  'Inquiry',
  'Complaint',
  'Suggestion',
  'New Registration',
  'Full-Year Fee Payment',
  'Instalment Payment',
  'Book Collection',
  'Uniform Purchase',
  'Uniform Collection',
  'Leave Request',
  'Document Submission',
  'Student File Update',
];

const BRANCH_OPTIONS = [
  { value: 'AMIS', label: 'Ajyal' },
  { value: 'KIDS', label: 'Kids Gate' },
];

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
  const isRtl = language === 'ar';
  const { generateTicketNumber } = useTicketNumbering();

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

      const trackingUrl = getAppUrl(`/track?ticket=${encodeURIComponent(ticketNumber)}`);
      const waMessage = [
        'Welcome to Admissions & Registration Office',
        `Your ticket: ${ticketNumber}`,
        `Track here: ${trackingUrl}`,
      ].join('\n');

      let waNumber = cleanNumber;
      if (waNumber.startsWith('+')) waNumber = waNumber.substring(1);
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');

      setFormData({ parentName: '', mobile: '', branch: '', service: '' });
    } catch (err) {
      console.error('Ticket creation error:', err);
      const detailedMsg = err?.data ? JSON.stringify(err.data) : (err?.message || 'Unknown error');
      setError(`Failed to create ticket: ${detailedMsg}`);
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

  return (
    <div className="flex-1 max-w-2xl mx-auto py-8 sm:py-12 w-full z-10 relative">
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
                    {SERVICES_KEYS.map((key) => (
                      <SelectItem key={key} value={key} className="py-3 text-base font-medium hover:bg-primary/5">
                        {t.services[key] || key}
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
            className="bg-card shadow-2xl rounded-3xl overflow-hidden text-center border border-border/50"
          >
            <div className="bg-emerald-500/10 p-12 border-b border-emerald-500/20 flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                Ticket created successfully
              </h2>
              <p className="text-muted-foreground font-medium">{t.ticket.keepTicket}</p>
            </div>

            <div className="p-8 sm:p-12 flex flex-col items-center">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {t.ticket.yourNumber}
              </p>
              <div className="text-[80px] md:text-[100px] font-black font-variant-tabular text-primary leading-none tracking-tighter mb-8 drop-shadow-sm">
                {createdTicket?.ticketNumber}
              </div>

              <div className="flex flex-col items-center gap-4 mb-10 w-full max-w-sm bg-background p-6 rounded-3xl border border-border/60 shadow-sm">
                <QRCodeSVG value={trackingUrl} size={200} level="H" includeMargin={true} className="bg-white p-2 rounded-2xl shadow-sm" />
                <Link to={`/track?ticket=${createdTicket?.ticketNumber}`} className="text-primary font-bold hover:underline text-sm break-all mt-3 bg-primary/5 px-4 py-2 rounded-lg text-center block">
                  {trackingUrl}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto mb-6">
                <Button className="h-14 font-bold shadow-md interactive-element rounded-xl w-full bg-[#25D366] hover:bg-[#1DA851] text-white" onClick={openWhatsAppManual}>
                  <MessageCircle className="w-5 h-5 mx-2" />
                  Send via WhatsApp
                </Button>

                <Button variant="outline" className="h-14 font-bold interactive-element rounded-xl w-full bg-background hover:bg-muted" onClick={() => window.print()}>
                  <Printer className="w-5 h-5 mx-2" />
                  {t.ticket.print}
                </Button>
              </div>

              <Button variant="ghost" className="h-14 font-bold text-muted-foreground hover:text-foreground interactive-element w-full max-w-md mx-auto rounded-xl" onClick={handleCreateAnother}>
                <Plus className="w-5 h-5 mx-2" />
                Create Another
              </Button>
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
