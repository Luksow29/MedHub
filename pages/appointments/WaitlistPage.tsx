import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  Patient, DbPatient
} from '../../types';

// Components
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import WaitlistManager from '../../components/WaitlistManager';

// API functions
import * as PatientAPI from '../../api/patients';

interface WaitlistPageProps {
  user: User;
  onLogout: () => void;
}

const WaitlistPage: React.FC<WaitlistPageProps> = ({ user, onLogout }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const mapDbPatientToClient = (dbPatient: DbPatient): Patient => ({
    id: dbPatient.id,
    userId: dbPatient.user_id,
    name: dbPatient.name,
    dob: dbPatient.dob,
    gender: dbPatient.gender,
    phone: dbPatient.contact_phone,
    email: dbPatient.contact_email,
    address: dbPatient.address,
    emergencyContactName: dbPatient.emergency_contact_name,
    emergencyContactPhone: dbPatient.emergency_contact_phone,
    preferredLanguage: dbPatient.preferred_language,
    preferredContactMethod: dbPatient.preferred_contact_method,
    createdAt: dbPatient.created_at,
    updatedAt: dbPatient.updated_at,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      setPatients(patientsData.map(mapDbPatientToClient));
    } catch (err: any) {
      console.error('Waitlist data fetch error:', err.message);
      setError(getBilingualLabel('Failed to load data:', 'தரவை ஏற்ற முடியவில்லை:') + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWaitlistUpdate = () => {
    // Refresh data after waitlist update
    fetchData();
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="appointments"
      breadcrumbs={[
        { label: getBilingualLabel('Appointment Management', 'சந்திப்பு நிர்வாகம்'), href: '/appointments' },
        { label: getBilingualLabel('Waitlist', 'காத்திருப்பு பட்டியல்') }
      ]}
      isLoading={isLoading}
    >
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
          <p>{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Waitlist Management", "காத்திருப்பு பட்டியல் நிர்வாகம்")}
        </h2>
        <div className="flex space-x-3">
          <Button onClick={fetchData} variant="secondary" isLoading={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Waitlist Component */}
      <WaitlistManager
        patients={patients}
        userId={user.id}
        onWaitlistUpdate={handleWaitlistUpdate}
      />
    </MainLayout>
  );
};

export default WaitlistPage;