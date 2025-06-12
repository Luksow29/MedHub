import React, { useState } from 'react';
import { 
  Prescription, 
  NewDbPrescription, 
  UpdateDbPrescription 
} from '../../types';
import Button from '../shared/Button';

interface PrescriptionFormProps {
  prescription?: Prescription;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbPrescription | UpdateDbPrescription) => Promise<void>;
  onCancel: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  prescription,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [medicationName, setMedicationName] = useState(prescription?.medicationName || '');
  const [dosage, setDosage] = useState(prescription?.dosage || '');
  const [frequency, setFrequency] = useState(prescription?.frequency || '');
  const [duration, setDuration] = useState(prescription?.duration || 7);
  const [quantity, setQuantity] = useState<number | null>(prescription?.quantity || null);
  const [route, setRoute] = useState(prescription?.route || '');
  const [specialInstructions, setSpecialInstructions] = useState(prescription?.specialInstructions || '');
  const [isRefillable, setIsRefillable] = useState(prescription?.isRefillable || false);
  const [refillCount, setRefillCount] = useState(prescription?.refillCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const commonRoutes = [
    { value: '', label: getBilingualLabel('Select Route', 'வழியைத் தேர்ந்தெடுக்கவும்') },
    { value: 'oral', label: getBilingualLabel('Oral', 'வாய் வழி') },
    { value: 'topical', label: getBilingualLabel('Topical', 'தோல் வழி') },
    { value: 'inhalation', label: getBilingualLabel('Inhalation', 'சுவாச வழி') },
    { value: 'injection', label: getBilingualLabel('Injection', 'ஊசி வழி') },
    { value: 'sublingual', label: getBilingualLabel('Sublingual', 'நாக்கடி வழி') },
    { value: 'rectal', label: getBilingualLabel('Rectal', 'மலக்குடல் வழி') },
    { value: 'ophthalmic', label: getBilingualLabel('Ophthalmic', 'கண் வழி') },
    { value: 'otic', label: getBilingualLabel('Otic', 'காது வழி') },
    { value: 'nasal', label: getBilingualLabel('Nasal', 'மூக்கு வழி') }
  ];

  const commonFrequencies = [
    { value: '', label: getBilingualLabel('Select Frequency', 'அடுக்கைத் தேர்ந்தெடுக்கவும்') },
    { value: 'once daily', label: getBilingualLabel('Once daily', 'தினமும் ஒரு முறை') },
    { value: 'twice daily', label: getBilingualLabel('Twice daily', 'தினமும் இரண்டு முறை') },
    { value: 'three times daily', label: getBilingualLabel('Three times daily', 'தினமும் மூன்று முறை') },
    { value: 'four times daily', label: getBilingualLabel('Four times daily', 'தினமும் நான்கு முறை') },
    { value: 'every 4 hours', label: getBilingualLabel('Every 4 hours', 'ஒவ்வொரு 4 மணி நேரமும்') },
    { value: 'every 6 hours', label: getBilingualLabel('Every 6 hours', 'ஒவ்வொரு 6 மணி நேரமும்') },
    { value: 'every 8 hours', label: getBilingualLabel('Every 8 hours', 'ஒவ்வொரு 8 மணி நேரமும்') },
    { value: 'every 12 hours', label: getBilingualLabel('Every 12 hours', 'ஒவ்வொரு 12 மணி நேரமும்') },
    { value: 'as needed', label: getBilingualLabel('As needed', 'தேவைப்படும்போது') },
    { value: 'before meals', label: getBilingualLabel('Before meals', 'உணவுக்கு முன்') },
    { value: 'after meals', label: getBilingualLabel('After meals', 'உணவுக்குப் பின்') },
    { value: 'at bedtime', label: getBilingualLabel('At bedtime', 'படுக்கைக்குச் செல்லும் நேரத்தில்') },
    { value: 'weekly', label: getBilingualLabel('Weekly', 'வாரந்தோறும்') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const prescriptionData: NewDbPrescription | UpdateDbPrescription = {
        consultation_id: consultationId,
        patient_id: patientId,
        medication_name: medicationName,
        dosage,
        frequency,
        duration,
        quantity: quantity,
        route: route || null,
        special_instructions: specialInstructions || null,
        is_refillable: isRefillable,
        refill_count: isRefillable ? refillCount : 0
      };
      
      await onSubmit(prescriptionData);
    } catch (err: any) {
      console.error('Error submitting prescription:', err);
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
      
      {/* Medication Name */}
      <div>
        <label htmlFor="medicationName" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Medication Name", "மருந்து பெயர்")} *
        </label>
        <input
          type="text"
          id="medicationName"
          value={medicationName}
          onChange={(e) => setMedicationName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Dosage */}
      <div>
        <label htmlFor="dosage" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Dosage", "அளவு")} *
        </label>
        <input
          type="text"
          id="dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          required
          placeholder="e.g., 500mg, 5ml, 1 tablet"
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Frequency */}
      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Frequency", "அடுக்கு")} *
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {commonFrequencies.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      {/* Route */}
      <div>
        <label htmlFor="route" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Route", "வழி")}
        </label>
        <select
          id="route"
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {commonRoutes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      {/* Duration and Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Duration (days)", "கால அளவு (நாட்கள்)")} *
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            min="1"
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Quantity", "அளவு")}
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity === null ? '' : quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Special Instructions */}
      <div>
        <label htmlFor="specialInstructions" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Special Instructions", "சிறப்பு வழிமுறைகள்")}
        </label>
        <textarea
          id="specialInstructions"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Refill Options */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRefillable"
            checked={isRefillable}
            onChange={(e) => setIsRefillable(e.target.checked)}
            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
          />
          <label htmlFor="isRefillable" className="ml-2 block text-sm text-slate-700">
            {getBilingualLabel("Allow Refills", "மறுநிரப்புதல்களை அனுமதிக்கவும்")}
          </label>
        </div>
        
        {isRefillable && (
          <div className="mt-3">
            <label htmlFor="refillCount" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Number of Refills", "மறுநிரப்புதல்களின் எண்ணிக்கை")}
            </label>
            <input
              type="number"
              id="refillCount"
              value={refillCount}
              onChange={(e) => setRefillCount(parseInt(e.target.value) || 0)}
              min="0"
              max="12"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        )}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {prescription?.id ? 
            getBilingualLabel("Update Prescription", "மருந்து சீட்டைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Add Prescription", "மருந்து சீட்டைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default PrescriptionForm;