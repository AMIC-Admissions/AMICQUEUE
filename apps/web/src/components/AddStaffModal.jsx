
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { getAppUrl } from '@/lib/runtimeUrls.js';
import { getCounterOptions } from '@/lib/counterOptions.js';

const formatRecordError = (error) => {
  const responseMessage = error?.response?.message || error?.message || 'Unknown error';
  const details = error?.response?.data || error?.data;

  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return responseMessage;
  }

  const fieldMessages = Object.entries(details)
    .map(([field, value]) => {
      const message = value?.message || value?.code || String(value || '').trim();
      return message ? `${field}: ${message}` : field;
    })
    .filter(Boolean);

  return fieldMessages.length > 0 ? `${responseMessage} (${fieldMessages.join(' | ')})` : responseMessage;
};

export const AddStaffModal = ({ open, onOpenChange, onSuccess }) => {
  const { data: syncData, refetchUsers } = useSyncContext();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const counterOptions = useMemo(() => getCounterOptions(syncData?.counters), [syncData?.counters]);
  
  const defaultFormData = {
    username: '',
    email: '',
    password: '',
    role: 'staff',
    counterNumber: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (!formData.counterNumber && counterOptions.length > 0) {
      setFormData((prev) => ({ ...prev, counterNumber: String(counterOptions[0]) }));
    }
  }, [counterOptions, formData.counterNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username?.trim() || !formData.email?.trim() || !formData.password || !formData.role || !formData.counterNumber) {
      toast.error('All fields are required');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const data = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        passwordConfirm: formData.password,
        role: formData.role,
        counter: parseInt(formData.counterNumber, 10),
        counterNumber: parseInt(formData.counterNumber, 10),
        emailVisibility: true,
        verified: false,
        status: 'active',
        name: formData.username.trim()
      };

      const record = await pb.collection('users').create(data, { $autoCancel: false });
      await refetchUsers();
      
      setSuccessData({
        email: record.email,
        password: formData.password,
        role: record.role,
        counter: record.counterNumber
      });
      
      toast.success('Staff member created successfully');
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Staff creation error:', err);
      toast.error(formatRecordError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `Login URL: ${getAppUrl('/login')}\nEmail: ${successData.email}\nPassword: ${successData.password}\nRole: ${successData.role}\nCounter: ${successData.counter}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setSuccessData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !loading) handleClose();
    }}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {successData ? 'Staff Created' : 'Add New Staff'}
          </DialogTitle>
        </DialogHeader>
        
        {successData ? (
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground mb-2">Staff account is ready!</p>
              <p className="text-sm text-muted-foreground mb-6">Please save these credentials. The password will not be shown again.</p>
              
              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3 border border-border/50">
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground">Email</span>
                  <p className="font-medium text-foreground">{successData.email}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-muted-foreground">Password</span>
                  <p className="font-medium text-foreground font-mono">{successData.password}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={copyCredentials}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input 
                id="username" 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                disabled={loading}
                required
                placeholder="e.g. jsmith"
                className="text-foreground rounded-xl"
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
                placeholder="staff@example.com"
                className="text-foreground rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input 
                id="password" 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required
                minLength={8}
                disabled={loading}
                placeholder="Min 8 characters"
                className="text-foreground rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.role} 
                  onValueChange={v => setFormData({...formData, role: v})}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="text-foreground rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="counterNumber">Counter <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.counterNumber} 
                  onValueChange={v => setFormData({...formData, counterNumber: v})}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="text-foreground rounded-xl"><SelectValue placeholder="Select counter" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {counterOptions.map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Counter {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl shadow-lg shadow-primary/20">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Staff'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
