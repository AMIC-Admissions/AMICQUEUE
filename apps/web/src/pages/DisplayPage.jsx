
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

const DisplayPageContent = () => {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    try {
      // Only fetch Called tickets for accurate current state
      const records = await pb.collection('tickets').getFullList({
        filter: 'status="Called"',
        sort: '-calledAt', // Most recently called first
        $autoCancel: false
      });
      setTickets(records || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    const subscribe = async () => {
      try {
        await pb.collection('tickets').subscribe('*', (e) => {
          // Instead of refetching the whole list, handle real-time updates smartly
          if (e.action === 'create' && e.record.status === 'Called') {
            setTickets(prev => [e.record, ...prev]);
          } else if (e.action === 'update') {
            if (e.record.status === 'Called') {
              // Add or update
              setTickets(prev => {
                const exists = prev.find(t => t.id === e.record.id);
                if (exists) {
                  return prev.map(t => t.id === e.record.id ? e.record : t).sort((a,b) => new Date(b.calledAt) - new Date(a.calledAt));
                }
                return [e.record, ...prev].sort((a,b) => new Date(b.calledAt) - new Date(a.calledAt));
              });
            } else {
              // Remove if status changed to served/cancelled/etc
              setTickets(prev => prev.filter(t => t.id !== e.record.id));
            }
          } else if (e.action === 'delete') {
            setTickets(prev => prev.filter(t => t.id !== e.record.id));
          }
        });
      } catch (err) {}
    };
    
    subscribe();
    return () => { pb.collection('tickets').unsubscribe('*').catch(()=>{}); };
  }, []);

  const calledTickets = useMemo(() => {
    return tickets.sort((a, b) => new Date(b.calledAt || 0) - new Date(a.calledAt || 0));
  }, [tickets]);

  const currentTicket = calledTickets.length > 0 ? calledTickets[0] : null;
  const previousTickets = calledTickets.slice(1, 6); // Last 5 tickets

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0a0a0a] text-slate-50 fixed inset-0 z-50 overflow-hidden font-sans">
      <Helmet><title>Queue Display</title></Helmet>

      {/* Main Focus Area */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {currentTicket ? (
            <motion.div 
              key={currentTicket.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="flex flex-col items-center justify-center w-full max-w-6xl"
            >
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-600 text-white px-16 py-4 rounded-full text-5xl font-black tracking-widest mb-12 shadow-[0_0_50px_rgba(37,99,235,0.5)] uppercase"
              >
                NOW SERVING
              </motion.div>

              <div className="grid grid-cols-2 w-full gap-8 bg-slate-900/50 border border-slate-800 rounded-[3rem] p-16 backdrop-blur-md shadow-2xl">
                <div className="flex flex-col items-center justify-center border-r border-slate-800 pr-8">
                  <p className="text-4xl text-slate-400 font-bold uppercase tracking-widest mb-6">Ticket</p>
                  <p className="text-[160px] xl:text-[220px] font-black font-variant-tabular leading-none tracking-tighter drop-shadow-lg text-white">
                    {currentTicket.ticketNumber}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center pl-8">
                  <p className="text-4xl text-slate-400 font-bold uppercase tracking-widest mb-6">Counter</p>
                  <p className="text-[160px] xl:text-[220px] font-black font-variant-tabular leading-none text-blue-500 drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]">
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
              className="flex flex-col items-center text-slate-700"
            >
              <Monitor className="w-40 h-40 mb-8 opacity-20" />
              <h2 className="text-6xl font-black tracking-widest uppercase opacity-40">Waiting for next ticket</h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Ribbon Footer */}
      <div className="h-56 bg-slate-950 border-t border-slate-900 flex items-center px-12 shadow-inner z-10 overflow-hidden">
        <h3 className="text-3xl font-black text-slate-600 uppercase tracking-widest mr-12 shrink-0">
          Previous
        </h3>
        
        <div className="flex gap-8 flex-1 overflow-hidden items-center">
          <AnimatePresence>
            {previousTickets.map((ticket) => (
              <motion.div 
                key={ticket.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, width: 0, margin: 0, padding: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="bg-slate-900 rounded-3xl border border-slate-800 flex items-center px-10 py-8 shrink-0 shadow-lg"
              >
                <div className="flex flex-col mr-10">
                  <span className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-1">Ticket</span>
                  <span className="text-5xl font-black text-white font-variant-tabular">{ticket.ticketNumber}</span>
                </div>
                <div className="w-px h-20 bg-slate-800 mr-10" />
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-1">Counter</span>
                  <span className="text-5xl font-black text-blue-500 font-variant-tabular">{ticket.counter}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const DisplayPage = () => (
  <ErrorBoundary>
    <DisplayPageContent />
  </ErrorBoundary>
);

export default DisplayPage;
