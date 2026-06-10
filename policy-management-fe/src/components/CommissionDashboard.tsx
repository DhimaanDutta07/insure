import React, { useState } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";

import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { Button } from "./ui/button";

import { Input } from "./ui/input";

import { Label } from "./ui/label";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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

import { IndianRupee, FileText, TrendingUp, Plus, Trash2, Building2 } from 'lucide-react';

import { toast } from "sonner";



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

  totalTaxPaid: number;

  avgCommissionRate: number;

  commissionByCompany: Array<{ companyId: string; companyName: string; totalCommission: number; policyCount: number }>;

  commissionByPolicyName: Array<{ policyNameId: string; policyName: string; totalCommission: number; policyCount: number }>;

  monthlyCommission: Array<{ month: string; total_commission: number; policy_count: number }>;

  timeRange: string;

}



const CommissionDashboard: React.FC = () => {

  const [timeRange, setTimeRange] = React.useState<'all' | '7d' | '30d' | '90d' | '1y' | 'year'>('all');

  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  const [showProductManagement, setShowProductManagement] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const [newProductName, setNewProductName] = useState('');

  const [newCommissionPercent, setNewCommissionPercent] = useState('10');



  // Fetch companies

  const { data: companies } = useQuery({

    queryKey: ['companies'],

    queryFn: async () => {

      const res = await axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/companies`, {

        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },

      });

      return res.data as { id: string; name: string }[];

    },

  });



  // Fetch all policy names (products)

  const { data: allPolicyNames, refetch: refetchPolicyNames } = useQuery({

    queryKey: ['allPolicyNames'],

    queryFn: async () => {

      const res = await axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-groups/policy-names/all`, {

        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },

      });

      return res.data as Array<{ id: string; name: string; company_id?: string; company?: { id: string; name: string } }>;

    },

  });



  // Add policy name mutation

  const addPolicyNameMutation = useMutation({

    mutationFn: async (data: { name: string; company_id: string; commission_percent: number }) => {

      const res = await axios.post(

        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names`,

        data,

        {

          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },

        }

      );

      return res.data;

    },

    onSuccess: () => {

      toast.success('Product added successfully');

      refetchPolicyNames();

      setNewProductName('');

      setNewCommissionPercent('10');

    },

    onError: (error: any) => {

      toast.error(error.response?.data?.error || 'Failed to add product');

    },

  });



  // Delete policy name mutation

  const deletePolicyNameMutation = useMutation({

    mutationFn: async (id: string) => {

      const res = await axios.delete(

        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names/${id}`,

        {

          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },

        }

      );

      return res.data;

    },

    onSuccess: () => {

      toast.success('Product deleted successfully');

      refetchPolicyNames();

    },

    onError: (error: any) => {

      toast.error(error.response?.data?.error || 'Failed to delete product');

    },

  });



  const handleAddProduct = () => {

    if (!selectedCompany || !newProductName.trim()) {

      toast.error('Please select a company and enter a product name');

      return;

    }

    addPolicyNameMutation.mutate({ 

      name: newProductName, 

      company_id: selectedCompany,

      commission_percent: parseFloat(newCommissionPercent) || 10

    });

  };



  const handleDeleteProduct = (id: string) => {

    if (confirm('Are you sure you want to delete this product?')) {

      deletePolicyNameMutation.mutate(id);

    }

  };



  // Filter products by selected company

  const filteredProducts = allPolicyNames?.filter(p => p.company_id === selectedCompany) || [];

  const [showProductManagement, setShowProductManagement] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [newProductName, setNewProductName] = useState('');
  const [newCommissionPercent, setNewCommissionPercent] = useState('10');

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/companies`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      return res.data as { id: string; name: string }[];
    },
  });

  // Fetch all policy names (products)
  const { data: allPolicyNames, refetch: refetchPolicyNames } = useQuery({
    queryKey: ['allPolicyNames'],
    queryFn: async () => {
      const res = await axios.get(`${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-groups/policy-names/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      return res.data as Array<{ id: string; name: string; company_id?: string; company?: { id: string; name: string } }>;
    },
  });

  // Add policy name mutation
  const addPolicyNameMutation = useMutation({
    mutationFn: async (data: { name: string; company_id: string; commission_percent: number }) => {
      const res = await axios.post(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names`,
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product added successfully');
      refetchPolicyNames();
      setNewProductName('');
      setNewCommissionPercent('10');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add product');
    },
  });

  // Delete policy name mutation
  const deletePolicyNameMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(
        `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/policy-names/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      refetchPolicyNames();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    },
  });

  const handleAddProduct = () => {
    if (!selectedCompany || !newProductName.trim()) {
      toast.error('Please select a company and enter a product name');
      return;
    }
    addPolicyNameMutation.mutate({ 
      name: newProductName, 
      company_id: selectedCompany,
      commission_percent: parseFloat(newCommissionPercent) || 10
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deletePolicyNameMutation.mutate(id);
    }
  };

  // Filter products by selected company
  const filteredProducts = allPolicyNames?.filter(p => p.company_id === selectedCompany) || [];


  const { data: stats, isLoading, error } = useQuery({

    queryKey: ['commissionStats', timeRange, selectedYear],

    queryFn: async () => {

      let url = `${(import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '')}/api/v1/commission-rules/dashboard/stats?timeRange=${timeRange}`;

      

      if (timeRange === 'year') {

        url += `&year=${selectedYear}`;

      }

      

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

        <div className="flex items-center gap-2">

          <Button

            variant="outline"

            onClick={() => setShowProductManagement(!showProductManagement)}

            className="flex items-center gap-2"

          >

            <Building2 className="w-4 h-4" />

            {showProductManagement ? 'Hide Products' : 'Manage Products'}

          </Button>

          <Button
            variant="outline"
            onClick={() => setShowProductManagement(!showProductManagement)}
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            {showProductManagement ? 'Hide Products' : 'Manage Products'}
          </Button>
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

              <SelectItem value="year">Specific Year</SelectItem>

            </SelectContent>

          </Select>

          

          {timeRange === 'year' && (

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>

              <SelectTrigger className="w-[120px]">

                <SelectValue placeholder="Year" />

              </SelectTrigger>

              <SelectContent>

                {Array.from({ length: 101 }, (_, i) => 2000 + i).reverse().map(year => (

                  <SelectItem key={year} value={year.toString()}>

                    {year}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          )}

        </div>

      </div>



      {/* Product Management Section */}

      {showProductManagement && (

        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <Building2 className="w-5 h-5" />

              Product Management

            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>

                <Label className="text-sm font-medium mb-1 block">Select Company</Label>

                <Select value={selectedCompany} onValueChange={setSelectedCompany}>

                  <SelectTrigger>

                    <SelectValue placeholder="Select company" />

                  </SelectTrigger>

                  <SelectContent>

                    {companies?.map((company) => (

                      <SelectItem key={company.id} value={company.id}>

                        {company.name}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div>

                <Label className="text-sm font-medium mb-1 block">New Product Name</Label>

                <Input

                  value={newProductName}

                  onChange={(e) => setNewProductName(e.target.value)}

                  placeholder="Enter product name"

                />

              </div>

              <div>

                <Label className="text-sm font-medium mb-1 block">Commission %</Label>

                <Input

                  type="number"

                  step="0.1"

                  min="0"

                  max="100"

                  value={newCommissionPercent}

                  onChange={(e) => setNewCommissionPercent(e.target.value)}

                  placeholder="10"

                />

              </div>

              <div className="flex items-end">

                <Button

                  onClick={handleAddProduct}

                  disabled={addPolicyNameMutation.isPending}

                  className="w-full"

                >

                  <Plus className="w-4 h-4 mr-2" />

                  Add Product

                </Button>

              </div>

            </div>



            {selectedCompany && (

              <div className="mt-4">

                <h3 className="text-sm font-semibold mb-2">

                  Products for {companies?.find(c => c.id === selectedCompany)?.name} ({filteredProducts.length})

                </h3>

                {filteredProducts.length === 0 ? (

                  <p className="text-sm text-gray-500">No products found for this company.</p>

                ) : (

                  <div className="space-y-2 max-h-60 overflow-y-auto">

                    {filteredProducts.map((product) => (

                      <div

                        key={product.id}

                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"

                      >

                        <span className="text-sm">{product.name}</span>

                        <Button

                          size="sm"

                          variant="ghost"

                          onClick={() => handleDeleteProduct(product.id)}

                          disabled={deletePolicyNameMutation.isPending}

                          className="text-red-600 hover:text-red-700 hover:bg-red-50"

                        >

                          <Trash2 className="w-4 h-4" />

                        </Button>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            )}

          </CardContent>

        </Card>

      )}


      {/* Product Management Section */}
      {showProductManagement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  refetchPolicyNames();
                  window.location.reload();
                }}
                variant="outline"
                className="text-sm"
              >
                Save & Refresh
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">Select Company</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">New Product Name</Label>
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Commission %</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newCommissionPercent}
                  onChange={(e) => setNewCommissionPercent(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddProduct}
                  disabled={addPolicyNameMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {selectedCompany && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">
                  Products for {companies?.find(c => c.id === selectedCompany)?.name} ({filteredProducts.length})
                </h3>
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No products found for this company.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <span className="text-sm">{product.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deletePolicyNameMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}


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

            <CardTitle className="text-sm font-medium text-gray-600">Total Tax Paid</CardTitle>

            <IndianRupee className="h-4 w-4 text-blue-600" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold text-gray-900">

              ₹{stats.totalTaxPaid.toLocaleString('en-IN')}

            </div>

          </CardContent>

        </Card>



        <Card className="border-l-4 border-l-cyan-600">

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium text-gray-600">Total Policies</CardTitle>

            <FileText className="h-4 w-4 text-cyan-600" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold text-gray-900">

              {stats.totalPolicies}

            </div>

          </CardContent>

        </Card>



        <Card className="border-l-4 border-l-teal-600">

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium text-gray-600">Avg Commission Rate</CardTitle>

            <TrendingUp className="h-4 w-4 text-teal-600" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold text-gray-900">

              {stats.avgCommissionRate.toFixed(2)}%

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

