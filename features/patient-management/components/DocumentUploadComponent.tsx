// src/features/patient-management/components/DocumentUploadComponent.tsx

import React, { useState } from 'react';
import { NewDbPatientDocument } from '../../../types'; // பாதை சரிபார்க்கவும்
import Button from '../../components/shared/Button'; // பாதை சரிபார்க்கவும்

interface DocumentUploadComponentProps {
  // `notes` மற்றும் `document_type` மட்டுமே UI இலிருந்து நேரடியாக வரும்
  onSubmit: (data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>, file: File) => Promise<void>;
  onCancel: () => void;
  documentTypeOptions: { value: string; label: string }[]; // Bilingual options passed as prop
}

const DocumentUploadComponent: React.FC<DocumentUploadComponentProps> = ({ onSubmit, onCancel, documentTypeOptions }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(documentTypeOptions[0]?.value || '');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert(getBilingualLabel("Please select a file to upload.", "பதிவேற்ற ஒரு கோப்பைத் தேர்ந்தெடுக்கவும்."));
      return;
    }
    setIsLoading(true);
    // data வின் வகையை Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'> என அனுப்பவும்
    await onSubmit({ document_type: documentType, notes: notes || null }, selectedFile);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="documentType" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Document Type", "ஆவண வகை")}</label>
        <select
          id="documentType"
          value={documentType || ''}
          onChange={(e) => setDocumentType(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          {documentTypeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Select File", "கோப்பைத் தேர்வுசெய்")}</label>
        <input
          type="file"
          id="file"
          onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}</label>
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
          {getBilingualLabel("Upload", "பதிவேற்று")}
        </Button>
      </div>
    </form>
  );
};

export default DocumentUploadComponent;