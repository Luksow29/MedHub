// components/AppointmentList.tsx - Enhanced appointment list with scheduling features

import React, { useState } from 'react';
import { Appointment, Patient, ReminderMethod, AppointmentStatus } from '../types';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { formatReadableDate, formatReadableTime, isUpcomingInDays } from '../utils/dateHelpers';

interface AppointmentListProps {
  appointments: Appointment[];
  patients: Patient[];
  onSendReminder: (appointmentId: string, preferredContactMethod: ReminderMethod, patientPhoneNumber: string, patientEmail: string) => Promise<void>;
  onAppointmentAction?: (action: string, appointmentId: string, reason?: string) => Promise<void>;
  onEditAppointment?: (appointment: Appointment) => void;
  showActions?: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ 
  appointments, 
  patients, 
  onSendReminder,
  onAppointmentAction,
  onEditAppointment,
  showActions = true
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Filter and sort appointments
  const upcomingAppointments = appointments
    .filter(appt => {
      const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
      return isUpcomingInDays(appointmentDateTime, 30) && appt.status !== 'cancelled';
    })
    .sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

  // Get patient for appointment
  const getPatientForAppointment = (patientId: string): Patient | undefined => {
    return patients.find(p => p.id === patientId);
  };

  // Get status color class
  const getStatusColorClass = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return getBilingualLabel('Scheduled', 'திட்டமிடப்பட்டது');
      case 'confirmed':
        return getBilingualLabel('Confirmed', 'உறுதிப்படுத்தப்பட்டது');
      case 'cancelled':
        return getBilingualLabel('Cancelled', 'ரத்துசெய்யப்பட்டது');
      case 'completed':
        return getBilingualLabel('Completed', 'முடிக்கப்பட்டது');
      case 'no_show':
        return getBilingualLabel('No Show', 'வரவில்லை');
      case 'rescheduled':
        return getBilingualLabel('Rescheduled', 'மீண்டும் திட்டமிடப்பட்டது');
      default:
        return status;
    }
  };

  // Handle appointment action
  const handleAppointmentAction = async (action: string, appointmentId: string) => {
    if (!onAppointmentAction) return;

    let reason = '';
    if (action === 'cancel') {
      reason = prompt(getBilingualLabel("Cancellation reason (optional):", "ரத்து செய்வதற்கான காரணம் (விருப்பமானது):")) || '';
    } else if (action === 'complete') {
      reason = prompt(getBilingualLabel("Completion notes (optional):", "முடிவு குறிப்புகள் (விருப்பமானது):")) || '';
    } else if (action === 'no_show') {
      reason = prompt(getBilingualLabel("No-show notes (optional):", "வராத குறிப்புகள் (விருப்பமானது):")) || '';
    }

    setActionLoading(appointmentId);
    try {
      await onAppointmentAction(action, appointmentId, reason);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle appointment details
  const handleAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  if (upcomingAppointments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-900">
          {getBilingualLabel("No upcoming appointments", "வரவிருக்கும் சந்திப்புகள் இல்லை")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {getBilingualLabel("Schedule an appointment to get started.", "தொடங்க ஒரு சந்திப்பை திட்டமிடுங்கள்.")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {upcomingAppointments.map((appointment) => {
          const patient = getPatientForAppointment(appointment.patientId);
          const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
          const isToday = appointment.date === new Date().toISOString().split('T')[0];
          const isPast = appointmentDateTime < new Date();

          return (
            <div 
              key={appointment.id} 
              className={`bg-white p-6 shadow-lg rounded-lg border border-slate-200 hover:shadow-xl transition-shadow cursor-pointer ${
                isToday ? 'border-l-4 border-l-sky-500' : ''
              } ${isPast && appointment.status === 'scheduled' ? 'bg-yellow-50' : ''}`}
              onClick={() => handleAppointmentDetails(appointment)}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-sky-700">
                      {appointment.patientName || patient?.name || 'Unknown Patient'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="font-medium">{appointment.reason}</p>
                    {appointment.serviceType && (
                      <p>{getBilingualLabel("Service:", "சேவை:")} {appointment.serviceType}</p>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatReadableDate(appointmentDateTime)}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatReadableTime(appointmentDateTime)}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {appointment.duration} {getBilingualLabel("min", "நிமி")}
                      </div>
                    </div>
                    {appointment.isRecurring && (
                      <div className="flex items-center text-purple-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {getBilingualLabel("Recurring", "மீண்டும் வரும்")} ({appointment.recurrencePattern})
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {showActions && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Reminder button */}
                    {!appointment.reminderSent && patient && patient.preferredContactMethod !== 'None' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendReminder(
                            appointment.id,
                            patient.preferredContactMethod,
                            patient.phone,
                            patient.email || ''
                          );
                        }}
                        variant="success"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z" />
                        </svg>
                        {getBilingualLabel("Send Reminder", "நினைவூட்டல் அனுப்பு")}
                      </Button>
                    )}

                    {/* Status-specific actions */}
                    {appointment.status === 'scheduled' && (
                      <>
                        {onEditAppointment && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(appointment);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            {getBilingualLabel("Edit", "திருத்து")}
                          </Button>
                        )}
                        {onAppointmentAction && (
                          <>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentAction('complete', appointment.id);
                              }}
                              variant="success"
                              size="sm"
                              isLoading={actionLoading === appointment.id}
                            >
                              {getBilingualLabel("Complete", "முடிக்கவும்")}
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentAction('cancel', appointment.id);
                              }}
                              variant="danger"
                              size="sm"
                              isLoading={actionLoading === appointment.id}
                            >
                              {getBilingualLabel("Cancel", "ரத்துசெய்")}
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {appointment.status === 'confirmed' && onAppointmentAction && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentAction('complete', appointment.id);
                          }}
                          variant="success"
                          size="sm"
                          isLoading={actionLoading === appointment.id}
                        >
                          {getBilingualLabel("Complete", "முடிக்கவும்")}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentAction('no_show', appointment.id);
                          }}
                          variant="warning"
                          size="sm"
                          isLoading={actionLoading === appointment.id}
                        >
                          {getBilingualLabel("No Show", "வரவில்லை")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Reminder status */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                {appointment.reminderSent ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                      <path fillRule="evenodd" d="M15.53 3.47a.75.75 0 0 0-1.06 0L5.5 12.373l-2.97-2.97a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l9.5-9.5a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
                    </svg>
                    {getBilingualLabel("Reminder sent", "நினைவூட்டல் அனுப்பப்பட்டது")} 
                    {appointment.reminderMethodUsed && ` (${appointment.reminderMethodUsed})`}
                    {appointment.reminderSentAt && ` on ${formatReadableDate(new Date(appointment.reminderSentAt))}`}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                      <path fillRule="evenodd" d="M7.75 2a.75.75 0 0 1 .75.75V7h1.002a.75.75 0 0 1 .648 1.133l-2.002 3.503a.75.75 0 0 1-1.296 0L4.102 8.133A.75.75 0 0 1 4.75 7H5.75V2.75A.75.75 0 0 1 6.5 2h1.25ZM4.5 13.5a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H3.252a.75.75 0 0 1-.75-.75V14.25a.75.75 0 0 1 .75-.75h1.248Zm8-.008a.75.75 0 0 0-.75-.75h-1.25a.75.75 0 0 0-.75.75v.008a.75.75 0 0 0 .75.75h1.25a.75.75 0 0 0 .75-.75v-.008Z" clipRule="evenodd" />
                    </svg>
                    {getBilingualLabel("Reminder pending", "நினைவூட்டல் நிலுவையில்")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={getBilingualLabel("Appointment Details", "சந்திப்பு விவரங்கள்")}
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium text-slate-900">{selectedAppointment.patientName}</h4>
              <p className="text-sm text-slate-600">{selectedAppointment.reason}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                <p>{formatReadableDate(new Date(`${selectedAppointment.date}T${selectedAppointment.time}`))} at {formatReadableTime(new Date(`${selectedAppointment.date}T${selectedAppointment.time}`))}</p>
                <p>{getBilingualLabel("Duration:", "கால அளவு:")} {selectedAppointment.duration} {getBilingualLabel("minutes", "நிமிடங்கள்")}</p>
                {selectedAppointment.serviceType && (
                  <p>{getBilingualLabel("Service:", "சேவை:")} {selectedAppointment.serviceType}</p>
                )}
                <p>{getBilingualLabel("Status:", "நிலை:")} {getStatusLabel(selectedAppointment.status)}</p>
                {selectedAppointment.isRecurring && (
                  <p>{getBilingualLabel("Recurring:", "மீண்டும் வரும்:")} {selectedAppointment.recurrencePattern} (every {selectedAppointment.recurrenceInterval})</p>
                )}
              </div>
              {selectedAppointment.notes && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Notes:", "குறிப்புகள்:")}</p>
                  <p className="text-sm text-slate-600">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Patient contact info */}
            {selectedAppointment.patientPhoneNumber && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-900">{getBilingualLabel("Contact Information", "தொடர்பு தகவல்")}</p>
                <p className="text-sm text-blue-700">{getBilingualLabel("Phone:", "தொலைபேசி:")} {selectedAppointment.patientPhoneNumber}</p>
                {selectedAppointment.patientEmail && (
                  <p className="text-sm text-blue-700">{getBilingualLabel("Email:", "மின்னஞ்சல்:")} {selectedAppointment.patientEmail}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default AppointmentList;