// src/api/allergies.ts

import { supabase } from '../lib/supabase';
import { DbAllergy, NewDbAllergy, UpdateDbAllergy } from '../types';

export const getAllergiesByPatientId = async (patientId: string, userId: string) => {
  return supabase.from('allergies').select('*').eq('patient_id', patientId).eq('user_id', userId).order('created_at', { ascending: false });
};

export const addAllergy = async (data: NewDbAllergy, patientId: string, userId: string) => {
  return supabase.from('allergies').insert({ ...data, patient_id: patientId, user_id: userId }).select().single();
};

export const updateAllergy = async (id: string, data: UpdateDbAllergy, userId: string) => {
  return supabase.from('allergies').update(data).eq('id', id).eq('user_id', userId).select().single();
};

export const deleteAllergy = async (id: string, userId: string) => {
  return supabase.from('allergies').delete().eq('id', id).eq('user_id', userId);
};