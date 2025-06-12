// components/AppointmentForm.tsx - Enhanced appointment form with scheduling features

import React, { useState, useEffect } from 'react';
import { 
  Appointment, 
  Patient, 
  NewDbAppointment, 
  UpdateDbAppointment,
  AppointmentStatus,
  RecurrencePattern,
  ConflictCheck
} from '../types';
import Button from './shared/Button';
import { formatDateToInput, formatTimeToInput } from '../utils/dateHelpers';
import { checkAppointmentConflicts, getAvailableTimeSlots } from '../api/appointments';
import { supabase } from '../lib/supabase';

interface AppointmentFormProps {
  appointment?: Appointment;
  patients: Patient[];
  onSubmit: (data: NewDbAppointment | UpdateDbAppointment) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit' | 'reschedule';
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  appointment, 
  patients, 
  onSubmit, 
  onCancel,
  mode = 'create'
}) => {
  // Basic appointment fields
  const [patientId, setPatientId] = useState(appointment?.patientId || (patients.length > 0 ? patients[0].id : ''));
  const [date, setDate] = useState(appointment?.date || formatDateToInput(new Date()));
  const [time, setTime] = useState(appointment?.time || formatTimeToInput(new Date()));
  const [duration, setDuration] = useState(appointment?.duration || 30);
  const [reason, setReason] = useState(appointment?.reason || '');
  const [serviceType, setServiceType] = useState(appointment?.serviceType || '');
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status || 'scheduled');
  const [notes, setNotes] = useState(appointment?.notes || '');

  // Recurring appointment fields
  const [isRecurring, setIsRecurring] = useState(appointment?.isRecurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(
    appointment?.recurrencePattern || 'none'
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(appointment?.recurrenceInterval || 1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(appointment?.recurrenceEndDate || '');
  const [recurrenceCount, setRecurrenceCount] = useState(appointment?.recurrenceCount || null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const serviceTypes = [
    { value: '', label: getBilingualLabel('Select Service', 'சேவையைத் தேர்ந்தெடுக்கவும்') },
    { value: 'consultation', label: getBilingualLabel('Consultation', 'ஆலோசனை') },
    { value: 'checkup', label: getBilingualLabel('Check-up', 'பரிசோதனை') },
    { value: 'follow_up', label: getBilingualLabel('Follow-up', 'பின்தொடர்தல்') },
    { value: 'procedure', label: getBilingualLabel('Procedure', 'செயல்முறை') },
    { value: 'emergency', label: getBilingualLabel('Emergency', 'அவசரம்') },
    { value: 'other', label: getBilingualLabel('Other', 'மற்றவை') }
  ];

  const statusOptions = [
    { value: 'scheduled', label: getBilingualLabel('Scheduled', 'திட்டமிடப்பட்டது') },
    { value: 'confirmed', label: getBilingualLabel('Confirmed', 'உறுதிப்படுத்தப்பட்டது') },
    { value: 'cancelled', label: getBilingualLabel('Cancelled', 'ரத்துசெய்யப்பட்டது') },
    { value: 'completed', label: getBilingualLabel('Completed', 'முடிக்கப்பட்டது') },
    { value: 'no_show', label: getBilingualLabel('No Show', 'வரவில்லை') },
    { value: 'rescheduled', label: getBilingualLabel('Rescheduled', 'மீண்டும் திட்டமிடப்பட்டது') }
  ];

  const recurrencePatterns = [
    { value: 'none', label: getBilingualLabel('No Recurrence', 'மீண்டும் இல்லை') },
    { value: 'daily', label: getBilingualLabel('Daily', 'தினசரி') },
    { value: 'weekly', label: getBilingualLabel('Weekly', 'வாராந்திர') },
    { value: 'monthly', label: getBilingualLabel('Monthly', 'மாதாந்திர') }
  ];

  // Check for conflicts when date/time/duration changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!date || !time || !patientId) return;

      try {
        const currentUser = await supabase.auth.getUser();
        if (!currentUser.data.user) return;

        const conflictResult = await checkAppointmentConflicts(
          currentUser.data.user.id,
          date,
          time,
          duration,
          appointment?.id
        );

        if (conflictResult.data) {
          setConflicts(conflictResult.data);
          setShowConflictWarning(conflictResult.data.hasConflict);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [date, time, duration, patientId, appointment?.id]);

  // Get available time slots when date changes
  useEffect(() => {
    const getSlots = async () => {
      if (!date) return;

      try {
        const currentUser = await supabase.auth.getUser();
        if (!currentUser.data.user) return;

        const slotsResult = await getAvailableTimeSlots(
          currentUser.data.user.id,
          date,
          duration
        );

        if (slotsResult.data) {
          setAvailableSlots(slotsResult.data.map((slot: any) => slot.suggested_time));
        }
      } catch (error) {
        console.error('Error getting available slots:', error);
      }
    };

    getSlots();
  }, [date, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      alert(getBilingualLabel("Please select a patient.", "தயவுசெய்து ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்."));
      return;
    }

    if (showConflictWarning && !window.confirm(
      getBilingualLabel(
        "There are scheduling conflicts. Do you want to proceed anyway?",
        "திட்டமிடல் முரண்பாடுகள் உள்ளன. எப்படியும் தொடர விரும்புகிறீர்களா?"
      )
    )) {
      return;
    }

    setIsLoading(true);

    try {
      const appointmentData: NewDbAppointment | UpdateDbAppointment = {
        patient_id: patientId,
        date,
        time,
        duration,
        reason,
        service_type: serviceType || null,
        status,
        notes: notes || null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : 'none',
        recurrence_interval: isRecurring ? recurrenceInterval : 1,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
        recurrence_count: isRecurring && recurrenceCount ? recurrenceCount : null,
        parent_appointment_id: appointment?.parentAppointmentId || null
      };

      await onSubmit(appointmentData);
    } catch (error) {
      console.error('Error submitting appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSlotSelect = (selectedTime: string) => {
    setTime(selectedTime);
    setShowConflictWarning(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <label htmlFor="patient" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Patient", "நோயாளி")}
        </label>
        <select
          id="patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="" disabled>
            {getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {patients.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            {getBilingualLabel("No patients available. Please add a patient first.", "நோயாளிகள் யாரும் இல்லை. முதலில் ஒரு நோயாளியைச் சேர்க்கவும்.")}
          </p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Date", "தேதி")}
          </label>
          <input
            type="date"
            id="date"
            value={date}
            min={formatDateToInput(new Date())}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Time", "நேரம்")}
          </label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Duration (minutes)", "கால அளவு (நிமிடங்கள்)")}
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value={15}>15 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
            <option value={30}>30 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
            <option value={45}>45 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
            <option value={60}>60 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
            <option value={90}>90 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
            <option value={120}>120 {getBilingualLabel("minutes", "நிமிடங்கள்")}</option>
          </select>
        </div>
      </div>

      {/* Conflict Warning */}
      {showConflictWarning && conflicts && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {getBilingualLabel("Scheduling Conflict Detected", "திட்டமிடல் முரண்பாடு கண்டறியப்பட்டது")}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{getBilingualLabel("This time slot conflicts with existing appointments.", "இந்த நேர இடைவெளி ஏற்கனவே உள்ள சந்திப்புகளுடன் முரண்படுகிறது.")}</p>
                {conflicts.suggestedTimes.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">{getBilingualLabel("Suggested available times:", "பரிந்துரைக்கப்பட்ட கிடைக்கும் நேரங்கள்:")}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {conflicts.suggestedTimes.map((suggestedTime) => (
                        <button
                          key={suggestedTime}
                          type="button"
                          onClick={() => handleTimeSlotSelect(suggestedTime)}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
                        >
                          {suggestedTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Time Slots */}
      {availableSlots.length > 0 && !showConflictWarning && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            {getBilingualLabel("Available Time Slots", "கிடைக்கும் நேர இடைவெளிகள்")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSlots.slice(0, 8).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => handleTimeSlotSelect(slot)}
                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Type and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Service Type", "சேவை வகை")}
          </label>
          <select
            id="serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {serviceTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        {mode === 'edit' && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Status", "நிலை")}
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Reason for Appointment", "சந்திப்பிற்கான காரணம்")}
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Recurring Appointment Options */}
      {mode === 'create' && (
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.target.checked);
                setShowRecurringOptions(e.target.checked);
                if (!e.target.checked) {
                  setRecurrencePattern('none');
                }
              }}
              className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
            />
            <label htmlFor="isRecurring" className="ml-2 block text-sm text-slate-700">
              {getBilingualLabel("Recurring Appointment", "மீண்டும் வரும் சந்திப்பு")}
            </label>
          </div>

          {showRecurringOptions && (
            <div className="mt-4 p-4 bg-slate-50 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("Recurrence Pattern", "மீண்டும் வரும் முறை")}
                  </label>
                  <select
                    id="recurrencePattern"
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  >
                    {recurrencePatterns.filter(p => p.value !== 'none').map((pattern) => (
                      <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="recurrenceInterval" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("Every", "ஒவ்வொரு")}
                  </label>
                  <select
                    id="recurrenceInterval"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4].map((interval) => (
                      <option key={interval} value={interval}>
                        {interval} {recurrencePattern === 'daily' ? getBilingualLabel('day(s)', 'நாள்/நாட்கள்') :
                          recurrencePattern === 'weekly' ? getBilingualLabel('week(s)', 'வாரம்/வாரங்கள்') :
                          getBilingualLabel('month(s)', 'மாதம்/மாதங்கள்')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("End Date (Optional)", "முடிவு தேதி (விருப்பமானது)")}
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    value={recurrenceEndDate}
                    min={date}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="recurrenceCount" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("Number of Occurrences", "நிகழ்வுகளின் எண்ணிக்கை")}
                  </label>
                  <input
                    type="number"
                    id="recurrenceCount"
                    value={recurrenceCount || ''}
                    min="1"
                    max="52"
                    onChange={(e) => setRecurrenceCount(e.target.value ? parseInt(e.target.value) : null)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={patients.length === 0}>
          {appointment ? 
            getBilingualLabel("Update Appointment", "சந்திப்பைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Schedule Appointment", "சந்திப்பை திட்டமிடு")
          }
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;