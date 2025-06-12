// types/consultation.ts - Types for the consultation management system

// --- Enums ---
export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReferralUrgency {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export enum TemperatureUnit {
  CELSIUS = 'Celsius', // பெரிய எழுத்துக்களில் உள்ள சரங்கள்
  FAHRENHEIT = 'Fahrenheit' // பெரிய எழுத்துக்களில் உள்ள சரங்கள்
}

export enum HeightUnit {
  CM = 'cm',
  IN = 'in'
}

export enum WeightUnit {
  KG = 'kg',
  LB = 'lb'
}

export enum IcdVersion {
  ICD10 = 'ICD-10',
  ICD11 = 'ICD-11'
}

// --- Database-mirroring Types (snake_case) ---
export interface DbConsultation {
  id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string | null;
  consultation_date: string;
  consultation_time: string;
  attending_physician: string;
  chief_complaint: string;
  status: ConsultationStatus;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDiagnosis {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  icd_code: string;
  icd_version: IcdVersion;
  description: string;
  is_primary: boolean;
  diagnosis_date: string;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbClinicalNote {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVitalSigns {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  temperature: number | null;
  temperature_unit: TemperatureUnit;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  height: number | null;
  height_unit: HeightUnit;
  weight: number | null;
  weight_unit: WeightUnit;
  bmi: number | null;
  pain_score: number | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTreatment {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  treatment_code: string | null;
  treatment_name: string;
  description: string | null;
  instructions: string | null;
  duration: number | null;
  follow_up_required: boolean;
  follow_up_interval: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPrescription {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number | null;
  route: string | null;
  special_instructions: string | null;
  is_refillable: boolean;
  refill_count: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReferral {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  referral_type: string;
  specialist: string;
  facility: string | null;
  reason: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbConsultationDocument {
  id: string;
  user_id: string;
  consultation_id: string;
  patient_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  description: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

// ... (other Db interfaces)

// --- Client-Side Types (camelCase) ---
export interface Consultation {
  // ... (Consultation interface content)
}

export interface Diagnosis {
  // ... (Diagnosis interface content)
}

export interface ClinicalNote {
  // ... (ClinicalNote interface content)
}

export interface VitalSign {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  temperature: number | null;
  temperatureUnit: TemperatureUnit;
  heartRate: number | null;
  respiratoryRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  oxygenSaturation: number | null;
  height: number | null;
  heightUnit: HeightUnit;
  weight: number | null;
  weightUnit: WeightUnit;
  bmi: number | null;
  painScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  // ... (Treatment interface content)
}

export interface Prescription {
  // ... (Prescription interface content)
}

export interface Referral {
  // ... (Referral interface content)
}

export interface ConsultationDocument {
  // ... (ConsultationDocument interface content)
}

export interface IcdCode {
  // ... (IcdCode interface content)
}

// --- Additional Types ---
export interface ConsultationSummary {
  // ... (ConsultationSummary interface content)
}

export interface PatientConsultationHistory {
  // ... (PatientConsultationHistory interface content)
}

export interface DiagnosisStatistic {
  // ... (DiagnosisStatistic interface content)
}

export interface VitalSignsTrend {
  // ... (VitalSignsTrend interface content)
}

export interface MedicalCertificate {
  // ... (MedicalCertificate interface content)
}

export interface ReferralLetter {
  // ... (ReferralLetter interface content)
}

export interface PrescriptionDocument {
  // ... (PrescriptionDocument interface content)
}

export type NewDbConsultation = Omit<DbConsultation, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbConsultation = Partial<Omit<DbConsultation, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbDiagnosis = Omit<DbDiagnosis, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbDiagnosis = Partial<Omit<DbDiagnosis, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbClinicalNote = Omit<DbClinicalNote, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbClinicalNote = Partial<Omit<DbClinicalNote, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbVitalSigns = Omit<DbVitalSigns, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id' | 'bmi'>;
export type UpdateDbVitalSigns = Partial<Omit<DbVitalSigns, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id' | 'bmi'>>;

export type NewDbTreatment = Omit<DbTreatment, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbTreatment = Partial<Omit<DbTreatment, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbPrescription = Omit<DbPrescription, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbPrescription = Partial<Omit<DbPrescription, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbReferral = Omit<DbReferral, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbReferral = Partial<Omit<DbReferral, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbConsultationDocument = Omit<DbConsultationDocument, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id' | 'file_name' | 'file_path'>;
export type UpdateDbConsultationDocument = Partial<Omit<DbConsultationDocument, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id' | 'file_name' | 'file_path'>>;