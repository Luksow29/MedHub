import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import PrintExportButton from '../../components/shared/PrintExportButton';
import DetailedSummaryModal, { DetailedConsultationSummary } from '../../components/consultation/DetailedSummaryModal';
import DetailedPrescriptionModal from '../../components/consultation/DetailedPrescriptionModal';

// Types and APIs
import { Patient, DiagnosisStatistic, Consultation } from '../../types';
import * as PatientAPI from '../../api/patients';
import * as DiagnosesAPI from '../../api/diagnoses';
import * as ConsultationAPI from '../../api/consultations';

interface ConsultationReportsPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationReportsPage: React.FC<ConsultationReportsPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diagnosisStats, setDiagnosisStats] = useState<DiagnosisStatistic[]>([]);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  
  // Modal States
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedConsultationDetails, setSelectedConsultationDetails] = useState<DetailedConsultationSummary | null>(null);

  // Filters
  const [reportType, setReportType] = useState<'diagnosis_trends' | 'patient_summary'>('diagnosis_trends');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await PatientAPI.getAllPatients(user.id);
      if (error) throw error;
      if (data) {
        const mappedPatients = data.map(p => ({ id: p.id, userId: p.user_id, name: p.name, dob: p.dob, gender: p.gender, phone: p.contact_phone, email: p.contact_email, address: p.address, emergencyContactName: p.emergency_contact_name, emergencyContactPhone: p.emergency_contact_phone, preferredLanguage: p.preferred_language, preferredContactMethod: p.preferred_contact_method, createdAt: p.created_at, updatedAt: p.updated_at }));
        setPatients(mappedPatients);
      }
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patient list.');
    }
  }, [user.id]);

  const fetchDiagnosisStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await DiagnosesAPI.getDiagnosisStatistics(user.id, startDate || undefined, endDate || undefined);
      if (error) throw error;
      setDiagnosisStats(data || []);
    } catch (err: any) {
      console.error('Error fetching diagnosis statistics:', err);
      setError('Failed to load diagnosis statistics.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, startDate, endDate]);

  const fetchPatientSummary = useCallback(async (patientId: string) => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    setPatientConsultations([]);
    setSelectedPatientDetails(null);
    try {
      const [detailsResult, consultationsResult] = await Promise.all([
        PatientAPI.getPatientById(patientId, user.id),
        ConsultationAPI.getConsultationsByPatientId(patientId, user.id)
      ]);
      if (detailsResult.error) throw detailsResult.error;
      if (detailsResult.data) {
        setSelectedPatientDetails({ id: detailsResult.data.id, userId: detailsResult.data.user_id, name: detailsResult.data.name, dob: detailsResult.data.dob, gender: detailsResult.data.gender, phone: detailsResult.data.contact_phone, email: detailsResult.data.contact_email, address: detailsResult.data.address, emergencyContactName: detailsResult.data.emergency_contact_name, emergencyContactPhone: detailsResult.data.emergency_contact_phone, preferredLanguage: detailsResult.data.preferred_language, preferredContactMethod: detailsResult.data.preferred_contact_method, createdAt: detailsResult.data.created_at, updatedAt: detailsResult.data.updated_at });
      }

      if (consultationsResult.error) throw consultationsResult.error;
      if (consultationsResult.data) {
        const mappedConsultations = consultationsResult.data.map(c => ({ id: c.id, userId: c.user_id, patientId: c.patient_id, appointmentId: c.appointment_id, consultationDate: c.consultation_date, consultationTime: c.consultation_time, attendingPhysician: c.attending_physician, chiefComplaint: c.chief_complaint, status: c.status, followUpDate: c.follow_up_date, followUpNotes: c.follow_up_notes, createdAt: c.created_at, updatedAt: c.updated_at }));
        setPatientConsultations(mappedConsultations);
      }
    } catch (err: any) {
      console.error('Error fetching patient summary:', err);
      setError('Failed to generate patient summary report.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchPatients();
      await fetchDiagnosisStats();
      setIsLoading(false);
    };
    initializeData();
  }, [fetchPatients, fetchDiagnosisStats]);
  
  const fetchDetailsForModal = async (consultationId: string) => {
    setIsDetailLoading(true);
    setSelectedConsultationDetails(null);
    const { data, error } = await ConsultationAPI.getDetailedConsultationSummary(consultationId, user.id);
    if (error) {
      setError('Failed to load consultation details.');
      setIsDetailLoading(false);
      return;
    }
    if (data) {
        const mappedData: DetailedConsultationSummary = {
            consultation: { ...data.consultation, patientId: data.consultation.patient_id, consultationDate: data.consultation.consultation_date, chiefComplaint: data.consultation.chief_complaint, attendingPhysician: data.consultation.attending_physician, consultationTime: data.consultation.consultation_time, createdAt: data.consultation.created_at, updatedAt: data.consultation.updated_at },
            patient: { ...data.patient, userId: data.patient.user_id, dob: data.patient.dob, gender: data.patient.gender, phone: data.patient.contact_phone, email: data.patient.contact_email, emergencyContactName: data.patient.emergency_contact_name, emergencyContactPhone: data.patient.emergency_contact_phone, preferredLanguage: data.patient.preferred_language, preferredContactMethod: data.patient.preferred_contact_method, createdAt: data.patient.created_at, updatedAt: data.patient.updated_at },
            vitalSigns: data.vitalSigns ? { ...data.vitalSigns, userId: data.vitalSigns.user_id, consultationId: data.vitalSigns.consultation_id, patientId: data.vitalSigns.patient_id, heartRate: data.vitalSigns.heart_rate, bloodPressureSystolic: data.vitalSigns.blood_pressure_systolic, bloodPressureDiastolic: data.vitalSigns.blood_pressure_diastolic, respiratoryRate: data.vitalSigns.respiratory_rate, oxygenSaturation: data.vitalSigns.oxygen_saturation, painScore: data.vitalSigns.pain_score, temperatureUnit: data.vitalSigns.temperature_unit, heightUnit: data.vitalSigns.height_unit, weightUnit: data.vitalSigns.weight_unit, createdAt: data.vitalSigns.created_at, updatedAt: data.vitalSigns.updated_at } : null,
            clinicalNote: data.clinicalNote ? { ...data.clinicalNote, userId: data.clinicalNote.user_id, consultationId: data.clinicalNote.consultation_id, patientId: data.clinicalNote.patient_id, createdAt: data.clinicalNote.created_at, updatedAt: data.clinicalNote.updated_at } : null,
            diagnoses: data.diagnoses.map(d => ({ ...d, userId: d.user_id, consultationId: d.consultation_id, patientId: d.patient_id, icdCode: d.icd_code, isPrimary: d.is_primary, icdVersion: d.icd_version, diagnosisDate: d.diagnosis_date, createdAt: d.created_at, updatedAt: d.updated_at })),
            treatments: data.treatments.map(t => ({ ...t, userId: t.user_id, consultationId: t.consultation_id, patientId: t.patient_id, treatmentName: t.treatment_name, treatmentCode: t.treatment_code, followUpRequired: t.follow_up_required, followUpInterval: t.follow_up_interval, createdAt: t.created_at, updatedAt: t.updated_at })),
            prescriptions: data.prescriptions.map(p => ({ ...p, userId: p.user_id, consultationId: p.consultation_id, patientId: p.patient_id, medicationName: p.medication_name, isRefillable: p.is_refillable, refillCount: p.refill_count, specialInstructions: p.special_instructions, createdAt: p.created_at, updatedAt: p.updated_at }))
        };
      setSelectedConsultationDetails(mappedData);
    }
    setIsDetailLoading(false);
  };

  const handleViewSummaryClick = async (consultationId: string) => {
    setIsSummaryModalOpen(true);
    await fetchDetailsForModal(consultationId);
  };
  
  const handleViewPrescriptionClick = async (consultationId: string) => {
    setIsPrescriptionModalOpen(true);
    await fetchDetailsForModal(consultationId);
  };
  
  const handleEditClick = (consultationId: string) => {
    navigate(`/consultations/${consultationId}`);
  };

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

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPatientId('');
    setSelectedPatientDetails(null);
    setPatientConsultations([]);
    if (reportType === 'diagnosis_trends') {
        fetchDiagnosisStats();
    }
  };

  return (
    <MainLayout user={user} onLogout={onLogout} currentPage="consultations" breadcrumbs={[{ label: getBilingualLabel('Consultations', 'ஆலோசனைகள்'), href: '/consultations' }, { label: getBilingualLabel('Reports', 'அறிக்கைகள்') }]} isLoading={isLoading}>
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert"><p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p><p>{error}</p></div>}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"><h2 className="text-3xl font-semibold text-slate-800">{getBilingualLabel("Consultation Reports", "ஆலோசனை அறிக்கைகள்")}</h2></div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{getBilingualLabel("Report Configuration", "அறிக்கை கட்டமைப்பு")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-slate-700 mb-2">{getBilingualLabel("Report Type", "அறிக்கை வகை")}</label>
            <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
              <option value="diagnosis_trends">{getBilingualLabel("Diagnosis Trends", "நோயறிதல் போக்குகள்")}</option>
              <option value="patient_summary">{getBilingualLabel("Patient Summary", "நோயாளி சுருக்கம்")}</option>
            </select>
            {reportType === 'patient_summary' && (
              <div className="mt-4">
                <label htmlFor="patientId" className="block text-sm font-medium text-slate-700 mb-2">{getBilingualLabel("Select Patient", "நோயாளியைத் தேர்ந்தெடுக்கவும்")}</label>
                <select id="patientId" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                  <option value="">{getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}</option>
                  {patients.map((patient) => (<option key={patient.id} value={patient.id}>{patient.name}</option>))}
                </select>
              </div>
            )}
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">{getBilingualLabel("Start Date", "தொடக்க தேதி")}</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">{getBilingualLabel("End Date", "முடிவு தேதி")}</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={handleResetFilters} variant="secondary">{getBilingualLabel("Reset Filters", "வடிகட்டிகளை மீட்டமைக்கவும்")}</Button>
          <Button onClick={handleGenerateReport} variant="primary" isLoading={isLoading}>{getBilingualLabel("Generate Report", "அறிக்கையை உருவாக்கு")}</Button>
        </div>
      </div>
      <div id="report-content" className="bg-white p-6 rounded-lg shadow-md">
        {reportType === 'diagnosis_trends' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">{getBilingualLabel("Diagnosis Trends", "நோயறிதல் போக்குகள்")}</h3>
              <PrintExportButton targetId="report-content" filename="Diagnosis_Trends_Report.pdf" variant="secondary" size="sm" />
            </div>
            {!isLoading && diagnosisStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("ICD Code", "ICD குறியீடு")}</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Description", "விளக்கம்")}</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Count", "எண்ணிக்கை")}</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{getBilingualLabel("Percentage", "சதவீதம்")}</th></tr></thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {diagnosisStats.map((stat, index) => (
                      <tr key={index} className="hover:bg-slate-50"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{stat.icdCode}</td><td className="px-6 py-4 whitespace-normal text-sm text-slate-700">{stat.description}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{stat.count}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700"><div className="flex items-center"><span className="mr-2">{stat.percentage}%</span><div className="w-24 bg-slate-200 rounded-full h-2.5"><div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${stat.percentage}%` }}></div></div></div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !isLoading && (<div className="bg-slate-50 p-6 rounded-lg text-center"><p className="text-slate-500">{getBilingualLabel("No diagnosis data available for the selected period.", "தேர்ந்தெடுக்கப்பட்ட காலத்திற்கு நோயறிதல் தரவு எதுவும் கிடைக்கவில்லை.")}</p></div>)}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">{getBilingualLabel("Patient Summary", "நோயாளி சுருக்கம்")}</h3>
              {selectedPatientDetails && <PrintExportButton targetId="report-content" filename={`Patient_Summary_${selectedPatientDetails?.name}.pdf`} variant="secondary" size="sm" />}
            </div>
            {!isLoading && selectedPatientDetails ? (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h4 className="text-md font-semibold text-slate-700">{selectedPatientDetails.name}</h4>
                  <p className="text-sm text-slate-500">DOB: {selectedPatientDetails.dob} | {selectedPatientDetails.gender}</p>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-slate-700 mb-2">{getBilingualLabel("Consultation History", "ஆலோசனை வரலாறு")}</h4>
                  {patientConsultations.length > 0 ? (
                    <ul className="space-y-3">
                      {patientConsultations.map(consult => (
                        <li key={consult.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                          <div className="flex justify-between items-start flex-wrap">
                            <div className="flex-grow mb-2 sm:mb-0">
                              <p className="font-semibold text-sm text-slate-800">{consult.consultationDate} - Dr. {consult.attendingPhysician}</p>
                              <p className="text-sm text-slate-600 mt-1"><span className='font-medium'>Chief Complaint:</span> {consult.chiefComplaint}</p>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                               <Button size="xs" variant="primary" onClick={() => handleViewSummaryClick(consult.id)}>{getBilingualLabel("Summary", "சுருக்கம்")}</Button>
                               <Button size="xs" variant="success" onClick={() => handleViewPrescriptionClick(consult.id)}>{getBilingualLabel("Rx", "மருந்து")}</Button>
                               <Button size="xs" variant="secondary" onClick={() => handleEditClick(consult.id)}>{getBilingualLabel("Edit", "திருத்து")}</Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (<p className="text-sm text-slate-500">{getBilingualLabel("No consultation history found for this patient.", "இந்த நோயாளிக்கு ஆலோசனை வரலாறு எதுவும் இல்லை.")}</p>)}
                </div>
              </div>
            ) : !isLoading && (<div className="bg-slate-50 p-6 rounded-lg text-center"><p className="text-slate-500">{getBilingualLabel("Please select a patient and click 'Generate Report' to view their summary.", "ஒரு நோயாளியைத் தேர்ந்தெடுத்து, அவர்களின் சுருக்கத்தைக் காண 'அறிக்கையை உருவாக்கு' என்பதைக் கிளிக் செய்யவும்.")}</p></div>)}
          </>
        )}
      </div>

      <DetailedSummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summaryData={isDetailLoading ? null : selectedConsultationDetails} />
      <DetailedPrescriptionModal isOpen={isPrescriptionModalOpen} onClose={() => setIsPrescriptionModalOpen(false)} summaryData={isDetailLoading ? null : selectedConsultationDetails} />
    </MainLayout>
  );
};

export default ConsultationReportsPage;
