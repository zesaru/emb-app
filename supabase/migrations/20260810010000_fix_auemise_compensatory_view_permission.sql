-- Correct the production account spelling used by the initial permission
-- migration. This is separate so already-applied production migrations are
-- repaired without being edited in place.
insert into public.user_permissions (user_id, permission)
select id, 'compensatorys.view_all'
from public.users
where lower(email) = 'auemise@embperujapan.org'
on conflict (user_id, permission) do nothing;
