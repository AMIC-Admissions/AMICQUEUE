
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { translations } from '@/translations.js';
import pb from '@/lib/pocketbaseClient';

const ActivityLogPage = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const records = await pb.collection('activity_logs').getList(1, 50, {
          sort: '-timestamp',
          $autoCancel: false
        });
        setLogs(records.items);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{`${t?.admin?.activityLog ?? 'Activity Log'} - AMIC Queue Management`}</title></Helmet>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
          <ClipboardList className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-display font-black">{t?.admin?.activityLog ?? 'Activity Log'}</h1>
      </div>

      <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">{t?.common?.date ?? 'Date'}</TableHead>
              <TableHead className="font-bold">Action</TableHead>
              <TableHead className="font-bold">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>{log.description}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No activity logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ActivityLogPage;
