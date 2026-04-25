
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useAnalytics = () => {
  const [data, setData] = useState({
    todayTickets: [],
    served: 0,
    pending: 0,
    waiting: 0,
    called: 0,
    avgWaitTime: 0,
    servicesCount: [],
    statusDist: [],
    hourlyTrend: [],
    loading: true
  });

  const fetchData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const records = await pb.collection('tickets').getFullList({
        filter: `createdAt >= "${todayStr} 00:00:00"`,
        $autoCancel: false
      });

      let served = 0, pending = 0, waiting = 0, called = 0;
      let totalWaitMs = 0;
      const srvCounts = {};
      const hourly = {};

      records.forEach(t => {
        if (t.status === 'Served') served++;
        if (t.status === 'Pending') pending++;
        if (t.status === 'Waiting') waiting++;
        if (t.status === 'Called') called++;

        if (t.status === 'Served' && t.servedAt && t.calledAt) {
          totalWaitMs += (new Date(t.servedAt) - new Date(t.calledAt));
        }

        srvCounts[t.service] = (srvCounts[t.service] || 0) + 1;

        const hour = new Date(t.createdAt).getHours();
        hourly[hour] = (hourly[hour] || 0) + 1;
      });

      const avgWait = served > 0 ? Math.round((totalWaitMs / served) / 60000) : 0;
      
      const topServices = Object.entries(srvCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
      
      const hourlyTrend = Object.entries(hourly).map(([hour, count]) => ({
        time: `${hour}:00`, tickets: count
      })).sort((a,b) => parseInt(a.time) - parseInt(b.time));

      const statusDist = [
        { name: 'Pending', value: pending },
        { name: 'Waiting', value: waiting },
        { name: 'Called', value: called },
        { name: 'Served', value: served }
      ];

      setData({
        todayTickets: records,
        served, pending, waiting, called,
        avgWaitTime: avgWait,
        servicesCount: topServices,
        hourlyTrend,
        statusDist,
        loading: false
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    pb.collection('tickets').subscribe('*', () => fetchData());
    return () => pb.collection('tickets').unsubscribe('*');
  }, [fetchData]);

  return data;
};
