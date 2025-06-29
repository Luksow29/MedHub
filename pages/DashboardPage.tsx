import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import MainLayout from '../components/layout/MainLayout';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import Modal from '../components/shared/Modal';
import PatientForm from '../features/patient-management/components/PatientForm';
import AppointmentForm from '../components/AppointmentForm';
import { Patient, NewDbPatient, NewDbAppointment } from '../types';

// API functions
import * as PatientAPI from '../api/patients';
import * as AppointmentAPI from '../api/appointments';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard metrics state
  const [metrics, setMetrics] = useState({
    todaysAppointments: 0,
    totalRevenue: 0,
    urgentNotifications: 0,
    patientFlow: 85
  });

  // Recent activity state
  const [recentActivities, setRecentActivities] = useState([
    {
      id: '1',
      type: 'appointment' as const,
      title: 'Appointment Scheduled',
      description: 'John Doe scheduled for consultation at 2:00 PM',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: 'Dr. Smith',
      status: 'success' as const
    },
    {
      id: '2',
      type: 'patient' as const,
      title: 'New Patient Registered',
      description: 'Jane Smith added to patient database',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: 'Reception',
      status: 'success' as const
    },
    {
      id: '3',
      type: 'reminder' as const,
      title: 'Reminder Sent',
      description: 'Appointment reminder sent to Alice Brown',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: 'System',
      status: 'info' as const
    },
    {
      id: '4',
      type: 'document' as const,
      title: 'Lab Results Uploaded',
      description: 'Blood test results for Bob Wilson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: 'Lab Tech',
      status: 'success' as const
    }
  ]);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      
      const mappedPatients = patientsData.map(dbPatient => ({
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
      }));
      
      setPatients(mappedPatients);

      // Fetch today's appointments
      const { data: appointmentsData, error: appointmentsError } = await AppointmentAPI.getAllAppointments(user.id);
      if (appointmentsError) throw appointmentsError;

      const today = new Date().toISOString().split('T')[0];
      const todaysAppointments = appointmentsData.filter(apt => apt.date === today);

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        todaysAppointments: todaysAppointments.length,
        totalRevenue: Math.floor(Math.random() * 50000) + 25000, // Mock revenue
        urgentNotifications: Math.floor(Math.random() * 5) + 1 // Mock notifications
      }));

    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (patientData: NewDbPatient) => {
    try {
      const { data, error } = await PatientAPI.createPatient(patientData, user.id);
      if (error) throw error;
      
      if (data) {
        const newPatient = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          dob: data.dob,
          gender: data.gender,
          phone: data.contact_phone,
          email: data.contact_email,
          address: data.address,
          emergencyContactName: data.emergency_contact_name,
          emergencyContactPhone: data.emergency_contact_phone,
          preferredLanguage: data.preferred_language,
          preferredContactMethod: data.preferred_contact_method,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        
        setPatients(prev => [...prev, newPatient]);
        
        // Add to recent activity
        setRecentActivities(prev => [{
          id: Date.now().toString(),
          type: 'patient',
          title: 'New Patient Registered',
          description: `${data.name} added to patient database`,
          timestamp: new Date().toISOString(),
          user: user.email || 'User',
          status: 'success'
        }, ...prev.slice(0, 9)]);
      }
      
      setIsPatientModalOpen(false);
    } catch (err: any) {
      console.error('Add patient error:', err);
      setError(err.message);
    }
  };

  const handleScheduleAppointment = async (appointmentData: NewDbAppointment) => {
    try {
      const { data, error } = await AppointmentAPI.createAppointment(appointmentData, user.id);
      if (error) throw error;
      
      if (data) {
        // Add to recent activity
        const patient = patients.find(p => p.id === data.patient_id);
        setRecentActivities(prev => [{
          id: Date.now().toString(),
          type: 'appointment',
          title: 'Appointment Scheduled',
          description: `${patient?.name || 'Patient'} scheduled for ${data.date} at ${data.time}`,
          timestamp: new Date().toISOString(),
          user: user.email || 'User',
          status: 'success'
        }, ...prev.slice(0, 9)]);
        
        // Update metrics if it's today's appointment
        const today = new Date().toISOString().split('T')[0];
        if (data.date === today) {
          setMetrics(prev => ({
            ...prev,
            todaysAppointments: prev.todaysAppointments + 1
          }));
        }
      }
      
      setIsAppointmentModalOpen(false);
    } catch (err: any) {
      console.error('Schedule appointment error:', err);
      setError(err.message);
    }
  };

  const handleViewWaitlist = () => {
    // Navigate to waitlist page
    window.location.href = '/appointments/waitlist';
  };

  const handleEmergencyMode = () => {
    // Implement emergency mode functionality
    alert(getBilingualLabel('Emergency mode activated', 'அவசர முறை செயல்படுத்தப்பட்டது'));
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="dashboard"
      breadcrumbs={[
        { label: getBilingualLabel('Dashboard', 'டாஷ்போர்டு') }
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

      {/* Dashboard Content */}
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getBilingualLabel('Welcome back!', 'மீண்டும் வரவேற்கிறோம்!')}
          </h1>
          <p className="text-sky-100">
            {getBilingualLabel(
              'Here\'s what\'s happening with your practice today.',
              'இன்று உங்கள் மருத்துவ நடைமுறையில் என்ன நடக்கிறது என்பது இங்கே.'
            )}
          </p>
        </div>

        {/* Key Metrics */}
        <DashboardMetrics
          todaysAppointments={metrics.todaysAppointments}
          totalRevenue={metrics.totalRevenue}
          urgentNotifications={metrics.urgentNotifications}
          patientFlow={metrics.patientFlow}
          isLoading={isLoading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions
              onAddPatient={() => setIsPatientModalOpen(true)}
              onScheduleAppointment={() => setIsAppointmentModalOpen(true)}
              onViewWaitlist={handleViewWaitlist}
              onEmergencyMode={handleEmergencyMode}
            />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity
              activities={recentActivities}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        title={getBilingualLabel("Add New Patient", "புதிய நோயாளியைச் சேர்")}
      >
        <PatientForm
          onSubmit={handleAddPatient}
          onCancel={() => setIsPatientModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title={getBilingualLabel("Schedule New Appointment", "புதிய சந்திப்பை திட்டமிடு")}
      >
        <AppointmentForm
          patients={patients}
          onSubmit={handleScheduleAppointment}
          onCancel={() => setIsAppointmentModalOpen(false)}
        />
      </Modal>
    </MainLayout>
  );
};

export default DashboardPage;