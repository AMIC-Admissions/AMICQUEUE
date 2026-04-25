
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Users, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

const AdminUsersPageContent = () => {
  const { data: syncData, refetchUsers } = useSyncContext();
  const [loading, setLoading] = useState(false);

  const usersList = [...(syncData?.users || [])].sort((a, b) => new Date(b?.updated || 0) - new Date(a?.updated || 0));

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refetchUsers();
      toast.success('Staff list refreshed');
    } catch (err) {
      toast.error('Failed to refresh staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!user?.id) return;
    if (window.confirm(`Are you sure you want to delete staff member ${user.email}?`)) {
      setLoading(true);
      try {
        await pb.collection('users').delete(user.id, { $autoCancel: false });
        toast.success('Staff member deleted successfully');
        await refetchUsers();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error?.message || 'Failed to delete staff member');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>Staff Management - AMIC Queue</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">Staff Management</h1>
            <p className="text-muted-foreground text-sm">Manage staff, operators, and counter assignments.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full md:w-auto interactive-element rounded-xl h-12">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link to="/admin/add-staff" className="w-full md:w-auto">
            <Button className="w-full rounded-xl shadow-lg shadow-primary/20 interactive-element h-12 px-6 font-bold">
              <Plus className="w-5 h-5 mr-2" /> Add New Staff
            </Button>
          </Link>
        </div>
      </div>

      <div className="card-primary overflow-hidden bg-card/95 backdrop-blur-xl border-border/40">
        {loading && usersList.length === 0 ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => (
               <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold py-5 text-foreground">Name / Username</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Email</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Role</TableHead>
                <TableHead className="font-bold py-5 text-foreground">Counter</TableHead>
                <TableHead className="font-bold py-5 text-right text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-bold text-foreground">No staff members found</p>
                      <p className="text-sm mt-1">Click "Add New Staff" to create one.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usersList.map((user) => {
                const counterDisplay = user?.counterNumber ?? 1;
                
                return (
                  <TableRow key={user?.id || Math.random()} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <p className="font-bold text-foreground">{user?.name || user?.username || '-'}</p>
                      {user?.name && user?.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 font-medium">{user?.email ?? '---'}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="capitalize px-3 py-1 rounded-lg font-bold">
                        {user?.role || 'operator'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-primary/10 text-primary font-black text-sm border border-primary/20">
                        {counterDisplay ? `Counter ${counterDisplay}` : 'Not assigned'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user)} aria-label="Delete User" disabled={loading} className="interactive-element hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-5 h-5 text-destructive transition-colors" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

const AdminUsersPage = () => (
  <ErrorBoundary>
    <AdminUsersPageContent />
  </ErrorBoundary>
);

export default AdminUsersPage;
