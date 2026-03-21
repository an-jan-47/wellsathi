-- 1. Create the new doctor schedules template table
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME, -- Optional
  break_end TIME,   -- Optional
  slot_duration INT NOT NULL DEFAULT 15, -- In minutes
  is_working_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- 2. Create an overrides table for specific date modifications (e.g., leaves, special hours)
CREATE TABLE IF NOT EXISTS doctor_slot_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT FALSE, -- e.g., FALSE means Doctor took a leave
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, override_date)
);

-- 3. We use constraint to prevent double bookings on identical date, time, and doctor.
-- We ensure doctor_id is present on the appointments table for this.

-- SAFE DATA MIGRATION: Create "Default Doctor" for clinics that have orphan appointments
INSERT INTO doctors (id, clinic_id, name, specialization, fee)
SELECT 
  gen_random_uuid(), clinic_id, 'Default Medical Officer', 'General Practitioner', 0
FROM appointments
WHERE doctor_id IS NULL
GROUP BY clinic_id;

-- Assign existing orphan appointments to the Default Doctor of their clinic
UPDATE appointments a
SET doctor_id = d.id
FROM doctors d
WHERE a.doctor_id IS NULL 
  AND a.clinic_id = d.clinic_id 
  AND d.name = 'Default Medical Officer';

-- Insert a default 9 to 5 schedule for every existing doctor in the system to ensure smooth transition
INSERT INTO doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration, is_working_day)
SELECT 
    d.id as doctor_id,
    d.clinic_id,
    day_num as day_of_week,
    '09:00:00'::TIME as start_time,
    '17:00:00'::TIME as end_time,
    15 as slot_duration,
    TRUE as is_working_day
FROM doctors d
CROSS JOIN generate_series(1, 6) as day_num -- Monday to Saturday
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

-- Now it's safe to enforce the doctor_id NOT NULL
ALTER TABLE appointments 
  ALTER COLUMN doctor_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_appointment 
  ON appointments(doctor_id, date, time) 
  WHERE status != 'cancelled';

-- 4. Enable RLS on the new tables
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_slot_overrides ENABLE ROW LEVEL SECURITY;

-- 5. Policies for clinic owners to manage schedules
DO $$
BEGIN
  CREATE POLICY "Clinic owners can manage their doctor schedules" 
    ON doctor_schedules
    FOR ALL TO authenticated
    USING (
      clinic_id IN (
        SELECT id FROM clinics WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can view doctor schedules" 
    ON doctor_schedules FOR SELECT TO public 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Clinic owners can manage doctor overrides" 
    ON doctor_slot_overrides
    FOR ALL TO authenticated
    USING (
      doctor_id IN (
        SELECT d.id FROM doctors d 
        JOIN clinics c ON d.clinic_id = c.id 
        WHERE c.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Anyone can view doctor overrides" 
    ON doctor_slot_overrides FOR SELECT TO public 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop the old time_slots table as we use dynamic slots
DROP TABLE IF EXISTS time_slots;