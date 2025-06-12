// features/patient-management/components/PatientAuditTrail.tsx - Display patient audit trail

import React, { useState, useEffect } from 'react';
import { AuditLogEntry, getPatientAuditTrail } from '../../../api/patientAudit';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/shared/Button';

interface PatientAuditTrailProps {
  patientId: string;
}

const PatientAuditTrail: React.FC<PatientAuditTrailProps> = ({ patientId }) => {
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const fetchAuditTrail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const trail = await getPatientAuditTrail(patientId, currentUser.data.user.id);
      setAuditTrail(trail);
    } catch (err: any) {
      console.error('Fetch audit trail error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchAuditTrail();
    }
  }, [patientId, isExpanded]);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'UPDATE':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'DELETE':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'RESTORE':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return getBilingualLabel('Created', 'உருவாக்கப்பட்டது');
      case 'UPDATE':
        return getBilingualLabel('Updated', 'புதுப்பிக்கப்பட்டது');
      case 'DELETE':
        return getBilingualLabel('Deleted', 'நீக்கப்பட்டது');
      case 'RESTORE':
        return getBilingualLabel('Restored', 'மீட்டெடுக்கப்பட்டது');
      default:
        return operation;
    }
  };

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'patients':
        return getBilingualLabel('Patient Info', 'நோயாளர் தகவல்');
      case 'medical_history':
        return getBilingualLabel('Medical History', 'மருத்துவ வரலாறு');
      case 'medications':
        return getBilingualLabel('Medications', 'மருந்துகள்');
      case 'allergies':
        return getBilingualLabel('Allergies', 'ஒவ்வாமைகள்');
      case 'insurance_billing':
        return getBilingualLabel('Insurance', 'காப்பீடு');
      case 'patient_documents':
        return getBilingualLabel('Documents', 'ஆவணங்கள்');
      default:
        return tableName;
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

  const formatChangedFields = (fields: string[]) => {
    if (!fields || fields.length === 0) return '';
    
    const fieldLabels = fields.map(field => {
      // Convert snake_case to readable labels
      switch (field) {
        case 'contact_phone':
          return getBilingualLabel('Phone', 'தொலைபேசி');
        case 'contact_email':
          return getBilingualLabel('Email', 'மின்னஞ்சல்');
        case 'emergency_contact_name':
          return getBilingualLabel('Emergency Contact', 'அவசர தொடர்பு');
        case 'preferred_contact_method':
          return getBilingualLabel('Contact Method', 'தொடர்பு முறை');
        case 'medication_name':
          return getBilingualLabel('Medication', 'மருந்து');
        case 'allergen_name':
          return getBilingualLabel('Allergen', 'ஒவ்வாமை');
        case 'condition_name':
          return getBilingualLabel('Condition', 'நிலை');
        case 'insurance_provider':
          return getBilingualLabel('Provider', 'வழங்குநர்');
        default:
          return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    });
    
    return fieldLabels.join(', ');
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-sky-700">
          {getBilingualLabel("Audit Trail", "தணிக்கை பாதை")}
        </h3>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="secondary"
          size="sm"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {getBilingualLabel("Hide", "மறைக்கவும்")}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {getBilingualLabel("Show History", "வரலாற்றைக் காட்டு")}
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-slate-600">{getBilingualLabel("Loading audit trail...", "தணிக்கை பாதை ஏற்றப்படுகிறது...")}</p>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">
                {getBilingualLabel("No audit trail", "தணிக்கை பாதை இல்லை")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {getBilingualLabel("No changes have been recorded for this patient", "இந்த நோயாளருக்கு எந்த மாற்றங்களும் பதிவு செய்யப்படவில்லை")}
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {auditTrail.map((entry, entryIdx) => (
                  <li key={entry.id}>
                    <div className="relative pb-8">
                      {entryIdx !== auditTrail.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          {getOperationIcon(entry.operation)}
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-slate-900">
                              <span className="font-medium">{getOperationLabel(entry.operation)}</span>
                              {' '}
                              <span className="text-slate-600">{getTableLabel(entry.tableName)}</span>
                            </p>
                            {entry.changedFields && entry.changedFields.length > 0 && (
                              <p className="mt-1 text-xs text-slate-500">
                                {getBilingualLabel("Changed fields", "மாற்றப்பட்ட புலங்கள்")}: {formatChangedFields(entry.changedFields)}
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-slate-500">
                            <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Refresh Button */}
          {!isLoading && (
            <div className="flex justify-center pt-4 border-t border-slate-200">
              <Button
                onClick={fetchAuditTrail}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {getBilingualLabel("Refresh", "புதுப்பிக்கவும்")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientAuditTrail;