import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Order } from '@/types/restaurant';

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  taxRate?: number;
  footerNote?: string;
  paperSize?: 'a4' | 'a5';
  compact?: boolean;
}

const defaultBusinessInfo: BusinessInfo = {
  name: 'DINELY RESTAURANT',
  address: '123 Gourmet Avenue, Culinary District, NY 10001',
  phone: '+1 (555) 123-4567',
  email: 'hello@dinely.com',
  website: 'www.dinely.com',
  taxId: 'TX-987654321',
  taxRate: 10,
  footerNote: 'Thank you for your business!',
  paperSize: 'a4',
  compact: true,
};

export const generateInvoice = (order: Order, businessInfo: BusinessInfo = defaultBusinessInfo) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: businessInfo.paperSize || 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = businessInfo.compact ? 12 : 15;
  let currentY = businessInfo.compact ? 16 : 20;

  // --- BLACK & WHITE THEME SETTINGS ---
  const textColorPrimary = 0; // Pure black
  const textColorSecondary = 60; // Dark gray
  const borderColor = 200; // Light gray for lines

  // --- HEADER SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(textColorPrimary);
  doc.text(businessInfo.name, margin, currentY);

  doc.setFontSize(28);
  doc.setTextColor(200); // Light gray for the watermark-like label
  doc.text('INVOICE', pageWidth - margin, currentY, { align: 'right' });

  currentY += 8;
  doc.setDrawColor(borderColor);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 10;

  // Business Details (Left)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColorSecondary);
  doc.text(businessInfo.address, margin, currentY);
  doc.text(`Phone: ${businessInfo.phone}`, margin, currentY + 4);
  doc.text(`Email: ${businessInfo.email}`, margin, currentY + 8);
  doc.text(`Tax ID: ${businessInfo.taxId}`, margin, currentY + 12);

  // Invoice Details (Right) - FIXED OVERLAPPING ISSUE
  const invoiceDate = format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm');
  const labelX = pageWidth - 75; // Moved label further left to prevent overlap
  const valueX = pageWidth - margin;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColorPrimary);
  doc.text('Invoice #:', labelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(order.id.toUpperCase(), valueX, currentY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', labelX, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceDate, valueX, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Order Type:', labelX, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(order.type.toUpperCase(), valueX, currentY + 8, { align: 'right' });

  if (order.tableId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Table:', labelX, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(order.tableId.toUpperCase(), valueX, currentY + 12, { align: 'right' });
  }

  currentY += 25;

  // --- ITEMS TABLE ---
  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
    body: order.items.map((item, index) => [
      index + 1,
      item.name,
      item.qty,
      `$${item.price.toFixed(2)}`,
      `$${(item.qty * item.price).toFixed(2)}`,
    ]),
    margin: { left: margin, right: margin },
    theme: 'plain', // Use plain theme to remove default backgrounds
    styles: {
      font: 'helvetica',
      fontSize: businessInfo.compact ? 8 : 9,
      cellPadding: 3,
      textColor: textColorPrimary,
      lineColor: borderColor,
      lineWidth: { bottom: 0.2 }, // Only bottom border
      fontStyle: 'normal', // Default style
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: textColorPrimary,
      lineWidth: { bottom: 0.5 }, // Thicker bottom border for header
    },
    bodyStyles: {
      fontStyle: 'bold', // Moderate font-weight as requested
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
    },
  });

  // --- TOTALS SECTION ---
  const docWithTable = doc as unknown as jsPDF & { lastAutoTable?: { finalY: number } };
  let finalY = (docWithTable.lastAutoTable?.finalY ?? currentY) + 8;
  const totalsLabelX = pageWidth - 60;
  const totalsValueX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setTextColor(textColorPrimary);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsLabelX, finalY);
  doc.text(`$${order.subtotal.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });

  // Discount (if any)
  if (order.discount > 0) {
    finalY += 5;
    doc.text('Discount:', totalsLabelX, finalY);
    doc.text(`-$${order.discount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
  }

  // Tax
  finalY += 5;
  doc.text(`Tax (${businessInfo.taxRate ?? 10}%):`, totalsLabelX, finalY);
  doc.text(`$${order.tax.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });

  // Total
  finalY += 8;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(totalsLabelX, finalY - 4, totalsValueX, finalY - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsLabelX, finalY);
  doc.text(`$${order.total.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });

  // Payment Method
  finalY += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', margin, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text((order.paymentMethod || 'N/A').toUpperCase(), margin + 30, finalY);

  // --- FOOTER SECTION ---
  const footerY = doc.internal.pageSize.getHeight() - 20;

  doc.setDrawColor(borderColor);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setTextColor(textColorSecondary);
  doc.text((businessInfo.footerNote || 'Thank you for your business!').trim(), pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text(`Invoice ID: ${order.id} • Printed on ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, footerY + 10, { align: 'center' });

  doc.save(`Invoice_${order.id.slice(-6)}.pdf`);
};
