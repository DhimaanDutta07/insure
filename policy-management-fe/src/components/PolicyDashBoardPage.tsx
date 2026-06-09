import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "../Context/AuthContext";
import { usePrefetchAll } from "../hooks/useApi";
import { Filter, X } from "lucide-react";
// Date utility functions
const formatDate = (date: Date, formatStr: string) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  if (formatStr === 'yyyy-MM') {
    return `${year}-${month}`;
  }
  return date.toISOString().slice(0, 7);
};

const subMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};
import { TrendingUp, Users, FileText, IndianRupee, Shield,Calendar, Building2 } from 'lucide-react';

// Azia color palette - Fuschian and Aquamarine Blue against White
const COLORS = [
  "#6F42C1", // Primary Fuschian
  "#007BFF", // Primary Aquamarine Blue
  "#00CCCC", // Supporting Cyan
  "#0DCAF0", // Supporting Light Blue
  "#17A2B8", // Supporting Teal
  "#6F42C1", // Fuschian repeat for variety
  "#007BFF", // Blue repeat for variety
  "#00CCCC", // Cyan repeat
  "#0DCAF0", // Light blue repeat
  "#17A2B8", // Teal repeat
];

const CHART_COLORS = {
  primary: "#6F42C1", // Fuschian
  secondary: "#007BFF", // Aquamarine Blue
  accent: "#00CCCC", // Supporting Cyan
  success: "#17A2B8", // Supporting Teal
  warning: "#0DCAF0", // Supporting Light Blue
  danger: "#DC3545",
};

const TIME_RANGES = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "24 Days", value: "24d" },
  { label: "30 Days", value: "30d" },
  { label: "1 Year", value: "1y" },
];

interface PolicyTypeDistributionItem {
  type: string;
  count: number;
}



const getLast12Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    months.push({
      label: formatDate(d, 'yyyy-MM'),
      value: formatDate(d, 'yyyy-MM'),
    });
  }
  return months.reverse();
};

function PolicyDashBoardPage() {
  const { user, role } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sessionStartTime] = useState(() => {
    const stored = localStorage.getItem("sessionStartTime");
    if (stored) return new Date(stored);
    const now = new Date();
    localStorage.setItem("sessionStartTime", now.toISOString());
    return now;
  });

  // Preload reference data on mount for instant navigation
  const prefetchAll = usePrefetchAll();
  useEffect(() => {
    prefetchAll();
  }, [prefetchAll]);

  // React Query: dashboard stats with auto-caching
  const { data: statsData, isLoading: loading, error } = useQuery({
    queryKey: ["dashboardStats", timeRange, selectedMonth, selectedCompany, selectedPolicyType],
    queryFn: async () => {
      const params = new URLSearchParams({ timeRange });
      if (selectedMonth && selectedMonth !== "all") params.append("month", selectedMonth);
      if (selectedCompany && selectedCompany !== "all") params.append("company", selectedCompany);
      if (selectedPolicyType && selectedPolicyType !== "all") params.append("policyType", selectedPolicyType);
      const res = await api.get(`/api/v1/policies/dashboard-stats?${params}`);
      return res.data.data;
    },
    staleTime: 30_000,
    enabled: role?.role_name === "ADMIN",
    placeholderData: (prev: any) => prev,
  });

  const stats = statsData || {
    totalActive: 0, totalRenewal: 0, companyDistribution: [],
    policyTypeDistribution: [], premiumStats: { total: 0, average: 0, min: 0, max: 0 },
    sumInsuredStats: { total: 0, average: 0, min: 0, max: 0 },
    monthlyTrend: [], planTypeDistribution: [], genderDistribution: [],
    ageGroupDistribution: [], topCompaniesByPremium: [],
  };

  // React Query: today's policies for operations
  const { data: policiesCreatedToday = 0 } = useQuery({
    queryKey: ["policiesToday"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get(`/api/v1/policies?created_after=${today}`);
      return res.data.data?.length || 0;
    },
    staleTime: 60_000,
    enabled: role?.role_name !== "ADMIN",
  });

  const timeWorked = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - sessionStartTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: diffHours, minutes: diffMinutes };
  }, [sessionStartTime]);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  interface TooltipPayloadItem {
    name: string;
    value: number;
    color: string;
  }
  
  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }
  
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg min-w-[150px]">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('premium') ? 
                formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // UI Components
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );

  const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 pb-4 ${className || ''}`}>
      {children}
    </div>
  );

  const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`text-xl font-bold text-gray-900 ${className || ''}`}>
      {children}
    </h3>
  );

  const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`px-6 pb-6 ${className}`}>
      {children}
    </div>
  );

  // TimeRangeSelect Component
  const TimeRangeSelect = ({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) => {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="px-3 py-1 text-left bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 transition-colors duration-200">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const MonthSelect = ({ value, onValueChange }: { value: string, onValueChange: (value: string) => void }) => {
    const months = getLast12Months();

    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className=" w-[120px] px-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 transition-colors duration-200">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((month: { label: string; value: string }) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, loading }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    loading: boolean;
  }) => (
    <Card className="overflow-hidden hover:scale-105 transition-transform duration-200 cursor-default">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-600 mb-1 leading-tight">{title}</p>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
              {loading ? <Skeleton className="w-20 h-6 sm:h-7 lg:h-8" /> : value}
            </div>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );





  const filteredPolicyTypeDistribution = ((stats.policyTypeDistribution ?? []) as PolicyTypeDistributionItem[]).filter(pt => pt.count > 0);

  return (
    <div className="min-h-screen ">
      <div className="w-full max-w-screen-2xl mx-auto p-2 sm:p-2 lg:p-2">
        {/* Header with Welcome Banner */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome, {user?.name || (role?.role_name === 'ADMIN' ? 'Admin' : 'User')}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {role?.role_name === 'ADMIN'
                  ? "Here's your policy management dashboard"
                  : "Here's your work summary for today"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-700">
                {role?.role_name || 'User'}
              </div>
            </div>
          </div>
        </div>

        {/* Header controls with filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-4 lg:mb-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dashboard Overview
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {role?.role_name === 'ADMIN' && (
              <>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(selectedCompany !== 'all' || selectedPolicyType !== 'all') && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </button>
                <div className="w-[120px] flex-shrink-0">
                  <TimeRangeSelect value={timeRange} onValueChange={setTimeRange} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && role?.role_name === 'ADMIN' && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 lg:mb-8 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {stats.companyDistribution?.map((company: any) => (
                      <SelectItem key={company.company} value={company.company}>
                        {company.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Policy Type</label>
                <Select value={selectedPolicyType} onValueChange={setSelectedPolicyType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {stats.policyTypeDistribution?.map((type: any) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSelectedCompany('all');
                    setSelectedPolicyType('all');
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operations User Dashboard - Show time worked and simple stats */}
        {role?.role_name !== 'ADMIN' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="Time Worked Today"
              value={`${timeWorked.hours}h ${timeWorked.minutes}m`}
              icon={Calendar}
              loading={false}
            />
            <StatCard
              title="Policies Created Today"
              value={policiesCreatedToday}
              icon={FileText}
              loading={false}
            />
            <StatCard
              title="Session Started"
              value={sessionStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              icon={TrendingUp}
              loading={false}
            />
            <StatCard
              title="Current Status"
              value="Active"
              icon={Users}
              loading={false}
            />
          </div>
        )}

        {/* Admin Dashboard - Show full stats */}
        {role?.role_name === 'ADMIN' && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  <div>
                    <strong className="font-semibold">Error:</strong> {error.message}
                  </div>
                </div>
              </div>
            )}

            {/* Key Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <StatCard
                title="Total Active Policies"
                value={formatNumber(stats.totalActive ?? 0)}
                icon={FileText}
                loading={loading}
              />
              <StatCard
                title="Renewal Policies"
                value={formatNumber(stats.totalRenewal ?? 0)}
                icon={Calendar}
                loading={loading}
              />
              <StatCard
                title="Total Premium"
                value={formatCurrency(stats.premiumStats?.total ?? 0)}
                icon={IndianRupee}
                loading={loading}
              />
              <StatCard
                title="Total Sum Insured"
                value={formatCurrency(stats.sumInsuredStats?.total ?? 0)}
                icon={Shield}
                loading={loading}
              />
            </div>

        {/* Monthly Trend - Full Width */}
        <Card className="mb-6 lg:mb-8">
            <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Monthly Policy Trend</CardTitle>
              <div className="flex-shrink-0">
                <MonthSelect value={selectedMonth} onValueChange={setSelectedMonth} />
              </div>
              </div>
            </CardHeader>
          <CardContent className="h-64 sm:h-80">
              {loading ? <Skeleton className="w-full h-full" /> : (
                stats.monthlyTrend && Array.isArray(stats.monthlyTrend) && stats.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={
                        selectedMonth && selectedMonth !== 'all' 
                          ? stats.monthlyTrend.filter((mt: any) => mt.month === selectedMonth)
                          : stats.monthlyTrend
                      } 
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
                      <XAxis 
                        dataKey="month" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={12}
                      tick={{ fill: '#6B7280' }}
                        tickFormatter={(value) => {
                          const date = new Date(value + '-01');
                          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        }}
                      />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={12} tick={{ fill: '#6B7280' }}/>
                      <Tooltip 
                        content={<CustomTooltip />}
                        labelFormatter={(value) => {
                          const date = new Date(value + '-01');
                          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Policies" 
                        stroke={CHART_COLORS.primary} 
                        strokeWidth={3} 
                      dot={{ r: 6, strokeWidth: 2, fill: 'transparent', stroke: CHART_COLORS.primary }} 
                      activeDot={{ r: 8, stroke: CHART_COLORS.primary, strokeWidth: 3, fill: 'transparent' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No trend data available</p>
                    <p className="text-sm">Data will appear when policies are created</p>
                  </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Company Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Policies by Company
              </CardTitle>
            </CardHeader>

  <CardContent className="h-72 sm:h-80 sm:pt-4 pb-6">
    {loading ? (
      <Skeleton className="w-full h-full" />
    ) : stats.companyDistribution && stats.companyDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 0, bottom: 10, left: 0 }}>
                      <Pie
                        data={stats.companyDistribution}
                        dataKey="count"
                        nameKey="company"
                        cx="50%"
                        cy="50%"
  outerRadius="85%"
  labelLine={({ cx, cy, midAngle, outerRadius }) => {
    const RADIAN = Math.PI / 180;
    const startX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const midX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const midY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const endX = midX + (midX > cx ? 30 : -30);
    const endY = midY;

    return (
      <path
        d={`M${startX},${startY} L${midX},${midY} L${endX},${endY}`}
        stroke="#888"
        fill="none"
      />
    );
  }}
  label={({ cx, cy, midAngle, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const midX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const midY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const x = midX + (midX > cx ? 32 : -32);
    const y = midY;
    const company = stats.companyDistribution[index]?.company || "";
    const percentage = (percent * 100).toFixed(0);
  
    const maxLineLength = 14;
    const labelLines = [];
  
    for (let i = 0; i < company.length; i += maxLineLength) {
      labelLines.push(company.substring(i, i + maxLineLength));
    }
  
    const firstLine = labelLines[0] || "";
    const secondLine = labelLines[1] || "";
  
    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-[11px] font-medium"
      >
        {firstLine && <tspan x={x} dy="-0.6em">{firstLine}</tspan>}
        {secondLine && <tspan x={x} dy="1.2em">{secondLine}</tspan>}
        <tspan x={x} dy={secondLine ? "1.2em" : "1.2em"}>{`(${percentage}%)`}</tspan>
      </text>
    );
  }}
  
  
                      >
                        {stats.companyDistribution.map((_entry: any, idx: number) => (
    <Cell
      key={`cell-${idx}`}
      fill={COLORS[idx % COLORS.length]}
      className="focus:outline-none hover:opacity-80 transition-opacity"
    />
                        ))}
                      </Pie>

                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        iconSize={10} 
            wrapperStyle={{ paddingTop: "16px", fontSize: "12px"  }}
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No company data</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>


          {/* Policy Type Distribution */}
          <Card>
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
      <FileText className="w-5 h-5 text-blue-600" />
      Policies by Type
    </CardTitle>
  </CardHeader>

  <CardContent className="h-64 sm:h-80 px-4 pt-2 pb-4">
    {loading ? (
      <Skeleton className="w-full h-full" />
    ) : filteredPolicyTypeDistribution && filteredPolicyTypeDistribution.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filteredPolicyTypeDistribution}
          margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="type"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
            tickMargin={10}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(111, 66, 193, 0.05)' }}
          />
          <Bar
            dataKey="count"
            name="Count"
            fill={CHART_COLORS.primary}
            radius={[8, 8, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium">No policy type data</p>
        </div>
      </div>
    )}
  </CardContent>
</Card>


          {/* Gender Distribution */}
          {/* Gender Distribution */}
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                Gender Distribution
              </CardTitle>
            </CardHeader>
  <CardContent className="h-[300px] sm:h-[300px]">
    {loading ? (
      <Skeleton className="w-full h-full" />
    ) : stats.genderDistribution && stats.genderDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genderDistribution}
                        dataKey="count"
                        nameKey="gender"
                        cx="50%"
                        cy="50%"
  outerRadius="70%"
  labelLine={({ cx, cy, midAngle, outerRadius }) => {
    const RADIAN = Math.PI / 180;
    const startX = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const startY = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const midX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const midY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const endX = midX + (midX > cx ? 30 : -30);
    const endY = midY;

    return (
      <path
        d={`M${startX},${startY} L${midX},${midY} L${endX},${endY}`}
        stroke="#888"
        fill="none"
      />
    );
  }}
  label={({ cx, cy, midAngle, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const midX = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const midY = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
    const x = midX + (midX > cx ? 32 : -32);
    const y = midY;

    const gender = stats.genderDistribution[index]?.gender;

    return (
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${gender ?? ""} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }}
                      >
                        {stats.genderDistribution.map((_entry: any, idx: number) => (
    <Cell
      key={`cell-${idx}`}
      fill={COLORS[idx % COLORS.length]}
      className="focus:outline-none hover:opacity-80 transition-opacity"
    />
                        ))}
                      </Pie>

                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        iconSize={10} 
            wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No gender data</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>


          {/* Age Group Distribution */}
          <Card>
  <CardHeader className="pb-2">
    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Age Group Distribution
              </CardTitle>
            </CardHeader>

  <CardContent className="h-72 sm:h-80 px-4 pt-2 pb-4">
    {loading ? (
      <Skeleton className="w-full h-full" />
    ) : stats.ageGroupDistribution && stats.ageGroupDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stats.ageGroupDistribution}
          margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="ageGroup" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#6B7280' }}
            tickMargin={10}
                      />
          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
            tickMargin={10}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 204, 204, 0.05)' }}
          />
                      <Bar 
                        dataKey="count" 
                        name="Count" 
                        fill={CHART_COLORS.accent} 
                        radius={[8, 8, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No age group data</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

        </div>

        {/* Top Companies by Premium - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-teal-600" />
              Top Companies by Premium Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-80 ">
            {loading ? <Skeleton className="w-full h-full" /> : (
              stats.topCompaniesByPremium && stats.topCompaniesByPremium.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={stats.topCompaniesByPremium} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false}/>
                    <XAxis 
                      type="number" 
                      fontSize={12} 
                      tickFormatter={(value) => `₹${Number(value) / 100000}L`} 
                      tickLine={false} 
                      axisLine={false}
                      tickMargin={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="company" 
                      width={100} 
                      fontSize={12}
                      tickMargin={12} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(23, 162, 184, 0.05)'}}/>
                    <Bar 
                      dataKey="totalPremium" 
                      name="Total Premium" 
                      fill={CHART_COLORS.success} 
                      radius={[0, 8, 8, 0]} 
                      barSize={25} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No premium data available</p>
                    <p className="text-sm">Data will appear when premiums are recorded</p>
                  </div>
                </div>
              )
              )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default PolicyDashBoardPage;

