// src/features/patient-management/components/MedicalHistoryForm.tsx

import React, { useState } from 'react';
import { NewDbMedicalHistory } from '../../../types'; // பாதை சரிபார்க்கவும்
import Button from '../../../components/shared/Button'; // சரி செய்யப்பட்ட பாதை
import { formatDateToInput } from '../../../utils/dateHelpers'; // பாதை சரிபார்க்கவும்

interface MedicalHistoryFormProps {
  onSubmit: (data: NewDbMedicalHistory) => Promise<void>;
  onCancel: () => void;
}

const MedicalHistoryForm: React.FC<MedicalHistoryFormProps> = ({ onSubmit, onCancel }) => {
  const [diagnosisDate, setDiagnosisDate] = useState(formatDateToInput(new Date()));
  const [conditionName, setConditionName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({
      diagnosis_date: diagnosisDate,
      condition_name: conditionName,
      notes: notes || null // வெற்று சரமாக இருந்தால் null ஆக அனுப்பவும்
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="diagnosisDate" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Diagnosis Date", "நோயறிதல் தேதி")}</label>
        <input
          type="date"
          id="diagnosisDate"
          value={diagnosisDate}
          onChange={(e) => setDiagnosisDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="conditionName" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Condition Name", "நோய் பெயர்")}</label>
        <input
          type="text"
          id="conditionName"
          value={conditionName}
          onChange={(e) => setConditionName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
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
          {getBilingualLabel("Add History", "வரலாற்றைச் சேர்")}
        </Button>
      </div>
    </form>
  );
};

export default MedicalHistoryForm;