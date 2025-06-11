// src/features/patient-management/components/MedicationForm.tsx

import React, { useState } from 'react';
import { NewDbMedication } from '../../../types'; // பாதை சரிபார்க்கவும்
import Button from '../../../components/shared/Button'; // சரி செய்யப்பட்ட பாதை
import { formatDateToInput } from '../../../utils/dateHelpers'; // பாதை சரிபார்க்கவும்

interface MedicationFormProps {
  onSubmit: (data: NewDbMedication) => Promise<void>;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ onSubmit, onCancel }) => {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(formatDateToInput(new Date()));
  const [endDate, setEndDate] = useState(''); // Optional
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({
      medication_name: medicationName,
      dosage: dosage || null,
      frequency: frequency || null,
      start_date: startDate || null,
      end_date: endDate || null, // Ensure null if empty
      notes: notes || null,
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="medicationName" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Medication Name", "மருந்து பெயர்")}</label>
        <input
          type="text"
          id="medicationName"
          value={medicationName}
          onChange={(e) => setMedicationName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="dosage" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Dosage", "மருந்தளவு")}</label>
        <input
          type="text"
          id="dosage"
          value={dosage || ''}
          onChange={(e) => setDosage(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Frequency", "அளவு")}</label>
        <input
          type="text"
          id="frequency"
          value={frequency || ''}
          onChange={(e) => setFrequency(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Start Date", "தொடங்கிய தேதி")}</label>
          <input
            type="date"
            id="startDate"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">{getBilingualLabel("End Date (Optional)", "முடியும் தேதி (விருப்பமானது)")}</label>
          <input
            type="date"
            id="endDate"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Notes", "குறிப்புகள்")}</label>
        <textarea
          id="notes"
          value={notes || ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {getBilingualLabel("Add Medication", "மருந்தைச் சேர்")}
        </Button>
      </div>
    </form>
  );
};

export default MedicationForm;