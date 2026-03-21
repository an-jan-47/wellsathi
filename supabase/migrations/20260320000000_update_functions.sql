-- =====================================================
-- WellSathi — Fix RPC Functions to support Doctor-Level Scheduling
-- Removes reliance on time_slots for cancelling/booking
-- =====================================================

-- 1. CANCEL APPOINTMENT 
-- Atomically sets appointment to 'cancelled'. Does not touch time_slots anymore.
CREATE OR REPLACE FUNCTION cancel_appointment(_appointment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update status to cancelled
  UPDATE appointments
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = _appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
END;
$$;


-- 2. UPDATE APPOINTMENT STATUS 
-- Does not touch time_slots anymore.
CREATE OR REPLACE FUNCTION update_appointment_status(
  _appointment_id UUID,
  _new_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate status
  IF _new_status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be confirmed or cancelled', _new_status;
  END IF;

  -- Update status
  UPDATE appointments
     SET status = _new_status::appointment_status, updated_at = NOW()
   WHERE id = _appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
END;
$$;


-- 3. BOOK APPOINTMENT
-- No longer uses time_slots. Validates using the existing unique index.
CREATE OR REPLACE FUNCTION book_appointment(
  _clinic_id UUID,
  _slot_id UUID, -- Kept for backward compatibility but ignored
  _patient_name TEXT,
  _patient_phone TEXT,
  _date DATE,
  _time TIME,
  _notes TEXT DEFAULT NULL,
  _doctor_id UUID DEFAULT NULL,
  _total_fee NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appointment_id UUID;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _doctor_id IS NULL THEN
    RAISE EXCEPTION 'Doctor selection is required for booking';
  END IF;

  -- We rely on the UNIQUE INDEX `idx_unique_doctor_appointment`
  -- to throw a constraint violation if the same doctor/date/time is double booked.
  
  -- Create the appointment
  INSERT INTO public.appointments (
    clinic_id, doctor_id, user_id, patient_name, patient_phone,
    date, time, notes, status, total_fee
  ) VALUES (
    _clinic_id, _doctor_id, _user_id, _patient_name, _patient_phone,
    _date, _time, _notes, 'pending', _total_fee
  )
  RETURNING id INTO _appointment_id;

  RETURN _appointment_id;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This time slot is no longer available';
END;
$$;


-- 4. GET DOCTOR SLOTS
-- Reusable Scheduling Engine: Dynamically generates available slots.
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
  v_start TIME;
  v_end TIME;
  v_curr TIME;
  v_next TIME;
  v_break_start TIME;
  v_break_end TIME;
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

  -- Determine working status
  IF v_override.id IS NOT NULL THEN
    IF NOT v_override.is_available THEN
      RETURN; -- Return empty, doctor took a leave
    END IF;
    v_start := COALESCE(v_override.start_time, v_schedule.start_time);
    v_end := COALESCE(v_override.end_time, v_schedule.end_time);
    -- Assume breaks still apply even on override days unless we want to override break too. 
    -- If using schedule break:
    v_break_start := v_schedule.break_start;
    v_break_end := v_schedule.break_end;
    v_slot_duration := v_schedule.slot_duration;
  ELSE
    IF v_schedule.id IS NULL OR NOT v_schedule.is_working_day THEN
      RETURN; -- Doctor is not working
    END IF;
    v_start := v_schedule.start_time;
    v_end := v_schedule.end_time;
    v_break_start := v_schedule.break_start;
    v_break_end := v_schedule.break_end;
    v_slot_duration := v_schedule.slot_duration;
  END IF;

  v_curr := v_start;
  
  -- Generate slots O(n) logic
  WHILE v_curr < v_end LOOP
    v_next := v_curr + (v_slot_duration || ' minutes')::interval;
    
    -- Exceeding end time
    IF v_next > v_end THEN
      EXIT;
    END IF;

    -- Check break collision
    IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
      IF (v_curr >= v_break_start AND v_curr < v_break_end) OR (v_next > v_break_start AND v_next <= v_break_end) THEN
        v_curr := v_next;
        CONTINUE;
      END IF;
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
    
    -- Add to result
    RETURN NEXT;

    v_curr := v_next;
  END LOOP;
END;
$$;
