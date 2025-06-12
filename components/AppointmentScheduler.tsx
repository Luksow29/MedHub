// components/AppointmentScheduler.tsx - Advanced appointment scheduling with conflict detection

import React, { useState, useEffect } from 'react';
import { Patient, NewDbAppointment, AppointmentStatus, RecurrencePattern } from '../types';
import Button from './shared/Button';
import { formatDateToInput, formatTimeToInput } from '../utils/dateHelpers';

// API functions
import * as AppointmentAPI from '../api/appointments';
import * as TimeSlotAPI from '../api/timeSlots';

interface AppointmentSchedulerProps {
  patients: Patient[];
  userId: string;
  onAppointmentCreated?: () => void;
}

interface SchedulerFormData {
  patientId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  serviceType: string;
  notes: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceEndDate: string;
  recurrenceCount: number;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  patients,
  userId,
  onAppointmentCreated
}) => {
  const [formData, setFormData] = useState<SchedulerFormData>({
    patientId: '',
    date: formatDateToInput(new Date()),
    time: '09:00',
    duration: 30,
    reason: '',
    serviceType: '',
    notes: '',
    isRecurring: false,
    recurrencePattern: RecurrencePattern.NONE,
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: 1
  });

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<any[]>([]);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const serviceTypes = [
    { value: '', label: getBilingualLabel('Select Service', 'சேவையைத் தேர்ந்தெடுக்கவும்') },
    { value: 'consultation', label: getBilingualLabel('Consultation', 'ஆலோசனை') },
    { value: 'checkup', label: getBilingualLabel('Check-up', 'பரிசோதனை') },
    { value: 'follow_up', label: getBilingualLabel('Follow-up', 'பின்தொடர்தல்') },
    { value: 'treatment', label: getBilingualLabel('Treatment', 'சிகிச்சை') },
    { value: 'emergency', label: getBilingualLabel('Emergency', 'அவசரம்') }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const recurrencePatterns = [
    { value: RecurrencePattern.NONE, label: getBilingualLabel('No Recurrence', 'மீண்டும் இல்லை') },
    { value: RecurrencePattern.DAILY, label: getBilingualLabel('Daily', 'தினசரி') },
    { value: RecurrencePattern.WEEKLY, label: getBilingualLabel('Weekly', 'வாராந்திர') },
    { value: RecurrencePattern.MONTHLY, label: getBilingualLabel('Monthly', 'மாதாந்திர') }
  ];

  // Check for conflicts when date, time, or duration changes
  useEffect(() => {
    if (formData.date && formData.time && formData.duration) {
      checkForConflicts();
    }
  }, [formData.date, formData.time, formData.duration]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (formData.date) {
      fetchAvailableSlots();
    }
  }, [formData.date]);

  const checkForConflicts = async () => {
    try {
      const { data, error } = await AppointmentAPI.checkAppointmentConflicts(
        formData.date,
        formData.time,
        formData.duration,
        userId
      );

      if (error) throw error;
      setConflicts(data || []);
      setShowConflicts((data || []).length > 0);

      // If there are conflicts, get suggested times
      if (data && data.length > 0) {
        const { data: suggestions, error: suggestError } = await TimeSlotAPI.getAvailableTimeSlotsForDate(
          userId,
          formData.date,
          formData.duration
        );

        if (suggestError) throw suggestError;
        setSuggestedTimes(suggestions || []);
      } else {
        setSuggestedTimes([]);
      }
    } catch (err: any) {
      console.error('Check conflicts error:', err);
      setError(err.message);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await TimeSlotAPI.getAvailableTimeSlotsForDate(
        userId,
        formData.date,
        formData.duration
      );

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (err: any) {
      console.error('Fetch available slots error:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conflicts.length > 0) {
      const confirmOverride = window.confirm(
        getBilingualLabel(
          'There are conflicts with this appointment. Do you want to proceed anyway?',
          'இந்த சந்திப்பில் முரண்பாடுகள் உள்ளன. எப்படியும் தொடர விரும்புகிறீர்களா?'
        )
      );
      if (!confirmOverride) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const appointmentData: NewDbAppointment = {
        patient_id: formData.patientId,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        reason: formData.reason,
        service_type: formData.serviceType || null,
        status: AppointmentStatus.SCHEDULED,
        notes: formData.notes || null,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.isRecurring ? formData.recurrencePattern : RecurrencePattern.NONE,
        recurrence_interval: formData.isRecurring ? formData.recurrenceInterval : 1,
        recurrence_end_date: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : null,
        recurrence_count: formData.isRecurring && formData.recurrenceCount > 1 ? formData.recurrenceCount : null,
        parent_appointment_id: null
      };

      const { data, error } = await AppointmentAPI.createAppointment(appointmentData, userId);
      if (error) throw error;

      // If recurring, create additional appointments
      if (formData.isRecurring && formData.recurrencePattern !== RecurrencePattern.NONE && data) {
        try {
          // This would call a function to create recurring appointments
          // For now, we'll just create the single appointment
          console.log('Recurring appointment created, additional instances would be created here');
        } catch (recurringError) {
          console.warn('Error creating recurring appointments:', recurringError);
        }
      }

      // Reset form
      setFormData({
        patientId: '',
        date: formatDateToInput(new Date()),
        time: '09:00',
        duration: 30,
        reason: '',
        serviceType: '',
        notes: '',
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceCount: 1
      });

      setConflicts([]);
      setShowConflicts(false);
      setSuggestedTimes([]);

      if (onAppointmentCreated) onAppointmentCreated();
      
      alert(getBilingualLabel('Appointment scheduled successfully!', 'சந்திப்பு வெற்றிகரமாக திட்டமிடப்பட்டது!'));
    } catch (err: any) {
      console.error('Create appointment error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedTimeClick = (suggestedTime: string) => {
    setFormData(prev => ({ ...prev, time: suggestedTime }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-sky-700 mb-4">
          {getBilingualLabel("Advanced Appointment Scheduler", "மேம்பட்ட சந்திப்பு அட்டவணையாளர்")}
        </h3>
        <p className="text-slate-600">
          {getBilingualLabel(
            "Schedule appointments with automatic conflict detection and recurring options.",
            "தானியங்கு முரண்பாடு கண்டறிதல் மற்றும் மீண்டும் வரும் விருப்பங்களுடன் சந்திப்புகளை திட்டமிடுங்கள்."
          )}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Conflict Warning */}
      {showConflicts && conflicts.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              {getBilingualLabel("Scheduling Conflict Detected", "அட்டவணை முரண்பாடு கண்டறியப்பட்டது")}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-sm">
              {getBilingualLabel(
                "The selected time conflicts with existing appointments:",
                "தேர்ந்தெடுக்கப்பட்ட நேரம் ஏற்கனவே உள்ள சந்திப்புகளுடன் முரண்படுகிறது:"
              )}
            </p>
            <ul className="mt-1 text-sm list-disc list-inside">
              {conflicts.map((conflict, index) => (
                <li key={index}>
                  {conflict.patient_name} at {conflict.appointment_time} ({conflict.appointment_duration} min)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Suggested Times */}
      {suggestedTimes.length > 0 && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              {getBilingualLabel("Suggested Available Times", "பரிந்துரைக்கப்பட்ட கிடைக்கும் நேரங்கள்")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedTimes.slice(0, 6).map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedTimeClick(slot.suggested_time)}
                className="px-3 py-1 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 transition-colors text-sm"
              >
                {slot.suggested_time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scheduler Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label htmlFor="patient" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Patient", "நோயாளி")} *
            </label>
            <select
              id="patient"
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">{getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Date", "தேதி")} *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                min={formatDateToInput(new Date())}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Time", "நேரம்")} *
              </label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Duration", "கால அளவு")} *
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Service Type", "சேவை வகை")}
              </label>
              <select
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Reason", "காரணம்")} *
              </label>
              <input
                type="text"
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Notes", "குறிப்புகள்")}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Recurring Options */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-slate-700">
                {getBilingualLabel("Recurring Appointment", "மீண்டும் வரும் சந்திப்பு")}
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("Pattern", "முறை")}
                  </label>
                  <select
                    id="recurrencePattern"
                    value={formData.recurrencePattern}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrencePattern: e.target.value as RecurrencePattern }))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  >
                    {recurrencePatterns.map((pattern) => (
                      <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="recurrenceInterval" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("Every", "ஒவ்வொரு")}
                  </label>
                  <input
                    type="number"
                    id="recurrenceInterval"
                    value={formData.recurrenceInterval}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="12"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("End Date", "முடிவு தேதி")}
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                    min={formData.date}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData({
                  patientId: '',
                  date: formatDateToInput(new Date()),
                  time: '09:00',
                  duration: 30,
                  reason: '',
                  serviceType: '',
                  notes: '',
                  isRecurring: false,
                  recurrencePattern: RecurrencePattern.NONE,
                  recurrenceInterval: 1,
                  recurrenceEndDate: '',
                  recurrenceCount: 1
                });
                setConflicts([]);
                setShowConflicts(false);
                setSuggestedTimes([]);
              }}
              disabled={isLoading}
            >
              {getBilingualLabel("Reset", "மீட்டமை")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={patients.length === 0}
            >
              {getBilingualLabel("Schedule Appointment", "சந்திப்பை திட்டமிடு")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;