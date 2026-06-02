import React, { useState } from 'react';
import { format, isToday, isWithinInterval, subMonths, addMonths } from 'date-fns';
 
export interface DateRange {
  from: Date | null;
  to: Date | null;
}
 
interface CalendarProps {
  initialFocus?: boolean;
  mode?: "range" | "single";
  defaultMonth?: Date | null;
  selected?: DateRange;
  onSelect: (range: DateRange | null) => void;
}
 
const Calendar: React.FC<CalendarProps> = ({
  initialFocus = false,
  mode = "range",
  defaultMonth = null,
  selected = { from: null, to: null },
  onSelect,
}) => {
  const [focusedMonth, setFocusedMonth] = useState<Date>(defaultMonth || new Date());
 
  const isSelected = (date: Date) => {
    if (!selected?.from && !selected?.to) return false;
    if (selected?.from && !selected?.to) return format(selected.from, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    if (selected?.from && selected?.to) {
      return isWithinInterval(date, { start: selected.from, end: selected.to });
    }
    return false;
  };
 
  const isRangeStart = (date: Date) => {
    return selected?.from && format(selected.from, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  };
 
  const isRangeEnd = (date: Date) => {
    return selected?.to && format(selected.to, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  };
 
  const handleDateClick = (date: Date) => {
    if (mode === "single") {
      const newRange = { from: date, to: null };
      onSelect(newRange);
      return;
    }
    if (!selected?.from || (selected?.from && selected?.to)) {
      const newRange = { from: date, to: null };
      onSelect(newRange);
    } else {
      if (selected && date < selected.from) {
        const newRange = { from: date, to: selected.from };
        onSelect(newRange);
      } else {
        const newRange = { from: selected?.from, to: date };
        onSelect(newRange);
      }
    }
  };
 
  const generateMonthDays = (monthDate: Date) => {
    const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const firstDayToShow = new Date(firstDayOfMonth);
    firstDayToShow.setDate(firstDayToShow.getDate() - firstDayToShow.getDay());
    const days = [];
    const current = new Date(firstDayToShow);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };
 
  const handlePreviousMonth = () => {
    setFocusedMonth(prevMonth => subMonths(prevMonth, 1));
  };
 
  const handleNextMonth = () => {
    setFocusedMonth(prevMonth => addMonths(prevMonth, 1));
  };
 
  return (
    <div className="w-64 max-w-full mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Navigation Header */}
      <div className="flex justify-between items-center px-2 py-2 bg-gray-50 border-b">
        <button
          onClick={handlePreviousMonth}
          className="p-1 rounded-full hover:bg-blue-100 transition-colors"
          aria-label="Previous Month"
        >
          <span className="text-base font-bold">&#60;</span>
        </button>
        <div className="font-semibold text-gray-800 text-sm">
          {format(focusedMonth, 'MMMM yyyy')}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-full hover:bg-blue-100 transition-colors"
          aria-label="Next Month"
        >
          <span className="text-base font-bold">&#62;</span>
        </button>
      </div>
 
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0 bg-white px-2 pt-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[11px] font-semibold text-gray-400 pb-1">
            {day}
          </div>
        ))}
      </div>
 
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
        {generateMonthDays(focusedMonth).map((date, index) => {
          const isCurrentMonth = date.getMonth() === focusedMonth.getMonth();
          const selectedDate = isSelected(date);
          const rangeStart = isRangeStart(date);
          const rangeEnd = isRangeEnd(date);
          const today = isToday(date);
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative h-7 w-7 text-[12px] rounded-md transition-all
                ${!isCurrentMonth 
                  ? 'text-gray-300 hover:text-gray-400' 
                  : selectedDate
                    ? rangeStart || rangeEnd
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'bg-blue-100 text-blue-700 font-medium'
                    : today
                      ? 'bg-red-100 text-red-700 font-bold ring-2 ring-red-200'
                      : 'text-gray-700 hover:bg-gray-100'}
              `}
              tabIndex={initialFocus && index === 0 ? 0 : -1}
              aria-label={format(date, 'yyyy-MM-dd')}
            >
              {format(date, 'd')}
              {today && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-red-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
 
      {/* Selected Range Display */}
      <div className="px-2 py-2 bg-gray-50 border-t">
        <div className="text-xs text-gray-600 text-center">
          {selected?.from ? (
            <span className="font-medium">
              {format(selected.from, 'MMM dd, yyyy')}
              {selected.to && (
                <>
                  <span className="mx-1 text-gray-400">-</span>
                  {format(selected.to, 'MMM dd, yyyy')}
                </>
              )}
            </span>
          ) : (
            <span className="text-gray-400">Select dates</span>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Calendar;