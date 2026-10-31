-- =====================================================================
--  002 — Arabic fields for graduate supervision (student name, institution, co-supervisor)
--  Run in Supabase → SQL Editor. Safe to re-run.
-- =====================================================================
alter table public.supervision add column if not exists student_name_ar text;
alter table public.supervision add column if not exists institution_ar text;
alter table public.supervision add column if not exists co_supervisor_ar text;

-- quick check: rows still missing an Arabic name
select id, student_name, student_name_ar from public.supervision order by sort_order;
