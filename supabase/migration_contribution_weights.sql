-- ============================================================
-- Migration: Contribution Analysis Berbobot (Weighted Contribution Analysis)
-- Jalankan file ini di Supabase SQL Editor pada project yang SUDAH berjalan.
-- Aman dijalankan berulang kali (idempotent) — tidak menghapus data yang ada.
-- ============================================================

-- 1) Bobot indikator di dalam levelnya (Output / Intermediate Outcome / Outcome / Impact)
--    Contoh mengikuti langkah 3 metodologi: bobot A=40%, B=30%, C=30% terhadap Output yang sama.
--    Kosong (NULL) = bobot dianggap setara antar-indikator pada level & Outcome yang sama (rata-rata biasa, perilaku lama tetap berjalan).
alter table indicators
  add column if not exists weight double precision;

comment on column indicators.weight is
  'Bobot (%) indikator ini terhadap levelnya (Output/Intermediate Outcome/Outcome/Impact) di dalam Outcome strategis yang sama. NULL = bobot setara.';

-- 2) Bobot level rantai hasil terhadap skor keseluruhan tiap Outcome strategis
--    Contoh mengikuti langkah 5 metodologi: bobot Output=60%, Outcome=40% terhadap Outcome (di atasnya).
create table if not exists level_weights (
  id         text primary key,   -- format: <outcome_id>::<level>
  outcome_id text references outcomes(id),
  level      text not null,      -- salah satu dari: Output, Intermediate Outcome, Outcome, Impact
  weight     double precision not null,
  unique (outcome_id, level)
);

alter table level_weights disable row level security;

comment on table level_weights is
  'Bobot (%) tiap level rantai hasil (Output/Intermediate Outcome/Outcome/Impact) terhadap skor keseluruhan Outcome strategis terkait. Kosong untuk suatu Outcome = bobot dianggap setara antar-level yang memiliki data.';
