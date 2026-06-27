-- ============================================================
-- Tanoto Foundation — Strategic Performance (Balanced Scorecard)
-- Supabase schema. Jalankan seluruh file ini di Supabase SQL Editor.
-- ============================================================

-- Hapus tabel lama (jika ada) agar bisa dijalankan ulang dengan aman
drop table if exists indicators cascade;
drop table if exists programs cascade;
drop table if exists outcomes cascade;
drop table if exists accountability cascade;
drop table if exists app_users cascade;
drop table if exists strategy_map cascade;

create table strategy_map (
  id     text primary key,
  name   text not null,
  "order" int default 0,
  status text default 'Active'
);

create table accountability (
  id          text primary key,
  name        text not null,
  short       text,
  lead_person text,
  status      text default 'Active'
);

create table outcomes (
  id          text primary key,
  sm_id       text references strategy_map(id),
  code        text,
  name        text not null,
  description text,
  status      text default 'Active'
);

create table programs (
  id         text primary key,
  name       text not null,
  portfolio  text,
  acc_id     text references accountability(id),
  start_year int,
  end_year   int,
  status     text default 'Active'
);

create table app_users (
  email       text primary key,
  name        text not null,
  role        text default 'Program PIC',
  dept        text,
  acc_id      text,                 -- 'ALL' atau NULL = semua unit
  can_edit    boolean default false,
  can_approve boolean default false,
  status      text default 'Active'
);

create table indicators (
  id              text primary key,   -- format: <code>-<year>, mis. IND01-2025
  year            int  not null,
  sm_id           text references strategy_map(id),
  outcome_id      text references outcomes(id),
  acc_id          text references accountability(id),
  program_id      text,
  program_name    text,
  code            text,
  details         text,
  name            text not null,
  definition      text,
  unit            text,
  disaggregation  text,
  frequency       text,
  data_source     text,
  mov             text,
  calc_method     text,
  indicator_type  text,
  direction       text default 'Naik',
  pic             text,
  target_2030     double precision,
  target_2030_raw text,
  target_year     double precision,
  target_year_raw text,
  actual          double precision,
  actual_raw      text,
  ach_target_2030 double precision,
  ach_year        double precision,
  q1 double precision, q2 double precision, q3 double precision, q4 double precision,
  notes           text,
  key_initiatives text,
  follow_up       text,
  status          text default 'Active',
  updated_at      timestamptz default now()
);

create index on indicators (year);
create index on indicators (acc_id);
create index on indicators (sm_id);

-- ------------------------------------------------------------
-- Keamanan: untuk DEMO, RLS dimatikan agar anon key bisa baca/tulis.
-- Untuk PRODUKSI, aktifkan RLS + Supabase Auth (lihat README, langkah 8).
-- ------------------------------------------------------------
alter table strategy_map   disable row level security;
alter table accountability disable row level security;
alter table outcomes       disable row level security;
alter table programs       disable row level security;
alter table app_users      disable row level security;
alter table indicators     disable row level security;
