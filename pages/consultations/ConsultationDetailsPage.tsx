import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import { formatReadableDate } from '../../utils/dateHelpers';

// Consultation components
import VitalSignsForm from '../../components/consultation/VitalSignsForm';
import ClinicalNotesForm from '../../components/consultation/ClinicalNotesForm';
import DiagnosisForm from '../../components/consultation/DiagnosisForm';
import TreatmentForm from '../../components/consultation/TreatmentForm';
import PrescriptionForm from '../../components/consultation/PrescriptionForm';
import ReferralForm from '../../components/consultation/ReferralForm';
import ConsultationDocumentUpload from '../../components/consultation/ConsultationDocumentUpload';
import DetailedSummaryModal from '../../components/consultation/DetailedSummaryModal';
import DetailedPrescriptionModal from '../../components/consultation/DetailedPrescriptionModal';
import ConsultationPaymentSection from '../../components/consultation/ConsultationPaymentSection';

// Types
import {
  Consultation,
  ConsultationStatus,
  VitalSign,
  ClinicalNote,
  Diagnosis,
  Treatment,
  Prescription,
  Referral,
  NewDbVitalSigns,
  NewDbClinicalNote,
  NewDbDiagnosis,
  NewDbTreatment,
  NewDbPrescription,
  NewDbReferral,
  NewDbConsultationDocument
} from '../../types';

// API functions
import * as ConsultationAPI from '../../api/consultations';
import * as VitalSignsAPI from '../../api/vitalSigns';
import * as ClinicalNotesAPI from '../../api/clinicalNotes';
import * as DiagnosesAPI from '../../api/diagnoses';
import * as TreatmentsAPI from '../../api/treatments';
import * as PrescriptionsAPI from '../../api/prescriptions';
import * as ReferralsAPI from '../../api/referrals';
import * as DocumentsAPI from '../../api/consultationDocuments';

interface ConsultationDetailsPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationDetailsPage: React.FC<ConsultationDetailsPageProps> = ({ user, onLogout }) => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  
  // Consultation data
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSign | null>(null);
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('vitals');
  
  // Modal states
  const [isVitalSignsModalOpen, setIsVitalSignsModalOpen] = useState(false);
  const [isClinicalNotesModalOpen, setIsClinicalNotesModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  
  // Summary data for modals
  const [summaryData, setSummaryData] = useState<any>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Fetch all consultation data
  const fetchConsultationData = useCallback(async () => {
    if (!consultationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch consultation details
      const { data: consultationData, error: consultationError } = await ConsultationAPI.getConsultationById(consultationId, user.id);
      if (consultationError) throw consultationError;
      
      if (consultationData) {
        setConsultation({
          id: consultationData.id,
          userId: consultationData.user_id,
          patientId: consultationData.patient_id,
          appointmentId: consultationData.appointment_id,
          consultationDate: consultationData.consultation_date,
          consultationTime: consultationData.consultation_time,
          attendingPhysician: consultationData.attending_physician,
          chiefComplaint: consultationData.chief_complaint,
          status: consultationData.status,
          followUpDate: consultationData.follow_up_date,
          followUpNotes: consultationData.follow_up_notes,
          createdAt: consultationData.created_at,
          updatedAt: consultationData.updated_at,
          patientName: consultationData.patients?.name,
          patientDob: consultationData.patients?.dob,
          patientGender: consultationData.patients?.gender,
          patientPhone: consultationData.patients?.contact_phone,
          patientEmail: consultationData.patients?.contact_email
        });
      }
      
      // Fetch vital signs
      const { data: vitalSignsData } = await VitalSignsAPI.getVitalSignsByConsultationId(consultationId, user.id);
      setVitalSigns(vitalSignsData);
      
      // Fetch clinical notes
      const { data: clinicalNoteData } = await ClinicalNotesAPI.getClinicalNotesByConsultationId(consultationId, user.id);
      setClinicalNote(clinicalNoteData);
      
      // Fetch diagnoses
      const { data: diagnosesData, error: diagnosesError } = await DiagnosesAPI.getDiagnosesByConsultationId(consultationId, user.id);
      if (diagnosesError) throw diagnosesError;
      setDiagnoses(diagnosesData || []);
      
      // Fetch treatments
      const { data: treatmentsData, error: treatmentsError } = await TreatmentsAPI.getTreatmentsByConsultationId(consultationId, user.id);
      if (treatmentsError) throw treatmentsError;
      setTreatments(treatmentsData || []);
      
      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await PrescriptionsAPI.getPrescriptionsByConsultationId(consultationId, user.id);
      if (prescriptionsError) throw prescriptionsError;
      setPrescriptions(prescriptionsData || []);
      
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await ReferralsAPI.getReferralsByConsultationId(consultationId, user.id);
      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);
      
      // Fetch documents
      const { data: documentsData, error: documentsError } = await DocumentsAPI.getDocumentsByConsultationId(consultationId, user.id);
      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);
      
    } catch (err: any) {
      console.error('Error fetching consultation data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [consultationId, user.id]);

  useEffect(() => {
    fetchConsultationData();
  }, [fetchConsultationData]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: ConsultationStatus) => {
    if (!consultation) return;
    
    try {
      const { error } = await ConsultationAPI.updateConsultationStatus(
        consultation.id,
        newStatus,
        user.id
      );
      
      if (error) throw error;
      
      setConsultation(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  // Handle vital signs submission
  const handleVitalSignsSubmit = async (data: NewDbVitalSigns) => {
    try {
      if (vitalSigns?.id) {
        // Update existing vital signs
        const { error } = await VitalSignsAPI.updateVitalSigns(vitalSigns.id, data, user.id);
        if (error) throw error;
      } else {
        // Add new vital signs
        const { error } = await VitalSignsAPI.addVitalSigns(data, user.id);
        if (error) throw error;
      }
      
      setIsVitalSignsModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error saving vital signs:', err);
      setError(err.message);
    }
  };

  // Handle clinical notes submission
  const handleClinicalNotesSubmit = async (data: NewDbClinicalNote) => {
    try {
      if (clinicalNote?.id) {
        // Update existing clinical notes
        const { error } = await ClinicalNotesAPI.updateClinicalNotes(clinicalNote.id, data, user.id);
        if (error) throw error;
      } else {
        // Add new clinical notes
        const { error } = await ClinicalNotesAPI.addClinicalNotes(data, user.id);
        if (error) throw error;
      }
      
      setIsClinicalNotesModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error saving clinical notes:', err);
      setError(err.message);
    }
  };

  // Handle diagnosis submission
  const handleDiagnosisSubmit = async (data: NewDbDiagnosis) => {
    try {
      const { error } = await DiagnosesAPI.addDiagnosis(data, user.id);
      if (error) throw error;
      
      setIsDiagnosisModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error adding diagnosis:', err);
      setError(err.message);
    }
  };

  // Handle treatment submission
  const handleTreatmentSubmit = async (data: NewDbTreatment) => {
    try {
      const { error } = await TreatmentsAPI.addTreatment(data, user.id);
      if (error) throw error;
      
      setIsTreatmentModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error adding treatment:', err);
      setError(err.message);
    }
  };

  // Handle prescription submission
  const handlePrescriptionSubmit = async (data: NewDbPrescription) => {
    try {
      const { error } = await PrescriptionsAPI.addPrescription(data, user.id);
      if (error) throw error;
      
      setIsPrescriptionModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error adding prescription:', err);
      setError(err.message);
    }
  };

  // Handle referral submission
  const handleReferralSubmit = async (data: NewDbReferral) => {
    try {
      const { error } = await ReferralsAPI.addReferral(data, user.id);
      if (error) throw error;
      
      setIsReferralModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error adding referral:', err);
      setError(err.message);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (data: Omit<NewDbConsultationDocument, 'file_name' | 'file_path'>, file: File) => {
    try {
      const { error } = await DocumentsAPI.uploadConsultationDocument(
        data,
        file,
        consultationId!,
        consultation!.patientId,
        user.id
      );
      
      if (error) throw error;
      
      setIsDocumentUploadModalOpen(false);
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message);
    }
  };

  // Handle view summary
  const handleViewSummary = async () => {
    try {
      const { data, error } = await ConsultationAPI.getDetailedConsultationSummary(consultationId!, user.id);
      if (error) throw error;
      
      setSummaryData(data);
      setIsSummaryModalOpen(true);
    } catch (err: any) {
      console.error('Error getting consultation summary:', err);
      setError(err.message);
    }
  };

  // Handle view prescription
  const handleViewPrescription = async () => {
    try {
      const { data, error } = await ConsultationAPI.getDetailedConsultationSummary(consultationId!, user.id);
      if (error) throw error;
      
      setSummaryData(data);
      setIsPrescriptionModalOpen(true);
    } catch (err: any) {
      console.error('Error getting prescription data:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <MainLayout
        user={user}
        onLogout={onLogout}
        currentPage="consultations"
        isLoading={true}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!consultation) {
    return (
      <MainLayout
        user={user}
        onLogout={onLogout}
        currentPage="consultations"
      >
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            {getBilingualLabel("Consultation not found", "ஆலோசனை கண்டுபிடிக்கப்படவில்லை")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {getBilingualLabel("The consultation you're looking for doesn't exist or you don't have access to it.", "நீங்கள் தேடும் ஆலோசனை இல்லை அல்லது உங்களுக்கு அதற்கான அணுகல் இல்லை.")}
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/consultations')} variant="primary">
              {getBilingualLabel("Back to Consultations", "ஆலோசனைகளுக்குத் திரும்பு")}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      user={user}
      onLogout={onLogout}
      currentPage="consultations"
      breadcrumbs={[
        { label: getBilingualLabel('Consultations', 'ஆலோசனைகள்'), href: '/consultations' },
        { label: getBilingualLabel('Consultation Details', 'ஆலோசனை விவரங்கள்') }
      ]}
    >
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Consultation Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {getBilingualLabel("Consultation", "ஆலோசனை")}: {formatReadableDate(new Date(consultation.consultationDate))}
            </h2>
            <p className="text-slate-600">
              {getBilingualLabel("Patient", "நோயாளி")}: {consultation.patientName} | 
              {getBilingualLabel("Physician", "மருத்துவர்")}: {consultation.attendingPhysician}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              consultation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
              consultation.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
              consultation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-slate-100 text-slate-800'
            }`}>
              {consultation.status}
            </span>
            
            <div className="flex space-x-2">
              {consultation.status === 'scheduled' && (
                <Button
                  onClick={() => handleStatusUpdate('in_progress')}
                  variant="primary"
                  size="sm"
                >
                  {getBilingualLabel("Start Consultation", "ஆலோசனையைத் தொடங்கு")}
                </Button>
              )}
              
              {consultation.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  variant="success"
                  size="sm"
                >
                  {getBilingualLabel("Complete", "முடிக்கவும்")}
                </Button>
              )}
              
              {(consultation.status === 'scheduled' || consultation.status === 'in_progress') && (
                <Button
                  onClick={() => handleStatusUpdate('cancelled')}
                  variant="danger"
                  size="sm"
                >
                  {getBilingualLabel("Cancel", "ரத்துசெய்")}
                </Button>
              )}
              
              <Button
                onClick={handleViewSummary}
                variant="secondary"
                size="sm"
              >
                {getBilingualLabel("View Summary", "சுருக்கத்தைக் காண்க")}
              </Button>
              
              {prescriptions.length > 0 && (
                <Button
                  onClick={handleViewPrescription}
                  variant="secondary"
                  size="sm"
                >
                  {getBilingualLabel("View Prescription", "மருந்து சீட்டைக் காண்க")}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {getBilingualLabel("Chief Complaint", "முதன்மை புகார்")}
          </h3>
          <p className="text-slate-700">{consultation.chiefComplaint}</p>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'vitals'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Clinical Notes", "மருத்துவக் குறிப்புகள்")}
            </button>
            <button
              onClick={() => setActiveTab('diagnoses')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'diagnoses'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Diagnoses", "நோயறிதல்கள்")}
            </button>
            <button
              onClick={() => setActiveTab('treatments')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'treatments'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Treatments", "சிகிச்சைகள்")}
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'prescriptions'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Prescriptions", "மருந்து சீட்டுகள்")}
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'referrals'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Referrals", "பரிந்துரைகள்")}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Documents", "ஆவணங்கள்")}
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {getBilingualLabel("Billing", "பில்லிங்")}
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Vital Signs */}
          {activeTab === 'vitals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}
                </h3>
                <Button
                  onClick={() => setIsVitalSignsModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {vitalSigns ? getBilingualLabel("Update", "புதுப்பிக்கவும்") : getBilingualLabel("Add", "சேர்")}
                </Button>
              </div>
              
              {vitalSigns ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Temperature", "வெப்பநிலை")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.temperature !== null ? `${vitalSigns.temperature} ${vitalSigns.temperatureUnit === 'Celsius' ? '°C' : '°F'}` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Blood Pressure", "இரத்த அழுத்தம்")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.bloodPressureSystolic !== null && vitalSigns.bloodPressureDiastolic !== null
                        ? `${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic} mmHg`
                        : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Heart Rate", "இதய துடிப்பு")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.heartRate !== null ? `${vitalSigns.heartRate} bpm` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Respiratory Rate", "சுவாச வீதம்")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.respiratoryRate !== null ? `${vitalSigns.respiratoryRate} breaths/min` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Oxygen Saturation", "ஆக்ஸிஜன் செறிவூட்டல்")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.oxygenSaturation !== null ? `${vitalSigns.oxygenSaturation}%` : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("BMI", "உடல் நிறை குறியீடு")}
                    </h4>
                    <p className="text-lg font-semibold text-slate-900">
                      {vitalSigns.bmi !== null ? vitalSigns.bmi.toFixed(1) : '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No vital signs recorded for this consultation.", "இந்த ஆலோசனைக்கு உயிர் அறிகுறிகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Clinical Notes */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Clinical Notes", "மருத்துவக் குறிப்புகள்")}
                </h3>
                <Button
                  onClick={() => setIsClinicalNotesModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {clinicalNote ? getBilingualLabel("Update", "புதுப்பிக்கவும்") : getBilingualLabel("Add", "சேர்")}
                </Button>
              </div>
              
              {clinicalNote ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Subjective", "சப்ஜெக்டிவ்")}
                    </h4>
                    <p className="text-slate-900 whitespace-pre-wrap">{clinicalNote.subjective || '-'}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Objective", "ஆப்ஜெக்டிவ்")}
                    </h4>
                    <p className="text-slate-900 whitespace-pre-wrap">{clinicalNote.objective || '-'}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Assessment", "அசெஸ்மென்ட்")}
                    </h4>
                    <p className="text-slate-900 whitespace-pre-wrap">{clinicalNote.assessment || '-'}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      {getBilingualLabel("Plan", "ப்ளான்")}
                    </h4>
                    <p className="text-slate-900 whitespace-pre-wrap">{clinicalNote.plan || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No clinical notes recorded for this consultation.", "இந்த ஆலோசனைக்கு மருத்துவக் குறிப்புகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Diagnoses */}
          {activeTab === 'diagnoses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Diagnoses", "நோயறிதல்கள்")}
                </h3>
                <Button
                  onClick={() => setIsDiagnosisModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {getBilingualLabel("Add Diagnosis", "நோயறிதலைச் சேர்")}
                </Button>
              </div>
              
              {diagnoses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getBilingualLabel("ICD Code", "ICD குறியீடு")}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getBilingualLabel("Description", "விளக்கம்")}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getBilingualLabel("Primary", "முதன்மை")}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getBilingualLabel("Date", "தேதி")}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {getBilingualLabel("Notes", "குறிப்புகள்")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {diagnoses.map((diagnosis) => (
                        <tr key={diagnosis.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                            {diagnosis.icdCode} ({diagnosis.icdVersion})
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {diagnosis.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                            {diagnosis.isPrimary ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getBilingualLabel("Primary", "முதன்மை")}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                            {diagnosis.diagnosisDate}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {diagnosis.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No diagnoses recorded for this consultation.", "இந்த ஆலோசனைக்கு நோயறிதல்கள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Treatments */}
          {activeTab === 'treatments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Treatments", "சிகிச்சைகள்")}
                </h3>
                <Button
                  onClick={() => setIsTreatmentModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {getBilingualLabel("Add Treatment", "சிகிச்சையைச் சேர்")}
                </Button>
              </div>
              
              {treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="text-md font-medium text-slate-900">
                          {treatment.treatmentName}
                        </h4>
                        {treatment.treatmentCode && (
                          <span className="text-sm text-slate-500">
                            {getBilingualLabel("Code", "குறியீடு")}: {treatment.treatmentCode}
                          </span>
                        )}
                      </div>
                      
                      {treatment.description && (
                        <p className="mt-2 text-sm text-slate-700">
                          {treatment.description}
                        </p>
                      )}
                      
                      {treatment.instructions && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium text-slate-700">
                            {getBilingualLabel("Instructions", "வழிமுறைகள்")}:
                          </h5>
                          <p className="text-sm text-slate-700">{treatment.instructions}</p>
                        </div>
                      )}
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {treatment.duration !== null && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getBilingualLabel("Duration", "கால அளவு")}: {treatment.duration} {getBilingualLabel("minutes", "நிமிடங்கள்")}
                          </span>
                        )}
                        
                        {treatment.followUpRequired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {getBilingualLabel("Follow-up", "பின்தொடர்தல்")}: {treatment.followUpInterval} {getBilingualLabel("days", "நாட்கள்")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No treatments recorded for this consultation.", "இந்த ஆலோசனைக்கு சிகிச்சைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Prescriptions */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Prescriptions", "மருந்து சீட்டுகள்")}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    variant="primary"
                    size="sm"
                  >
                    {getBilingualLabel("Add Prescription", "மருந்து சீட்டைச் சேர்")}
                  </Button>
                  
                  {prescriptions.length > 0 && (
                    <Button
                      onClick={handleViewPrescription}
                      variant="secondary"
                      size="sm"
                    >
                      {getBilingualLabel("Print Prescription", "மருந்து சீட்டை அச்சிடு")}
                    </Button>
                  )}
                </div>
              </div>
              
              {prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="text-md font-medium text-slate-900">
                          {prescription.medicationName}
                        </h4>
                        <span className="text-sm text-slate-500">
                          {prescription.dosage}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-700">
                        <div>
                          <span className="font-medium">{getBilingualLabel("Frequency", "அடுக்கு")}:</span> {prescription.frequency}
                        </div>
                        <div>
                          <span className="font-medium">{getBilingualLabel("Duration", "கால அளவு")}:</span> {prescription.duration} {getBilingualLabel("days", "நாட்கள்")}
                        </div>
                        {prescription.route && (
                          <div>
                            <span className="font-medium">{getBilingualLabel("Route", "வழி")}:</span> {prescription.route}
                          </div>
                        )}
                      </div>
                      
                      {prescription.specialInstructions && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-slate-700">{getBilingualLabel("Special Instructions", "சிறப்பு வழிமுறைகள்")}:</span>
                          <p className="text-sm text-slate-700">{prescription.specialInstructions}</p>
                        </div>
                      )}
                      
                      {prescription.isRefillable && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {getBilingualLabel("Refills", "மறுநிரப்புதல்கள்")}: {prescription.refillCount}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No prescriptions recorded for this consultation.", "இந்த ஆலோசனைக்கு மருந்து சீட்டுகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Referrals */}
          {activeTab === 'referrals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Referrals", "பரிந்துரைகள்")}
                </h3>
                <Button
                  onClick={() => setIsReferralModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {getBilingualLabel("Add Referral", "பரிந்துரையைச் சேர்")}
                </Button>
              </div>
              
              {referrals.length > 0 ? (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="text-md font-medium text-slate-900">
                          {getBilingualLabel("Referral to", "பரிந்துரை")} {referral.specialist}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          referral.urgency === 'routine' ? 'bg-blue-100 text-blue-800' :
                          referral.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-800' :
                          referral.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {referral.urgency}
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-sm font-medium text-slate-700">{getBilingualLabel("Type", "வகை")}:</span>
                        <span className="text-sm text-slate-700 ml-1">{referral.referralType}</span>
                      </div>
                      
                      {referral.facility && (
                        <div className="mt-1">
                          <span className="text-sm font-medium text-slate-700">{getBilingualLabel("Facility", "வசதி")}:</span>
                          <span className="text-sm text-slate-700 ml-1">{referral.facility}</span>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <span className="text-sm font-medium text-slate-700">{getBilingualLabel("Reason", "காரணம்")}:</span>
                        <p className="text-sm text-slate-700">{referral.reason}</p>
                      </div>
                      
                      {referral.notes && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-slate-700">{getBilingualLabel("Notes", "குறிப்புகள்")}:</span>
                          <p className="text-sm text-slate-700">{referral.notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {getBilingualLabel("Status", "நிலை")}: {referral.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No referrals recorded for this consultation.", "இந்த ஆலோசனைக்கு பரிந்துரைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Documents */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  {getBilingualLabel("Documents", "ஆவணங்கள்")}
                </h3>
                <Button
                  onClick={() => setIsDocumentUploadModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  {getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
                </Button>
              </div>
              
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <div key={document.id} className="bg-slate-50 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">
                            {document.document_type}
                          </h4>
                          <a
                            href={document.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-sky-600 hover:text-sky-800"
                          >
                            {document.file_name}
                          </a>
                          {document.description && (
                            <p className="text-xs text-slate-500 mt-1">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {getBilingualLabel("No documents uploaded for this consultation.", "இந்த ஆலோசனைக்கு ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை.")}
                </p>
              )}
            </div>
          )}
          
          {/* Billing */}
          {activeTab === 'billing' && (
            <ConsultationPaymentSection
              consultation={consultation}
              patientId={consultation.patientId}
              userId={user.id}
              onRefresh={fetchConsultationData}
            />
          )}
        </div>
      </div>
      
      {/* Modals */}
      <Modal
        isOpen={isVitalSignsModalOpen}
        onClose={() => setIsVitalSignsModalOpen(false)}
        title={getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}
      >
        <VitalSignsForm
          vitalSigns={vitalSigns}
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleVitalSignsSubmit}
          onCancel={() => setIsVitalSignsModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isClinicalNotesModalOpen}
        onClose={() => setIsClinicalNotesModalOpen(false)}
        title={getBilingualLabel("Clinical Notes", "மருத்துவக் குறிப்புகள்")}
      >
        <ClinicalNotesForm
          clinicalNote={clinicalNote}
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleClinicalNotesSubmit}
          onCancel={() => setIsClinicalNotesModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        title={getBilingualLabel("Add Diagnosis", "நோயறிதலைச் சேர்")}
      >
        <DiagnosisForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleDiagnosisSubmit}
          onCancel={() => setIsDiagnosisModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isTreatmentModalOpen}
        onClose={() => setIsTreatmentModalOpen(false)}
        title={getBilingualLabel("Add Treatment", "சிகிச்சையைச் சேர்")}
      >
        <TreatmentForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleTreatmentSubmit}
          onCancel={() => setIsTreatmentModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        title={getBilingualLabel("Add Prescription", "மருந்து சீட்டைச் சேர்")}
      >
        <PrescriptionForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handlePrescriptionSubmit}
          onCancel={() => setIsPrescriptionModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        title={getBilingualLabel("Add Referral", "பரிந்துரையைச் சேர்")}
      >
        <ReferralForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleReferralSubmit}
          onCancel={() => setIsReferralModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        title={getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
      >
        <ConsultationDocumentUpload
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleDocumentUpload}
          onCancel={() => setIsDocumentUploadModalOpen(false)}
        />
      </Modal>
      
      <DetailedSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
      />
      
      <DetailedPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        summaryData={summaryData}
      />
    </MainLayout>
  );
};

export default ConsultationDetailsPage;