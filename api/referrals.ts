// api/referrals.ts - Referral management API functions

import { supabase } from '../lib/supabase';
import { 
  DbReferral, 
  NewDbReferral, 
  UpdateDbReferral,
  ReferralStatus,
  ReferralUrgency
} from '../types';

// Get referrals for a consultation
export const getReferralsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('referrals')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
};

// Get referrals for a patient
export const getReferralsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('referrals')
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

// Add a referral
export const addReferral = async (data: NewDbReferral, userId: string) => {
  return supabase
    .from('referrals')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a referral
export const updateReferral = async (id: string, data: UpdateDbReferral, userId: string) => {
  return supabase
    .from('referrals')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a referral
export const deleteReferral = async (id: string, userId: string) => {
  return supabase
    .from('referrals')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Update referral status
export const updateReferralStatus = async (
  id: string,
  status: ReferralStatus,
  userId: string,
  notes?: string
) => {
  const updateData: UpdateDbReferral = { status };
  if (notes) {
    updateData.notes = notes;
  }
  
  return supabase
    .from('referrals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Get pending referrals
export const getPendingReferrals = async (userId: string) => {
  return supabase
    .from('referrals')
    .select(`
      *,
      consultations (
        id,
        consultation_date,
        consultation_time,
        chief_complaint
      ),
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
    .eq('status', 'pending')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

// Generate referral letter
export const generateReferralLetter = async (referralId: string, userId: string) => {
  try {
    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select(`
        *,
        consultations (
          id,
          consultation_date,
          attending_physician,
          chief_complaint
        ),
        patients (
          id,
          name,
          dob,
          gender,
          contact_phone,
          contact_email,
          address
        )
      `)
      .eq('id', referralId)
      .eq('user_id', userId)
      .single();
      
    if (referralError) throw referralError;
    
    // Get diagnoses for the consultation
    const { data: diagnoses, error: diagnosesError } = await supabase
      .from('diagnoses')
      .select('icd_code, description, is_primary')
      .eq('consultation_id', referral.consultation_id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('is_primary', { ascending: false });
      
    if (diagnosesError) throw diagnosesError;
    
    // Get clinical notes for the consultation
    const { data: clinicalNotes, error: notesError } = await supabase
      .from('clinical_notes')
      .select('subjective, objective, assessment, plan')
      .eq('consultation_id', referral.consultation_id)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();
      
    // Format the referral data for letter generation
    const referralData = {
      referralId: referral.id,
      referralDate: new Date().toISOString().split('T')[0],
      patientName: referral.patients?.name,
      patientDob: referral.patients?.dob,
      patientGender: referral.patients?.gender,
      patientContact: referral.patients?.contact_phone,
      patientEmail: referral.patients?.contact_email,
      patientAddress: referral.patients?.address,
      consultationDate: referral.consultations?.consultation_date,
      referringPhysician: referral.consultations?.attending_physician,
      specialist: referral.specialist,
      facility: referral.facility,
      referralType: referral.referral_type,
      reason: referral.reason,
      urgency: referral.urgency,
      diagnoses: diagnoses || [],
      clinicalNotes: clinicalNotes || {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      },
      additionalNotes: referral.notes
    };
    
    return { data: referralData, error: null };
  } catch (error: any) {
    console.error('Error generating referral letter:', error);
    return { data: null, error };
  }
};