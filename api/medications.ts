// src/api/medications.ts

import { supabase } from '../lib/supabase';
import { DbMedication, NewDbMedication, UpdateDbMedication } from '../types';

export const getMedicationsByPatientId = async (patientId: string, userId: string) => {
  return supabase.from('medications').select('*').eq('patient_id', patientId).eq('user_id', userId).order('start_date', { ascending: false });
};

export const addMedication = async (data: NewDbMedication, patientId: string, userId: string) => {
  return supabase.from('medications').insert({ ...data, patient_id: patientId, user_id: userId }).select().single();
};

export const updateMedication = async (id: string, data: UpdateDbMedication, userId: string) => {
  return supabase.from('medications').update(data).eq('id', id).eq('user_id', userId).select().single();
};

export const deleteMedication = async (id: string, userId: string) => {
  return supabase.from('medications').delete().eq('id', id).eq('user_id', userId);
};