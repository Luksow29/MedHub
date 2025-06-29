import React, { useState } from 'react';
import { NewDbConsultationDocument } from '../../types';
import Button from '../shared/Button';

interface ConsultationDocumentUploadProps {
  consultationId: string;
  patientId: string;
  onSubmit: (data: Omit<NewDbConsultationDocument, 'file_name' | 'file_path'>, file: File) => Promise<void>;
  onCancel: () => void;
}

const ConsultationDocumentUpload: React.FC<ConsultationDocumentUploadProps> = ({
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const documentTypeOptions = [
    { value: '', label: getBilingualLabel('Select Document Type', 'ஆவண வகையைத் தேர்ந்தெடுக்கவும்') },
    { value: 'Clinical Image', label: getBilingualLabel('Clinical Image', 'மருத்துவ படம்') },
    { value: 'Lab Report', label: getBilingualLabel('Lab Report', 'ஆய்வக அறிக்கை') },
    { value: 'Radiology Report', label: getBilingualLabel('Radiology Report', 'கதிரியக்க அறிக்கை') },
    { value: 'ECG', label: getBilingualLabel('ECG', 'இசிஜி') },
    { value: 'Consent Form', label: getBilingualLabel('Consent Form', 'ஒப்புதல் படிவம்') },
    { value: 'Referral Letter', label: getBilingualLabel('Referral Letter', 'பரிந்துரை கடிதம்') },
    { value: 'Prescription', label: getBilingualLabel('Prescription', 'மருந்து சீட்டு') },
    { value: 'Other', label: getBilingualLabel('Other', 'மற்றவை') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError(getBilingualLabel("Please select a file to upload.", "பதிவேற்ற ஒரு கோப்பைத் தேர்ந்தெடுக்கவும்."));
      return;
    }
    
    if (!documentType) {
      setError(getBilingualLabel("Please select a document type.", "ஆவண வகையைத் தேர்ந்தெடுக்கவும்."));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onSubmit(
        {
          consultation_id: consultationId,
          patient_id: patientId,
          document_type: documentType,
          description: description || null
        },
        selectedFile
      );
    } catch (err: any) {
      console.error('Error uploading document:', err);
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
      
      {/* Document Type */}
      <div>
        <label htmlFor="documentType" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Document Type", "ஆவண வகை")} *
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {documentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      {/* File Upload */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Select File", "கோப்பைத் தேர்வுசெய்")} *
        </label>
        <input
          type="file"
          id="file"
          onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
        />
        <p className="mt-1 text-sm text-slate-500">
          {getBilingualLabel(
            "Accepted file types: JPG, PNG, PDF, DOCX (max 10MB)",
            "ஏற்றுக்கொள்ளப்பட்ட கோப்பு வகைகள்: JPG, PNG, PDF, DOCX (அதிகபட்சம் 10MB)"
          )}
        </p>
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Description (Optional)", "விளக்கம் (விருப்பமானது)")}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          {getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
        </Button>
      </div>
    </form>
  );
};

export default ConsultationDocumentUpload;