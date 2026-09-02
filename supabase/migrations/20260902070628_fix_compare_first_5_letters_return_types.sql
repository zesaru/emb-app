-- The legacy function declares varchar output columns while LEFT(text, int)
-- returns text. Explicit casts make the declared contract and query output
-- consistent without changing the comparison behavior.
create or replace function public.compare_first_5_letters()
returns table (
  user_name varchar,
  attendance_name varchar,
  comparison_result boolean
)
language plpgsql
set search_path = public
as $$
begin
  return query
  select
    u.name::varchar as user_name,
    a.name::varchar as attendance_name,
    left(u.name, 5) = left(a.name, 5) as comparison_result
  from public.users u
  join public.attendances a on a.user_id = u.id;
end;
$$;
