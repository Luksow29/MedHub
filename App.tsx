// App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Import enhanced components instead of basic ones
import AuthPage from './components/AuthPage';
import DashboardPageEnhanced from './components/DashboardPageEnhanced';
import EnhancedPatientDetailsPage from './features/patient-management/components/EnhancedPatientDetailsPage';

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
        <Route path="/" element={<DashboardPageEnhanced user={session} onLogout={handleLogout} />} />
        <Route path="/dashboard" element={<DashboardPageEnhanced user={session} onLogout={handleLogout} />} />
        <Route path="/patient/:patientId" element={<EnhancedPatientDetailsPage />} />
      </Routes>
    </Router>
  );
};

export default App;