// components/DeletedPatientsManager.tsx - Manage deleted patients and restore functionality

import React, { useState, useEffect } from 'react';
import { DeletedPatient } from '../api/patientAudit';
import { getDeletedPatients, restorePatient } from '../api/patientAudit';
import { supabase } from '../lib/supabase';
import Button from './shared/Button';
import Modal from './shared/Modal';

interface DeletedPatientsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRestored?: () => void;
}

const DeletedPatientsManager: React.FC<DeletedPatientsManagerProps> = ({
  isOpen,
  onClose,
  onPatientRestored
}) => {
  const [deletedPatients, setDeletedPatients] = useState<DeletedPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const fetchDeletedPatients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const patients = await getDeletedPatients(currentUser.data.user.id);
      setDeletedPatients(patients);
    } catch (err: any) {
      console.error('Fetch deleted patients error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeletedPatients();
    }
  }, [isOpen]);

  const handleRestore = async (deletedPatient: DeletedPatient) => {
    if (!deletedPatient.canRestore) {
      alert(getBilingualLabel('This patient cannot be restored', 'இந்த நோயாளியை மீட்டெடுக்க முடியாது'));
      return;
    }

    const confirmRestore = window.confirm(
      getBilingualLabel(
        `Are you sure you want to restore ${deletedPatient.patientData.name}?`,
        `${deletedPatient.patientData.name} ஐ மீட்டெடுக்க விரும்புகிறீர்களா?`
      )
    );

    if (!confirmRestore) return;

    setRestoringId(deletedPatient.id);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      await restorePatient(deletedPatient.id, currentUser.data.user.id);
      
      // Refresh the list
      await fetchDeletedPatients();
      
      // Notify parent component
      if (onPatientRestored) {
        onPatientRestored();
      }

      alert(getBilingualLabel('Patient restored successfully', 'நோயாளி வெற்றிகரமாக மீட்டெடுக்கப்பட்டார்'));
    } catch (err: any) {
      console.error('Restore patient error:', err);
      alert(getBilingualLabel('Failed to restore patient', 'நோயாளியை மீட்டெடுக்க முடியவில்லை') + ': ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getBilingualLabel("Deleted Patients", "நீக்கப்பட்ட நோயாளிகள்")}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-600">
            {getBilingualLabel(
              "Manage deleted patient records and restore them if needed.",
              "நீக்கப்பட்ட நோயாளர் பதிவுகளை நிர்வகிக்கவும் மற்றும் தேவைப்பட்டால் அவற்றை மீட்டெடுக்கவும்."
            )}
          </p>
          <Button
            onClick={fetchDeletedPatients}
            variant="secondary"
            size="sm"
            isLoading={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {getBilingualLabel("Refresh", "புதுப்பிக்கவும்")}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && deletedPatients.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{getBilingualLabel("Loading deleted patients...", "நீக்கப்பட்ட நோயாளிகள் ஏற்றப்படுகிறது...")}</p>
          </div>
        ) : deletedPatients.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No deleted patients", "நீக்கப்பட்ட நோயாளிகள் இல்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("All patient records are active", "அனைத்து நோயாளர் பதிவுகளும் செயலில் உள்ளன")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deletedPatients.map((deletedPatient) => (
              <div key={deletedPatient.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-slate-900">
                      {deletedPatient.patientData.name}
                    </h4>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">{getBilingualLabel("Phone", "தொலைபேசி")}:</span> {deletedPatient.patientData.contact_phone}
                      </p>
                      {deletedPatient.patientData.contact_email && (
                        <p>
                          <span className="font-medium">{getBilingualLabel("Email", "மின்னஞ்சல்")}:</span> {deletedPatient.patientData.contact_email}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">{getBilingualLabel("Deleted", "நீக்கப்பட்டது")}:</span> {formatDate(deletedPatient.deletedAt)}
                      </p>
                      {deletedPatient.deletionReason && (
                        <p>
                          <span className="font-medium">{getBilingualLabel("Reason", "காரணம்")}:</span> {deletedPatient.deletionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    {deletedPatient.canRestore ? (
                      <Button
                        onClick={() => handleRestore(deletedPatient)}
                        variant="success"
                        size="sm"
                        isLoading={restoringId === deletedPatient.id}
                        disabled={restoringId !== null}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {getBilingualLabel("Restore", "மீட்டெடுக்கவும்")}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getBilingualLabel("Already Restored", "ஏற்கனவே மீட்டெடுக்கப்பட்டது")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            {getBilingualLabel("Close", "மூடு")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletedPatientsManager;