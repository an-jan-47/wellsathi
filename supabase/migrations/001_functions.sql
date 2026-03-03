-- =====================================================
-- WellSathi — Supabase SQL Functions
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- =====================================================

-- 1. CANCEL APPOINTMENT (used by patients)
-- Atomically sets appointment to 'cancelled' and frees the slot.
-- =====================================================
CREATE OR REPLACE FUNCTION cancel_appointment(_appointment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _clinic_id UUID;
  _date DATE;
  _time TIME;
BEGIN
  -- Get appointment details
  SELECT clinic_id, date, time
    INTO _clinic_id, _date, _time
    FROM appointments
   WHERE id = _appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Update status to cancelled
  UPDATE appointments
     SET status = 'cancelled', updated_at = NOW()
   WHERE id = _appointment_id;

  -- Free the linked time slot
  UPDATE time_slots
     SET is_available = TRUE
   WHERE clinic_id = _clinic_id
     AND date = _date
     AND start_time = _time;
END;
$$;


-- 2. UPDATE APPOINTMENT STATUS (used by clinics — accept/decline)
-- On 'confirmed': just updates status.
-- On 'cancelled': updates status AND frees the slot atomically.
-- =====================================================
CREATE OR REPLACE FUNCTION update_appointment_status(
  _appointment_id UUID,
  _new_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _clinic_id UUID;
  _date DATE;
  _time TIME;
BEGIN
  -- Validate status
  IF _new_status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be confirmed or cancelled', _new_status;
  END IF;

  -- Get appointment details
  SELECT clinic_id, date, time
    INTO _clinic_id, _date, _time
    FROM appointments
   WHERE id = _appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Update status
  UPDATE appointments
     SET status = _new_status::appointment_status, updated_at = NOW()
   WHERE id = _appointment_id;

  -- If cancelled/declined → free the slot
  IF _new_status = 'cancelled' THEN
    UPDATE time_slots
       SET is_available = TRUE
     WHERE clinic_id = _clinic_id
       AND date = _date
       AND start_time = _time;
  END IF;
END;
$$;


-- 3. BOOK APPOINTMENT (used by patients)
-- Atomically checks slot availability, marks it booked, and creates appointment.
-- =====================================================
CREATE OR REPLACE FUNCTION book_appointment(
  _clinic_id UUID,
  _slot_id UUID,
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
AS $$
DECLARE
  _appointment_id UUID;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();

  -- Check and lock the slot
  IF NOT EXISTS (
    SELECT 1 FROM time_slots
     WHERE id = _slot_id
       AND is_available = TRUE
     FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'This time slot is no longer available';
  END IF;

  -- Mark slot as booked
  UPDATE time_slots
     SET is_available = FALSE
   WHERE id = _slot_id;

  -- Create appointment
  INSERT INTO appointments (
    clinic_id, user_id, patient_name, patient_phone,
    date, time, notes, status
  )
  VALUES (
    _clinic_id, _user_id, _patient_name, _patient_phone,
    _date, _time, _notes, 'pending'
  )
  RETURNING id INTO _appointment_id;

  RETURN _appointment_id;
END;
$$;


-- 4. ASSIGN CLINIC ROLE (used during clinic registration)
-- Idempotent — won't fail if role already exists.
-- =====================================================
CREATE OR REPLACE FUNCTION assign_clinic_role(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (_user_id, 'clinic')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
