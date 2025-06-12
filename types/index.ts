// src/types/index.ts

// Import all types from separate files
export * from './consultation';

// --- Enums ---
export enum ReminderMethod {
  EMAIL = 'Email',
  SMS = 'SMS',
  NONE = 'None',
}

// UI Views
export enum View {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
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
  reason: string;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  reminder_method_used: ReminderMethod | null;
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
  reason: string;
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