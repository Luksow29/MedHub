// components/PatientDeleteConfirmation.tsx - Confirmation dialog for patient deletion

import React, { useState } from 'react';
import { Patient } from '../types';
import Button from './shared/Button';
import Modal from './shared/Modal';

interface PatientDeleteConfirmationProps {
  isOpen: boolean;
  patient: Patient | null;
  onConfirm: (deletionReason?: string) => Promise<void>;
  onCancel: () => void;
}

const PatientDeleteConfirmation: React.FC<PatientDeleteConfirmationProps> = ({
  isOpen,
  patient,
  onConfirm,
  onCancel
}) => {
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleConfirm = async () => {
    if (!patient) return;
    
    // Require confirmation text
    if (confirmText.toLowerCase() !== 'delete') {
      alert(getBilingualLabel('Please type "DELETE" to confirm', '"DELETE" என்று தட்டச்சு செய்து உறுதிப்படுத்தவும்'));
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm(deletionReason || undefined);
      // Reset form
      setDeletionReason('');
      setConfirmText('');
    } catch (error) {
      console.error('Delete confirmation error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setDeletionReason('');
    setConfirmText('');
    onCancel();
  };

  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={getBilingualLabel("Delete Patient", "நோயாளியை நீக்கு")}
    >
      <div className="space-y-6">
        {/* Warning Message */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {getBilingualLabel("Warning: Patient Deletion", "எச்சரிக்கை: நோயாளியை நீக்குதல்")}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {getBilingualLabel(
                    "You are about to delete the patient record for:",
                    "நீங்கள் பின்வரும் நோயாளியின் பதிவை நீக்க உள்ளீர்கள்:"
                  )}
                </p>
                <p className="font-semibold mt-1">{patient.name}</p>
                <p className="mt-2">
                  {getBilingualLabel(
                    "This action will:",
                    "இந்த செயல்:"
                  )}
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>{getBilingualLabel("Hide the patient from all lists", "அனைத்து பட்டியல்களிலிருந்தும் நோயாளியை மறைக்கும்")}</li>
                  <li>{getBilingualLabel("Archive all medical records", "அனைத்து மருத்துவ பதிவுகளையும் காப்பகப்படுத்தும்")}</li>
                  <li>{getBilingualLabel("Preserve data for potential restoration", "சாத்தியமான மீட்டெடுப்பிற்காக தரவைப் பாதுகாக்கும்")}</li>
                  <li>{getBilingualLabel("Create an audit trail", "ஒரு தணிக்கை பாதையை உருவாக்கும்")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-slate-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-slate-900 mb-3">
            {getBilingualLabel("Patient Information", "நோயாளர் தகவல்")}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">{getBilingualLabel("Name", "பெயர்")}:</span>
              <span className="ml-2 font-medium">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-600">{getBilingualLabel("Phone", "தொலைபேசி")}:</span>
              <span className="ml-2 font-medium">{patient.phone}</span>
            </div>
            <div>
              <span className="text-slate-600">{getBilingualLabel("Email", "மின்னஞ்சல்")}:</span>
              <span className="ml-2 font-medium">{patient.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-600">{getBilingualLabel("ID", "அடையாள எண்")}:</span>
              <span className="ml-2 font-medium text-xs">{patient.id}</span>
            </div>
          </div>
        </div>

        {/* Deletion Reason */}
        <div>
          <label htmlFor="deletionReason" className="block text-sm font-medium text-slate-700 mb-2">
            {getBilingualLabel("Reason for Deletion (Optional)", "நீக்குவதற்கான காரணம் (விருப்பமானது)")}
          </label>
          <textarea
            id="deletionReason"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            rows={3}
            placeholder={getBilingualLabel(
              "Enter the reason for deleting this patient record...",
              "இந்த நோயாளர் பதிவை நீக்குவதற்கான காரணத்தை உள்ளிடவும்..."
            )}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Confirmation Input */}
        <div>
          <label htmlFor="confirmText" className="block text-sm font-medium text-slate-700 mb-2">
            {getBilingualLabel("Type 'DELETE' to confirm", "'DELETE' என்று தட்டச்சு செய்து உறுதிப்படுத்தவும்")}
          </label>
          <input
            type="text"
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            {getBilingualLabel("Cancel", "ரத்துசெய்")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            isLoading={isDeleting}
            disabled={confirmText.toLowerCase() !== 'delete'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {getBilingualLabel("Delete Patient", "நோயாளியை நீக்கு")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PatientDeleteConfirmation;