-- Seeds a default admin user for development.
-- PIN: 1234
-- Run this only in dev/staging — not in production.

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  admin_email text;
BEGIN
  admin_email := admin_id || '@internal.local';

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    admin_id,
    admin_email,
    crypt('1234', gen_salt('bf', 10)),
    now(),
    'authenticated', 'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(), now()
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data,
    provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_id::text,
    admin_id,
    json_build_object('sub', admin_id, 'email', admin_email),
    'email',
    now(), now(), now()
  );

  INSERT INTO public.employees (id, name, role, pin, active, created_at)
  VALUES (admin_id, 'Admin', 'admin', crypt('1234', gen_salt('bf', 10)), true, now());

END $$;
