
import { useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

const BRANCH_PREFIXES = {
  AMIS: 'AMIS',
  KIDS: 'KIDS',
};

const normalizeBranch = (branch) => {
  if (!branch) return 'AMIS';
  const key = String(branch).trim().toUpperCase();
  if (key === 'AJYAL') return 'AMIS';
  if (key === 'KIDSGATE') return 'KIDS';
  return BRANCH_PREFIXES[key] ? key : 'AMIS';
};

const parseSequenceNumber = (ticketNumber, prefix) => {
  const match = String(ticketNumber || '').match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) return null;

  const value = parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const isSameLocalDay = (value, dayStart) => {
  if (!value) return false;

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return false;

  return timestamp >= dayStart;
};

const getNextAvailableNumber = (numbers) => {
  const usedNumbers = new Set(
    numbers
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  let next = 1;
  while (usedNumbers.has(next)) {
    next += 1;
  }

  return next;
};

export const useTicketNumbering = () => {
  const generateTicketNumber = useCallback(async (branch, excludedTicketNumbers = []) => {
    const normalizedBranch = normalizeBranch(branch);
    const prefix = BRANCH_PREFIXES[normalizedBranch];

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const excludedNumbers = excludedTicketNumbers
        .map((ticketNumber) => parseSequenceNumber(ticketNumber, prefix))
        .filter((value) => value !== null);

      const records = await pb.collection('tickets').getFullList({
        sort: '-created',
        $autoCancel: false
      });

      const todaysSequenceNumbers = records
        .filter((record) => isSameLocalDay(record?.created || record?.updated, startOfDay))
        .map((record) => parseSequenceNumber(record?.ticketNumber, prefix))
        .filter((value) => value !== null);

      const nextNumber = getNextAvailableNumber([...todaysSequenceNumbers, ...excludedNumbers]);
      return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Failed to generate ticket number:', err);
      return `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }, []);

  return { generateTicketNumber };
};
