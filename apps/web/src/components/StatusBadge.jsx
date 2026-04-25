
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, PlayCircle, PauseCircle, CheckCircle2, HelpCircle } from 'lucide-react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) {
    return (
      <Badge className={`bg-muted text-muted-foreground ${className}`}>
        <HelpCircle className="w-3 h-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  const getStatusConfig = (statusString) => {
    switch (statusString?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-[hsl(var(--status-pending))] text-white hover:bg-[hsl(var(--status-pending))/0.9]', icon: Clock };
      case 'called':
        return { color: 'bg-[hsl(var(--status-called))] text-white hover:bg-[hsl(var(--status-called))/0.9]', icon: PlayCircle };
      case 'waiting':
        return { color: 'bg-[hsl(var(--status-waiting))] text-white hover:bg-[hsl(var(--status-waiting))/0.9]', icon: PauseCircle };
      case 'served':
        return { color: 'bg-[hsl(var(--status-served))] text-white hover:bg-[hsl(var(--status-served))/0.9]', icon: CheckCircle2 };
      default:
        return { color: 'bg-muted text-muted-foreground', icon: HelpCircle };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`badge-status shadow-sm ${config.color} ${className}`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};
