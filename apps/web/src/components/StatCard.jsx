
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const StatCard = ({ title, value, icon: Icon, description }) => {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6 relative">
        <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Icon className="w-32 h-32" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-4xl font-black font-variant-tabular text-foreground mb-1">
          {value}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
