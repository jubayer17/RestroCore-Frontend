import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface DateRangeFilterProps {
  start: Date | null;
  end: Date | null;
  onApply: (nextStart: Date | null, nextEnd: Date | null) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ start, end, onApply }) => {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date | null>(start);
  const [draftTo, setDraftTo] = useState<Date | null>(end);

  useEffect(() => {
    if (open) return;
    setDraftFrom(start);
    setDraftTo(end);
  }, [open, start, end]);

  const clear = () => {
    setDraftFrom(null);
    setDraftTo(null);
    onApply(null, null);
    setOpen(false);
  };

  const apply = () => {
    if (!draftFrom) return;
    const nextStart = draftFrom;
    const nextEnd = draftTo ?? draftFrom;
    if (nextEnd.getTime() < nextStart.getTime()) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }
    onApply(nextStart, nextEnd);
    setOpen(false);
  };

  const label = (() => {
    if (!start) return "Order date";
    const safeEnd = end ?? start;
    const isSameYmd = (a: Date, b: Date) => 
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    
    if (isSameYmd(start, safeEnd)) return format(start, "MMM d, yyyy");
    return `${format(start, "MMM d, yyyy")} → ${format(safeEnd, "MMM d, yyyy")}`;
  })();

  const fromLabel = draftFrom ? format(draftFrom, "MMM d, yyyy") : "—";
  const toLabel = draftTo ? format(draftTo, "MMM d, yyyy") : draftFrom ? "Press Enter" : "—";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDraftFrom(start);
          setDraftTo(end);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full sm:w-auto justify-start gap-2" aria-label="Order date filter">
          <CalendarDays className="h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        role="dialog"
        aria-label="Order date calendar"
        align="start"
        className="w-auto p-3"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter") apply();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-sm font-medium truncate">{fromLabel}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground">To</p>
            <p className="text-sm font-medium truncate">{toLabel}</p>
          </div>
        </div>

        <div className="mt-2">
          <Calendar
            mode="range"
            selected={{ from: draftFrom ?? undefined, to: draftTo ?? undefined }}
            defaultMonth={draftFrom ?? start ?? new Date()}
            initialFocus
            onDayClick={(day) => {
              const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
              if (!draftFrom || (draftFrom && draftTo)) {
                setDraftFrom(d);
                setDraftTo(null);
                return;
              }
              const isSameYmd = (a: Date, b: Date) => 
                a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
              
              if (isSameYmd(d, draftFrom)) {
                setDraftFrom(d);
                setDraftTo(null);
                return;
              }
              if (d.getTime() < draftFrom.getTime()) {
                toast.error("End date cannot be earlier than start date.");
                return;
              }
              setDraftTo(d);
              onApply(draftFrom, d);
              setOpen(false);
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="ghost" className="h-8 px-2" onClick={clear} disabled={!start && !end}>
            Clear
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8"
              onClick={() => {
                setDraftFrom(start);
                setDraftTo(end);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button className="h-8" onClick={apply} disabled={!draftFrom}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
