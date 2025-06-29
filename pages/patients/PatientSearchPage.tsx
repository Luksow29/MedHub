import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import MainLayout from '../../components/layout/MainLayout';
import PatientSearchComponent from '../../components/PatientSearchComponent';

interface PatientSearchPageProps {
  user: User;
  onLogout: () => void;
}

const PatientSearchPage: React.FC<PatientSearchPageProps> = ({ user, onLogout }) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="patients"
      breadcrumbs={[
        { label: getBilingualLabel('Patient Management', 'நோயாளர் நிர்வாகம்'), href: '/patients' },
        { label: getBilingualLabel('Search Patients', 'நோயாளிகளைத் தேடு') }
      ]}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Search Patients", "நோயாளிகளைத் தேடு")}
        </h2>
      </div>

      {/* Search Component */}
      <PatientSearchComponent />
    </MainLayout>
  );
};

export default PatientSearchPage;