import React, { useState } from 'react';
import { 
  Payment, 
  NewDbPayment, 
  UpdateDbPayment,
  PaymentStatus,
  PaymentMethod
} from '../../types/payment';
import Button from '../shared/Button';
import { formatDateToInput } from '../../utils/dateHelpers';

interface PaymentFormProps {
  payment?: Payment;
  patientId: string;
  consultationId?: string;
  onSubmit: (data: NewDbPayment | UpdateDbPayment) => Promise<void>;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  payment,
  patientId,
  consultationId,
  onSubmit,
  onCancel
}) => {
  const [amount, setAmount] = useState(payment?.amount || 0);
  const [currency, setCurrency] = useState(payment?.currency || 'INR');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(payment?.paymentMethod || PaymentMethod.CASH);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(payment?.paymentStatus || PaymentStatus.PENDING);
  const [transactionId, setTransactionId] = useState(payment?.transactionId || '');
  const [paymentDate, setPaymentDate] = useState(payment?.paymentDate || formatDateToInput(new Date()));
  const [notes, setNotes] = useState(payment?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const paymentMethodOptions = [
    { value: PaymentMethod.CREDIT_CARD, label: getBilingualLabel('Credit Card', 'கிரெடிட் கார்டு') },
    { value: PaymentMethod.DEBIT_CARD, label: getBilingualLabel('Debit Card', 'டெபிட் கார்டு') },
    { value: PaymentMethod.BANK_TRANSFER, label: getBilingualLabel('Bank Transfer', 'வங்கி பரிமாற்றம்') },
    { value: PaymentMethod.CASH, label: getBilingualLabel('Cash', 'பணம்') },
    { value: PaymentMethod.INSURANCE, label: getBilingualLabel('Insurance', 'காப்பீடு') },
    { value: PaymentMethod.OTHER, label: getBilingualLabel('Other', 'மற்றவை') }
  ];

  const paymentStatusOptions = [
    { value: PaymentStatus.PENDING, label: getBilingualLabel('Pending', 'நிலுவையில்') },
    { value: PaymentStatus.COMPLETED, label: getBilingualLabel('Completed', 'முடிக்கப்பட்டது') },
    { value: PaymentStatus.FAILED, label: getBilingualLabel('Failed', 'தோல்வியடைந்தது') },
    { value: PaymentStatus.REFUNDED, label: getBilingualLabel('Refunded', 'திருப்பி அளிக்கப்பட்டது') },
    { value: PaymentStatus.CANCELLED, label: getBilingualLabel('Cancelled', 'ரத்து செய்யப்பட்டது') }
  ];

  const currencyOptions = [
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const paymentData: NewDbPayment | UpdateDbPayment = {
        patient_id: patientId,
        consultation_id: consultationId || null,
        amount,
        currency,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        transaction_id: transactionId || null,
        payment_date: paymentDate || null,
        notes: notes || null
      };
      
      await onSubmit(paymentData);
    } catch (err: any) {
      console.error('Error submitting payment:', err);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Amount", "தொகை")} *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-500 sm:text-sm">
                {currency === 'INR' ? '₹' : 
                 currency === 'USD' ? '$' : 
                 currency === 'EUR' ? '€' : 
                 currency === 'GBP' ? '£' : ''}
              </span>
            </div>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
              className="pl-7 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Payment Method", "கட்டண முறை")} *
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Payment Status", "கட்டண நிலை")} *
          </label>
          <select
            id="paymentStatus"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {paymentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Transaction ID", "பரிவர்த்தனை ஐடி")}
          </label>
          <input
            type="text"
            id="transactionId"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Payment Date", "கட்டண தேதி")} *
          </label>
          <input
            type="date"
            id="paymentDate"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Notes", "குறிப்புகள்")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {payment ? 
            getBilingualLabel("Update Payment", "கட்டணத்தைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;