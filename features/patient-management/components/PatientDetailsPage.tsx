// src/features/patient-management/components/PatientDetailsPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase'; // பாதை சரிபார்க்கவும்
import {
  Patient, NewDbPatient, UpdateDbPatient,
  MedicalHistory, NewDbMedicalHistory, UpdateDbMedicalHistory,
  Medication, NewDbMedication, UpdateDbMedication,
  Allergy, NewDbAllergy, UpdateDbAllergy,
  InsuranceBilling, NewDbInsuranceBilling, UpdateDbInsuranceBilling,
  PatientDocument, NewDbPatientDocument,
} from '../../../types'; // பாதை சரிபார்க்கவும்

import Button from '../../../components/shared/Button'; // சரி செய்யப்பட்ட பாதை
import Modal from '../../../components/shared/Modal';   // சரி செய்யப்பட்ட பாதை
import PatientForm from './PatientForm'; // அதே கோப்புறைக்குள் உள்ளது
import MedicalHistoryForm from './MedicalHistoryForm';
import MedicationForm from './MedicationForm';
import AllergyForm from './AllergyForm';
import InsuranceBillingForm from './InsuranceBillingForm';
import DocumentUploadComponent from './DocumentUploadComponent';
import { usePatientData } from '../hooks/usePatientData'; // புதிய ஹூக்கை இறக்குமதி செய்கிறோம்

// API செயல்பாடுகளை இறக்குமதி செய்கிறோம்
import * as PatientAPI from '../../../api/patients'; // சரி செய்யப்பட்ட பாதை
import * as MedicalHistoryAPI from '../../../api/medicalHistory'; // சரி செய்யப்பட்ட பாதை
import * as MedicationAPI from '../../../api/medications'; // சரி செய்யப்பட்ட பாதை
import * as AllergyAPI from '../../../api/allergies'; // சரி செய்யப்பட்ட பாதை
import * as InsuranceBillingAPI from '../../../api/insuranceBilling'; // சரி செய்யப்பட்ட பாதை
import * as DocumentAPI from '../../../api/documents'; // சரி செய்யப்பட்ட பாதை

const PatientDetailsPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // usePatientData ஹூக்கைப் பயன்படுத்துகிறோம்
  const {
    patient, medicalHistory, medications, allergies, insuranceBilling, documents,
    isLoading, error, refreshData
  } = usePatientData(patientId);

  // மோடல் நிலைகள்
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [isAddMedicalHistoryModalOpen, setIsAddMedicalHistoryModalOpen] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isAddInsuranceModalOpen, setIsAddInsuranceModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);

  // இருமொழி லேபல்களுக்கான பொதுவான செயல்பாடுகள்
  const getBilingualLabel = (english: string, tamil: string) => {
    // பயனர் விருப்ப மொழியின் அடிப்படையில் மொழிபெயர்ப்பை இங்கு தேர்ந்தெடுக்கலாம்.
    return `${english} (${tamil})`;
  };

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

  const handleUpdatePatient = async (data: NewDbPatient) => { // புதிய வகை NewDbPatient
    if (!patient || !patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await PatientAPI.updatePatient(patientId, data, currentUser.data.user.id); // API ஐப் பயன்படுத்துகிறோம்
      if (error) throw error;
      refreshData(); // தரவைப் புதுப்பிக்க ஹூக்கில் உள்ள refreshData ஐப் பயன்படுத்துகிறோம்
      setIsEditPatientModalOpen(false);
    } catch (err: any) {
      console.error('நோயாளியைப் புதுப்பிப்பதில் பிழை:', err.message);
      setError('நோயாளியைப் புதுப்பிக்க முடியவில்லை: ' + err.message);
    }
  };

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

  const handleAddInsurance = async (data: NewDbInsuranceBilling) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await InsuranceBillingAPI.addInsuranceBilling(data, patientId, currentUser.data.user.id); // API செயல்பாட்டைப் பயன்படுத்துகிறோம்
      if (error) throw error;
      refreshData();
      setIsAddInsuranceModalOpen(false);
    } catch (err: any) {
      console.error('காப்பீடு சேர்ப்பதில் பிழை:', err.message);
      setError('காப்பீடு சேர்ப்பதில் தோல்வி: ' + err.message);
    }
  };

  const handleUploadDocument = async (data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>, file: File) => {
    if (!patientId) return;
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const { error } = await DocumentAPI.uploadPatientDocument(data, file, patientId, currentUser.data.user.id); // API செயல்பாட்டைப் பயன்படுத்துகிறோம்
      if (error) throw error;
      refreshData();
      setIsUploadDocumentModalOpen(false);
    } catch (err: any) {
      console.error('ஆவணத்தைப் பதிவேற்றுவதில் பிழை:', err.message);
      setError('ஆவணத்தைப் பதிவேற்றுவதில் தோல்வி: ' + err.message);
    }
  };

  if (isLoading) return <p className="text-center text-slate-600 py-8">{getBilingualLabel("Loading patient details...", "நோயாளரின் விவரங்கள் ஏற்றப்படுகிறது...")}</p>;
  if (error) return <p className="text-center text-red-600 py-8">{getBilingualLabel("Error:", "பிழை:")} {error}</p>;
  if (!patient) return <p className="text-center text-slate-600 py-8">{getBilingualLabel("Patient not found.", "நோயாளி கண்டுபிடிக்கப்படவில்லை.")}</p>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-slate-800">{getBilingualLabel("Patient Profile", "நோயாளர் சுயவிவரம்")}</h2>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">
          {getBilingualLabel("Back to Dashboard", "டாஷ்போர்டுக்குத் திரும்பு")}
        </Button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Demographics", "புள்ளிவிவரங்கள்")}</h3>
          <Button onClick={() => setIsEditPatientModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Edit", "திருத்து")}
          </Button>
        </div>
        {/* நோயாளரின் புள்ளிவிவர விவரங்கள் */}
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

      {/* மருத்துவ வரலாறு பிரிவு */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Medical History", "மருத்துவ வரலாறு")}</h3>
          <Button onClick={() => setIsAddMedicalHistoryModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Add History", "வரலாற்றைச் சேர்")}
          </Button>
        </div>
        {medicalHistory.length === 0 ? (
          <p className="text-slate-600">{getBilingualLabel("No medical history recorded.", "மருத்துவ வரலாறு எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
        ) : (
          <div className="space-y-4">
            {medicalHistory.map((entry) => (
              <div key={entry.id} className="border-b border-slate-200 pb-2 last:border-b-0">
                <p><strong>{getBilingualLabel("Condition", "நிலை")}:</strong> {entry.conditionName}</p>
                <p className="text-sm text-slate-600">{getBilingualLabel("Diagnosed on", "நோயறிதல் தேதி")}: {entry.diagnosisDate}</p>
                {entry.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {entry.notes}</p>}
                {/* Edit/Delete buttons can be added here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* மருந்துகள் பிரிவு */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Medications", "மருந்துகள்")}</h3>
          <Button onClick={() => setIsAddMedicationModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Add Medication", "மருந்தைச் சேர்")}
          </Button>
        </div>
        {medications.length === 0 ? (
          <p className="text-slate-600">{getBilingualLabel("No medications recorded.", "மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="border-b border-slate-200 pb-2 last:border-b-0">
                <p><strong>{getBilingualLabel("Name", "பெயர்")}:</strong> {med.medicationName}</p>
                <p className="text-sm text-slate-600">{getBilingualLabel("Dosage", "மருந்தளவு")}: {med.dosage}, {getBilingualLabel("Frequency", "அளவு")}: {med.frequency}</p>
                {med.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {med.notes}</p>}
                {/* Edit/Delete buttons can be added here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ஒவ்வாமைகள் பிரிவு */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Allergies", "ஒவ்வாமைகள்")}</h3>
          <Button onClick={() => setIsAddAllergyModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Add Allergy", "ஒவ்வாமையைச் சேர்")}
          </Button>
        </div>
        {allergies.length === 0 ? (
          <p className="text-slate-600">{getBilingualLabel("No allergies recorded.", "ஒவ்வாமைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
        ) : (
          <div className="space-y-4">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="border-b border-slate-200 pb-2 last:border-b-0">
                <p><strong>{getBilingualLabel("Allergen", "ஒவ்வாமை")}:</strong> {allergy.allergenName}</p>
                <p className="text-sm text-slate-600">{getBilingualLabel("Reaction", "எதிர்வினை")}: {allergy.reaction}, {getBilingualLabel("Severity", "தீவிரம்")}: {allergy.severity}</p>
                {allergy.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {allergy.notes}</p>}
                {/* Edit/Delete buttons can be added here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* காப்பீடு மற்றும் பில்லிங் பிரிவு */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Insurance & Billing", "காப்பீடு & பில்லிங்")}</h3>
          <Button onClick={() => setIsAddInsuranceModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Add Insurance", "காப்பீட்டைச் சேர்")}
          </Button>
        </div>
        {insuranceBilling.length === 0 ? (
          <p className="text-slate-600">{getBilingualLabel("No insurance information recorded.", "காப்பீட்டுத் தகவல் எதுவும் பதிவு செய்யப்படவில்லை.")}</p>
        ) : (
          <div className="space-y-4">
            {insuranceBilling.map((ins) => (
              <div key={ins.id} className="border-b border-slate-200 pb-2 last:border-b-0">
                <p><strong>{getBilingualLabel("Provider", "வழங்குநர்")}:</strong> {ins.insuranceProvider}</p>
                <p className="text-sm text-slate-600">{getBilingualLabel("Policy No.", "பாலிசி எண்")}: {ins.policyNumber} {ins.isPrimary ? `(${getBilingualLabel("Primary", "முதன்மை")})` : ''}</p>
                {ins.billingNotes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {ins.billingNotes}</p>}
                {/* Edit/Delete buttons can be added here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ஆவணங்கள் பிரிவு */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">{getBilingualLabel("Documents", "ஆவணங்கள்")}</h3>
          <Button onClick={() => setIsUploadDocumentModalOpen(true)} variant="primary" size="sm">
            {getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
          </Button>
        </div>
        {documents.length === 0 ? (
          <p className="text-slate-600">{getBilingualLabel("No documents uploaded.", "ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை.")}</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border-b border-slate-200 pb-2 last:border-b-0 flex justify-between items-center">
                <div>
                    <p><strong>{getBilingualLabel("Type", "வகை")}:</strong> {doc.documentType}</p>
                    <p className="text-sm text-slate-600">{getBilingualLabel("File", "கோப்பு")}: <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{doc.fileName}</a></p>
                    {doc.notes && <p className="text-sm text-slate-600">{getBilingualLabel("Notes", "குறிப்புகள்")}: {doc.notes}</p>}
                </div>
                {/* Delete button can be added here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* மோடல்கள் */}
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

      <Modal isOpen={isAddMedicationModalOpen} onClose={() => setIsAddMedicationModalOpen(false)} title={getBilingualLabel("Add Medication", "மருந்தைச் சேர்")}>
        <MedicationForm onSubmit={handleAddMedication} onCancel={() => setIsAddMedicationModalOpen(false)} />
      </Modal>

      <Modal isOpen={isAddAllergyModalOpen} onClose={() => setIsAddAllergyModalOpen(false)} title={getBilingualLabel("Add Allergy", "ஒவ்வாமையைச் சேர்")}>
        <AllergyForm onSubmit={handleAddAllergy} onCancel={() => setIsAddAllergyModalOpen(false)} allergySeverityOptions={allergySeverityOptions} />
      </Modal>

      <Modal isOpen={isAddInsuranceModalOpen} onClose={() => setIsAddInsuranceModalOpen(false)} title={getBilingualLabel("Add Insurance/Billing", "காப்பீடு/பில்லிங்கைச் சேர்")}>
        <InsuranceBillingForm onSubmit={handleAddInsurance} onCancel={() => setIsAddInsuranceModalOpen(false)} />
      </Modal>

      <Modal isOpen={isUploadDocumentModalOpen} onClose={() => setIsUploadDocumentModalOpen(false)} title={getBilingualLabel("Upload Patient Document", "நோயாளர் ஆவணத்தைப் பதிவேற்று")}>
        <DocumentUploadComponent onSubmit={handleUploadDocument} onCancel={() => setIsUploadDocumentModalOpen(false)} documentTypeOptions={documentTypeOptions} />
      </Modal>
    </div>
  );
};

export default PatientDetailsPage;