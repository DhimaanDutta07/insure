import Calendar from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from './calendar';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
}

export const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value[0] ? (
            value[1] ? (
              <>
                {format(value[0], 'PPP')} - {format(value[1], 'PPP')}
              </>
            ) : (
              format(value[0], 'PPP')
            )
          ) : (
            'Pick a date range'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value[0] ?? null}
          selected={{
            from: value[0] ?? null,
            to: value[1] ?? null,
          }}
          onSelect={(range: DateRange | null) => onChange([range?.from ?? null, range?.to ?? null])}
        />
      </PopoverContent>
    </Popover>
  );
};
