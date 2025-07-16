// Email service utilities for sending invoices and receipts
import { toast } from '@/hooks/use-toast';

interface EmailData {
  recipientEmail: string;
  subject: string;
  body: string;
  attachmentContent?: string;
  attachmentName?: string;
}

interface EmailLogData {
  user_id: number;
  tenant_id: number;
  invoice_id?: number;
  payment_id?: number;
  email_type: 'invoice' | 'receipt';
  recipient_email: string;
  subject: string;
  message: string;
  sent_date: string;
  status: 'sent' | 'failed' | 'pending';
}

export class EmailService {
  /**
   * Send an email using the integrated email service provider
   */
  static async sendEmail(emailData: EmailData): Promise<{success: boolean;error?: string;}> {
    try {
      // Use the real email API integration
      const { error } = await window.ezsite.apis.sendEmail({
        from: 'Property Management <noreply@propertymanagement.com>',
        to: [emailData.recipientEmail],
        subject: emailData.subject,
        text: emailData.body,
        html: this.generateHtmlEmail(emailData.body, emailData.subject)
      });

      if (error) {
        console.error('Email API error:', error);
        return { success: false, error: error };
      }

      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  /**
   * Generate professional HTML email template
   */
  static generateHtmlEmail(body: string, subject: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px;
        }
        .email-content {
            white-space: pre-wrap;
            font-size: 16px;
            line-height: 1.8;
        }
        .email-footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .highlight {
            background: #e3f2fd;
            padding: 20px;
            border-left: 4px solid #2196f3;
            margin: 20px 0;
            border-radius: 4px;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #2196f3;
        }
        .due-date {
            color: #f44336;
            font-weight: bold;
        }
        .contact-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Property Management</h1>
        </div>
        <div class="email-body">
            <div class="email-content">${body.replace(/\n/g, '<br>')}</div>
            <div class="contact-info">
                <p><strong>Need help?</strong> Contact us anytime:</p>
                <p>📧 Email: support@propertymanagement.com</p>
                <p>📞 Phone: +1 (555) 123-4567</p>
            </div>
        </div>
        <div class="email-footer">
            <p>&copy; 2024 Property Management System. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Log email sending attempt to database
   */
  static async logEmail(emailLog: EmailLogData): Promise<void> {
    try {
      const { error } = await window.ezsite.apis.tableCreate('27120', emailLog);
      if (error) {
        console.error('Failed to log email:', error);
      }
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Generate invoice email content
   */
  static generateInvoiceEmail(invoice: any, tenant: any, property: any, customMessage: string = ''): EmailData {
    const subject = `Invoice ${invoice.invoice_number} - Payment Due`;
    const totalAmount = invoice.amount + invoice.late_fee;

    const body = `Dear ${tenant.tenant_name},

${customMessage ? customMessage + '\n\n' : ''}

We hope this message finds you well. Please find below the details of your invoice:

═══════════════════════════════════════════════════════════════════════════════
                                INVOICE DETAILS
═══════════════════════════════════════════════════════════════════════════════

Invoice Number: ${invoice.invoice_number}
Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

PROPERTY INFORMATION:
• Property: ${property.name}
• Address: ${property.address}

BILLING DETAILS:
• Rent Period: ${invoice.rent_period}
• Number of Months: ${invoice.rent_months}
• Description: ${invoice.description}

PAYMENT BREAKDOWN:
• Base Amount: $${invoice.amount.toFixed(2)}
• Late Fee: $${invoice.late_fee.toFixed(2)}
• TOTAL AMOUNT DUE: $${totalAmount.toFixed(2)}

Amount in Words: ${invoice.amount_in_letters}

PAYMENT INSTRUCTIONS:
${invoice.bank_information}

═══════════════════════════════════════════════════════════════════════════════
                              IMPORTANT NOTICE
═══════════════════════════════════════════════════════════════════════════════

⚠️  Please ensure payment is made by the due date to avoid additional late fees.
💡  Keep this invoice for your records.
📞  Contact us immediately if you have any questions or payment concerns.

Thank you for your prompt attention to this matter.

Best regards,
Property Management Team`;

    return {
      recipientEmail: tenant.email,
      subject,
      body,
      attachmentContent: body,
      attachmentName: `invoice-${invoice.invoice_number}.txt`
    };
  }

  /**
   * Generate receipt email content
   */
  static generateReceiptEmail(payment: any, tenant: any, invoice: any, customMessage: string = ''): EmailData {
    const subject = `Payment Receipt - ${invoice?.invoice_number || 'Payment Confirmation'}`;

    const body = `Dear ${tenant.tenant_name},

${customMessage ? customMessage + '\n\n' : ''}

Thank you for your payment! We have successfully received your payment and appreciate your promptness.

═══════════════════════════════════════════════════════════════════════════════
                               PAYMENT RECEIPT
═══════════════════════════════════════════════════════════════════════════════

Receipt Number: RCP-${payment.id}
Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}

PAYMENT DETAILS:
• Amount Paid: $${payment.amount.toFixed(2)}
• Payment Method: ${payment.payment_method}
• Reference Number: ${payment.reference_number}

${invoice ? `INVOICE INFORMATION:
• Invoice Number: ${invoice.invoice_number}
• Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}` : ''}

${payment.notes ? `ADDITIONAL NOTES:
${payment.notes}` : ''}

═══════════════════════════════════════════════════════════════════════════════
                              CONFIRMATION
═══════════════════════════════════════════════════════════════════════════════

✅ This serves as your official receipt for the payment made.
📄 Please keep this receipt for your records.
💰 Your payment has been successfully processed and recorded.

If you have any questions about this payment or need additional documentation, please don't hesitate to contact us.

Thank you for choosing our property management services!

Best regards,
Property Management Team`;

    return {
      recipientEmail: tenant.email,
      subject,
      body,
      attachmentContent: body,
      attachmentName: `receipt-${payment.id}.txt`
    };
  }

  /**
   * Send invoice email with logging
   */
  static async sendInvoiceEmail(
  invoice: any,
  tenant: any,
  property: any,
  customMessage: string = '')
  : Promise<{success: boolean;error?: string;}> {
    let logId: number | null = null;

    try {
      const { data: userData } = await window.ezsite.apis.getUserInfo();
      if (!userData) {
        return { success: false, error: 'User not authenticated' };
      }

      const emailData = this.generateInvoiceEmail(invoice, tenant, property, customMessage);

      // Create initial log entry
      const emailLog: EmailLogData = {
        user_id: userData.ID,
        tenant_id: tenant.id,
        invoice_id: invoice.id,
        email_type: 'invoice',
        recipient_email: tenant.email,
        subject: emailData.subject,
        message: customMessage,
        sent_date: new Date().toISOString(),
        status: 'pending'
      };

      // Create log entry and get ID
      const { error: logError } = await window.ezsite.apis.tableCreate('27120', emailLog);
      if (logError) {
        console.error('Failed to create email log:', logError);
      }

      // Send email
      const result = await this.sendEmail(emailData);

      // Update log with result if we have logId
      if (!logError) {
        try {
          // Create another log entry with final status
          const finalLog = {
            ...emailLog,
            status: result.success ? 'sent' : 'failed'
          };

          await window.ezsite.apis.tableCreate('27120', finalLog);
        } catch (updateError) {
          console.error('Failed to update email log:', updateError);
        }
      }

      return result;
    } catch (error) {
      console.error('Send invoice email error:', error);
      return { success: false, error: 'Failed to send invoice email' };
    }
  }

  /**
   * Send receipt email with logging
   */
  static async sendReceiptEmail(
  payment: any,
  tenant: any,
  invoice: any,
  customMessage: string = '')
  : Promise<{success: boolean;error?: string;}> {
    try {
      const { data: userData } = await window.ezsite.apis.getUserInfo();
      if (!userData) {
        return { success: false, error: 'User not authenticated' };
      }

      const emailData = this.generateReceiptEmail(payment, tenant, invoice, customMessage);

      // Create initial log entry
      const emailLog: EmailLogData = {
        user_id: userData.ID,
        tenant_id: tenant.id,
        payment_id: payment.id,
        email_type: 'receipt',
        recipient_email: tenant.email,
        subject: emailData.subject,
        message: customMessage,
        sent_date: new Date().toISOString(),
        status: 'pending'
      };

      // Create log entry
      const { error: logError } = await window.ezsite.apis.tableCreate('27120', emailLog);
      if (logError) {
        console.error('Failed to create email log:', logError);
      }

      // Send email
      const result = await this.sendEmail(emailData);

      // Update log with result
      if (!logError) {
        try {
          // Create another log entry with final status
          const finalLog = {
            ...emailLog,
            status: result.success ? 'sent' : 'failed'
          };

          await window.ezsite.apis.tableCreate('27120', finalLog);
        } catch (updateError) {
          console.error('Failed to update email log:', updateError);
        }
      }

      return result;
    } catch (error) {
      console.error('Send receipt email error:', error);
      return { success: false, error: 'Failed to send receipt email' };
    }
  }
}