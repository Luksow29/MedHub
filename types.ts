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

export enum ConflictType {
  TIME_OVERLAP = 'time_overlap',
  DOUBLE_BOOKING = 'double_booking',
  RESOURCE_CONFLICT = 'resource_conflict',
}

// UI Views
export enum View {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
}

// Add missing enums for consultations
export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum HeightUnit {
  CM = 'cm',
  FEET_INCHES = 'ft_in'
}

export enum WeightUnit {
  KG = 'kg',
  LB = 'lb'
}

export enum TemperatureUnit {
  CELSIUS = 'celsius',
  FAHRENHEIT = 'fahrenheit'
}

// --- Database-mirroring Types (snake_case) ---
// இந்த இடைமுகங்கள் உங்கள் சுபாபேஸ் அட்டவணை வரிசைகளின் சரியான கட்டமைப்பைக் குறிக்கின்றன.
// இவை தரவுத்தளத்தின் காலம் பெயர்களுடன் சரியாக பொருந்த வேண்டும் (snake_case).
export interface DbPatient {
  id: string;
  user_id: string; // தரவுத்தளத்தில் NOT NULL
  name: string;
  dob: string | null; // DB date, Optional
  gender: 'ஆண்' | 'பெண்' | 'மற்றவை' | 'குறிப்பிடவில்லை' | null; // DB text, Optional
  contact_phone: string; // DB text
  contact_email: string | null; // DB text, Optional
  address: string | null; // DB text, Optional
  emergency_contact_name: string | null; // DB text, Optional
  emergency_contact_phone: string | null; // DB text, Optional
  preferred_language: string | null; // DB text, Optional, Default 'English'
  preferred_contact_method: ReminderMethod; // DB text
  created_at: string; // DB timestampz
  updated_at: string; // DB timestampz
}

export interface DbMedicalHistory {
  id: string;
  patient_id: string;
  user_id: string;
  diagnosis_date: string; // DB date
  condition_name: string; // DB text
  notes: string | null; // DB text, Optional
  created_at: string;
  updated_at: string;
}

export interface DbMedication {
  id: string;
  patient_id: string;
  user_id: string;
  medication_name: string; // DB text
  dosage: string | null; // DB text, Optional
  frequency: string | null; // DB text, Optional
  start_date: string | null; // DB date, Optional
  end_date: string | null;   // DB date, Optional
  notes: string | null; // DB text, Optional
  created_at: string;
  updated_at: string;
}

export interface DbAllergy {
  id: string;
  patient_id: string;
  user_id: string;
  allergen_name: string; // DB text
  reaction: string | null; // DB text, Optional
  severity: 'லேசான' | 'மிதமான' | 'கடுமையான' | null; // DB text, Optional
  notes: string | null; // DB text, Optional
  created_at: string;
  updated_at: string;
}

export interface DbInsuranceBilling {
  id: string;
  patient_id: string;
  user_id: string;
  insurance_provider: string; // DB text
  policy_number: string; // DB text
  group_number: string | null; // DB text, Optional
  is_primary: boolean; // DB boolean
  billing_notes: string | null; // DB text, Optional
  created_at: string;
  updated_at: string;
}

export interface DbPatientDocument {
  id: string;
  patient_id: string;
  user_id: string;
  document_type: string; // DB text
  file_name: string; // DB text
  file_path: string; // DB text
  notes: string | null; // DB text, Optional
  uploaded_at: string; // DB timestampz
  created_at: string;
  updated_at: string;
}

export interface DbAppointment {
  id: string;
  user_id: string;
  patient_id: string;
  date: string;
  time: string;
  duration: number; // Added from migration
  reason: string;
  service_type: string | null; // Added from migration
  status: AppointmentStatus; // Added from migration
  notes: string | null; // Added from migration
  is_recurring: boolean; // Added from migration
  recurrence_pattern: RecurrencePattern; // Added from migration
  recurrence_interval: number; // Added from migration
  recurrence_end_date: string | null; // Added from migration
  recurrence_count: number | null; // Added from migration
  parent_appointment_id: string | null; // Added from migration
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  reminder_method_used: ReminderMethod | null;
  created_at: string;
  updated_at: string;
}

// Add consultation database interface
export interface DbConsultation {
  id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string | null;
  date: string;
  chief_complaint: string;
  status: ConsultationStatus;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Add vital signs database interface
export interface DbVitalSigns {
  id: string;
  consultation_id: string;
  user_id: string;
  patient_id: string;
  temperature: number | null;
  temperature_unit: TemperatureUnit;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  height: number | null;
  height_unit: HeightUnit;
  weight: number | null;
  weight_unit: WeightUnit;
  bmi: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
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
  priority: number;
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

export interface DbAppointmentConflict {
  id: string;
  user_id: string;
  appointment_id: string;
  conflicting_appointment_id: string;
  conflict_type: ConflictType;
  resolved: boolean;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

// --- Client-Side Types (camelCase) ---
// இந்த இடைமுகங்கள் உங்கள் React கூறுகளில் பயன்படுத்தப்படும் தரவின் கட்டமைப்பைக் குறிக்கின்றன.
// இவை தரவுத்தளத்திலிருந்து பெறும் தரவை மேப் செய்த பிறகு அல்லது UI இல் உள்ளிட்டு அனுப்பும் போது பயன்படுத்தப்படும்.
export interface Patient {
  id: string;
  userId: string;
  name: string;
  dob: string | null;
  gender: 'ஆண்' | 'பெண்' | 'மற்றவை' | 'குறிப்பிடவில்லை' | null;
  phone: string; // Mapped from contact_phone
  email: string | null; // Mapped from contact_email
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
  notes: string | null;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
  recurrenceCount: number | null;
  parentAppointmentId: string | null;
  reminderSent: boolean;
  reminderSentAt: string | null;
  reminderMethodUsed: ReminderMethod | null;
  createdAt: string;
  updatedAt: string;
  // இந்த புலங்கள் 'patients' அட்டவணையுடன் நீங்கள் இணைக்கும்போது நிரப்பப்படும்.
  patientName?: string;
  patientPhoneNumber?: string;
  patientEmail?: string;
  patientPreferredContactMethod?: ReminderMethod;
}

// Add Consultation interface
export interface Consultation {
  id: string;
  userId: string;
  patientId: string;
  appointmentId: string | null;
  date: string;
  chiefComplaint: string;
  status: ConsultationStatus;
  diagnosis: string | null;
  treatmentPlan: string | null;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Join fields
  patientName?: string;
}

// Add VitalSigns interface
export interface VitalSigns {
  id: string;
  consultationId: string;
  userId: string;
  patientId: string;
  temperature: number | null;
  temperatureUnit: TemperatureUnit;
  heartRate: number | null;
  respiratoryRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  height: number | null;
  heightUnit: HeightUnit;
  weight: number | null;
  weightUnit: WeightUnit;
  bmi: number | null;
  oxygenSaturation: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
  // Patient details from join
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientPreferredContactMethod?: ReminderMethod;
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

export interface AppointmentConflict {
  id: string;
  userId: string;
  appointmentId: string;
  conflictingAppointmentId: string;
  conflictType: ConflictType;
  resolved: boolean;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Types for Data Submitted to Supabase (Omit DB-generated fields) ---
// சுபாபேஸுக்கு தரவை அனுப்பும்போது (எ.கா., insert/update), நீங்கள் அதை snake_case இல் அனுப்ப வேண்டும்,
// ஆனால் சுபாபேஸ் தானாகவே உருவாக்கும் புலங்களை (id, created_at, updated_at) தவிர்க்க வேண்டும்.
// 'user_id' பின்தள லாஜிக்கில் சேர்க்கப்படும்.

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

// Document upload க்கு, file_name, file_path, uploaded_at இவை UI இல் இருந்து நேரடியாக வராது
export type NewDbPatientDocument = Omit<DbPatientDocument, 'id' | 'created_at' | 'updated_at' | 'uploaded_at' | 'user_id' | 'file_name' | 'file_path'>;
// UpdateDbPatientDocument பொதுவாக தேவையில்லை, ஏனெனில் ஆவணங்கள் பொதுவாக புதுப்பிக்கப்படுவதில்லை, ஆனால் சேர்க்கப்பட்டு நீக்கப்படுகின்றன.

export type NewDbAppointment = Omit<DbAppointment, 'id' | 'created_at' | 'updated_at' | 'reminder_sent' | 'reminder_sent_at' | 'reminder_method_used' | 'user_id'>;
export type UpdateDbAppointment = Partial<Omit<DbAppointment, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbWaitlistEntry = Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'notified_at' | 'expires_at'>;
export type UpdateDbWaitlistEntry = Partial<Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbTimeSlot = Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbTimeSlot = Partial<Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbAppointmentConflict = Omit<DbAppointmentConflict, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'resolved' | 'resolution_notes'>;
export type UpdateDbAppointmentConflict = Partial<Omit<DbAppointmentConflict, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

// Add consultation types
export type NewDbConsultation = Omit<DbConsultation, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbConsultation = Partial<Omit<DbConsultation, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

// Add vital signs types
export type NewDbVitalSigns = Omit<DbVitalSigns, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbVitalSigns = Partial<Omit<DbVitalSigns, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

// Calendar view types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  className?: string;
}

export interface AvailableTimeSlot {
  time: string;
  duration: number;
  available: boolean;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointments: any[];
  suggestedTimes: string[];
}