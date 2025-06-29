import React, { useState } from 'react';
import Button from '../shared/Button';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  patientId: string;
  consultationId?: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  patientId,
  consultationId,
  onSuccess,
  onCancel
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // This is a mock implementation
      // In a real application, you would use Stripe.js to collect card details securely
      // and send a payment intent to your backend
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful payment
      const mockPaymentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
      onSuccess(mockPaymentId);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry as MM/YY
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-slate-50 p-4 rounded-md mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">
            {getBilingualLabel("Amount to Pay", "செலுத்த வேண்டிய தொகை")}:
          </span>
          <span className="text-lg font-bold text-slate-900">
            {getCurrencySymbol(currency)}{amount.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Name on Card", "அட்டையில் உள்ள பெயர்")} *
        </label>
        <input
          type="text"
          id="cardName"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Card Number", "அட்டை எண்")} *
        </label>
        <input
          type="text"
          id="cardNumber"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cardExpiry" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Expiry Date", "காலாவதி தேதி")} *
          </label>
          <input
            type="text"
            id="cardExpiry"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="cardCvc" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("CVC", "சிவிசி")} *
          </label>
          <input
            type="text"
            id="cardCvc"
            value={cardCvc}
            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
            placeholder="123"
            maxLength={4}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {getBilingualLabel("Pay Now", "இப்போது செலுத்து")}
        </Button>
      </div>
    </form>
  );
};

export default StripePaymentForm;