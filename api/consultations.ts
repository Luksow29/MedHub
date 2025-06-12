// types/consultation.ts

// --- Enums ---
export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
}

export enum ICDVersion {
  ICD_10 = 'ICD-10',
  ICD_11 = 'ICD-11',
}

export enum HeightUnit {
  CM = 'cm',
  IN = 'in',
}

export enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs',
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

// --- Database-mirroring Types (snake_case) ---
// இந்த இடைமுகங்கள் 'consultations' அட்டவணை வரிசைகளின் சரியான கட்டமைப்பைக் குறிக்கின்றன.
export interface DbConsultation {
  id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string | null;
  consultation_date: string; //YYYY-MM-DD
  consultation_time: string; // HH:MM
  attending_physician: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  review_of_systems: string | null;
  physical_examination: string | null;
  assessment: string | null;
  plan: string | null;
  status: ConsultationStatus;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDiagnosis {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  icd_code: string;
  icd_version: ICDVersion;
  diagnosis_name: string;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbClinicalNote {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  note_type: 'SOAP' | 'Progress' | 'Discharge';
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVitalSign {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  recorded_at: string; // timestampz
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null; // bpm
  respiratory_rate: number | null; // breaths per minute
  temperature: number | null; // Celsius
  height: number | null;
  height_unit: HeightUnit | null;
  weight: number | null;
  weight_unit: WeightUnit | null;
  bmi: number | null;
  oxygen_saturation: number | null; // percentage
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTreatment {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  treatment_name: string;
  description: string | null;
  start_date: string; //YYYY-MM-DD
  end_date: string | null; //YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPrescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number | null;
  notes: string | null;
  prescribed_at: string; // timestampz
  created_at: string;
  updated_at: string;
}

export interface DbReferral {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  referred_to: string; // Specialist or department
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  referral_date: string; //YYYY-MM-DD
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConsultationDocument {
  id: string;
  consultation_id: string;
  patient_id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string; // S3 or Supabase Storage path
  notes: string | null;
  uploaded_at: string; // timestampz
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
// UI கூறுகளில் பயன்படுத்தப்படும் வகைகள்
export interface Consultation {
  id: string;
  userId: string;
  patientId: string;
  appointmentId: string | null;
  consultationDate: string;
  consultationTime: string;
  attendingPhysician: string;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  reviewOfSystems: string | null;
  physicalExamination: string | null;
  assessment: string | null;
  plan: string | null;
  status: ConsultationStatus;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  followUpDate: string | null;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Join fields from patients and appointments
  patientName?: string;
  patientPhone?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface Diagnosis {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  icdCode: string;
  icdVersion: ICDVersion;
  diagnosisName: string;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  noteType: 'SOAP' | 'Progress' | 'Discharge';
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSign {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  recordedAt: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  height: number | null;
  heightUnit: HeightUnit | null;
  weight: number | null;
  weightUnit: WeightUnit | null;
  bmi: number | null;
  oxygenSaturation: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  treatmentName: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number | null;
  notes: string | null;
  prescribedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  referredTo: string; // Specialist or department
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  referralDate: string; //YYYY-MM-DD
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationDocument {
  id: string;
  consultationId: string;
  patientId: string;
  userId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  notes: string | null;
  uploadedAt: string; // timestampz
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
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
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

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  appointment?: Appointment;
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

export interface ConflictResolution {
  conflictId: string;
  resolution: 'reschedule' | 'cancel' | 'override';
  newDateTime?: { date: string; time: string };
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  description: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
}

// --- Types for Data Submitted to Supabase (Omit DB-generated fields) ---
export type NewDbConsultation = Omit<DbConsultation, 'id' | 'user_id' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'created_at' | 'updated_at'>;
export type UpdateDbConsultation = Partial<Omit<DbConsultation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbDiagnosis = Omit<DbDiagnosis, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbDiagnosis = Partial<Omit<DbDiagnosis, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbClinicalNote = Omit<DbClinicalNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbClinicalNote = Partial<Omit<DbClinicalNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbVitalSign = Omit<DbVitalSign, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbVitalSign = Partial<Omit<DbVitalSign, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbTreatment = Omit<DbTreatment, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbTreatment = Partial<Omit<DbTreatment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbPrescription = Omit<DbPrescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbPrescription = Partial<Omit<DbPrescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbReferral = Omit<DbReferral, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateDbReferral = Partial<Omit<DbReferral, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbConsultationDocument = Omit<DbConsultationDocument, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'uploaded_at' | 'file_path'>;
export type UpdateDbConsultationDocument = Partial<Omit<DbConsultationDocument, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NewDbWaitlistEntry = Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'notified_at' | 'expires_at'>;
export type UpdateDbWaitlistEntry = Partial<Omit<DbWaitlistEntry, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbTimeSlot = Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateDbTimeSlot = Partial<Omit<DbTimeSlot, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type NewDbAppointmentConflict = Omit<DbAppointmentConflict, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'resolved' | 'resolution_notes'>;
export type UpdateDbAppointmentConflict = Partial<Omit<DbAppointmentConflict, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

