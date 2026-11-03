-- =====================================================================
--  004 — Open courses (no approval) + ongoing publications
--  Run ONCE in Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run. Must show "done" at the end.
--
--  1) Courses are open to EVERYONE (even without an account):
--     published lectures, videos, files list and announcements of a published course
--     can be read by anyone. Downloading a file / PDF still needs an account
--     (checked by the website server, not here).
--     The doctor's approval is no longer used (the enrollments table stays, unused).
--  2) Publications get a "status": published (default) or an ongoing stage
--     (accepted / under_review / in_preparation).
-- =====================================================================

-- 1) open courses -------------------------------------------------------
drop policy if exists "enrolled read lectures" on public.lectures;
drop policy if exists "public read lectures" on public.lectures;
create policy "public read lectures" on public.lectures for select using (
  is_published and exists (select 1 from public.courses c where c.id = course_id and c.is_published)
);

drop policy if exists "enrolled read videos" on public.lecture_videos;
drop policy if exists "public read videos" on public.lecture_videos;
create policy "public read videos" on public.lecture_videos for select using (
  exists (
    select 1 from public.lectures l join public.courses c on c.id = l.course_id
    where l.id = lecture_id and l.is_published and c.is_published
  )
);

drop policy if exists "enrolled read files" on public.course_files;
drop policy if exists "public read files" on public.course_files;
create policy "public read files" on public.course_files for select using (
  exists (select 1 from public.courses c where c.id = course_id and c.is_published)
  and (lecture_id is null or exists (select 1 from public.lectures l where l.id = lecture_id and l.is_published))
);

drop policy if exists "enrolled read announcements" on public.course_announcements;
drop policy if exists "public read announcements" on public.course_announcements;
create policy "public read announcements" on public.course_announcements for select using (
  exists (select 1 from public.courses c where c.id = course_id and c.is_published)
);

-- anyone signed in with an active account counts as "enrolled" in every published course
create or replace function public.is_enrolled(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.students s join public.courses co on co.id = c
    where s.id = auth.uid() and s.status = 'active' and co.is_published
  );
$$;

-- 2) ongoing publications -----------------------------------------------
alter table public.publications add column if not exists status text not null default 'published';
alter table public.publications drop constraint if exists publications_status_check;
alter table public.publications add constraint publications_status_check
  check (status in ('published', 'accepted', 'under_review', 'in_preparation'));

select 'done' as status;
