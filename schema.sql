-- Erbil SchoolTracks schema for Supabase (PostgreSQL)
-- Apply in Supabase Dashboard > SQL Editor.
-- IMPORTANT: These policies are a starting point for a PRIVATE admin-only prototype.
-- Do not launch with public/anonymous access to student data.
create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text not null,
  phone text,
  grade text,
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  constraint students_lat_range check (lat is null or (lat >= -90 and lat <= 90)),
  constraint students_lng_range check (lng is null or (lng >= -180 and lng <= 180))
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  vehicle_type text not null default 'پاس',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  type text not null default 'پاس',
  capacity integer not null default 14 check (capacity > 0 and capacity <= 100),
  driver_id uuid references public.drivers(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;

-- No policies are intentionally created here: without policies, browser requests are denied.
-- Before production, add authenticated policies based on your chosen role model.
-- For initial private testing, create a secure sign-in flow and restrict all CRUD to
-- authorized authenticated users. Never add USING (true) policies for student records.
-- Parent-specific access requires a parent/student relationship table and policies
-- that enforce that relationship in PostgreSQL, not only in frontend JavaScript.
