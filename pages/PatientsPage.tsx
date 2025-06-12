import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Patient, NewDbPatient,
  DbPatient
} from '../types';

// Components
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PatientForm from '../features/patient-management/components/PatientForm';
import PatientList from '../features/patient-management/components/PatientList';
import PatientSearchComponent from '../components/PatientSearchComponent';
import DeletedPatientsManager from '../components/DeletedPatientsManager';

// API functions
import * as PatientAPI from '../api/patients';
import { getPatientStatistics } from '../api/patientSearch';

interface PatientsPageProps {
  user: User;
  onLogout: () => void;
}

const PatientsPage: React.FC<PatientsPageProps> = ({ user, onLogout }) => {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDeletedPatientsModalOpen, setIsDeletedPatientsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'search' | 'records'>('directory');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    upcomingAppointments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const mapDbPatientToClient = (dbPatient: DbPatient): Patient => ({
    id: dbPatient.id,
    userId: dbPatient.user_id,
    name: dbPatient.name,
    dob: dbPatient.dob,
    gender: dbPatient.gender,
    phone: dbPatient.contact_phone,
    email: dbPatient.contact_email,
    address: dbPatient.address,
    emergencyContactName: dbPatient.emergency_contact_name,
    emergencyContactPhone: dbPatient.emergency_contact_phone,
    preferredLanguage: dbPatient.preferred_language,
    preferredContactMethod: dbPatient.preferred_contact_method,
    createdAt: dbPatient.created_at,
    updatedAt: dbPatient.updated_at,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      setPatients(patientsData.map(mapDbPatientToClient));

      // Fetch statistics
      const stats = await getPatientStatistics(user.id);
      setStatistics(stats);

    } catch (err: any) {
      console.error('Patients data fetch error:', err.message);
      setError(getBilingualLabel('Failed to load data:', 'தரவை ஏற்ற முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPatient = async (patientData: NewDbPatient) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await PatientAPI.createPatient(patientData, user.id);
      if (error) throw error;
      if (data) {
        setPatients(prev => [...prev, mapDbPatientToClient(data)]);
      }
      setIsPatientModalOpen(false);
      // Refresh statistics
      const stats = await getPatientStatistics(user.id);
      setStatistics(stats);
    } catch (err: any) {
      console.error('நோயாளியைச் சேர்ப்பதில் பிழை:', err.message);
      setError(getBilingualLabel('Failed to add patient:', 'நோயாளியைச் சேர்க்க முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientRestored = () => {
    fetchData(); // Refresh all data when a patient is restored
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="patients"
      breadcrumbs={[
        { label: getBilingualLabel('Patient Management', 'நோயாளர் நிர்வாகம்') }
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
            {getBilingualLabel("Patient Management", "நோயாளர் நிர்வாகம்")}
          </h2>
          <div className="flex space-x-3">
            <Button onClick={() => setIsPatientModalOpen(true)} variant="primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7.75 9.75a.75.75 0 0 0-1.5 0v1.5h-1.5a.75.75 0 0 0 0 1.5h1.5v1.5a.75.75 0 0 0 1.5 0v-1.5h1.5a.75.75 0 0 0 0-1.5h-1.5V9.75Z" />
                <path d="M10.024 10.378c-.3-.085-.617-.122-.949-.122-.99 0-1.917.405-2.585 1.073A5.004 5.004 0 0 0 3 16.25V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.75a5.003 5.003 0 0 0-3.415-4.799.75.75 0 0 0-.91-.004 3.504 3.504 0 0 1-3.651-.07Z" />
              </svg>
              {getBilingualLabel("Add Patient", "நோயாளியைச் சேர்")}
            </Button>
            <Button onClick={() => setIsDeletedPatientsModalOpen(true)} variant="secondary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {getBilingualLabel("Deleted Patients", "நீக்கப்பட்ட நோயாளிகள்")}
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
                <svg className="h-8 w-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Total Patients", "மொத்த நோயாளிகள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("New This Month", "இந்த மாதம் புதியவர்கள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.newPatientsThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">{getBilingualLabel("Upcoming Appointments", "வரவிருக்கும் சந்திப்புகள்")}</p>
                <p className="text-2xl font-semibold text-slate-900">{statistics.upcomingAppointments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-slate-300">
        <nav className="-mb-px flex space-x-8" aria-label={getBilingualLabel("Sections", "பிரிவுகள்")}>
          <button
            onClick={() => setActiveTab('directory')}
            className={`${
              activeTab === 'directory'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {getBilingualLabel("Patient Directory", "நோயாளர் அடைவு")}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`${
              activeTab === 'search'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {getBilingualLabel("Search Patients", "நோயாளிகளைத் தேடு")}
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`${
              activeTab === 'records'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'directory' && (
        <PatientList patients={patients} />
      )}

      {activeTab === 'search' && (
        <PatientSearchComponent />
      )}

      {activeTab === 'records' && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {getBilingualLabel("Access detailed medical records by selecting a patient from the directory", "அடைவில் இருந்து ஒரு நோயாளியைத் தேர்ந்தெடுத்து விரிவான மருத்துவ பதிவுகளை அணுகவும்")}
          </p>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title={getBilingualLabel("Add New Patient", "புதிய நோயாளியைச் சேர்")}>
        <PatientForm
          onSubmit={handleAddPatient}
          onCancel={() => setIsPatientModalOpen(false)}
        />
      </Modal>

      <DeletedPatientsManager
        isOpen={isDeletedPatientsModalOpen}
        onClose={() => setIsDeletedPatientsModalOpen(false)}
        onPatientRestored={handlePatientRestored}
      />
    </MainLayout>
  );
};

export default PatientsPage;