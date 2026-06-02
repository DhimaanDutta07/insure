import Calendar from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from './calendar';

interface DatePickerProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
}

export const DatePicker = ({ value, onChange, placeholder = "Pick a date" }: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="single"
          defaultMonth={value ?? null}
          selected={{
            from: value ?? null,
            to: null,
          }}
          onSelect={(range: DateRange | null) => onChange(range?.from ?? null)}
        />
      </PopoverContent>
    </Popover>
  );
}; 