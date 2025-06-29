import React, { useState } from 'react';
import {
  Referral,
  NewDbReferral,
  UpdateDbReferral,
} from '../../types'; // மற்ற வகைகள் index.ts இலிருந்து
import { ReferralUrgency, ReferralStatus } from '../../types/consultation'; // ReferralUrgency மற்றும் ReferralStatus ஐ நேரடியாக consultation.ts இலிருந்து இறக்குமதி செய்கிறோம்
import Button from '../shared/Button';

interface ReferralFormProps {
  referral?: Referral;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbReferral | UpdateDbReferral) => Promise<void>;
  onCancel: () => void;
}

const ReferralForm: React.FC<ReferralFormProps> = ({
  referral,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [referralType, setReferralType] = useState(referral?.referralType || '');
  const [specialist, setSpecialist] = useState(referral?.specialist || '');
  const [facility, setFacility] = useState(referral?.facility || '');
  const [reason, setReason] = useState(referral?.reason || '');
  const [urgency, setUrgency] = useState<ReferralUrgency>(
    referral?.urgency || ReferralUrgency.ROUTINE
  );
  const [status, setStatus] = useState<ReferralStatus>(
    referral?.status || ReferralStatus.PENDING
  );
  const [notes, setNotes] = useState(referral?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const referralTypes = [
    { value: '', label: getBilingualLabel('Select Type', 'வகையைத் தேர்ந்தெடுக்கவும்') },
    { value: 'specialist', label: getBilingualLabel('Specialist Consultation', 'நிபுணர் ஆலோசனை') },
    { value: 'diagnostic', label: getBilingualLabel('Diagnostic Testing', 'நோயறிதல் சோதனை') },
    { value: 'procedure', label: getBilingualLabel('Procedure', 'செயல்முறை') },
    { value: 'therapy', label: getBilingualLabel('Therapy', 'சிகிச்சை') },
    { value: 'second_opinion', label: getBilingualLabel('Second Opinion', 'இரண்டாவது கருத்து') },
    { value: 'follow_up', label: getBilingualLabel('Follow-up Care', 'பின்தொடர் பராமரிப்பு') }
  ];

  const specialistOptions = [
    { value: '', label: getBilingualLabel('Select Specialist', 'நிபுணரைத் தேர்ந்தெடுக்கவும்') },
    { value: 'Cardiologist', label: getBilingualLabel('Cardiologist', 'இதய மருத்துவர்') },
    { value: 'Dermatologist', label: getBilingualLabel('Dermatologist', 'தோல் மருத்துவர்') },
    { value: 'Endocrinologist', label: getBilingualLabel('Endocrinologist', 'நாளமில்லா சுரப்பி மருத்துவர்') },
    { value: 'Gastroenterologist', label: getBilingualLabel('Gastroenterologist', 'இரைப்பை மற்றும் குடல் மருத்துவர்') },
    { value: 'Neurologist', label: getBilingualLabel('Neurologist', 'நரம்பியல் மருத்துவர்') },
    { value: 'Obstetrician', label: getBilingualLabel('Obstetrician', 'மகப்பேறு மருத்துவர்') },
    { value: 'Ophthalmologist', label: getBilingualLabel('Ophthalmologist', 'கண் மருத்துவர்') },
    { value: 'Orthopedist', label: getBilingualLabel('Orthopedist', 'எலும்பியல் மருத்துவர்') },
    { value: 'Otolaryngologist', label: getBilingualLabel('Otolaryngologist (ENT)', 'காது, மூக்கு, தொண்டை மருத்துவர்') },
    { value: 'Pediatrician', label: getBilingualLabel('Pediatrician', 'குழந்தை மருத்துவர்') },
    { value: 'Psychiatrist', label: getBilingualLabel('Psychiatrist', 'மனநல மருத்துவர்') },
    { value: 'Pulmonologist', label: getBilingualLabel('Pulmonologist', 'நுரையீரல் மருத்துவர்') },
    { value: 'Rheumatologist', label: getBilingualLabel('Rheumatologist', 'மூட்டு வாத மருத்துவர்') },
    { value: 'Urologist', label: getBilingualLabel('Urologist', 'சிறுநீரக மருத்துவர்') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const referralData: NewDbReferral | UpdateDbReferral = {
        consultation_id: consultationId,
        patient_id: patientId,
        referral_type: referralType,
        specialist,
        facility: facility || null,
        reason,
        urgency,
        status,
        notes: notes || null
      };

      await onSubmit(referralData);
    } catch (err: any) {
      console.error('Error submitting referral:', err);
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

      {/* Referral Type */}
      <div>
        <label htmlFor="referralType" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Referral Type", "பரிந்துரை வகை")} *
        </label>
        <select
          id="referralType"
          value={referralType}
          onChange={(e) => setReferralType(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {referralTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Specialist */}
      <div>
        <label htmlFor="specialist" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Specialist", "நிபுணர்")} *
        </label>
        <select
          id="specialist"
          value={specialist}
          onChange={(e) => setSpecialist(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {specialistOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Facility */}
      <div>
        <label htmlFor="facility" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Facility (Optional)", "வசதி (விருப்பமானது)")}
        </label>
        <input
          type="text"
          id="facility"
          value={facility}
          onChange={(e) => setFacility(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Reason for Referral", "பரிந்துரைக்கான காரணம்")} *
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Urgency */}
      <div>
        <label htmlFor="urgency" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Urgency", "அவசரம்")} *
        </label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as ReferralUrgency)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value={ReferralUrgency.ROUTINE}>{getBilingualLabel("Routine", "வழக்கமான")}</option>
          <option value={ReferralUrgency.URGENT}>{getBilingualLabel("Urgent", "அவசரமான")}</option>
          <option value={ReferralUrgency.EMERGENCY}>{getBilingualLabel("Emergency", "அவசர நிலை")}</option>
        </select>
      </div>

      {/* Status */}
      {referral && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Status", "நிலை")} *
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReferralStatus)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value={ReferralStatus.PENDING}>{getBilingualLabel("Pending", "நிலுவையில்")}</option>
            <option value={ReferralStatus.ACCEPTED}>{getBilingualLabel("Accepted", "ஏற்றுக்கொள்ளப்பட்டது")}</option>
            <option value={ReferralStatus.COMPLETED}>{getBilingualLabel("Completed", "முடிக்கப்பட்டது")}</option>
            <option value={ReferralStatus.CANCELLED}>{getBilingualLabel("Cancelled", "ரத்து செய்யப்பட்டது")}</option>
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Additional Notes", "கூடுதல் குறிப்புகள்")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {referral?.id ?
            getBilingualLabel("Update Referral", "பரிந்துரையைப் புதுப்பிக்கவும்") :
            getBilingualLabel("Add Referral", "பரிந்துரையைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default ReferralForm;
