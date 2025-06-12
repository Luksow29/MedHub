import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Consultation, 
  NewDbConsultation, 
  UpdateDbConsultation, 
  ConsultationStatus,
  Patient
} from '../../types/index';
import Button from '../shared/Button';
import { formatDateToInput, formatTimeToInput } from '../../utils/dateHelpers';
import { supabase } from '../../lib/supabase';

interface ConsultationFormProps {
  consultation?: Consultation;
  patients: Patient[];
  appointmentId?: string;
  onSubmit: (data: NewDbConsultation | UpdateDbConsultation) => Promise<void>;
  onCancel: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  consultation,
  patients,
  appointmentId,
  onSubmit,
  onCancel
}) => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(consultation?.patientId || '');
  const [consultationDate, setConsultationDate] = useState(
    consultation?.consultationDate || formatDateToInput(new Date())
  );
  const [consultationTime, setConsultationTime] = useState(
    consultation?.consultationTime || formatTimeToInput(new Date())
  );
  const [attendingPhysician, setAttendingPhysician] = useState(
    consultation?.attendingPhysician || ''
  );
  const [chiefComplaint, setChiefComplaint] = useState(
    consultation?.chiefComplaint || ''
  );
  const [status, setStatus] = useState<ConsultationStatus>(
    consultation?.status || ConsultationStatus.SCHEDULED
  );
  const [followUpDate, setFollowUpDate] = useState(consultation?.followUpDate || '');
  const [followUpNotes, setFollowUpNotes] = useState(consultation?.followUpNotes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch appointment details if appointmentId is provided
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) return;
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            date,
            time,
            reason,
            patients (
              id,
              name
            )
          `)
          .eq('id', appointmentId)
          .eq('user_id', currentUser.user.id)
          .single();
          
        if (error) throw error;
        
        setAppointmentDetails(data);
        setPatientId(data.patient_id);
        setConsultationDate(data.date);
        setConsultationTime(data.time);
        setChiefComplaint(data.reason);
      } catch (err: any) {
        console.error('Error fetching appointment details:', err);
        setError(err.message);
      }
    };
    
    fetchAppointmentDetails();
  }, [appointmentId]);

  // Fetch current user's name for attending physician if not set
  useEffect(() => {
    const fetchUserName = async () => {
      if (attendingPhysician) return;
      
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) return;
        
        // Use email as fallback
        setAttendingPhysician(`Dr. ${currentUser.user.email?.split('@')[0] || 'Provider'}`);
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };
    
    fetchUserName();
  }, [attendingPhysician]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const consultationData: NewDbConsultation | UpdateDbConsultation = {
        patient_id: patientId,
        consultation_date: consultationDate,
        consultation_time: consultationTime,
        attending_physician: attendingPhysician,
        chief_complaint: chiefComplaint,
        status,
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes || null,
        appointment_id: appointmentId || null
      };
      
      await onSubmit(consultationData);
    } catch (err: any) {
      console.error('Error submitting consultation:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Patient Selection */}
      <div>
        <label htmlFor="patient" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Patient", "நோயாளி")} *
        </label>
        <select
          id="patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
          disabled={!!appointmentId}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="">{getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {appointmentDetails && (
          <p className="mt-1 text-sm text-sky-600">
            {getBilingualLabel("Selected from appointment:", "சந்திப்பிலிருந்து தேர்ந்தெடுக்கப்பட்டது:")} {appointmentDetails.patients?.name}
          </p>
        )}
      </div>
      
      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="consultationDate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Consultation Date", "ஆலோசனை தேதி")} *
          </label>
          <input
            type="date"
            id="consultationDate"
            value={consultationDate}
            onChange={(e) => setConsultationDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="consultationTime" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Consultation Time", "ஆலோசனை நேரம்")} *
          </label>
          <input
            type="time"
            id="consultationTime"
            value={consultationTime}
            onChange={(e) => setConsultationTime(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Attending Physician */}
      <div>
        <label htmlFor="attendingPhysician" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Attending Physician", "கவனிக்கும் மருத்துவர்")} *
        </label>
        <input
          type="text"
          id="attendingPhysician"
          value={attendingPhysician}
          onChange={(e) => setAttendingPhysician(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Chief Complaint */}
      <div>
        <label htmlFor="chiefComplaint" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Chief Complaint", "முதன்மை புகார்")} *
        </label>
        <textarea
          id="chiefComplaint"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          rows={3}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Status", "நிலை")} *
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ConsultationStatus)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value={ConsultationStatus.SCHEDULED}>{getBilingualLabel("Scheduled", "திட்டமிடப்பட்டது")}</option>
          <option value={ConsultationStatus.IN_PROGRESS}>{getBilingualLabel("In Progress", "நடைபெறுகிறது")}</option>
          <option value={ConsultationStatus.COMPLETED}>{getBilingualLabel("Completed", "முடிக்கப்பட்டது")}</option>
          <option value={ConsultationStatus.CANCELLED}>{getBilingualLabel("Cancelled", "ரத்து செய்யப்பட்டது")}</option>
        </select>
      </div>
      
      {/* Follow-up Information */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-medium text-slate-700 mb-4">
          {getBilingualLabel("Follow-up Information (Optional)", "பின்தொடர்தல் தகவல் (விருப்பமானது)")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="followUpDate" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Follow-up Date", "பின்தொடர்தல் தேதி")}
            </label>
            <input
              type="date"
              id="followUpDate"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={consultationDate}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="followUpNotes" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Follow-up Notes", "பின்தொடர்தல் குறிப்புகள்")}
            </label>
            <textarea
              id="followUpNotes"
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {consultation ? 
            getBilingualLabel("Update Consultation", "ஆலோசனையைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Create Consultation", "ஆலோசனையை உருவாக்கவும்")
          }
        </Button>
      </div>
    </form>
  );
};

export default ConsultationForm;