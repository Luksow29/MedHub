// features/patient-management/components/PatientForm.tsx

import React, { useState } from 'react';
import { Patient, ReminderMethod, NewDbPatient } from '../../../types'; // சரி செய்யப்பட்டது: features/patient-management/components இலிருந்து types
import Button from '../../../components/shared/Button'; // இது சரியானதாகவே இருக்க வேண்டும் (features/patient-management/components இலிருந்து components/shared)
import { formatDateToInput } from '../../../utils/dateHelpers'; // இது சரியானதாகவே இருக்க வேண்டும் (features/patient-management/components இலிருந்து utils)

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: NewDbPatient) => Promise<void>;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, onSubmit, onCancel }) => {
  const [name, setName] = useState(patient?.name || '');
  const [dob, setDob] = useState(patient?.dob || '');
  const [gender, setGender] = useState(patient?.gender || 'குறிப்பிடவில்லை');
  const [contactPhone, setContactPhone] = useState(patient?.phone || '');
  const [contactEmail, setContactEmail] = useState(patient?.email || '');
  const [address, setAddress] = useState(patient?.address || '');
  const [emergencyContactName, setEmergencyContactName] = useState(patient?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(patient?.emergencyContactPhone || '');
  const [preferredLanguage, setPreferredLanguage] = useState(patient?.preferredLanguage || 'English');
  const [preferredContactMethod, setPreferredContactMethod] = useState<ReminderMethod>(
    patient?.preferredContactMethod || ReminderMethod.EMAIL
  );
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => {
    return `${english} (${tamil})`;
  };

  const patientGenderOptions = [
    { value: 'ஆண்', label: getBilingualLabel('Male', 'ஆண்') },
    { value: 'பெண்', label: getBilingualLabel('Female', 'பெண்') },
    { value: 'மற்றவை', label: getBilingualLabel('Other', 'மற்றவை') },
    { value: 'குறிப்பிடவில்லை', label: getBilingualLabel('Prefer not to say', 'குறிப்பிடவில்லை') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({
      name,
      dob: dob || null,
      gender: gender as any || null,
      contact_phone: contactPhone,
      contact_email: contactEmail || null,
      address: address || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      preferred_language: preferredLanguage || null,
      preferred_contact_method: preferredContactMethod,
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="patientName" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Full Name", "முழு பெயர்")}</label>
        <input
          type="text"
          id="patientName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Date of Birth", "பிறந்த தேதி")}</label>
          <input
            type="date"
            id="dob"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Gender", "பால்")}</label>
          <select
            id="gender"
            value={gender || ''}
            onChange={(e) => setGender(e.target.value as 'ஆண்' | 'பெண்' | 'மற்றவை' | 'குறிப்பிடவில்லை')}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="">{getBilingualLabel("Select", "தேர்வு செய்யவும்")}</option>
            {patientGenderOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Phone Number", "தொலைபேசி எண்")}</label>
        <input
          type="tel"
          id="contactPhone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Email Address", "மின்னஞ்சல் முகவரி")}</label>
        <input
          type="email"
          id="contactEmail"
          value={contactEmail || ''}
          onChange={(e) => setContactEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Address", "முகவரி")}</label>
        <textarea
          id="address"
          value={address || ''}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Emergency Contact Name", "அவசர தொடர்பு பெயர்")}</label>
          <input
            type="text"
            id="emergencyContactName"
            value={emergencyContactName || ''}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Emergency Contact Phone", "அவசர தொடர்பு தொலைபேசி")}</label>
          <input
            type="tel"
            id="emergencyContactPhone"
            value={emergencyContactPhone || ''}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="preferredLanguage" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Preferred Language", "விருப்பமான மொழி")}</label>
        <select
          id="preferredLanguage"
          value={preferredLanguage || ''}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="English">{getBilingualLabel("English", "ஆங்கிலம்")}</option>
          <option value="தமிழ்">{getBilingualLabel("Tamil", "தமிழ்")}</option>
        </select>
      </div>
      <div>
        <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Preferred Contact Method", "விருப்பமான தொடர்பு முறை")}</label>
        <select
          id="preferredContactMethod"
          value={preferredContactMethod}
          onChange={(e) => setPreferredContactMethod(e.target.value as ReminderMethod)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value={ReminderMethod.EMAIL}>{getBilingualLabel("Email", "மின்னஞ்சல்")}</option>
          <option value={ReminderMethod.SMS}>{getBilingualLabel("SMS", "எஸ்எம்எஸ்")}</option>
          <option value={ReminderMethod.NONE}>{getBilingualLabel("None", "ஏதுமில்லை")}</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {patient ? getBilingualLabel("Save Changes", "மாற்றங்களைச் சேமி") : getBilingualLabel("Add Patient", "நோயாளியைச் சேர்")}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;