import React, { useState, useEffect } from 'react';
import { 
  Invoice, 
  NewDbInvoice, 
  UpdateDbInvoice,
  InvoiceStatus,
  InvoiceItem,
  NewDbInvoiceItem
} from '../../types/payment';
import Button from '../shared/Button';
import { formatDateToInput } from '../../utils/dateHelpers';
import { generateInvoiceNumber } from '../../api/invoices';
import { supabase } from '../../lib/supabase';

interface InvoiceFormProps {
  invoice?: Invoice;
  patientId: string;
  consultationId?: string;
  onSubmit: (
    invoiceData: Omit<NewDbInvoice, 'invoice_number'>, 
    invoiceItems: Omit<NewDbInvoiceItem, 'invoice_id'>[]
  ) => Promise<void>;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  patientId,
  consultationId,
  onSubmit,
  onCancel
}) => {
  // Invoice data
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoiceDate || formatDateToInput(new Date()));
  const [dueDate, setDueDate] = useState(invoice?.dueDate || formatDateToInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [currency, setCurrency] = useState(invoice?.currency || 'INR');
  const [taxAmount, setTaxAmount] = useState(invoice?.taxAmount || 0);
  const [discountAmount, setDiscountAmount] = useState(invoice?.discountAmount || 0);
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || InvoiceStatus.DRAFT);
  
  // Invoice items
  const [items, setItems] = useState<Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>>(invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' }
  ];

  const statusOptions = [
    { value: InvoiceStatus.DRAFT, label: getBilingualLabel('Draft', 'வரைவு') },
    { value: InvoiceStatus.SENT, label: getBilingualLabel('Sent', 'அனுப்பப்பட்டது') },
    { value: InvoiceStatus.PAID, label: getBilingualLabel('Paid', 'செலுத்தப்பட்டது') },
    { value: InvoiceStatus.OVERDUE, label: getBilingualLabel('Overdue', 'தாமதமானது') },
    { value: InvoiceStatus.CANCELLED, label: getBilingualLabel('Cancelled', 'ரத்து செய்யப்பட்டது') }
  ];

  // Calculate subtotal and total whenever items, tax, or discount changes
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    setSubtotal(newSubtotal);
    
    const newTotal = newSubtotal + taxAmount - discountAmount;
    setTotal(newTotal > 0 ? newTotal : 0);
  }, [items, taxAmount, discountAmount]);

  // Update item amount when quantity or unit price changes
  const updateItemAmount = (index: number, quantity: number, unitPrice: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].unitPrice = unitPrice;
    newItems[index].amount = quantity * unitPrice;
    setItems(newItems);
  };

  // Add a new item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  // Remove an item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate items
      if (items.some(item => !item.description.trim())) {
        throw new Error(getBilingualLabel('All items must have a description', 'அனைத்து பொருட்களுக்கும் விளக்கம் இருக்க வேண்டும்'));
      }
      
      const invoiceData: Omit<NewDbInvoice, 'invoice_number'> = {
        patient_id: patientId,
        consultation_id: consultationId || null,
        invoice_date: invoiceDate,
        due_date: dueDate,
        amount: subtotal,
        currency,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total,
        status,
        payment_id: null,
        notes: notes || null
      };
      
      const invoiceItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount
      }));
      
      await onSubmit(invoiceData, invoiceItems);
    } catch (err: any) {
      console.error('Error submitting invoice:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="invoiceDate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Invoice Date", "விலைப்பட்டியல் தேதி")} *
          </label>
          <input
            type="date"
            id="invoiceDate"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Due Date", "செலுத்த வேண்டிய தேதி")} *
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            min={invoiceDate}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Currency", "நாணயம்")} *
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Invoice Items */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-slate-900">
            {getBilingualLabel("Invoice Items", "விலைப்பட்டியல் பொருட்கள்")}
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addItem}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {getBilingualLabel("Add Item", "பொருளைச் சேர்")}
          </Button>
        </div>
        
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
                <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {getBilingualLabel("Actions", "செயல்கள்")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.target.value;
                        setItems(newItems);
                      }}
                      required
                      className="block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 0;
                        updateItemAmount(index, quantity, item.unitPrice);
                      }}
                      min="1"
                      required
                      className="block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const unitPrice = parseFloat(e.target.value) || 0;
                        updateItemAmount(index, item.quantity, unitPrice);
                      }}
                      min="0"
                      step="0.01"
                      required
                      className="block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <span className="text-sm text-slate-900">
                      {item.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                      className="text-red-600 hover:text-red-900 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
            {currency === 'INR' ? '₹' : 
             currency === 'USD' ? '$' : 
             currency === 'EUR' ? '€' : 
             currency === 'GBP' ? '£' : ''}
            {subtotal.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-700 mr-2">
              {getBilingualLabel("Tax", "வரி")}:
            </span>
            <input
              type="number"
              value={taxAmount}
              onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-24 px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <span className="text-sm text-slate-900">
            {currency === 'INR' ? '₹' : 
             currency === 'USD' ? '$' : 
             currency === 'EUR' ? '€' : 
             currency === 'GBP' ? '£' : ''}
            {taxAmount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-700 mr-2">
              {getBilingualLabel("Discount", "தள்ளுபடி")}:
            </span>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              min="0"
              max={subtotal + taxAmount}
              step="0.01"
              className="w-24 px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <span className="text-sm text-slate-900">
            {currency === 'INR' ? '₹' : 
             currency === 'USD' ? '$' : 
             currency === 'EUR' ? '€' : 
             currency === 'GBP' ? '£' : ''}
            {discountAmount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-base font-bold text-slate-900">
            {getBilingualLabel("Total", "மொத்தம்")}:
          </span>
          <span className="text-base font-bold text-slate-900">
            {currency === 'INR' ? '₹' : 
             currency === 'USD' ? '$' : 
             currency === 'EUR' ? '€' : 
             currency === 'GBP' ? '£' : ''}
            {total.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Status", "நிலை")} *
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Notes", "குறிப்புகள்")}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {invoice ? 
            getBilingualLabel("Update Invoice", "விலைப்பட்டியலைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கவும்")
          }
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;