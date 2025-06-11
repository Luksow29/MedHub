// src/api/medicalHistory.ts

import { supabase } from '../lib/supabase';
import { DbMedicalHistory, NewDbMedicalHistory, UpdateDbMedicalHistory } from '../types';

export const getMedicalHistoryByPatientId = async (patientId: string, userId: string) => {
  return supabase.from('medical_history').select('*').eq('patient_id', patientId).eq('user_id', userId).order('diagnosis_date', { ascending: false });
};

export const addMedicalHistory = async (data: NewDbMedicalHistory, patientId: string, userId: string) => {
  return supabase.from('medical_history').insert({ ...data, patient_id: patientId, user_id: userId }).select().single();
};

export const updateMedicalHistory = async (id: string, data: UpdateDbMedicalHistory, userId: string) => {
  return supabase.from('medical_history').update(data).eq('id', id).eq('user_id', userId).select().single();
};

export const deleteMedicalHistory = async (id: string, userId: string) => {
  return supabase.from('medical_history').delete().eq('id', id).eq('user_id', userId);
};