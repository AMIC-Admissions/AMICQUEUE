
import React from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext.jsx';

const TicketCard = React.memo(({ ticket, index, waitTimeStr }) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-primary/30 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center text-sm font-bold text-muted-foreground border border-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {index + 1}
        </div>
        <div>
          <p className="font-bold text-xl leading-none mb-1.5 text-foreground">{ticket.ticketNumber}</p>
          <p className="text-xs font-medium text-muted-foreground">
            {t.services[ticket.service] || ticket.service} 
            <span className="mx-2 opacity-50">•</span> 
            {t.branches[ticket.branch] || ticket.branch}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
        <Clock className="w-3.5 h-3.5" /> 
        <span className="font-variant-tabular">{waitTimeStr(ticket.created)}</span>
      </div>
    </div>
  );
});

TicketCard.displayName = 'TicketCard';

export default TicketCard;
