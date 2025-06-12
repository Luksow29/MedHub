// App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import AuthPage from './components/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailsPage from './features/patient-management/components/PatientDetailsPage';

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
        <Route path="/" element={<DashboardPage user={session} onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<DashboardPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments" element={<AppointmentsPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/calendar" element={<AppointmentsPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/scheduler" element={<AppointmentsPage user={session} onLogout={handleLogout} />} />
        <Route path="/appointments/waitlist" element={<AppointmentsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients" element={<PatientsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/directory" element={<PatientsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/search" element={<PatientsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patients/records" element={<PatientsPage user={session} onLogout={handleLogout} />} />
        <Route path="/patient/:patientId" element={<PatientDetailsPage />} />
      </Routes>
    </Router>
  );
};

export default App;