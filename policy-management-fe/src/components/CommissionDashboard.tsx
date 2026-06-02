import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { formatDate } from "./dateFormatter";

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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{stats.totalCommission.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalPolicies}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.commissionByPolicyName.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.commissionByCompany.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission by Product */}
      <Card>
        <CardHeader>
          <CardTitle>Commission by Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.commissionByPolicyName.map((item) => (
              <div key={item.policyNameId} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm text-gray-600">{item.policyName}</span>
                  <span className="text-xs text-gray-400 ml-2">({item.policyCount} policies)</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{item.totalCommission.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission by Company */}
      <Card>
        <CardHeader>
          <CardTitle>Commission by Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.commissionByCompany.map((item) => (
              <div key={item.companyId} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm text-gray-600">{item.companyName}</span>
                  <span className="text-xs text-gray-400 ml-2">({item.policyCount} policies)</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{item.totalCommission.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission by Month */}
      <Card>
        <CardHeader>
          <CardTitle>Commission by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.monthlyCommission.map((item) => {
              const month = new Date(item.month as string);
              const monthName = month.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
              return (
                <div key={item.month} className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">{monthName}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.policy_count} policies)</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{Number(item.total_commission).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDashboard;
