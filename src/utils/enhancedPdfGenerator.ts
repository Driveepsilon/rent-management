import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCurrency } from '@/contexts/CurrencyContext';

// Define interfaces
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
  currency?: string;
}

interface TrusteeFeesInvoice {
  id: number;
  owner_id: number;
  property_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  currency: string;
  description: string;
  status: string;
  notes: string;
  created_date: string;
  owner?: any;
  property?: any;
  items?: any[];
}

interface Payment {
  id: number;
  tenant_id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  status: string;
  currency?: string;
}

interface Tenant {
  id: number;
  tenant_name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  monthly_rent: number;
}

interface TransactionItem {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  balance: number;
}

interface ReportTotals {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export class EnhancedPDFGenerator {
  private addHeader(doc: jsPDF, title: string, companyInfo?: any) {
    // Add company logo if available
    if (companyInfo?.logo) {
      try {
        doc.addImage(companyInfo.logo, 'PNG', 20, 10, 40, 20);
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }

    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.text(title, companyInfo?.logo ? 70 : 20, 25);

    // Company information
    if (companyInfo?.name) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(companyInfo.name, companyInfo?.logo ? 70 : 20, 35);
    }

    if (companyInfo?.address) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(companyInfo.address, companyInfo?.logo ? 70 : 20, 42);
    }

    if (companyInfo?.phone) {
      doc.setFontSize(10);
      doc.text(`Phone: ${companyInfo.phone}`, companyInfo?.logo ? 70 : 20, 48);
    }

    if (companyInfo?.email) {
      doc.setFontSize(10);
      doc.text(`Email: ${companyInfo.email}`, companyInfo?.logo ? 70 : 20, 54);
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 65);

    // Add a line under the header
    doc.setDrawColor(79, 70, 229);
    doc.line(20, 70, 190, 70);
  }

  private addFooter(doc: jsPDF, companyInfo?: any) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerText = companyInfo?.name ? 
      `${companyInfo.name} - Property Management System - Confidential Document` :
      'Property Management System - Confidential Document';
    doc.text(footerText, 20, pageHeight - 20);
  }

  private formatCurrency(amount: number, currency: string = 'USD'): string {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'XOF': 'CFA',
      'GBP': '£'
    };

    const symbol = symbols[currency as keyof typeof symbols] || '$';
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (currency === 'XOF') {
      return `${formatter.format(amount)} ${symbol}`;
    }

    return `${symbol}${formatter.format(amount)}`;
  }

  generateInvoicePDF(invoice: Invoice, tenant: Tenant, property: Property, companyInfo?: any): Blob {
    const doc = new jsPDF();

    this.addHeader(doc, 'INVOICE', companyInfo);

    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 85);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 20, 95);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 105);

    // Bill to section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Bill To:', 20, 125);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(tenant.tenant_name, 20, 135);
    doc.text(tenant.email, 20, 145);
    if (tenant.phone) doc.text(tenant.phone, 20, 155);
    if (tenant.address) doc.text(tenant.address, 20, 165);

    // Property details
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Property:', 120, 125);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(property.name, 120, 135);
    doc.text(property.address, 120, 145);

    // Invoice items table - Fix: Calculate total as amount * 3
    const calculatedTotal = invoice.amount * 3;
    const tableData = [
      ['Description', 'Period', 'Months', 'Amount'],
      [invoice.description, invoice.rent_period, invoice.rent_months.toString(), this.formatCurrency(invoice.amount, invoice.currency)],
      ['Calculated Total (x3)', '', '', this.formatCurrency(calculatedTotal, invoice.currency)],
      ['Late Fee', '', '', this.formatCurrency(invoice.late_fee, invoice.currency)]
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 180,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 }
    });

    // Total - Fix: Show amount * 3 + late fee
    const finalY = (doc as any).lastAutoTable.finalY || 220;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL: ${this.formatCurrency(calculatedTotal + invoice.late_fee, invoice.currency)}`, 130, finalY + 20);

    // Amount in letters
    doc.setFontSize(10);
    doc.text(`Amount in Letters: ${invoice.amount_in_letters}`, 20, finalY + 40);

    // Bank information
    if (invoice.bank_information) {
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('Bank Information:', 20, finalY + 60);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const bankLines = invoice.bank_information.split('\n');
      bankLines.forEach((line, index) => {
        doc.text(line, 20, finalY + 70 + index * 10);
      });
    }

    this.addFooter(doc, companyInfo);
    return doc.output('blob');
  }

  generateTrusteeFeesInvoicePDF(invoice: TrusteeFeesInvoice, companyInfo?: any): Blob {
    const doc = new jsPDF();

    this.addHeader(doc, 'TRUSTEE FEES INVOICE', companyInfo);

    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 85);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 20, 95);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 105);

    // Bill to section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Bill To:', 20, 125);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.owner?.owner_name || 'Unknown Owner', 20, 135);
    doc.text(invoice.owner?.email || '', 20, 145);
    if (invoice.owner?.phone) doc.text(invoice.owner.phone, 20, 155);
    if (invoice.owner?.address) doc.text(invoice.owner.address, 20, 165);

    // Property details
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Property:', 120, 125);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.property?.name || 'Unknown Property', 120, 135);
    doc.text(invoice.property?.address || '', 120, 145);

    // Invoice items table
    const tableData = [
      ['Description', 'Quantity', 'Unit Price', 'Total']
    ];

    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item) => {
        tableData.push([
          item.description,
          item.quantity.toString(),
          this.formatCurrency(item.unit_price, invoice.currency),
          this.formatCurrency(item.total_amount, invoice.currency)
        ]);
      });
    } else {
      tableData.push([
        invoice.description,
        '1',
        this.formatCurrency(invoice.total_amount, invoice.currency),
        this.formatCurrency(invoice.total_amount, invoice.currency)
      ]);
    }

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 180,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 220;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL: ${this.formatCurrency(invoice.total_amount, invoice.currency)}`, 130, finalY + 20);

    // Notes
    if (invoice.notes) {
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('Notes:', 20, finalY + 40);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const noteLines = invoice.notes.split('\n');
      noteLines.forEach((line, index) => {
        doc.text(line, 20, finalY + 50 + index * 10);
      });
    }

    this.addFooter(doc, companyInfo);
    return doc.output('blob');
  }

  generateReceiptPDF(payment: Payment, tenant: Tenant, invoice?: Invoice, companyInfo?: any): Blob {
    const doc = new jsPDF();

    this.addHeader(doc, 'PAYMENT RECEIPT', companyInfo);

    // Receipt details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt Number: RCP-${payment.id}`, 20, 85);
    doc.text(`Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 20, 95);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 105);

    // Received from section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Received From:', 20, 125);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(tenant.tenant_name, 20, 135);
    doc.text(tenant.email, 20, 145);
    if (tenant.phone) doc.text(tenant.phone, 20, 155);

    // Payment details table
    const tableData = [
      ['Description', 'Amount'],
      ['Payment Amount', this.formatCurrency(payment.amount, payment.currency)],
      ['Payment Method', payment.payment_method],
      ['Reference Number', payment.reference_number || 'N/A'],
      ['Invoice Number', invoice?.invoice_number || 'N/A']
    ];

    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 170,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Green color for receipts
      margin: { left: 20 }
    });

    // Notes
    if (payment.notes) {
      const finalY = (doc as any).lastAutoTable.finalY || 220;
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('Notes:', 20, finalY + 20);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const noteLines = payment.notes.split('\n');
      noteLines.forEach((line, index) => {
        doc.text(line, 20, finalY + 30 + index * 10);
      });
    }

    // Thank you message
    const finalY = (doc as any).lastAutoTable.finalY || 220;
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text('Thank you for your payment!', 20, finalY + 60);

    this.addFooter(doc, companyInfo);
    return doc.output('blob');
  }

  generateReportPDF(
    reportData: TransactionItem[],
    totals: ReportTotals,
    property: Property,
    startDate: string,
    endDate: string,
    description?: string,
    currency: string = 'USD',
    companyInfo?: any
  ): Blob {
    const doc = new jsPDF();

    this.addHeader(doc, 'PROPERTY FINANCIAL REPORT', companyInfo);

    // Report details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Property: ${property.name}`, 20, 85);
    doc.text(`Address: ${property.address}`, 20, 95);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 20, 105);
    if (description) doc.text(`Description: ${description}`, 20, 115);

    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Financial Summary', 20, 135);

    const summaryData = [
      ['Category', 'Amount'],
      ['Total Income', this.formatCurrency(totals.totalIncome, currency)],
      ['Total Expenses', this.formatCurrency(totals.totalExpenses, currency)],
      ['Net Balance', this.formatCurrency(totals.netBalance, currency)]
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 145,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Transactions table
    let finalY = (doc as any).lastAutoTable.finalY || 200;
    finalY += 20;

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Detailed Transactions', 20, finalY);

    const transactionData = reportData.map((transaction) => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type === 'income' ? 'Income' : 'Expense',
      transaction.description,
      transaction.category || '-',
      `${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount, currency)}`,
      this.formatCurrency(transaction.balance, currency)
    ]);

    autoTable(doc, {
      head: [['Date', 'Type', 'Description', 'Category', 'Amount', 'Balance']],
      body: transactionData,
      startY: finalY + 10,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        4: {
          cellWidth: 25,
          halign: 'right'
        },
        5: {
          cellWidth: 25,
          halign: 'right'
        }
      }
    });

    this.addFooter(doc, companyInfo);
    return doc.output('blob');
  }

  // Download helper methods
  downloadInvoice(invoice: Invoice, tenant: Tenant, property: Property, companyInfo?: any) {
    const blob = this.generateInvoicePDF(invoice, tenant, property, companyInfo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadTrusteeFeesInvoice(invoice: TrusteeFeesInvoice, companyInfo?: any) {
    const blob = this.generateTrusteeFeesInvoicePDF(invoice, companyInfo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustee-fees-${invoice.invoice_number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadReceipt(payment: Payment, tenant: Tenant, invoice?: Invoice, companyInfo?: any) {
    const blob = this.generateReceiptPDF(payment, tenant, invoice, companyInfo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadReport(
    reportData: TransactionItem[],
    totals: ReportTotals,
    property: Property,
    startDate: string,
    endDate: string,
    description?: string,
    currency: string = 'USD',
    companyInfo?: any
  ) {
    const blob = this.generateReportPDF(reportData, totals, property, startDate, endDate, description, currency, companyInfo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${property.name}-${new Date(startDate).toISOString().split('T')[0]}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const enhancedPdfGenerator = new EnhancedPDFGenerator();

// Export individual functions for convenience
export const generateInvoicePDF = (data: any, companyInfo?: any): Promise<Blob> => {
  return Promise.resolve(enhancedPdfGenerator.generateInvoicePDF(data, data.tenant, data.property, companyInfo));
};

export const generateTrusteeFeesInvoicePDF = (data: any, companyInfo?: any): Promise<Blob> => {
  return Promise.resolve(enhancedPdfGenerator.generateTrusteeFeesInvoicePDF(data, companyInfo));
};

export const generateReceiptPDF = (data: any, companyInfo?: any): Promise<Blob> => {
  return Promise.resolve(enhancedPdfGenerator.generateReceiptPDF(data, data.tenant, data.invoice, companyInfo));
};

export const generateReportPDF = (data: any, companyInfo?: any): Promise<Blob> => {
  return Promise.resolve(enhancedPdfGenerator.generateReportPDF(
    data.reportData,
    data.totals,
    data.property,
    data.startDate,
    data.endDate,
    data.description,
    data.currency,
    companyInfo
  ));
};
