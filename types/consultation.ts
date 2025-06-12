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
  CELSIUS = 'Celsius',
  FAHRENHEIT = 'Fahrenheit'
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

export interface DbIcdCode {
  id: string;
  code: string;
  version: IcdVersion;
  description: string;
  category: string | null;
  subcategory: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Client-Side Types (camelCase) ---
export interface Consultation {
  id: string;
  userId: string;
  patientId: string;
  appointmentId: string | null;
  consultationDate: string;
  consultationTime: string;
  attendingPhysician: string;
  chiefComplaint: string;
  status: ConsultationStatus;
  followUpDate: string | null;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  patientName?: string;
  patientDob?: string;
  patientGender?: string;
  patientPhone?: string;
  patientEmail?: string;
}

export interface Diagnosis {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  icdCode: string;
  icdVersion: IcdVersion;
  description: string;
  isPrimary: boolean;
  diagnosisDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
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
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  treatmentCode: string | null;
  treatmentName: string;
  description: string | null;
  instructions: string | null;
  duration: number | null;
  followUpRequired: boolean;
  followUpInterval: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number | null;
  route: string | null;
  specialInstructions: string | null;
  isRefillable: boolean;
  refillCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  referralType: string;
  specialist: string;
  facility: string | null;
  reason: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationDocument {
  id: string;
  userId: string;
  consultationId: string;
  patientId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IcdCode {
  id: string;
  code: string;
  version: IcdVersion;
  description: string;
  category: string | null;
  subcategory: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Types for Data Submitted to Supabase ---
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

// --- Additional Types ---
export interface ConsultationSummary {
  consultation: {
    id: string;
    date: string;
    time: string;
    physician: string;
    chiefComplaint: string;
    status: ConsultationStatus;
    followUpDate: string | null;
    followUpNotes: string | null;
    createdAt: string;
  };
  patient: {
    id: string;
    name: string;
    dob: string | null;
    gender: string | null;
    contactPhone: string;
    contactEmail: string | null;
  };
  vitalSigns: {
    temperature: number | null;
    temperatureUnit: TemperatureUnit;
    heartRate: number | null;
    respiratoryRate: number | null;
    bloodPressure: string | null;
    oxygenSaturation: number | null;
    height: number | null;
    heightUnit: HeightUnit;
    weight: number | null;
    weightUnit: WeightUnit;
    bmi: number | null;
    painScore: number | null;
  }[];
  clinicalNotes: {
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  };
  diagnoses: {
    icdCode: string;
    icdVersion: IcdVersion;
    description: string;
    isPrimary: boolean;
  }[];
  treatments: {
    treatmentName: string;
    treatmentCode: string | null;
    description: string | null;
    instructions: string | null;
  }[];
  prescriptions: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: number;
    route: string | null;
    specialInstructions: string | null;
  }[];
  referrals: {
    referralType: string;
    specialist: string;
    facility: string | null;
    reason: string;
    urgency: ReferralUrgency;
    status: ReferralStatus;
  }[];
}

export interface PatientConsultationHistory {
  consultationId: string;
  consultationDate: string;
  attendingPhysician: string;
  chiefComplaint: string;
  status: ConsultationStatus;
  diagnoses: {
    icdCode: string;
    description: string;
    isPrimary: boolean;
  }[];
  prescriptions: {
    medicationName: string;
    dosage: string;
    duration: number;
  }[];
}

export interface DiagnosisStatistic {
  icdCode: string;
  description: string;
  count: number;
  percentage: number;
}

export interface VitalSignsTrend {
  date: string;
  value: number;
}

export interface MedicalCertificate {
  certificateId: string;
  issueDate: string;
  patientName: string;
  patientDob: string | null;
  patientGender: string | null;
  consultationDate: string;
  physician: string;
  diagnoses: {
    icdCode: string;
    description: string;
    isPrimary: boolean;
  }[];
  startDate: string;
  endDate: string;
  daysOff: number;
  reason: string;
}

export interface ReferralLetter {
  referralId: string;
  referralDate: string;
  patientName: string;
  patientDob: string | null;
  patientGender: string | null;
  patientContact: string;
  patientEmail: string | null;
  patientAddress: string | null;
  consultationDate: string;
  referringPhysician: string;
  specialist: string;
  facility: string | null;
  referralType: string;
  reason: string;
  urgency: ReferralUrgency;
  diagnoses: {
    icdCode: string;
    description: string;
    isPrimary: boolean;
  }[];
  clinicalNotes: {
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  };
  additionalNotes: string | null;
}

export interface PrescriptionDocument {
  prescriptionId: string;
  patientName: string;
  patientDob: string | null;
  patientGender: string | null;
  consultationDate: string;
  physician: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string | null;
  quantity: number | null;
  specialInstructions: string | null;
  isRefillable: boolean;
  refillCount: number;
  issueDate: string;
}