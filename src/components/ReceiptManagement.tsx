import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Receipt, FileText, DollarSign, Calendar, User, Mail } from 'lucide-react';
import EmailDialog from '@/components/EmailDialog';

interface Payment {
  id: number;
  tenant_id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  status: string;
}

interface Invoice {
  id: number;
  tenant_id: number;
  property_id: number;
  invoice_number: string;
  amount: number;
  status: string;
}

interface Tenant {
  id: number;
  tenant_name: string;
  email: string;
}

const ReceiptManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tenant_id: '',
    invoice_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  const paymentMethods = [
  'Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Online Payment', 'Money Order'];


  useEffect(() => {
    fetchPayments();
    fetchInvoices();
    fetchTenants();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view payments.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('26868', {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setPayments(data.List || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('26867', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userData.ID },
          { name: 'status', op: 'Equal', value: 'pending' }
        ]
      });
      if (error) throw error;
      setInvoices(data.List || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('26864', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userData.ID },
          { name: 'status', op: 'Equal', value: 'active' }
        ]
      });
      if (error) throw error;
      setTenants(data.List || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleCreatePayment = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await window.ezsite.apis.tableCreate('26868', {
        tenant_id: parseInt(formData.tenant_id),
        invoice_id: parseInt(formData.invoice_id),
        payment_date: new Date(formData.payment_date).toISOString(),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        notes: formData.notes,
        status: 'completed',
        user_id: userData.ID
      });

      if (error) throw error;

      // Update invoice status to paid
      const invoice = invoices.find((inv) => inv.id === parseInt(formData.invoice_id));
      if (invoice) {
        await window.ezsite.apis.tableUpdate('26867', {
          ID: invoice.id,
          ...invoice,
          status: 'paid'
        });
      }

      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });

      setIsCreateDialogOpen(false);
      setFormData({
        tenant_id: '',
        invoice_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: '',
        reference_number: '',
        notes: ''
      });
      fetchPayments();
      fetchInvoices();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      });
    }
  };

  const handleSendEmail = (payment: Payment) => {
    const tenant = tenants.find(t => t.id === payment.tenant_id);
    const invoice = invoices.find(i => i.id === payment.invoice_id);
    
    if (!tenant) {
      toast({
        title: 'Error',
        description: 'Tenant not found for this payment',
        variant: 'destructive'
      });
      return;
    }

    setSelectedPayment(payment);
    setSelectedTenant(tenant);
    setSelectedInvoice(invoice || null);
    setIsEmailDialogOpen(true);
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.tenant_name : 'Unknown';
  };

  const getInvoiceNumber = (invoiceId: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice ? invoice.invoice_number : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':return 'bg-green-100 text-green-800';
      case 'pending':return 'bg-yellow-100 text-yellow-800';
      case 'failed':return 'bg-red-100 text-red-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReceiptPDF = (payment: Payment) => {
    const tenant = tenants.find((t) => t.id === payment.tenant_id);
    const invoice = invoices.find((inv) => inv.id === payment.invoice_id);

    const receiptContent = `
      PAYMENT RECEIPT
      
      Receipt Number: RCP-${payment.id}
      Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}
      
      Received From:
      ${tenant ? tenant.tenant_name : 'Unknown Tenant'}
      ${tenant ? tenant.email : ''}
      
      Payment Details:
      Amount: $${payment.amount.toFixed(2)}
      Payment Method: ${payment.payment_method}
      Reference Number: ${payment.reference_number}
      
      For Invoice: ${invoice ? invoice.invoice_number : 'Unknown'}
      
      Notes: ${payment.notes}
      
      Status: ${payment.status.toUpperCase()}
      
      Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredInvoices = () => {
    if (!formData.tenant_id) return invoices;
    return invoices.filter((invoice) => invoice.tenant_id === parseInt(formData.tenant_id));
  };

  if (loading) {
    return <div className="p-6">Loading payments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Receipt Management</h1>
          <p className="text-gray-600">Record payments and generate receipts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value, invoice_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) =>
                      <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.tenant_name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice">Invoice</Label>
                  <Select value={formData.invoice_id} onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredInvoices().map((invoice) =>
                      <SelectItem key={invoice.id} value={invoice.id.toString()}>
                          {invoice.invoice_number} - ${invoice.amount.toFixed(2)}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />

                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />

                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) =>
                      <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="Check number, transaction ID, etc." />

                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the payment" />

              </div>
              <Button onClick={handleCreatePayment} className="w-full">
                Record Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) =>
        <Card key={payment.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Receipt #{payment.id}</h3>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tenant:</strong> {getTenantName(payment.tenant_id)}</p>
                    <p><strong>Amount:</strong> ${payment.amount.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> {payment.payment_method}</p>
                    <p><strong>Reference:</strong> {payment.reference_number}</p>
                    <p><strong>Date:</strong> {new Date(payment.payment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(payment)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReceiptPDF(payment)}>

                    <FileText className="h-4 w-4 mr-1" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Email Dialog */}
      {selectedPayment && selectedTenant && (
        <EmailDialog
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          type="receipt"
          data={selectedPayment}
          tenant={selectedTenant}
          invoice={selectedInvoice}
        />
      )}

      {payments.length === 0 &&
      <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments recorded yet</h3>
            <p className="text-gray-600 mb-4">Start by recording your first payment</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record First Payment
            </Button>
          </CardContent>
        </Card>
      }
    </div>);

};

export default ReceiptManagement;