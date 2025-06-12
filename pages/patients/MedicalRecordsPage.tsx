import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PatientSearchComponent from '../../components/PatientSearchComponent';
import Button from '../../components/shared/Button';
import PrintablePageWrapper from '../../components/shared/PrintablePageWrapper';
import PrintExportButton from '../../components/shared/PrintExportButton';
import CollapsibleSection from '../../components/shared/CollapsibleSection'; // Assuming this component exists or will be created
import { Patient, MedicalRecord, Medication, Allergy, Document } from '../../types'; // Assuming these types are available
import { usePatientData } from '../../features/patient-management/hooks/usePatientData'; // Assuming this hook is available

interface MedicalRecordsPageProps {
  user: User;
  onLogout: () => void;
}

const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // State to hold the currently selected patient for detailed viewing
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Handle patient selection from the search component
  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
  }, []);

  // Handle navigating back to the patient search interface
  const handleBackToSearch = useCallback(() => {
    setSelectedPatient(null);
  }, []);

  // Fetch comprehensive patient data when a patient is selected
  const {
    patientData,
    isLoading: isPatientDataLoading,
    error: patientDataError
  } = usePatientData(selectedPatient?.id || '');

  // State for collapsible sections
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
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 print:hidden">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
        </h2>
      </div>

      {/* Conditional Rendering: Show Patient Search or Medical Records View */}
      {!selectedPatient ? (
        // Patient Search Component
        <PatientSearchComponent
          showSelectButton={true}
          onPatientSelect={handlePatientSelect}
        />
      ) : (
        // Comprehensive Medical Records View
        <>
          {/* PrintablePageWrapper wraps content that should be printed */}
          <PrintablePageWrapper patient={selectedPatient} contentId="printable-medical-records">
            {isPatientDataLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                <p className="text-slate-600">{getBilingualLabel("Loading medical records...", "மருத்துவ பதிவுகளை ஏற்றுகிறது...")}</p>
              </div>
            ) : patientDataError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{patientDataError.message || getBilingualLabel("Error loading medical records.", "மருத்துவ பதிவுகளை ஏற்றுவதில் பிழை.")}</span>
              </div>
            ) : (
              <div id="printable-medical-records" className="space-y-6">
                {/* Medical History Section */}
                <CollapsibleSection
                  title={getBilingualLabel("Medical History", "மருத்துவ வரலாறு")}
                  isExpanded={isMedicalHistoryExpanded}
                  onToggle={toggleMedicalHistory}
                >
                  {patientData?.medicalHistory && patientData.medicalHistory.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {patientData.medicalHistory.map((record: MedicalRecord, index: number) => (
                        <li key={record.id || index}>
                          <span className="font-semibold">{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}:</span> {record.description}
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
                  {patientData?.medications && patientData.medications.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {patientData.medications.map((med: Medication, index: number) => (
                        <li key={med.id || index}>
                          <span className="font-semibold">{med.name}</span>: {med.dosage} ({med.frequency}) - {med.notes}
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
                  {patientData?.allergies && patientData.allergies.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {patientData.allergies.map((allergy: Allergy, index: number) => (
                        <li key={allergy.id || index}>
                          <span className="font-semibold">{allergy.agent}</span>: {allergy.reaction} - {allergy.severity}
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
                  {patientData?.documents && patientData.documents.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      {patientData.documents.map((doc: Document, index: number) => (
                        <li key={doc.id || index}>
                          <span className="font-semibold">{doc.name}</span> ({doc.type}) -{' '}
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            {getBilingualLabel("View Document", "ஆவணத்தைப் பார்க்கவும்")}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">{getBilingualLabel("No documents attached.", "ஆவணங்கள் இணைக்கப்படவில்லை.")}</p>
                  )}
                </CollapsibleSection>
              </div>
            )}
          </PrintablePageWrapper>

          {/* Action Buttons (Hidden when printing) */}
          <div className="flex justify-end gap-4 mt-6 print:hidden">
            <Button onClick={handleBackToSearch} variant="secondary">
              {getBilingualLabel("Back to Search", "தேடலுக்குத் திரும்பு")}
            </Button>
            {selectedPatient && (
              <PrintExportButton targetId="printable-medical-records" filename={`MedicalRecords-${selectedPatient.name}.pdf`} />
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default MedicalRecordsPage;