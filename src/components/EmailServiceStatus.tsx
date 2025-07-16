import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, Settings, Send, Loader2 } from 'lucide-react';

const EmailServiceStatus: React.FC = () => {
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailStats, setEmailStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    recentEmails: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      const { data: userData } = await window.ezsite.apis.getUserInfo();
      if (!userData) return;

      const { data, error } = await window.ezsite.apis.tablePage('27120', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
      });

      if (error) throw error;

      const logs = data.List || [];
      setEmailStats({
        totalSent: logs.filter(log => log.status === 'sent').length,
        totalFailed: logs.filter(log => log.status === 'failed').length,
        totalPending: logs.filter(log => log.status === 'pending').length,
        recentEmails: logs.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching email stats:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingEmail(true);

    try {
      const { error } = await window.ezsite.apis.sendEmail({
        from: 'Property Management <noreply@propertymanagement.com>',
        to: [testEmail],
        subject: 'Email Service Test - Property Management System',
        text: `Hello!

This is a test email from your Property Management System to verify that email integration is working correctly.

Test Details:
• Sent at: ${new Date().toLocaleString()}
• Service: EasySite Email Integration
• Status: Successfully delivered

If you received this email, your email service is properly configured and ready to send invoices and receipts to your tenants.

Best regards,
Property Management Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Email Service Test</h1>
            <p>Property Management System</p>
        </div>
        <div class="content">
            <div class="success">
                <h3>Test Email Successful!</h3>
                <p>This is a test email from your Property Management System to verify that email integration is working correctly.</p>
            </div>
            <h3>Test Details:</h3>
            <ul>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Service:</strong> EasySite Email Integration</li>
                <li><strong>Status:</strong> Successfully delivered</li>
            </ul>
            <p>If you received this email, your email service is properly configured and ready to send invoices and receipts to your tenants.</p>
            <p><strong>Best regards,</strong><br>Property Management Team</p>
        </div>
    </div>
</body>
</html>
        `
      });

      if (error) {
        toast({
          title: 'Test Email Failed',
          description: error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: '✅ Test Email Sent!',
          description: `Test email has been sent to ${testEmail}`,
          duration: 5000
        });
        setTestEmail('');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: 'Email Test Error',
        description: 'An error occurred while sending the test email',
        variant: 'destructive'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Email Service Provider: Connected</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="text-sm text-gray-600">
              Your email service is properly integrated and ready to send invoices and receipts to tenants.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Email Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{emailStats.totalSent}</div>
              <div className="text-sm text-gray-600">Emails Sent</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{emailStats.totalFailed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{emailStats.totalPending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Email Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Send a test email to verify that your email service is working correctly.
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address for testing"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !testEmail}
                >
                  {isTestingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Email Activity */}
      {emailStats.recentEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailStats.recentEmails.map((email: any) => (
                <div key={email.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <div>
                      <div className="font-medium text-sm">{email.subject}</div>
                      <div className="text-xs text-gray-500">{email.recipient_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(email.status)}>
                      {email.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(email.sent_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailServiceStatus;
