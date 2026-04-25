
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const SyncContext = createContext(null);

const DEFAULT_SYNC_DATA = {
  tickets: [],
  activity_logs: [],
  counters: [],
  services: [],
  users: [],
  settings: []
};

const CACHE_KEY_SERVICES = 'amic_services_cache';
const CACHE_TTL = 3600000; // 1 hour

export const SyncProvider = ({ children }) => {
  const [data, setData] = useState(DEFAULT_SYNC_DATA);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef(new Set());

  const getCachedServices = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_SERVICES);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to parse cached services', err);
    }
    return null;
  };

  const fetchInitialData = useCallback(async () => {
    try {
      const cachedServices = getCachedServices();
      
      const [tickets, logs, counters, users, settings, servicesRes] = await Promise.all([
        pb.collection('tickets').getFullList({ sort: '-updated', $autoCancel: false }).catch(() => []),
        pb.collection('activity_logs').getFullList({ sort: '-timestamp', $autoCancel: false }).catch(() => []),
        pb.collection('counters').getFullList({ sort: 'counterNumber', $autoCancel: false }).catch(() => []),
        pb.collection('users').getFullList({ sort: '-updated', $autoCancel: false }).catch(() => []),
        pb.collection('settings').getFullList({ sort: '-updated', $autoCancel: false }).catch(() => []),
        cachedServices ? Promise.resolve(cachedServices) : pb.collection('services').getFullList({ sort: 'order', $autoCancel: false }).catch(() => [])
      ]);

      if (!cachedServices && servicesRes?.length > 0) {
        localStorage.setItem(CACHE_KEY_SERVICES, JSON.stringify({ data: servicesRes, timestamp: Date.now() }));
      }

      setData({ 
        tickets: tickets || [], 
        activity_logs: logs || [], 
        counters: counters || [], 
        services: servicesRes || [], 
        users: users || [],
        settings: settings || []
      });
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch initial sync data:', err);
      setIsConnected(false);
      setError(err?.message ?? 'Sync failed');
    }
  }, []);

  const fetchTickets = async () => {
    try {
      const tickets = await pb.collection('tickets').getFullList({ sort: '-updated', $autoCancel: false });
      setData(prev => ({ ...prev, tickets: tickets || [] }));
      return tickets;
    } catch (err) {
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await pb.collection('users').getFullList({ 
        sort: '-updated', 
        filter: 'role="staff" || role="operator" || role="admin"',
        $autoCancel: false 
      });
      setData(prev => ({ ...prev, users: users || [] }));
      return users;
    } catch (err) {
      return [];
    }
  };

  const setupSubscriptions = useCallback(() => {
    const collections = ['tickets', 'activity_logs', 'counters', 'services', 'users', 'settings'];
    
    collections.forEach(collection => {
      if (!subscriptionsRef.current.has(collection)) {
        try {
          pb.collection(collection).subscribe('*', (e) => {
            if (!e?.record?.id) return;
            
            if (collection === 'services') {
              localStorage.removeItem(CACHE_KEY_SERVICES); // Invalidate cache on update
            }
            
            setData(prev => {
              const current = prev?.[collection] ?? [];
              if (e.action === 'create') return { ...prev, [collection]: [e.record, ...current] };
              if (e.action === 'update') return { ...prev, [collection]: current.map(item => item?.id === e.record.id ? e.record : item) };
              if (e.action === 'delete') return { ...prev, [collection]: current.filter(item => item?.id !== e.record.id) };
              return prev;
            });
          }).then(() => {
            subscriptionsRef.current.add(collection);
          }).catch(err => console.error(`Failed to subscribe to ${collection}:`, err));
        } catch (err) {
          console.error(`Subscription setup failed for ${collection}:`, err);
        }
      }
    });
  }, []);

  useEffect(() => {
    fetchInitialData();
    setupSubscriptions();

    const interval = setInterval(() => {
      if (!pb.realtime.isConnected) {
        setIsConnected(false);
        fetchInitialData();
        setupSubscriptions();
      } else {
        setIsConnected(true);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      const collections = ['tickets', 'activity_logs', 'counters', 'services', 'users', 'settings'];
      collections.forEach(collection => {
        try {
          pb.collection(collection).unsubscribe('*');
        } catch (err) {
          // Silent catch
        }
        subscriptionsRef.current.delete(collection);
      });
    };
  }, [fetchInitialData, setupSubscriptions]);

  return (
    <SyncContext.Provider value={{ 
      data: data ?? DEFAULT_SYNC_DATA, 
      isConnected, 
      error, 
      refetch: fetchInitialData,
      refetchTickets: fetchTickets,
      refetchUsers: fetchUsers
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncData = () => {
  const context = useContext(SyncContext);
  return context?.data ?? DEFAULT_SYNC_DATA;
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    return {
      data: DEFAULT_SYNC_DATA,
      isConnected: false,
      error: 'SyncContext not found',
      refetch: async () => {},
      refetchTickets: async () => {},
      refetchUsers: async () => {}
    };
  }
  return context;
};
