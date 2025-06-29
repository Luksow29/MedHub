// src/api/insuranceBilling.ts

import { supabase } from '../lib/supabase';
import { DbInsuranceBilling, NewDbInsuranceBilling, UpdateDbInsuranceBilling } from '../types';

export const getInsuranceBillingByPatientId = async (patientId: string, userId: string) => {
  return supabase.from('insurance_billing').select('*').eq('patient_id', patientId).eq('user_id', userId).order('created_at', { ascending: false });
};

export const addInsuranceBilling = async (data: NewDbInsuranceBilling, patientId: string, userId: string) => {
  return supabase.from('insurance_billing').insert({ ...data, patient_id: patientId, user_id: userId }).select().single();
};

export const updateInsuranceBilling = async (id: string, data: UpdateDbInsuranceBilling, userId: string) => {
  return supabase.from('insurance_billing').update(data).eq('id', id).eq('user_id', userId).select().single();
};

export const deleteInsuranceBilling = async (id: string, userId: string) => {
  return supabase.from('insurance_billing').delete().eq('id', id).eq('user_id', userId);
};