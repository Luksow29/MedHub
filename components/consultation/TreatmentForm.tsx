import React, { useState } from 'react';
import { 
  Treatment, 
  NewDbTreatment, 
  UpdateDbTreatment 
} from '../../types';
import Button from '../shared/Button';

interface TreatmentFormProps {
  treatment?: Treatment;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbTreatment | UpdateDbTreatment) => Promise<void>;
  onCancel: () => void;
}

const TreatmentForm: React.FC<TreatmentFormProps> = ({
  treatment,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [treatmentCode, setTreatmentCode] = useState(treatment?.treatmentCode || '');
  const [treatmentName, setTreatmentName] = useState(treatment?.treatmentName || '');
  const [description, setDescription] = useState(treatment?.description || '');
  const [instructions, setInstructions] = useState(treatment?.instructions || '');
  const [duration, setDuration] = useState<number | null>(treatment?.duration || null);
  const [followUpRequired, setFollowUpRequired] = useState(treatment?.followUpRequired || false);
  const [followUpInterval, setFollowUpInterval] = useState<number | null>(treatment?.followUpInterval || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const treatmentData: NewDbTreatment | UpdateDbTreatment = {
        consultation_id: consultationId,
        patient_id: patientId,
        treatment_code: treatmentCode || null,
        treatment_name: treatmentName,
        description: description || null,
        instructions: instructions || null,
        duration: duration,
        follow_up_required: followUpRequired,
        follow_up_interval: followUpRequired ? followUpInterval : null
      };
      
      await onSubmit(treatmentData);
    } catch (err: any) {
      console.error('Error submitting treatment:', err);
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
      
      {/* Treatment Code */}
      <div>
        <label htmlFor="treatmentCode" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Treatment Code (Optional)", "சிகிச்சை குறியீடு (விருப்பமானது)")}
        </label>
        <input
          type="text"
          id="treatmentCode"
          value={treatmentCode}
          onChange={(e) => setTreatmentCode(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Treatment Name */}
      <div>
        <label htmlFor="treatmentName" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Treatment Name", "சிகிச்சை பெயர்")} *
        </label>
        <input
          type="text"
          id="treatmentName"
          value={treatmentName}
          onChange={(e) => setTreatmentName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Description", "விளக்கம்")}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Instructions */}
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Instructions", "வழிமுறைகள்")}
        </label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Duration (minutes)", "கால அளவு (நிமிடங்கள்)")}
        </label>
        <input
          type="number"
          id="duration"
          value={duration === null ? '' : duration}
          onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : null)}
          min="1"
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Follow-up Required */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="followUpRequired"
          checked={followUpRequired}
          onChange={(e) => setFollowUpRequired(e.target.checked)}
          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
        />
        <label htmlFor="followUpRequired" className="ml-2 block text-sm text-slate-700">
          {getBilingualLabel("Follow-up Required", "பின்தொடர்தல் தேவை")}
        </label>
      </div>
      
      {/* Follow-up Interval */}
      {followUpRequired && (
        <div>
          <label htmlFor="followUpInterval" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Follow-up Interval (days)", "பின்தொடர்தல் இடைவெளி (நாட்கள்)")} *
          </label>
          <input
            type="number"
            id="followUpInterval"
            value={followUpInterval === null ? '' : followUpInterval}
            onChange={(e) => setFollowUpInterval(e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            required={followUpRequired}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {treatment?.id ? 
            getBilingualLabel("Update Treatment", "சிகிச்சையைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Add Treatment", "சிகிச்சையைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default TreatmentForm;