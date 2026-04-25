
import { useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export const useTickets = () => {
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const currentUser = auth?.currentUser ?? null;

  const getCounter = () => currentUser?.counterNumber ?? currentUser?.counter ?? 1;

  const logAction = async (action, ticketId, details, description) => {
    try {
      await pb.collection('activity_logs').create({
        action: action ?? 'unknown_action',
        ticketId: ticketId ?? '',
        userId: currentUser?.id,
        counterNumber: getCounter(),
        timestamp: new Date().toISOString(),
        details: details ?? {},
        description: description ?? ''
      }, { $autoCancel: false });
    } catch (e) {
      console.warn('Activity log skipped:', e.message);
    }
  };

  const getTickets = useCallback(async (filter = '', sort = '-updated') => {
    setLoading(true);
    try {
      const res = await pb.collection('tickets').getFullList({ filter, sort, $autoCancel: false });
      return res ?? [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const callNext = useCallback(async (serviceName) => {
    setLoading(true);
    const counter = getCounter();
    try {
      const activeTicket = await pb.collection('tickets').getFirstListItem(
        `status="Called" && counter=${counter}`,
        { $autoCancel: false }
      ).catch(() => null);

      if (activeTicket) {
        toast.error(`Counter ${counter} already has an active ticket.`);
        setLoading(false);
        return null;
      }

      const filterStr = serviceName && serviceName !== 'All Services' 
        ? `status="Pending" && service="${serviceName}"`
        : `status="Pending"`;

      const pending = await pb.collection('tickets').getFirstListItem(
        filterStr,
        { sort: 'updated', $autoCancel: false }
      );
      
      if (!pending?.id) throw new Error('No tickets');

      const updated = await pb.collection('tickets').update(pending.id, {
        status: 'Called',
        counter: counter,
        calledAt: new Date().toISOString()
      }, { $autoCancel: false });

      await logAction('ticket_called', pending.id, { counter }, `Called ticket ${pending?.ticketNumber}`);
      toast.success(`Called ticket ${pending?.ticketNumber}`);
      return updated;
    } catch (error) {
      toast.error('No pending tickets available.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { getTickets, callNext, loading };
};
