// src/api/patients.ts

import { supabase } from '../lib/supabase';
import { DbPatient, NewDbPatient, UpdateDbPatient } from '../types';

export const getPatientById = async (patientId: string, userId: string) => {
  return supabase.from('patients').select('*').eq('id', patientId).eq('user_id', userId).single();
};

export const createPatient = async (patientData: NewDbPatient, userId: string) => {
  return supabase.from('patients').insert({ ...patientData, user_id: userId }).select().single();
};

export const updatePatient = async (patientId: string, patientData: UpdateDbPatient, userId: string) => {
  return supabase.from('patients').update(patientData).eq('id', patientId).eq('user_id', userId).select().single();
};

export const deletePatient = async (patientId: string, userId: string) => {
  return supabase.from('patients').delete().eq('id', patientId).eq('user_id', userId);
};

export const getAllPatients = async (userId: string) => {
  return supabase.from('patients').select('*').eq('user_id', userId);
};