import { toast } from '@/hooks/use-toast';
import { 
  generateInvoicePDF, 
  generateTrusteeFeesInvoicePDF, 
  generateReceiptPDF, 
  generateReportPDF 
} from '@/utils/enhancedPdfGenerator';

interface EmailData {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}

interface PDFData {
  type: 'invoice' | 'receipt' | 'report' | 'trustee_fees';
  data: any;
  filename: string;
}

interface UserSettings {
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_logo?: string;
}

// Get user settings for company information
async function getUserSettings(): Promise<UserSettings> {
  try {
    const { data: userData } = await window.ezsite.apis.getUserInfo();
    if (!userData) return {};

    const { data, error } = await window.ezsite.apis.tablePage(28887, {
      PageNo: 1,
      PageSize: 1,
      OrderByField: 'id',
      IsAsc: false,
      Filters: [{ name: 'user_id', op: 'Equal', value: userData.ID }]
    });

    if (!error && data && data.List && data.List.length > 0) {
      return data.List[0];
    }

    return {};
  } catch (error) {
    console.error('Error getting user settings:', error);
    return {};
  }
}

export async function sendEmailWithPDF(emailData: EmailData, pdfData: PDFData): Promise<{ error?: string }> {
  try {
    // Get company information
    const companyInfo = await getUserSettings();

    // Generate PDF
    let pdfBlob;
    switch (pdfData.type) {
      case 'invoice':
        pdfBlob = await generateInvoicePDF(pdfData.data, companyInfo);
        break;
      case 'trustee_fees':
        pdfBlob = await generateTrusteeFeesInvoicePDF(pdfData.data, companyInfo);
        break;
      case 'receipt':
        pdfBlob = await generateReceiptPDF(pdfData.data, companyInfo);
        break;
      case 'report':
        pdfBlob = await generateReportPDF(pdfData.data, companyInfo);
        break;
      default:
        throw new Error('Unsupported PDF type');
    }

    // Convert PDF to base64 for email attachment
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Enhanced HTML email template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailData.subject}</title>
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
        .attachment-notice {
            background: #e3f2fd;
            padding: 20px;
            border-left: 4px solid #2196f3;
            margin: 20px 0;
            border-radius: 4px;
        }
        .pdf-icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            background: #d32f2f;
            color: white;
            text-align: center;
            line-height: 24px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${companyInfo.company_name || 'Property Management'}</h1>
        </div>
        <div class="email-body">
            <div class="email-content">
                ${emailData.html || emailData.text || ''}
            </div>
            <div class="attachment-notice">
                <div class="pdf-icon">PDF</div>
                <strong>Attachment:</strong> ${pdfData.filename}
                <br>
                <small>Please find the attached PDF document for your records.</small>
            </div>
        </div>
        <div class="email-footer">
            <p>&copy; 2024 ${companyInfo.company_name || 'Property Management System'}. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            ${companyInfo.company_address ? `<p>${companyInfo.company_address}</p>` : ''}
            ${companyInfo.company_phone ? `<p>Phone: ${companyInfo.company_phone}</p>` : ''}
        </div>
    </div>
</body>
</html>
    `;

    // Send email with PDF attachment
    const { error } = await window.ezsite.apis.sendEmail({
      from: `${companyInfo.company_name || 'Property Management'} <${companyInfo.company_email || 'noreply@propertymanagement.com'}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: htmlTemplate,
      attachments: [
        {
          filename: pdfData.filename,
          content: base64,
          contentType: 'application/pdf'
        }
      ]
    });

    return { error };
  } catch (error: any) {
    console.error('Error sending email with PDF:', error);
    return { error: error.message || 'Failed to send email' };
  }
}

export async function logEmail(emailLog: any): Promise<void> {
  try {
    const { error } = await window.ezsite.apis.tableCreate('27120', emailLog);
    if (error) {
      console.error('Failed to log email:', error);
    }
  } catch (error) {
    console.error('Error logging email:', error);
  }
}
