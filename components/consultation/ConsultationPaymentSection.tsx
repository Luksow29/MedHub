import React, { useState, useEffect } from 'react';
import { Consultation } from '../../types';
import { Payment, Invoice, PaymentStatus } from '../../types/payment';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import PaymentForm from '../payment/PaymentForm';
import InvoiceForm from '../payment/InvoiceForm';
import InvoiceViewer from '../payment/InvoiceViewer';
import StripePaymentForm from '../payment/StripePaymentForm';
import { formatReadableDate } from '../../utils/dateHelpers';

// API functions
import * as PaymentAPI from '../../api/payments';
import * as InvoiceAPI from '../../api/invoices';

interface ConsultationPaymentSectionProps {
  consultation: Consultation;
  patientId: string;
  userId: string;
  onRefresh: () => void;
}

const ConsultationPaymentSection: React.FC<ConsultationPaymentSectionProps> = ({
  consultation,
  patientId,
  userId,
  onRefresh
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [isStripePaymentModalOpen, setIsStripePaymentModalOpen] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  useEffect(() => {
    fetchData();
  }, [consultation.id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch payments for this consultation
      const { data: paymentsData, error: paymentsError } = await PaymentAPI.getPaymentsByConsultationId(consultation.id, userId);
      if (paymentsError) throw paymentsError;
      
      const mappedPayments = paymentsData.map(p => ({
        id: p.id,
        userId: p.user_id,
        patientId: p.patient_id,
        consultationId: p.consultation_id,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.payment_method,
        paymentStatus: p.payment_status,
        transactionId: p.transaction_id,
        paymentDate: p.payment_date,
        notes: p.notes,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        patientName: p.patients?.name
      }));
      
      setPayments(mappedPayments);
      
      // Fetch invoices for this consultation
      const { data: invoicesData, error: invoicesError } = await InvoiceAPI.getInvoicesByConsultationId(consultation.id, userId);
      if (invoicesError) throw invoicesError;
      
      const mappedInvoices = invoicesData.map(i => ({
        id: i.id,
        userId: i.user_id,
        patientId: i.patient_id,
        consultationId: i.consultation_id,
        invoiceNumber: i.invoice_number,
        invoiceDate: i.invoice_date,
        dueDate: i.due_date,
        amount: i.amount,
        currency: i.currency,
        taxAmount: i.tax_amount,
        discountAmount: i.discount_amount,
        totalAmount: i.total_amount,
        status: i.status,
        paymentId: i.payment_id,
        notes: i.notes,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        patientName: i.patients?.name
      }));
      
      setInvoices(mappedInvoices);
    } catch (err: any) {
      console.error('Fetch payment data error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    try {
      const { error } = await PaymentAPI.addPayment(paymentData, userId);
      if (error) throw error;
      
      setIsAddPaymentModalOpen(false);
      fetchData();
      onRefresh();
    } catch (err: any) {
      console.error('Add payment error:', err.message);
      setError(err.message);
    }
  };

  const handleAddInvoice = async (invoiceData: any, invoiceItems: any[]) => {
    try {
      const { error } = await InvoiceAPI.createInvoice(invoiceData, invoiceItems, userId);
      if (error) throw error;
      
      setIsAddInvoiceModalOpen(false);
      fetchData();
      onRefresh();
    } catch (err: any) {
      console.error('Add invoice error:', err.message);
      setError(err.message);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await InvoiceAPI.getInvoiceById(invoiceId, userId);
      if (error) throw error;
      
      setSelectedInvoice(data);
      setIsViewInvoiceModalOpen(true);
    } catch (err: any) {
      console.error('View invoice error:', err.message);
      setError(err.message);
    }
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string) => {
    try {
      // Create a payment record
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const { data: payment, error: paymentError } = await PaymentAPI.addPayment({
        patient_id: patientId,
        consultation_id: consultation.id,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        payment_method: 'cash',
        payment_status: 'completed',
        payment_date: new Date().toISOString(),
        notes: `Payment for invoice ${invoice.invoiceNumber}`
      }, userId);
      
      if (paymentError) throw paymentError;
      
      // Mark invoice as paid
      const { error: invoiceError } = await InvoiceAPI.markInvoiceAsPaid(invoiceId, payment.id, userId);
      if (invoiceError) throw invoiceError;
      
      setIsViewInvoiceModalOpen(false);
      fetchData();
      onRefresh();
    } catch (err: any) {
      console.error('Mark as paid error:', err.message);
      setError(err.message);
    }
  };

  const handleStripePaymentSuccess = async (paymentId: string) => {
    try {
      // In a real app, this would be handled by a webhook
      // For now, we'll just create a payment record
      
      const { data: payment, error: paymentError } = await PaymentAPI.addPayment({
        patient_id: patientId,
        consultation_id: consultation.id,
        amount: 1000, // Example amount
        currency: 'INR',
        payment_method: 'credit_card',
        payment_status: 'completed',
        transaction_id: paymentId,
        payment_date: new Date().toISOString(),
        notes: 'Payment processed via Stripe'
      }, userId);
      
      if (paymentError) throw paymentError;
      
      setIsStripePaymentModalOpen(false);
      fetchData();
      onRefresh();
      
      alert(getBilingualLabel('Payment successful!', 'கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!'));
    } catch (err: any) {
      console.error('Stripe payment error:', err.message);
      setError(err.message);
    }
  };

  const getTotalPaid = () => {
    return payments
      .filter(p => p.paymentStatus === PaymentStatus.COMPLETED)
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getTotalDue = () => {
    return invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Payment Summary */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Total Paid", "மொத்தம் செலுத்தப்பட்டது")}
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {payments.length > 0 ? `${getCurrencySymbol(payments[0].currency)}${getTotalPaid().toFixed(2)}` : '₹0.00'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Total Due", "மொத்தம் செலுத்த வேண்டியது")}
            </h4>
            <p className="text-2xl font-bold text-red-600">
              {invoices.length > 0 ? `${getCurrencySymbol(invoices[0].currency)}${getTotalDue().toFixed(2)}` : '₹0.00'}
            </p>
          </div>
          
          <div className="flex items-end space-x-2">
            <Button onClick={() => setIsAddPaymentModalOpen(true)} variant="primary" size="sm">
              {getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")}
            </Button>
            <Button onClick={() => setIsAddInvoiceModalOpen(true)} variant="secondary" size="sm">
              {getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கு")}
            </Button>
            <Button onClick={() => setIsStripePaymentModalOpen(true)} variant="success" size="sm">
              {getBilingualLabel("Card Payment", "அட்டை கட்டணம்")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Payments List */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">
          {getBilingualLabel("Payments", "கட்டணங்கள்")}
        </h3>
        
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            {getBilingualLabel("No payments recorded for this consultation.", "இந்த ஆலோசனைக்கு கட்டணங்கள் எதுவும் பதிவு செய்யப்படவில்லை.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Date", "தேதி")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Amount", "தொகை")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Method", "முறை")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Status", "நிலை")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Notes", "குறிப்புகள்")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {payment.paymentDate ? formatReadableDate(new Date(payment.paymentDate)) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {getCurrencySymbol(payment.currency)}{payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Invoices List */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-3">
          {getBilingualLabel("Invoices", "விலைப்பட்டியல்கள்")}
        </h3>
        
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            {getBilingualLabel("No invoices created for this consultation.", "இந்த ஆலோசனைக்கு விலைப்பட்டியல்கள் எதுவும் உருவாக்கப்படவில்லை.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Invoice #", "விலைப்பட்டியல் #")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Date", "தேதி")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Due Date", "செலுத்த வேண்டிய தேதி")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Amount", "தொகை")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Status", "நிலை")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Actions", "செயல்கள்")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-600">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {formatReadableDate(new Date(invoice.invoiceDate))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {formatReadableDate(new Date(invoice.dueDate))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      {getCurrencySymbol(invoice.currency)}{invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        invoice.status === 'draft' ? 'bg-slate-100 text-slate-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                      <Button
                        onClick={() => handleViewInvoice(invoice.id)}
                        variant="primary"
                        size="xs"
                      >
                        {getBilingualLabel("View", "பார்க்கவும்")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title={getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")}
      >
        <PaymentForm
          patientId={patientId}
          consultationId={consultation.id}
          onSubmit={handleAddPayment}
          onCancel={() => setIsAddPaymentModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isAddInvoiceModalOpen}
        onClose={() => setIsAddInvoiceModalOpen(false)}
        title={getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கு")}
        size="2xl"
      >
        <InvoiceForm
          patientId={patientId}
          consultationId={consultation.id}
          onSubmit={handleAddInvoice}
          onCancel={() => setIsAddInvoiceModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isViewInvoiceModalOpen}
        onClose={() => setIsViewInvoiceModalOpen(false)}
        title={getBilingualLabel("Invoice Details", "விலைப்பட்டியல் விவரங்கள்")}
        size="2xl"
      >
        {selectedInvoice && (
          <InvoiceViewer
            invoice={selectedInvoice}
            onClose={() => setIsViewInvoiceModalOpen(false)}
            onMarkAsPaid={handleMarkInvoiceAsPaid}
          />
        )}
      </Modal>
      
      <Modal
        isOpen={isStripePaymentModalOpen}
        onClose={() => setIsStripePaymentModalOpen(false)}
        title={getBilingualLabel("Card Payment", "அட்டை கட்டணம்")}
      >
        <StripePaymentForm
          amount={1000} // Example amount
          currency="INR"
          patientId={patientId}
          consultationId={consultation.id}
          onSuccess={handleStripePaymentSuccess}
          onCancel={() => setIsStripePaymentModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ConsultationPaymentSection;