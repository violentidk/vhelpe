-- VIKK Exam Thesis Assistant schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  school text default 'VIKK',
  created_at timestamptz not null default now()
);

create table if not exists public.theses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  raw_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.thesis_analyses (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.theses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  scores jsonb not null default '{}'::jsonb,
  issues text[] not null default '{}',
  missing_sections text[] not null default '{}',
  recommendations text[] not null default '{}',
  competencies_missing text[] not null default '{}',
  critical_risks text[] not null default '{}',
  competency_breakdown jsonb not null default '[]'::jsonb,
  chunk_count int not null default 0,
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.thesis_versions (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.theses(id) on delete cascade,
  analysis_id uuid references public.thesis_analyses(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_label text not null,
  notes text,
  created_at timestamptz not null default now()
);

create type public.task_status as enum ('todo', 'in_progress', 'done');

create table if not exists public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deadline date not null,
  status public.task_status not null default 'todo',
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.self_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompts text[] not null,
  answers int[] not null,
  readiness_score int not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'teacher')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_comments (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.theses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  teacher_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.theses enable row level security;
alter table public.thesis_analyses enable row level security;
alter table public.thesis_versions enable row level security;
alter table public.planner_tasks enable row level security;
alter table public.self_evaluations enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.teacher_comments enable row level security;

create policy "profiles_owner_all" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "theses_owner_all" on public.theses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analyses_owner_all" on public.thesis_analyses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "versions_owner_all" on public.thesis_versions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "planner_owner_all" on public.planner_tasks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "self_eval_owner_all" on public.self_evaluations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mentor_owner_all" on public.mentor_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "teacher_comment_owner_all" on public.teacher_comments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_theses_user_created_at
on public.theses (user_id, created_at desc);

create index if not exists idx_thesis_analyses_user_created_at
on public.thesis_analyses (user_id, created_at desc);

create index if not exists idx_thesis_analyses_thesis_id
on public.thesis_analyses (thesis_id);

create index if not exists idx_planner_tasks_user_deadline
on public.planner_tasks (user_id, deadline asc);

create index if not exists idx_self_evaluations_user_created_at
on public.self_evaluations (user_id, created_at desc);

create index if not exists idx_mentor_messages_user_created_at
on public.mentor_messages (user_id, created_at asc);

create index if not exists idx_thesis_versions_user_created_at
on public.thesis_versions (user_id, created_at desc);

-- Storage setup (run once in SQL editor):
-- insert into storage.buckets (id, name, public) values ('theses', 'theses', false)
-- on conflict (id) do nothing;
--
-- create policy "theses_storage_owner_all" on storage.objects
-- for all using (bucket_id = 'theses' and auth.uid()::text = (storage.foldername(name))[1])
-- with check (bucket_id = 'theses' and auth.uid()::text = (storage.foldername(name))[1]);
