import type { Order } from "@/types/restaurant";
import type { RestaurantSettings } from "@/types/settings";

type CompanyLegalInfo = {
  legalName: string;
  registrationNumber: string;
  taxId: string;
  email: string;
  website: string;
};

const defaultCompanyLegalInfo: CompanyLegalInfo = {
  legalName: "RestroCore Inc.",
  registrationNumber: "REG-00000000",
  taxId: "VAT-00000000",
  email: "billing@restrocore.example",
  website: "https://restrocore.example",
};

function safeText(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : "—";
}

function invoiceNumberFromOrderId(orderId: string): string {
  const suffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-10) || orderId;
  return `INV-${suffix}`.toUpperCase();
}

function formatDateTime(iso: string, timeZone: string): string {
  const dt = new Date(iso);
  if (!Number.isFinite(dt.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone }).format(dt);
}

export async function downloadInvoicePdf({
  order,
  settings,
  legal = defaultCompanyLegalInfo,
}: {
  order: Order;
  settings: RestaurantSettings;
  legal?: CompanyLegalInfo;
}) {
  const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new JsPdf({ orientation: "p", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const brand = { r: 15, g: 23, b: 42 };
  const subtle = { r: 100, g: 116, b: 139 };
  const border = { r: 226, g: 232, b: 240 };
  const headerBg = { r: 248, g: 250, b: 252 };

  const money = new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency });
  const invoiceNo = invoiceNumberFromOrderId(order.id);
  const issueDate = formatDateTime(order.createdAt, settings.timezone);

  const computedSubtotal = order.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const subtotal = Number.isFinite(order.subtotal) ? order.subtotal : computedSubtotal;
  const tax = Number.isFinite(order.tax) ? order.tax : 0;
  const discount = Number.isFinite(order.discount) ? order.discount : 0;
  const total = Number.isFinite(order.total) ? order.total : subtotal + tax - discount;
  const taxRatePct = subtotal > 0 && tax > 0 ? (tax / subtotal) * 100 : settings.taxRate;

  const headerH = 28;
  doc.setFillColor(headerBg.r, headerBg.g, headerBg.b);
  doc.rect(0, 0, pageWidth, headerH, "F");
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.2);
  doc.line(0, headerH, pageWidth, headerH);

  doc.setTextColor(brand.r, brand.g, brand.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(settings.restaurantName, marginX, 13);

  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(safeText(settings.address), marginX, 19, { maxWidth: pageWidth - marginX * 2 });
  doc.text(`Phone: ${safeText(settings.phone)}`, marginX, 24);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Invoice", pageWidth - marginX, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.text(`Invoice #: ${invoiceNo}`, pageWidth - marginX, 19, { align: "right" });
  doc.text(`Date: ${issueDate}`, pageWidth - marginX, 24, { align: "right" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", marginX, headerH + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(safeText(order.customerName), marginX, headerH + 20);
  doc.setFontSize(9);
  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.text(`Phone: ${safeText(order.customerPhone)}`, marginX, headerH + 25);
  doc.text("Billing address: Not provided", marginX, headerH + 30);

  const metaX = pageWidth / 2 + 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment & Order", metaX, headerH + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.text(`Order ID: ${order.id}`, metaX, headerH + 20);
  doc.text(`Order type: ${order.type.toUpperCase()}`, metaX, headerH + 25);
  doc.text(`Status: ${order.status.toUpperCase()}`, metaX, headerH + 30);
  doc.text(`Payment: ${safeText(order.paymentMethod)?.toUpperCase()}`, metaX, headerH + 35);

  const startY = headerH + 46;
  const body = order.items.map((it, idx) => {
    const modifierLines =
      (it.modifiers || [])
        .map((m) => `${m.name}: ${m.choice}${m.price ? ` (${money.format(m.price)})` : ""}`)
        .join("\n") || "";
    const notes = (it.notes || "").trim();
    const details = [modifierLines, notes].filter((s) => s.length > 0).join("\n");
    const description = details.length > 0 ? `${it.name}\n${details}` : it.name;
    const lineTotal = it.qty * it.price + (it.modifiers?.reduce((s, m) => s + (m.price || 0), 0) || 0);
    return [String(idx + 1), description, String(it.qty), money.format(it.price), money.format(lineTotal)];
  });

  autoTable(doc, {
    startY,
    head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
    body,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top",
      lineColor: [border.r, border.g, border.b],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [headerBg.r, headerBg.g, headerBg.b],
      textColor: 0,
      fontStyle: "bold",
      lineColor: [border.r, border.g, border.b],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [253, 253, 254] },
    columnStyles: {
      0: { cellWidth: 10, halign: "right" },
      1: { cellWidth: pageWidth - marginX * 2 - (10 + 18 + 30 + 30) },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: marginX, right: marginX },
    didDrawPage: () => {
      const page = doc.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(subtle.r, subtle.g, subtle.b);
      doc.text(
        `${legal.legalName} · Reg: ${legal.registrationNumber} · Tax: ${legal.taxId} · ${legal.website} · ${legal.email}`,
        marginX,
        pageHeight - 10,
        { maxWidth: pageWidth - marginX * 2 },
      );
      doc.text(`Page ${page}`, pageWidth - marginX, pageHeight - 10, { align: "right" });
    },
  });

  const afterTableY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 6;
  const totalsX = pageWidth - marginX;
  const labelX = totalsX - 55;
  const lineGap = 6;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text("Subtotal", labelX, afterTableY);
  doc.text(money.format(subtotal), totalsX, afterTableY, { align: "right" });

  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.setFontSize(9);
  doc.text(`Tax (${taxRatePct.toFixed(1)}%)`, labelX, afterTableY + lineGap);
  doc.text(money.format(tax), totalsX, afterTableY + lineGap, { align: "right" });

  if (discount > 0) {
    doc.text("Discount", labelX, afterTableY + lineGap * 2);
    doc.text(`-${money.format(discount)}`, totalsX, afterTableY + lineGap * 2, { align: "right" });
  }

  const totalY = afterTableY + lineGap * (discount > 0 ? 3 : 2) + 2;
  doc.setDrawColor(border.r, border.g, border.b);
  doc.line(labelX, totalY - 4, totalsX, totalY - 4);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", labelX, totalY);
  doc.text(money.format(total), totalsX, totalY, { align: "right" });

  const paymentY = totalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Payment information", marginX, paymentY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(subtle.r, subtle.g, subtle.b);
  doc.text(
    `Method: ${safeText(order.paymentMethod)?.toUpperCase()} · Currency: ${settings.currency} · Issued: ${issueDate}`,
    marginX,
    paymentY + 6,
    { maxWidth: pageWidth - marginX * 2 },
  );

  doc.save(`invoice-${invoiceNo}.pdf`);
}
