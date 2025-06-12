// App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import AuthPage from './components/AuthPage';
import DashboardPage from './pages/DashboardPage';

// Appointment Management Pages
import AppointmentsListPage from './pages/appointments/AppointmentsListPage';
import CalendarViewPage from './pages/appointments/CalendarViewPage';
import SchedulerPage from './pages/appointments/SchedulerPage';
import WaitlistPage from './pages/appointments/WaitlistPage';

// Patient Management Pages
import PatientDirectoryPage from './pages/patients/PatientDirectoryPage';
import PatientSearchPage from './pages/patients/PatientSearchPage';
import MedicalRecordsPage from './pages/patients/MedicalRecordsPage.tsx';
import EnhancedPatientDetailsPage from './features/patient-management/components/EnhancedPatientDetailsPage';

// Consultation Management Pages
import ConsultationsListPage from './pages/consultations/ConsultationsListPage';
import ConsultationDetailsPage from './pages/consultations/ConsultationDetailsPage';
import ConsultationReportsPage from './pages/consultations/ConsultationReportsPage';

const App: React.FC = () => {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('வெளியேறுவதில் பிழை:', error.message);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">ஏற்றப்படுகிறது...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage user={session} onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<DashboardPage user={session} onLogout={handleLogout} />} />
        
        {/* Appointment Management */}
        <Route path="/appointments" element={<AppointmentsListPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/calendar" element={<CalendarViewPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/scheduler" element={<SchedulerPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/waitlist" element={<WaitlistPage user={session} onLogout={handleLogout} />} />
        
        {/* Patient Management */}
        <Route path="/patients" element={<PatientDirectoryPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/directory" element={<PatientDirectoryPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/search" element={<PatientSearchPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/records" element={<MedicalRecordsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patient/:patientId" element={<EnhancedPatientDetailsPage />} />
        
        {/* Consultation Management */}
        <Route path="/consultations" element={<ConsultationsListPage user={session} onLogout={handleLogout} />} />
        <Route path="/consultations/:consultationId" element={<ConsultationDetailsPage user={session} onLogout={handleLogout} />} />
        <Route path="/consultations/reports" element={<ConsultationReportsPage user={session} onLogout={handleLogout} />} />
      </Routes>
    </Router>
  );
};

export default App;