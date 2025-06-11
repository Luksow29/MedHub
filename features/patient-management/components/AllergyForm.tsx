// src/features/patient-management/components/AllergyForm.tsx

import React, { useState } from 'react';
import { NewDbAllergy } from '../../../types'; // பாதை சரிபார்க்கவும்
import Button from '../../components/shared/Button'; // பாதை சரிபார்க்கவும்

interface AllergyFormProps {
  onSubmit: (data: NewDbAllergy) => Promise<void>;
  onCancel: () => void;
  allergySeverityOptions: { value: string; label: string }[]; // Bilingual options passed as prop
}

const AllergyForm: React.FC<AllergyFormProps> = ({ onSubmit, onCancel, allergySeverityOptions }) => {
  const [allergenName, setAllergenName] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState(allergySeverityOptions[0]?.value || '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({
      allergen_name: allergenName,
      reaction: reaction || null,
      severity: severity as any || null, // Type assertion and handle null
      notes: notes || null,
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="allergenName" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Allergen Name", "ஒவ்வாமை பொருள்")}</label>
        <input
          type="text"
          id="allergenName"
          value={allergenName}
          onChange={(e) => setAllergenName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="reaction" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Reaction", "எதிர்வினை")}</label>
        <input
          type="text"
          id="reaction"
          value={reaction || ''}
          onChange={(e) => setReaction(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Severity", "தீவிரம்")}</label>
        <select
          id="severity"
          value={severity || ''}
          onChange={(e) => setSeverity(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {allergySeverityOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
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
          {getBilingualLabel("Add Allergy", "ஒவ்வாமையைச் சேர்")}
        </Button>
      </div>
    </form>
  );
};

export default AllergyForm;