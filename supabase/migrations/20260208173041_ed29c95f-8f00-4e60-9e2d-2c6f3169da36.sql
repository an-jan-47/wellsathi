-- Fix: Update handle_new_user to gracefully handle duplicate phone numbers
-- by setting phone to NULL if it conflicts, rather than failing the entire signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- If phone conflicts, retry without phone
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.profiles (id, name, phone)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
        NEW.raw_user_meta_data ->> 'phone'
      );
    EXCEPTION WHEN unique_violation THEN
      INSERT INTO public.profiles (id, name)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
      );
    END;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  -- Handle phone uniqueness violation gracefully
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;