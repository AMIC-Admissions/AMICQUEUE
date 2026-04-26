
import { useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

const BRANCH_PREFIXES = {
  AMIS: 'AMIS',
  KIDS: 'KIDS',
};

const BRANCH_ALIASES = {
  AMIS: ['AMIS', 'Ajyal'],
  KIDS: ['KIDS', 'KidsGate', 'Kids Gate'],
};

const normalizeBranch = (branch) => {
  if (!branch) return 'AMIS';
  const key = String(branch).trim().toUpperCase();
  if (key === 'AJYAL') return 'AMIS';
  if (key === 'KIDSGATE') return 'KIDS';
  return BRANCH_PREFIXES[key] ? key : 'AMIS';
};

export const useTicketNumbering = () => {
  const generateTicketNumber = useCallback(async (branch) => {
    const normalizedBranch = normalizeBranch(branch);
    const prefix = BRANCH_PREFIXES[normalizedBranch];

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfDayIso = startOfDay.toISOString();

      const records = await pb.collection('tickets').getFullList({
        filter: `created >= "${startOfDayIso}"`,
        $autoCancel: false
      });

      const aliases = BRANCH_ALIASES[normalizedBranch] || [normalizedBranch];
      const latestNumber = records.reduce((maxNumber, record) => {
        const branchMatches = aliases.includes(record?.branch);
        const prefixMatches = String(record?.ticketNumber || '').startsWith(`${prefix}-`);
        if (!branchMatches && !prefixMatches) return maxNumber;

        const match = String(record?.ticketNumber || '').match(/-(\d+)$/);
        if (!match) return maxNumber;

        return Math.max(maxNumber, parseInt(match[1], 10));
      }, 0);

      const nextNumber = latestNumber + 1;
      return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Failed to generate ticket number:', err);
      return `${prefix}-001`;
    }
  }, []);

  return { generateTicketNumber };
};
