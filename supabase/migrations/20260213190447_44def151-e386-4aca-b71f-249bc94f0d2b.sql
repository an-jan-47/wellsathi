
-- Create a SECURITY DEFINER function to safely assign clinic role
-- This prevents users from escalating to admin while allowing clinic role assignment
CREATE OR REPLACE FUNCTION public.assign_clinic_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'clinic')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.assign_clinic_role(uuid) TO authenticated;
