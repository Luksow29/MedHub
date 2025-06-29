import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PatientSearchComponent from '../../components/PatientSearchComponent';
import Button from '../../components/shared/Button';
import PrintExportButton from '../../components/shared/PrintExportButton';
import CollapsibleSection from '../../components/shared/CollapsibleSection';
import PrintablePageWrapper from '../../components/shared/PrintablePageWrapper';
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

  // Generate page title for the selected patient
  const pageTitle = selectedPatient 
    ? `${getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}: ${selectedPatient.name}`
    : getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்");

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
          {pageTitle}
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
        <PrintablePageWrapper pageTitle={pageTitle} showConfidentialNotice={true}>
          {/* Medical records content */}
          <div id="printable-medical-records-content" className="space-y-6">
            {/* Patient header - always visible */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 patient-info">
              <h3 className="text-xl font-semibold text-sky-700 mb-4 patient-header">
                {getBilingualLabel("Patient Information", "நோயாளர் தகவல்")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                <div><p><strong>{getBilingualLabel("Name", "பெயர்")}:</strong> {selectedPatient.name}</p></div>
                {selectedPatient.dob && <div><p><strong>{getBilingualLabel("DOB", "பிறந்த தேதி")}:</strong> {selectedPatient.dob}</p></div>}
                {selectedPatient.gender && <div><p><strong>{getBilingualLabel("Gender", "பால்")}:</strong> {selectedPatient.gender}</p></div>}
                <div><p><strong>{getBilingualLabel("Phone", "தொலைபேசி")}:</strong> {selectedPatient.phone}</p></div>
                {selectedPatient.email && <div><p><strong>{getBilingualLabel("Email", "மின்னஞ்சல்")}:</strong> {selectedPatient.email}</p></div>}
                {selectedPatient.address && <div><p><strong>{getBilingualLabel("Address", "முகவரி")}:</strong> {selectedPatient.address}</p></div>}
              </div>
            </div>

            {patientDataError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{patientDataError || getBilingualLabel("Error loading medical records.", "மருத்துவ பதிவுகளை ஏற்றுவதில் பிழை.")}</span>
              </div>
            ) : (
              <>
                {/* Medical History Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 medical-section">
                  <h3 className="text-xl font-semibold text-sky-700 mb-4">
                    {getBilingualLabel("Medical History", "மருத்துவ வரலாறு")}
                  </h3>
                  <div className="print:block">
                    {medicalHistory && medicalHistory.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Date", "தேதி")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Condition", "நிலை")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Notes", "குறிப்புகள்")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicalHistory.map((record) => (
                            <tr key={record.id} className="border-b border-slate-200">
                              <td className="border border-slate-300 px-4 py-2">{record.diagnosisDate}</td>
                              <td className="border border-slate-300 px-4 py-2 font-medium">{record.conditionName}</td>
                              <td className="border border-slate-300 px-4 py-2">{record.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500">{getBilingualLabel("No medical history recorded.", "மருத்துவ வரலாறு பதிவு செய்யப்படவில்லை.")}</p>
                    )}
                  </div>
                </div>

                {/* Medications Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 medical-section">
                  <h3 className="text-xl font-semibold text-sky-700 mb-4">
                    {getBilingualLabel("Medications", "மருந்துகள்")}
                  </h3>
                  <div className="print:block">
                    {medications && medications.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Medication", "மருந்து")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Dosage", "அளவு")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Frequency", "அடுக்கு")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Start Date", "தொடக்க தேதி")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Notes", "குறிப்புகள்")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medications.map((med) => (
                            <tr key={med.id} className="border-b border-slate-200">
                              <td className="border border-slate-300 px-4 py-2 font-medium">{med.medicationName}</td>
                              <td className="border border-slate-300 px-4 py-2">{med.dosage || '-'}</td>
                              <td className="border border-slate-300 px-4 py-2">{med.frequency || '-'}</td>
                              <td className="border border-slate-300 px-4 py-2">{med.startDate || '-'}</td>
                              <td className="border border-slate-300 px-4 py-2">{med.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500">{getBilingualLabel("No medications recorded.", "மருந்துகள் பதிவு செய்யப்படவில்லை.")}</p>
                    )}
                  </div>
                </div>

                {/* Allergies Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 medical-section">
                  <h3 className="text-xl font-semibold text-sky-700 mb-4">
                    {getBilingualLabel("Allergies", "ஒவ்வாமைகள்")}
                  </h3>
                  <div className="print:block">
                    {allergies && allergies.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Allergen", "ஒவ்வாமை")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Reaction", "எதிர்வினை")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Severity", "தீவிரம்")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Notes", "குறிப்புகள்")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allergies.map((allergy) => (
                            <tr key={allergy.id} className="border-b border-slate-200">
                              <td className="border border-slate-300 px-4 py-2 font-medium">{allergy.allergenName}</td>
                              <td className="border border-slate-300 px-4 py-2">{allergy.reaction || '-'}</td>
                              <td className="border border-slate-300 px-4 py-2">{allergy.severity || '-'}</td>
                              <td className="border border-slate-300 px-4 py-2">{allergy.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500">{getBilingualLabel("No allergies recorded.", "ஒவ்வாமைகள் பதிவு செய்யப்படவில்லை.")}</p>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 medical-section">
                  <h3 className="text-xl font-semibold text-sky-700 mb-4">
                    {getBilingualLabel("Documents", "ஆவணங்கள்")}
                  </h3>
                  <div className="print:block">
                    {documents && documents.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Type", "வகை")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("File Name", "கோப்பு பெயர்")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Upload Date", "பதிவேற்றிய தேதி")}</th>
                            <th className="border border-slate-300 px-4 py-2 text-left bg-slate-50">{getBilingualLabel("Notes", "குறிப்புகள்")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => (
                            <tr key={doc.id} className="border-b border-slate-200">
                              <td className="border border-slate-300 px-4 py-2 font-medium">{doc.documentType}</td>
                              <td className="border border-slate-300 px-4 py-2">
                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline print:text-black">
                                  {doc.fileName}
                                </a>
                              </td>
                              <td className="border border-slate-300 px-4 py-2">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                              <td className="border border-slate-300 px-4 py-2">{doc.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500">{getBilingualLabel("No documents attached.", "ஆவணங்கள் இணைக்கப்படவில்லை.")}</p>
                    )}
                  </div>
                </div>
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
        </PrintablePageWrapper>
      )}
    </MainLayout>
  );
};

export default MedicalRecordsPage;