/*
  # Consultation Management System

  1. New Tables
    - `consultations` - Core consultation records
    - `diagnoses` - ICD-10/11 diagnoses linked to consultations
    - `clinical_notes` - SOAP format clinical documentation
    - `vital_signs` - Patient vital measurements
    - `treatments` - Treatment procedures
    - `prescriptions` - Medication prescriptions
    - `referrals` - Patient referrals to other providers
    - `consultation_documents` - Attached clinical images and documents

  2. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for CRUD operations
    - Implement audit trail functionality

  3. Features
    - Consultation status tracking
    - ICD-10/11 code integration
    - SOAP format clinical documentation
    - Vital signs tracking
    - Treatment and prescription management
    - Referral system
    - Document attachment
*/

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  consultation_date date NOT NULL,
  consultation_time time NOT NULL,
  attending_physician text NOT NULL,
  chief_complaint text NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  follow_up_date date,
  follow_up_notes text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create diagnoses table with ICD-10/11 support
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  icd_code text NOT NULL,
  icd_version text NOT NULL CHECK (icd_version IN ('ICD-10', 'ICD-11')),
  description text NOT NULL,
  is_primary boolean DEFAULT false,
  diagnosis_date date NOT NULL,
  notes text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinical_notes table for SOAP format documentation
CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  subjective text, -- Patient history, complaints, etc.
  objective text, -- Examination findings
  assessment text, -- Clinical assessment
  plan text, -- Treatment plan
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  temperature numeric(5,2),
  temperature_unit text DEFAULT 'Celsius' CHECK (temperature_unit IN ('Celsius', 'Fahrenheit')),
  heart_rate integer,
  respiratory_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  oxygen_saturation integer,
  height numeric(5,2),
  height_unit text DEFAULT 'cm' CHECK (height_unit IN ('cm', 'in')),
  weight numeric(5,2),
  weight_unit text DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
  bmi numeric(5,2),
  pain_score integer CHECK (pain_score >= 0 AND pain_score <= 10),
  notes text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  treatment_code text,
  treatment_name text NOT NULL,
  description text,
  instructions text,
  duration integer, -- in minutes
  follow_up_required boolean DEFAULT false,
  follow_up_interval integer, -- in days
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration integer NOT NULL, -- in days
  quantity integer,
  route text, -- oral, topical, etc.
  special_instructions text,
  is_refillable boolean DEFAULT false,
  refill_count integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  referral_type text NOT NULL,
  specialist text NOT NULL,
  facility text,
  reason text NOT NULL,
  urgency text CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  notes text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation_documents table
CREATE TABLE IF NOT EXISTS consultation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  description text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create icd_codes reference table
CREATE TABLE IF NOT EXISTS icd_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version text NOT NULL CHECK (version IN ('ICD-10', 'ICD-11')),
  description text NOT NULL,
  category text,
  subcategory text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(code, version)
);

-- Enable RLS on all tables
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE icd_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for consultations
CREATE POLICY "Users can view their own consultations"
  ON consultations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own consultations"
  ON consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations"
  ON consultations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultations"
  ON consultations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for diagnoses
CREATE POLICY "Users can view their own diagnoses"
  ON diagnoses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own diagnoses"
  ON diagnoses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnoses"
  ON diagnoses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnoses"
  ON diagnoses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for clinical_notes
CREATE POLICY "Users can view their own clinical_notes"
  ON clinical_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own clinical_notes"
  ON clinical_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinical_notes"
  ON clinical_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinical_notes"
  ON clinical_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for vital_signs
CREATE POLICY "Users can view their own vital_signs"
  ON vital_signs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own vital_signs"
  ON vital_signs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vital_signs"
  ON vital_signs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vital_signs"
  ON vital_signs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for treatments
CREATE POLICY "Users can view their own treatments"
  ON treatments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own treatments"
  ON treatments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own treatments"
  ON treatments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own treatments"
  ON treatments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for prescriptions
CREATE POLICY "Users can view their own prescriptions"
  ON prescriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own prescriptions"
  ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescriptions"
  ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescriptions"
  ON prescriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own referrals"
  ON referrals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for consultation_documents
CREATE POLICY "Users can view their own consultation_documents"
  ON consultation_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

CREATE POLICY "Users can insert their own consultation_documents"
  ON consultation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultation_documents"
  ON consultation_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultation_documents"
  ON consultation_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for icd_codes (read-only for users)
CREATE POLICY "Users can view icd_codes"
  ON icd_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at
  BEFORE UPDATE ON diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at
  BEFORE UPDATE ON vital_signs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_documents_updated_at
  BEFORE UPDATE ON consultation_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_icd_codes_updated_at
  BEFORE UPDATE ON icd_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers for all tables
CREATE TRIGGER consultations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON consultations
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER diagnoses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER clinical_notes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER vital_signs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vital_signs
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER treatments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON treatments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER prescriptions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER referrals_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON referrals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER consultation_documents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON consultation_documents
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS consultations_user_id_idx ON consultations(user_id);
CREATE INDEX IF NOT EXISTS consultations_patient_id_idx ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS consultations_appointment_id_idx ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS consultations_date_idx ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS consultations_status_idx ON consultations(status);

CREATE INDEX IF NOT EXISTS diagnoses_user_id_idx ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS diagnoses_consultation_id_idx ON diagnoses(consultation_id);
CREATE INDEX IF NOT EXISTS diagnoses_patient_id_idx ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS diagnoses_icd_code_idx ON diagnoses(icd_code);
CREATE INDEX IF NOT EXISTS diagnoses_is_primary_idx ON diagnoses(is_primary);

CREATE INDEX IF NOT EXISTS clinical_notes_user_id_idx ON clinical_notes(user_id);
CREATE INDEX IF NOT EXISTS clinical_notes_consultation_id_idx ON clinical_notes(consultation_id);
CREATE INDEX IF NOT EXISTS clinical_notes_patient_id_idx ON clinical_notes(patient_id);

CREATE INDEX IF NOT EXISTS vital_signs_user_id_idx ON vital_signs(user_id);
CREATE INDEX IF NOT EXISTS vital_signs_consultation_id_idx ON vital_signs(consultation_id);
CREATE INDEX IF NOT EXISTS vital_signs_patient_id_idx ON vital_signs(patient_id);

CREATE INDEX IF NOT EXISTS treatments_user_id_idx ON treatments(user_id);
CREATE INDEX IF NOT EXISTS treatments_consultation_id_idx ON treatments(consultation_id);
CREATE INDEX IF NOT EXISTS treatments_patient_id_idx ON treatments(patient_id);

CREATE INDEX IF NOT EXISTS prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS prescriptions_consultation_id_idx ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON prescriptions(patient_id);

CREATE INDEX IF NOT EXISTS referrals_user_id_idx ON referrals(user_id);
CREATE INDEX IF NOT EXISTS referrals_consultation_id_idx ON referrals(consultation_id);
CREATE INDEX IF NOT EXISTS referrals_patient_id_idx ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);

CREATE INDEX IF NOT EXISTS consultation_documents_user_id_idx ON consultation_documents(user_id);
CREATE INDEX IF NOT EXISTS consultation_documents_consultation_id_idx ON consultation_documents(consultation_id);
CREATE INDEX IF NOT EXISTS consultation_documents_patient_id_idx ON consultation_documents(patient_id);

CREATE INDEX IF NOT EXISTS icd_codes_code_idx ON icd_codes(code);
CREATE INDEX IF NOT EXISTS icd_codes_version_idx ON icd_codes(version);
CREATE INDEX IF NOT EXISTS icd_codes_search_idx ON icd_codes USING gin(to_tsvector('english', description));

-- Create functions for consultation management
-- Function to update appointment status when consultation status changes
CREATE OR REPLACE FUNCTION update_appointment_on_consultation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If consultation status changes, update the linked appointment
  IF NEW.status != OLD.status AND NEW.appointment_id IS NOT NULL THEN
    IF NEW.status = 'completed' THEN
      UPDATE appointments
      SET status = 'completed'
      WHERE id = NEW.appointment_id AND user_id = NEW.user_id;
    ELSIF NEW.status = 'cancelled' THEN
      UPDATE appointments
      SET status = 'cancelled'
      WHERE id = NEW.appointment_id AND user_id = NEW.user_id;
    ELSIF NEW.status = 'in_progress' THEN
      UPDATE appointments
      SET status = 'confirmed'
      WHERE id = NEW.appointment_id AND user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment status update
CREATE TRIGGER consultation_status_change_trigger
  AFTER UPDATE OF status ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_on_consultation_change();

-- Function to search ICD codes
CREATE OR REPLACE FUNCTION search_icd_codes(
  search_term text,
  icd_version text DEFAULT NULL,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  code text,
  version text,
  description text,
  category text,
  subcategory text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.code,
    i.version,
    i.description,
    i.category,
    i.subcategory,
    ts_rank(to_tsvector('english', i.code || ' ' || i.description), plainto_tsquery('english', search_term)) as rank
  FROM icd_codes i
  WHERE 
    i.is_active = true
    AND (icd_version IS NULL OR i.version = icd_version)
    AND (
      i.code ILIKE '%' || search_term || '%'
      OR i.description ILIKE '%' || search_term || '%'
      OR to_tsvector('english', i.code || ' ' || i.description) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY rank DESC, i.code
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a consultation summary
CREATE OR REPLACE FUNCTION generate_consultation_summary(
  consultation_id_param uuid,
  user_id_param uuid
)
RETURNS json AS $$
DECLARE
  summary json;
BEGIN
  SELECT json_build_object(
    'consultation', (
      SELECT json_build_object(
        'id', c.id,
        'date', c.consultation_date,
        'time', c.consultation_time,
        'physician', c.attending_physician,
        'chief_complaint', c.chief_complaint,
        'status', c.status,
        'follow_up_date', c.follow_up_date,
        'follow_up_notes', c.follow_up_notes,
        'created_at', c.created_at
      )
      FROM consultations c
      WHERE c.id = consultation_id_param AND c.user_id = user_id_param
    ),
    'patient', (
      SELECT json_build_object(
        'id', p.id,
        'name', p.name,
        'dob', p.dob,
        'gender', p.gender,
        'contact_phone', p.contact_phone,
        'contact_email', p.contact_email
      )
      FROM patients p
      JOIN consultations c ON p.id = c.patient_id
      WHERE c.id = consultation_id_param AND c.user_id = user_id_param
    ),
    'vital_signs', (
      SELECT json_agg(
        json_build_object(
          'temperature', vs.temperature,
          'temperature_unit', vs.temperature_unit,
          'heart_rate', vs.heart_rate,
          'respiratory_rate', vs.respiratory_rate,
          'blood_pressure', vs.blood_pressure_systolic || '/' || vs.blood_pressure_diastolic,
          'oxygen_saturation', vs.oxygen_saturation,
          'height', vs.height,
          'height_unit', vs.height_unit,
          'weight', vs.weight,
          'weight_unit', vs.weight_unit,
          'bmi', vs.bmi,
          'pain_score', vs.pain_score
        )
      )
      FROM vital_signs vs
      WHERE vs.consultation_id = consultation_id_param AND vs.user_id = user_id_param
    ),
    'clinical_notes', (
      SELECT json_build_object(
        'subjective', cn.subjective,
        'objective', cn.objective,
        'assessment', cn.assessment,
        'plan', cn.plan
      )
      FROM clinical_notes cn
      WHERE cn.consultation_id = consultation_id_param AND cn.user_id = user_id_param
    ),
    'diagnoses', (
      SELECT json_agg(
        json_build_object(
          'icd_code', d.icd_code,
          'icd_version', d.icd_version,
          'description', d.description,
          'is_primary', d.is_primary
        )
      )
      FROM diagnoses d
      WHERE d.consultation_id = consultation_id_param AND d.user_id = user_id_param
    ),
    'treatments', (
      SELECT json_agg(
        json_build_object(
          'treatment_name', t.treatment_name,
          'treatment_code', t.treatment_code,
          'description', t.description,
          'instructions', t.instructions
        )
      )
      FROM treatments t
      WHERE t.consultation_id = consultation_id_param AND t.user_id = user_id_param
    ),
    'prescriptions', (
      SELECT json_agg(
        json_build_object(
          'medication_name', p.medication_name,
          'dosage', p.dosage,
          'frequency', p.frequency,
          'duration', p.duration,
          'route', p.route,
          'special_instructions', p.special_instructions
        )
      )
      FROM prescriptions p
      WHERE p.consultation_id = consultation_id_param AND p.user_id = user_id_param
    ),
    'referrals', (
      SELECT json_agg(
        json_build_object(
          'referral_type', r.referral_type,
          'specialist', r.specialist,
          'facility', r.facility,
          'reason', r.reason,
          'urgency', r.urgency,
          'status', r.status
        )
      )
      FROM referrals r
      WHERE r.consultation_id = consultation_id_param AND r.user_id = user_id_param
    )
  ) INTO summary;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient consultation history
CREATE OR REPLACE FUNCTION get_patient_consultation_history(
  patient_id_param uuid,
  user_id_param uuid,
  limit_param integer DEFAULT 10,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  consultation_id uuid,
  consultation_date date,
  attending_physician text,
  chief_complaint text,
  status text,
  diagnoses json,
  prescriptions json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as consultation_id,
    c.consultation_date,
    c.attending_physician,
    c.chief_complaint,
    c.status,
    (
      SELECT json_agg(json_build_object('icd_code', d.icd_code, 'description', d.description, 'is_primary', d.is_primary))
      FROM diagnoses d
      WHERE d.consultation_id = c.id AND d.user_id = user_id_param
    ) as diagnoses,
    (
      SELECT json_agg(json_build_object('medication_name', p.medication_name, 'dosage', p.dosage, 'duration', p.duration))
      FROM prescriptions p
      WHERE p.consultation_id = c.id AND p.user_id = user_id_param
    ) as prescriptions
  FROM consultations c
  WHERE 
    c.patient_id = patient_id_param 
    AND c.user_id = user_id_param
    AND (c.is_deleted = false OR c.is_deleted IS NULL)
  ORDER BY c.consultation_date DESC, c.consultation_time DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get diagnosis statistics
CREATE OR REPLACE FUNCTION get_diagnosis_statistics(
  user_id_param uuid,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL
)
RETURNS TABLE (
  icd_code text,
  description text,
  count bigint,
  percentage numeric
) AS $$
DECLARE
  total_count bigint;
BEGIN
  -- Set default date range to last 30 days if not specified
  IF start_date IS NULL THEN
    start_date := current_date - interval '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := current_date;
  END IF;
  
  -- Get total count for percentage calculation
  SELECT COUNT(*) INTO total_count
  FROM diagnoses d
  JOIN consultations c ON d.consultation_id = c.id
  WHERE 
    d.user_id = user_id_param
    AND (d.is_deleted = false OR d.is_deleted IS NULL)
    AND c.consultation_date BETWEEN start_date AND end_date;
  
  -- Return statistics
  RETURN QUERY
  SELECT 
    d.icd_code,
    d.description,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 2) as percentage
  FROM diagnoses d
  JOIN consultations c ON d.consultation_id = c.id
  WHERE 
    d.user_id = user_id_param
    AND (d.is_deleted = false OR d.is_deleted IS NULL)
    AND c.consultation_date BETWEEN start_date AND end_date
  GROUP BY d.icd_code, d.description
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample ICD-10 codes
INSERT INTO icd_codes (code, version, description, category, subcategory, is_active)
VALUES
  ('A00', 'ICD-10', 'Cholera', 'Infectious diseases', 'Intestinal infectious diseases', true),
  ('E11', 'ICD-10', 'Type 2 diabetes mellitus', 'Endocrine disorders', 'Diabetes mellitus', true),
  ('I10', 'ICD-10', 'Essential (primary) hypertension', 'Circulatory system', 'Hypertensive diseases', true),
  ('J45', 'ICD-10', 'Asthma', 'Respiratory system', 'Chronic lower respiratory diseases', true),
  ('K29', 'ICD-10', 'Gastritis and duodenitis', 'Digestive system', 'Diseases of esophagus, stomach and duodenum', true),
  ('M54', 'ICD-10', 'Dorsalgia', 'Musculoskeletal system', 'Other dorsopathies', true),
  ('R51', 'ICD-10', 'Headache', 'Symptoms and signs', 'General symptoms and signs', true),
  ('Z00', 'ICD-10', 'General examination without complaint', 'Factors influencing health status', 'Persons encountering health services for examination', true)
ON CONFLICT (code, version) DO NOTHING;