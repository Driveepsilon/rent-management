
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
import { CalendarDays, TrendingUp, TrendingDown, BarChart3, FileText, DollarSign, Mail, Send, Loader2 } from 'lucide-react';

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

const PropertyReport: React.FC = () => {
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
    const propertyOwner = owners.find(owner => owner.property_id === parseInt(selectedProperty));
    
    setEmailData({
      recipientEmail: propertyOwner?.email || '',
      customMessage: ''
    });
    
    setEmailDialog(true);
  };

  const generateEmailContent = () => {
    const selectedPropertyData = properties.find(p => p.id === parseInt(selectedProperty));
    const propertyOwner = owners.find(owner => owner.property_id === parseInt(selectedProperty));

    const subject = `Property Financial Report - ${selectedPropertyData?.name || 'Property'} (${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()})`;

    let emailBody = `Dear ${propertyOwner?.owner_name || 'Property Owner'},\n\n`;
    
    if (emailData.customMessage) {
      emailBody += `${emailData.customMessage}\n\n`;
    }
    
    emailBody += `Please find below the financial report for your property:\n\n`;
    emailBody += `Property: ${selectedPropertyData?.name || 'N/A'}\n`;
    emailBody += `Address: ${selectedPropertyData?.address || 'N/A'}\n`;
    emailBody += `Report Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}\n`;
    
    if (description) {
      emailBody += `Description: ${description}\n`;
    }
    
    emailBody += `\n--- FINANCIAL SUMMARY ---\n`;
    emailBody += `Total Income: $${totals.totalIncome.toLocaleString()}\n`;
    emailBody += `Total Expenses: $${totals.totalExpenses.toLocaleString()}\n`;
    emailBody += `Net Balance: $${totals.netBalance.toLocaleString()}\n\n`;
    
    emailBody += `--- DETAILED TRANSACTIONS ---\n`;
    emailBody += `Date       | Type     | Description                    | Category           | Amount     | Balance\n`;
    emailBody += `-----------|----------|--------------------------------|--------------------|-----------|-----------\n`;
    
    reportData.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString().padEnd(10);
      const type = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
      const typeFormatted = type.padEnd(8);
      const desc = transaction.description.substring(0, 30).padEnd(30);
      const category = (transaction.category || '-').padEnd(18);
      const amount = (transaction.type === 'income' ? '+' : '-') + '$' + transaction.amount.toLocaleString();
      const amountFormatted = amount.padEnd(10);
      const balance = '$' + transaction.balance.toLocaleString();
      
      emailBody += `${date} | ${typeFormatted} | ${desc} | ${category} | ${amountFormatted} | ${balance}\n`;
    });
    
    emailBody += `\n\nThis report was generated automatically by the Property Management System.\n\n`;
    emailBody += `Best regards,\nProperty Management Team`;

    return { subject, body: emailBody };
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
        text: body
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
  const propertyOwner = owners.find(owner => owner.property_id === parseInt(selectedProperty));

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
      {selectedProperty && propertyOwner && (
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
      )}

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
                  onChange={(e) => setEmailData({...emailData, recipientEmail: e.target.value})}
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
                onChange={(e) => setEmailData({...emailData, customMessage: e.target.value})}
                placeholder="Add a personal message that will appear at the top of the email..."
                rows={3} />
            </div>

            {/* Email Preview */}
            <div>
              <Label>Email Preview</Label>
              <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {generateEmailContent().body}
                </pre>
              </div>
            </div>

            {/* Report Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Report Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-blue-700">Property:</span>
                <span>{selectedPropertyData?.name}</span>
                <span className="text-blue-700">Period:</span>
                <span>{new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span>
                <span className="text-blue-700">Total Income:</span>
                <span>${totals.totalIncome.toLocaleString()}</span>
                <span className="text-blue-700">Total Expenses:</span>
                <span>${totals.totalExpenses.toLocaleString()}</span>
                <span className="text-blue-700">Net Balance:</span>
                <span className={totals.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${totals.netBalance.toLocaleString()}
                </span>
              </div>
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

export default PropertyReport;
