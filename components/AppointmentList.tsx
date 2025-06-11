// src/components/AppointmentList.tsx (முழுமையான மாற்றப்பட்ட கோப்பு)
import React from 'react';
import { Appointment, Patient, ReminderMethod } from '../types'; // கிளையன்ட் வகைகளை இறக்குமதி செய்கிறோம்
import Button from './shared/Button';
import { formatReadableDate, formatReadableTime, isUpcomingInDays } from '../utils/dateHelpers';

interface AppointmentListProps {
  appointments: Appointment[]; // கிளையன்ட் Appointment வகைகளை எதிர்பார்க்கிறது
  patients: Patient[];       // கிளையன்ட் Patient வகைகளை எதிர்பார்க்கிறது
  // onSendReminder க்கு தேவையான அனைத்து விவரங்களையும் அனுப்பவும்
  onSendReminder: (appointmentId: string, preferredContactMethod: ReminderMethod, patientPhoneNumber: string, patientEmail: string) => Promise<void>;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, patients, onSendReminder }) => {

  const upcomingAppointments = appointments
    .filter(appt => isUpcomingInDays(new Date(`${appt.date}T${appt.time}`), 7))
    .sort((a,b) => new Date(`${a.date}T${b.time}`).getTime() - new Date(`${b.date}T${a.time}`).getTime()); // வரிசைப்படுத்தும் தர்க்கம் சரி செய்யப்பட்டது

  if (upcomingAppointments.length === 0) {
    return <p className="text-center text-slate-600 py-8">அடுத்த 7 நாட்களில் வரவிருக்கும் சந்திப்புகள் எதுவும் இல்லை. ஒன்றை திட்டமிட "சந்திப்பைச் சேர்" என்பதைக் கிளிக் செய்யவும்.</p>;
  }

  // ஒரு சந்திப்பிற்கான நோயாளியைப் பெறும் செயல்பாடு
  const getPatientForAppointment = (patientId: string): Patient | undefined => {
    return patients.find(p => p.id === patientId);
  };

  return (
    <div className="space-y-4">
      {upcomingAppointments.map((appointment) => {
        // appointment.patientId ஐப் பயன்படுத்தி நோயாளியைப் பெறவும் (camelCase)
        const patient = getPatientForAppointment(appointment.patientId);

        // அனைத்து பண்புகளையும் camelCase இல் அணுகவும்
        const reminderMethodLabel = patient?.preferredContactMethod || ReminderMethod.NONE;
        const reminderSent = appointment.reminderSent || false;
        const reminderSentAt = appointment.reminderSentAt;
        const reminderMethodUsed = appointment.reminderMethodUsed;

        return (
          <div key={appointment.id} className="bg-white p-5 shadow-lg rounded-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                {/* patientName ஏற்கனவே appointment இல் உள்ளதால், அதைப் பயன்படுத்துவோம் */}
                <h3 className="text-xl font-semibold text-sky-700">{appointment.patientName}</h3>
                <p className="text-sm text-slate-600">{appointment.reason}</p>
              </div>
              <div className="mt-2 sm:mt-0 text-right">
                   <p className="text-lg font-medium text-slate-800">
                    {formatReadableDate(new Date(`${appointment.date}T${appointment.time}`))}
                </p>
                <p className="text-md text-slate-600">
                    {formatReadableTime(new Date(`${appointment.date}T${appointment.time}`))}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-slate-500">
                {reminderSent ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path fillRule="evenodd" d="M15.53 3.47a.75.75 0 0 0-1.06 0L5.5 12.373l-2.97-2.97a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l9.5-9.5a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
                    </svg>
                    நினைவூட்டல் அனுப்பப்பட்டது ({reminderMethodUsed} அன்று {reminderSentAt ? formatReadableDate(new Date(reminderSentAt)) : 'கிடைக்கவில்லை'})
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path fillRule="evenodd" d="M7.75 2a.75.75 0 0 1 .75.75V7h1.002a.75.75 0 0 1 .648 1.133l-2.002 3.503a.75.75 0 0 1-1.296 0L4.102 8.133A.75.75 0 0 1 4.75 7H5.75V2.75A.75.75 0 0 1 6.5 2h1.25ZM4.5 13.5a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H3.252a.75.75 0 0 1-.75-.75V14.25a.75.75 0 0 1 .75-.75h1.248Zm8-.008a.75.75 0 0 0-.75-.75h-1.25a.75.75 0 0 0-.75.75v.008a.75.75 0 0 0 .75.75h1.25a.75.75 0 0 0 .75-.75v-.008Z" clipRule="evenodd" />
                    </svg>
                    நினைவூட்டல் நிலுவையில் உள்ளது
                  </span>
                )}
              </div>
              {!reminderSent && patient && patient.preferredContactMethod !== ReminderMethod.NONE && (
                <Button
                  onClick={() => onSendReminder(
                    appointment.id,
                    patient.preferredContactMethod,
                    patient.phone,
                    patient.email
                  )}
                  variant="success"
                  size="sm"
                  className="mt-3 sm:mt-0"
                >
                  {reminderMethodLabel} நினைவூட்டலை அனுப்பு
                </Button>
              )}
              {!reminderSent && (!patient || patient.preferredContactMethod === ReminderMethod.NONE) && (
                   <span className="text-xs text-slate-500 mt-3 sm:mt-0">நோயாளருக்கு விருப்பமான தொடர்பு முறை இல்லை அல்லது நோயாளர் தரவு இல்லை.</span>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentList;