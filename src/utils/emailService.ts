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
   * Send an email (simulated for demo purposes)
   * In a real application, this would integrate with an email service provider
   */
  static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Email delivery failed' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to send email' };
    }
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
    
    const body = `
Dear ${tenant.tenant_name},

${customMessage ? customMessage + '\n\n' : ''}

Please find below the details of your invoice:

Invoice Number: ${invoice.invoice_number}
Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Property: ${property.name}
Address: ${property.address}

Rent Period: ${invoice.rent_period}
Number of Months: ${invoice.rent_months}

Amount: $${invoice.amount.toFixed(2)}
Late Fee: $${invoice.late_fee.toFixed(2)}
Total Amount: $${(invoice.amount + invoice.late_fee).toFixed(2)}

Amount in Words: ${invoice.amount_in_letters}

Description: ${invoice.description}

Bank Information:
${invoice.bank_information}

Please ensure payment is made by the due date to avoid any late fees.

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
Property Management Team
    `.trim();

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
    
    const body = `
Dear ${tenant.tenant_name},

${customMessage ? customMessage + '\n\n' : ''}

Thank you for your payment. Please find below your payment receipt:

Receipt Number: RCP-${payment.id}
Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}

Amount Paid: $${payment.amount.toFixed(2)}
Payment Method: ${payment.payment_method}
Reference Number: ${payment.reference_number}

${invoice ? `For Invoice: ${invoice.invoice_number}` : ''}

${payment.notes ? `Notes: ${payment.notes}` : ''}

This serves as your official receipt for the payment made.

If you have any questions about this payment, please contact us.

Best regards,
Property Management Team
    `.trim();

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
    customMessage: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await window.ezsite.apis.getUserInfo();
      if (!userData) {
        return { success: false, error: 'User not authenticated' };
      }

      const emailData = this.generateInvoiceEmail(invoice, tenant, property, customMessage);
      
      // Log email attempt
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

      await this.logEmail(emailLog);

      // Send email
      const result = await this.sendEmail(emailData);
      
      // Update log with result
      emailLog.status = result.success ? 'sent' : 'failed';
      await this.logEmail({ ...emailLog, status: emailLog.status });

      return result;
    } catch (error) {
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
    customMessage: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await window.ezsite.apis.getUserInfo();
      if (!userData) {
        return { success: false, error: 'User not authenticated' };
      }

      const emailData = this.generateReceiptEmail(payment, tenant, invoice, customMessage);
      
      // Log email attempt
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

      await this.logEmail(emailLog);

      // Send email
      const result = await this.sendEmail(emailData);
      
      // Update log with result
      emailLog.status = result.success ? 'sent' : 'failed';
      await this.logEmail({ ...emailLog, status: emailLog.status });

      return result;
    } catch (error) {
      return { success: false, error: 'Failed to send receipt email' };
    }
  }
}