// api/waitlist.ts - Waitlist management API

import { supabase } from '../lib/supabase';
import { 
  DbWaitlistEntry, 
  NewDbWaitlistEntry, 
  UpdateDbWaitlistEntry,
  WaitlistStatus,
  WaitlistEntry
} from '../types';

// Get all waitlist entries
export const getAllWaitlistEntries = async (
  userId: string,
  filters?: {
    status?: WaitlistStatus;
    serviceType?: string;
    patientId?: string;
  }
) => {
  let query = supabase
    .from('waitlist_entries')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.serviceType) {
    query = query.eq('service_type', filters.serviceType);
  }
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  return query.order('priority', { ascending: true }).order('created_at', { ascending: true });
};

// Get active waitlist entries
export const getActiveWaitlistEntries = async (userId: string) => {
  return supabase
    .from('waitlist_entries')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });
};

// Add patient to waitlist
export const addToWaitlist = async (
  waitlistData: NewDbWaitlistEntry,
  userId: string
) => {
  return supabase
    .from('waitlist_entries')
    .insert({ ...waitlistData, user_id: userId })
    .select()
    .single();
};

// Update waitlist entry
export const updateWaitlistEntry = async (
  entryId: string,
  updateData: UpdateDbWaitlistEntry,
  userId: string
) => {
  return supabase
    .from('waitlist_entries')
    .update(updateData)
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .single();
};

// Remove from waitlist
export const removeFromWaitlist = async (entryId: string, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);
};

// Notify waitlist entry
export const notifyWaitlistEntry = async (
  entryId: string,
  userId: string,
  expirationHours: number = 24
) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);

  return updateWaitlistEntry(
    entryId,
    {
      status: 'notified' as WaitlistStatus,
      notified_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    },
    userId
  );
};

// Convert waitlist entry to appointment
export const convertWaitlistToAppointment = async (
  entryId: string,
  appointmentDate: string,
  appointmentTime: string,
  userId: string
) => {
  try {
    // Get the waitlist entry
    const { data: waitlistEntry, error: fetchError } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        patient_id: waitlistEntry.patient_id,
        date: appointmentDate,
        time: appointmentTime,
        duration: 30, // Default duration
        reason: waitlistEntry.reason,
        service_type: waitlistEntry.service_type,
        status: 'scheduled',
        notes: `Converted from waitlist: ${waitlistEntry.notes || ''}`
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Update waitlist entry status
    await updateWaitlistEntry(
      entryId,
      { status: 'converted' as WaitlistStatus },
      userId
    );

    return { data: appointment, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Update waitlist priorities
export const updateWaitlistPriorities = async (
  priorityUpdates: { id: string; priority: number }[],
  userId: string
) => {
  try {
    const updates = priorityUpdates.map(update =>
      supabase
        .from('waitlist_entries')
        .update({ priority: update.priority })
        .eq('id', update.id)
        .eq('user_id', userId)
    );

    await Promise.all(updates);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get waitlist statistics
export const getWaitlistStatistics = async (userId: string) => {
  try {
    const [activeResult, notifiedResult, totalResult] = await Promise.all([
      supabase
        .from('waitlist_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active'),

      supabase
        .from('waitlist_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'notified'),

      supabase
        .from('waitlist_entries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
    ]);

    return {
      activeCount: activeResult.count || 0,
      notifiedCount: notifiedResult.count || 0,
      totalCount: totalResult.count || 0
    };
  } catch (error) {
    console.error('Error getting waitlist statistics:', error);
    return {
      activeCount: 0,
      notifiedCount: 0,
      totalCount: 0
    };
  }
};

// Find matching waitlist entries for available slot
export const findMatchingWaitlistEntries = async (
  userId: string,
  date: string,
  serviceType?: string
) => {
  let query = supabase
    .from('waitlist_entries')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .eq('status', 'active');

  // Match preferred date if specified
  if (date) {
    query = query.or(`preferred_date.is.null,preferred_date.eq.${date}`);
  }

  // Match service type if specified
  if (serviceType) {
    query = query.or(`service_type.is.null,service_type.eq.${serviceType}`);
  }

  return query
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(5); // Return top 5 matches
};

// Expire old notifications
export const expireOldNotifications = async (userId: string) => {
  const now = new Date().toISOString();

  return supabase
    .from('waitlist_entries')
    .update({ status: 'active' as WaitlistStatus })
    .eq('user_id', userId)
    .eq('status', 'notified')
    .lt('expires_at', now);
};

// Get waitlist entry by ID
export const getWaitlistEntryById = async (entryId: string, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();
};