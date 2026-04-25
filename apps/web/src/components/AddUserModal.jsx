
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Loader2 } from 'lucide-react';

export const AddUserModal = ({ open, onOpenChange, onSuccess, onUserAdded, userToEdit = null }) => {
  const { refetchUsers } = useSyncContext();
  const [loading, setLoading] = useState(false);
  
  const defaultFormData = {
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    counterNumber: '1'
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit?.name || '',
        username: userToEdit?.username || '',
        email: userToEdit?.email || '',
        password: '',
        role: userToEdit?.role || 'staff',
        counterNumber: (userToEdit?.counterNumber || 1).toString()
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [userToEdit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Invalid email format');
      return;
    }
    
    if (!formData.role) {
      toast.error('Role is required');
      return;
    }
    
    if (!userToEdit && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }
    
    if (formData.password && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const counterVal = parseInt(formData.counterNumber, 10) || 1;
      
      const data = {
        name: formData.name?.trim() || '',
        username: formData.username?.trim() || '',
        email: formData.email?.trim(),
        role: formData.role || 'staff',
        counterNumber: counterVal,
        emailVisibility: true,
        verified: true
      };

      if (formData.password) {
        data.password = formData.password;
        data.passwordConfirm = formData.password;
      }

      if (userToEdit) {
        await pb.collection('users').update(userToEdit.id, data, { $autoCancel: false });
        toast.success('User updated successfully');
      } else {
        await pb.collection('users').create(data, { $autoCancel: false });
        toast.success('User created successfully');
      }
      
      await refetchUsers();
      
      if (onSuccess) onSuccess();
      if (onUserAdded) onUserAdded();
      
      setFormData(defaultFormData);
      onOpenChange(false);
    } catch (err) {
      console.error('User save error:', err);
      const errorMessage = err?.response?.message || err?.message || 'Failed to save user. Please check your inputs or permissions.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              disabled={loading}
              required
              placeholder="e.g. Jane Doe"
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              disabled={loading}
              placeholder="e.g. janedoe"
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required
              disabled={loading}
              placeholder="email@example.com"
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {userToEdit ? 'New Password (leave blank to keep current)' : 'Password '}
              {!userToEdit && <span className="text-destructive">*</span>}
            </Label>
            <Input 
              id="password" 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required={!userToEdit}
              minLength={8}
              disabled={loading}
              placeholder="Min 8 characters"
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.role} 
              onValueChange={v => setFormData({...formData, role: v})}
              disabled={loading}
              required
            >
              <SelectTrigger className="text-foreground"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="counterNumber">Assigned Counter <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.counterNumber} 
              onValueChange={v => setFormData({...formData, counterNumber: v})}
              disabled={loading}
              required
            >
              <SelectTrigger className="text-foreground"><SelectValue placeholder="Select counter" /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    Counter {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
