
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';

export const TicketFilterBar = ({ 
  statusFilter, 
  setStatusFilter, 
  serviceFilter, 
  setServiceFilter, 
  sortOrder, 
  setSortOrder,
  counts,
  onFilterChange
}) => {
  const statuses = ['All', 'Pending', 'Called', 'Waiting', 'Served'];
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const records = await pb.collection('services').getFullList({
          filter: 'isActive = true',
          sort: 'order',
          $autoCancel: false
        });
        setServices(records);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Notify parent of filter changes if callback provided
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ service: serviceFilter, status: statusFilter, sort: sortOrder });
    }
  }, [serviceFilter, statusFilter, sortOrder, onFilterChange]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        {statuses.map(status => {
          const isActive = statusFilter === status;
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-5 transition-all ${isActive ? 'shadow-md' : 'hover:bg-muted'}`}
            >
              {status} 
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                {counts[status] || 0}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
        <div className="space-y-1.5 w-full sm:w-[220px]">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-1">Service Type</label>
          <Select value={serviceFilter} onValueChange={setServiceFilter} disabled={loading}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder={loading ? "Loading..." : "All Services"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Services">All Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-full sm:w-[180px]">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-1">Sort By</label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created">Newest First</SelectItem>
              <SelectItem value="created">Oldest First</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="counter">Counter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
