// api/timeSlots.ts - Time slot management API

import { supabase } from '../lib/supabase';
import { DbTimeSlot, NewDbTimeSlot, UpdateDbTimeSlot, TimeSlot } from '../types';

// Get all time slots for a user
export const getAllTimeSlots = async (userId: string) => {
  return supabase
    .from('time_slots')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
};

// Get time slots for a specific day
export const getTimeSlotsForDay = async (userId: string, dayOfWeek: number) => {
  return supabase
    .from('time_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)
    .order('start_time', { ascending: true });
};

// Create time slot
export const createTimeSlot = async (timeSlotData: NewDbTimeSlot, userId: string) => {
  return supabase
    .from('time_slots')
    .insert({ ...timeSlotData, user_id: userId })
    .select()
    .single();
};

// Update time slot
export const updateTimeSlot = async (
  timeSlotId: string,
  timeSlotData: UpdateDbTimeSlot,
  userId: string
) => {
  return supabase
    .from('time_slots')
    .update(timeSlotData)
    .eq('id', timeSlotId)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete time slot
export const deleteTimeSlot = async (timeSlotId: string, userId: string) => {
  return supabase
    .from('time_slots')
    .delete()
    .eq('id', timeSlotId)
    .eq('user_id', userId);
};

// Create default time slots for a user (Monday-Friday, 9 AM - 5 PM)
export const createDefaultTimeSlots = async (userId: string) => {
  const defaultSlots: NewDbTimeSlot[] = [];

  // Monday to Friday (1-5)
  for (let day = 1; day <= 5; day++) {
    defaultSlots.push({
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      buffer_time: 15,
      max_appointments: 1
    });
  }

  return supabase
    .from('time_slots')
    .insert(defaultSlots.map(slot => ({ ...slot, user_id: userId })))
    .select();
};

// Bulk update time slots
export const bulkUpdateTimeSlots = async (
  updates: { id: string; data: UpdateDbTimeSlot }[],
  userId: string
) => {
  try {
    const updatePromises = updates.map(update =>
      supabase
        .from('time_slots')
        .update(update.data)
        .eq('id', update.id)
        .eq('user_id', userId)
    );

    await Promise.all(updatePromises);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Toggle time slot availability
export const toggleTimeSlotAvailability = async (
  timeSlotId: string,
  userId: string
) => {
  // First get current availability
  const { data: currentSlot, error: fetchError } = await supabase
    .from('time_slots')
    .select('is_available')
    .eq('id', timeSlotId)
    .eq('user_id', userId)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  // Toggle availability
  return supabase
    .from('time_slots')
    .update({ is_available: !currentSlot.is_available })
    .eq('id', timeSlotId)
    .eq('user_id', userId)
    .select()
    .single();
};

// Get available time slots for a specific date
export const getAvailableTimeSlotsForDate = async (
  userId: string,
  date: string,
  duration: number = 30
) => {
  return supabase.rpc('get_available_time_slots', {
    appointment_date: date,
    user_id_param: userId,
    duration_minutes: duration
  });
};

// Check if time slot exists for day and time
export const checkTimeSlotExists = async (
  userId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
) => {
  return supabase
    .from('time_slots')
    .select('id')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .eq('start_time', startTime)
    .eq('end_time', endTime)
    .maybeSingle();
};

// Get time slot by ID
export const getTimeSlotById = async (timeSlotId: string, userId: string) => {
  return supabase
    .from('time_slots')
    .select('*')
    .eq('id', timeSlotId)
    .eq('user_id', userId)
    .single();
};