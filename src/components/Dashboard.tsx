
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building,
  FileText,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle } from
'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PaymentTrackingDashboard from '@/components/PaymentTrackingDashboard';
import EmailServiceStatus from '@/components/EmailServiceStatus';

interface DashboardStats {
  totalTenants: number;
  totalProperties: number;
  totalInvoices: number;
  totalPayments: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  occupiedProperties: number;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalProperties: 0,
    totalInvoices: 0,
    totalPayments: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    occupiedProperties: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get user info first
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view your dashboard.',
          variant: 'destructive'
        });
        return;
      }

      // Load stats from all tables
      const [tenantsRes, propertiesRes, invoicesRes, paymentsRes] = await Promise.all([
      window.ezsite.apis.tablePage(26864, { PageNo: 1, PageSize: 1000, Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }] }),
      window.ezsite.apis.tablePage(26865, { PageNo: 1, PageSize: 1000, Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }] }),
      window.ezsite.apis.tablePage(26867, { PageNo: 1, PageSize: 1000, Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }] }),
      window.ezsite.apis.tablePage(26868, { PageNo: 1, PageSize: 1000, Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }] })]
      );

      const tenants = tenantsRes.data?.List || [];
      const properties = propertiesRes.data?.List || [];
      const invoices = invoicesRes.data?.List || [];
      const payments = paymentsRes.data?.List || [];

      // Calculate stats
      const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;
      const overdueInvoices = invoices.filter((inv) => {
        const dueDate = new Date(inv.due_date);
        return inv.status === 'pending' && dueDate < new Date();
      }).length;
      const occupiedProperties = properties.filter((prop) => prop.status === 'occupied').length;
      const monthlyRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      setStats({
        totalTenants: tenants.length,
        totalProperties: properties.length,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        monthlyRevenue,
        pendingInvoices,
        overdueInvoices,
        occupiedProperties
      });

      // Set recent activities
      const activities = [
      ...payments.slice(-5).map((payment) => ({
        type: 'payment',
        description: `Payment received: $${payment.amount}`,
        date: payment.payment_date
      })),
      ...invoices.slice(-5).map((invoice) => ({
        type: 'invoice',
        description: `Invoice created: ${invoice.invoice_number}`,
        date: invoice.invoice_date
      }))].
      sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
  {
    title: 'Total Tenants',
    value: stats.totalTenants,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    title: 'Total Properties',
    value: stats.totalProperties,
    icon: Building,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Active Invoices',
    value: stats.totalInvoices,
    icon: FileText,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    title: 'Monthly Revenue',
    value: `$${stats.monthlyRevenue.toLocaleString()}`,
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }];


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) =>
          <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button asChild>
          <Link to="/tenants">Quick Add Tenant</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              </CardContent>
            </Card>);

        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="h-4 w-4 text-yellow-500 mr-2" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Occupied Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.occupiedProperties}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link to="/tenants">
                <Users className="h-6 w-6" />
                <span>Add Tenant</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link to="/properties">
                <Building className="h-6 w-6" />
                <span>Add Property</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link to="/invoices">
                <FileText className="h-6 w-6" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Link to="/receipts">
                <CreditCard className="h-6 w-6" />
                <span>Record Payment</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ?
          <p className="text-gray-500 text-center py-4">No recent activities</p> :

          <div className="space-y-3">
              {recentActivities.map((activity, index) =>
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
              activity.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'}`
              }>
                    {activity.type === 'payment' ?
                <CreditCard className="h-4 w-4 text-green-600" /> :

                <FileText className="h-4 w-4 text-blue-600" />
                }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {/* Payment Tracking Dashboard */}
      <PaymentTrackingDashboard />

      {/* Email Service Status */}
      <EmailServiceStatus />
    </div>);

};

export default Dashboard;