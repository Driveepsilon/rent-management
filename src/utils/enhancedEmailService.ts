import { toast } from '@/hooks/use-toast';
import { generateInvoicePDF } from './pdfGenerator';

interface EmailData {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}

export const sendEmailWithPDF = async (
  emailData: EmailData,
  pdfData?: {
    type: 'invoice' | 'receipt' | 'report';
    data: any;
    filename: string;
  }
): Promise<{ error?: string }> => {
  try {
    let finalEmailData = { ...emailData };

    // Add PDF attachment if provided
    if (pdfData) {
      const pdfBlob = await generateInvoicePDF(pdfData.data);
      const pdfBase64 = await blobToBase64(pdfBlob);
      
      finalEmailData.attachments = [
        ...(emailData.attachments || []),
        {
          filename: pdfData.filename,
          content: pdfBase64,
          encoding: 'base64'
        }
      ];
    }

    const { error } = await window.ezsite.apis.sendEmail({
      from: 'Property Management <noreply@propertymanagement.com>',
      to: finalEmailData.to,
      subject: finalEmailData.subject,
      text: finalEmailData.text,
      html: finalEmailData.html,
      attachments: finalEmailData.attachments
    });

    if (error) {
      throw new Error(error);
    }

    return { error: undefined };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { error: error.message || 'Failed to send email' };
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (data:application/pdf;base64,)
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const logEmail = async (
  userId: number,
  tenantId: number,
  emailType: string,
  recipientEmail: string,
  subject: string,
  message: string,
  invoiceId?: number,
  paymentId?: number
): Promise<{ error?: string }> => {
  try {
    const { error } = await window.ezsite.apis.tableCreate(27120, {
      user_id: userId,
      tenant_id: tenantId,
      invoice_id: invoiceId || 0,
      payment_id: paymentId || 0,
      email_type: emailType,
      recipient_email: recipientEmail,
      subject: subject,
      sent_date: new Date().toISOString(),
      status: 'sent',
      message: message
    });

    if (error) {
      throw new Error(error);
    }

    return { error: undefined };
  } catch (error: any) {
    console.error('Email logging error:', error);
    return { error: error.message || 'Failed to log email' };
  }
};