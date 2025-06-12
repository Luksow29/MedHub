import React from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PatientSearchComponent from '../../components/PatientSearchComponent';
import { Patient } from '../../types'; // Assuming Patient type is available

interface MedicalRecordsPageProps {
  user: User;
  onLogout: () => void;
}

const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePatientSelect = (patient: Patient) => {
    navigate(`/patient/${patient.id}`);
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
        </h2>
      </div>

      {/* Patient Search Component */}
      <PatientSearchComponent
        showSelectButton={true}
        onPatientSelect={handlePatientSelect}
      />
    </MainLayout>
  );
};

export default MedicalRecordsPage;