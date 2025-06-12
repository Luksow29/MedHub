// api/patientSearch.ts - Enhanced patient search and filtering API

import { supabase } from '../lib/supabase';
import { Patient, DbPatient } from '../types';

export interface SearchFilters {
  searchTerm?: string;
  gender?: string;
  preferredContactMethod?: string;
  ageRange?: { min?: number; max?: number };
  dateRange?: { start?: string; end?: string };
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  patients: Patient[];
  totalCount: number;
  hasMore: boolean;
}

// Map database patient to client patient
const mapDbPatientToClient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  userId: dbPatient.user_id,
  name: dbPatient.name,
  dob: dbPatient.dob,
  gender: dbPatient.gender,
  phone: dbPatient.contact_phone,
  email: dbPatient.contact_email,
  address: dbPatient.address,
  emergencyContactName: dbPatient.emergency_contact_name,
  emergencyContactPhone: dbPatient.emergency_contact_phone,
  preferredLanguage: dbPatient.preferred_language,
  preferredContactMethod: dbPatient.preferred_contact_method,
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
});

// Advanced patient search with filters
export const searchPatients = async (
  userId: string,
  filters: SearchFilters = {}
): Promise<SearchResult> => {
  try {
    const {
      searchTerm = '',
      gender,
      preferredContactMethod,
      ageRange,
      dateRange,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false'); // Exclude soft-deleted records

    // Apply search term filter
    if (searchTerm.trim()) {
      // Check if search term is a UUID (patient ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(searchTerm.trim())) {
        query = query.eq('id', searchTerm.trim());
      } else {
        query = query.or(`name.ilike.%${searchTerm}%,contact_phone.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`);
      }
    }

    // Apply gender filter
    if (gender) {
      query = query.eq('gender', gender);
    }

    // Apply preferred contact method filter
    if (preferredContactMethod) {
      query = query.eq('preferred_contact_method', preferredContactMethod);
    }

    // Apply age range filter (requires DOB calculation)
    if (ageRange?.min !== undefined || ageRange?.max !== undefined) {
      const today = new Date();
      
      if (ageRange.max !== undefined) {
        const minBirthDate = new Date(today.getFullYear() - ageRange.max - 1, today.getMonth(), today.getDate());
        query = query.gte('dob', minBirthDate.toISOString().split('T')[0]);
      }
      
      if (ageRange.min !== undefined) {
        const maxBirthDate = new Date(today.getFullYear() - ageRange.min, today.getMonth(), today.getDate());
        query = query.lte('dob', maxBirthDate.toISOString().split('T')[0]);
      }
    }

    // Apply date range filter
    if (dateRange?.start) {
      query = query.gte('created_at', dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte('created_at', dateRange.end);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const patients = (data || []).map(mapDbPatientToClient);
    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return {
      patients,
      totalCount,
      hasMore
    };
  } catch (error: any) {
    console.error('Patient search error:', error);
    throw new Error(`Failed to search patients: ${error.message}`);
  }
};

// Get patient by ID with full details
export const getPatientById = async (patientId: string, userId: string): Promise<Patient | null> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapDbPatientToClient(data);
  } catch (error: any) {
    console.error('Get patient by ID error:', error);
    throw new Error(`Failed to get patient: ${error.message}`);
  }
};

// Get patients with upcoming appointments
export const getPatientsWithUpcomingAppointments = async (userId: string, days: number = 7): Promise<Patient[]> => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        appointments!inner (
          date,
          time
        )
      `)
      .eq('user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .gte('appointments.date', new Date().toISOString().split('T')[0])
      .lte('appointments.date', futureDate.toISOString().split('T')[0]);

    if (error) throw error;

    return (data || []).map(mapDbPatientToClient);
  } catch (error: any) {
    console.error('Get patients with upcoming appointments error:', error);
    throw new Error(`Failed to get patients with upcoming appointments: ${error.message}`);
  }
};

// Get patient statistics
export const getPatientStatistics = async (userId: string) => {
  try {
    const { data: totalPatients, error: totalError } = await supabase
      .from('patients')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (totalError) throw totalError;

    const { data: newPatientsThisMonth, error: newError } = await supabase
      .from('patients')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (newError) throw newError;

    const { data: upcomingAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (appointmentError) throw appointmentError;

    return {
      totalPatients: totalPatients?.length || 0,
      newPatientsThisMonth: newPatientsThisMonth?.length || 0,
      upcomingAppointments: upcomingAppointments?.length || 0
    };
  } catch (error: any) {
    console.error('Get patient statistics error:', error);
    throw new Error(`Failed to get patient statistics: ${error.message}`);
  }
};