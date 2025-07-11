import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface PaymentData {
  totalExpected: number;
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  recentPayments: any[];
  overdueInvoices: any[];
}

const PaymentTrackingDashboard: React.FC = () => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    totalExpected: 0,
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    collectionRate: 0,
    recentPayments: [],
    overdueInvoices: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      // Fetch all invoices
      const { data: invoicesData, error: invoicesError } = await window.ezsite.apis.tablePage(26867, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: "id",
        IsAsc: false,
        Filters: []
      });

      if (invoicesError) throw invoicesError;

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await window.ezsite.apis.tablePage(26868, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: "id",
        IsAsc: false,
        Filters: []
      });

      if (paymentsError) throw paymentsError;

      const invoices = invoicesData.List || [];
      const payments = paymentsData.List || [];

      // Calculate totals
      const totalExpected = invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0);
      const totalReceived = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      const pendingInvoices = invoices.filter((invoice: any) => invoice.status === 'pending');
      const pendingAmount = pendingInvoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

      // Calculate overdue invoices
      const currentDate = new Date();
      const overdueInvoices = invoices.filter((invoice: any) => {
        const dueDate = new Date(invoice.due_date);
        return invoice.status === 'pending' && dueDate < currentDate;
      });
      const overdueAmount = overdueInvoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0);

      const collectionRate = totalExpected > 0 ? totalReceived / totalExpected * 100 : 0;

      setPaymentData({
        totalExpected,
        totalReceived,
        pendingAmount,
        overdueAmount,
        collectionRate,
        recentPayments: payments.slice(0, 5),
        overdueInvoices: overdueInvoices.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading payment data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Tracking</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/invoices">View All Invoices</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/receipts">View All Receipts</Link>
          </Button>
        </div>
      </div>

      {/* Payment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expected</p>
                <p className="text-2xl font-bold">${paymentData.totalExpected.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-green-600">${paymentData.totalReceived.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${paymentData.pendingAmount.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-600">${paymentData.overdueAmount.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Collection Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Collection Rate</span>
              <span className="font-semibold">{paymentData.collectionRate.toFixed(1)}%</span>
            </div>
            <Progress value={paymentData.collectionRate} className="h-2" />
            <p className="text-xs text-gray-500">
              ${paymentData.totalReceived.toFixed(2)} collected out of ${paymentData.totalExpected.toFixed(2)} expected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments and Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.recentPayments.length === 0 ?
            <p className="text-gray-500 text-center py-4">No recent payments</p> :

            <div className="space-y-2">
                {paymentData.recentPayments.map((payment: any) =>
              <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{payment.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
              )}
              </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.overdueInvoices.length === 0 ?
            <p className="text-gray-500 text-center py-4">No overdue invoices</p> :

            <div className="space-y-2">
                {paymentData.overdueInvoices.map((invoice: any) =>
              <div key={invoice.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">${invoice.amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    </div>
                  </div>
              )}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default PaymentTrackingDashboard;