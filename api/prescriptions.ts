// api/prescriptions.ts - Prescription management API functions

import { supabase } from '../lib/supabase';
import { 
  DbPrescription, 
  NewDbPrescription, 
  UpdateDbPrescription 
} from '../types';

// Get prescriptions for a consultation
export const getPrescriptionsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('prescriptions')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
};

// Get prescriptions for a patient
export const getPrescriptionsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('prescriptions')
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

// Add a prescription
export const addPrescription = async (data: NewDbPrescription, userId: string) => {
  return supabase
    .from('prescriptions')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a prescription
export const updatePrescription = async (id: string, data: UpdateDbPrescription, userId: string) => {
  return supabase
    .from('prescriptions')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a prescription
export const deletePrescription = async (id: string, userId: string) => {
  return supabase
    .from('prescriptions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Get common medications
export const getCommonMedications = async (userId: string, limit: number = 10) => {
  return supabase
    .from('prescriptions')
    .select('medication_name, dosage, frequency, route')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
};

// Get active medications for a patient
export const getActivePatientMedications = async (patientId: string, userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate the date when each prescription would end based on start date and duration
  return supabase
    .from('prescriptions')
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
    .filter('consultations.consultation_date', 'gte', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 90 days
    .order('created_at', { ascending: false });
};

// Generate prescription document
export const generatePrescriptionDocument = async (prescriptionId: string, userId: string) => {
  try {
    // Get prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
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
      .eq('id', prescriptionId)
      .eq('user_id', userId)
      .single();
      
    if (prescriptionError) throw prescriptionError;
    
    // Format the prescription data for document generation
    const prescriptionData = {
      prescriptionId: prescription.id,
      patientName: prescription.patients?.name,
      patientDob: prescription.patients?.dob,
      patientGender: prescription.patients?.gender,
      consultationDate: prescription.consultations?.consultation_date,
      physician: prescription.consultations?.attending_physician,
      medicationName: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: `${prescription.duration} days`,
      route: prescription.route,
      quantity: prescription.quantity,
      specialInstructions: prescription.special_instructions,
      isRefillable: prescription.is_refillable,
      refillCount: prescription.refill_count,
      issueDate: new Date().toISOString().split('T')[0]
    };
    
    return { data: prescriptionData, error: null };
  } catch (error: any) {
    console.error('Error generating prescription document:', error);
    return { data: null, error };
  }
};

// Refill a prescription
export const refillPrescription = async (prescriptionId: string, userId: string) => {
  try {
    // Get the original prescription
    const { data: originalPrescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!originalPrescription) throw new Error('Prescription not found');
    
    // Check if refills are allowed
    if (!originalPrescription.is_refillable || originalPrescription.refill_count <= 0) {
      throw new Error('No refills remaining or refills not allowed');
    }
    
    // Create a new consultation for the refill
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        user_id: userId,
        patient_id: originalPrescription.patient_id,
        consultation_date: new Date().toISOString().split('T')[0],
        consultation_time: new Date().toTimeString().split(' ')[0],
        attending_physician: 'Dr.', // Should be replaced with actual physician name
        chief_complaint: `Prescription refill for ${originalPrescription.medication_name}`,
        status: 'completed'
      })
      .select()
      .single();
      
    if (consultationError) throw consultationError;
    
    // Create the refill prescription
    const { data: refillPrescription, error: refillError } = await supabase
      .from('prescriptions')
      .insert({
        user_id: userId,
        consultation_id: consultation.id,
        patient_id: originalPrescription.patient_id,
        medication_name: originalPrescription.medication_name,
        dosage: originalPrescription.dosage,
        frequency: originalPrescription.frequency,
        duration: originalPrescription.duration,
        quantity: originalPrescription.quantity,
        route: originalPrescription.route,
        special_instructions: originalPrescription.special_instructions,
        is_refillable: originalPrescription.is_refillable,
        refill_count: originalPrescription.refill_count - 1
      })
      .select()
      .single();
      
    if (refillError) throw refillError;
    
    // Update the original prescription's refill count
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({ refill_count: originalPrescription.refill_count - 1 })
      .eq('id', prescriptionId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
    
    return { data: refillPrescription, error: null };
  } catch (error: any) {
    console.error('Error refilling prescription:', error);
    return { data: null, error };
  }
};