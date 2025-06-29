import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PaymentForm from '../../components/payment/PaymentForm';
import { formatReadableDate } from '../../utils/dateHelpers';

// Types
import {
  Payment,
  NewDbPayment,
  PaymentStatus,
  PaymentMethod
} from '../../types/payment';
import { Patient } from '../../types';

// API functions
import * as PaymentAPI from '../../api/payments';
import * as PatientAPI from '../../api/patients';

interface PaymentsPageProps {
  user: User;
  onLogout: () => void;
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0,
    totalRevenue: 0
  });

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      
      const mappedPatients = patientsData.map(p => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        dob: p.dob,
        gender: p.gender,
        phone: p.contact_phone,
        email: p.contact_email,
        address: p.address,
        emergencyContactName: p.emergency_contact_name,
        emergencyContactPhone: p.emergency_contact_phone,
        preferredLanguage: p.preferred_language,
        preferredContactMethod: p.preferred_contact_method,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      
      setPatients(mappedPatients);
      
      // Fetch payments for selected patient or all payments
      let paymentsQuery = supabase
        .from('payments')
        .select(`
          *,
          patients (
            id,
            name,
            contact_phone,
            contact_email
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false);
        
      if (selectedPatientId) {
        paymentsQuery = paymentsQuery.eq('patient_id', selectedPatientId);
      }
      
      const { data: paymentsData, error: paymentsError } = await paymentsQuery.order('created_at', { ascending: false });
      
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
      
      // Fetch statistics
      const stats = await PaymentAPI.getPaymentStatistics(user.id);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Payments data fetch error:', err.message);
      setError(getBilingualLabel('Failed to load data:', 'தரவை ஏற்ற முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedPatientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPayment = async (paymentData: NewDbPayment) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await PaymentAPI.addPayment(paymentData, user.id);
      if (error) throw error;
      
      setIsAddPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Add payment error:', err.message);
      setError(getBilingualLabel('Failed to add payment:', 'கட்டணத்தைச் சேர்க்க முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return getBilingualLabel('Credit Card', 'கிரெடிட் கார்டு');
      case PaymentMethod.DEBIT_CARD:
        return getBilingualLabel('Debit Card', 'டெபிட் கார்டு');
      case PaymentMethod.BANK_TRANSFER:
        return getBilingualLabel('Bank Transfer', 'வங்கி பரிமாற்றம்');
      case PaymentMethod.CASH:
        return getBilingualLabel('Cash', 'பணம்');
      case PaymentMethod.INSURANCE:
        return getBilingualLabel('Insurance', 'காப்பீடு');
      case PaymentMethod.OTHER:
        return getBilingualLabel('Other', 'மற்றவை');
      default:
        return method;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      [PaymentStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: getBilingualLabel('Pending', 'நிலுவையில்') },
      [PaymentStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', label: getBilingualLabel('Completed', 'முடிக்கப்பட்டது') },
      [PaymentStatus.FAILED]: { color: 'bg-red-100 text-red-800', label: getBilingualLabel('Failed', 'தோல்வியடைந்தது') },
      [PaymentStatus.REFUNDED]: { color: 'bg-purple-100 text-purple-800', label: getBilingualLabel('Refunded', 'திருப்பி அளிக்கப்பட்டது') },
      [PaymentStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', label: getBilingualLabel('Cancelled', 'ரத்து செய்யப்பட்டது') }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
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
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="payments"
      breadcrumbs={[
        { label: getBilingualLabel('Payments', 'கட்டணங்கள்') }
      ]}
      isLoading={isLoading}
    >
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Header with Statistics */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-semibold text-slate-800">
            {getBilingualLabel("Payments", "கட்டணங்கள்")}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={() => setIsAddPaymentModalOpen(true)} variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")}
            </Button>
            <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Today's Revenue", "இன்றைய வருவாய்")}</p>
                <p className="text-2xl font-semibold text-slate-900">₹{statistics.todayAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Monthly Revenue", "மாதாந்திர வருவாய்")}</p>
                <p className="text-2xl font-semibold text-slate-900">₹{statistics.monthAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Today's Payments", "இன்றைய கட்டணங்கள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.todayCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Total Revenue", "மொத்த வருவாய்")}</p>
                <p className="text-2xl font-semibold text-slate-900">₹{statistics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="patientFilter" className="block text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Filter by Patient", "நோயாளி மூலம் வடிகட்டு")}
            </label>
            <select
              id="patientFilter"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">{getBilingualLabel("All Patients", "அனைத்து நோயாளிகள்")}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Button
              onClick={() => setSelectedPatientId('')}
              variant="secondary"
              size="sm"
            >
              {getBilingualLabel("Clear Filters", "வடிகட்டிகளை அழிக்கவும்")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No payments found", "கட்டணங்கள் எதுவும் கிடைக்கவில்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("Get started by adding a payment", "கட்டணத்தைச் சேர்ப்பதன் மூலம் தொடங்கவும்")}
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddPaymentModalOpen(true)} variant="primary">
                {getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Patient", "நோயாளி")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Date", "தேதி")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Amount", "தொகை")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Method", "முறை")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Status", "நிலை")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Transaction ID", "பரிவர்த்தனை ஐடி")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{payment.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {payment.paymentDate ? formatReadableDate(new Date(payment.paymentDate)) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {getCurrencySymbol(payment.currency)}{payment.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(payment.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {payment.transactionId || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title={getBilingualLabel("Add Payment", "கட்டணத்தைச் சேர்")}
      >
        <PaymentForm
          patientId={selectedPatientId || (patients.length > 0 ? patients[0].id : '')}
          onSubmit={handleAddPayment}
          onCancel={() => setIsAddPaymentModalOpen(false)}
        />
      </Modal>
    </MainLayout>
  );
};

export default PaymentsPage;