// api/waitlist.ts - Waitlist management API functions

import { supabase } from '../lib/supabase';
import { DbWaitlistEntry, NewDbWaitlistEntry, UpdateDbWaitlistEntry } from '../types';

export const getWaitlistEntries = async (userId: string) => {
  return supabase
    .from('waitlist_entries')
    .select(`
      *,
      patients (
        name,
        contact_phone,
        contact_email,
        preferred_contact_method
      )
    `)
    .eq('user_id', userId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });
};

export const getWaitlistEntriesByStatus = async (userId: string, status: string) => {
  return supabase
    .from('waitlist_entries')
    .select(`
      *,
      patients (
        name,
        contact_phone,
        contact_email,
        preferred_contact_method
      )
    `)
    .eq('user_id', userId)
    .eq('status', status)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });
};

export const addWaitlistEntry = async (data: NewDbWaitlistEntry, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .insert({ ...data, user_id: userId })
    .select(`
      *,
      patients (
        name,
        contact_phone,
        contact_email,
        preferred_contact_method
      )
    `)
    .single();
};

export const updateWaitlistEntry = async (id: string, data: UpdateDbWaitlistEntry, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      patients (
        name,
        contact_phone,
        contact_email,
        preferred_contact_method
      )
    `)
    .single();
};

export const deleteWaitlistEntry = async (id: string, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
};

export const notifyWaitlistEntry = async (id: string, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .update({
      status: 'notified',
      notified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

export const convertWaitlistToAppointment = async (id: string, userId: string) => {
  return supabase
    .from('waitlist_entries')
    .update({
      status: 'converted'
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

export const getWaitlistStatistics = async (userId: string) => {
  try {
    const { data: activeCount, error: activeError } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (activeError) throw activeError;

    const { data: notifiedCount, error: notifiedError } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'notified');

    if (notifiedError) throw notifiedError;

    const { data: convertedCount, error: convertedError } = await supabase
      .from('waitlist_entries')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'converted');

    if (convertedError) throw convertedError;

    return {
      active: activeCount?.length || 0,
      notified: notifiedCount?.length || 0,
      converted: convertedCount?.length || 0,
      total: (activeCount?.length || 0) + (notifiedCount?.length || 0) + (convertedCount?.length || 0)
    };
  } catch (error: any) {
    console.error('Get waitlist statistics error:', error);
    throw new Error(`Failed to get waitlist statistics: ${error.message}`);
  }
};