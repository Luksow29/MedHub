// api/appointments.ts - Enhanced appointment management with scheduling features

import { supabase } from '../lib/supabase';
import { 
  DbAppointment, 
  NewDbAppointment, 
  UpdateDbAppointment, 
  AppointmentStatus,
  RecurrencePattern,
  ConflictCheck,
  CalendarEvent,
  Appointment
} from '../types';

// Get all appointments with enhanced filtering
export const getAllAppointments = async (
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    patientId?: string;
    serviceType?: string;
  }
) => {
  let query = supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId);

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }
  if (filters?.serviceType) {
    query = query.eq('service_type', filters.serviceType);
  }

  return query.order('date', { ascending: true }).order('time', { ascending: true });
};

// Get appointments for calendar view
export const getCalendarAppointments = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ data: CalendarEvent[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        time,
        duration,
        reason,
        service_type,
        status,
        patients (name)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .not('status', 'eq', 'cancelled');

    if (error) throw error;

    const events: CalendarEvent[] = (data || []).map(appointment => {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration * 60000));

      return {
        id: appointment.id,
        title: `${appointment.patients?.name || 'Unknown'} - ${appointment.reason}`,
        start: startDateTime,
        end: endDateTime,
        resource: appointment as any,
        className: `appointment-${appointment.status}`
      };
    });

    return { data: events, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Check for appointment conflicts
export const checkAppointmentConflicts = async (
  userId: string,
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ data: ConflictCheck | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('check_appointment_conflicts', {
      appointment_date: date,
      appointment_time: time,
      duration_minutes: duration,
      user_id_param: userId,
      exclude_appointment_id: excludeAppointmentId || null
    });

    if (error) throw error;

    const hasConflict = data && data.length > 0;
    const conflictingAppointments = data || [];

    // Get suggested times if there are conflicts
    let suggestedTimes: string[] = [];
    if (hasConflict) {
      const { data: suggestions, error: suggestError } = await supabase.rpc('get_available_time_slots', {
        appointment_date: date,
        user_id_param: userId,
        duration_minutes: duration
      });

      if (!suggestError && suggestions) {
        suggestedTimes = suggestions.slice(0, 5).map((slot: any) => slot.suggested_time);
      }
    }

    return {
      data: {
        hasConflict,
        conflictingAppointments,
        suggestedTimes
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

// Get available time slots for a specific date
export const getAvailableTimeSlots = async (
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

// Create appointment with conflict checking
export const createAppointment = async (
  appointmentData: NewDbAppointment,
  userId: string,
  skipConflictCheck: boolean = false
) => {
  try {
    // Check for conflicts first unless skipped
    if (!skipConflictCheck) {
      const conflictCheck = await checkAppointmentConflicts(
        userId,
        appointmentData.date,
        appointmentData.time,
        appointmentData.duration || 30
      );

      if (conflictCheck.data?.hasConflict) {
        return {
          data: null,
          error: {
            message: 'Appointment conflict detected',
            conflicts: conflictCheck.data.conflictingAppointments,
            suggestions: conflictCheck.data.suggestedTimes
          }
        };
      }
    }

    // Create the main appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointmentData, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    // If this is a recurring appointment, create the series
    if (appointmentData.is_recurring && appointmentData.recurrence_pattern !== 'none') {
      const recurringCount = await supabase.rpc('create_recurring_appointments', {
        parent_appointment_id: data.id,
        user_id_param: userId,
        patient_id_param: appointmentData.patient_id,
        start_date: appointmentData.date,
        start_time: appointmentData.time,
        duration_minutes: appointmentData.duration || 30,
        reason_text: appointmentData.reason,
        service_type_text: appointmentData.service_type,
        recurrence_pattern_text: appointmentData.recurrence_pattern,
        recurrence_interval_num: appointmentData.recurrence_interval || 1,
        recurrence_end_date_param: appointmentData.recurrence_end_date,
        recurrence_count_param: appointmentData.recurrence_count
      });

      if (recurringCount.error) {
        console.warn('Error creating recurring appointments:', recurringCount.error);
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Update appointment with conflict checking
export const updateAppointment = async (
  appointmentId: string,
  appointmentData: UpdateDbAppointment,
  userId: string,
  skipConflictCheck: boolean = false
) => {
  try {
    // Check for conflicts if date/time is being changed
    if (!skipConflictCheck && (appointmentData.date || appointmentData.time || appointmentData.duration)) {
      // Get current appointment data to fill in missing fields
      const { data: currentAppt } = await supabase
        .from('appointments')
        .select('date, time, duration')
        .eq('id', appointmentId)
        .eq('user_id', userId)
        .single();

      if (currentAppt) {
        const conflictCheck = await checkAppointmentConflicts(
          userId,
          appointmentData.date || currentAppt.date,
          appointmentData.time || currentAppt.time,
          appointmentData.duration || currentAppt.duration,
          appointmentId
        );

        if (conflictCheck.data?.hasConflict) {
          return {
            data: null,
            error: {
              message: 'Appointment conflict detected',
              conflicts: conflictCheck.data.conflictingAppointments,
              suggestions: conflictCheck.data.suggestedTimes
            }
          };
        }
      }
    }

    return supabase
      .from('appointments')
      .update(appointmentData)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();
  } catch (error) {
    return { data: null, error };
  }
};

// Cancel appointment and notify waitlist
export const cancelAppointment = async (
  appointmentId: string,
  userId: string,
  reason?: string
) => {
  const updateData: UpdateDbAppointment = {
    status: 'cancelled' as AppointmentStatus,
    notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
  };

  return updateAppointment(appointmentId, updateData, userId, true);
};

// Reschedule appointment
export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: string,
  newTime: string,
  userId: string,
  reason?: string
) => {
  const updateData: UpdateDbAppointment = {
    date: newDate,
    time: newTime,
    status: 'rescheduled' as AppointmentStatus,
    notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled'
  };

  return updateAppointment(appointmentId, updateData, userId);
};

// Complete appointment
export const completeAppointment = async (
  appointmentId: string,
  userId: string,
  notes?: string
) => {
  const updateData: UpdateDbAppointment = {
    status: 'completed' as AppointmentStatus,
    notes: notes || 'Completed'
  };

  return updateAppointment(appointmentId, updateData, userId, true);
};

// Mark as no-show
export const markNoShow = async (
  appointmentId: string,
  userId: string,
  notes?: string
) => {
  const updateData: UpdateDbAppointment = {
    status: 'no_show' as AppointmentStatus,
    notes: notes || 'No show'
  };

  return updateAppointment(appointmentId, updateData, userId, true);
};

// Get recurring appointment series
export const getRecurringAppointmentSeries = async (
  parentAppointmentId: string,
  userId: string
) => {
  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`)
    .order('date', { ascending: true });
};

// Update recurring appointment series
export const updateRecurringAppointmentSeries = async (
  parentAppointmentId: string,
  appointmentData: UpdateDbAppointment,
  userId: string,
  updateType: 'this_only' | 'this_and_future' | 'all' = 'all'
) => {
  try {
    let query = supabase
      .from('appointments')
      .update(appointmentData)
      .eq('user_id', userId);

    switch (updateType) {
      case 'this_only':
        query = query.eq('id', parentAppointmentId);
        break;
      case 'this_and_future':
        // Get the current appointment date first
        const { data: currentAppt } = await supabase
          .from('appointments')
          .select('date')
          .eq('id', parentAppointmentId)
          .single();
        
        if (currentAppt) {
          query = query
            .or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`)
            .gte('date', currentAppt.date);
        }
        break;
      case 'all':
      default:
        query = query.or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`);
        break;
    }

    return query.select();
  } catch (error) {
    return { data: null, error };
  }
};

// Delete appointment
export const deleteAppointment = async (appointmentId: string, userId: string) => {
  return supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
    .eq('user_id', userId);
};

// Delete recurring appointment series
export const deleteRecurringAppointmentSeries = async (
  parentAppointmentId: string,
  userId: string,
  deleteType: 'this_only' | 'this_and_future' | 'all' = 'all'
) => {
  try {
    let query = supabase
      .from('appointments')
      .delete()
      .eq('user_id', userId);

    switch (deleteType) {
      case 'this_only':
        query = query.eq('id', parentAppointmentId);
        break;
      case 'this_and_future':
        // Get the current appointment date first
        const { data: currentAppt } = await supabase
          .from('appointments')
          .select('date')
          .eq('id', parentAppointmentId)
          .single();
        
        if (currentAppt) {
          query = query
            .or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`)
            .gte('date', currentAppt.date);
        }
        break;
      case 'all':
      default:
        query = query.or(`id.eq.${parentAppointmentId},parent_appointment_id.eq.${parentAppointmentId}`);
        break;
    }

    return query;
  } catch (error) {
    return { data: null, error };
  }
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId: string, userId: string) => {
  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .single();
};

// Get appointments for today
export const getTodaysAppointments = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .eq('date', today)
    .not('status', 'eq', 'cancelled')
    .order('time', { ascending: true });
};

// Get upcoming appointments
export const getUpcomingAppointments = async (userId: string, days: number = 7) => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  return supabase
    .from('appointments')
    .select(`*, patients (name, contact_phone, contact_email, preferred_contact_method)`)
    .eq('user_id', userId)
    .gte('date', today)
    .lte('date', futureDateStr)
    .not('status', 'eq', 'cancelled')
    .order('date', { ascending: true })
    .order('time', { ascending: true });
};

// Get appointment statistics
export const getAppointmentStatistics = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const [todayResult, thisMonthResult, upcomingResult] = await Promise.all([
      // Today's appointments
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('date', today)
        .not('status', 'eq', 'cancelled'),

      // This month's appointments
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .like('date', `${thisMonth}%`)
        .not('status', 'eq', 'cancelled'),

      // Upcoming appointments (next 7 days)
      getUpcomingAppointments(userId, 7)
    ]);

    return {
      todayCount: todayResult.count || 0,
      thisMonthCount: thisMonthResult.count || 0,
      upcomingCount: upcomingResult.data?.length || 0
    };
  } catch (error) {
    console.error('Error getting appointment statistics:', error);
    return {
      todayCount: 0,
      thisMonthCount: 0,
      upcomingCount: 0
    };
  }
};