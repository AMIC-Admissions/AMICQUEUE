
import { useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useTicketNumbering = () => {
  const generateTicketNumber = useCallback(async (branch) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // Get the highest ticket for this branch today
      const records = await pb.collection('tickets').getList(1, 1, {
        filter: `createdAt >= "${todayStr} 00:00:00" && branch = "${branch}"`,
        sort: '-createdAt',
        $autoCancel: false
      });

      let nextNumber = 1;
      if (records.items.length > 0) {
        const lastTicket = records.items[0].ticketNumber;
        const match = lastTicket.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      return `${branch}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Failed to generate ticket number:', err);
      // Fallback
      return `${branch}-${Math.floor(Math.random() * 900) + 100}`;
    }
  }, []);

  return { generateTicketNumber };
};
