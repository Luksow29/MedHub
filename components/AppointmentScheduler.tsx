// components/AppointmentScheduler.tsx - Main appointment scheduling interface

import React, { useState, useEffect } from 'react';
import { Patient, Appointment, NewDbAppointment, UpdateDbAppointment } from '../types';
import { getAllPatients } from '../api/patients';
import { 
  getAllAppointments, 
  createAppointment, 
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow
} from '../api/appointments';
import { supabase } from '../lib/supabase';
import Button from './shared/Button';
import Modal from './shared/Modal';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentForm from './AppointmentForm';
import WaitlistManager from './WaitlistManager';

interface AppointmentSchedulerProps {
  initialView?: 'calendar' | 'list' | 'waitlist';
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ 
  initialView = 'calendar' 
}) => {
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'waitlist'>(initialView);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'reschedule'>('create');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch patients and appointments
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      // Fetch patients
      const { data: patientsData, error: patientsError } = await getAllPatients(currentUser.data.user.id);
      if (patientsError) throw patientsError;

      const mappedPatients = (patientsData || []).map((patient: any) => ({
        id: patient.id,
        userId: patient.user_id,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        phone: patient.contact_phone,
        email: patient.contact_email,
        address: patient.address,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        preferredLanguage: patient.preferred_language,
        preferredContactMethod: patient.preferred_contact_method,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }));

      setPatients(mappedPatients);

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await getAllAppointments(currentUser.data.user.id);
      if (appointmentsError) throw appointmentsError;

      const mappedAppointments = (appointmentsData || []).map((appointment: any) => ({
        id: appointment.id,
        userId: appointment.user_id,
        patientId: appointment.patient_id,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration || 30,
        reason: appointment.reason,
        serviceType: appointment.service_type,
        status: appointment.status || 'scheduled',
        reminderSent: appointment.reminder_sent,
        reminderSentAt: appointment.reminder_sent_at,
        reminderMethodUsed: appointment.reminder_method_used,
        notes: appointment.notes,
        isRecurring: appointment.is_recurring || false,
        recurrencePattern: appointment.recurrence_pattern || 'none',
        recurrenceInterval: appointment.recurrence_interval || 1,
        recurrenceEndDate: appointment.recurrence_end_date,
        recurrenceCount: appointment.recurrence_count,
        parentAppointmentId: appointment.parent_appointment_id,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at,
        patientName: appointment.patients?.name,
        patientPhoneNumber: appointment.patients?.contact_phone,
        patientEmail: appointment.patients?.contact_email,
        patientPreferredContactMethod: appointment.patients?.preferred_contact_method
      }));

      setAppointments(mappedAppointments);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle appointment creation
  const handleCreateAppointment = async (appointmentData: NewDbAppointment) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { data, error } = await createAppointment(appointmentData, currentUser.data.user.id);
      
      if (error) {
        if (error.conflicts) {
          const proceed = window.confirm(
            getBilingualLabel(
              "Scheduling conflicts detected. Do you want to proceed anyway?",
              "திட்டமிடல் முரண்பாடுகள் கண்டறியப்பட்டன. எப்படியும் தொடர விரும்புகிறீர்களா?"
            )
          );
          
          if (proceed) {
            const { data: forceData, error: forceError } = await createAppointment(
              appointmentData, 
              currentUser.data.user.id, 
              true // Skip conflict check
            );
            if (forceError) throw forceError;
            if (forceData) {
              setIsAppointmentFormOpen(false);
              fetchData();
            }
          }
          return;
        }
        throw error;
      }

      if (data) {
        setIsAppointmentFormOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      setError(err.message);
    }
  };

  // Handle appointment update
  const handleUpdateAppointment = async (appointmentData: UpdateDbAppointment) => {
    if (!selectedAppointment) return;

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { data, error } = await updateAppointment(
        selectedAppointment.id, 
        appointmentData, 
        currentUser.data.user.id
      );
      
      if (error) {
        if (error.conflicts) {
          const proceed = window.confirm(
            getBilingualLabel(
              "Scheduling conflicts detected. Do you want to proceed anyway?",
              "திட்டமிடல் முரண்பாடுகள் கண்டறியப்பட்டன. எப்படியும் தொடர விரும்புகிறீர்களா?"
            )
          );
          
          if (proceed) {
            const { data: forceData, error: forceError } = await updateAppointment(
              selectedAppointment.id,
              appointmentData, 
              currentUser.data.user.id, 
              true // Skip conflict check
            );
            if (forceError) throw forceError;
            if (forceData) {
              setIsAppointmentFormOpen(false);
              setSelectedAppointment(null);
              fetchData();
            }
          }
          return;
        }
        throw error;
      }

      if (data) {
        setIsAppointmentFormOpen(false);
        setSelectedAppointment(null);
        fetchData();
      }
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      setError(err.message);
    }
  };

  // Handle appointment actions
  const handleAppointmentAction = async (action: string, appointmentId: string, reason?: string) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      let result;
      switch (action) {
        case 'cancel':
          result = await cancelAppointment(appointmentId, currentUser.data.user.id, reason);
          break;
        case 'complete':
          result = await completeAppointment(appointmentId, currentUser.data.user.id, reason);
          break;
        case 'no_show':
          result = await markNoShow(appointmentId, currentUser.data.user.id, reason);
          break;
        default:
          throw new Error('Unknown action');
      }

      if (result.error) throw result.error;
      fetchData();
      setIsAppointmentDetailsOpen(false);
      setSelectedAppointment(null);
    } catch (err: any) {
      console.error(`Error ${action} appointment:`, err);
      setError(err.message);
    }
  };

  // Handle calendar time slot selection
  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setFormMode('create');
    setSelectedAppointment(null);
    setIsAppointmentFormOpen(true);
  };

  // Handle appointment selection from calendar
  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };

  // Handle edit appointment
  const handleEditAppointment = () => {
    setFormMode('edit');
    setIsAppointmentDetailsOpen(false);
    setIsAppointmentFormOpen(true);
  };

  // Handle reschedule appointment
  const handleRescheduleAppointment = () => {
    setFormMode('reschedule');
    setIsAppointmentDetailsOpen(false);
    setIsAppointmentFormOpen(true);
  };

  // Render appointment list view
  const renderAppointmentList = () => {
    const today = new Date().toISOString().split('T')[0];
    const upcomingAppointments = appointments
      .filter(apt => apt.date >= today && apt.status !== 'cancelled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare === 0) {
          return a.time.localeCompare(b.time);
        }
        return dateCompare;
      });

    return (
      <div className="space-y-4">
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No upcoming appointments", "வரவிருக்கும் சந்திப்புகள் இல்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("Schedule your first appointment to get started.", "தொடங்க உங்கள் முதல் சந்திப்பை திட்டமிடுங்கள்.")}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-slate-200">
              {upcomingAppointments.map((appointment) => (
                <li key={appointment.id} className="px-6 py-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleAppointmentSelect(appointment)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-slate-900">
                          {appointment.patientName}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{appointment.reason}</p>
                      <div className="mt-1 flex items-center text-sm text-slate-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        <span className="ml-2">({appointment.duration} {getBilingualLabel("min", "நிமி")})</span>
                      </div>
                      {appointment.serviceType && (
                        <p className="text-xs text-slate-500 mt-1">
                          {getBilingualLabel("Service:", "சேவை:")} {appointment.serviceType}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">
          {getBilingualLabel("Appointment Scheduler", "சந்திப்பு திட்டமிடுபவர்")}
        </h2>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setFormMode('create');
              setSelectedAppointment(null);
              setSelectedDate('');
              setSelectedTime('');
              setIsAppointmentFormOpen(true);
            }}
            variant="primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {getBilingualLabel("New Appointment", "புதிய சந்திப்பு")}
          </Button>
          <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {getBilingualLabel("Refresh", "புதுப்பிக்கவும்")}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* View tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'calendar', label: getBilingualLabel('Calendar', 'காலெண்டர்') },
            { key: 'list', label: getBilingualLabel('List', 'பட்டியல்') },
            { key: 'waitlist', label: getBilingualLabel('Waitlist', 'காத்திருப்பு பட்டியல்') }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`${
                activeView === tab.key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* View content */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{getBilingualLabel("Loading...", "ஏற்றப்படுகிறது...")}</p>
        </div>
      ) : (
        <>
          {activeView === 'calendar' && (
            <AppointmentCalendar
              onAppointmentSelect={handleAppointmentSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              patients={patients}
              selectedDate={selectedDate}
            />
          )}
          {activeView === 'list' && renderAppointmentList()}
          {activeView === 'waitlist' && (
            <WaitlistManager
              patients={patients}
              onAppointmentCreated={(appointmentId) => {
                fetchData();
                setActiveView('calendar');
              }}
            />
          )}
        </>
      )}

      {/* Appointment Form Modal */}
      <Modal
        isOpen={isAppointmentFormOpen}
        onClose={() => setIsAppointmentFormOpen(false)}
        title={
          formMode === 'create' ? getBilingualLabel("New Appointment", "புதிய சந்திப்பு") :
          formMode === 'edit' ? getBilingualLabel("Edit Appointment", "சந்திப்பைத் திருத்து") :
          getBilingualLabel("Reschedule Appointment", "சந்திப்பை மீண்டும் திட்டமிடு")
        }
      >
        <AppointmentForm
          appointment={selectedAppointment || undefined}
          patients={patients}
          onSubmit={formMode === 'create' ? handleCreateAppointment : handleUpdateAppointment}
          onCancel={() => setIsAppointmentFormOpen(false)}
          mode={formMode}
        />
      </Modal>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={isAppointmentDetailsOpen}
        onClose={() => setIsAppointmentDetailsOpen(false)}
        title={getBilingualLabel("Appointment Details", "சந்திப்பு விவரங்கள்")}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium text-slate-900">{selectedAppointment.patientName}</h4>
              <p className="text-sm text-slate-600">{selectedAppointment.reason}</p>
              <div className="mt-2 text-sm text-slate-500">
                <p>{new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}</p>
                <p>{getBilingualLabel("Duration:", "கால அளவு:")} {selectedAppointment.duration} {getBilingualLabel("minutes", "நிமிடங்கள்")}</p>
                {selectedAppointment.serviceType && (
                  <p>{getBilingualLabel("Service:", "சேவை:")} {selectedAppointment.serviceType}</p>
                )}
                <p>{getBilingualLabel("Status:", "நிலை:")} {selectedAppointment.status}</p>
              </div>
              {selectedAppointment.notes && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Notes:", "குறிப்புகள்:")}</p>
                  <p className="text-sm text-slate-600">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedAppointment.status === 'scheduled' && (
                <>
                  <Button onClick={handleEditAppointment} variant="secondary" size="sm">
                    {getBilingualLabel("Edit", "திருத்து")}
                  </Button>
                  <Button onClick={handleRescheduleAppointment} variant="secondary" size="sm">
                    {getBilingualLabel("Reschedule", "மீண்டும் திட்டமிடு")}
                  </Button>
                  <Button 
                    onClick={() => handleAppointmentAction('complete', selectedAppointment.id)}
                    variant="success" 
                    size="sm"
                  >
                    {getBilingualLabel("Complete", "முடிக்கவும்")}
                  </Button>
                  <Button 
                    onClick={() => handleAppointmentAction('no_show', selectedAppointment.id)}
                    variant="warning" 
                    size="sm"
                  >
                    {getBilingualLabel("No Show", "வரவில்லை")}
                  </Button>
                  <Button 
                    onClick={() => {
                      const reason = prompt(getBilingualLabel("Cancellation reason (optional):", "ரத்து செய்வதற்கான காரணம் (விருப்பமானது):"));
                      if (reason !== null) {
                        handleAppointmentAction('cancel', selectedAppointment.id, reason);
                      }
                    }}
                    variant="danger" 
                    size="sm"
                  >
                    {getBilingualLabel("Cancel", "ரத்துசெய்")}
                  </Button>
                </>
              )}
              {selectedAppointment.status === 'confirmed' && (
                <>
                  <Button onClick={handleEditAppointment} variant="secondary" size="sm">
                    {getBilingualLabel("Edit", "திருத்து")}
                  </Button>
                  <Button 
                    onClick={() => handleAppointmentAction('complete', selectedAppointment.id)}
                    variant="success" 
                    size="sm"
                  >
                    {getBilingualLabel("Complete", "முடிக்கவும்")}
                  </Button>
                  <Button 
                    onClick={() => handleAppointmentAction('no_show', selectedAppointment.id)}
                    variant="warning" 
                    size="sm"
                  >
                    {getBilingualLabel("No Show", "வரவில்லை")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentScheduler;