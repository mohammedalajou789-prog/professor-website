-- =====================================================================
--  003 — Speed under load (many students at the same time)
--  Run ONCE in Supabase → SQL Editor → New query → paste all → Run.
--  Safe to re-run. Changes NO data and NO permissions — only how fast they are checked.
--
--  1) Missing indexes for the queries the lecture / course pages make.
--  2) Row-level-security checks: is_admin() / auth.uid() wrapped in (select …) so Postgres
--     evaluates them ONCE per query instead of once per row (Supabase's own recommendation).
-- =====================================================================

-- 1) indexes ------------------------------------------------------------
create index if not exists lecture_videos_lecture_idx      on public.lecture_videos(lecture_id, sort_order);
create index if not exists course_files_lecture_idx        on public.course_files(lecture_id, sort_order);
create index if not exists course_announcements_course_idx on public.course_announcements(course_id, is_pinned, created_at desc);
create index if not exists enrollments_course_idx          on public.enrollments(course_id, status);
create index if not exists lectures_published_idx          on public.lectures(course_id, is_published);

-- 2) faster RLS (same rules as before) ----------------------------------
do $$
declare t text;
begin
  -- public tables: everyone reads, only the admin writes
  foreach t in array array['profile','publications','research_interests','education','positions',
                           'awards','memberships','committees','conferences','supervision','news_activities']
  loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
  -- course tables: admin can do everything
  foreach t in array array['courses','lectures','lecture_videos','course_files','course_announcements','students','enrollments'] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

drop policy if exists "student reads self" on public.students;
create policy "student reads self" on public.students for select using (id = (select auth.uid()));

drop policy if exists "student reads own enrollments" on public.enrollments;
create policy "student reads own enrollments" on public.enrollments for select using (student_id = (select auth.uid()));

drop policy if exists "student requests access" on public.enrollments;
create policy "student requests access" on public.enrollments for insert with check (
  student_id = (select auth.uid())
  and status = 'pending'
  and exists (select 1 from public.courses c where c.id = course_id and c.is_published and c.enrollment_open)
  and exists (select 1 from public.students s where s.id = (select auth.uid()) and s.status = 'active')
);

drop policy if exists "student cancels pending" on public.enrollments;
create policy "student cancels pending" on public.enrollments for delete using (student_id = (select auth.uid()) and status = 'pending');

-- refresh planner statistics
analyze public.lectures, public.lecture_videos, public.course_files, public.course_announcements, public.enrollments, public.students, public.courses;

select 'done' as status;
