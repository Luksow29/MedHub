// api/consultations.ts - Consultation management API functions

import { supabase } from '../lib/supabase';
import { 
  NewDbConsultation, 
  UpdateDbConsultation,
} from '../types';
import { ConsultationStatus } from '../types/consultation';

// Get all consultations with filtering
export const getAllConsultations = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: ConsultationStatus;
    patientId?: string;
  }
) => {
  let query = supabase
    .from('consultations')
    .select(`
      *,
      patients (
        id,
        name,
        dob,
        gender,
        contact_phone,
        contact_email
      )
    `)
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (filters?.startDate) {
    query = query.gte('consultation_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('consultation_date', filters.endDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  return query.order('consultation_date', { ascending: false });
};

// Get consultation by ID
export const getConsultationById = async (consultationId: string, userId: string) => {
  return supabase
    .from('consultations')
    .select(`
      *,
      patients (
        id,
        name,
        dob,
        gender,
        contact_phone,
        contact_email
      )
    `)
    .eq('id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .single();
};

// Create a new consultation
export const createConsultation = async (data: NewDbConsultation, userId: string) => {
  return supabase
    .from('consultations')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a consultation
export const updateConsultation = async (id: string, data: UpdateDbConsultation, userId: string) => {
  return supabase
    .from('consultations')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a consultation (soft delete)
export const deleteConsultation = async (id: string, userId: string) => {
  return supabase
    .from('consultations')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// NEW FUNCTION: Update only the status of a consultation
export const updateConsultationStatus = async (
  id: string,
  status: ConsultationStatus,
  userId: string
) => {
  return supabase
    .from('consultations')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// NEW FUNCTION: Schedule a follow-up for a consultation
export const scheduleFollowUp = async (
  consultationId: string,
  followUpDate: string,
  followUpNotes: string,
  userId: string
) => {
  return supabase
    .from('consultations')
    .update({
      follow_up_date: followUpDate,
      follow_up_notes: followUpNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', consultationId)
    .eq('user_id', userId)
    .select()
    .single();
};


// Create a consultation from an appointment
export const createConsultationFromAppointment = async (appointmentId: string, userId: string) => {
  try {
    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        date,
        time,
        reason,
        service_type,
        patients (
          id,
          name
        )
      `)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .single();
      
    if (appointmentError) throw appointmentError;
    if (!appointment) throw new Error('Appointment not found');
    
    // Create consultation
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        user_id: userId,
        patient_id: appointment.patient_id,
        appointment_id: appointmentId,
        consultation_date: appointment.date,
        consultation_time: appointment.time,
        attending_physician: 'Dr.', // Should be replaced with actual physician name
        chief_complaint: appointment.reason,
        status: ConsultationStatus.SCHEDULED
      })
      .select()
      .single();
      
    if (consultationError) throw consultationError;
    
    // Update appointment status
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)
      .eq('user_id', userId);
      
    return { data: consultation, error: null };
  } catch (error: any) {
    console.error('Error creating consultation from appointment:', error);
    return { data: null, error };
  }
};

// Get consultations for a patient
export const getConsultationsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('consultations')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('consultation_date', { ascending: false });
};

// Get consultation summary
export const getConsultationSummary = async (consultationId: string, userId: string) => {
  try {
    const { data, error } = await supabase.rpc('generate_consultation_summary', {
      consultation_id_param: consultationId,
      user_id_param: userId
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting consultation summary:', error);
    return { data: null, error };
  }
};

// Get patient consultation history
export const getPatientConsultationHistory = async (
  patientId: string,
  userId: string,
  limit: number = 10,
  offset: number = 0
) => {
  try {
    const { data, error } = await supabase.rpc('get_patient_consultation_history', {
      patient_id_param: patientId,
      user_id_param: userId,
      limit_param: limit,
      offset_param: offset
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting patient consultation history:', error);
    return { data: null, error };
  }
};

// Get consultation statistics
export const getConsultationStatistics = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [todayResult, monthResult, completedResult] = await Promise.all([
      // Today's consultations
      supabase
        .from('consultations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('consultation_date', today)
        .eq('is_deleted', false),
        
      // This month's consultations
      supabase
        .from('consultations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('consultation_date', firstDayOfMonth)
        .eq('is_deleted', false),
        
      // Completed consultations
      supabase
        .from('consultations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('is_deleted', false)
    ]);
    
    return {
      todayCount: todayResult.count || 0,
      thisMonthCount: monthResult.count || 0,
      completedCount: completedResult.count || 0
    };
  } catch (error: any) {
    console.error('Error getting consultation statistics:', error);
    return {
      todayCount: 0,
      thisMonthCount: 0,
      completedCount: 0
    };
  }
};
