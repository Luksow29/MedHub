// api/diagnoses.ts - Diagnosis management API functions

import { supabase } from '../lib/supabase';
import { 
  DbDiagnosis, 
  NewDbDiagnosis, 
  UpdateDbDiagnosis,
  IcdCode
} from '../types';

// Get diagnoses for a consultation
export const getDiagnosesByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('diagnoses')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
};

// Get diagnoses for a patient
export const getDiagnosesByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('diagnoses')
    .select(`
      *,
      consultations (
        id,
        consultation_date,
        consultation_time,
        attending_physician
      )
    `)
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('diagnosis_date', { ascending: false });
};

// Add a diagnosis
export const addDiagnosis = async (data: NewDbDiagnosis, userId: string) => {
  return supabase
    .from('diagnoses')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a diagnosis
export const updateDiagnosis = async (id: string, data: UpdateDbDiagnosis, userId: string) => {
  return supabase
    .from('diagnoses')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a diagnosis
export const deleteDiagnosis = async (id: string, userId: string) => {
  return supabase
    .from('diagnoses')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Search ICD codes
export const searchIcdCodes = async (
  searchTerm: string,
  icdVersion?: string,
  limit: number = 50,
  offset: number = 0
) => {
  return supabase.rpc('search_icd_codes', {
    search_term: searchTerm,
    icd_version: icdVersion || null,
    limit_param: limit,
    offset_param: offset
  });
};

// Get ICD code by code and version
export const getIcdCodeByCode = async (code: string, version: string) => {
  return supabase
    .from('icd_codes')
    .select('*')
    .eq('code', code)
    .eq('version', version)
    .eq('is_active', true)
    .single();
};

// Get diagnosis statistics
export const getDiagnosisStatistics = async (
  userId: string,
  startDate?: string,
  endDate?: string
) => {
  return supabase.rpc('get_diagnosis_statistics', {
    user_id_param: userId,
    start_date: startDate || null,
    end_date: endDate || null
  });
};

// Set primary diagnosis
export const setPrimaryDiagnosis = async (
  diagnosisId: string,
  consultationId: string,
  userId: string
) => {
  try {
    // First, set all diagnoses for this consultation to non-primary
    const { error: resetError } = await supabase
      .from('diagnoses')
      .update({ is_primary: false })
      .eq('consultation_id', consultationId)
      .eq('user_id', userId);
      
    if (resetError) throw resetError;
    
    // Then set the selected diagnosis as primary
    const { data, error } = await supabase
      .from('diagnoses')
      .update({ is_primary: true })
      .eq('id', diagnosisId)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error setting primary diagnosis:', error);
    return { data: null, error };
  }
};

// Get common diagnoses for a user
export const getCommonDiagnoses = async (userId: string, limit: number = 10) => {
  return supabase
    .from('diagnoses')
    .select('icd_code, icd_version, description')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
};

// Get diagnosis history for a patient
export const getPatientDiagnosisHistory = async (patientId: string, userId: string) => {
  return supabase
    .from('diagnoses')
    .select(`
      *,
      consultations (
        id,
        consultation_date,
        consultation_time,
        attending_physician,
        chief_complaint
      )
    `)
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('diagnosis_date', { ascending: false });
};