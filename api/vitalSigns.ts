// api/vitalSigns.ts - Vital signs management API functions

import { supabase } from '../lib/supabase';
import { 
  DbVitalSigns, 
  NewDbVitalSigns, 
  UpdateDbVitalSigns 
} from '../types';

// Get vital signs for a consultation
export const getVitalSignsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('vital_signs')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .single();
};

// Get vital signs history for a patient
export const getVitalSignsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('vital_signs')
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
    .order('created_at', { ascending: false });
};

// Add vital signs
export const addVitalSigns = async (data: NewDbVitalSigns, userId: string) => {
  // Calculate BMI if height and weight are provided
  let bmi = null;
  if (data.height && data.weight) {
    // Convert height to meters if in cm
    const heightInMeters = data.height_unit === 'cm' ? data.height / 100 : data.height * 0.0254;
    
    // Convert weight to kg if in lb
    const weightInKg = data.weight_unit === 'kg' ? data.weight : data.weight * 0.453592;
    
    // Calculate BMI
    bmi = weightInKg / (heightInMeters * heightInMeters);
    
    // Round to 2 decimal places
    bmi = Math.round(bmi * 100) / 100;
  }

  return supabase
    .from('vital_signs')
    .insert({ ...data, bmi, user_id: userId })
    .select()
    .single();
};

// Update vital signs
export const updateVitalSigns = async (id: string, data: UpdateDbVitalSigns, userId: string) => {
  // Recalculate BMI if height or weight is updated
  let bmi = null;
  
  if ((data.height !== undefined || data.weight !== undefined)) {
    // Get current vital signs to get any missing values
    const { data: currentVitalSigns, error } = await supabase
      .from('vital_signs')
      .select('height, height_unit, weight, weight_unit, bmi')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (!error && currentVitalSigns) {
      const height = data.height !== undefined ? data.height : currentVitalSigns.height;
      const heightUnit = data.height_unit !== undefined ? data.height_unit : currentVitalSigns.height_unit;
      const weight = data.weight !== undefined ? data.weight : currentVitalSigns.weight;
      const weightUnit = data.weight_unit !== undefined ? data.weight_unit : currentVitalSigns.weight_unit;
      
      if (height && weight) {
        // Convert height to meters
        const heightInMeters = heightUnit === 'cm' ? height / 100 : height * 0.0254;
        
        // Convert weight to kg
        const weightInKg = weightUnit === 'kg' ? weight : weight * 0.453592;
        
        // Calculate BMI
        bmi = weightInKg / (heightInMeters * heightInMeters);
        
        // Round to 2 decimal places
        bmi = Math.round(bmi * 100) / 100;
      }
    }
  }

  return supabase
    .from('vital_signs')
    .update({ ...data, bmi: bmi !== null ? bmi : undefined })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete vital signs
export const deleteVitalSigns = async (id: string, userId: string) => {
  return supabase
    .from('vital_signs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Get or create vital signs for a consultation
export const getOrCreateVitalSigns = async (
  consultationId: string,
  patientId: string,
  userId: string
) => {
  try {
    // First try to get existing vital signs
    const { data: existingVitalSigns, error: fetchError } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('consultation_id', consultationId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();
      
    // If vital signs exist, return them
    if (existingVitalSigns) {
      return { data: existingVitalSigns, error: null };
    }
    
    // If no vital signs exist and there was no error (or just a not found error), create new vital signs
    if (!existingVitalSigns && (fetchError?.code === 'PGRST116' || !fetchError)) {
      // Get the most recent vital signs for this patient to pre-fill
      const { data: recentVitalSigns } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      // Create new vital signs, pre-filling with recent data if available
      const newVitalSignsData = {
        user_id: userId,
        consultation_id: consultationId,
        patient_id: patientId,
        // Pre-fill with recent data or leave empty
        height: recentVitalSigns?.height || null,
        height_unit: recentVitalSigns?.height_unit || 'cm',
        weight: recentVitalSigns?.weight || null,
        weight_unit: recentVitalSigns?.weight_unit || 'kg',
        temperature: null,
        temperature_unit: 'Celsius',
        heart_rate: null,
        respiratory_rate: null,
        blood_pressure_systolic: null,
        blood_pressure_diastolic: null,
        oxygen_saturation: null,
        pain_score: null
      };
      
      const { data: newVitalSigns, error: createError } = await supabase
        .from('vital_signs')
        .insert(newVitalSignsData)
        .select()
        .single();
        
      if (createError) throw createError;
      return { data: newVitalSigns, error: null };
    }
    
    // If there was a different error, throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    return { data: null, error: fetchError };
  } catch (error: any) {
    console.error('Error getting or creating vital signs:', error);
    return { data: null, error };
  }
};

// Get vital signs trends for a patient
export const getVitalSignsTrends = async (patientId: string, userId: string, metric: string) => {
  try {
    const { data, error } = await supabase
      .from('vital_signs')
      .select(`
        id,
        ${metric},
        consultations (consultation_date)
      `)
      .eq('patient_id', patientId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Format data for charting
    const formattedData = data.map(record => ({
      date: record.consultations?.consultation_date,
      value: record[metric as keyof typeof record]
    })).filter(item => item.value !== null && item.date !== null);
    
    return { data: formattedData, error: null };
  } catch (error: any) {
    console.error(`Error getting ${metric} trends:`, error);
    return { data: null, error };
  }
};