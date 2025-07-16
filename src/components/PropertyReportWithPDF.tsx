import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, TrendingUp, TrendingDown, BarChart3, FileText, DollarSign, Mail, Send, Loader2, Download } from 'lucide-react';
import { pdfGenerator } from '@/utils/pdfGenerator';

interface Property {
  id: number;
  name: string;
  address: string;
  monthly_rent: number;
}

interface Owner {
  id: number;
  owner_name: string;
  email: string;
  type_of_owner: string;
  property_id: number;
}

interface Invoice {
  id: number;
  property_id: number;
  amount: number;
  invoice_date: string;
  status: string;
  description: string;
}

interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  status: string;
}

interface Expense {
  id: number;
  property_id: number;
  amount: number;
  expense_date: string;
  category: string;
  description: string;
}

interface TransactionItem {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  balance: number;
}

const PropertyReportWithPDF: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reportData, setReportData] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0
  });
  const [emailDialog, setEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    customMessage: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
    fetchOwners();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(26865, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'name',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;
      setProperties(data.List || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch properties",
        variant: "destructive"
      });
    }
  };

  const fetchOwners = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(28844, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'owner_name',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;
      setOwners(data.List || []);
    } catch (error) {
      console.error('Error fetching owners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch owners",
        variant: "destructive"
      });
    }
  };

  const generateReport = async () => {
    if (!selectedProperty || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please select a property and date range",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch invoices for the property and date range
      const { data: invoicesData, error: invoicesError } = await window.ezsite.apis.tablePage(26867, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'invoice_date',
        IsAsc: true,
        Filters: [
        { name: 'property_id', op: 'Equal', value: parseInt(selectedProperty) },
        { name: 'invoice_date', op: 'GreaterThanOrEqual', value: startDate },
        { name: 'invoice_date', op: 'LessThanOrEqual', value: endDate }]

      });

      if (invoicesError) throw invoicesError;
      const invoices = invoicesData.List || [];

      // Fetch payments for those invoices
      const invoiceIds = invoices.map((inv) => inv.id);
      let payments: Payment[] = [];

      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await window.ezsite.apis.tablePage(26868, {
          PageNo: 1,
          PageSize: 1000,
          OrderByField: 'payment_date',
          IsAsc: true,
          Filters: [
          { name: 'payment_date', op: 'GreaterThanOrEqual', value: startDate },
          { name: 'payment_date', op: 'LessThanOrEqual', value: endDate }]

        });

        if (paymentsError) throw paymentsError;
        payments = (paymentsData.List || []).filter((payment) =>
        invoiceIds.includes(payment.invoice_id)
        );
      }

      // Fetch expenses for the property and date range
      const { data: expensesData, error: expensesError } = await window.ezsite.apis.tablePage(28840, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'expense_date',
        IsAsc: true,
        Filters: [
        { name: 'property_id', op: 'Equal', value: parseInt(selectedProperty) },
        { name: 'expense_date', op: 'GreaterThanOrEqual', value: startDate },
        { name: 'expense_date', op: 'LessThanOrEqual', value: endDate }]

      });

      if (expensesError) throw expensesError;
      const expenses = expensesData.List || [];

      // Process transactions and calculate progressive balance
      const transactions: TransactionItem[] = [];

      // Add income transactions (payments)
      payments.forEach((payment) => {
        transactions.push({
          date: payment.payment_date,
          type: 'income',
          amount: payment.amount,
          description: `Payment received`,
          balance: 0 // Will be calculated later
        });
      });

      // Add expense transactions
      expenses.forEach((expense) => {
        transactions.push({
          date: expense.expense_date,
          type: 'expense',
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          balance: 0 // Will be calculated later
        });
      });

      // Sort transactions by date
      transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate progressive balance
      let runningBalance = 0;
      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach((transaction) => {
        if (transaction.type === 'income') {
          runningBalance += transaction.amount;
          totalIncome += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
          totalExpenses += transaction.amount;
        }
        transaction.balance = runningBalance;
      });

      setReportData(transactions);
      setTotals({
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses
      });

      toast({
        title: "Report Generated",
        description: "Property report has been generated successfully"
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedProperty || reportData.length === 0) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }

    const selectedPropertyData = properties.find((p) => p.id === parseInt(selectedProperty));
    if (!selectedPropertyData) {
      toast({
        title: "Error",
        description: "Selected property not found",
        variant: "destructive"
      });
      return;
    }

    try {
      pdfGenerator.generateReportPDF(
        reportData,
        totals,
        selectedPropertyData,
        startDate,
        endDate,
        description
      );

      toast({
        title: "PDF Downloaded",
        description: "Property report PDF has been downloaded successfully"
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

  const handleEmailReport = () => {
    if (!selectedProperty || reportData.length === 0) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first",
        variant: "destructive"
      });
      return;
    }

    // Find owner for the selected property
    const propertyOwner = owners.find((owner) => owner.property_id === parseInt(selectedProperty));

    setEmailData({
      recipientEmail: propertyOwner?.email || '',
      customMessage: ''
    });

    setEmailDialog(true);
  };

  const generateEmailContent = () => {
    const selectedPropertyData = properties.find((p) => p.id === parseInt(selectedProperty));
    const propertyOwner = owners.find((owner) => owner.property_id === parseInt(selectedProperty));

    const subject = `Property Financial Report - ${selectedPropertyData?.name || 'Property'} (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;

    // Generate HTML email body
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Financial Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            font-size: 16px;
            margin-top: 5px;
        }
        .property-info {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #4f46e5;
        }
        .property-info h2 {
            color: #4f46e5;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
        }
        .info-value {
            color: #6b7280;
        }
        .custom-message {
            background-color: #ecfdf5;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin-bottom: 25px;
        }
        .financial-summary {
            margin-bottom: 30px;
        }
        .financial-summary h2 {
            color: #374151;
            margin-bottom: 20px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        .summary-card {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .amount {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .income { color: #10b981; }
        .expense { color: #ef4444; }
        .balance.positive { color: #10b981; }
        .balance.negative { color: #ef4444; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
        }
        .footer .signature {
            margin-top: 20px;
            font-weight: bold;
            color: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Property Financial Report</h1>
            <div class="subtitle">Financial Analysis & Performance Summary</div>
        </div>

        <div class="property-info">
            <h2>Property & Report Details</h2>
            <div class="info-grid">
                <span class="info-label">Property Owner:</span>
                <span class="info-value">${propertyOwner?.owner_name || 'Property Owner'}</span>
                <span class="info-label">Property Name:</span>
                <span class="info-value">${selectedPropertyData?.name || 'N/A'}</span>
                <span class="info-label">Property Address:</span>
                <span class="info-value">${selectedPropertyData?.address || 'N/A'}</span>
                <span class="info-label">Report Period:</span>
                <span class="info-value">${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</span>
                ${description ? `<span class="info-label">Description:</span><span class="info-value">${description}</span>` : ''}
            </div>
        </div>

        ${emailData.customMessage ? `
        <div class="custom-message">
            <strong>Message:</strong><br>
            ${emailData.customMessage.replace(/\n/g, '<br>')}
        </div>` : ''}

        <div class="financial-summary">
            <h2>Financial Summary</h2>
            <div class="summary-cards">
                <div class="summary-card">
                    <h3>Total Income</h3>
                    <p class="amount income">$${totals.totalIncome.toLocaleString()}</p>
                </div>
                <div class="summary-card">
                    <h3>Total Expenses</h3>
                    <p class="amount expense">$${totals.totalExpenses.toLocaleString()}</p>
                </div>
                <div class="summary-card">
                    <h3>Net Balance</h3>
                    <p class="amount balance ${totals.netBalance >= 0 ? 'positive' : 'negative'}">
                        $${totals.netBalance.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated automatically by the Property Management System.</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <div class="signature">
                Best regards,<br>
                Property Management Team
            </div>
        </div>
    </div>
</body>
</html>`;

    return { subject, body: htmlBody };
  };

  const sendEmailReport = async () => {
    if (!emailData.recipientEmail) {
      toast({
        title: "Missing Email",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);

    try {
      const { subject, body } = generateEmailContent();

      const { error } = await window.ezsite.apis.sendEmail({
        from: 'Property Management <noreply@propertymanagement.com>',
        to: [emailData.recipientEmail],
        subject: subject,
        html: body
      });

      if (error) throw error;

      toast({
        title: "✅ Email Sent Successfully!",
        description: `Property report has been sent to ${emailData.recipientEmail}`,
        duration: 5000
      });

      setEmailDialog(false);
      setEmailData({ recipientEmail: '', customMessage: '' });
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: "❌ Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const selectedPropertyData = properties.find((p) => p.id === parseInt(selectedProperty));
  const propertyOwner = owners.find((owner) => owner.property_id === parseInt(selectedProperty));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Property Financial Report</h1>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Report Parameters
          </CardTitle>
          <CardDescription>
            Configure the report parameters to generate financial analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) =>
                  <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name} - {property.address}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Report description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)} />

            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateReport}
              disabled={loading || !selectedProperty || !startDate || !endDate}
              className="flex-1">

              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
            
            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedProperty || reportData.length === 0}
              variant="outline"
              className="flex items-center gap-2">

              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            
            <Button
              onClick={handleEmailReport}
              disabled={!selectedProperty || reportData.length === 0}
              variant="outline"
              className="flex items-center gap-2">

              <Mail className="w-4 h-4" />
              Email Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Owner Information */}
      {selectedProperty && propertyOwner &&
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Property Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Owner Name</Label>
                <p className="text-lg">{propertyOwner.owner_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-lg">{propertyOwner.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Badge variant="outline">{propertyOwner.type_of_owner}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      }

      {/* Report Summary */}
      {reportData.length > 0 &&
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totals.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From rental payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totals.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Property expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totals.netBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Income minus expenses
              </p>
            </CardContent>
          </Card>
        </div>
      }

      {/* Report Details */}
      {reportData.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>Financial Transactions</CardTitle>
            <CardDescription>
              {selectedPropertyData && `${selectedPropertyData.name} - ${selectedPropertyData.address}`}
              {description && ` | ${description}`}
              <br />
              Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Progressive Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((transaction, index) =>
                <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {transaction.description}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {transaction.category || '-'}
                      </td>
                      <td className={`border border-gray-300 px-4 py-2 text-right font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`
                  }>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                      <td className={`border border-gray-300 px-4 py-2 text-right font-bold ${
                  transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}`
                  }>
                        ${transaction.balance.toLocaleString()}
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      }

      {reportData.length === 0 && selectedProperty && startDate && endDate && !loading &&
      <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Data Found</h3>
            <p className="text-gray-600">
              No transactions found for the selected property and date range.
            </p>
          </CardContent>
        </Card>
      }

      {/* Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Property Report Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  value={emailData.recipientEmail}
                  onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                  placeholder="Enter recipient email" />

              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={generateEmailContent().subject}
                  disabled
                  className="bg-gray-50" />

              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={emailData.customMessage}
                onChange={(e) => setEmailData({ ...emailData, customMessage: e.target.value })}
                placeholder="Add a personal message that will appear at the top of the email..."
                rows={3} />

            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setEmailDialog(false)}
                disabled={sendingEmail}>

                Cancel
              </Button>
              <Button
                onClick={sendEmailReport}
                disabled={sendingEmail || !emailData.recipientEmail}>

                {sendingEmail ?
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </> :
                <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default PropertyReportWithPDF;