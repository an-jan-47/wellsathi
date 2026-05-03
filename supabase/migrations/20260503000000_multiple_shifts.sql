-- 1. Modify doctor_schedules to support multiple shifts
ALTER TABLE doctor_schedules ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE doctor_schedules ALTER COLUMN end_time DROP NOT NULL;
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS shifts JSONB DEFAULT '[]'::jsonb;

-- Migrate existing start_time and end_time to shifts
UPDATE doctor_schedules
SET shifts = jsonb_build_array(
  jsonb_build_object(
    'start_time', to_char(start_time, 'HH24:MI'),
    'end_time', to_char(end_time, 'HH24:MI')
  )
)
WHERE start_time IS NOT NULL AND end_time IS NOT NULL AND (shifts IS NULL OR jsonb_array_length(shifts) = 0);

-- 2. Update get_doctor_slots RPC to parse shifts JSONB
CREATE OR REPLACE FUNCTION get_doctor_slots(p_doctor_id UUID, p_date DATE)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INT;
  v_schedule RECORD;
  v_override RECORD;
  v_shift JSONB;
  v_start TIME;
  v_end TIME;
  v_curr TIME;
  v_next TIME;
  v_slot_duration INT;
  v_is_booked BOOLEAN;
BEGIN
  -- Extract 0-6 day of week where 0 = Sunday
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- Get schedule for that day
  SELECT * INTO v_schedule 
  FROM doctor_schedules 
  WHERE doctor_id = p_doctor_id AND day_of_week = v_day_of_week;

  -- Get override explicitly for that overridden date
  SELECT * INTO v_override
  FROM doctor_slot_overrides
  WHERE doctor_id = p_doctor_id AND override_date = p_date;

  -- If there's an override and doctor is unavailable, return empty
  IF v_override.id IS NOT NULL THEN
    IF NOT v_override.is_available THEN
      RETURN;
    END IF;
    -- Note: We currently only support full day off overrides from UI.
    -- If future UI allows custom hours per date, handle v_override here.
  END IF;

  -- If no schedule or not a working day, return empty
  IF v_schedule.id IS NULL OR NOT v_schedule.is_working_day THEN
    RETURN;
  END IF;

  v_slot_duration := v_schedule.slot_duration;

  -- Iterate over each shift in the shifts JSONB array
  IF v_schedule.shifts IS NOT NULL AND jsonb_array_length(v_schedule.shifts) > 0 THEN
    FOR v_shift IN SELECT * FROM jsonb_array_elements(v_schedule.shifts)
    LOOP
      v_start := (v_shift->>'start_time')::TIME;
      v_end := (v_shift->>'end_time')::TIME;
      v_curr := v_start;
      
      WHILE v_curr < v_end LOOP
        v_next := v_curr + (v_slot_duration || ' minutes')::interval;
        
        IF v_next > v_end THEN
          EXIT;
        END IF;

        -- Check if booked
        SELECT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_id = p_doctor_id 
            AND a.date = p_date 
            AND a.time = v_curr 
            AND a.status != 'cancelled'
        ) INTO v_is_booked;

        start_time := v_curr;
        end_time := v_next;
        is_available := NOT v_is_booked;
        
        RETURN NEXT;

        v_curr := v_next;
      END LOOP;
    END LOOP;
  ELSE
    -- Fallback to legacy start_time and end_time if shifts array is empty
    IF v_schedule.start_time IS NOT NULL AND v_schedule.end_time IS NOT NULL THEN
      v_start := v_schedule.start_time;
      v_end := v_schedule.end_time;
      v_curr := v_start;
      
      WHILE v_curr < v_end LOOP
        v_next := v_curr + (v_slot_duration || ' minutes')::interval;
        
        IF v_next > v_end THEN
          EXIT;
        END IF;

        SELECT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_id = p_doctor_id 
            AND a.date = p_date 
            AND a.time = v_curr 
            AND a.status != 'cancelled'
        ) INTO v_is_booked;

        start_time := v_curr;
        end_time := v_next;
        is_available := NOT v_is_booked;
        
        RETURN NEXT;

        v_curr := v_next;
      END LOOP;
    END IF;
  END IF;
END;
$$;
