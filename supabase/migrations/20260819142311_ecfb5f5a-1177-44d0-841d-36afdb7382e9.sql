UPDATE public.pages SET created_by = NULL WHERE created_by = '00c74c3f-4fd8-4bef-8846-eacf274c99e7';
DELETE FROM auth.users WHERE lower(email) = 'notabene.inc@gmail.com';