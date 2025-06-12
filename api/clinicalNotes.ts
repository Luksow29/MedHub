// api/clinicalNotes.ts - Clinical notes management API functions

import { supabase } from '../lib/supabase';
import { 
  DbClinicalNote, 
  NewDbClinicalNote, 
  UpdateDbClinicalNote 
} from '../types';

// Get clinical notes for a consultation
export const getClinicalNotesByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('clinical_notes')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .single();
};

// Get clinical notes for a patient
export const getClinicalNotesByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('clinical_notes')
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

// Add clinical notes
export const addClinicalNotes = async (data: NewDbClinicalNote, userId: string) => {
  return supabase
    .from('clinical_notes')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update clinical notes
export const updateClinicalNotes = async (id: string, data: UpdateDbClinicalNote, userId: string) => {
  return supabase
    .from('clinical_notes')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete clinical notes
export const deleteClinicalNotes = async (id: string, userId: string) => {
  return supabase
    .from('clinical_notes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Get or create clinical notes for a consultation
export const getOrCreateClinicalNotes = async (
  consultationId: string,
  patientId: string,
  userId: string
) => {
  try {
    // First try to get existing notes
    const { data: existingNotes, error: fetchError } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('consultation_id', consultationId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();
      
    // If notes exist, return them
    if (existingNotes) {
      return { data: existingNotes, error: null };
    }
    
    // If no notes exist and there was no error (or just a not found error), create new notes
    if (!existingNotes && (fetchError?.code === 'PGRST116' || !fetchError)) {
      const { data: newNotes, error: createError } = await supabase
        .from('clinical_notes')
        .insert({
          user_id: userId,
          consultation_id: consultationId,
          patient_id: patientId,
          subjective: '',
          objective: '',
          assessment: '',
          plan: ''
        })
        .select()
        .single();
        
      if (createError) throw createError;
      return { data: newNotes, error: null };
    }
    
    // If there was a different error, throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    return { data: null, error: fetchError };
  } catch (error: any) {
    console.error('Error getting or creating clinical notes:', error);
    return { data: null, error };
  }
};

// Get clinical notes history for a patient
export const getPatientClinicalNotesHistory = async (
  patientId: string,
  userId: string,
  limit: number = 10,
  offset: number = 0
) => {
  return supabase
    .from('clinical_notes')
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
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
};