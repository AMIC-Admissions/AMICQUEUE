
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Users, Plus, Shield, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSyncData } from '@/contexts/SyncContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const UsersPage = () => {
  const { admins } = useSyncData();
  const [loading, setLoading] = useState(false);

  const handleAddUser = () => {
    toast.info('User management creation dialog would open here.');
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Helmet><title>{'User Management - AMIC Queue Management'}</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">Users</h1>
            <p className="text-muted-foreground font-medium">Manage administrators and operators.</p>
          </div>
        </div>
        
        <Button onClick={handleAddUser} className="font-bold rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-[2rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !admins || admins.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No users found or permission denied.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Counter</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-background">
                        {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1 text-primary" /> : <Monitor className="w-3 h-3 mr-1 text-muted-foreground" />}
                        {user.role || 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.counter ? `Counter ${user.counter}` : '-'}</TableCell>
                    <TableCell>
                      <Badge className={user.isActive !== false ? 'bg-success hover:bg-success/90' : 'bg-muted text-muted-foreground'}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
