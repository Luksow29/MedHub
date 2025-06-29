/*
  # Enhanced Patient Management System

  1. New Tables
    - `patient_audit_log` - Track all changes to patient records
    - `deleted_patients` - Soft delete functionality with restore capability
    - Enhanced existing tables with audit fields

  2. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for CRUD operations
    - Implement audit trail functionality

  3. Features
    - Soft delete with restore capability
    - Comprehensive audit logging
    - Enhanced search and filtering
*/

-- Create audit log table for tracking all patient record changes
CREATE TABLE IF NOT EXISTS patient_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create soft delete table for patients
CREATE TABLE IF NOT EXISTS deleted_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_patient_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_data jsonb NOT NULL,
  deletion_reason text,
  deleted_by uuid REFERENCES auth.users(id) NOT NULL,
  deleted_at timestamptz DEFAULT now(),
  can_restore boolean DEFAULT true
);

-- Add soft delete column to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE patients ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE patients ADD COLUMN deleted_at timestamptz;
    ALTER TABLE patients ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_history' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE medical_history ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE medical_history ADD COLUMN deleted_at timestamptz;
    ALTER TABLE medical_history ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE medications ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE medications ADD COLUMN deleted_at timestamptz;
    ALTER TABLE medications ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'allergies' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE allergies ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE allergies ADD COLUMN deleted_at timestamptz;
    ALTER TABLE allergies ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_billing' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE insurance_billing ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE insurance_billing ADD COLUMN deleted_at timestamptz;
    ALTER TABLE insurance_billing ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_documents' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE patient_documents ADD COLUMN is_deleted boolean DEFAULT false;
    ALTER TABLE patient_documents ADD COLUMN deleted_at timestamptz;
    ALTER TABLE patient_documents ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE patient_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_patients ENABLE ROW LEVEL SECURITY;

-- Create policies for audit log
CREATE POLICY "Users can view their own audit logs"
  ON patient_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON patient_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for deleted patients
CREATE POLICY "Users can view their own deleted patients"
  ON deleted_patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deleted patients"
  ON deleted_patients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deleted patients"
  ON deleted_patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS patient_audit_log_user_id_idx ON patient_audit_log(user_id);
CREATE INDEX IF NOT EXISTS patient_audit_log_patient_id_idx ON patient_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS patient_audit_log_created_at_idx ON patient_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS deleted_patients_user_id_idx ON deleted_patients(user_id);
CREATE INDEX IF NOT EXISTS deleted_patients_original_patient_id_idx ON deleted_patients(original_patient_id);
CREATE INDEX IF NOT EXISTS patients_is_deleted_idx ON patients(is_deleted);
CREATE INDEX IF NOT EXISTS patients_name_search_idx ON patients USING gin(to_tsvector('english', name));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields text[] := '{}';
  old_values jsonb := '{}';
  new_values jsonb := '{}';
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    old_values := to_jsonb(OLD);
    new_values := to_jsonb(NEW);
    
    -- Find changed fields
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(old_values) o
    WHERE o.value IS DISTINCT FROM (new_values->o.key);
    
  ELSIF TG_OP = 'DELETE' THEN
    old_values := to_jsonb(OLD);
  END IF;

  -- Insert audit log
  INSERT INTO patient_audit_log (
    user_id,
    patient_id,
    table_name,
    operation,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.id, OLD.id),
    TG_TABLE_NAME,
    TG_OP,
    old_values,
    new_values,
    changed_fields
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all patient-related tables
DO $$
BEGIN
  -- Patients table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'patients_audit_trigger') THEN
    CREATE TRIGGER patients_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON patients
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;

  -- Medical history table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'medical_history_audit_trigger') THEN
    CREATE TRIGGER medical_history_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON medical_history
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;

  -- Medications table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'medications_audit_trigger') THEN
    CREATE TRIGGER medications_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON medications
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;

  -- Allergies table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'allergies_audit_trigger') THEN
    CREATE TRIGGER allergies_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON allergies
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;

  -- Insurance billing table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'insurance_billing_audit_trigger') THEN
    CREATE TRIGGER insurance_billing_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON insurance_billing
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;

  -- Patient documents table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'patient_documents_audit_trigger') THEN
    CREATE TRIGGER patient_documents_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON patient_documents
      FOR EACH ROW EXECUTE FUNCTION create_audit_log();
  END IF;
END $$;

-- Update existing policies to exclude soft-deleted records
DROP POLICY IF EXISTS "Users can view their own patients" ON patients;
CREATE POLICY "Users can view their own patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

-- Create function for full-text search
CREATE OR REPLACE FUNCTION search_patients(
  search_term text,
  user_id_param uuid,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  contact_phone text,
  contact_email text,
  preferred_contact_method text,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.contact_phone,
    p.contact_email,
    p.preferred_contact_method,
    p.created_at,
    ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.contact_phone, '') || ' ' || COALESCE(p.contact_email, '')), plainto_tsquery('english', search_term)) as rank
  FROM patients p
  WHERE 
    p.user_id = user_id_param 
    AND (p.is_deleted = false OR p.is_deleted IS NULL)
    AND (
      p.name ILIKE '%' || search_term || '%'
      OR p.contact_phone ILIKE '%' || search_term || '%'
      OR p.contact_email ILIKE '%' || search_term || '%'
      OR p.id::text = search_term
      OR to_tsvector('english', p.name || ' ' || COALESCE(p.contact_phone, '') || ' ' || COALESCE(p.contact_email, '')) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;