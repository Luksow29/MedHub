import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  Patient, Appointment, NewDbPatient, NewDbAppointment,
  DbPatient, DbAppointment, ReminderMethod
} from '../../types';

// Components
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PatientForm from '../../features/patient-management/components/PatientForm';
import AppointmentForm from '../../components/AppointmentForm';
import AppointmentList from '../../components/AppointmentList';

// API functions
import * as PatientAPI from '../../api/patients';
import * as AppointmentAPI from '../../api/appointments';

interface AppointmentsListPageProps {
  user: User;
  onLogout: () => void;
}

const AppointmentsListPage: React.FC<AppointmentsListPageProps> = ({ user, onLogout }) => {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

    } catch (err: any) {
      console.error('Appointments data fetch error:', err.message);
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
      console.log(`சந்திப்பு ${appointmentId} க்கான நினைவூட்டல் ${preferredContactMethod} வழியாக அனுப்பப்பட்டது!`);
    } catch (err: any) {
      console.error('நினைவூட்டல் நிலையைப் புதுப்பிப்பதில் பிழை:', err.message);
      setError(getBilingualLabel('Failed to send reminder:', 'நினைவூட்டலை அனுப்ப முடியவில்லை:') + err.message);
    }
  };

  const handleAppointmentAction = async (action: string, appointmentId: string, reason?: string) => {
    try {
      setIsLoading(true);
      
      switch (action) {
        case 'complete':
          await AppointmentAPI.completeAppointment(appointmentId, user.id, reason);
          break;
        case 'cancel':
          await AppointmentAPI.cancelAppointment(appointmentId, user.id, reason);
          break;
        case 'no_show':
          await AppointmentAPI.markNoShow(appointmentId, user.id, reason);
          break;
        default:
          throw new Error('Unknown action');
      }
      
      // Refresh appointments
      fetchData();
      
    } catch (err: any) {
      console.error(`Error performing action ${action}:`, err.message);
      setError(`Failed to ${action} appointment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="appointments"
      breadcrumbs={[
        { label: getBilingualLabel('Appointment Management', 'சந்திப்பு நிர்வாகம்') },
        { label: getBilingualLabel('Appointments List', 'சந்திப்புகள் பட்டியல்') }
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Appointments List", "சந்திப்புகள் பட்டியல்")}
        </h2>
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
          <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <AppointmentList
        appointments={appointments}
        onSendReminder={handleSendReminder}
        patients={patients}
        onAppointmentAction={handleAppointmentAction}
        showActions={true}
      />

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
    </MainLayout>
  );
};

export default AppointmentsListPage;