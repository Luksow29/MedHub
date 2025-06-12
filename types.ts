// src/types/index.ts

// --- Enums ---
export enum ReminderMethod {
  EMAIL = 'Email',
  SMS = 'SMS',
  NONE = 'None',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum WaitlistStatus {
  ACTIVE = 'active',
  NOTIFIED = 'notified',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
}

// UI Views
export enum View {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
}

// --- Database-mirroring Types (snake_case) ---
export interface DbPatient {
  id: string;
  user_id: string;
  name: string;
  dob: string | null;
  gender: 'ஆண்' | 'பெண்' | 'மற்றவை' | 'குறிப்பிடவில்லை' | null;
  contact_phone: string;
  contact_email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferred_language: string | null;
  preferred_contact_method: ReminderMethod;
  created_at: string;
  updated_at: string;
}

export interface DbMedicalHistory {
  id: string;
  patient_id: string;
  user_id: string;
  diagnosis_date: string;
  condition_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMedication {
  id: string;
  patient_id: string;
  user_id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAllergy {
  id: string;
  patient_id: string;
  user_id: string;
  allergen_name: string;
  reaction: string | null;
  severity: 'லேசான' | 'மிதமான' | 'கடுமையான' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInsuranceBilling {
  id: string;
  patient_id: string;
  user_id: string;
  insurance_provider: string;
  policy_number: string;
  group_number: string | null;
  is_primary: boolean;
  billing_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPatientDocument {
  id: string;
  patient_id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  notes: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbAppointment {
  id: string;
  user_id: string;
  patient_id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  reason: string;
  service_type: string | null;
  status: AppointmentStatus;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  reminder_method_used: ReminderMethod | null;
  notes: string | null;
  // Recurring appointment fields
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern;
  recurrence_interval: number; // e.g., every 2 weeks
  recurrence_end_date: string | null;
  recurrence_count: number | null;
  parent_appointment_id: string | null; // for recurring series
  created_at: string;
  updated_at: string;
}

export interface DbWaitlistEntry {
  id: string;
  user_id: string;
  patient_id: string;
  preferred_date: string | null;
  preferred_time: string | null;
  service_type: string | null;
  reason: string;
  priority: number; // 1 = highest priority
  status: WaitlistStatus;
  notes: string | null;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTimeSlot {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  is_available: boolean;
  buffer_time: number; // minutes between appointments
  max_appointments: number;
  created_at: string;
  updated_at: string;
}

// --- Client-Side Types (camelCase) ---
export interface Patient {
  id: string;
  userId: string;
  name: string;
  dob: string | null;
  gender: 'ஆண்' | 'பெண்' | 'மற்றவை' | 'குறிப்பிடவில்லை' | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  preferredLanguage: string | null;
  preferredContactMethod: ReminderMethod;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  userId: string;
  diagnosisDate: string;
  conditionName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  userId: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  userId: string;
  allergenName: string;
  reaction: string | null;
  severity: 'லேசான' | 'மிதமான' | 'கடுமையான' | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceBilling {
  id: string;
  patientId: string;
  userId: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string | null;
  isPrimary: boolean;
  billingNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  userId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  notes: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  serviceType: string | null;
  status: AppointmentStatus;
  reminderSent: boolean;
  reminderSentAt: string | null;
  reminderMethodUsed: ReminderMethod | null;
  notes: string | null;
  // Recurring appointment fields
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
  recurrenceCount: number | null;
  parentAppointmentId: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  patientName?: string;
  patientPhoneNumber?: string;
  patientEmail?: string;
  patientPreferredContactMethod?: ReminderMethod;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  patientId: string;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  reason: string;
  priority: number;
  status: WaitlistStatus;
  notes: string | null;
  notifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
}

export interface TimeSlot {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bufferTime: number;
  maxAppointments: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Appointment;
  className?: string;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointments: Appointment[];
  suggestedTimes: string[];
}

// --- Types for Data Submitted to Supabase ---
export type NewDbPatient = Omit<DbPatient, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbPatient = Partial<Omit<DbPatient, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbMedicalHistory = Omit<DbMedicalHistory, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbMedicalHistory = Partial<Omit<DbMedicalHistory, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbMedication = Omit<DbMedication, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbMedication = Partial<Omit<DbMedication, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbAllergy = Omit<DbAllergy, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbAllergy = Partial<Omit<DbAllergy, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbInsuranceBilling = Omit<DbInsuranceBilling, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbInsuranceBilling = Partial<Omit<DbInsuranceBilling, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbPatientDocument = Omit<DbPatientDocument, 'id' | 'created_at' | 'updated_at' | 'uploaded_at' | 'user_id' | 'file_name' | 'file_path'>;

export type NewDbAppointment = Omit<DbAppointment, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbAppointment = Partial<Omit<DbAppointment, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbWaitlistEntry = Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbWaitlistEntry = Partial<Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbTimeSlot = Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbTimeSlot = Partial<Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;