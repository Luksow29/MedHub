// api/vitalSigns.ts - Vital signs management API functions

import { supabase } from '../lib/supabase';
import {
  DbVitalSigns,
  NewDbVitalSigns,
  UpdateDbVitalSigns,
  VitalSign, // Client-side type
  TemperatureUnit, // types/consultation இலிருந்து இறக்குமதி செய்கிறோம்
  HeightUnit,
  WeightUnit,
} from '../types/consultation'; // types/consultation இலிருந்து வகைகளை இறக்குமதி செய்கிறோம்

// Map DbVitalSign to VitalSign (camelCase)
const mapDbVitalSignToClient = (dbVitalSign: DbVitalSigns): VitalSign => ({
  id: dbVitalSign.id,
  userId: dbVitalSign.user_id,
  consultationId: dbVitalSign.consultation_id,
  patientId: dbVitalSign.patient_id,
  // Ensure recorded_at is handled, as it might be null in DbVitalSigns if it's omitted in NewDbVitalSigns
  recordedAt: dbVitalSign.created_at, // `recorded_at` க்கு பதிலாக `created_at` ஐப் பயன்படுத்துகிறோம்
  temperature: dbVitalSign.temperature,
  temperatureUnit: dbVitalSign.temperature_unit,
  heartRate: dbVitalSign.heart_rate,
  respiratoryRate: dbVitalSign.respiratory_rate,
  bloodPressureSystolic: dbVitalSign.blood_pressure_systolic,
  bloodPressureDiastolic: dbVitalSign.blood_pressure_diastolic,
  oxygenSaturation: dbVitalSign.oxygen_saturation,
  height: dbVitalSign.height,
  heightUnit: dbVitalSign.height_unit,
  weight: dbVitalSign.weight,
  weightUnit: dbVitalSign.weight_unit,
  bmi: dbVitalSign.bmi,
  painScore: dbVitalSign.pain_score,
  notes: dbVitalSign.notes,
  createdAt: dbVitalSign.created_at,
  updatedAt: dbVitalSign.updated_at,
});


// Get vital signs for a specific consultation
// Postgres 406 பிழையை தவிர்க்க `single()` ஐ நீக்குகிறோம்
export const getVitalSignsByConsultationId = async (consultationId: string, userId: string) => {
  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false }) // `recorded_at` க்கு பதிலாக `created_at` ஐப் பயன்படுத்துகிறோம்
    .limit(1); // ஒரே ஒரு வரிசையை மட்டும் எடுக்க

  if (error) {
    console.error('Error fetching vital signs for consultation:', error);
    return { data: null, error };
  }
  // தரவு இருந்தால், முதல் உறுப்பை VitalSign ஆக மாற்றி வழங்குகிறோம்.
  // இல்லையென்றால், null ஐ வழங்குகிறோம்.
  return { data: data && data.length > 0 ? mapDbVitalSignToClient(data[0]) : null, error: null };
};

// Get vital signs history for a patient
export const getVitalSignsByPatientId = async (patientId: string, userId: string) => {
  const { data, error } = await supabase
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
    .order('created_at', { ascending: false }); // `recorded_at` க்கு பதிலாக `created_at` ஐப் பயன்படுத்துகிறோம்

  if (error) {
    console.error('Error fetching vital signs history for patient:', error);
    return { data: null, error };
  }
  // பல வரிசைகளை எதிர்பார்க்கிறோம், எனவே map செய்ய வேண்டும்
  return { data: data.map(mapDbVitalSignToClient), error: null };
};


// Add vital signs
export const addVitalSigns = async (data: NewDbVitalSigns, userId: string) => {
  // Calculate BMI if height and weight are provided
  let bmi = null;
  if (data.height && data.weight) {
    // Convert height to meters if in cm
    const heightInMeters = data.height_unit === HeightUnit.CM ? data.height / 100 : data.height * 0.0254;

    // Convert weight to kg if in lb
    const weightInKg = data.weight_unit === WeightUnit.KG ? data.weight : data.weight * 0.453592;

    // Calculate BMI
    if (heightInMeters > 0) { // Height must be greater than 0 to avoid division by zero
      bmi = weightInKg / (heightInMeters * heightInMeters);

      // Round to 2 decimal places
      bmi = Math.round(bmi * 100) / 100;
    }
  }

  const { data: newVitalSign, error } = await supabase
    .from('vital_signs')
    .insert({ ...data, bmi, user_id: userId })
    .select()
    .single(); // ஒரு புதிய வரிசை மட்டுமே உருவாக்கப்படும் என்பதால் single() சரியாக இருக்கும்

  if (error) {
    console.error('Error adding vital signs:', error);
    return { data: null, error };
  }
  return { data: mapDbVitalSignToClient(newVitalSign), error: null };
};

// Update vital signs
export const updateVitalSigns = async (id: string, data: UpdateDbVitalSigns, userId: string) => {
  // Recalculate BMI if height or weight is updated
  let bmi = null;

  if ((data.height !== undefined || data.weight !== undefined || data.height_unit !== undefined || data.weight_unit !== undefined)) {
    // Get current vital signs to get any missing values
    const { data: currentVitalSigns, error } = await supabase
      .from('vital_signs')
      .select('height, height_unit, weight, weight_unit, bmi')
      .eq('id', id)
      .eq('user_id', userId)
      .limit(1); // ஒரு குறிப்பிட்ட ID ஐ புதுப்பிப்பதால் limit(1) ஐப் பயன்படுத்துகிறோம்


    if (!error && currentVitalSigns && currentVitalSigns.length > 0) {
      const height = data.height !== undefined ? data.height : currentVitalSigns[0].height;
      const heightUnit = data.height_unit !== undefined ? data.height_unit : currentVitalSigns[0].height_unit;
      const weight = data.weight !== undefined ? data.weight : currentVitalSigns[0].weight;
      const weightUnit = data.weight_unit !== undefined ? data.weight_unit : currentVitalSigns[0].weight_unit;

      if (height && weight && height > 0 && weight > 0) { // height மற்றும் weight பூஜ்ஜியத்தை விட அதிகமாக இருப்பதை உறுதி செய்கிறோம்
        // Convert height to meters
        const heightInMeters = heightUnit === HeightUnit.CM ? height / 100 : height * 0.0254;

        // Convert weight to kg
        const weightInKg = weightUnit === WeightUnit.KG ? weight : weight * 0.453592;

        // Calculate BMI
        if (heightInMeters > 0) { // Height must be greater than 0 to avoid division by zero
          bmi = weightInKg / (heightInMeters * heightInMeters);

          // Round to 2 decimal places
          bmi = Math.round(bmi * 100) / 100;
        }
      }
    }
  }

  const { data: updatedVitalSign, error: updateError } = await supabase
    .from('vital_signs')
    .update({ ...data, bmi: bmi !== null ? bmi : undefined })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single(); // ஒரு குறிப்பிட்ட ID ஐ புதுப்பிப்பதால் single() சரியாக இருக்கும்

  if (updateError) {
    console.error('Error updating vital signs:', updateError);
    return { data: null, error: updateError };
  }
  return { data: mapDbVitalSignToClient(updatedVitalSign), error: null };
};

// Delete vital signs
export const deleteVitalSigns = async (id: string, userId: string) => {
  const { error } = await supabase
    .from('vital_signs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting vital signs:', error);
    return { success: false, error };
  }
  return { success: true, error: null };
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
      .limit(1); // ஒரே ஒரு வரிசையை மட்டும் எடுக்க

    let clientExistingVitalSigns: VitalSign | null = null;
    if (existingVitalSigns && existingVitalSigns.length > 0) {
      clientExistingVitalSigns = mapDbVitalSignToClient(existingVitalSigns[0]);
    }

    // If vital signs exist, return them
    if (clientExistingVitalSigns) {
      return { data: clientExistingVitalSigns, error: null };
    }

    // If no vital signs exist and there was no error (or just a not found error), create new vital signs
    // PGRST116 என்பது "JSON object requested, multiple (or no) rows returned" - அதாவது தரவு இல்லை.
    if (!clientExistingVitalSigns && (fetchError?.code === 'PGRST116' || !fetchError)) {
      // Get the most recent vital signs for this patient to pre-fill
      const { data: recentVitalSignsArr } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1); // ஒரே ஒரு சமீபத்திய பதிவை எடுக்க

      const recentVitalSigns = recentVitalSignsArr && recentVitalSignsArr.length > 0 ? recentVitalSignsArr[0] : null;

      // Create new vital signs, pre-filling with recent data if available
      const newVitalSignsData: NewDbVitalSigns = {
        patient_id: patientId,
        consultation_id: consultationId,
        // recorded_at: new Date().toISOString(), // இது DbVitalSigns இல் இருந்து நீக்கப்பட்டது
        height: recentVitalSigns?.height || null,
        height_unit: recentVitalSigns?.height_unit || HeightUnit.CM, // Enum மதிப்புகளைப் பயன்படுத்துகிறோம்
        weight: recentVitalSigns?.weight || null,
        weight_unit: recentVitalSigns?.weight_unit || WeightUnit.KG, // Enum மதிப்புகளைப் பயன்படுத்துகிறோம்
        temperature: null,
        temperature_unit: TemperatureUnit.CELSIUS, // Enum மதிப்புகளைப் பயன்படுத்துகிறோம்
        heart_rate: null,
        respiratory_rate: null,
        blood_pressure_systolic: null,
        blood_pressure_diastolic: null,
        oxygen_saturation: null,
        pain_score: null,
        notes: null,
      };

      const { data: newVitalSigns, error: createError } = await supabase
        .from('vital_signs')
        .insert(newVitalSignsData)
        .select()
        .single();

      if (createError) throw createError;
      return { data: mapDbVitalSignToClient(newVitalSigns), error: null };
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
