import React, { useState, useEffect } from 'react';
import { 
  Diagnosis, 
  NewDbDiagnosis, 
  UpdateDbDiagnosis,
  IcdCode
} from '../../types';
import { IcdVersion } from '../../types/consultation';
import Button from '../shared/Button';
import { formatDateToInput } from '../../utils/dateHelpers';
import { searchIcdCodes } from '../../api/diagnoses';

interface DiagnosisFormProps {
  diagnosis?: Diagnosis;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbDiagnosis | UpdateDbDiagnosis) => Promise<void>;
  onCancel: () => void;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  diagnosis,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [icdCode, setIcdCode] = useState(diagnosis?.icdCode || '');
  const [icdVersion, setIcdVersion] = useState<IcdVersion>(diagnosis?.icdVersion || IcdVersion.ICD10);
  const [description, setDescription] = useState(diagnosis?.description || '');
  const [isPrimary, setIsPrimary] = useState(diagnosis?.isPrimary || false);
  const [diagnosisDate, setDiagnosisDate] = useState(diagnosis?.diagnosisDate || formatDateToInput(new Date()));
  const [notes, setNotes] = useState(diagnosis?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ICD code search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<IcdCode[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Search for ICD codes when search term changes
  useEffect(() => {
    const searchIcd = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const { data, error } = await searchIcdCodes(searchTerm, icdVersion);
        if (error) throw error;
        
        setSearchResults(data || []);
      } catch (err: any) {
        console.error('Error searching ICD codes:', err);
        setError(err.message);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(searchIcd, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, icdVersion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const diagnosisData: NewDbDiagnosis | UpdateDbDiagnosis = {
        consultation_id: consultationId,
        patient_id: patientId,
        icd_code: icdCode,
        icd_version: icdVersion,
        description,
        is_primary: isPrimary,
        diagnosis_date: diagnosisDate,
        notes: notes || null
      };
      
      await onSubmit(diagnosisData);
    } catch (err: any) {
      console.error('Error submitting diagnosis:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIcdCodeSelect = (code: IcdCode) => {
    setIcdCode(code.code);
    setDescription(code.description);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* ICD Code Search */}
      <div>
        <label htmlFor="icdSearch" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Search ICD Codes", "ICD குறியீடுகளைத் தேடுங்கள்")}
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="icdSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getBilingualLabel("Search by code or description", "குறியீடு அல்லது விளக்கத்தால் தேடுங்கள்")}
            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-2">
              <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-1 bg-white shadow-lg rounded-md border border-slate-200 max-h-60 overflow-y-auto">
            <ul className="divide-y divide-slate-200">
              {searchResults.map((code) => (
                <li 
                  key={`${code.code}-${code.version}`}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleIcdCodeSelect(code)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-sky-700">{code.code}</span>
                    <span className="text-xs text-slate-500">{code.version}</span>
                  </div>
                  <p className="text-sm text-slate-600">{code.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* ICD Version */}
      <div>
        <label htmlFor="icdVersion" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("ICD Version", "ICD பதிப்பு")} *
        </label>
        <select
          id="icdVersion"
          value={icdVersion}
          onChange={(e) => setIcdVersion(e.target.value as IcdVersion)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value={IcdVersion.ICD10}>{getBilingualLabel("ICD-10", "ICD-10")}</option>
          <option value={IcdVersion.ICD11}>{getBilingualLabel("ICD-11", "ICD-11")}</option>
        </select>
      </div>
      
      {/* ICD Code */}
      <div>
        <label htmlFor="icdCode" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("ICD Code", "ICD குறியீடு")} *
        </label>
        <input
          type="text"
          id="icdCode"
          value={icdCode}
          onChange={(e) => setIcdCode(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Description", "விளக்கம்")} *
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Is Primary */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrimary"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
        />
        <label htmlFor="isPrimary" className="ml-2 block text-sm text-slate-700">
          {getBilingualLabel("Primary Diagnosis", "முதன்மை நோயறிதல்")}
        </label>
      </div>
      
      {/* Diagnosis Date */}
      <div>
        <label htmlFor="diagnosisDate" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Diagnosis Date", "நோயறிதல் தேதி")} *
        </label>
        <input
          type="date"
          id="diagnosisDate"
          value={diagnosisDate}
          onChange={(e) => setDiagnosisDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      
      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Notes", "குறிப்புகள்")}
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
          {diagnosis ? 
            getBilingualLabel("Update Diagnosis", "நோயறிதலைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Add Diagnosis", "நோயறிதலைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default DiagnosisForm;