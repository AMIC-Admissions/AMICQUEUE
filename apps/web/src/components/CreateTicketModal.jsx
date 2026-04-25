
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSyncContext } from '@/contexts/SyncContext.jsx';
import { Loader2 } from 'lucide-react';

export const CreateTicketModal = ({ open, onOpenChange, onSuccess }) => {
  const { currentUser } = useAuth();
  const { refetchTickets } = useSyncContext();
  const [loading, setLoading] = useState(false);
  
  const defaultFormData = {
    ticketNumber: '',
    branch: 'Main Branch',
    parentName: '',
    mobile: '',
    service: 'General',
    status: 'Pending'
  };
  
  const [formData, setFormData] = useState(defaultFormData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict Validation
    if (!formData.ticketNumber?.trim()) {
      toast.error('Ticket Number is required');
      return;
    }
    if (!formData.parentName?.trim()) {
      toast.error('Customer Name is required');
      return;
    }
    if (!formData.mobile?.trim()) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!formData.service?.trim()) {
      toast.error('Service is required');
      return;
    }
    if (!formData.branch?.trim()) {
      toast.error('Branch is required');
      return;
    }

    setLoading(true);
    
    try {
      const ticketData = {
        ticketNumber: formData.ticketNumber.trim(),
        branch: formData.branch.trim(),
        parentName: formData.parentName.trim(),
        mobile: formData.mobile.trim(),
        service: formData.service.trim(),
        status: formData.status || 'Pending',
        statusSelect: formData.status || 'Pending',
        counter: currentUser?.counterNumber ?? currentUser?.counter ?? null,
        createdBy: currentUser?.id ?? null,
        createdAt: new Date().toISOString()
      };

      await pb.collection('tickets').create(ticketData, { $autoCancel: false });
      
      // Force instant refresh before closing modal
      await refetchTickets();
      
      toast.success(`Ticket ${ticketData.ticketNumber} created successfully`);
      
      setFormData(defaultFormData);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Create ticket error:', err);
      const errorMessage = err?.response?.message || err?.message || 'Failed to create ticket. Please check your inputs or permissions.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ticketNumber">Ticket Number <span className="text-destructive">*</span></Label>
            <Input 
              id="ticketNumber" 
              value={formData.ticketNumber} 
              onChange={e => setFormData({...formData, ticketNumber: e.target.value})} 
              placeholder="e.g. A001"
              required
              disabled={loading}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentName">Customer Name <span className="text-destructive">*</span></Label>
            <Input 
              id="parentName" 
              value={formData.parentName} 
              onChange={e => setFormData({...formData, parentName: e.target.value})} 
              placeholder="Full Name"
              required
              disabled={loading}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number <span className="text-destructive">*</span></Label>
            <Input 
              id="mobile" 
              value={formData.mobile} 
              onChange={e => setFormData({...formData, mobile: e.target.value})} 
              placeholder="Phone Number"
              required
              disabled={loading}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service">Service <span className="text-destructive">*</span></Label>
            <Input 
              id="service" 
              value={formData.service} 
              onChange={e => setFormData({...formData, service: e.target.value})} 
              placeholder="Service Type"
              required
              disabled={loading}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch <span className="text-destructive">*</span></Label>
            <Input 
              id="branch" 
              value={formData.branch} 
              onChange={e => setFormData({...formData, branch: e.target.value})} 
              placeholder="Branch Name"
              required
              disabled={loading}
              className="text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={v => setFormData({...formData, status: v})}
              disabled={loading}
            >
              <SelectTrigger className="text-foreground"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Called">Called</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
