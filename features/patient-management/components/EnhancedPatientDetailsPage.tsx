// features/patient-management/components/EnhancedPatientDetailsPage.tsx - Enhanced patient details with complete RUD operations

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  Patient, NewDbPatient, UpdateDbPatient,
  MedicalHistory, NewDbMedicalHistory, UpdateDbMedicalHistory,
  Medication, NewDbMedication, UpdateDbMedication,
  Allergy, NewDbAllergy, UpdateDbAllergy,
  InsuranceBilling, NewDbInsuranceBilling, UpdateDbInsuranceBilling,
  PatientDocument, NewDbPatientDocument,
} from '../../../types';

import Button from '../../../components/shared/Button';
import Modal from '../../../components/shared/Modal';
import PrintablePageWrapper from '../../../components/shared/PrintablePageWrapper';
import PrintExportButton from '../../../components/shared/PrintExportButton';
import PatientForm from './PatientForm';
import MedicalHistoryForm from './MedicalHistoryForm';
import MedicationForm from './MedicationForm';
import AllergyForm from './AllergyForm';
import InsuranceBillingForm from './InsuranceBillingForm';
import DocumentUploadComponent from './DocumentUploadComponent';
import PatientDeleteConfirmation from '../../../components/PatientDeleteConfirmation';
import PatientAuditTrail from './PatientAuditTrail';
import { usePatientData } from '../hooks/usePatientData';
import { softDeletePatient } from '../../../api/patientAudit';

// API functions
import * as PatientAPI from '../../../api/patients';
import * as MedicalHistoryAPI from '../../../api/medicalHistory';
import * as MedicationAPI from '../../../api/medications';
import * as AllergyAPI from '../../../api/allergies';
import * as InsuranceBillingAPI from '../../../api/insuranceBilling';
import * as DocumentAPI from '../../../api/documents';

const EnhancedPatientDetailsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const {
    patient, medicalHistory, medications, allergies, insuranceBilling, documents,
    isLoading, error, setError, refreshData
  } = usePatientData(patientId);

  // Modal states
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [isAddMedicalHistoryModalOpen, setIsAddMedicalHistoryModalOpen] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isAddInsuranceModalOpen, setIsAddInsuranceModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Edit states
  const [editingMedicalHistory, setEditingMedicalHistory] = useState<MedicalHistory | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceBilling | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const patientGenderOptions = [
    { value: 'ஆண்', label: getBilingualLabel('Male', 'ஆண்') },
    { value: 'பெண்', label: getBilingualLabel('Female', 'பெண்') },
    { value: 'மற்றவை', label: getBilingualLabel('Other', 'மற்றவை') },
    { value: 'குறிப்பிடவில்லை', label: getBilingualLabel('Prefer not to say', 'குறிப்பிடவில்லை') },
  ];

  const allergySeverityOptions = [
    { value: 'லேசான', label: getBilingualLabel('Mild', 'லேசான') },
    { value: 'மிதமான', label: getBilingualLabel('Moderate', 'மிதமான') },
    { value: 'கடுமையான', label: getBilingualLabel('Severe', 'கடுமையான') },
  ];

  const documentTypeOptions = [
    { value: 'MRI Report', label: getBilingualLabel('MRI Report', 'எம்ஆர்ஐ அறிக்கை') },
    { value: 'Prescription', label: getBilingualLabel('Prescription', 'மருந்துச்சீட்டு') },
    { value: 'Lab Results', label: getBilingualLabel('Lab Results', 'ஆய்வக முடிவுகள்') },
    { value: 'Consent Form', label: getBilingualLabel('Consent Form', 'சம்மதப் படிவம்') },
    { value: 'Other', label: getBilingualLabel('Other', 'மற்றவை') },
  ];

  // Patient operations
  const handleUpdatePatient = async (data: NewDbPatient) => {
    if (!patient || !patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await PatientAPI.updatePatient(patientId, data, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsEditPatientModalOpen(false);
    } catch (err: any) {
      console.error('நோயாளியைப் புதுப்பிப்பதில் பிழை:', err.message);
      setError('நோயாளியைப் புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

  const handleDeletePatient = async (deletionReason?: string) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      await softDeletePatient(patientId, currentUser.data.user.id, deletionReason);
      setIsDeleteConfirmationOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('நோயாளியை நீக்குவதில் பிழை:', err.message);
      setError('நோயாளியை நீக்க முடியவில்லை: ' + err.message);
    }
  };

  // Medical History operations
  const handleAddMedicalHistory = async (data: NewDbMedicalHistory) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicalHistoryAPI.addMedicalHistory(data, patientId, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsAddMedicalHistoryModalOpen(false);
    } catch (err: any) {
      console.error('மருத்துவ வரலாறு சேர்ப்பதில் பிழை:', err.message);
      setError('மருத்துவ வரலாறு சேர்ப்பதில் தோல்வி: ' + err.message);
    }
  };

  const handleUpdateMedicalHistory = async (data: UpdateDbMedicalHistory) => {
    if (!editingMedicalHistory) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicalHistoryAPI.updateMedicalHistory(editingMedicalHistory.id, data, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setEditingMedicalHistory(null);
    } catch (err: any) {
      console.error('மருத்துவ வரலாறு புதுப்பிப்பதில் பிழை:', err.message);
      setError('மருத்துவ வரலாறு புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

  const handleDeleteMedicalHistory = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this medical history entry?', 'இந்த மருத்துவ வரலாற்று பதிவை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicalHistoryAPI.deleteMedicalHistory(id, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('மருத்துவ வரலாறு நீக்குவதில் பிழை:', err.message);
      setError('மருத்துவ வரலாறு நீக்க முடியவில்லை: ' + err.message);
    }
  };

  // Medication operations
  const handleAddMedication = async (data: NewDbMedication) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicationAPI.addMedication(data, patientId, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsAddMedicationModalOpen(false);
    } catch (err: any) {
      console.error('மருந்து சேர்ப்பதில் பிழை:', err.message);
      setError('மருந்து சேர்ப்பதில் தோல்வி: ' + err.message);
    }
  };

  const handleUpdateMedication = async (data: UpdateDbMedication) => {
    if (!editingMedication) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicationAPI.updateMedication(editingMedication.id, data, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setEditingMedication(null);
    } catch (err: any) {
      console.error('மருந்து புதுப்பிப்பதில் பிழை:', err.message);
      setError('மருந்து புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this medication?', 'இந்த மருந்தை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await MedicationAPI.deleteMedication(id, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('மருந்து நீக்குவதில் பிழை:', err.message);
      setError('மருந்து நீக்க முடியவில்லை: ' + err.message);
    }
  };

  // Allergy operations
  const handleAddAllergy = async (data: NewDbAllergy) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await AllergyAPI.addAllergy(data, patientId, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsAddAllergyModalOpen(false);
    } catch (err: any) {
      console.error('ஒவ்வாமை சேர்ப்பதில் பிழை:', err.message);
      setError('ஒவ்வாமை சேர்ப்பதில் தோல்வி: ' + err.message);
    }
  };

  const handleUpdateAllergy = async (data: UpdateDbAllergy) => {
    if (!editingAllergy) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await AllergyAPI.updateAllergy(editingAllergy.id, data, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setEditingAllergy(null);
    } catch (err: any) {
      console.error('ஒவ்வாமை புதுப்பிப்பதில் பிழை:', err.message);
      setError('ஒவ்வாமை புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this allergy?', 'இந்த ஒவ்வாமையை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await AllergyAPI.deleteAllergy(id, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('ஒவ்வாமை நீக்குவதில் பிழை:', err.message);
      setError('ஒவ்வாமை நீக்க முடியவில்லை: ' + err.message);
    }
  };

  // Insurance operations
  const handleAddInsurance = async (data: NewDbInsuranceBilling) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await InsuranceBillingAPI.addInsuranceBilling(data, patientId, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsAddInsuranceModalOpen(false);
    } catch (err: any) {
      console.error('காப்பீடு சேர்ப்பதில் பிழை:', err.message);
      setError('காப்பீடு சேர்ப்பதில் தோல்வி: ' + err.message);
    }
  };

  const handleUpdateInsurance = async (data: UpdateDbInsuranceBilling) => {
    if (!editingInsurance) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await InsuranceBillingAPI.updateInsuranceBilling(editingInsurance.id, data, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setEditingInsurance(null);
    } catch (err: any) {
      console.error('காப்பீடு புதுப்பிப்பதில் பிழை:', err.message);
      setError('காப்பீடு புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

  const handleDeleteInsurance = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this insurance record?', 'இந்த காப்பீட்டு பதிவை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await InsuranceBillingAPI.deleteInsuranceBilling(id, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('காப்பீடு நீக்குவதில் பிழை:', err.message);
      setError('காப்பீடு நீக்க முடியவில்லை: ' + err.message);
    }
  };

  // Document operations
  const handleUploadDocument = async (data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>, file: File) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await DocumentAPI.uploadPatientDocument(data, file, patientId, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
      setIsUploadDocumentModalOpen(false);
    } catch (err: any) {
      console.error('ஆவணத்தைப் பதிவேற்றுவதில் பிழை:', err.message);
      setError('ஆவணத்தைப் பதிவேற்றுவதில் தோல்வி: ' + err.message);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this document?', 'இந்த ஆவணத்தை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await DocumentAPI.deletePatientDocument(id, currentUser.data.user.id);
      if (error) throw error;
      refreshData();
    } catch (err: any) {
      console.error('ஆவணத்தை நீக்குவதில் பிழை:', err.message);
      setError('ஆவணத்தை நீக்க முடியவில்லை: ' + err.message);
    }
  };

  if (isLoading) return <p className="text-center text-slate-600 py-8">{getBilingualLabel("Loading patient details...", "நோயாளரின் விவரங்கள் ஏற்றப்படுகிறது...")}</p>;
  if (error) return <p className="text-center text-red-600 py-8">{getBilingualLabel("Error:", "பிழை:")} {error}</p>;
  if (!patient) return <p className="text-center text-slate-600 py-8">{getBilingualLabel("Patient not found.", "நோயாளி கண்டுபிடிக்கப்படவில்லை.")}</p>;

  const pageTitle = `${getBilingualLabel("Patient Profile", "நோயாளர் சுயவிவரம்")} - ${patient.name}`;

  return (
    <PrintablePageWrapper pageTitle={pageTitle}>
      <div id="printable-medical-records-content" className="container mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="text-3xl font-semibold text-slate-800">{getBilingualLabel("Patient Profile", "நோயாளர் சுயவிவரம்")}</h2>
          <div className="flex space-x-3">
            <PrintExportButton 
              targetId="printable-medical-records-content"
              filename={`Patient_Profile_${patient.name.replace(/\s+/g, '_')}`}
              variant="primary"
              size="sm"
            />
            <Button onClick={() => navigate('/dashboard')} variant="secondary">
              {getBilingualLabel("Back to Dashboard", "டாஷ்போர்டுக்குத் திரும்பு")}
            </Button>
            <Button onClick={() => setIsDeleteConfirmationOpen(true)} variant="danger">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {getBilingualLabel("Delete Patient", "நோயாளியை நீக்கு")}
            </Button>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 patient-info page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4 patient-header">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Demographics", "புள்ளிவிவரங்கள்")}</h3>
            <Button onClick={() => setIsEditPatientModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {getBilingualLabel("Edit", "திருத்து")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
            <div><p><strong>{getBilingualLabel("Name", "பெயர்")}:</strong> {patient.name}</p></div>
            <div><p><strong>{getBilingualLabel("DOB", "பிறந்த தேதி")}:</strong> {patient.dob}</p></div>
            <div><p><strong>{getBilingualLabel("Gender", "பால்")}:</strong> {patient.gender}</p></div>
            <div><p><strong>{getBilingualLabel("Phone", "தொலைபேசி")}:</strong> {patient.phone}</p></div>
            <div><p><strong>{getBilingualLabel("Email", "மின்னஞ்சல்")}:</strong> {patient.email}</p></div>
            <div><p><strong>{getBilingualLabel("Address", "முகவரி")}:</strong> {patient.address}</p></div>
            <div><p><strong>{getBilingualLabel("Emergency Contact", "அவசர தொடர்பு")}:</strong> {patient.emergencyContactName} ({patient.emergencyContactPhone})</p></div>
            <div><p><strong>{getBilingualLabel("Preferred Language", "விருப்பமான மொழி")}:</strong> {patient.preferredLanguage}</p></div>
            <div><p><strong>{getBilingualLabel("Preferred Contact", "விருப்பமான தொடர்பு")}:</strong> {patient.preferredContactMethod}</p></div>
          </div>
        </div>

        {/* Medical History Section with CRUD */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 medical-section page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Medical History", "மருத்துவ வரலாறு")}</h3>
            <Button onClick={() => setIsAddMedicalHistoryModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Add History", "வரலாற்றைச் சேர்")}
            </Button>
          </div>
          {medicalHistory.length === 0 ? (
            <p className="text-slate-600">{getBilingualLabel("No medical history recorded.", "மருத்துவ வரலாறு எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
          ) : (
            <div className="space-y-4">
              {medicalHistory.map((entry) => (
                <div key={entry.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p><strong>{getBilingualLabel("Condition", "நிலை")}:</strong> {entry.conditionName}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Diagnosed on", "நோயறிதல் தேதி")}: {entry.diagnosisDate}</p>
                      {entry.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {entry.notes}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4 print:hidden">
                      <Button
                        onClick={() => setEditingMedicalHistory(entry)}
                        variant="secondary"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => handleDeleteMedicalHistory(entry.id)}
                        variant="danger"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medications Section with CRUD */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 medical-section page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Medications", "மருந்துகள்")}</h3>
            <Button onClick={() => setIsAddMedicationModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Add Medication", "மருந்தைச் சேர்")}
            </Button>
          </div>
          {medications.length === 0 ? (
            <p className="text-slate-600">{getBilingualLabel("No medications recorded.", "மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <div key={med.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p><strong>{getBilingualLabel("Name", "பெயர்")}:</strong> {med.medicationName}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Dosage", "மருந்தளவு")}: {med.dosage}, {getBilingualLabel("Frequency", "அளவு")}: {med.frequency}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Start Date", "தொடங்கிய தேதி")}: {med.startDate} {med.endDate && `- ${med.endDate}`}</p>
                      {med.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {med.notes}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4 print:hidden">
                      <Button
                        onClick={() => setEditingMedication(med)}
                        variant="secondary"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => handleDeleteMedication(med.id)}
                        variant="danger"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allergies Section with CRUD */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 medical-section page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Allergies", "ஒவ்வாமைகள்")}</h3>
            <Button onClick={() => setIsAddAllergyModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Add Allergy", "ஒவ்வாமையைச் சேர்")}
            </Button>
          </div>
          {allergies.length === 0 ? (
            <p className="text-slate-600">{getBilingualLabel("No allergies recorded.", "ஒவ்வாமைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
          ) : (
            <div className="space-y-4">
              {allergies.map((allergy) => (
                <div key={allergy.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p><strong>{getBilingualLabel("Allergen", "ஒவ்வாமை")}:</strong> {allergy.allergenName}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Reaction", "எதிர்வினை")}: {allergy.reaction}, {getBilingualLabel("Severity", "தீவிரம்")}: {allergy.severity}</p>
                      {allergy.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {allergy.notes}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4 print:hidden">
                      <Button
                        onClick={() => setEditingAllergy(allergy)}
                        variant="secondary"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => handleDeleteAllergy(allergy.id)}
                        variant="danger"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insurance & Billing Section with CRUD */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 medical-section page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Insurance & Billing", "காப்பீடு & பில்லிங்")}</h3>
            <Button onClick={() => setIsAddInsuranceModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Add Insurance", "காப்பீட்டைச் சேர்")}
            </Button>
          </div>
          {insuranceBilling.length === 0 ? (
            <p className="text-slate-600">{getBilingualLabel("No insurance information recorded.", "காப்பீட்டுத் தகவல் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
          ) : (
            <div className="space-y-4">
              {insuranceBilling.map((ins) => (
                <div key={ins.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p><strong>{getBilingualLabel("Provider", "வழங்குநர்")}:</strong> {ins.insuranceProvider}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Policy No.", "பாலிசி எண்")}: {ins.policyNumber} {ins.isPrimary ? `(${getBilingualLabel("Primary", "முதன்மை")})` : ''}</p>
                      {ins.groupNumber && <p className="text-sm text-slate-600">{getBilingualLabel("Group No.", "குழு எண்")}: {ins.groupNumber}</p>}
                      {ins.billingNotes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {ins.billingNotes}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4 print:hidden">
                      <Button
                        onClick={() => setEditingInsurance(ins)}
                        variant="secondary"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => handleDeleteInsurance(ins.id)}
                        variant="danger"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Section with CRUD */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 medical-section page-break-inside-avoid">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Documents", "ஆவணங்கள்")}</h3>
            <Button onClick={() => setIsUploadDocumentModalOpen(true)} variant="primary" size="sm" className="print:hidden">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="text-slate-600">{getBilingualLabel("No documents uploaded.", "ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை.")}</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border-b border-slate-200 pb-4 last:border-b-0 document-item">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p><strong>{getBilingualLabel("Type", "வகை")}:</strong> {doc.documentType}</p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("File", "கோப்பு")}: <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{doc.fileName}</a></p>
                      <p className="text-sm text-slate-600">{getBilingualLabel("Uploaded", "பதிவேற்றப்பட்டது")}: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      {doc.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {doc.notes}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4 print:hidden">
                      <Button
                        onClick={() => handleDeleteDocument(doc.id)}
                        variant="danger"
                        size="sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail Component */}
        <div className="page-break-before">
          <PatientAuditTrail patientId={patientId!} />
        </div>

        {/* Modals */}
        <Modal isOpen={isEditPatientModalOpen} onClose={() => setIsEditPatientModalOpen(false)} title={getBilingualLabel("Edit Patient Info", "நோயாளர் தகவலைத் திருத்து")}>
          {patient && (
            <PatientForm
              patient={patient}
              onSubmit={handleUpdatePatient}
              onCancel={() => setIsEditPatientModalOpen(false)}
            />
          )}
        </Modal>

        <Modal isOpen={isAddMedicalHistoryModalOpen} onClose={() => setIsAddMedicalHistoryModalOpen(false)} title={getBilingualLabel("Add Medical History", "மருத்துவ வரலாறைச் சேர்")}>
          <MedicalHistoryForm onSubmit={handleAddMedicalHistory} onCancel={() => setIsAddMedicalHistoryModalOpen(false)} />
        </Modal>

        {editingMedicalHistory && (
          <Modal isOpen={true} onClose={() => setEditingMedicalHistory(null)} title={getBilingualLabel("Edit Medical History", "மருத்துவ வரலாற்றைத் திருத்து")}>
            <MedicalHistoryForm
              medicalHistory={editingMedicalHistory}
              onSubmit={handleUpdateMedicalHistory}
              onCancel={() => setEditingMedicalHistory(null)}
            />
          </Modal>
        )}

        <Modal isOpen={isAddMedicationModalOpen} onClose={() => setIsAddMedicationModalOpen(false)} title={getBilingualLabel("Add Medication", "மருந்தைச் சேர்")}>
          <MedicationForm onSubmit={handleAddMedication} onCancel={() => setIsAddMedicationModalOpen(false)} />
        </Modal>

        {editingMedication && (
          <Modal isOpen={true} onClose={() => setEditingMedication(null)} title={getBilingualLabel("Edit Medication", "மருந்தைத் திருத்து")}>
            <MedicationForm
              medication={editingMedication}
              onSubmit={handleUpdateMedication}
              onCancel={() => setEditingMedication(null)}
            />
          </Modal>
        )}

        <Modal isOpen={isAddAllergyModalOpen} onClose={() => setIsAddAllergyModalOpen(false)} title={getBilingualLabel("Add Allergy", "ஒவ்வாமையைச் சேர்")}>
          <AllergyForm onSubmit={handleAddAllergy} onCancel={() => setIsAddAllergyModalOpen(false)} allergySeverityOptions={allergySeverityOptions} />
        </Modal>

        {editingAllergy && (
          <Modal isOpen={true} onClose={() => setEditingAllergy(null)} title={getBilingualLabel("Edit Allergy", "ஒவ்வாமையைத் திருத்து")}>
            <AllergyForm
              allergy={editingAllergy}
              onSubmit={handleUpdateAllergy}
              onCancel={() => setEditingAllergy(null)}
              allergySeverityOptions={allergySeverityOptions}
            />
          </Modal>
        )}

        <Modal isOpen={isAddInsuranceModalOpen} onClose={() => setIsAddInsuranceModalOpen(false)} title={getBilingualLabel("Add Insurance/Billing", "காப்பீடு/பில்லிங்கைச் சேர்")}>
          <InsuranceBillingForm onSubmit={handleAddInsurance} onCancel={() => setIsAddInsuranceModalOpen(false)} />
        </Modal>

        {editingInsurance && (
          <Modal isOpen={true} onClose={() => setEditingInsurance(null)} title={getBilingualLabel("Edit Insurance/Billing", "காப்பீடு/பில்லிங்கைத் திருத்து")}>
            <InsuranceBillingForm
              insuranceBilling={editingInsurance}
              onSubmit={handleUpdateInsurance}
              onCancel={() => setEditingInsurance(null)}
            />
          </Modal>
        )}

        <Modal isOpen={isUploadDocumentModalOpen} onClose={() => setIsUploadDocumentModalOpen(false)} title={getBilingualLabel("Upload Patient Document", "நோயாளர் ஆவணத்தைப் பதிவேற்று")}>
          <DocumentUploadComponent onSubmit={handleUploadDocument} onCancel={() => setIsUploadDocumentModalOpen(false)} documentTypeOptions={documentTypeOptions} />
        </Modal>

        {/* Delete Confirmation Modal */}
        <PatientDeleteConfirmation
          isOpen={isDeleteConfirmationOpen}
          patient={patient}
          onConfirm={handleDeletePatient}
          onCancel={() => setIsDeleteConfirmationOpen(false)}
        />
      </div>
    </PrintablePageWrapper>
  );
};

export default EnhancedPatientDetailsPage;