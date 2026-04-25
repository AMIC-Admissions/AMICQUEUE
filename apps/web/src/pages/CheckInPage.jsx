
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { NotificationService } from '@/utils/NotificationService.js';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getAppUrl } from '@/lib/runtimeUrls.js';

const CheckInPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  
  const [formData, setFormData] = useState({ branch: 'AMIS', service: '', parentName: '', mobile: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoadingServices(true);
    setServicesError(null);
    try {
      const data = await pb.collection('services').getFullList({ filter: 'isActive=true', sort: 'order', $autoCancel: false });
      setServices(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, service: data[0]?.name || '' }));
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServicesError(error?.message || 'Failed to load services.');
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData?.branch || !formData?.service || !formData?.parentName || !formData?.mobile) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const prefix = formData.branch.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticketNumber = `${prefix}-${randomNum}`;

      const record = await pb.collection('tickets').create({
        ...formData,
        ticketNumber,
        status: 'Pending',
        statusSelect: 'Pending'
      }, { $autoCancel: false });

      if (!record?.id) throw new Error('Ticket creation failed: no record ID returned');

      const trackingLink = getAppUrl(`/track?ticket=${encodeURIComponent(ticketNumber)}`);
      
      try {
        await NotificationService.sendWhatsApp(formData.mobile, ticketNumber, formData.branch, formData.service, trackingLink);
      } catch (waErr) {
        console.warn('WhatsApp notification skipped/failed:', waErr);
      }
      
      toast.success('Ticket created successfully');
      navigate(`/check-in-success/${record.id}`, { state: { ticket: record } });
    } catch (error) {
      toast.error(error?.message || 'Failed to create ticket');
      console.error('Check-in error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/30">
      <Helmet><title>{'Get Ticket - AMIC Queue Management'}</title></Helmet>
      <div className="max-w-md w-full card-primary">
        <h1 className="text-3xl font-display font-bold mb-6 text-center">Join the Queue</h1>
        
        {servicesError ? (
          <div className="bg-destructive/10 p-6 rounded-xl text-center flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-destructive font-medium mb-4">{servicesError}</p>
            <Button onClick={fetchServices} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formData.branch} onValueChange={v => setFormData(prev => ({...prev, branch: v}))}>
                <SelectTrigger className="bg-background text-foreground h-12"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMIS">AMIS</SelectItem>
                  <SelectItem value="KIDS">KIDS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Service</Label>
              {loadingServices ? (
                <Skeleton className="h-12 w-full rounded-md" />
              ) : (
                <Select value={formData.service} onValueChange={v => setFormData(prev => ({...prev, service: v}))}>
                  <SelectTrigger className="bg-background text-foreground h-12"><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s?.id || s?.name} value={s?.name}>{s?.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                required 
                value={formData.parentName} 
                onChange={e => setFormData(prev => ({...prev, parentName: e.target.value}))} 
                className="bg-background text-foreground h-12" 
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input 
                required 
                type="tel" 
                value={formData.mobile} 
                onChange={e => setFormData(prev => ({...prev, mobile: e.target.value}))} 
                className="bg-background text-foreground h-12" 
                placeholder="e.g. +971..."
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6 h-12 text-lg shadow-lg" 
              disabled={submitting || loadingServices}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </div>
              ) : 'Get Ticket'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
