import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import PrintExportButton from '../../components/shared/PrintExportButton';

// Types
import {
  Patient,
  DiagnosisStatistic,
  Consultation // Patient Summary-க்கு Consultation type தேவை
} from '../../types';

// API functions
import * as PatientAPI from '../../api/patients';
import * as DiagnosesAPI from '../../api/diagnoses';
import * as ConsultationAPI from '../../api/consultations'; // Consultation API-ஐ இறக்குமதி செய்யவும்

interface ConsultationReportsPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationReportsPage: React.FC<ConsultationReportsPageProps> = ({ user, onLogout }) => {
  // General State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diagnosisStats, setDiagnosisStats] = useState<DiagnosisStatistic[]>([]);

  // State for Patient Summary Report
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  
  // Report filters
  const [reportType, setReportType] = useState<'diagnosis_trends' | 'patient_summary'>('diagnosis_trends');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch all patients for the dropdown list
  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await PatientAPI.getAllPatients(user.id);
      if (error) throw error;
      if (data) {
        // snake_case to camelCase mapping
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
      setError('Failed to load patient list.');
    }
  }, [user.id]);

  // Fetch statistics for the Diagnosis Trends report
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
      setError('Failed to load diagnosis statistics.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, startDate, endDate]);

  // NEW: Fetch all necessary data for the Patient Summary report
  const fetchPatientSummary = useCallback(async (patientId: string) => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    setPatientConsultations([]); // Reset previous data
    setSelectedPatientDetails(null);

    try {
      // Fetch patient details and their consultation history in parallel
      const [detailsResult, consultationsResult] = await Promise.all([
        PatientAPI.getPatientById(patientId, user.id),
        ConsultationAPI.getConsultationsByPatientId(patientId, user.id)
      ]);

      if (detailsResult.error) throw detailsResult.error;
      if (detailsResult.data) {
          setSelectedPatientDetails({
            id: detailsResult.data.id,
            userId: detailsResult.data.user_id,
            name: detailsResult.data.name,
            dob: detailsResult.data.dob,
            gender: detailsResult.data.gender,
            phone: detailsResult.data.contact_phone,
            email: detailsResult.data.contact_email,
            address: detailsResult.data.address,
            emergencyContactName: detailsResult.data.emergency_contact_name,
            emergencyContactPhone: detailsResult.data.emergency_contact_phone,
            preferredLanguage: detailsResult.data.preferred_language,
            preferredContactMethod: detailsResult.data.preferred_contact_method,
            createdAt: detailsResult.data.created_at,
            updatedAt: detailsResult.data.updated_at
          });
      }

      if (consultationsResult.error) throw consultationsResult.error;
      if (consultationsResult.data) {
        // Map snake_case to camelCase for consultations
        const mappedConsultations = consultationsResult.data.map(c => ({
            id: c.id,
            userId: c.user_id,
            patientId: c.patient_id,
            appointmentId: c.appointment_id,
            consultationDate: c.consultation_date,
            consultationTime: c.consultation_time,
            attendingPhysician: c.attending_physician,
            chiefComplaint: c.chief_complaint,
            status: c.status,
            followUpDate: c.follow_up_date,
            followUpNotes: c.follow_up_notes,
            createdAt: c.created_at,
            updatedAt: c.updated_at
        }));
        setPatientConsultations(mappedConsultations);
      }
    } catch (err: any) {
      console.error('Error fetching patient summary:', err);
      setError('Failed to generate patient summary report.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  // Initialize data on page load
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchPatients();
      await fetchDiagnosisStats();
      setIsLoading(false);
    };
    initializeData();
  }, [fetchPatients, fetchDiagnosisStats]);

  // Generate report based on selected type and filters
  const handleGenerateReport = () => {
    if (reportType === 'diagnosis_trends') {
      fetchDiagnosisStats();
    } else if (reportType === 'patient_summary') {
      if (selectedPatientId) {
        fetchPatientSummary(selectedPatientId);
      } else {
        alert(getBilingualLabel('Please select a patient first.', 'முதலில் ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.'));
      }
    }
  };

  // Reset filters and fetch default report
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPatientId('');
    setSelectedPatientDetails(null);
    setPatientConsultations([]);
    // After resetting, fetch the default report again
    if (reportType === 'diagnosis_trends') {
        fetchDiagnosisStats();
    }
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
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-slate-800">
          {getBilingualLabel("Consultation Reports", "ஆலோசனை அறிக்கைகள்")}
        </h2>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {getBilingualLabel("Report Configuration", "அறிக்கை கட்டமைப்பு")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={handleResetFilters} variant="secondary">
            {getBilingualLabel("Reset Filters", "வடிகட்டிகளை மீட்டமைக்கவும்")}
          </Button>
          <Button onClick={handleGenerateReport} variant="primary" isLoading={isLoading}>
            {getBilingualLabel("Generate Report", "அறிக்கையை உருவாக்கு")}
          </Button>
        </div>
      </div>
      
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
            
            {!isLoading && diagnosisStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  {/* Table Head */}
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("ICD Code", "ICD குறியீடு")}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Description", "விளக்கம்")}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Count", "எண்ணிக்கை")}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Percentage", "சதவீதம்")}</th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody className="bg-white divide-y divide-slate-200">
                    {diagnosisStats.map((stat, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{stat.icdCode}</td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-slate-700">{stat.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{stat.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          <div className="flex items-center">
                            <span className="mr-2">{stat.percentage}%</span>
                            <div className="w-24 bg-slate-200 rounded-full h-2.5">
                              <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !isLoading && (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">{getBilingualLabel("No diagnosis data available for the selected period.", "தேர்ந்தெடுக்கப்பட்ட காலத்திற்கு நோயறிதல் தரவு எதுவும் கிடைக்கவில்லை.")}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                    {getBilingualLabel("Patient Summary", "நோயாளி சுருக்கம்")}
                </h3>
                {selectedPatientDetails && (
                    <PrintExportButton
                        targetId="report-content"
                        filename={`Patient_Summary_${selectedPatientDetails?.name}.pdf`}
                        variant="secondary"
                        size="sm"
                    />
                )}
            </div>
            
            {!isLoading && selectedPatientDetails ? (
                <div className="space-y-6">
                    {/* Patient Details Section */}
                    <div className="border-b border-slate-200 pb-4">
                        <h4 className="text-md font-semibold text-slate-700">{selectedPatientDetails.name}</h4>
                        <p className="text-sm text-slate-500">
                            {selectedPatientDetails.gender} | DOB: {selectedPatientDetails.dob}
                        </p>
                        <p className="text-sm text-slate-500">
                            {getBilingualLabel("Contact", "தொடர்புக்கு")}: {selectedPatientDetails.phone} | {selectedPatientDetails.email}
                        </p>
                    </div>

                    {/* Consultation History Section */}
                    <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-2">{getBilingualLabel("Consultation History", "ஆலோசனை வரலாறு")}</h4>
                        {patientConsultations.length > 0 ? (
                            <ul className="space-y-3">
                                {patientConsultations.map(consult => (
                                    <li key={consult.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                                        <p className="font-semibold text-sm text-slate-800">
                                            {consult.consultationDate} - {getBilingualLabel("Dr.", "மரு.")} {consult.attendingPhysician}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            <span className='font-medium'>{getBilingualLabel("Chief Complaint", "முதன்மை புகார்")}:</span> {consult.chiefComplaint}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">{getBilingualLabel("No consultation history found for this patient.", "இந்த நோயாளிக்கு ஆலோசனை வரலாறு எதுவும் இல்லை.")}</p>
                        )}
                    </div>
                </div>
            ) : !isLoading && (
                <div className="bg-slate-50 p-6 rounded-lg text-center">
                    <p className="text-slate-500">
                        {getBilingualLabel("Please select a patient and click 'Generate Report' to view their summary.", "ஒரு நோயாளியைத் தேர்ந்தெடுத்து, அவர்களின் சுருக்கத்தைக் காண 'அறிக்கையை உருவாக்கு' என்பதைக் கிளிக் செய்யவும்.")}
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
