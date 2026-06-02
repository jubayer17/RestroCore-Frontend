import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { timePeriodOptions, type TimePeriod } from './time-period';

interface TimePeriodSelectProps {
  value: TimePeriod;
  onChange: (v: TimePeriod) => void;
  className?: string;
}

export const TimePeriodSelect: React.FC<TimePeriodSelectProps> = ({ value, onChange, className }) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
      <SelectTrigger className={cn('h-9 w-[132px] text-xs bg-muted/10 border-border/50', className)}>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder="Period" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {timePeriodOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
