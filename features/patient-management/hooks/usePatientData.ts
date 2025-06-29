// features/patient-management/hooks/usePatientData.ts

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Patient, MedicalHistory, Medication, Allergy, InsuranceBilling, PatientDocument,
  DbPatient, DbMedicalHistory, DbMedication, DbAllergy, DbInsuranceBilling, DbPatientDocument
} from '../../../types';

// Mapping functions
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

const mapDbMedicalHistoryToClient = (dbHistory: DbMedicalHistory): MedicalHistory => ({
  id: dbHistory.id,
  patientId: dbHistory.patient_id,
  userId: dbHistory.user_id,
  diagnosisDate: dbHistory.diagnosis_date,
  conditionName: dbHistory.condition_name,
  notes: dbHistory.notes,
  createdAt: dbHistory.created_at,
  updatedAt: dbHistory.updated_at,
});

const mapDbMedicationToClient = (dbMedication: DbMedication): Medication => ({
  id: dbMedication.id,
  patientId: dbMedication.patient_id,
  userId: dbMedication.user_id,
  medicationName: dbMedication.medication_name,
  dosage: dbMedication.dosage,
  frequency: dbMedication.frequency,
  startDate: dbMedication.start_date,
  endDate: dbMedication.end_date,
  notes: dbMedication.notes,
  createdAt: dbMedication.created_at,
  updatedAt: dbMedication.updated_at,
});

const mapDbAllergyToClient = (dbAllergy: DbAllergy): Allergy => ({
  id: dbAllergy.id,
  patientId: dbAllergy.patient_id,
  userId: dbAllergy.user_id,
  allergenName: dbAllergy.allergen_name,
  reaction: dbAllergy.reaction,
  severity: dbAllergy.severity,
  notes: dbAllergy.notes,
  createdAt: dbAllergy.created_at,
  updatedAt: dbAllergy.updated_at,
});

const mapDbInsuranceBillingToClient = (dbInsurance: DbInsuranceBilling): InsuranceBilling => ({
  id: dbInsurance.id,
  patientId: dbInsurance.patient_id,
  userId: dbInsurance.user_id,
  insuranceProvider: dbInsurance.insurance_provider,
  policyNumber: dbInsurance.policy_number,
  groupNumber: dbInsurance.group_number,
  isPrimary: dbInsurance.is_primary,
  billingNotes: dbInsurance.billing_notes,
  createdAt: dbInsurance.created_at,
  updatedAt: dbInsurance.updated_at,
});

const mapDbPatientDocumentToClient = (dbDocument: DbPatientDocument): PatientDocument => ({
  id: dbDocument.id,
  patientId: dbDocument.patient_id,
  userId: dbDocument.user_id,
  documentType: dbDocument.document_type,
  fileName: dbDocument.file_name,
  filePath: dbDocument.file_path,
  notes: dbDocument.notes,
  uploadedAt: dbDocument.uploaded_at,
  createdAt: dbDocument.created_at,
  updatedAt: dbDocument.updated_at,
});

export const usePatientData = (patientId: string | undefined) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [insuranceBilling, setInsuranceBilling] = useState<InsuranceBilling[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("பயனர் அங்கீகரிக்கப்படவில்லை.");

      const userId = currentUser.data.user.id;

      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('user_id', userId)
        .single();

      if (patientError) throw patientError;
      setPatient(mapDbPatientToClient(patientData));

      // Fetch medical history
      const { data: historyData, error: historyError } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('diagnosis_date', { ascending: false });

      if (historyError) throw historyError;
      setMedicalHistory(historyData.map(mapDbMedicalHistoryToClient));

      // Fetch medications
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (medicationsError) throw medicationsError;
      setMedications(medicationsData.map(mapDbMedicationToClient));

      // Fetch allergies
      const { data: allergiesData, error: allergiesError } = await supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (allergiesError) throw allergiesError;
      setAllergies(allergiesData.map(mapDbAllergyToClient));

      // Fetch insurance billing
      const { data: insuranceData, error: insuranceError } = await supabase
        .from('insurance_billing')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (insuranceError) throw insuranceError;
      setInsuranceBilling(insuranceData.map(mapDbInsuranceBillingToClient));

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData.map(mapDbPatientDocumentToClient));

    } catch (err: any) {
      console.error('நோயாளர் தரவைப் பெறுவதில் பிழை:', err.message);
      setError('நோயாளர் தரவைப் பெற முடியவில்லை: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [patientId]);

  return {
    patient,
    medicalHistory,
    medications,
    allergies,
    insuranceBilling,
    documents,
    isLoading,
    error,
    refreshData,
    setError
  };
};