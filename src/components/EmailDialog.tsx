import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';
import { EmailService } from '@/utils/emailService';
import { sendEmailWithPDF } from '@/utils/enhancedEmailService';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'invoice' | 'receipt';
  data: any; // invoice or payment data
  tenant: any;
  property?: any;
  invoice?: any; // for receipt emails
}

const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  onOpenChange,
  type,
  data,
  tenant,
  property,
  invoice
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(tenant?.email || '');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes or tenant changes
  React.useEffect(() => {
    if (open) {
      setRecipientEmail(tenant?.email || '');
      setCustomMessage('');
    }
  }, [open, tenant?.email]);

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a recipient email address',
        variant: 'destructive'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);

    try {
      let result;

      // Update tenant email if changed
      const tenantToSend = { ...tenant, email: recipientEmail };

      // Use enhanced email service with PDF attachment
      const emailData = {
        to: [recipientEmail],
        subject: type === 'invoice' ? `Invoice ${data.invoice_number}` : `Receipt RCP-${data.id}`,
        html: customMessage ? `<p>${customMessage}</p><br/>` : '',
        text: customMessage || ''
      };

      const pdfData = {
        type: type as 'invoice' | 'receipt',
        data: type === 'invoice' ? { ...data, tenant: tenantToSend, property } : { ...data, tenant: tenantToSend, invoice },
        filename: type === 'invoice' ? `invoice-${data.invoice_number}.pdf` : `receipt-${data.id}.pdf`
      };

      result = await sendEmailWithPDF(emailData, pdfData);

      if (!result.error) {
        toast({
          title: '✅ Email Sent Successfully!',
          description: `${type === 'invoice' ? 'Invoice' : 'Receipt'} with PDF attachment has been sent to ${recipientEmail}`,
          duration: 5000
        });
        onOpenChange(false);
        setCustomMessage('');
      } else {
        toast({
          title: '❌ Email Failed',
          description: result.error || 'Failed to send email. Please try again.',
          variant: 'destructive',
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: '⚠️ Email Error',
        description: 'An unexpected error occurred while sending the email. Please try again.',
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      setIsSending(false);
    }
  };

  const getEmailPreview = () => {
    if (type === 'invoice') {
      return EmailService.generateInvoiceEmail(data, tenant, property, customMessage);
    } else {
      return EmailService.generateReceiptEmail(data, tenant, invoice, customMessage);
    }
  };

  const emailPreview = getEmailPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send {type === 'invoice' ? 'Invoice' : 'Receipt'} Email
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
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient email" />

            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailPreview.subject}
                disabled
                className="bg-gray-50" />

            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message that will appear at the top of the email..."
              rows={3} />

          </div>

          {/* Email Preview */}
          <div>
            <Label>Email Preview</Label>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {emailPreview.body}
              </pre>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              {type === 'invoice' ? 'Invoice Details' : 'Receipt Details'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {type === 'invoice' ?
              <>
                  <span className="text-blue-700">Invoice Number:</span>
                  <span>{data.invoice_number}</span>
                  <span className="text-blue-700">Amount:</span>
                  <span>${data.amount.toFixed(2)}</span>
                  <span className="text-blue-700">Due Date:</span>
                  <span>{new Date(data.due_date).toLocaleDateString()}</span>
                </> :

              <>
                  <span className="text-blue-700">Receipt Number:</span>
                  <span>RCP-{data.id}</span>
                  <span className="text-blue-700">Amount:</span>
                  <span>${data.amount.toFixed(2)}</span>
                  <span className="text-blue-700">Payment Date:</span>
                  <span>{new Date(data.payment_date).toLocaleDateString()}</span>
                </>
              }
              <span className="text-blue-700">Tenant:</span>
              <span>{tenant.tenant_name}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}>

              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !recipientEmail}>

              {isSending ?
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
    </Dialog>);

};

export default EmailDialog;