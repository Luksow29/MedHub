// src/components/AppointmentForm.tsx (முழுமையான மாற்றப்பட்ட கோப்பு)
import React, { useState } from 'react';
import { Appointment, Patient, NewDbAppointment } from '../types'; // NewDbAppointment ஐ இறக்குமதி செய்கிறோம்
import Button from './shared/Button';
import { formatDateToInput, formatTimeToInput } from '../utils/dateHelpers';

interface AppointmentFormProps {
  appointment?: Appointment;
  patients: Patient[]; // கிளையன்ட் Patient வகைகள்
  // சுபாபேஸ் இல் நேரடியாக செருகுவதற்கு snake_case ஐ எதிர்பார்க்கிறது
  onSubmit: (data: NewDbAppointment) => Promise<void>;
  onCancel: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ appointment, patients, onSubmit, onCancel }) => {
  // patientId ஆனது appointment?.patientId இலிருந்து அல்லது patients பட்டியலின் முதல் நோயாளி ID இலிருந்து பெறப்படுகிறது
  const [patientId, setPatientId] = useState(appointment?.patientId || (patients.length > 0 ? patients[0].id : ''));
  const [date, setDate] = useState(appointment?.date || formatDateToInput(new Date()));
  const [time, setTime] = useState(appointment?.time || formatTimeToInput(new Date()));
  const [reason, setReason] = useState(appointment?.reason || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
        alert("தயவுசெய்து ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.");
        return;
    }
    setIsLoading(true);
    // onSubmit க்கு அனுப்பப்படும் தரவு NewDbAppointment (snake_case) உடன் பொருந்த வேண்டும்
    await onSubmit({
      patient_id: patientId, // <-- snake_case க்கு மாற்றப்பட்டது
      date,
      time,
      reason,
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="patient" className="block text-sm font-medium text-slate-700">நோயாளி</label>
        <select
          id="patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="" disabled>ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
          {patients.length === 0 && <p className="text-xs text-red-500 mt-1">நோயாளிகள் யாரும் இல்லை. முதலில் ஒரு நோயாளியைச் சேர்க்கவும்.</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">தேதி</label>
          <input
            type="date"
            id="date"
            value={date}
            min={formatDateToInput(new Date())} // கடந்த தேதிகளைத் தேர்ந்தெடுப்பதைத் தடுக்கவும்
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-slate-700">நேரம்</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">சந்திப்பிற்கான காரணம்</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          ரத்துசெய்
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={patients.length === 0}>
          {appointment ? 'மாற்றங்களைச் சேமி' : 'சந்திப்பை திட்டமிடு'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;