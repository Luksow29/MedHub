/*
  # Create appointments table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `patient_id` (uuid, references patients)
      - `date` (date)
      - `time` (time)
      - `reason` (text)
      - `reminder_sent` (boolean)
      - `reminder_sent_at` (timestamp)
      - `reminder_method_used` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `appointments` table
    - Add policies for users to manage their own appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  reason text NOT NULL,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  reminder_method_used text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_date_time_idx ON appointments(date, time);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON appointments(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();