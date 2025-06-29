// api/timeSlots.ts - Time slots management API functions

import { supabase } from '../lib/supabase';
import { DbTimeSlot, NewDbTimeSlot, UpdateDbTimeSlot } from '../types';

export const getTimeSlots = async (userId: string) => {
  return supabase
    .from('time_slots')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
};

export const getTimeSlotsForDay = async (userId: string, dayOfWeek: number) => {
  return supabase
    .from('time_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true });
};

export const addTimeSlot = async (data: NewDbTimeSlot, userId: string) => {
  return supabase
    .from('time_slots')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

export const updateTimeSlot = async (id: string, data: UpdateDbTimeSlot, userId: string) => {
  return supabase
    .from('time_slots')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

export const deleteTimeSlot = async (id: string, userId: string) => {
  return supabase
    .from('time_slots')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
};

export const toggleTimeSlotAvailability = async (id: string, isAvailable: boolean, userId: string) => {
  return supabase
    .from('time_slots')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Create default time slots for a new user
export const createDefaultTimeSlots = async (userId: string) => {
  const defaultSlots = [
    // Monday to Friday: 9 AM to 5 PM
    ...Array.from({ length: 5 }, (_, i) => ({
      day_of_week: i + 1, // 1 = Monday, 5 = Friday
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      buffer_time: 15,
      max_appointments: 1
    }))
  ];

  return supabase
    .from('time_slots')
    .insert(defaultSlots.map(slot => ({ ...slot, user_id: userId })))
    .select();
};

// Get available time slots for a specific date and duration
export const getAvailableTimeSlotsForDate = async (
  userId: string,
  date: string,
  duration: number = 30
) => {
  return supabase.rpc('get_available_time_slots', {
    p_appointment_date: date,
    p_user_id: userId,
    p_duration_minutes: duration
  });
};