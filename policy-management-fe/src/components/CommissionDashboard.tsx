import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { IndianRupee, FileText, Building2, TrendingUp } from 'lucide-react';

const COLORS = [
  "#6F42C1", // Primary Fuschian
  "#007BFF", // Primary Aquamarine Blue
  "#00CCCC", // Supporting Cyan
  "#0DCAF0", // Supporting Light Blue
  "#17A2B8", // Supporting Teal
  "#6F42C1", // Fuschian repeat
  "#007BFF", // Blue repeat
  "#00CCCC", // Cyan repeat
  "#0DCAF0", // Light blue repeat
  "#17A2B8", // Teal repeat
];

interface CommissionStats {
  totalCommission: number;
  totalPolicies: number;
  commissionByCompany: Array<{ companyId: string; companyName: string; totalCommission: number; policyCount: number }>;
  commissionByPolicyName: Array<{ policyNameId: string; policyName: string; totalCommission: number; policyCount: number }>;
  monthlyCommission: Array<{ month: string; total_commission: number; policy_count: number }>;
  timeRange: string;
}

const CommissionDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = React.useState<'all' | '7d' | '30d' | '90d' | '1y'>('all');

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['commissionStats', timeRange],
    queryFn: async () => {
      const url = `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/dashboard/stats?timeRange=${timeRange}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      return res.data as CommissionStats;
    },
    staleTime: 30000, // Cache data for 30 seconds
    gcTime: 60000, // Keep in cache for 60 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to fetch commission statistics
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Commission Dashboard</h1>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Commission</CardTitle>
            <IndianRupee className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{stats.totalCommission.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalPolicies}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.commissionByPolicyName.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.commissionByCompany.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission by Product - Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Commission by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.commissionByPolicyName}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ policyName, percent }) => `${policyName}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalCommission"
                >
                  {stats.commissionByPolicyName.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission by Company - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commission by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.commissionByCompany}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="companyName" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="totalCommission" fill="#6F42C1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commission by Month - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Commission by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyCommission.map(item => ({
              month: new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
              commission: item.total_commission,
              policies: item.policy_count
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
              <Line type="monotone" dataKey="commission" stroke="#6F42C1" strokeWidth={2} name="Commission" />
              <Line type="monotone" dataKey="policies" stroke="#007BFF" strokeWidth={2} name="Policies" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDashboard;
