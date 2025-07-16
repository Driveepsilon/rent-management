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
import { Plus, Edit, Eye, FileText, Calendar, DollarSign, AlertCircle, Mail, Download } from 'lucide-react';
import { numberToWords } from '@/utils/numberToWords';
import EmailDialog from '@/components/EmailDialog';
import { pdfGenerator } from '@/utils/pdfGenerator';

interface Invoice {
  id: number;
  tenant_id: number;
  property_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  description: string;
  status: string;
  late_fee: number;
  rent_period: string;
  rent_months: number;
  bank_information: string;
  amount_in_letters: string;
}

interface Tenant {
  id: number;
  tenant_name: string;
  email: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  monthly_rent: number;
}

const InvoiceManagementWithPDF: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: '',
    late_fee: '0',
    rent_period: '',
    rent_months: '1',
    bank_information: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchTenants();
    fetchProperties();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view invoices.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('26867', {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setInvoices(data.List || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
        { name: 'status', op: 'Equal', value: 'active' }]

      });
      if (error) throw error;
      setTenants(data.List || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) return;

      const { data, error } = await window.ezsite.apis.tablePage('26865', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setProperties(data.List || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleCreateInvoice = async () => {
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

      const invoiceNumber = `INV-${Date.now()}`;
      const amount = parseFloat(formData.amount);
      const amountInLetters = numberToWords(amount);

      const { error } = await window.ezsite.apis.tableCreate('26867', {
        tenant_id: parseInt(formData.tenant_id),
        property_id: parseInt(formData.property_id),
        invoice_number: invoiceNumber,
        invoice_date: new Date(formData.invoice_date).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        amount: amount,
        description: formData.description,
        late_fee: parseFloat(formData.late_fee),
        rent_period: formData.rent_period,
        rent_months: parseInt(formData.rent_months),
        bank_information: formData.bank_information,
        amount_in_letters: amountInLetters,
        status: 'pending',
        user_id: userData.ID
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      });

      setIsCreateDialogOpen(false);
      setFormData({
        tenant_id: '',
        property_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        amount: '',
        description: '',
        late_fee: '0',
        rent_period: '',
        rent_months: '1',
        bank_information: ''
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async (invoice: Invoice, newStatus: string) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate('26867', {
        ID: invoice.id,
        ...invoice,
        status: newStatus
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice status updated successfully'
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      });
    }
  };

  const handleSendEmail = (invoice: Invoice) => {
    const tenant = tenants.find((t) => t.id === invoice.tenant_id);
    const property = properties.find((p) => p.id === invoice.property_id);

    if (!tenant) {
      toast({
        title: 'Error',
        description: 'Tenant not found for this invoice',
        variant: 'destructive'
      });
      return;
    }

    if (!property) {
      toast({
        title: 'Error',
        description: 'Property not found for this invoice',
        variant: 'destructive'
      });
      return;
    }

    setSelectedInvoice(invoice);
    setSelectedTenant(tenant);
    setSelectedProperty(property);
    setIsEmailDialogOpen(true);
  };

  const generateInvoicePDF = (invoice: Invoice) => {
    const tenant = tenants.find((t) => t.id === invoice.tenant_id);
    const property = properties.find((p) => p.id === invoice.property_id);

    if (!tenant || !property) {
      toast({
        title: "Error",
        description: "Missing tenant or property information",
        variant: "destructive"
      });
      return;
    }

    try {
      pdfGenerator.generateInvoicePDF(invoice, tenant, property);
      toast({
        title: "PDF Generated",
        description: "Invoice PDF has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.tenant_name : 'Unknown';
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':return 'bg-green-100 text-green-800';
      case 'pending':return 'bg-yellow-100 text-yellow-800';
      case 'overdue':return 'bg-red-100 text-red-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAmountChange = (value: string) => {
    setFormData({ ...formData, amount: value });
  };

  const getCurrentAmountInWords = () => {
    const amount = parseFloat(formData.amount);
    return isNaN(amount) ? '' : numberToWords(amount);
  };

  if (loading) {
    return <div className="p-6">Loading invoices...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-gray-600">Create and manage invoices for your tenants</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}>
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
                  <Label htmlFor="property">Property</Label>
                  <Select value={formData.property_id} onValueChange={(value) => setFormData({ ...formData, property_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) =>
                      <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} />

                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />

                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rent_period">Rent Period</Label>
                  <Input
                    id="rent_period"
                    value={formData.rent_period}
                    onChange={(e) => setFormData({ ...formData, rent_period: e.target.value })}
                    placeholder="e.g., January 2024" />

                </div>
                <div>
                  <Label htmlFor="rent_months">Number of Rent Months</Label>
                  <Input
                    id="rent_months"
                    type="number"
                    min="1"
                    value={formData.rent_months}
                    onChange={(e) => setFormData({ ...formData, rent_months: e.target.value })} />

                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)} />

                  {formData.amount &&
                  <p className="text-xs text-gray-500 mt-1">
                      In words: {getCurrentAmountInWords()}
                    </p>
                  }
                </div>
                <div>
                  <Label htmlFor="late_fee">Late Fee</Label>
                  <Input
                    id="late_fee"
                    type="number"
                    step="0.01"
                    value={formData.late_fee}
                    onChange={(e) => setFormData({ ...formData, late_fee: e.target.value })} />

                </div>
              </div>
              <div>
                <Label htmlFor="bank_information">Bank Information</Label>
                <Textarea
                  id="bank_information"
                  value={formData.bank_information}
                  onChange={(e) => setFormData({ ...formData, bank_information: e.target.value })}
                  placeholder="Bank name, account number, routing number, etc."
                  rows={3} />

              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter invoice description" />

              </div>
              <Button onClick={handleCreateInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) =>
        <Card key={invoice.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{invoice.invoice_number}</h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tenant:</strong> {getTenantName(invoice.tenant_id)}</p>
                    <p><strong>Property:</strong> {getPropertyName(invoice.property_id)}</p>
                    <p><strong>Rent Period:</strong> {invoice.rent_period}</p>
                    <p><strong>Rent Months:</strong> {invoice.rent_months}</p>
                    <p><strong>Amount:</strong> ${invoice.amount.toFixed(2)}</p>
                    <p><strong>Amount in Letters:</strong> {invoice.amount_in_letters}</p>
                    <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendEmail(invoice)}>

                    <Mail className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsViewDialogOpen(true);
                  }}>

                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateInvoicePDF(invoice)}>

                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                  {invoice.status === 'pending' &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(invoice, 'paid')}>

                      Mark Paid
                    </Button>
                }
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedInvoice &&
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <p className="font-mono text-sm">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tenant</Label>
                  <p>{getTenantName(selectedInvoice.tenant_id)}</p>
                </div>
                <div>
                  <Label>Property</Label>
                  <p>{getPropertyName(selectedInvoice.property_id)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Date</Label>
                  <p>{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p>{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rent Period</Label>
                  <p>{selectedInvoice.rent_period}</p>
                </div>
                <div>
                  <Label>Number of Rent Months</Label>
                  <p>{selectedInvoice.rent_months}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="text-lg font-semibold">${selectedInvoice.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Late Fee</Label>
                  <p className="text-lg font-semibold">${selectedInvoice.late_fee.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label>Amount in Letters</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedInvoice.amount_in_letters}</p>
              </div>
              <div>
                <Label>Bank Information</Label>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-sm whitespace-pre-wrap">{selectedInvoice.bank_information}</pre>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedInvoice.description}</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Total Amount</Label>
                  <p className="text-xl font-bold">${(selectedInvoice.amount + selectedInvoice.late_fee).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }

      {/* Email Dialog */}
      {selectedInvoice && selectedTenant && selectedProperty &&
      <EmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        type="invoice"
        data={selectedInvoice}
        tenant={selectedTenant}
        property={selectedProperty} />

      }

      {invoices.length === 0 &&
      <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Invoice
            </Button>
          </CardContent>
        </Card>
      }
    </div>);

};

export default InvoiceManagementWithPDF;