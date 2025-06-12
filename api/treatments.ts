// api/treatments.ts - Treatment management API functions

import { supabase } from '../lib/supabase';
import { 
  DbTreatment, 
  NewDbTreatment, 
  UpdateDbTreatment 
} from '../types';

// Get treatments for a consultation
export const getTreatmentsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('treatments')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
};

// Get treatments for a patient
export const getTreatmentsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('treatments')
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
    .order('created_at', { ascending: false });
};

// Add a treatment
export const addTreatment = async (data: NewDbTreatment, userId: string) => {
  return supabase
    .from('treatments')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a treatment
export const updateTreatment = async (id: string, data: UpdateDbTreatment, userId: string) => {
  return supabase
    .from('treatments')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a treatment
export const deleteTreatment = async (id: string, userId: string) => {
  return supabase
    .from('treatments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Get common treatments
export const getCommonTreatments = async (userId: string, limit: number = 10) => {
  return supabase
    .from('treatments')
    .select('treatment_code, treatment_name, description')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
};

// Get treatment history for a patient
export const getPatientTreatmentHistory = async (patientId: string, userId: string) => {
  return supabase
    .from('treatments')
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
    .order('created_at', { ascending: false });
};

// Get treatments that require follow-up
export const getTreatmentsRequiringFollowUp = async (userId: string) => {
  return supabase
    .from('treatments')
    .select(`
      *,
      consultations (
        id,
        consultation_date,
        consultation_time,
        attending_physician,
        chief_complaint,
        follow_up_date
      ),
      patients (
        id,
        name,
        contact_phone,
        contact_email,
        preferred_contact_method
      )
    `)
    .eq('user_id', userId)
    .eq('follow_up_required', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};