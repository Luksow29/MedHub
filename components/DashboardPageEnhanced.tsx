// components/DashboardPageEnhanced.tsx - Enhanced dashboard with search and deleted patients management

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Patient, Appointment, NewDbPatient, NewDbAppointment,
  DbPatient, DbAppointment, ReminderMethod
} from '../types';

// Components
import Header from './shared/Header';
import Button from './shared/Button';
import Modal from './shared/Modal';
import PatientForm from '../features/patient-management/components/PatientForm';
import PatientSearchComponent from './PatientSearchComponent';
import DeletedPatientsManager from './DeletedPatientsManager';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentScheduler from './AppointmentScheduler';
import WaitlistManager from './WaitlistManager';

// API functions
import * as PatientAPI from '../api/patients';
import * as AppointmentAPI from '../api/appointments';
import { getPatientStatistics } from '../api/patientSearch';

interface DashboardPageEnhancedProps {
  user: User;
  onLogout: () => void;
}

const DashboardPageEnhanced: React.FC<DashboardPageEnhancedProps> = ({ user, onLogout }) => {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDeletedPatientsModalOpen, setIsDeletedPatientsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'calendar' | 'scheduler' | 'waitlist' | 'patients' | 'search'>('appointments');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  const mapDbAppointmentToClient = (dbAppt: DbAppointment & { patients?: DbPatient }): Appointment => ({
    id: dbAppt.id,
    userId: dbAppt.user_id,
    patientId: dbAppt.patient_id,
    date: dbAppt.date,
    time: dbAppt.time,
    duration: dbAppt.duration || 30,
    reason: dbAppt.reason,
    serviceType: dbAppt.service_type,
    status: dbAppt.status,
    notes: dbAppt.notes,
    isRecurring: dbAppt.is_recurring,
    recurrencePattern: dbAppt.recurrence_pattern,
    recurrenceInterval: dbAppt.recurrence_interval,
    recurrenceEndDate: dbAppt.recurrence_end_date,
    recurrenceCount: dbAppt.recurrence_count,
    parentAppointmentId: dbAppt.parent_appointment_id,
    reminderSent: dbAppt.reminder_sent,
    reminderSentAt: dbAppt.reminder_sent_at,
    reminderMethodUsed: dbAppt.reminder_method_used,
    createdAt: dbAppt.created_at,
    updatedAt: dbAppt.updated_at,
    patientName: dbAppt.patients?.name || 'தெரியாத நோயாளி',
    patientPhoneNumber: dbAppt.patients?.contact_phone,
    patientEmail: dbAppt.patients?.contact_email,
    patientPreferredContactMethod: dbAppt.patients?.preferred_contact_method,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      setPatients(patientsData.map(mapDbPatientToClient));

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await AppointmentAPI.getAllAppointments(user.id);
      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData.map(mapDbAppointmentToClient));

      // Fetch statistics
      const stats = await getPatientStatistics(user.id);
      setStatistics(stats);

    } catch (err: any) {
      console.error('டாஷ்போர்டு தரவைப் பெறுவதில் பிழை:', err.message);
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

  const handleAddAppointment = async (appointmentData: NewDbAppointment) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await AppointmentAPI.createAppointment(appointmentData, user.id);
      if (error) throw error;
      if (data) {
        const { data: updatedAppointmentData, error: fetchError } = await supabase
          .from('appointments')
          .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
          .eq('id', data.id)
          .single();

        if (fetchError) throw fetchError;
        setAppointments(prev => [...prev, mapDbAppointmentToClient(updatedAppointmentData!)]);
      }
      setIsAppointmentModalOpen(false);
    } catch (err: any) {
      console.error('சந்திப்பைச் சேர்ப்பதில் பிழை:', err.message);
      setError(getBilingualLabel('Failed to add appointment:', 'சந்திப்பைச் சேர்க்க முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (appointmentId: string, preferredContactMethod: ReminderMethod, patientPhoneNumber: string, patientEmail: string) => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? {
          ...appt,
          reminderSent: true,
          reminderSentAt: new Date().toISOString(),
          reminderMethodUsed: preferredContactMethod,
        } : appt
      )
    );

    try {
      const { data, error } = await AppointmentAPI.updateAppointment(
        appointmentId,
        {
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
          reminder_method_used: preferredContactMethod,
        },
        user.id
      );

      if (error) throw error;
      if (data) {
        const { data: updatedAppointmentData, error: fetchError } = await supabase
          .from('appointments')
          .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
          .eq('id', data.id)
          .single();

        if (fetchError) throw fetchError;
        setAppointments(prev =>
          prev.map(appt =>
            appt.id === appointmentId ? mapDbAppointmentToClient(updatedAppointmentData!) : appt
          )
        );
      }
      console.log(`சந்திப்பு ${appointmentId} க்கான நினைவூட்டல் ${preferredContactMethod} வழியாக அனுப்பப்பட்டது!`);
    } catch (err: any) {
      console.error('நினைவூட்டல் நிலையைப் புதுப்பிப்பதில் பிழை:', err.message);
      setError(getBilingualLabel('Failed to send reminder:', 'நினைவூட்டலை அனுப்ப முடியவில்லை:') + err.message);
      setAppointments(prev =>
        prev.map(appt =>
          appt.id === appointmentId ? {
            ...appt,
            reminderSent: false,
            reminderSentAt: null,
            reminderMethodUsed: null,
          } : appt
        )
      );
    }
  };

  const handlePatientRestored = () => {
    fetchData(); // Refresh all data when a patient is restored
  };

  const handleAppointmentUpdate = () => {
    fetchData(); // Refresh appointments when updated from calendar or scheduler
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto p-4 md:p-6">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Header with Statistics */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-semibold text-slate-800">{getBilingualLabel("Dashboard", "டாஷ்போர்டு")}</h2>
            <div className="flex space-x-3">
              <Button onClick={() => setIsPatientModalOpen(true)} variant="primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7.75 9.75a.75.75 0 0 0-1.5 0v1.5h-1.5a.75.75 0 0 0 0 1.5h1.5v1.5a.75.75 0 0 0 1.5 0v-1.5h1.5a.75.75 0 0 0 0-1.5h-1.5V9.75Z" />
                  <path d="M10.024 10.378c-.3-.085-.617-.122-.949-.122-.99 0-1.917.405-2.585 1.073A5.004 5.004 0 0 0 3 16.25V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.75a5.003 5.003 0 0 0-3.415-4.799.75.75 0 0 0-.91-.004 3.504 3.504 0 0 1-3.651-.07Z" />
                </svg>
                {getBilingualLabel("Add Patient", "நோயாளியைச் சேர்")}
              </Button>
              <Button onClick={() => setIsAppointmentModalOpen(true)} variant="primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5h10.5a.75.75 0 0 0 0-1.5H4.75a.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                {getBilingualLabel("Add Appointment", "சந்திப்பைச் சேர்")}
              </Button>
              <Button onClick={() => setIsDeletedPatientsModalOpen(true)} variant="secondary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {getBilingualLabel("Deleted Patients", "நீக்கப்பட்ட நோயாளிகள்")}
              </Button>
              <Button onClick={fetchData} variant="secondary" isLoading={isLoading} title={getBilingualLabel("Refresh Data", "தரவைப் புதுப்பிக்கவும்")}>
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
              onClick={() => setActiveTab('appointments')}
              className={`${
                activeTab === 'appointments'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {getBilingualLabel("Appointments", "சந்திப்புகள்")}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${
                activeTab === 'calendar'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {getBilingualLabel("Calendar", "நாட்காட்டி")}
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`${
                activeTab === 'scheduler'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {getBilingualLabel("Scheduler", "அட்டவணையாளர்")}
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`${
                activeTab === 'waitlist'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {getBilingualLabel("Waitlist", "காத்திருப்பு பட்டியல்")}
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
              onClick={() => setActiveTab('patients')}
              className={`${
                activeTab === 'patients'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {getBilingualLabel("All Patients", "அனைத்து நோயாளிகள்")}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {isLoading && activeTab === 'appointments' && <p className="text-center text-slate-600 py-8">{getBilingualLabel("Loading appointments...", "சந்திப்புகள் ஏற்றப்படுகிறது...")}</p>}
        {isLoading && activeTab === 'patients' && <p className="text-center text-slate-600 py-8">{getBilingualLabel("Loading patients...", "நோயாளிகள் ஏற்றப்படுகிறது...")}</p>}

        {!isLoading && activeTab === 'appointments' && (
          <AppointmentList
            appointments={appointments}
            onSendReminder={handleSendReminder}
            patients={patients}
          />
        )}

        {activeTab === 'calendar' && (
          <AppointmentCalendar
            appointments={appointments}
            patients={patients}
            userId={user.id}
            onAppointmentUpdate={handleAppointmentUpdate}
          />
        )}

        {activeTab === 'scheduler' && (
          <AppointmentScheduler
            patients={patients}
            userId={user.id}
            onAppointmentCreated={handleAppointmentUpdate}
          />
        )}

        {activeTab === 'waitlist' && (
          <WaitlistManager
            patients={patients}
            userId={user.id}
            onWaitlistUpdate={handleAppointmentUpdate}
          />
        )}

        {activeTab === 'search' && (
          <PatientSearchComponent />
        )}

        {!isLoading && activeTab === 'patients' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">பெயர்</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">தொலைபேசி</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">மின்னஞ்சல்</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">செயல்கள்</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{patient.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <a
                          href={`/patient/${patient.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                        >
                          விவரங்களைப் பார்க்கவும்
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title={getBilingualLabel("Add New Patient", "புதிய நோயாளியைச் சேர்")}>
        <PatientForm
          onSubmit={handleAddPatient}
          onCancel={() => setIsPatientModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} title={getBilingualLabel("Schedule New Appointment", "புதிய சந்திப்பை திட்டமிடு")}>
        <AppointmentForm
          patients={patients}
          onSubmit={handleAddAppointment}
          onCancel={() => setIsAppointmentModalOpen(false)}
        />
      </Modal>

      <DeletedPatientsManager
        isOpen={isDeletedPatientsModalOpen}
        onClose={() => setIsDeletedPatientsModalOpen(false)}
        onPatientRestored={handlePatientRestored}
      />
    </div>
  );
};

export default DashboardPageEnhanced;