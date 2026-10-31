-- =====================================================================
--  001 — Courses, lectures, students, enrollments + security fix
--  Run ONCE in Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run (idempotent).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) ADMINS — explicit admin role (before: ANY logged-in user could write)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

-- the current admin account
insert into public.admins (user_id)
select id from auth.users where lower(email) = 'mohammedalajou789@gmail.com'
on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Lock down the existing public tables: everyone reads, ONLY admin writes
-- ---------------------------------------------------------------------
do $$
declare t text; p record;
begin
  foreach t in array array['profile','publications','research_interests','education','positions',
                           'awards','memberships','committees','conferences','supervision','news_activities']
  loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- manual Google-Scholar metrics shown on the site (optional; computed if empty)
alter table public.profile add column if not exists citations_total integer;
alter table public.profile add column if not exists h_index integer;
alter table public.profile add column if not exists i10_index integer;

-- Supabase Storage (legacy): writes admin-only, course-materials no longer public
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects' and cmd in ('INSERT','UPDATE','DELETE','ALL')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
drop policy if exists "admin storage write" on storage.objects;
create policy "admin storage write" on storage.objects for all
  using (public.is_admin()) with check (public.is_admin());
update storage.buckets set public = false where id = 'course-materials';

-- ---------------------------------------------------------------------
-- 3) COURSES  (re-uses the old unused table, adds what we need)
-- ---------------------------------------------------------------------
drop table if exists public.course_materials cascade;   -- unused, replaced below

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text, name_en text not null, name_ar text,
  description_en text, description_ar text,
  level text, semester text, academic_year text,
  is_active boolean default true, sort_order integer default 0,
  created_at timestamptz default now()
);
alter table public.courses add column if not exists slug text;
alter table public.courses add column if not exists accent text default '#1F5FAD';
alter table public.courses add column if not exists is_published boolean not null default false;
alter table public.courses add column if not exists enrollment_open boolean not null default true;
alter table public.courses add column if not exists syllabus_en text;
alter table public.courses add column if not exists syllabus_ar text;
alter table public.courses add column if not exists updated_at timestamptz default now();
update public.courses
   set slug = trim(both '-' from lower(regexp_replace(coalesce(nullif(code,''), name_en), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || left(id::text, 4)
 where slug is null;
create unique index if not exists courses_slug_key on public.courses(slug);

-- ---------------------------------------------------------------------
-- 4) LECTURES, VIDEOS, FILES, ANNOUNCEMENTS
-- ---------------------------------------------------------------------
create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  number integer not null default 1,
  title_en text not null,
  title_ar text,
  summary_en text,
  summary_ar text,
  student_sheet_key text,          -- R2 key of the .mn student sheet
  doctor_sheet_key text,           -- R2 key of the .mn solved sheet (optional: same file renders both)
  show_student_sheet boolean not null default true,
  show_doctor_sheet  boolean not null default false,   -- release solutions when YOU decide
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lectures_course_idx on public.lectures(course_id, number);

create table if not exists public.lecture_videos (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  youtube_id text not null,
  title_en text, title_ar text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lecture_id uuid references public.lectures(id) on delete cascade,
  title_en text not null,
  title_ar text,
  kind text not null default 'file' check (kind in ('file','link')),
  r2_key text,
  url text,
  mime text,
  size_bytes bigint,
  watermark boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists course_files_course_idx on public.course_files(course_id);

create table if not exists public.course_announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title_en text not null, title_ar text,
  body_en text, body_ar text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5) STUDENTS + ENROLLMENTS (access needs the doctor's approval)
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 3 and 120),
  university_id text not null unique check (university_id ~ '^[0-9A-Za-z-]{4,20}$'),
  email text not null unique check (lower(email) ~ '@std\.bau\.edu\.jo$'),
  phone text not null check (phone ~ '^\+?[0-9 ]{9,16}$'),
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (student_id, course_id)
);
create index if not exists enrollments_status_idx on public.enrollments(status);

-- create the student row automatically from sign-up metadata
create or replace function public.handle_new_student()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if m ? 'university_id' then
    if lower(new.email) !~ '@std\.bau\.edu\.jo$' then
      raise exception 'ONLY_STD_EMAIL';
    end if;
    insert into public.students (id, full_name, university_id, email, phone)
    values (new.id, trim(m->>'full_name'), trim(m->>'university_id'), lower(new.email), trim(m->>'phone'));
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_student on auth.users;
create trigger on_auth_user_created_student after insert on auth.users
  for each row execute function public.handle_new_student();

-- pre-check used by the registration form (so we can show a clear message)
create or replace function public.student_id_taken(uid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students where university_id = trim(uid));
$$;
grant execute on function public.student_id_taken(text) to anon, authenticated;

create or replace function public.is_enrolled(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.student_id = auth.uid() and e.course_id = c and e.status = 'approved' and s.status = 'active'
  );
$$;
grant execute on function public.is_enrolled(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6) RLS for the new tables
-- ---------------------------------------------------------------------
alter table public.courses              enable row level security;
alter table public.lectures             enable row level security;
alter table public.lecture_videos       enable row level security;
alter table public.course_files         enable row level security;
alter table public.course_announcements enable row level security;
alter table public.students             enable row level security;
alter table public.enrollments          enable row level security;

do $$
declare t text; p record;
begin
  foreach t in array array['courses','lectures','lecture_videos','course_files','course_announcements','students','enrollments'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "read published courses" on public.courses for select using (is_published);

create policy "enrolled read lectures" on public.lectures for select
  using (is_published and public.is_enrolled(course_id));

create policy "enrolled read videos" on public.lecture_videos for select
  using (exists (select 1 from public.lectures l where l.id = lecture_id and l.is_published and public.is_enrolled(l.course_id)));

create policy "enrolled read files" on public.course_files for select
  using (public.is_enrolled(course_id));

create policy "enrolled read announcements" on public.course_announcements for select
  using (public.is_enrolled(course_id));

create policy "student reads self" on public.students for select using (id = auth.uid());

create policy "student reads own enrollments" on public.enrollments for select using (student_id = auth.uid());
create policy "student requests access" on public.enrollments for insert with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (select 1 from public.courses c where c.id = course_id and c.is_published and c.enrollment_open)
  and exists (select 1 from public.students s where s.id = auth.uid() and s.status = 'active')
);
create policy "student cancels pending" on public.enrollments for delete using (student_id = auth.uid() and status = 'pending');

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists lectures_touch on public.lectures;
create trigger lectures_touch before update on public.lectures for each row execute function public.touch_updated_at();
drop trigger if exists courses_touch on public.courses;
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();

-- sanity check: should return 1 row (your admin account)
select u.email as admin_email from public.admins a join auth.users u on u.id = a.user_id;
