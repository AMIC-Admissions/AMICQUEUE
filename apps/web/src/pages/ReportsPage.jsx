import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Ticket, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { translations } from '@/translations.js';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExcelExport } from '@/components/ExcelExport.jsx';

const toDateInputValue = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const getCreatedAt = (ticket) => ticket?.created || ticket?.createdAt;

const ReportsPage = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { data, isConnected } = useSyncContext();
  const tickets = Array.isArray(data?.tickets) ? data.tickets : [];
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());

  const report = useMemo(() => {
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const dayTickets = tickets.filter((ticket) => {
      const created = getCreatedAt(ticket);
      if (!created) return false;
      const createdDate = new Date(created);
      return createdDate >= start && createdDate < end;
    });

    const totals = { total: dayTickets.length, served: 0, pending: 0, called: 0, waiting: 0, cancelled: 0 };
    const byService = new Map();
    const byCounter = new Map();
    const serviceDurations = [];

    dayTickets.forEach((ticket) => {
      const status = ticket?.status || 'Pending';
      const service = ticket?.service || 'No Service';
      const counter = ticket?.counter || ticket?.counterNumber || '-';

      if (status === 'Served') totals.served += 1;
      if (status === 'Pending') totals.pending += 1;
      if (status === 'Called') totals.called += 1;
      if (status === 'Waiting') totals.waiting += 1;
      if (status === 'Cancelled') totals.cancelled += 1;

      const serviceRow = byService.get(service) || { service, total: 0, served: 0, pending: 0, called: 0, waiting: 0, cancelled: 0 };
      serviceRow.total += 1;
      if (serviceRow[status.toLowerCase()] !== undefined) serviceRow[status.toLowerCase()] += 1;
      byService.set(service, serviceRow);

      if (status === 'Served') byCounter.set(counter, (byCounter.get(counter) || 0) + 1);

      if (ticket?.servedAt && ticket?.calledAt) {
        const minutes = Math.max(0, Math.round((new Date(ticket.servedAt) - new Date(ticket.calledAt)) / 60000));
        serviceDurations.push(minutes);
      }
    });

    const avgServiceMins = serviceDurations.length
      ? Math.round(serviceDurations.reduce((sum, minutes) => sum + minutes, 0) / serviceDurations.length)
      : 0;

    return {
      totals,
      avgServiceMins,
      byService: Array.from(byService.values()).sort((a, b) => b.served - a.served || b.total - a.total),
      byCounter: Array.from(byCounter.entries()).map(([counter, served]) => ({ counter, served })).sort((a, b) => b.served - a.served)
    };
  }, [tickets, selectedDate]);

  const Stat = ({ icon: Icon, label, value, tone = 'text-foreground' }) => (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-muted-foreground">{label}</p>
      </div>
      <p className={`text-4xl font-black font-variant-tabular ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{`${t?.common?.reports ?? 'Reports'} - AMIC Queue Management`}</title></Helmet>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">{t?.common?.reports ?? 'Daily Reports'}</h1>
            <p className="text-muted-foreground font-medium">Daily served ticket totals by service and counter.</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-11 pl-10 bg-card rounded-xl" dir="ltr" />
          </div>
          <ExcelExport />
        </div>
      </div>

      {!isConnected && (
        <div className="mb-6 bg-warning/10 border border-warning/20 text-warning rounded-2xl p-4 font-bold">
          Connection is unstable. Data may not be fully up to date.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Stat icon={Ticket} label="Total Tickets" value={report.totals.total} />
        <Stat icon={CheckCircle2} label="Served Today" value={report.totals.served} tone="text-green-700" />
        <Stat icon={Users} label="Still Waiting" value={report.totals.pending + report.totals.called + report.totals.waiting} tone="text-orange-700" />
        <Stat icon={Clock3} label="Avg Service Time" value={report.avgServiceMins ? `${report.avgServiceMins}m` : '-'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-display font-bold">By Service</h2>
          </div>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">Service</TableHead>
                <TableHead className="font-bold text-center">Total</TableHead>
                <TableHead className="font-bold text-center">Served</TableHead>
                <TableHead className="font-bold text-center">Waiting</TableHead>
                <TableHead className="font-bold text-center">Cancelled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byService.map((row) => (
                <TableRow key={row.service}>
                  <TableCell className="font-bold">{t.services?.[row.service] || row.service}</TableCell>
                  <TableCell className="text-center font-variant-tabular">{row.total}</TableCell>
                  <TableCell className="text-center font-bold text-green-700 font-variant-tabular">{row.served}</TableCell>
                  <TableCell className="text-center font-variant-tabular">{row.pending + row.called + row.waiting}</TableCell>
                  <TableCell className="text-center font-variant-tabular">{row.cancelled}</TableCell>
                </TableRow>
              ))}
              {report.byService.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No tickets for this date.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-display font-bold">Served By Counter</h2>
          </div>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">Counter</TableHead>
                <TableHead className="font-bold text-center">Served</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byCounter.map((row) => (
                <TableRow key={row.counter}>
                  <TableCell className="font-bold">{row.counter === '-' ? '-' : `Counter ${row.counter}`}</TableCell>
                  <TableCell className="text-center font-bold text-green-700 font-variant-tabular">{row.served}</TableCell>
                </TableRow>
              ))}
              {report.byCounter.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No served tickets for this date.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
