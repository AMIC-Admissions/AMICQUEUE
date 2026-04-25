
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const ExcelExport = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (filterToday = false) => {
    setLoading(true);
    try {
      let filterStr = '';
      if (filterToday) {
        const todayStr = new Date().toISOString().split('T')[0];
        filterStr = `createdAt >= "${todayStr} 00:00:00"`;
      }

      const records = await pb.collection('tickets').getFullList({
        filter: filterStr,
        sort: '-createdAt',
        $autoCancel: false
      });

      const formattedData = records.map(t => {
        let waitMins = 0, serviceMins = 0;
        if (t.calledAt) {
          waitMins = Math.round((new Date(t.calledAt) - new Date(t.createdAt)) / 60000);
        }
        if (t.calledAt && t.servedAt) {
          serviceMins = Math.round((new Date(t.servedAt) - new Date(t.calledAt)) / 60000);
        }

        return {
          'Ticket Number': t.ticketNumber,
          'Branch': t.branch,
          'Service': t.service,
          'Status': t.status,
          'Counter': t.counter || 'N/A',
          'Created Time': new Date(t.createdAt).toLocaleString(),
          'Called Time': t.calledAt ? new Date(t.calledAt).toLocaleString() : 'N/A',
          'Served Time': t.servedAt ? new Date(t.servedAt).toLocaleString() : 'N/A',
          'Wait Time (mins)': waitMins || 'N/A',
          'Service Time (mins)': serviceMins || 'N/A',
          'Mobile': t.mobile,
          'Parent Name': t.parentName
        };
      });

      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-size columns
      const colWidths = Object.keys(formattedData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets Report");
      
      const fileName = `queue-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Export completed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport(true)} disabled={loading}>
        <Download className="w-4 h-4 mr-2" /> Today Only
      </Button>
      <Button variant="secondary" size="sm" onClick={() => handleExport(false)} disabled={loading}>
        <Download className="w-4 h-4 mr-2" /> All Data
      </Button>
    </div>
  );
};
