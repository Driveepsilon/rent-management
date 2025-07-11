import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Search, FileText, Receipt, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';

interface EmailLog {
  id: number;
  tenant_id: number;
  invoice_id?: number;
  payment_id?: number;
  email_type: string;
  recipient_email: string;
  subject: string;
  sent_date: string;
  status: string;
  message: string;
}

interface Tenant {
  id: number;
  tenant_name: string;
  email: string;
}

const EmailHistory: React.FC = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailLogs();
    fetchTenants();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      const { data: userData, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view email history.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await window.ezsite.apis.tablePage('27120', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setEmailLogs(data.List || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email history',
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
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });
      if (error) throw error;
      setTenants(data.List || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const getTenantName = (tenantId: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.tenant_name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'receipt': return <Receipt className="h-4 w-4 text-green-600" />;
      default: return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch = 
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTenantName(log.tenant_id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || log.email_type === filterType;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading email history...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email History</h1>
          <p className="text-gray-600">Track all sent invoices and receipts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(log.email_type)}
                    <h3 className="font-semibold">{log.subject}</h3>
                    <Badge className={getStatusColor(log.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span><strong>To:</strong> {getTenantName(log.tenant_id)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{log.recipient_email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span><strong>Sent:</strong> {new Date(log.sent_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="capitalize">
                        <strong>Type:</strong> {log.email_type}
                      </span>
                      {log.invoice_id && (
                        <span className="ml-4">
                          <strong>Invoice ID:</strong> {log.invoice_id}
                        </span>
                      )}
                      {log.payment_id && (
                        <span className="ml-4">
                          <strong>Payment ID:</strong> {log.payment_id}
                        </span>
                      )}
                    </div>
                    {log.message && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <strong>Custom Message:</strong> {log.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email history found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'No emails match your current filters'
                : 'Start sending invoices and receipts to see them here'
              }
            </p>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {emailLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {emailLogs.length}
                </div>
                <div className="text-sm text-gray-600">Total Emails</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {emailLogs.filter(log => log.status === 'sent').length}
                </div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {emailLogs.filter(log => log.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {emailLogs.filter(log => log.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailHistory;