
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export const useQueueTracking = (ticketNumber) => {
  const [data, setData] = useState({ ticket: null, peopleBefore: 0, estWaitMins: 0, loading: true, error: null });

  const fetchTracking = useCallback(async () => {
    if (!ticketNumber) {
      setData(prev => ({ ...prev, loading: false, error: 'No ticket number provided' }));
      return;
    }
    
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const ticketRes = await pb.collection('tickets').getList(1, 1, {
        filter: `ticketNumber = "${ticketNumber}" && created >= "${todayStr} 00:00:00"`,
        $autoCancel: false
      });
      
      if (!ticketRes?.items || !Array.isArray(ticketRes.items) || ticketRes.items.length === 0) {
        setData({ ticket: null, peopleBefore: 0, estWaitMins: 0, loading: false, error: 'Ticket not found in today\'s queue' });
        return;
      }
      
      const ticket = ticketRes.items[0];

      if (!ticket?.service) {
        setData({ ticket, peopleBefore: 0, estWaitMins: 0, loading: false, error: 'Invalid ticket data structure' });
        return;
      }

      const allServiceTickets = await pb.collection('tickets').getFullList({
        filter: `service = "${ticket.service}" && created >= "${todayStr} 00:00:00"`,
        $autoCancel: false
      }).catch(() => []);

      const peopleBefore = allServiceTickets?.filter(t => 
        (t?.status === 'Pending' || t?.status === 'Waiting') && 
        new Date(t?.created || 0) < new Date(ticket?.created || new Date())
      ).length ?? 0;

      const servedTickets = allServiceTickets?.filter(t => t?.status === 'Served' && t?.servedAt && t?.calledAt) ?? [];
      
      let avgMins = 5;
      if (servedTickets.length > 0) {
        const totalMs = servedTickets.reduce((acc, t) => acc + (new Date(t.servedAt) - new Date(t.calledAt)), 0);
        avgMins = Math.max(1, Math.round((totalMs / servedTickets.length) / 60000));
      }

      setData({
        ticket,
        peopleBefore,
        estWaitMins: ticket?.status === 'Served' ? 0 : Math.max(1, (peopleBefore + 1) * avgMins),
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Tracking fetch error:', err);
      setData({ ticket: null, peopleBefore: 0, estWaitMins: 0, loading: false, error: err?.message ?? 'Failed to track ticket' });
    }
  }, [ticketNumber]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    
    try {
      pb.collection('tickets').subscribe('*', () => fetchTracking());
    } catch (err) {
      console.warn('Failed to subscribe to ticket updates:', err);
    }
    
    return () => {
      clearInterval(interval);
      try {
        pb.collection('tickets').unsubscribe('*');
      } catch (err) {
        // Ignore unsubscribe errors
      }
    };
  }, [fetchTracking]);

  return data ?? { ticket: null, peopleBefore: 0, estWaitMins: 0, loading: false, error: 'Unknown error' };
};
