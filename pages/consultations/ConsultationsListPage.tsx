import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import ConsultationForm from '../../components/consultation/ConsultationForm';
import { formatDateToInput } from '../../utils/dateHelpers';

// Types
import {
  Consultation,
  NewDbConsultation,
  Patient,
  ConsultationStatus
} from '../../types/index';

// API functions
import * as ConsultationAPI from '../../api/consultations';
import * as PatientAPI from '../../api/patients';

interface ConsultationsListPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationsListPage: React.FC<ConsultationsListPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddConsultationModalOpen, setIsAddConsultationModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'all'>('all');
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Statistics
  const [statistics, setStatistics] = useState({
    todayCount: 0,
    thisMonthCount: 0,
    completedCount: 0
  });

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch consultations and patients
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare filters
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (patientFilter) {
        filters.patientId = patientFilter;
      }
      if (dateFilter) {
        filters.startDate = dateFilter;
        // Set end date to the same day to filter for a specific date
        filters.endDate = dateFilter;
      }
      
      // Fetch consultations
      const { data: consultationsData, error: consultationsError } = await ConsultationAPI.getAllConsultations(user.id, filters);
      if (consultationsError) throw consultationsError;
      
      if (consultationsData) {
        const mappedConsultations = consultationsData.map(c => ({
          id: c.id,
          userId: c.user_id,
          patientId: c.patient_id,
          appointmentId: c.appointment_id,
          consultationDate: c.consultation_date,
          consultationTime: c.consultation_time,
          attendingPhysician: c.attending_physician,
          chiefComplaint: c.chief_complaint,
          status: c.status,
          followUpDate: c.follow_up_date,
          followUpNotes: c.follow_up_notes,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          patientName: c.patients?.name,
          patientDob: c.patients?.dob,
          patientGender: c.patients?.gender,
          patientPhone: c.patients?.contact_phone,
          patientEmail: c.patients?.contact_email
        }));
        
        setConsultations(mappedConsultations);
      }
      
      // Fetch patients for dropdown
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      
      if (patientsData) {
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
      }
      
      // Fetch statistics
      const stats = await ConsultationAPI.getConsultationStatistics(user.id);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Error fetching consultations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, statusFilter, patientFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a new consultation
  const handleAddConsultation = async (data: NewDbConsultation) => {
    try {
      const { error } = await ConsultationAPI.createConsultation(data, user.id);
      if (error) throw error;
      
      fetchData();
      setIsAddConsultationModalOpen(false);
      setSelectedAppointmentId(null);
    } catch (err: any) {
      console.error('Error creating consultation:', err);
      setError(err.message);
    }
  };

  // Create a consultation from an appointment
  const handleCreateFromAppointment = async (appointmentId: string) => {
    try {
      const { data, error } = await ConsultationAPI.createConsultationFromAppointment(appointmentId, user.id);
      if (error) throw error;
      
      fetchData();
      
      // Navigate to the new consultation
      if (data) {
        navigate(`/consultations/${data.id}`);
      }
    } catch (err: any) {
      console.error('Error creating consultation from appointment:', err);
      setError(err.message);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: ConsultationStatus) => {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case ConsultationStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case ConsultationStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ConsultationStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="consultations"
      breadcrumbs={[
        { label: getBilingualLabel('Consultations', 'ஆலோசனைகள்') }
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
            {getBilingualLabel("Consultations", "ஆலோசனைகள்")}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={() => setIsAddConsultationModalOpen(true)} variant="primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
              </svg>
              {getBilingualLabel("New Consultation", "புதிய ஆலோசனை")}
            </Button>
            <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Today's Consultations", "இன்றைய ஆலோசனைகள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.todayCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Completed Consultations", "முடிக்கப்பட்ட ஆலோசனைகள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.completedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("This Month", "இந்த மாதம்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.thisMonthCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Filter by Status", "நிலை மூலம் வடிகட்டு")}
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ConsultationStatus | 'all')}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="all">{getBilingualLabel("All Statuses", "அனைத்து நிலைகள்")}</option>
              <option value={ConsultationStatus.SCHEDULED}>{getBilingualLabel("Scheduled", "திட்டமிடப்பட்டது")}</option>
              <option value={ConsultationStatus.IN_PROGRESS}>{getBilingualLabel("In Progress", "நடைபெறுகிறது")}</option>
              <option value={ConsultationStatus.COMPLETED}>{getBilingualLabel("Completed", "முடிக்கப்பட்டது")}</option>
              <option value={ConsultationStatus.CANCELLED}>{getBilingualLabel("Cancelled", "ரத்து செய்யப்பட்டது")}</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="patientFilter" className="block text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Filter by Patient", "நோயாளி மூலம் வடிகட்டு")}
            </label>
            <select
              id="patientFilter"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">{getBilingualLabel("All Patients", "அனைத்து நோயாளிகள்")}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Filter by Date", "தேதி மூலம் வடிகட்டு")}
            </label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              setStatusFilter('all');
              setPatientFilter('');
              setDateFilter('');
            }}
            variant="secondary"
            size="sm"
          >
            {getBilingualLabel("Clear Filters", "வடிகட்டிகளை அழிக்கவும்")}
          </Button>
        </div>
      </div>
      
      {/* Consultations List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {consultations.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No consultations found", "ஆலோசனைகள் எதுவும் கிடைக்கவில்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("Get started by creating a new consultation", "புதிய ஆலோசனையை உருவாக்குவதன் மூலம் தொடங்கவும்")}
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddConsultationModalOpen(true)} variant="primary">
                {getBilingualLabel("New Consultation", "புதிய ஆலோசனை")}
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
                    {getBilingualLabel("Date & Time", "தேதி & நேரம்")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Chief Complaint", "முதன்மை புகார்")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {getBilingualLabel("Physician", "மருத்துவர்")}
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
                {consultations.map((consultation) => (
                  <tr 
                    key={consultation.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/consultations/${consultation.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{consultation.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{consultation.consultationDate}</div>
                      <div className="text-sm text-slate-500">{consultation.consultationTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 truncate max-w-xs">{consultation.chiefComplaint}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{consultation.attendingPhysician}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(consultation.status)}`}>
                        {consultation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/consultations/${consultation.id}`);
                        }}
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
      
      {/* Modals */}
      <Modal
        isOpen={isAddConsultationModalOpen}
        onClose={() => {
          setIsAddConsultationModalOpen(false);
          setSelectedAppointmentId(null);
        }}
        title={getBilingualLabel("New Consultation", "புதிய ஆலோசனை")}
      >
        <ConsultationForm
          patients={patients}
          appointmentId={selectedAppointmentId || undefined}
          onSubmit={handleAddConsultation}
          onCancel={() => {
            setIsAddConsultationModalOpen(false);
            setSelectedAppointmentId(null);
          }}
        />
      </Modal>
    </MainLayout>
  );
};

export default ConsultationsListPage;