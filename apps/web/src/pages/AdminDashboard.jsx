
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, BarChart3, ClipboardList, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation.js';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { CreateTicketModal } from '@/components/CreateTicketModal.jsx';
import { toast } from 'sonner';

const AdminDashboardContent = () => {
  const t = useTranslation();
  const adminT = t?.admin ?? {};
  const statusT = t?.status ?? {};

  const { data: syncData, refetchTickets, isConnected } = useSyncContext();
  const tickets = Array.isArray(syncData?.tickets) ? syncData.tickets : [];

  const [loading, setLoading] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTickets = tickets.filter(t => new Date(t?.createdAt || 0) >= today);
    
    const counts = { total: todayTickets.length, pending: 0, called: 0, waiting: 0, served: 0 };
    
    todayTickets.forEach(r => {
      const status = r?.status?.toLowerCase();
      if (status && counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(b?.updated || 0) - new Date(a?.updated || 0)).slice(0, 5);
  }, [tickets]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refetchTickets();
      toast.success('Dashboard refreshed');
    } catch (err) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  const QuickLink = ({ to, icon: Icon, title }) => (
    <Link to={to} className="group bg-card border border-border/50 rounded-2xl p-6 transition-all hover:shadow-lg flex items-center gap-4">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-lg group-hover:text-primary transition-colors text-foreground">{title}</h3>
    </Link>
  );

  return (
    <div className="flex-1 pb-12">
      <Helmet><title>{`${adminT?.overview ?? 'Admin Overview'} - AMIC Queue Management`}</title></Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-display font-black text-foreground">{adminT?.overview ?? 'Overview'}</h1>
          <div className="flex-1"></div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="mr-2">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setIsTicketModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Create Ticket
          </Button>
        </div>

        {!isConnected && (
          <div className="bg-warning/10 border border-warning/20 p-4 rounded-2xl flex items-center mb-6">
            <AlertCircle className="w-6 h-6 text-warning mr-3" />
            <p className="text-warning font-bold">Connection lost. Data may not be up to date.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
            <p className="text-sm font-bold text-muted-foreground uppercase">{adminT?.totalTickets ?? 'Total Tickets (Today)'}</p>
            <p className="text-4xl font-black mt-2 text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
            <p className="text-sm font-bold text-muted-foreground uppercase">{statusT?.Pending ?? 'Pending'}</p>
            <p className="text-4xl font-black mt-2 text-muted-foreground">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
            <p className="text-sm font-bold text-muted-foreground uppercase">{statusT?.Waiting ?? 'Waiting'}</p>
            <p className="text-4xl font-black mt-2 text-orange-500">{stats.waiting}</p>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
            <p className="text-sm font-bold text-muted-foreground uppercase">{statusT?.Served ?? 'Served'}</p>
            <p className="text-4xl font-black mt-2 text-green-600">{stats.served}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <h3 className="text-xl font-display font-bold mb-6 text-foreground">Recent Tickets</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.map(t => (
                    <TableRow key={t?.id || Math.random()}>
                      <TableCell className="font-bold text-foreground">{t?.ticketNumber ?? '---'}</TableCell>
                      <TableCell>{t?.service ?? '---'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t?.status ?? 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t?.updated ? new Date(t.updated).toLocaleTimeString() : '---'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold mb-4 text-foreground">Quick Links</h3>
            <QuickLink to="/admin/users" icon={Users} title={adminT?.users ?? 'Users'} />
            <QuickLink to="/admin/settings" icon={Settings} title={adminT?.settings ?? 'Settings'} />
            <QuickLink to="/admin/reports" icon={BarChart3} title={adminT?.reports ?? 'Reports'} />
            <QuickLink to="/admin/activity-log" icon={ClipboardList} title={adminT?.activityLog ?? 'Activity Log'} />
          </div>
        </div>
      </div>

      <CreateTicketModal 
        open={isTicketModalOpen} 
        onOpenChange={setIsTicketModalOpen} 
        onSuccess={handleRefresh} 
      />
    </div>
  );
};

const AdminDashboard = () => (
  <ErrorBoundary>
    <AdminDashboardContent />
  </ErrorBoundary>
);

export default AdminDashboard;
