-- Create a trigger to handle new user creation in auth.users
-- This ensures that when a new user registers, they're properly set up in the system

-- Create the function that will be called when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NEW is the new row in auth.users that was just created
  -- We don't need to insert anything into a separate profiles table 
  -- since all your application tables reference auth.users directly
  
  -- Log that a new user was created
  INSERT INTO public.system_logs (level, message, source, user_id, metadata)
  VALUES ('info', 'New user registered', 'auth_trigger', NEW.id, jsonb_build_object('email', NEW.email, 'creation_method', 'sign_up'));

  RETURN NEW;
END;
$$;

-- Create the trigger that calls the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;