import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

interface TimePeriodFilterProps {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const TimePeriodFilter = ({
  timePeriod,
  onTimePeriodChange,
  onRefresh,
  loading = false
}: TimePeriodFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Select value={timePeriod} onValueChange={onTimePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent className="border-gray-300">
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onRefresh} 
        disabled={loading}
        className="h-10 w-10 border-gray-300 text-gray-500 cursor-pointer"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}; 