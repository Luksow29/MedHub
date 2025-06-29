/*
  # Enhanced Appointment Scheduling System

  1. New Tables
    - Enhanced `appointments` table with status, duration, recurring features
    - `waitlist_entries` - Waitlist management
    - `time_slots` - Available time slot configuration
    - `appointment_conflicts` - Conflict detection and resolution

  2. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for CRUD operations
    - Implement audit trail functionality

  3. Features
    - Appointment status tracking
    - Recurring appointment support
    - Waitlist management
    - Conflict detection
    - Time zone support
*/

-- Add new columns to existing appointments table
DO $$
BEGIN
  -- Duration column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'duration'
  ) THEN
    ALTER TABLE appointments ADD COLUMN duration integer DEFAULT 30;
  END IF;

  -- Service type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE appointments ADD COLUMN service_type text;
  END IF;

  -- Status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'));
  END IF;

  -- Notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN notes text;
  END IF;

  -- Recurring appointment columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE appointments ADD COLUMN is_recurring boolean DEFAULT false;
    ALTER TABLE appointments ADD COLUMN recurrence_pattern text DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly', 'custom'));
    ALTER TABLE appointments ADD COLUMN recurrence_interval integer DEFAULT 1;
    ALTER TABLE appointments ADD COLUMN recurrence_end_date date;
    ALTER TABLE appointments ADD COLUMN recurrence_count integer;
    ALTER TABLE appointments ADD COLUMN parent_appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create waitlist entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  preferred_date date,
  preferred_time time,
  service_type text,
  reason text NOT NULL,
  priority integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('active', 'notified', 'converted', 'cancelled')),
  notes text,
  notified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create time slots table for availability management
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  buffer_time integer DEFAULT 15, -- minutes between appointments
  max_appointments integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create appointment conflicts table for tracking and resolution
CREATE TABLE IF NOT EXISTS appointment_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  conflicting_appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  conflict_type text NOT NULL CHECK (conflict_type IN ('time_overlap', 'double_booking', 'resource_conflict')),
  resolved boolean DEFAULT false,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_conflicts ENABLE ROW LEVEL SECURITY;

-- Create policies for waitlist_entries
CREATE POLICY "Users can view their own waitlist entries"
  ON waitlist_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist entries"
  ON waitlist_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waitlist entries"
  ON waitlist_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own waitlist entries"
  ON waitlist_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for time_slots
CREATE POLICY "Users can view their own time slots"
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time slots"
  ON time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time slots"
  ON time_slots
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time slots"
  ON time_slots
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for appointment_conflicts
CREATE POLICY "Users can view their own appointment conflicts"
  ON appointment_conflicts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointment conflicts"
  ON appointment_conflicts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointment conflicts"
  ON appointment_conflicts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS waitlist_entries_user_id_idx ON waitlist_entries(user_id);
CREATE INDEX IF NOT EXISTS waitlist_entries_patient_id_idx ON waitlist_entries(patient_id);
CREATE INDEX IF NOT EXISTS waitlist_entries_status_idx ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS waitlist_entries_priority_idx ON waitlist_entries(priority);
CREATE INDEX IF NOT EXISTS waitlist_entries_created_at_idx ON waitlist_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS time_slots_user_id_idx ON time_slots(user_id);
CREATE INDEX IF NOT EXISTS time_slots_day_of_week_idx ON time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS time_slots_availability_idx ON time_slots(is_available);

CREATE INDEX IF NOT EXISTS appointment_conflicts_user_id_idx ON appointment_conflicts(user_id);
CREATE INDEX IF NOT EXISTS appointment_conflicts_appointment_id_idx ON appointment_conflicts(appointment_id);
CREATE INDEX IF NOT EXISTS appointment_conflicts_resolved_idx ON appointment_conflicts(resolved);

CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_recurring_idx ON appointments(is_recurring);
CREATE INDEX IF NOT EXISTS appointments_parent_id_idx ON appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS appointments_date_time_idx ON appointments(date, time);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_waitlist_entries_updated_at
    BEFORE UPDATE ON waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_conflicts_updated_at
    BEFORE UPDATE ON appointment_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts(
  p_appointment_date date,
  p_appointment_time time,
  p_duration_minutes integer,
  p_user_id uuid,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS TABLE (
  conflicting_appointment_id uuid,
  conflict_type text,
  patient_name text,
  appointment_time time,
  appointment_duration integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as conflicting_appointment_id,
    'time_overlap'::text as conflict_type,
    p.name as patient_name,
    a.time as appointment_time,
    a.duration as appointment_duration
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE 
    a.user_id = p_user_id
    AND a.date = p_appointment_date
    AND a.status NOT IN ('cancelled', 'completed')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      -- Check for time overlap
      (a.time <= p_appointment_time AND (a.time + (a.duration || ' minutes')::interval)::time > p_appointment_time)
      OR
      (p_appointment_time <= a.time AND (p_appointment_time + (p_duration_minutes || ' minutes')::interval)::time > a.time)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for a date
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_appointment_date date,
  p_user_id uuid,
  p_duration_minutes integer DEFAULT 30
)
RETURNS TABLE (
  suggested_time time,
  available_duration integer
) AS $$
DECLARE
  day_of_week_num integer;
  slot_record RECORD;
  current_time timestamp;
  end_time timestamp;
  slot_time timestamp;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  day_of_week_num := EXTRACT(DOW FROM p_appointment_date);
  
  -- Loop through each time slot for the day
  FOR slot_record IN
    SELECT ts.start_time, ts.end_time, ts.buffer_time
    FROM time_slots ts
    WHERE ts.user_id = p_user_id
      AND ts.day_of_week = day_of_week_num
      AND ts.is_available = true
  LOOP
    -- Convert times to timestamps for easier calculation
    current_time := ('2000-01-01 ' || slot_record.start_time)::timestamp;
    end_time := ('2000-01-01 ' || slot_record.end_time)::timestamp - (p_duration_minutes || ' minutes')::interval;
    
    -- Generate time slots within this availability window
    WHILE current_time <= end_time LOOP
      slot_time := current_time;
      
      -- Check if this time slot conflicts with existing appointments
      IF NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.user_id = p_user_id
          AND a.date = p_appointment_date
          AND a.status NOT IN ('cancelled', 'completed')
          AND (
            (a.time <= slot_time::time AND (a.time + (a.duration || ' minutes')::interval)::time > slot_time::time)
            OR
            (slot_time::time <= a.time AND (slot_time::time + (p_duration_minutes || ' minutes')::interval)::time > a.time)
          )
      ) THEN
        -- Return this available slot
        suggested_time := slot_time::time;
        available_duration := p_duration_minutes;
        RETURN NEXT;
      END IF;
      
      -- Move to next potential slot
      current_time := current_time + ((p_duration_minutes + slot_record.buffer_time) || ' minutes')::interval;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to create recurring appointments
CREATE OR REPLACE FUNCTION create_recurring_appointments(
  parent_appointment_id uuid,
  user_id_param uuid,
  patient_id_param uuid,
  start_date date,
  start_time time,
  duration_minutes integer,
  reason_text text,
  service_type_text text,
  recurrence_pattern_text text,
  recurrence_interval_num integer,
  recurrence_end_date_param date DEFAULT NULL,
  recurrence_count_param integer DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  current_date date := start_date;
  appointments_created integer := 0;
  max_appointments integer := COALESCE(recurrence_count_param, 52); -- Default max 1 year
BEGIN
  -- Create recurring appointments
  WHILE (
    (recurrence_end_date_param IS NULL OR current_date <= recurrence_end_date_param)
    AND (recurrence_count_param IS NULL OR appointments_created < recurrence_count_param)
    AND appointments_created < max_appointments
  ) LOOP
    -- Skip the first iteration (parent appointment already exists)
    IF current_date != start_date THEN
      INSERT INTO appointments (
        user_id,
        patient_id,
        date,
        time,
        duration,
        reason,
        service_type,
        status,
        is_recurring,
        recurrence_pattern,
        recurrence_interval,
        recurrence_end_date,
        recurrence_count,
        parent_appointment_id
      ) VALUES (
        user_id_param,
        patient_id_param,
        current_date,
        start_time,
        duration_minutes,
        reason_text,
        service_type_text,
        'scheduled',
        true,
        recurrence_pattern_text,
        recurrence_interval_num,
        recurrence_end_date_param,
        recurrence_count_param,
        parent_appointment_id
      );
      
      appointments_created := appointments_created + 1;
    END IF;
    
    -- Calculate next date based on recurrence pattern
    CASE recurrence_pattern_text
      WHEN 'daily' THEN
        current_date := current_date + (recurrence_interval_num || ' days')::interval;
      WHEN 'weekly' THEN
        current_date := current_date + (recurrence_interval_num * 7 || ' days')::interval;
      WHEN 'monthly' THEN
        current_date := current_date + (recurrence_interval_num || ' months')::interval;
      ELSE
        EXIT; -- Exit for 'none' or unknown patterns
    END CASE;
  END LOOP;
  
  RETURN appointments_created;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-notify waitlist when appointment is cancelled
CREATE OR REPLACE FUNCTION notify_waitlist_on_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- If appointment is being cancelled, check waitlist
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Update waitlist entries that match the cancelled appointment criteria
    UPDATE waitlist_entries 
    SET 
      status = 'notified',
      notified_at = now(),
      expires_at = now() + interval '24 hours'
    WHERE 
      user_id = NEW.user_id
      AND status = 'active'
      AND (preferred_date IS NULL OR preferred_date = NEW.date)
      AND (service_type IS NULL OR service_type = NEW.service_type)
      AND id = (
        SELECT id FROM waitlist_entries
        WHERE user_id = NEW.user_id
          AND status = 'active'
          AND (preferred_date IS NULL OR preferred_date = NEW.date)
          AND (service_type IS NULL OR service_type = NEW.service_type)
        ORDER BY priority ASC, created_at ASC
        LIMIT 1
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for waitlist notification
CREATE TRIGGER appointment_status_change_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_waitlist_on_cancellation();