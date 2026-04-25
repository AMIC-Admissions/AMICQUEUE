
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import pb from '@/lib/pocketbaseClient.js';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import EnableSoundButton from '@/components/EnableSoundButton.jsx';
import { useVoiceAnnouncement } from '@/hooks/useVoiceAnnouncement.js';
import { getAppPath } from '@/lib/runtimeUrls.js';

const DisplayScreenContent = () => {
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  
  const { addToVoiceQueue, lastAnnouncedTicket } = useVoiceAnnouncement();
  const soundEnabledRef = useRef(false);

  // Keep a ref of the sound state to avoid unnecessary hook dependencies in the interval
  useEffect(() => {
    const checkSound = () => {
      soundEnabledRef.current = localStorage.getItem('soundEnabled') === 'true';
    };
    checkSound();
    window.addEventListener('storage', checkSound);
    // Custom polling to catch same-window updates easily
    const interval = setInterval(checkSound, 1000);
    return () => {
      window.removeEventListener('storage', checkSound);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const records = await pb.collection('settings').getFullList(1, { $autoCancel: false });
        if (records.length > 0) {
          setSettings(records[0]);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    loadSettings();
  }, []);

  const fetchTickets = async () => {
    try {
      const records = await pb.collection('tickets').getList(1, 100, {
        filter: 'status="Called"',
        sort: '-updated', // Fetches most recently called/updated first
        $autoCancel: false
      });
      
      setTickets(records.items || []);
      setFetchError(false);
      
      if (records.items.length > 0) {
        const currentTicket = records.items[0];
        // Check if new ticket needs announcing
        if (soundEnabledRef.current && (!lastAnnouncedTicket || lastAnnouncedTicket.id !== currentTicket.id)) {
          addToVoiceQueue(currentTicket);
        }
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
  }, [lastAnnouncedTicket]); // Re-bind when lastAnnouncedTicket changes so closure uses fresh value

  const getImageUrl = (record, filename) => {
    if (!record || !filename) return null;
    return pb.files.getUrl(record, filename);
  };

  const bgUrl = getImageUrl(settings, settings?.backgroundImage)
    || settings?.backgroundImagePath
    || getAppPath('/assets/amic-background.svg');
  const logoUrl = getImageUrl(settings, settings?.logoImage)
    || settings?.logoPath
    || getAppPath('/assets/amic-logo.svg');

  const currentTicket = tickets.length > 0 ? tickets[0] : null;
  const previousTickets = tickets.slice(1, 6);

  return (
    <div 
      className="w-screen h-[100dvh] flex flex-col bg-slate-950 text-white fixed inset-0 z-50 overflow-hidden font-sans"
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Helmet><title>Queue Display - NOW SERVING</title></Helmet>

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[2px] pointer-events-none" />

      {/* Header / Logo Area */}
      <div className="relative z-10 w-full p-8 flex justify-between items-start">
        <div className="w-[300px]"></div> {/* Spacer */}
        
        <div className="flex items-center justify-center bg-black/30 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
          {logoUrl ? (
            <img src={logoUrl} alt="System Logo" className="max-w-[200px] h-auto object-contain" />
          ) : (
            <h1 className="text-5xl font-black tracking-widest uppercase text-white drop-shadow-lg">AMIC</h1>
          )}
        </div>
        
        <div className="w-[300px] flex justify-end">
          <EnableSoundButton />
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-7xl mx-auto px-8 pb-12">
        <AnimatePresence mode="wait">
          {currentTicket ? (
            <motion.div 
              key={currentTicket.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="flex flex-col items-center justify-center w-full"
            >
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-600 text-white px-16 py-4 rounded-full text-display-sm mb-12 shadow-[0_0_50px_rgba(22,163,74,0.6)] border-4 border-green-400/30"
              >
                NOW SERVING
              </motion.div>

              <div className="grid grid-cols-2 w-full gap-8 bg-black/50 border border-white/20 rounded-[3rem] p-16 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center justify-center border-r border-white/20 pr-8">
                  <p className="text-4xl text-slate-300 font-bold uppercase tracking-widest mb-6 drop-shadow-md">Ticket</p>
                  <p className="text-display-lg text-white">
                    {currentTicket.ticketNumber}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center pl-8">
                  <p className="text-4xl text-slate-300 font-bold uppercase tracking-widest mb-6 drop-shadow-md">Counter</p>
                  <p className="text-display-md text-blue-400 shadow-blue-500/20">
                    {currentTicket.counter}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-white/50 bg-black/30 p-16 rounded-[3rem] backdrop-blur-sm border border-white/5"
            >
              <h2 className="text-6xl font-black tracking-widest uppercase">Waiting for next ticket</h2>
              {fetchError && <p className="text-red-400 mt-4 text-xl">Connection issue. Retrying...</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Ribbon Footer */}
      <div className="relative z-10 w-full bg-black/60 border-t border-white/10 p-8 shadow-inner backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto flex items-center">
          <h3 className="text-3xl font-black text-slate-400 uppercase tracking-widest mr-12 shrink-0">
            Previous
          </h3>
          
          <div className="flex gap-6 flex-1 overflow-hidden items-center">
            <AnimatePresence>
              {previousTickets.map((ticket) => (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, width: 0, margin: 0, padding: 0 }}
                  transition={{ type: "spring" }}
                  className="bg-slate-900/80 rounded-2xl border border-white/10 flex items-center px-8 py-6 shrink-0 shadow-lg"
                >
                  <div className="flex flex-col mr-8">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket</span>
                    <span className="text-4xl font-black text-white font-variant-tabular">{ticket.ticketNumber}</span>
                  </div>
                  <div className="w-px h-16 bg-white/10 mr-8" />
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Counter</span>
                    <span className="text-4xl font-black text-blue-400 font-variant-tabular">{ticket.counter}</span>
                  </div>
                </motion.div>
              ))}
              {previousTickets.length === 0 && !currentTicket && (
                <div className="text-xl text-white/30 font-medium tracking-wide">No recent calls</div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
