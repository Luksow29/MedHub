import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import PrintExportButton from '../../components/shared/PrintExportButton';

// Types
import {
  Patient,
  DiagnosisStatistic
} from '../../types';

// API functions
import * as PatientAPI from '../../api/patients';
import * as DiagnosesAPI from '../../api/diagnoses';

interface ConsultationReportsPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationReportsPage: React.FC<ConsultationReportsPageProps> = ({ user, onLogout }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diagnosisStats, setDiagnosisStats] = useState<DiagnosisStatistic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Report filters
  const [reportType, setReportType] = useState<'diagnosis_trends' | 'patient_summary'>('diagnosis_trends');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch patients for dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await PatientAPI.getAllPatients(user.id);
      if (error) throw error;
      
      if (data) {
        const mappedPatients = data.map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          dob: p.dob,
          gender: p.gender,
          phone: p.contact_phone,
          email: p.contact_email,
          address: p.address,
          emergencyContactName: p.emergency_contact_name,
          emergencyContactPhone: p.emergency_contact_phone,
          preferredLanguage: p.preferred_language,
          preferredContactMethod: p.preferred_contact_method,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        
        setPatients(mappedPatients);
      }
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    }
  }, [user.id]);

  // Fetch diagnosis statistics
  const fetchDiagnosisStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DiagnosesAPI.getDiagnosisStatistics(
        user.id,
        startDate || undefined,
        endDate || undefined
      );
      if (error) throw error;
      
      setDiagnosisStats(data || []);
    } catch (err: any) {
      console.error('Error fetching diagnosis statistics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, startDate, endDate]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchPatients();
      await fetchDiagnosisStats();
      setIsLoading(false);
    };
    
    initializeData();
  }, [fetchPatients, fetchDiagnosisStats]);

  // Generate report
  const handleGenerateReport = () => {
    if (reportType === 'diagnosis_trends') {
      fetchDiagnosisStats();
    } else {
      // Handle patient summary report
      console.log('Generate patient summary for:', selectedPatientId);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPatientId('');
  };

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="consultations"
      breadcrumbs={[
        { label: getBilingualLabel('Consultations', 'ஆலோசனைகள்'), href: '/consultations' },
        { label: getBilingualLabel('Reports', 'அறிக்கைகள்') }
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
          {getBilingualLabel("Consultation Reports", "ஆலோசனை அறிக்கைகள்")}
        </h2>
      </div>
      
      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {getBilingualLabel("Report Configuration", "அறிக்கை கட்டமைப்பு")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Report Type */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-slate-700 mb-2">
              {getBilingualLabel("Report Type", "அறிக்கை வகை")}
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="diagnosis_trends">{getBilingualLabel("Diagnosis Trends", "நோயறிதல் போக்குகள்")}</option>
              <option value="patient_summary">{getBilingualLabel("Patient Summary", "நோயாளி சுருக்கம்")}</option>
            </select>
            
            {/* Patient Selection (for patient summary) */}
            {reportType === 'patient_summary' && (
              <div className="mt-4">
                <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("Select Patient", "நோயாளியைத் தேர்ந்தெடுக்கவும்")}
                </label>
                <select
                  id="patientId"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                >
                  <option value="">{getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Right Column - Date Range */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("Start Date", "தொடக்க தேதி")}
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
                  {getBilingualLabel("End Date", "முடிவு தேதி")}
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={handleResetFilters} variant="secondary">
            {getBilingualLabel("Reset Filters", "வடிகட்டிகளை மீட்டமைக்கவும்")}
          </Button>
          <Button onClick={handleGenerateReport} variant="primary" isLoading={isLoading}>
            {getBilingualLabel("Generate Report", "அறிக்கையை உருவாக்கு")}
          </Button>
        </div>
      </div>
      
      {/* Report Content */}
      <div id="report-content" className="bg-white p-6 rounded-lg shadow-md">
        {reportType === 'diagnosis_trends' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                {getBilingualLabel("Diagnosis Trends", "நோயறிதல் போக்குகள்")}
              </h3>
              <PrintExportButton
                targetId="report-content"
                filename="Diagnosis_Trends_Report.pdf"
                variant="secondary"
                size="sm"
              />
            </div>
            
            {diagnosisStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {getBilingualLabel("ICD Code", "ICD குறியீடு")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {getBilingualLabel("Description", "விளக்கம்")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {getBilingualLabel("Count", "எண்ணிக்கை")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {getBilingualLabel("Percentage", "சதவீதம்")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {diagnosisStats.map((stat, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {stat.icdCode}
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-slate-700">
                          {stat.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {stat.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          <div className="flex items-center">
                            <span className="mr-2">{stat.percentage}%</span>
                            <div className="w-24 bg-slate-200 rounded-full h-2.5">
                              <div 
                                className="bg-sky-600 h-2.5 rounded-full" 
                                style={{ width: `${stat.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No diagnosis data available for the selected period.", "தேர்ந்தெடுக்கப்பட்ட காலத்திற்கு நோயறிதல் தரவு எதுவும் கிடைக்கவில்லை.")}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                {getBilingualLabel("Patient Summary", "நோயாளி சுருக்கம்")}
              </h3>
              <PrintExportButton
                targetId="report-content"
                filename="Patient_Summary_Report.pdf"
                variant="secondary"
                size="sm"
              />
            </div>
            
            {selectedPatientId ? (
              <div className="space-y-6">
                <p className="text-slate-700">
                  {getBilingualLabel("Patient summary report will be generated here.", "நோயாளி சுருக்க அறிக்கை இங்கே உருவாக்கப்படும்.")}
                </p>
                {/* Patient summary content would go here */}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("Please select a patient to generate a summary report.", "சுருக்க அறிக்கையை உருவாக்க ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.")}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ConsultationReportsPage;