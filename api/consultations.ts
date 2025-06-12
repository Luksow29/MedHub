// api/consultations.ts - Consultation management API functions

import { supabase } from '../lib/supabase';
import { 
  DbConsultation, 
  NewDbConsultation, 
  UpdateDbConsultation,
  ConsultationStatus
} from '../types/index';

// Get all consultations for a user with optional filtering
export const getAllConsultations = async (
  userId: string,
  filters?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
    status?: ConsultationStatus;
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
        contact_email,
        preferred_contact_method
      ),
      appointments (
        id,
        date,
        time,
        status
      )
    `)
    .eq('user_id', userId)
    .eq('is_deleted', false);

  // Apply filters if provided
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }
  
  if (filters?.startDate) {
    query = query.gte('consultation_date', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.lte('consultation_date', filters.endDate);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
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
        contact_email,
        preferred_contact_method
      ),
      appointments (
        id,
        date,
        time,
        status
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

// Update an existing consultation
export const updateConsultation = async (
  consultationId: string, 
  data: UpdateDbConsultation, 
  userId: string
) => {
  return supabase
    .from('consultations')
    .update(data)
    .eq('id', consultationId)
    .eq('user_id', userId)
    .select()
    .single();
};

// Soft delete a consultation
export const deleteConsultation = async (consultationId: string, userId: string) => {
  return supabase
    .from('consultations')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', consultationId)
    .eq('user_id', userId);
};

// Get today's consultations
export const getTodaysConsultations = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
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
        contact_email,
        preferred_contact_method
      )
    `)
    .eq('user_id', userId)
    .eq('consultation_date', today)
    .eq('is_deleted', false)
    .order('consultation_time', { ascending: true });
};

// Get upcoming consultations
export const getUpcomingConsultations = async (userId: string, days: number = 7) => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
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
        contact_email,
        preferred_contact_method
      )
    `)
    .eq('user_id', userId)
    .gte('consultation_date', today)
    .lte('consultation_date', futureDateStr)
    .eq('is_deleted', false)
    .order('consultation_date', { ascending: true })
    .order('consultation_time', { ascending: true });
};

// Get consultation statistics
export const getConsultationStatistics = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const [todayResult, thisMonthResult, completedResult] = await Promise.all([
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
        .like('consultation_date', `${thisMonth}%`)
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
      thisMonthCount: thisMonthResult.count || 0,
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

// Generate consultation summary
export const generateConsultationSummary = async (consultationId: string, userId: string) => {
  return supabase.rpc('generate_consultation_summary', {
    consultation_id_param: consultationId,
    user_id_param: userId
  });
};

// Get patient consultation history
export const getPatientConsultationHistory = async (
  patientId: string, 
  userId: string,
  limit: number = 10,
  offset: number = 0
) => {
  return supabase.rpc('get_patient_consultation_history', {
    patient_id_param: patientId,
    user_id_param: userId,
    limit_param: limit,
    offset_param: offset
  });
};

// Create a consultation from an appointment
export const createConsultationFromAppointment = async (
  appointmentId: string, 
  userId: string
) => {
  try {
    // First get the appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        date,
        time,
        reason,
        status
      `)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .single();
      
    if (appointmentError) throw appointmentError;
    if (!appointment) throw new Error('Appointment not found');
    
    // Create the consultation
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        user_id: userId,
        patient_id: appointment.patient_id,
        appointment_id: appointmentId,
        consultation_date: appointment.date,
        consultation_time: appointment.time,
        attending_physician: 'Dr.', // This should be replaced with actual physician name
        chief_complaint: appointment.reason,
        status: 'scheduled'
      })
      .select()
      .single();
      
    if (consultationError) throw consultationError;
    
    // Update appointment status to confirmed
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

// Update consultation status
export const updateConsultationStatus = async (
  consultationId: string,
  status: ConsultationStatus,
  userId: string
) => {
  return supabase
    .from('consultations')
    .update({ status })
    .eq('id', consultationId)
    .eq('user_id', userId)
    .select()
    .single();
};

// Schedule follow-up appointment
export const scheduleFollowUp = async (
  consultationId: string,
  followUpDate: string,
  followUpNotes: string,
  userId: string
) => {
  try {
    // First update the consultation with follow-up details
    const { data: updatedConsultation, error: updateError } = await supabase
      .from('consultations')
      .update({
        follow_up_date: followUpDate,
        follow_up_notes: followUpNotes
      })
      .eq('id', consultationId)
      .eq('user_id', userId)
      .select(`
        id,
        patient_id,
        chief_complaint,
        attending_physician
      `)
      .single();
      
    if (updateError) throw updateError;
    if (!updatedConsultation) throw new Error('Consultation not found');
    
    // Create a follow-up appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        patient_id: updatedConsultation.patient_id,
        date: followUpDate,
        time: '09:00', // Default time, should be configurable
        reason: `Follow-up: ${updatedConsultation.chief_complaint}`,
        status: 'scheduled',
        service_type: 'follow_up',
        notes: followUpNotes
      })
      .select()
      .single();
      
    if (appointmentError) throw appointmentError;
    
    return { data: appointment, error: null };
  } catch (error: any) {
    console.error('Error scheduling follow-up:', error);
    return { data: null, error };
  }
};