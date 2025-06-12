import React from 'react';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';

interface MedicalRecordsPageProps {
  user: User;
  onLogout: () => void;
}

const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ user, onLogout }) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

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

      {/* Medical Records Info */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-900">
          {getBilingualLabel("Medical Records", "மருத்துவ பதிவுகள்")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {getBilingualLabel("Access detailed medical records by selecting a patient from the directory", "அடைவில் இருந்து ஒரு நோயாளியைத் தேர்ந்தெடுத்து விரிவான மருத்துவ பதிவுகளை அணுகவும்")}
        </p>
        <div className="mt-6">
          <Link to="/patients/directory">
            <Button variant="primary">
              {getBilingualLabel("Go to Patient Directory", "நோயாளர் அடைவுக்குச் செல்லவும்")}
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicalRecordsPage;