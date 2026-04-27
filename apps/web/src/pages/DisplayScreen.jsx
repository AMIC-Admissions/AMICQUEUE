import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CalendarDays, Clock3, MonitorSpeaker, Ticket } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import EnableSoundButton from '@/components/EnableSoundButton.jsx';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement.js';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { resolvePublishedAssetUrl } from '@/lib/brandAssets.js';

const BRANCH_LABELS = {
  AMIS: 'Ajyal',
  Ajyal: 'Ajyal',
  KIDS: 'Kids Gate',
  KidsGate: 'Kids Gate',
  'Kids Gate': 'Kids Gate',
};

const formatBranch = (branch) => BRANCH_LABELS[branch] || branch || 'Branch';
const getCounterValue = (ticket) => ticket?.counter ?? ticket?.counterNumber ?? '--';
const getTicketTimestamp = (ticket) => ticket?.calledAt || ticket?.updated || ticket?.created || 0;
const BILINGUAL_BRANCH_LABELS = {
  AMIS: { en: 'Ajyal', ar: '\u0623\u062c\u064a\u0627\u0644' },
  Ajyal: { en: 'Ajyal', ar: '\u0623\u062c\u064a\u0627\u0644' },
  KIDS: { en: 'Kids Gate', ar: '\u0643\u064a\u062f\u0632 \u062c\u064a\u062a' },
  KidsGate: { en: 'Kids Gate', ar: '\u0643\u064a\u062f\u0632 \u062c\u064a\u062a' },
  'Kids Gate': { en: 'Kids Gate', ar: '\u0643\u064a\u062f\u0632 \u062c\u064a\u062a' },
};

const formatTime = (date) => new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit'
}).format(date);

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(date);

const getBilingualBranch = (branch) => {
  const labels = BILINGUAL_BRANCH_LABELS[branch];
  if (!labels) return formatBranch(branch);
  return `${labels.en} / ${labels.ar}`;
};

const DisplayScreenContent = () => {
  const { language } = useLanguage();
  const { data: syncData } = useSyncContext();
  const [tickets, setTickets] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [now, setNow] = useState(new Date());
  const { addToVoiceQueue, lastAnnouncedTicket } = useVoiceAnnouncement();
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    const syncClock = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(syncClock);
  }, []);

  useEffect(() => {
    const checkSound = () => {
      soundEnabledRef.current = localStorage.getItem('soundEnabled') === 'true';
    };

    checkSound();
    window.addEventListener('storage', checkSound);

    const interval = setInterval(checkSound, 1000);
    return () => {
      window.removeEventListener('storage', checkSound);
      clearInterval(interval);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const records = await pb.collection('tickets').getList(1, 100, {
        filter: 'status="Called"',
        sort: '-updated',
        $autoCancel: false
      });

      const items = records.items || [];
      setTickets(items);
      setFetchError(false);

      const currentTicket = items[0];
      if (currentTicket && soundEnabledRef.current && (!lastAnnouncedTicket || lastAnnouncedTicket.id !== currentTicket.id)) {
        addToVoiceQueue(currentTicket);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError(true);
    }
  };

  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 2000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAnnouncedTicket]);

  const settings = Array.isArray(syncData?.settings) && syncData.settings.length > 0 ? syncData.settings[0] : null;

  const backgroundUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'backgroundImage',
    pathField: 'backgroundImagePath',
    fallbackPath: '/assets/amic-site-background.png'
  });

  const logoUrl = resolvePublishedAssetUrl({
    record: settings,
    fileField: 'logoImage',
    pathField: 'logoPath',
    fallbackPath: '/assets/amic-logo.png'
  });

  const calledTickets = useMemo(() => {
    return [...tickets].sort((left, right) => new Date(getTicketTimestamp(right)) - new Date(getTicketTimestamp(left)));
  }, [tickets]);

  const currentTicket = calledTickets[0] || null;
  const previousTickets = calledTickets.slice(1, 5);
  const systemTitle = settings?.systemTitle?.trim() || 'Admissions & Registration Office';
  const isArabic = language === 'ar';
  const displayTitle = isArabic ? '\u0645\u0643\u062a\u0628 \u0627\u0644\u0642\u0628\u0648\u0644 \u0648\u0627\u0644\u062a\u0633\u062c\u064a\u0644' : systemTitle;
  const liveLabel = isArabic ? '\u0634\u0627\u0634\u0629 \u0627\u0644\u0646\u062f\u0627\u0621 \u0627\u0644\u0645\u0628\u0627\u0634\u0631' : 'Live public display';
  const nowServingLabel = isArabic ? '\u062c\u0627\u0631\u064a \u0627\u0644\u0646\u062f\u0627\u0621 \u0627\u0644\u0622\u0646' : 'Now Serving';
  const currentQueueLabel = isArabic ? '\u0627\u0644\u062a\u0630\u0643\u0631\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629' : 'Current queue call';
  const currentQueueDescription = isArabic
    ? '\u064a\u0645\u0643\u0646 \u0644\u0644\u0623\u0647\u0627\u0644\u064a \u0645\u062a\u0627\u0628\u0639\u0629 \u0631\u0642\u0645 \u0627\u0644\u062a\u0630\u0643\u0631\u0629 \u0648\u0627\u0644\u0643\u0627\u0648\u0646\u062a\u0631 \u0648\u0627\u0644\u062e\u062f\u0645\u0629 \u0628\u0648\u0636\u0648\u062d \u0645\u0646 \u0623\u064a \u0645\u0643\u0627\u0646 \u0641\u064a \u0627\u0644\u0642\u0627\u0639\u0629.'
    : 'Families can follow the active ticket and counter clearly from a distance.';
  const connectionRetryLabel = isArabic ? '\u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631' : 'Connection retry in progress';
  const ticketNumberLabel = isArabic ? '\u0631\u0642\u0645 \u0627\u0644\u062a\u0630\u0643\u0631\u0629' : 'Ticket Number';
  const counterLabel = isArabic ? '\u0627\u0644\u0643\u0627\u0648\u0646\u062a\u0631' : 'Counter';
  const branchLabel = isArabic ? '\u0627\u0644\u0641\u0631\u0639' : 'Branch';
  const calledAtLabel = isArabic ? '\u0648\u0642\u062a \u0627\u0644\u0646\u062f\u0627\u0621' : 'Called At';
  const queueStandbyLabel = isArabic ? '\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0646\u062f\u0627\u0621 \u0627\u0644\u062a\u0627\u0644\u064a' : 'Queue standby';
  const queueStandbyDescription = isArabic
    ? '\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0645\u0628\u0627\u0634\u0631\u0629 \u0627\u0644\u062a\u0630\u0643\u0631\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0627\u0644\u062a\u064a \u064a\u062a\u0645 \u0646\u062f\u0627\u0624\u0647\u0627 \u0645\u0639 \u0627\u0644\u062e\u062f\u0645\u0629 \u0648\u0631\u0642\u0645 \u0627\u0644\u0643\u0627\u0648\u0646\u062a\u0631.'
    : 'The next called ticket will appear here immediately with its service and counter number.';
  const retryingLabel = isArabic ? '\u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0644\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.' : 'Live connection is retrying.';
  const recentCallsLabel = isArabic ? '\u0622\u062e\u0631 \u0627\u0644\u0646\u062f\u0627\u0621\u0627\u062a' : 'Recent Calls';
  const noRecentCallsLabel = isArabic ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062f\u0627\u0621\u0627\u062a \u0633\u0627\u0628\u0642\u0629 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.' : 'No recent calls yet.';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden text-slate-900"
      style={{
        backgroundColor: '#f5f7fb',
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Helmet><title>Queue Display - AMIC</title></Helmet>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,251,0.88))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(111,206,181,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,45,100,0.1),transparent_32%)]" />

      <div className="relative z-10 flex h-full flex-col px-6 py-6 xl:px-10 xl:py-8">
        <header className="grid grid-cols-[auto_1fr_auto] items-start gap-6">
          <div className="flex items-start">
            <div className="rounded-[28px] border border-[#222D64]/10 bg-white/92 px-5 py-4 shadow-[0_18px_40px_rgba(34,45,100,0.08)]">
              <img
                src={logoUrl}
                alt="AMIC group logo"
                className="h-12 w-auto object-contain xl:h-14"
              />
            </div>
          </div>

          <div className="flex flex-col items-center pt-1 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#222D64]/45">
              {isArabic ? '\u0646\u0638\u0627\u0645 \u0637\u0648\u0627\u0628\u064a\u0631 AMIC' : 'AMIC Queue System'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#222D64] xl:text-4xl">
              {displayTitle}
            </h1>
            <div className="mt-4 inline-flex items-center rounded-full border border-[#222D64]/10 bg-white/86 px-4 py-2 text-sm font-semibold text-[#222D64]/65 shadow-sm">
              {liveLabel}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <EnableSoundButton
              compact
              className="border border-[#222D64]/10 bg-white/92 text-[#222D64] shadow-[0_12px_28px_rgba(34,45,100,0.08)] hover:bg-white"
            />

              <div className="min-w-[220px] rounded-[24px] border border-[#222D64]/10 bg-white/88 px-5 py-4 text-right shadow-[0_16px_32px_rgba(34,45,100,0.06)]">
                <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#222D64]/45">
                  <CalendarDays className="h-4 w-4" />
                  {isArabic ? '\u0627\u0644\u064a\u0648\u0645' : 'Today'}
                </div>
              <div className="mt-2 text-3xl font-black tracking-tight text-[#222D64]">
                {formatTime(now)}
              </div>
              <div className="mt-1 text-sm font-medium text-[#222D64]/55">
                {formatDate(now)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center py-8">
          <AnimatePresence mode="wait">
            {currentTicket ? (
              <motion.section
                key={currentTicket.id}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 1.01 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="w-full"
              >
                <div className="rounded-[42px] border border-[#222D64]/10 bg-white/84 p-8 shadow-[0_30px_80px_rgba(34,45,100,0.14)] backdrop-blur-xl xl:p-12">
                  <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black uppercase tracking-[0.32em]"
                        style={{ backgroundColor: 'rgba(111, 206, 181, 0.22)', color: '#1f6d5b' }}
                      >
                        <MonitorSpeaker className="h-4 w-4" />
                        {nowServingLabel}
                      </div>

                      <h2 className="mt-6 text-5xl font-black tracking-tight text-[#222D64] xl:text-6xl">
                        {currentQueueLabel}
                      </h2>
                      <p className="mt-4 text-lg font-medium leading-8 text-[#222D64]/62 xl:text-2xl">
                        {currentQueueDescription}
                      </p>
                    </div>

                    {fetchError && (
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                        {connectionRetryLabel}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="rounded-[34px] bg-[#222D64] p-8 text-white shadow-[0_24px_60px_rgba(34,45,100,0.28)] xl:p-10">
                      <p className="text-sm font-bold uppercase tracking-[0.32em] text-white/58">
                        {ticketNumberLabel}
                      </p>
                      <p className="mt-6 text-[clamp(5rem,10vw,9.25rem)] font-black leading-none tracking-tight">
                        {currentTicket.ticketNumber}
                      </p>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <span className="rounded-full bg-white/10 px-4 py-2 text-base font-semibold">
                          {getBilingualBranch(currentTicket.branch)}
                        </span>
                        <span className="rounded-full bg-white/10 px-4 py-2 text-base font-semibold">
                          {currentTicket.service || 'Service'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[34px] border border-[#222D64]/10 bg-white p-8 shadow-[0_20px_50px_rgba(34,45,100,0.08)] xl:p-10">
                      <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#222D64]/42">
                        {counterLabel}
                      </p>
                      <p className="mt-6 text-[clamp(5rem,9vw,8.5rem)] font-black leading-none tracking-tight text-[#222D64]">
                        {getCounterValue(currentTicket)}
                      </p>

                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[24px] bg-[#f5f7fb] px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#222D64]/42">
                            <Building2 className="h-4 w-4" />
                            {branchLabel}
                          </div>
                          <p className="mt-3 text-2xl font-black text-[#222D64]">
                            {getBilingualBranch(currentTicket.branch)}
                          </p>
                        </div>

                        <div className="rounded-[24px] bg-[#f5f7fb] px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#222D64]/42">
                            <Clock3 className="h-4 w-4" />
                            {calledAtLabel}
                          </div>
                          <p className="mt-3 text-2xl font-black text-[#222D64]">
                            {formatTime(new Date(getTicketTimestamp(currentTicket)))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="rounded-[42px] border border-[#222D64]/10 bg-white/82 px-10 py-16 text-center shadow-[0_26px_72px_rgba(34,45,100,0.12)] backdrop-blur-xl">
                  <div
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px]"
                    style={{ backgroundColor: 'rgba(111, 206, 181, 0.18)' }}
                  >
                    <Ticket className="h-12 w-12 text-[#222D64]" />
                  </div>

                  <h2 className="mt-8 text-5xl font-black tracking-tight text-[#222D64] xl:text-6xl">
                    {queueStandbyLabel}
                  </h2>
                  <p className="mx-auto mt-5 max-w-3xl text-xl font-medium leading-9 text-[#222D64]/58 xl:text-2xl">
                    {queueStandbyDescription}
                  </p>

                  {fetchError && (
                    <p className="mt-6 text-base font-bold text-amber-700">
                      {retryingLabel}
                    </p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <footer className="grid items-start gap-4 xl:grid-cols-[260px_1fr]">
          <div className="rounded-[28px] bg-[#222D64] px-6 py-5 text-white shadow-[0_20px_50px_rgba(34,45,100,0.24)]">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/55">
              {recentCallsLabel}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight">
              {previousTickets.length.toString().padStart(2, '0')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {previousTickets.length > 0 ? previousTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-[28px] border border-[#222D64]/10 bg-white/84 px-6 py-5 shadow-[0_16px_36px_rgba(34,45,100,0.08)] backdrop-blur-md"
              >
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#222D64]/42">
                  Ticket
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight text-[#222D64]">
                  {ticket.ticketNumber}
                </p>

                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[#222D64]/58">
                  <span>{getBilingualBranch(ticket.branch)}</span>
                  <span>{isArabic ? `\u0643\u0627\u0648\u0646\u062a\u0631 ${getCounterValue(ticket)}` : `Counter ${getCounterValue(ticket)}`}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-[28px] border border-dashed border-[#222D64]/15 bg-white/68 px-6 py-8 text-lg font-semibold text-[#222D64]/48 xl:col-span-4">
                {noRecentCallsLabel}
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

const DisplayScreen = () => (
  <ErrorBoundary>
    <DisplayScreenContent />
  </ErrorBoundary>
);

export default DisplayScreen;
