-- =====================================================
-- Rooms Table Schema for Multiplayer Quiz
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create rooms table if it doesn't exist
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  host_id text not null,
  section text not null,
  status text not null default 'waiting' check (status in ('waiting', 'question', 'buzzed', 'revealed', 'ended')),
  current_q jsonb,
  buzzed_by text,
  timer_seconds integer not null default 30,
  timer_started_at timestamptz,
  double_points boolean default false,
  pts_per_q integer not null default 10,
  categories text[] default array[]::text[],
  show_hint boolean default false,
  created_at timestamptz default now()
);

-- Add show_hint column if it doesn't exist (for existing databases)
alter table rooms add column if not exists show_hint boolean default false;

-- Create contestants table if it doesn't exist
create table if not exists contestants (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  name text not null,
  team_color text not null,
  score integer default 0,
  locked_q_id text,
  joined_at timestamptz default now()
);

-- Enable RLS
alter table rooms enable row level security;
alter table contestants enable row level security;

-- Create policies
create policy "public_rooms" on rooms for all using (true) with check (true);
create policy "public_contestants" on contestants for all using (true) with check (true);
