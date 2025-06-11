// api/appointments.ts

import { supabase } from '../lib/supabase';
import { DbAppointment, NewDbAppointment, UpdateDbAppointment } from '../types';

export const getAllAppointments = async (userId: string) => {
  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .order('date', { ascending: true });
};

export const getAppointmentById = async (appointmentId: string, userId: string) => {
  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .single();
};

export const createAppointment = async (appointmentData: NewDbAppointment, userId: string) => {
  return supabase
    .from('appointments')
    .insert({ ...appointmentData, user_id: userId })
    .select()
    .single();
};

export const updateAppointment = async (appointmentId: string, appointmentData: UpdateDbAppointment, userId: string) => {
  return supabase
    .from('appointments')
    .update(appointmentData)
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .select()
    .single();
};

export const deleteAppointment = async (appointmentId: string, userId: string) => {
  return supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
    .eq('user_id', userId);
};