import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import InvoiceForm from '../../components/payment/InvoiceForm';
import InvoiceViewer from '../../components/payment/InvoiceViewer';
import { formatReadableDate } from '../../utils/dateHelpers';

// Types
import {
  Invoice,
  NewDbInvoice,
  InvoiceStatus,
  NewDbInvoiceItem
} from '../../types/payment';
import { Patient } from '../../types';

// API functions
import * as InvoiceAPI from '../../api/invoices';
import * as PatientAPI from '../../api/patients';
import * as PaymentAPI from '../../api/payments';

interface InvoicesPageProps {
  user: User;
  onLogout: () => void;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ user, onLogout }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    paidCount: 0,
    paidAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    draftCount: 0
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
      
      // Fetch invoices for selected patient or all invoices
      let invoicesQuery = supabase
        .from('invoices')
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
        invoicesQuery = invoicesQuery.eq('patient_id', selectedPatientId);
      }
      
      const { data: invoicesData, error: invoicesError } = await invoicesQuery.order('created_at', { ascending: false });
      
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
      
      // Fetch statistics
      const stats = await InvoiceAPI.getInvoiceStatistics(user.id);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Invoices data fetch error:', err.message);
      setError(getBilingualLabel('Failed to load data:', 'தரவை ஏற்ற முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedPatientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddInvoice = async (
    invoiceData: Omit<NewDbInvoice, 'invoice_number'>, 
    invoiceItems: Omit<NewDbInvoiceItem, 'invoice_id'>[]
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await InvoiceAPI.createInvoice(invoiceData, invoiceItems, user.id);
      if (error) throw error;
      
      setIsAddInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Add invoice error:', err.message);
      setError(getBilingualLabel('Failed to add invoice:', 'விலைப்பட்டியலைச் சேர்க்க முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await InvoiceAPI.getInvoiceById(invoiceId, user.id);
      if (error) throw error;
      
      setSelectedInvoice(data);
      setIsViewInvoiceModalOpen(true);
    } catch (err: any) {
      console.error('View invoice error:', err.message);
      setError(getBilingualLabel('Failed to load invoice:', 'விலைப்பட்டியலை ஏற்ற முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a payment record
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const { data: payment, error: paymentError } = await PaymentAPI.addPayment({
        patient_id: invoice.patientId,
        consultation_id: invoice.consultationId,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        payment_method: 'cash',
        payment_status: 'completed',
        payment_date: new Date().toISOString(),
        notes: `Payment for invoice ${invoice.invoiceNumber}`
      }, user.id);
      
      if (paymentError) throw paymentError;
      
      // Mark invoice as paid
      const { error: invoiceError } = await InvoiceAPI.markInvoiceAsPaid(invoiceId, payment.id, user.id);
      if (invoiceError) throw invoiceError;
      
      setIsViewInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Mark as paid error:', err.message);
      setError(getBilingualLabel('Failed to mark invoice as paid:', 'விலைப்பட்டியலை செலுத்தப்பட்டதாகக் குறிக்க முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
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
      currentPage="invoices"
      breadcrumbs={[
        { label: getBilingualLabel('Invoices', 'விலைப்பட்டியல்கள்') }
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
            {getBilingualLabel("Invoices", "விலைப்பட்டியல்கள்")}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={() => setIsAddInvoiceModalOpen(true)} variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கு")}
            </Button>
            <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Paid Invoices", "செலுத்தப்பட்ட விலைப்பட்டியல்கள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.paidCount}</p>
                <p className="text-sm text-slate-500">₹{statistics.paidAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Overdue Invoices", "தாமதமான விலைப்பட்டியல்கள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.overdueCount}</p>
                <p className="text-sm text-slate-500">₹{statistics.overdueAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Draft Invoices", "வரைவு விலைப்பட்டியல்கள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.draftCount}</p>
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
      
      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No invoices found", "விலைப்பட்டியல்கள் எதுவும் கிடைக்கவில்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("Get started by creating an invoice", "விலைப்பட்டியலை உருவாக்குவதன் மூலம் தொடங்கவும்")}
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddInvoiceModalOpen(true)} variant="primary">
                {getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கு")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Invoice #", "விலைப்பட்டியல் #")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Patient", "நோயாளி")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Date", "தேதி")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Due Date", "செலுத்த வேண்டிய தேதி")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Amount", "தொகை")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Status", "நிலை")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Actions", "செயல்கள்")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-sky-600">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{invoice.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {formatReadableDate(new Date(invoice.invoiceDate))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {formatReadableDate(new Date(invoice.dueDate))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {getCurrencySymbol(invoice.currency)}{invoice.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleViewInvoice(invoice.id)}
                        variant="primary"
                        size="sm"
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
      
      {/* Add Invoice Modal */}
      <Modal
        isOpen={isAddInvoiceModalOpen}
        onClose={() => setIsAddInvoiceModalOpen(false)}
        title={getBilingualLabel("Create Invoice", "விலைப்பட்டியலை உருவாக்கு")}
        size="2xl"
      >
        <InvoiceForm
          patientId={selectedPatientId || (patients.length > 0 ? patients[0].id : '')}
          onSubmit={handleAddInvoice}
          onCancel={() => setIsAddInvoiceModalOpen(false)}
        />
      </Modal>
      
      {/* View Invoice Modal */}
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
            onMarkAsPaid={handleMarkAsPaid}
          />
        )}
      </Modal>
    </MainLayout>
  );
};

export default InvoicesPage;