-- Migration: Add sharing helper function
-- This enables looking up user IDs by email for the sharing feature

-- Function to get user ID by email (for sharing journeys)
-- Uses SECURITY DEFINER to access auth.users which is normally restricted
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = LOWER(email_input) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Note: This function allows any authenticated user to look up user IDs by email.
-- This is intentional for the sharing feature, but be aware of privacy implications.
-- Consider rate limiting this function in production if abuse is a concern.

