import React from 'react';
import { Invoice, InvoiceStatus } from '../../types/payment';
import Button from '../shared/Button';
import { formatReadableDate } from '../../utils/dateHelpers';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface InvoiceViewerProps {
  invoice: Invoice;
  onClose: () => void;
  onMarkAsPaid?: (invoiceId: string) => Promise<void>;
}

const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoice,
  onClose,
  onMarkAsPaid
}) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '';
    }
  };

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT:
        return 'bg-slate-100 text-slate-800';
      case InvoiceStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case InvoiceStatus.PAID:
        return 'bg-green-100 text-green-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case InvoiceStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('MedRemind Hub', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('INVOICE', 105, 30, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 15, 45);
    doc.text(`Date: ${formatReadableDate(new Date(invoice.invoiceDate))}`, 15, 50);
    doc.text(`Due Date: ${formatReadableDate(new Date(invoice.dueDate))}`, 15, 55);
    
    // Add patient details
    doc.text('Bill To:', 15, 65);
    doc.text(`${invoice.patientName || 'Patient'}`, 15, 70);
    
    // Add invoice items
    const tableColumn = ["Description", "Qty", "Unit Price", "Amount"];
    const tableRows: any[] = [];
    
    invoice.items?.forEach(item => {
      const itemData = [
        item.description,
        item.quantity,
        `${getCurrencySymbol(invoice.currency)}${item.unitPrice.toFixed(2)}`,
        `${getCurrencySymbol(invoice.currency)}${item.amount.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 135, 245] }
    });
    
    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${getCurrencySymbol(invoice.currency)}${invoice.amount.toFixed(2)}`, 140, finalY);
    doc.text(`Tax: ${getCurrencySymbol(invoice.currency)}${invoice.taxAmount.toFixed(2)}`, 140, finalY + 5);
    doc.text(`Discount: ${getCurrencySymbol(invoice.currency)}${invoice.discountAmount.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Total: ${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)}`, 140, finalY + 15);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 105, finalY + 30, { align: 'center' });
    
    // Save the PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  const handleMarkAsPaid = async () => {
    if (onMarkAsPaid) {
      await onMarkAsPaid(invoice.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {getBilingualLabel("Invoice", "விலைப்பட்டியல்")}: {invoice.invoiceNumber}
          </h3>
          <div className="mt-1 text-sm text-slate-500">
            <p>{getBilingualLabel("Date", "தேதி")}: {formatReadableDate(new Date(invoice.invoiceDate))}</p>
            <p>{getBilingualLabel("Due Date", "செலுத்த வேண்டிய தேதி")}: {formatReadableDate(new Date(invoice.dueDate))}</p>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
      </div>
      
      {/* Patient Information */}
      <div className="bg-slate-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          {getBilingualLabel("Bill To", "பில் செய்யப்பட்டவர்")}
        </h4>
        <p className="text-sm text-slate-900">{invoice.patientName}</p>
      </div>
      
      {/* Invoice Items */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          {getBilingualLabel("Items", "பொருட்கள்")}
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {getBilingualLabel("Description", "விளக்கம்")}
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {getBilingualLabel("Quantity", "அளவு")}
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {getBilingualLabel("Unit Price", "அலகு விலை")}
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {getBilingualLabel("Amount", "தொகை")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {invoice.items?.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                    {item.description}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                    {getCurrencySymbol(invoice.currency)}{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900 text-right">
                    {getCurrencySymbol(invoice.currency)}{item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Totals */}
      <div className="bg-slate-50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            {getBilingualLabel("Subtotal", "துணைத்தொகை")}:
          </span>
          <span className="text-sm text-slate-900">
            {getCurrencySymbol(invoice.currency)}{invoice.amount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            {getBilingualLabel("Tax", "வரி")}:
          </span>
          <span className="text-sm text-slate-900">
            {getCurrencySymbol(invoice.currency)}{invoice.taxAmount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            {getBilingualLabel("Discount", "தள்ளுபடி")}:
          </span>
          <span className="text-sm text-slate-900">
            {getCurrencySymbol(invoice.currency)}{invoice.discountAmount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-base font-bold text-slate-900">
            {getBilingualLabel("Total", "மொத்தம்")}:
          </span>
          <span className="text-base font-bold text-slate-900">
            {getCurrencySymbol(invoice.currency)}{invoice.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Notes */}
      {invoice.notes && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            {getBilingualLabel("Notes", "குறிப்புகள்")}
          </h4>
          <p className="text-sm text-slate-600">{invoice.notes}</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          {getBilingualLabel("Close", "மூடு")}
        </Button>
        <Button type="button" variant="primary" onClick={handleDownloadPDF}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {getBilingualLabel("Download PDF", "PDF ஐப் பதிவிறக்கு")}
        </Button>
        {invoice.status !== InvoiceStatus.PAID && onMarkAsPaid && (
          <Button type="button" variant="success" onClick={handleMarkAsPaid}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {getBilingualLabel("Mark as Paid", "செலுத்தப்பட்டதாகக் குறிக்கவும்")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default InvoiceViewer;