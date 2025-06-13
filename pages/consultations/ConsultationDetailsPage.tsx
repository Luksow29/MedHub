import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import PrintablePageWrapper from '../../components/shared/PrintablePageWrapper';
import PrintExportButton from '../../components/shared/PrintExportButton';
import CollapsibleSection from '../../components/shared/CollapsibleSection';

// Consultation components
import ConsultationForm from '../../components/consultation/ConsultationForm';
import DiagnosisForm from '../../components/consultation/DiagnosisForm';
import ClinicalNotesForm from '../../components/consultation/ClinicalNotesForm';
import VitalSignsForm from '../../components/consultation/VitalSignsForm';
import TreatmentForm from '../../components/consultation/TreatmentForm';
import PrescriptionForm from '../../components/consultation/PrescriptionForm';
import ReferralForm from '../../components/consultation/ReferralForm';
import ConsultationDocumentUpload from '../../components/consultation/ConsultationDocumentUpload';

// Types
import {
  Consultation,
  NewDbConsultation,
  UpdateDbConsultation,
  ConsultationStatus,
  Diagnosis,
  NewDbDiagnosis,
  UpdateDbDiagnosis,
  ClinicalNote,
  NewDbClinicalNote,
  UpdateDbClinicalNote,
  VitalSigns,
  NewDbVitalSigns,
  UpdateDbVitalSigns,
  Treatment,
  NewDbTreatment,
  UpdateDbTreatment,
  Prescription,
  NewDbPrescription,
  UpdateDbPrescription,
  Referral,
  NewDbReferral,
  UpdateDbReferral,
  ConsultationDocument,
  NewDbConsultationDocument,
  Patient
} from '../../types';

// API functions
import * as ConsultationAPI from '../../api/consultations';
import * as DiagnosesAPI from '../../api/diagnoses';
import * as ClinicalNotesAPI from '../../api/clinicalNotes';
import * as VitalSignsAPI from '../../api/vitalSigns';
import * as TreatmentsAPI from '../../api/treatments';
import * as PrescriptionsAPI from '../../api/prescriptions';
import * as ReferralsAPI from '../../api/referrals';
import * as ConsultationDocumentsAPI from '../../api/consultationDocuments';
import * as PatientAPI from '../../api/patients';

interface ConsultationDetailsPageProps {
  user: User;
  onLogout: () => void;
}

const ConsultationDetailsPage: React.FC<ConsultationDetailsPageProps> = ({ user, onLogout }) => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  
  // State for consultation and related data
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [documents, setDocuments] = useState<ConsultationDocument[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'soap' | 'diagnoses' | 'treatments' | 'prescriptions' | 'referrals' | 'documents'>('overview');
  
  // Modal states
  const [isEditConsultationModalOpen, setIsEditConsultationModalOpen] = useState(false);
  const [isAddDiagnosisModalOpen, setIsAddDiagnosisModalOpen] = useState(false);
  const [isEditClinicalNotesModalOpen, setIsEditClinicalNotesModalOpen] = useState(false);
  const [isEditVitalSignsModalOpen, setIsEditVitalSignsModalOpen] = useState(false);
  const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
  const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
  const [isAddReferralModalOpen, setIsAddReferralModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  
  // Edit states
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  
  // Section expansion states
  const [isVitalSignsExpanded, setIsVitalSignsExpanded] = useState(true);
  const [isDiagnosesExpanded, setIsDiagnosesExpanded] = useState(true);
  const [isClinicalNotesExpanded, setIsClinicalNotesExpanded] = useState(true);
  const [isTreatmentsExpanded, setIsTreatmentsExpanded] = useState(true);
  const [isPrescriptionsExpanded, setIsPrescriptionsExpanded] = useState(true);
  const [isReferralsExpanded, setIsReferralsExpanded] = useState(true);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(true);
  
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
        
        // Fetch patient details
        if (consultationData.patient_id) {
          const { data: patientData, error: patientError } = await PatientAPI.getPatientById(consultationData.patient_id, user.id);
          if (!patientError && patientData) {
            setPatient({
              id: patientData.id,
              userId: patientData.user_id,
              name: patientData.name,
              dob: patientData.dob,
              gender: patientData.gender,
              phone: patientData.contact_phone,
              email: patientData.contact_email,
              address: patientData.address,
              emergencyContactName: patientData.emergency_contact_name,
              emergencyContactPhone: patientData.emergency_contact_phone,
              preferredLanguage: patientData.preferred_language,
              preferredContactMethod: patientData.preferred_contact_method,
              createdAt: patientData.created_at,
              updatedAt: patientData.updated_at
            });
          }
        }
      }
      
      // Fetch diagnoses
      const { data: diagnosesData, error: diagnosesError } = await DiagnosesAPI.getDiagnosesByConsultationId(consultationId, user.id);
      if (diagnosesError) throw diagnosesError;
      
      if (diagnosesData) {
        setDiagnoses(diagnosesData.map(d => ({
          id: d.id,
          userId: d.user_id,
          consultationId: d.consultation_id,
          patientId: d.patient_id,
          icdCode: d.icd_code,
          icdVersion: d.icd_version,
          description: d.description,
          isPrimary: d.is_primary,
          diagnosisDate: d.diagnosis_date,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        })));
      }
      
      // Fetch clinical notes
      const { data: clinicalNoteData, error: clinicalNoteError } = await ClinicalNotesAPI.getClinicalNotesByConsultationId(consultationId, user.id);
      if (!clinicalNoteError && clinicalNoteData) {
        setClinicalNote({
          id: clinicalNoteData.id,
          userId: clinicalNoteData.user_id,
          consultationId: clinicalNoteData.consultation_id,
          patientId: clinicalNoteData.patient_id,
          subjective: clinicalNoteData.subjective,
          objective: clinicalNoteData.objective,
          assessment: clinicalNoteData.assessment,
          plan: clinicalNoteData.plan,
          createdAt: clinicalNoteData.created_at,
          updatedAt: clinicalNoteData.updated_at
        });
      }
      
      // Fetch vital signs
      const { data: vitalSignsData, error: vitalSignsError } = await VitalSignsAPI.getVitalSignsByConsultationId(consultationId, user.id);
      if (!vitalSignsError && vitalSignsData) {
        setVitalSigns(vitalSignsData);
      }
      
      // Fetch treatments
      const { data: treatmentsData, error: treatmentsError } = await TreatmentsAPI.getTreatmentsByConsultationId(consultationId, user.id);
      if (treatmentsError) throw treatmentsError;
      
      if (treatmentsData) {
        setTreatments(treatmentsData.map(t => ({
          id: t.id,
          userId: t.user_id,
          consultationId: t.consultation_id,
          patientId: t.patient_id,
          treatmentCode: t.treatment_code,
          treatmentName: t.treatment_name,
          description: t.description,
          instructions: t.instructions,
          duration: t.duration,
          followUpRequired: t.follow_up_required,
          followUpInterval: t.follow_up_interval,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        })));
      }
      
      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await PrescriptionsAPI.getPrescriptionsByConsultationId(consultationId, user.id);
      if (prescriptionsError) throw prescriptionsError;
      
      if (prescriptionsData) {
        setPrescriptions(prescriptionsData.map(p => ({
          id: p.id,
          userId: p.user_id,
          consultationId: p.consultation_id,
          patientId: p.patient_id,
          medicationName: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          quantity: p.quantity,
          route: p.route,
          specialInstructions: p.special_instructions,
          isRefillable: p.is_refillable,
          refillCount: p.refill_count,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })));
      }
      
      // Fetch referrals
      const { data: referralsData, error: referralsError } = await ReferralsAPI.getReferralsByConsultationId(consultationId, user.id);
      if (referralsError) throw referralsError;
      
      if (referralsData) {
        setReferrals(referralsData.map(r => ({
          id: r.id,
          userId: r.user_id,
          consultationId: r.consultation_id,
          patientId: r.patient_id,
          referralType: r.referral_type,
          specialist: r.specialist,
          facility: r.facility,
          reason: r.reason,
          urgency: r.urgency,
          status: r.status,
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })));
      }
      
      // Fetch documents
      const { data: documentsData, error: documentsError } = await ConsultationDocumentsAPI.getDocumentsByConsultationId(consultationId, user.id);
      if (documentsError) throw documentsError;
      
      if (documentsData) {
        setDocuments(documentsData.map(d => ({
          id: d.id,
          userId: d.user_id,
          consultationId: d.consultation_id,
          patientId: d.patient_id,
          documentType: d.document_type,
          fileName: d.file_name,
          filePath: d.file_path,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        })));
      }
      
      // Fetch all patients for forms
      const { data: patientsData, error: patientsError } = await PatientAPI.getAllPatients(user.id);
      if (patientsError) throw patientsError;
      
      if (patientsData) {
        setPatients(patientsData.map(p => ({
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
        })));
      }
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

  // Consultation operations
  const handleUpdateConsultation = async (data: UpdateDbConsultation) => {
    if (!consultationId) return;
    
    try {
      const { error } = await ConsultationAPI.updateConsultation(consultationId, data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setIsEditConsultationModalOpen(false);
    } catch (err: any) {
      console.error('Error updating consultation:', err);
      setError(err.message);
    }
  };

  const handleUpdateConsultationStatus = async (status: ConsultationStatus) => {
    if (!consultationId) return;
    
    try {
      const { error } = await ConsultationAPI.updateConsultationStatus(consultationId, status, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error updating consultation status:', err);
      setError(err.message);
    }
  };

  // Diagnosis operations
  const handleAddDiagnosis = async (data: NewDbDiagnosis) => {
    try {
      const { error } = await DiagnosesAPI.addDiagnosis(data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setIsAddDiagnosisModalOpen(false);
    } catch (err: any) {
      console.error('Error adding diagnosis:', err);
      setError(err.message);
    }
  };

  const handleUpdateDiagnosis = async (data: UpdateDbDiagnosis) => {
    if (!editingDiagnosis) return;
    
    try {
      const { error } = await DiagnosesAPI.updateDiagnosis(editingDiagnosis.id, data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setEditingDiagnosis(null);
    } catch (err: any) {
      console.error('Error updating diagnosis:', err);
      setError(err.message);
    }
  };

  const handleDeleteDiagnosis = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this diagnosis?', 'இந்த நோயறிதலை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const { error } = await DiagnosesAPI.deleteDiagnosis(id, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error deleting diagnosis:', err);
      setError(err.message);
    }
  };

  const handleSetPrimaryDiagnosis = async (diagnosisId: string) => {
    if (!consultationId) return;
    
    try {
      const { error } = await DiagnosesAPI.setPrimaryDiagnosis(diagnosisId, consultationId, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error setting primary diagnosis:', err);
      setError(err.message);
    }
  };

  // Clinical notes operations
  const handleUpdateClinicalNotes = async (data: NewDbClinicalNote | UpdateDbClinicalNote) => {
    try {
      if (clinicalNote) {
        // Update existing notes
        const { error } = await ClinicalNotesAPI.updateClinicalNotes(clinicalNote.id, data, user.id);
        if (error) throw error;
      } else {
        // Create new notes
        const { error } = await ClinicalNotesAPI.addClinicalNotes(data as NewDbClinicalNote, user.id);
        if (error) throw error;
      }
      
      fetchConsultationData();
      setIsEditClinicalNotesModalOpen(false);
    } catch (err: any) {
      console.error('Error updating clinical notes:', err);
      setError(err.message);
    }
  };

  // Vital signs operations
  const handleUpdateVitalSigns = async (data: NewDbVitalSigns | UpdateDbVitalSigns) => {
    try {
      if (vitalSigns) {
        // Update existing vital signs
        const { error } = await VitalSignsAPI.updateVitalSigns(vitalSigns.id, data, user.id);
        if (error) throw error;
      } else {
        // Create new vital signs
        const { error } = await VitalSignsAPI.addVitalSigns(data as NewDbVitalSigns, user.id);
        if (error) throw error;
      }
      
      fetchConsultationData();
      setIsEditVitalSignsModalOpen(false);
    } catch (err: any) {
      console.error('Error updating vital signs:', err);
      setError(err.message);
    }
  };

  // Treatment operations
  const handleAddTreatment = async (data: NewDbTreatment) => {
    try {
      const { error } = await TreatmentsAPI.addTreatment(data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setIsAddTreatmentModalOpen(false);
    } catch (err: any) {
      console.error('Error adding treatment:', err);
      setError(err.message);
    }
  };

  const handleUpdateTreatment = async (data: UpdateDbTreatment) => {
    if (!editingTreatment) return;
    
    try {
      const { error } = await TreatmentsAPI.updateTreatment(editingTreatment.id, data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setEditingTreatment(null);
    } catch (err: any) {
      console.error('Error updating treatment:', err);
      setError(err.message);
    }
  };

  const handleDeleteTreatment = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this treatment?', 'இந்த சிகிச்சையை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const { error } = await TreatmentsAPI.deleteTreatment(id, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error deleting treatment:', err);
      setError(err.message);
    }
  };

  // Prescription operations
  const handleAddPrescription = async (data: NewDbPrescription) => {
    try {
      const { error } = await PrescriptionsAPI.addPrescription(data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setIsAddPrescriptionModalOpen(false);
    } catch (err: any) {
      console.error('Error adding prescription:', err);
      setError(err.message);
    }
  };

  const handleUpdatePrescription = async (data: UpdateDbPrescription) => {
    if (!editingPrescription) return;
    
    try {
      const { error } = await PrescriptionsAPI.updatePrescription(editingPrescription.id, data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setEditingPrescription(null);
    } catch (err: any) {
      console.error('Error updating prescription:', err);
      setError(err.message);
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this prescription?', 'இந்த மருந்து சீட்டை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const { error } = await PrescriptionsAPI.deletePrescription(id, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error deleting prescription:', err);
      setError(err.message);
    }
  };

  // Referral operations
  const handleAddReferral = async (data: NewDbReferral) => {
    try {
      const { error } = await ReferralsAPI.addReferral(data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setIsAddReferralModalOpen(false);
    } catch (err: any) {
      console.error('Error adding referral:', err);
      setError(err.message);
    }
  };

  const handleUpdateReferral = async (data: UpdateDbReferral) => {
    if (!editingReferral) return;
    
    try {
      const { error } = await ReferralsAPI.updateReferral(editingReferral.id, data, user.id);
      if (error) throw error;
      
      fetchConsultationData();
      setEditingReferral(null);
    } catch (err: any) {
      console.error('Error updating referral:', err);
      setError(err.message);
    }
  };

  const handleDeleteReferral = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this referral?', 'இந்த பரிந்துரையை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const { error } = await ReferralsAPI.deleteReferral(id, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error deleting referral:', err);
      setError(err.message);
    }
  };

  // Document operations
  const handleUploadDocument = async (
    data: Omit<NewDbConsultationDocument, 'file_name' | 'file_path'>, 
    file: File
  ) => {
    if (!consultationId || !consultation?.patientId) return;
    
    try {
      const { error } = await ConsultationDocumentsAPI.uploadConsultationDocument(
        data,
        file,
        consultationId,
        consultation.patientId,
        user.id
      );
      if (error) throw error;
      
      fetchConsultationData();
      setIsUploadDocumentModalOpen(false);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm(getBilingualLabel('Are you sure you want to delete this document?', 'இந்த ஆவணத்தை நீக்க விரும்புகிறீர்களா?'))) return;
    
    try {
      const { error } = await ConsultationDocumentsAPI.deleteConsultationDocument(id, user.id);
      if (error) throw error;
      
      fetchConsultationData();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.message);
    }
  };

  // Generate reports
  const handleGenerateConsultationSummary = async () => {
    if (!consultationId) return;
    
    try {
      const { data, error } = await ConsultationAPI.generateConsultationSummary(consultationId, user.id);
      if (error) throw error;
      
      // In a real app, you would generate a PDF or display a printable view
      console.log('Consultation summary:', data);
      
      // For now, just open the print dialog
      window.print();
    } catch (err: any) {
      console.error('Error generating consultation summary:', err);
      setError(err.message);
    }
  };

  const handleGeneratePrescription = async (prescriptionId: string) => {
    try {
      const { data, error } = await PrescriptionsAPI.generatePrescriptionDocument(prescriptionId, user.id);
      if (error) throw error;
      
      // In a real app, you would generate a PDF or display a printable view
      console.log('Prescription document:', data);
      
      // For now, just open the print dialog
      window.print();
    } catch (err: any) {
      console.error('Error generating prescription:', err);
      setError(err.message);
    }
  };

  const handleGenerateReferralLetter = async (referralId: string) => {
    try {
      const { data, error } = await ReferralsAPI.generateReferralLetter(referralId, user.id);
      if (error) throw error;
      
      // In a real app, you would generate a PDF or display a printable view
      console.log('Referral letter:', data);
      
      // For now, just open the print dialog
      window.print();
    } catch (err: any) {
      console.error('Error generating referral letter:', err);
      setError(err.message);
    }
  };

  const handleGenerateMedicalCertificate = async () => {
    if (!consultationId) return;
    
    // Get start and end dates from user
    const startDate = prompt(getBilingualLabel('Enter start date (YYYY-MM-DD):', 'தொடக்க தேதியை உள்ளிடவும் (YYYY-MM-DD):'), consultation?.consultationDate);
    if (!startDate) return;
    
    const endDate = prompt(getBilingualLabel('Enter end date (YYYY-MM-DD):', 'முடிவு தேதியை உள்ளிடவும் (YYYY-MM-DD):'), startDate);
    if (!endDate) return;
    
    const reason = prompt(getBilingualLabel('Enter reason for medical certificate:', 'மருத்துவ சான்றிதழுக்கான காரணத்தை உள்ளிடவும்:'), '');
    if (reason === null) return;
    
    try {
      const { data, error } = await ConsultationDocumentsAPI.generateMedicalCertificate(
        consultationId,
        user.id,
        startDate,
        endDate,
        reason
      );
      if (error) throw error;
      
      // In a real app, you would generate a PDF or display a printable view
      console.log('Medical certificate:', data);
      
      // For now, just open the print dialog
      window.print();
    } catch (err: any) {
      console.error('Error generating medical certificate:', err);
      setError(err.message);
    }
  };

  // Schedule follow-up
  const handleScheduleFollowUp = async () => {
    if (!consultationId) return;
    
    // Get follow-up date from user
    const followUpDate = prompt(getBilingualLabel('Enter follow-up date (YYYY-MM-DD):', 'பின்தொடர்தல் தேதியை உள்ளிடவும் (YYYY-MM-DD):'));
    if (!followUpDate) return;
    
    const followUpNotes = prompt(getBilingualLabel('Enter follow-up notes:', 'பின்தொடர்தல் குறிப்புகளை உள்ளிடவும்:'), '');
    if (followUpNotes === null) return;
    
    try {
      const { data, error } = await ConsultationAPI.scheduleFollowUp(
        consultationId,
        followUpDate,
        followUpNotes,
        user.id
      );
      if (error) throw error;
      
      fetchConsultationData();
      alert(getBilingualLabel('Follow-up appointment scheduled successfully!', 'பின்தொடர்தல் சந்திப்பு வெற்றிகரமாக திட்டமிடப்பட்டது!'));
    } catch (err: any) {
      console.error('Error scheduling follow-up:', err);
      setError(err.message);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: ConsultationStatus) => {
    switch (status) {
      case ConsultationStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case ConsultationStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case ConsultationStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ConsultationStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <MainLayout
        user={user}
        onLogout={onLogout}
        currentPage="consultations"
        breadcrumbs={[
          { label: getBilingualLabel('Consultations', 'ஆலோசனைகள்'), href: '/consultations' },
          { label: getBilingualLabel('Consultation Details', 'ஆலோசனை விவரங்கள்') }
        ]}
        isLoading={true}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
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
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Error", "பிழை")}</p>
          <p>{error}</p>
          <div className="mt-4">
            <Button onClick={() => navigate('/consultations')} variant="secondary">
              {getBilingualLabel("Back to Consultations", "ஆலோசனைகளுக்குத் திரும்பு")}
            </Button>
          </div>
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
        breadcrumbs={[
          { label: getBilingualLabel('Consultations', 'ஆலோசனைகள்'), href: '/consultations' },
          { label: getBilingualLabel('Consultation Details', 'ஆலோசனை விவரங்கள்') }
        ]}
      >
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow" role="alert">
          <p className="font-bold">{getBilingualLabel("Consultation Not Found", "ஆலோசனை கிடைக்கவில்லை")}</p>
          <p>{getBilingualLabel("The requested consultation could not be found.", "கோரப்பட்ட ஆலோசனை கண்டுபிடிக்க முடியவில்லை.")}</p>
          <div className="mt-4">
            <Button onClick={() => navigate('/consultations')} variant="secondary">
              {getBilingualLabel("Back to Consultations", "ஆலோசனைகளுக்குத் திரும்பு")}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const pageTitle = `${getBilingualLabel("Consultation", "ஆலோசனை")}: ${consultation.patientName} - ${consultation.consultationDate}`;

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
      <PrintablePageWrapper pageTitle={pageTitle} showConfidentialNotice={true}>
        <div id="consultation-details-printable-content" className="space-y-6">
          {/* Header with Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-800">{consultation.patientName}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(consultation.status)}`}>
                  {consultation.status}
                </span>
              </div>
              <p className="text-slate-600 mt-1">
                {getBilingualLabel("Consultation Date", "ஆலோசனை தேதி")}: {consultation.consultationDate} {consultation.consultationTime}
              </p>
              <p className="text-slate-600">
                {getBilingualLabel("Physician", "மருத்துவர்")}: {consultation.attendingPhysician}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                onClick={() => setIsEditConsultationModalOpen(true)}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {getBilingualLabel("Edit", "திருத்து")}
              </Button>
              
              {consultation.status === ConsultationStatus.SCHEDULED && (
                <Button
                  onClick={() => handleUpdateConsultationStatus(ConsultationStatus.IN_PROGRESS)}
                  variant="primary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {getBilingualLabel("Start Consultation", "ஆலோசனையைத் தொடங்கு")}
                </Button>
              )}
              
              {consultation.status === ConsultationStatus.IN_PROGRESS && (
                <Button
                  onClick={() => handleUpdateConsultationStatus(ConsultationStatus.COMPLETED)}
                  variant="success"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {getBilingualLabel("Complete Consultation", "ஆலோசனையை முடிக்கவும்")}
                </Button>
              )}
              
              {(consultation.status === ConsultationStatus.SCHEDULED || consultation.status === ConsultationStatus.IN_PROGRESS) && (
                <Button
                  onClick={() => handleUpdateConsultationStatus(ConsultationStatus.CANCELLED)}
                  variant="danger"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {getBilingualLabel("Cancel", "ரத்துசெய்")}
                </Button>
              )}
              
              <Button
                onClick={handleScheduleFollowUp}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {getBilingualLabel("Schedule Follow-up", "பின்தொடர்தலை திட்டமிடு")}
              </Button>
              
              <PrintExportButton
                targetId="consultation-details-printable-content"
                filename={`Consultation_${consultation.patientName.replace(/\s+/g, '_')}_${consultation.consultationDate}.pdf`}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
          
          {/* Chief Complaint */}
          <div className="bg-white p-6 rounded-lg shadow-md print:border print:border-black">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {getBilingualLabel("Chief Complaint", "முதன்மை புகார்")}
            </h3>
            <p className="text-slate-700">{consultation.chiefComplaint}</p>
          </div>
          
          {/* Follow-up Information */}
          {consultation.followUpDate && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 print:border print:border-black">
              <h3 className="text-md font-semibold text-blue-800 mb-2">
                {getBilingualLabel("Follow-up Information", "பின்தொடர்தல் தகவல்")}
              </h3>
              <p className="text-blue-700">
                <span className="font-medium">{getBilingualLabel("Date", "தேதி")}:</span> {consultation.followUpDate}
              </p>
              {consultation.followUpNotes && (
                <p className="text-blue-700 mt-1">
                  <span className="font-medium">{getBilingualLabel("Notes", "குறிப்புகள்")}:</span> {consultation.followUpNotes}
                </p>
              )}
            </div>
          )}
          
          {/* Vital Signs Section */}
          <CollapsibleSection
            title={getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}
            isExpanded={isVitalSignsExpanded}
            onToggle={() => setIsVitalSignsExpanded(!isVitalSignsExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Record patient's vital measurements", "நோயாளியின் உயிர் அளவீடுகளைப் பதிவுசெய்யவும்")}
              </p>
              <Button
                onClick={() => setIsEditVitalSignsModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {vitalSigns ? 
                  getBilingualLabel("Update Vital Signs", "உயிர் அறிகுறிகளைப் புதுப்பிக்கவும்") : 
                  getBilingualLabel("Record Vital Signs", "உயிர் அறிகுறிகளைப் பதிவுசெய்யவும்")
                }
              </Button>
            </div>
            
            {vitalSigns ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Temperature */}
                {vitalSigns.temperature !== null && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Temperature", "வெப்பநிலை")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.temperature} {vitalSigns.temperatureUnit}
                    </p>
                  </div>
                )}
                
                {/* Heart Rate */}
                {vitalSigns.heartRate !== null && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Heart Rate", "இதய துடிப்பு")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.heartRate} bpm
                    </p>
                  </div>
                )}
                
                {/* Blood Pressure */}
                {vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureDiastolic && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Blood Pressure", "இரத்த அழுத்தம்")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.bloodPressureSystolic}/{vitalSigns.bloodPressureDiastolic} mmHg
                    </p>
                  </div>
                )}
                
                {/* Respiratory Rate */}
                {vitalSigns.respiratoryRate && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Respiratory Rate", "சுவாச விகிதம்")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.respiratoryRate} breaths/min
                    </p>
                  </div>
                )}
                
                {/* Oxygen Saturation */}
                {vitalSigns.oxygenSaturation && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Oxygen Saturation", "ஆக்ஸிஜன் செறிவு")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.oxygenSaturation}%
                    </p>
                  </div>
                )}
                
                {/* Height */}
                {vitalSigns.height && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Height", "உயரம்")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.height} {vitalSigns.heightUnit}
                    </p>
                  </div>
                )}
                
                {/* Weight */}
                {vitalSigns.weight && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Weight", "எடை")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.weight} {vitalSigns.weightUnit}
                    </p>
                  </div>
                )}
                
                {/* BMI */}
                {vitalSigns.bmi && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("BMI", "உடல் நிறை குறியீடு")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.bmi}
                    </p>
                  </div>
                )}
                
                {/* Pain Score */}
                {vitalSigns.painScore !== null && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-500">{getBilingualLabel("Pain Score", "வலி மதிப்பெண்")}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {vitalSigns.painScore}/10
                    </p>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          vitalSigns.painScore <= 3 ? 'bg-green-500' : 
                          vitalSigns.painScore <= 6 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`} 
                        style={{ width: `${(vitalSigns.painScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No vital signs recorded for this consultation.", "இந்த ஆலோசனைக்கு உயிர் அறிகுறிகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Clinical Notes Section */}
          <CollapsibleSection
            title={getBilingualLabel("Clinical Notes (SOAP)", "மருத்துவக் குறிப்புகள் (SOAP)")}
            isExpanded={isClinicalNotesExpanded}
            onToggle={() => setIsClinicalNotesExpanded(!isClinicalNotesExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Document clinical findings and plan", "மருத்துவ கண்டுபிடிப்புகள் மற்றும் திட்டத்தை ஆவணப்படுத்தவும்")}
              </p>
              <Button
                onClick={() => setIsEditClinicalNotesModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {clinicalNote ? 
                  getBilingualLabel("Update Notes", "குறிப்புகளைப் புதுப்பிக்கவும்") : 
                  getBilingualLabel("Add Notes", "குறிப்புகளைச் சேர்")
                }
              </Button>
            </div>
            
            {clinicalNote ? (
              <div className="space-y-4">
                {/* Subjective */}
                {clinicalNote.subjective && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">
                      {getBilingualLabel("Subjective", "சப்ஜெக்டிவ்")}
                    </h4>
                    <p className="text-slate-700 whitespace-pre-line">{clinicalNote.subjective}</p>
                  </div>
                )}
                
                {/* Objective */}
                {clinicalNote.objective && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">
                      {getBilingualLabel("Objective", "ஆப்ஜெக்டிவ்")}
                    </h4>
                    <p className="text-slate-700 whitespace-pre-line">{clinicalNote.objective}</p>
                  </div>
                )}
                
                {/* Assessment */}
                {clinicalNote.assessment && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">
                      {getBilingualLabel("Assessment", "அசெஸ்மென்ட்")}
                    </h4>
                    <p className="text-slate-700 whitespace-pre-line">{clinicalNote.assessment}</p>
                  </div>
                )}
                
                {/* Plan */}
                {clinicalNote.plan && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-2">
                      {getBilingualLabel("Plan", "ப்ளான்")}
                    </h4>
                    <p className="text-slate-700 whitespace-pre-line">{clinicalNote.plan}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No clinical notes recorded for this consultation.", "இந்த ஆலோசனைக்கு மருத்துவக் குறிப்புகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Diagnoses Section */}
          <CollapsibleSection
            title={getBilingualLabel("Diagnoses", "நோயறிதல்கள்")}
            isExpanded={isDiagnosesExpanded}
            onToggle={() => setIsDiagnosesExpanded(!isDiagnosesExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Record diagnoses with ICD codes", "ICD குறியீடுகளுடன் நோயறிதல்களைப் பதிவுசெய்யவும்")}
              </p>
              <Button
                onClick={() => setIsAddDiagnosisModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {getBilingualLabel("Add Diagnosis", "நோயறிதலைச் சேர்")}
              </Button>
            </div>
            
            {diagnoses.length > 0 ? (
              <div className="space-y-4">
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
                        {getBilingualLabel("Type", "வகை")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {getBilingualLabel("Date", "தேதி")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider print:hidden">
                        {getBilingualLabel("Actions", "செயல்கள்")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {diagnoses.map((diagnosis) => (
                      <tr key={diagnosis.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {diagnosis.icdCode} <span className="text-xs text-slate-500">({diagnosis.icdVersion})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-slate-700">
                          {diagnosis.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {diagnosis.isPrimary ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {getBilingualLabel("Primary", "முதன்மை")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {getBilingualLabel("Secondary", "இரண்டாம் நிலை")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {diagnosis.diagnosisDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium print:hidden">
                          <div className="flex space-x-2">
                            {!diagnosis.isPrimary && (
                              <Button
                                onClick={() => handleSetPrimaryDiagnosis(diagnosis.id)}
                                variant="success"
                                size="sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </Button>
                            )}
                            <Button
                              onClick={() => setEditingDiagnosis(diagnosis)}
                              variant="secondary"
                              size="sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              onClick={() => handleDeleteDiagnosis(diagnosis.id)}
                              variant="danger"
                              size="sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
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
                  {getBilingualLabel("No diagnoses recorded for this consultation.", "இந்த ஆலோசனைக்கு நோயறிதல்கள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Treatments Section */}
          <CollapsibleSection
            title={getBilingualLabel("Treatments", "சிகிச்சைகள்")}
            isExpanded={isTreatmentsExpanded}
            onToggle={() => setIsTreatmentsExpanded(!isTreatmentsExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Record treatments and procedures", "சிகிச்சைகள் மற்றும் செயல்முறைகளைப் பதிவுசெய்யவும்")}
              </p>
              <Button
                onClick={() => setIsAddTreatmentModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {getBilingualLabel("Add Treatment", "சிகிச்சையைச் சேர்")}
              </Button>
            </div>
            
            {treatments.length > 0 ? (
              <div className="space-y-4">
                {treatments.map((treatment) => (
                  <div key={treatment.id} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">
                          {treatment.treatmentName}
                          {treatment.treatmentCode && (
                            <span className="ml-2 text-xs text-slate-500">({treatment.treatmentCode})</span>
                          )}
                        </h4>
                        {treatment.description && (
                          <p className="text-sm text-slate-600 mt-1">{treatment.description}</p>
                        )}
                        {treatment.instructions && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Instructions", "வழிமுறைகள்")}:</p>
                            <p className="text-sm text-slate-600">{treatment.instructions}</p>
                          </div>
                        )}
                        {treatment.duration && (
                          <p className="text-sm text-slate-600 mt-1">
                            {getBilingualLabel("Duration", "கால அளவு")}: {treatment.duration} {getBilingualLabel("minutes", "நிமிடங்கள்")}
                          </p>
                        )}
                        {treatment.followUpRequired && (
                          <p className="text-sm text-slate-600 mt-1">
                            {getBilingualLabel("Follow-up", "பின்தொடர்தல்")}: {treatment.followUpInterval} {getBilingualLabel("days", "நாட்கள்")}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 print:hidden">
                        <Button
                          onClick={() => setEditingTreatment(treatment)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => handleDeleteTreatment(treatment.id)}
                          variant="danger"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No treatments recorded for this consultation.", "இந்த ஆலோசனைக்கு சிகிச்சைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Prescriptions Section */}
          <CollapsibleSection
            title={getBilingualLabel("Prescriptions", "மருந்து சீட்டுகள்")}
            isExpanded={isPrescriptionsExpanded}
            onToggle={() => setIsPrescriptionsExpanded(!isPrescriptionsExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Manage medication prescriptions", "மருந்து சீட்டுகளை நிர்வகிக்கவும்")}
              </p>
              <Button
                onClick={() => setIsAddPrescriptionModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {getBilingualLabel("Add Prescription", "மருந்து சீட்டைச் சேர்")}
              </Button>
            </div>
            
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{prescription.medicationName}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {prescription.dosage}, {prescription.frequency}, {prescription.duration} {getBilingualLabel("days", "நாட்கள்")}
                        </p>
                        {prescription.route && (
                          <p className="text-sm text-slate-600 mt-1">
                            {getBilingualLabel("Route", "வழி")}: {prescription.route}
                          </p>
                        )}
                        {prescription.specialInstructions && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Special Instructions", "சிறப்பு வழிமுறைகள்")}:</p>
                            <p className="text-sm text-slate-600">{prescription.specialInstructions}</p>
                          </div>
                        )}
                        {prescription.isRefillable && (
                          <p className="text-sm text-slate-600 mt-1">
                            {getBilingualLabel("Refills", "மறுநிரப்புதல்கள்")}: {prescription.refillCount}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 print:hidden">
                        <Button
                          onClick={() => handleGeneratePrescription(prescription.id)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => setEditingPrescription(prescription)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => handleDeletePrescription(prescription.id)}
                          variant="danger"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No prescriptions recorded for this consultation.", "இந்த ஆலோசனைக்கு மருந்து சீட்டுகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Referrals Section */}
          <CollapsibleSection
            title={getBilingualLabel("Referrals", "பரிந்துரைகள்")}
            isExpanded={isReferralsExpanded}
            onToggle={() => setIsReferralsExpanded(!isReferralsExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Manage specialist referrals", "நிபுணர் பரிந்துரைகளை நிர்வகிக்கவும்")}
              </p>
              <Button
                onClick={() => setIsAddReferralModalOpen(true)}
                variant="primary"
                size="sm"
              >
                {getBilingualLabel("Add Referral", "பரிந்துரையைச் சேர்")}
              </Button>
            </div>
            
            {referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-slate-800">{referral.specialist}</h4>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            referral.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                            referral.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {referral.urgency}
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            referral.status === 'pending' ? 'bg-slate-100 text-slate-800' :
                            referral.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            referral.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {getBilingualLabel("Type", "வகை")}: {referral.referralType}
                        </p>
                        {referral.facility && (
                          <p className="text-sm text-slate-600 mt-1">
                            {getBilingualLabel("Facility", "வசதி")}: {referral.facility}
                          </p>
                        )}
                        <div className="mt-2">
                          <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Reason", "காரணம்")}:</p>
                          <p className="text-sm text-slate-600">{referral.reason}</p>
                        </div>
                        {referral.notes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-slate-700">{getBilingualLabel("Notes", "குறிப்புகள்")}:</p>
                            <p className="text-sm text-slate-600">{referral.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 print:hidden">
                        <Button
                          onClick={() => handleGenerateReferralLetter(referral.id)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => setEditingReferral(referral)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={() => handleDeleteReferral(referral.id)}
                          variant="danger"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No referrals recorded for this consultation.", "இந்த ஆலோசனைக்கு பரிந்துரைகள் எதுவும் பதிவு செய்யப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Documents Section */}
          <CollapsibleSection
            title={getBilingualLabel("Documents", "ஆவணங்கள்")}
            isExpanded={isDocumentsExpanded}
            onToggle={() => setIsDocumentsExpanded(!isDocumentsExpanded)}
          >
            <div className="flex justify-between items-center mb-4 print:hidden">
              <p className="text-sm text-slate-500">
                {getBilingualLabel("Manage clinical images and documents", "மருத்துவ படங்கள் மற்றும் ஆவணங்களை நிர்வகிக்கவும்")}
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsUploadDocumentModalOpen(true)}
                  variant="primary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
                </Button>
                <Button
                  onClick={handleGenerateMedicalCertificate}
                  variant="secondary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {getBilingualLabel("Generate Certificate", "சான்றிதழை உருவாக்கு")}
                </Button>
              </div>
            </div>
            
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((document) => (
                  <div key={document.id} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{document.documentType}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          <a 
                            href={document.filePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:underline"
                          >
                            {document.fileName}
                          </a>
                        </p>
                        {document.description && (
                          <p className="text-sm text-slate-600 mt-1">{document.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {getBilingualLabel("Uploaded", "பதிவேற்றப்பட்டது")}: {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="print:hidden">
                        <Button
                          onClick={() => handleDeleteDocument(document.id)}
                          variant="danger"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-lg text-center">
                <p className="text-slate-500">
                  {getBilingualLabel("No documents uploaded for this consultation.", "இந்த ஆலோசனைக்கு ஆவணங்கள் எதுவும் பதிவேற்றப்படவில்லை.")}
                </p>
              </div>
            )}
          </CollapsibleSection>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 print:hidden">
            <Button onClick={() => navigate('/consultations')} variant="secondary">
              {getBilingualLabel("Back to Consultations", "ஆலோசனைகளுக்குத் திரும்பு")}
            </Button>
            <PrintExportButton
              targetId="consultation-details-printable-content"
              filename={`Consultation_${consultation.patientName.replace(/\s+/g, '_')}_${consultation.consultationDate}.pdf`}
              variant="primary"
            />
          </div>
        </div>
      </PrintablePageWrapper>
      
      {/* Modals */}
      <Modal
        isOpen={isEditConsultationModalOpen}
        onClose={() => setIsEditConsultationModalOpen(false)}
        title={getBilingualLabel("Edit Consultation", "ஆலோசனையைத் திருத்து")}
      >
        <ConsultationForm
          consultation={consultation}
          patients={patients}
          onSubmit={handleUpdateConsultation}
          onCancel={() => setIsEditConsultationModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isAddDiagnosisModalOpen}
        onClose={() => setIsAddDiagnosisModalOpen(false)}
        title={getBilingualLabel("Add Diagnosis", "நோயறிதலைச் சேர்")}
      >
        <DiagnosisForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleAddDiagnosis}
          onCancel={() => setIsAddDiagnosisModalOpen(false)}
        />
      </Modal>
      
      {editingDiagnosis && (
        <Modal
          isOpen={!!editingDiagnosis}
          onClose={() => setEditingDiagnosis(null)}
          title={getBilingualLabel("Edit Diagnosis", "நோயறிதலைத் திருத்து")}
        >
          <DiagnosisForm
            diagnosis={editingDiagnosis}
            consultationId={consultationId!}
            patientId={consultation.patientId}
            onSubmit={handleUpdateDiagnosis}
            onCancel={() => setEditingDiagnosis(null)}
          />
        </Modal>
      )}
      
      <Modal
        isOpen={isEditClinicalNotesModalOpen}
        onClose={() => setIsEditClinicalNotesModalOpen(false)}
        title={getBilingualLabel("Clinical Notes", "மருத்துவக் குறிப்புகள்")}
      >
        <ClinicalNotesForm
          clinicalNote={clinicalNote}
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleUpdateClinicalNotes}
          onCancel={() => setIsEditClinicalNotesModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isEditVitalSignsModalOpen}
        onClose={() => setIsEditVitalSignsModalOpen(false)}
        title={getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}
      >
        <VitalSignsForm
          vitalSigns={vitalSigns}
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleUpdateVitalSigns}
          onCancel={() => setIsEditVitalSignsModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isAddTreatmentModalOpen}
        onClose={() => setIsAddTreatmentModalOpen(false)}
        title={getBilingualLabel("Add Treatment", "சிகிச்சையைச் சேர்")}
      >
        <TreatmentForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleAddTreatment}
          onCancel={() => setIsAddTreatmentModalOpen(false)}
        />
      </Modal>
      
      {editingTreatment && (
        <Modal
          isOpen={!!editingTreatment}
          onClose={() => setEditingTreatment(null)}
          title={getBilingualLabel("Edit Treatment", "சிகிச்சையைத் திருத்து")}
        >
          <TreatmentForm
            treatment={editingTreatment}
            consultationId={consultationId!}
            patientId={consultation.patientId}
            onSubmit={handleUpdateTreatment}
            onCancel={() => setEditingTreatment(null)}
          />
        </Modal>
      )}
      
      <Modal
        isOpen={isAddPrescriptionModalOpen}
        onClose={() => setIsAddPrescriptionModalOpen(false)}
        title={getBilingualLabel("Add Prescription", "மருந்து சீட்டைச் சேர்")}
      >
        <PrescriptionForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleAddPrescription}
          onCancel={() => setIsAddPrescriptionModalOpen(false)}
        />
      </Modal>
      
      {editingPrescription && (
        <Modal
          isOpen={!!editingPrescription}
          onClose={() => setEditingPrescription(null)}
          title={getBilingualLabel("Edit Prescription", "மருந்து சீட்டைத் திருத்து")}
        >
          <PrescriptionForm
            prescription={editingPrescription}
            consultationId={consultationId!}
            patientId={consultation.patientId}
            onSubmit={handleUpdatePrescription}
            onCancel={() => setEditingPrescription(null)}
          />
        </Modal>
      )}
      
      <Modal
        isOpen={isAddReferralModalOpen}
        onClose={() => setIsAddReferralModalOpen(false)}
        title={getBilingualLabel("Add Referral", "பரிந்துரையைச் சேர்")}
      >
        <ReferralForm
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleAddReferral}
          onCancel={() => setIsAddReferralModalOpen(false)}
        />
      </Modal>
      
      {editingReferral && (
        <Modal
          isOpen={!!editingReferral}
          onClose={() => setEditingReferral(null)}
          title={getBilingualLabel("Edit Referral", "பரிந்துரையைத் திருத்து")}
        >
          <ReferralForm
            referral={editingReferral}
            consultationId={consultationId!}
            patientId={consultation.patientId}
            onSubmit={handleUpdateReferral}
            onCancel={() => setEditingReferral(null)}
          />
        </Modal>
      )}
      
      <Modal
        isOpen={isUploadDocumentModalOpen}
        onClose={() => setIsUploadDocumentModalOpen(false)}
        title={getBilingualLabel("Upload Document", "ஆவணத்தைப் பதிவேற்று")}
      >
        <ConsultationDocumentUpload
          consultationId={consultationId!}
          patientId={consultation.patientId}
          onSubmit={handleUploadDocument}
          onCancel={() => setIsUploadDocumentModalOpen(false)}
        />
      </Modal>
    </MainLayout>
  );
};

export default ConsultationDetailsPage;