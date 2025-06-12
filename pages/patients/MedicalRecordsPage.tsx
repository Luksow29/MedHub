import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PatientSearchComponent from '../../components/PatientSearchComponent';
import Button from '../../components/shared/Button';
import PrintExportButton from '../../components/shared/PrintExportButton';
import CollapsibleSection from '../../components/shared/CollapsibleSection';
import { Patient } from '../../types';
import { usePatientData } from '../../features/patient-management/hooks/usePatientData';

interface MedicalRecordsPageProps {
  user: User;
  onLogout: () => void;
}

const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Selected patient state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Handle patient selection from search component
  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
  }, []);

  // Go back to search
  const handleBackToSearch = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  // Get patient data when a patient is selected
  const {
    patient,
    medicalHistory,
    medications,
    allergies,
    documents,
    isLoading: isPatientDataLoading,
    error: patientDataError
  } = usePatientData(selectedPatient?.id || '');

  // Collapsible section states
  const [isMedicalHistoryExpanded, setIsMedicalHistoryExpanded] = useState(true);
  const [isMedicationsExpanded, setIsMedicationsExpanded] = useState(true);
  const [isAllergiesExpanded, setIsAllergiesExpanded] = useState(true);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(true);

  // Toggle functions for collapsible sections
  const toggleMedicalHistory = useCallback(() => setIsMedicalHistoryExpanded(prev => !prev), []);
  const toggleMedications = useCallback(() => setIsMedicationsExpanded(prev => !prev), []);
  const toggleAllergies = useCallback(() => setIsAllergiesExpanded(prev => !prev), []);
  const toggleDocuments = useCallback(() => setIsDocumentsExpanded(prev => !prev), []);

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="patients"
      breadcrumbs={[
        { label: getBilingualLabel('Patient Management', 'நோயாளர் நிர்வாகம்'), href: '/patients' },
        { label: getBilingualLabel('Medical Records', 'மருத்துவ பதிவுகள்') }
      ]}
      isLoading={isPatientDataLoading && selectedPatient !== null}
    >
      {/* Page title - hidden when printing */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
        </h2>
      </div>

      {/* Conditional rendering: show patient search or medical records */}
      {!selectedPatient ? (
        // Patient search component - hidden when printing
        <div className="print:hidden">
          <PatientSearchComponent
            showSelectButton={true}
            onPatientSelect={handlePatientSelect}
          />
        </div>
      ) : (
        <>
          {/* Medical records content */}
          <div id="printable-medical-records-content" className="space-y-6">
            {/* Patient header */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-semibold text-sky-700 mb-4">
                {getBilingualLabel("Patient Information", "நோயாளர் தகவல்")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                <div><p><strong>{getBilingualLabel("Name", "பெயர்")}:</strong> {selectedPatient.name}</p></div>
                {selectedPatient.dob && <div><p><strong>{getBilingualLabel("DOB", "பிறந்த தேதி")}:</strong> {selectedPatient.dob}</p></div>}
                {selectedPatient.gender && <div><p><strong>{getBilingualLabel("Gender", "பால்")}:</strong> {selectedPatient.gender}</p></div>}
                <div><p><strong>{getBilingualLabel("Phone", "தொலைபேசி")}:</strong> {selectedPatient.phone}</p></div>
                {selectedPatient.email && <div><p><strong>{getBilingualLabel("Email", "மின்னஞ்சல்")}:</strong> {selectedPatient.email}</p></div>}
              </div>
            </div>

            {patientDataError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{patientDataError || getBilingualLabel("Error loading medical records.", "மருத்துவ பதிவுகளை ஏற்றுவதில் பிழை.")}</span>
              </div>
            ) : (
              <>
                {/* Medical History Section */}
                <CollapsibleSection
                  title={getBilingualLabel("Medical History", "மருத்துவ வரலாறு")}
                  isExpanded={isMedicalHistoryExpanded}
                  onToggle={toggleMedicalHistory}
                >
                  {medicalHistory && medicalHistory.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {medicalHistory.map((record) => (
                        <li key={record.id}>
                          <span className="font-semibold">{record.diagnosisDate}:</span> {record.conditionName}
                          {record.notes && <p className="text-sm text-slate-600 ml-4">{record.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{getBilingualLabel("No medical history recorded.", "மருத்துவ வரலாறு பதிவு செய்யப்படவில்லை.")}</p>
                  )}
                </CollapsibleSection>

                {/* Medications Section */}
                <CollapsibleSection
                  title={getBilingualLabel("Medications", "மருந்துகள்")}
                  isExpanded={isMedicationsExpanded}
                  onToggle={toggleMedications}
                >
                  {medications && medications.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {medications.map((med) => (
                        <li key={med.id}>
                          <span className="font-semibold">{med.medicationName}</span>
                          {med.dosage && <span> - {med.dosage}</span>}
                          {med.frequency && <span> ({med.frequency})</span>}
                          {med.startDate && <p className="text-sm text-slate-600 ml-4">{getBilingualLabel("Started", "தொடங்கியது")}: {med.startDate}</p>}
                          {med.notes && <p className="text-sm text-slate-600 ml-4">{med.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{getBilingualLabel("No medications recorded.", "மருந்துகள் பதிவு செய்யப்படவில்லை.")}</p>
                  )}
                </CollapsibleSection>

                {/* Allergies Section */}
                <CollapsibleSection
                  title={getBilingualLabel("Allergies", "ஒவ்வாமைகள்")}
                  isExpanded={isAllergiesExpanded}
                  onToggle={toggleAllergies}
                >
                  {allergies && allergies.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {allergies.map((allergy) => (
                        <li key={allergy.id}>
                          <span className="font-semibold">{allergy.allergenName}</span>
                          {allergy.reaction && <span> - {allergy.reaction}</span>}
                          {allergy.severity && <span> ({allergy.severity})</span>}
                          {allergy.notes && <p className="text-sm text-slate-600 ml-4">{allergy.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{getBilingualLabel("No allergies recorded.", "ஒவ்வாமைகள் பதிவு செய்யப்படவில்லை.")}</p>
                  )}
                </CollapsibleSection>

                {/* Documents Section */}
                <CollapsibleSection
                  title={getBilingualLabel("Documents", "ஆவணங்கள்")}
                  isExpanded={isDocumentsExpanded}
                  onToggle={toggleDocuments}
                >
                  {documents && documents.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {documents.map((doc) => (
                        <li key={doc.id}>
                          <span className="font-semibold">{doc.documentType}</span> - {doc.fileName}
                          <div className="ml-4">
                            <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline print:text-black print:no-underline">
                              {getBilingualLabel("View Document", "ஆவணத்தைப் பார்க்கவும்")}
                            </a>
                            <p className="text-xs text-slate-500">{getBilingualLabel("Uploaded", "பதிவேற்றப்பட்டது")}: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            {doc.notes && <p className="text-sm text-slate-600">{doc.notes}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{getBilingualLabel("No documents attached.", "ஆவணங்கள் இணைக்கப்படவில்லை.")}</p>
                  )}
                </CollapsibleSection>
              </>
            )}
          </div>

          {/* Action buttons (hidden when printing) */}
          <div className="flex justify-end gap-4 mt-6 print:hidden">
            <Button onClick={handleBackToSearch} variant="secondary">
              {getBilingualLabel("Back to Search", "தேடலுக்குத் திரும்பு")}
            </Button>
            <PrintExportButton 
              targetId="printable-medical-records-content" 
              filename={`MedicalRecords-${selectedPatient.name.replace(/\s+/g, '_')}.pdf`}
              variant="primary"
              size="md"
            />
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default MedicalRecordsPage;