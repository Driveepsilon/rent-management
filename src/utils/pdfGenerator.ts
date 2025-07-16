import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export class PDFGenerator {
  private addHeader(doc: jsPDF, title: string) {
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text(title, 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 40);
    
    // Add a line under the header
    doc.setDrawColor(79, 70, 229);
    doc.line(20, 45, 190, 45);
  }

  private addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Property Management System - Confidential Document', 20, pageHeight - 20);
  }

  generateInvoicePDF(invoice: Invoice, tenant: Tenant, property: Property): void {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'INVOICE');
    
    // Invoice details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 60);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 20, 70);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 80);
    
    // Bill to section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Bill To:', 20, 100);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(tenant.tenant_name, 20, 110);
    doc.text(tenant.email, 20, 120);
    if (tenant.phone) doc.text(tenant.phone, 20, 130);
    if (tenant.address) doc.text(tenant.address, 20, 140);
    
    // Property details
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Property:', 120, 100);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(property.name, 120, 110);
    doc.text(property.address, 120, 120);
    
    // Invoice items table
    const tableData = [
      ['Description', 'Period', 'Months', 'Amount'],
      [invoice.description, invoice.rent_period, invoice.rent_months.toString(), `$${invoice.amount.toFixed(2)}`],
      ['Late Fee', '', '', `$${invoice.late_fee.toFixed(2)}`]
    ];
    
    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 160,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 }
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: $${(invoice.amount + invoice.late_fee).toFixed(2)}`, 150, finalY + 20);
    
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
        doc.text(line, 20, finalY + 70 + (index * 10));
      });
    }
    
    this.addFooter(doc);
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
  }

  generateReceiptPDF(payment: Payment, tenant: Tenant, invoice?: Invoice): void {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'PAYMENT RECEIPT');
    
    // Receipt details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt Number: RCP-${payment.id}`, 20, 60);
    doc.text(`Payment Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 20, 70);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 80);
    
    // Received from section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Received From:', 20, 100);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(tenant.tenant_name, 20, 110);
    doc.text(tenant.email, 20, 120);
    if (tenant.phone) doc.text(tenant.phone, 20, 130);
    
    // Payment details table
    const tableData = [
      ['Description', 'Amount'],
      ['Payment Amount', `$${payment.amount.toFixed(2)}`],
      ['Payment Method', payment.payment_method],
      ['Reference Number', payment.reference_number || 'N/A'],
      ['Invoice Number', invoice?.invoice_number || 'N/A']
    ];
    
    autoTable(doc, {
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 150,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Green color for receipts
      margin: { left: 20 }
    });
    
    // Notes
    if (payment.notes) {
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('Notes:', 20, finalY + 20);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const noteLines = payment.notes.split('\n');
      noteLines.forEach((line, index) => {
        doc.text(line, 20, finalY + 30 + (index * 10));
      });
    }
    
    // Thank you message
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.text('Thank you for your payment!', 20, finalY + 60);
    
    this.addFooter(doc);
    doc.save(`receipt-${payment.id}.pdf`);
  }

  generateReportPDF(
    reportData: TransactionItem[],
    totals: ReportTotals,
    property: Property,
    startDate: string,
    endDate: string,
    description?: string
  ): void {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'PROPERTY FINANCIAL REPORT');
    
    // Report details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Property: ${property.name}`, 20, 60);
    doc.text(`Address: ${property.address}`, 20, 70);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 20, 80);
    if (description) doc.text(`Description: ${description}`, 20, 90);
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Financial Summary', 20, 110);
    
    const summaryData = [
      ['Category', 'Amount'],
      ['Total Income', `$${totals.totalIncome.toLocaleString()}`],
      ['Total Expenses', `$${totals.totalExpenses.toLocaleString()}`],
      ['Net Balance', `$${totals.netBalance.toLocaleString()}`]
    ];
    
    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 120,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });
    
    // Transactions table
    let finalY = (doc as any).lastAutoTable.finalY || 180;
    finalY += 20;
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text('Detailed Transactions', 20, finalY);
    
    const transactionData = reportData.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type === 'income' ? 'Income' : 'Expense',
      transaction.description,
      transaction.category || '-',
      `${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toLocaleString()}`,
      `$${transaction.balance.toLocaleString()}`
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
    
    this.addFooter(doc);
    doc.save(`property-report-${property.name.replace(/\s+/g, '-')}-${new Date(startDate).toISOString().split('T')[0]}-to-${new Date(endDate).toISOString().split('T')[0]}.pdf`);
  }
}

export const pdfGenerator = new PDFGenerator();
