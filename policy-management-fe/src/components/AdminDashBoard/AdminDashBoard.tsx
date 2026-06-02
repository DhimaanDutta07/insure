/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Calendar from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import axios from 'axios';

// Type definitions
interface DailyOrder {
  date: string;
  displayDate: string;
  orders: number;
}

interface OrderAnalytics {
  dailyOrders: DailyOrder[];
  summary: {
    totalOrders: number;
    averageOrders: number;
    peakOrders: number;
  };
}

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  const [analytics, setAnalytics] = useState<OrderAnalytics>({
    dailyOrders: [],
    summary: {
      totalOrders: 0,
      averageOrders: 0,
      peakOrders: 0
    }
  });
  
  const [loading, setLoading] = useState(false);

  // Function to fetch data from the API
  const fetchOrderAnalytics = async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const fromStr = from.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const toStr = to.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-orders/analytics?from=${fromStr}&to=${toStr}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      if (response.data && response.data.data) {
        // Format the data for the chart
        const formattedData = response.data.data.dailyOrders.map((day: DailyOrder) => ({
          ...day,
          date: day.displayDate // Use the display date for the chart
        }));
        
        setAnalytics({
          dailyOrders: formattedData,
          summary: response.data.data.summary
        });
      }
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      // You could add error handling/notification here
    } finally {
      setLoading(false);
    }
  };

  const handlePresetFilter = (days: number) => {
    const to = new Date();
    const from = subDays(to, days - 1);
    setDateRange({ from, to });
    
    if (from && to) {
      console.log(from, to)
      fetchOrderAnalytics(from, to);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchOrderAnalytics(dateRange.from, dateRange.to);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Analytics</h1>
      </div>

      {/* Main Content Section - Side by Side Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart Section */}
        <Card className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Daily Orders</CardTitle>
              <div className="flex items-center gap-4">
                {/* Preset Filters */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePresetFilter(1)}
                    className="text-sm border-gray-300 px-3 py-1 h-8"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handlePresetFilter(7)}
                    className="text-sm border-gray-300 px-3 py-1 h-8"
                  >
                    Last 7 days
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handlePresetFilter(30)}
                    className="text-sm border-gray-300 px-3 py-1 h-8"
                  >
                    Last 30 days
                  </Button>
                </div>

                {/* Custom Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="text-sm border-gray-300 px-3 py-1 h-8"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd,")} -{" "}
                            {format(dateRange.to, "LLL dd,")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from || null}
                      selected={dateRange}
                      onSelect={(range: any) => {
                        setDateRange(range || { from: null, to: null });
                        if (range?.from && range?.to) {
                          fetchOrderAnalytics(range.from, range.to);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  Loading data...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyOrders}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="orders" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - Stacked Vertically on Right Side */}
        <div className="flex flex-col gap-8 w-full lg:w-1/3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.summary.totalOrders}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Orders/Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.summary.averageOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Peak Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.summary.peakOrders}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;