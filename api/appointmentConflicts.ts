// api/appointmentConflicts.ts - Appointment conflicts management API functions

import { supabase } from '../lib/supabase';
import { DbAppointmentConflict, NewDbAppointmentConflict, UpdateDbAppointmentConflict } from '../types';

export const getAppointmentConflicts = async (userId: string) => {
  return supabase
    .from('appointment_conflicts')
    .select(`
      *,
      appointment:appointments!appointment_id (
        id,
        date,
        time,
        duration,
        reason,
        patients (name)
      ),
      conflicting_appointment:appointments!conflicting_appointment_id (
        id,
        date,
        time,
        duration,
        reason,
        patients (name)
      )
    `)
    .eq('user_id', userId)
    .eq('resolved', false)
    .order('created_at', { ascending: false });
};

export const addAppointmentConflict = async (data: NewDbAppointmentConflict, userId: string) => {
  return supabase
    .from('appointment_conflicts')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

export const resolveAppointmentConflict = async (
  id: string,
  resolutionNotes: string,
  userId: string
) => {
  return supabase
    .from('appointment_conflicts')
    .update({
      resolved: true,
      resolution_notes: resolutionNotes
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

export const deleteAppointmentConflict = async (id: string, userId: string) => {
  return supabase
    .from('appointment_conflicts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
};

// Check for conflicts when creating or updating an appointment
export const checkForConflicts = async (
  userId: string,
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: string
) => {
  return supabase.rpc('check_appointment_conflicts', {
    p_appointment_date: date,
    p_appointment_time: time,
    p_duration_minutes: duration,
    p_user_id: userId,
    p_exclude_appointment_id: excludeAppointmentId || null
  });
};