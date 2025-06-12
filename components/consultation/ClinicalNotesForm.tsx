import React, { useState } from 'react';
import { 
  ClinicalNote, 
  NewDbClinicalNote, 
  UpdateDbClinicalNote 
} from '../../types';
import Button from '../shared/Button';

interface ClinicalNotesFormProps {
  clinicalNote?: ClinicalNote;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbClinicalNote | UpdateDbClinicalNote) => Promise<void>;
  onCancel: () => void;
}

const ClinicalNotesForm: React.FC<ClinicalNotesFormProps> = ({
  clinicalNote,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [subjective, setSubjective] = useState(clinicalNote?.subjective || '');
  const [objective, setObjective] = useState(clinicalNote?.objective || '');
  const [assessment, setAssessment] = useState(clinicalNote?.assessment || '');
  const [plan, setPlan] = useState(clinicalNote?.plan || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const notesData: NewDbClinicalNote | UpdateDbClinicalNote = {
        consultation_id: consultationId,
        patient_id: patientId,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null
      };
      
      await onSubmit(notesData);
    } catch (err: any) {
      console.error('Error submitting clinical notes:', err);
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
      
      {/* SOAP Notes */}
      <div>
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          {getBilingualLabel("SOAP Notes", "SOAP குறிப்புகள்")}
        </h3>
        
        {/* Subjective */}
        <div className="mb-4">
          <label htmlFor="subjective" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Subjective", "சப்ஜெக்டிவ்")} - {getBilingualLabel("Patient History & Complaints", "நோயாளி வரலாறு & புகார்கள்")}
          </label>
          <textarea
            id="subjective"
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            rows={4}
            placeholder={getBilingualLabel("Patient's description of symptoms, medical history, etc.", "நோயாளியின் அறிகுறிகள், மருத்துவ வரலாறு போன்றவற்றின் விளக்கம்")}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        {/* Objective */}
        <div className="mb-4">
          <label htmlFor="objective" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Objective", "ஆப்ஜெக்டிவ்")} - {getBilingualLabel("Examination Findings", "பரிசோதனை கண்டுபிடிப்புகள்")}
          </label>
          <textarea
            id="objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={4}
            placeholder={getBilingualLabel("Physical examination findings, vital signs, test results, etc.", "உடல் பரிசோதனை கண்டுபிடிப்புகள், உயிர் அறிகுறிகள், சோதனை முடிவுகள் போன்றவை")}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        {/* Assessment */}
        <div className="mb-4">
          <label htmlFor="assessment" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Assessment", "அசெஸ்மென்ட்")} - {getBilingualLabel("Clinical Assessment", "மருத்துவ மதிப்பீடு")}
          </label>
          <textarea
            id="assessment"
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            rows={4}
            placeholder={getBilingualLabel("Diagnosis, differential diagnoses, clinical impression, etc.", "நோயறிதல், வேறுபாட்டு நோயறிதல், மருத்துவ அபிப்பிராயம் போன்றவை")}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        {/* Plan */}
        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Plan", "ப்ளான்")} - {getBilingualLabel("Treatment Plan", "சிகிச்சைத் திட்டம்")}
          </label>
          <textarea
            id="plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={4}
            placeholder={getBilingualLabel("Treatment plan, medications, procedures, follow-up, etc.", "சிகிச்சைத் திட்டம், மருந்துகள், செயல்முறைகள், பின்தொடர்தல் போன்றவை")}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {clinicalNote?.id ? 
            getBilingualLabel("Update Notes", "குறிப்புகளைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Save Notes", "குறிப்புகளைச் சேமிக்கவும்")
          }
        </Button>
      </div>
    </form>
  );
};

export default ClinicalNotesForm;