-- Club de développement web et applications — UCAO-UUT
-- À exécuter dans Supabase > SQL Editor.
-- Les données personnelles ne doivent pas être rendues publiques.

create extension if not exists pgcrypto;

create table if not exists public.club_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.club_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  first_name text not null check (char_length(trim(first_name)) between 1 and 100),
  program text not null check (char_length(trim(program)) between 1 and 100),
  level text not null check (level in ('Licence 1','Licence 2','Licence 3','Master 1','Master 2','Autre')),
  email text not null check (char_length(email) <= 150 and position('@' in email) > 1),
  whatsapp text null check (whatsapp is null or char_length(whatsapp) <= 30),
  motivation text not null check (char_length(trim(motivation)) between 20 and 1200),
  goals text not null check (char_length(trim(goals)) between 10 and 800),
  experience text not null check (experience in ('Débutant complet','Quelques notions','Déjà réalisé un projet')),
  hours text not null check (hours in ('1 à 2 heures','3 à 5 heures','6 heures ou plus')),
  availability text not null check (availability in ('En semaine','Le week-end','En semaine et le week-end','Selon mon emploi du temps')),
  teamwork text not null check (teamwork in ('Oui','À discuter selon les horaires')),
  rules_accepted boolean not null check (rules_accepted = true),
  privacy_accepted boolean not null check (privacy_accepted = true),
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected'))
);

create index if not exists club_applications_created_at_idx on public.club_applications(created_at desc);
create unique index if not exists club_applications_email_unique_idx on public.club_applications(lower(email));

alter table public.club_applications enable row level security;
alter table public.club_admins enable row level security;

-- Supprime les anciennes policies de même nom avant ré-exécution du script.
drop policy if exists "Public can submit application" on public.club_applications;
drop policy if exists "Admins can read applications" on public.club_applications;
drop policy if exists "Admins can update applications" on public.club_applications;
drop policy if exists "Admins can read own admin record" on public.club_admins;

-- Le public peut uniquement ajouter une candidature, pas lire/modifier/supprimer.
create policy "Public can submit application"
on public.club_applications for insert to anon, authenticated
with check (
  rules_accepted = true and privacy_accepted = true
);

-- Seuls les comptes dont l'UUID est ajouté par le propriétaire dans club_admins peuvent lire les candidatures.
create policy "Admins can read applications"
on public.club_applications for select to authenticated
using (exists (select 1 from public.club_admins a where a.user_id = (select auth.uid())));

create policy "Admins can update applications"
on public.club_applications for update to authenticated
using (exists (select 1 from public.club_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.club_admins a where a.user_id = (select auth.uid())));

-- Un admin connecté peut lire uniquement son propre enregistrement d'administration.
create policy "Admins can read own admin record"
on public.club_admins for select to authenticated
using (user_id = (select auth.uid()));

-- Aucun droit public d'ajout/suppression dans club_admins.
revoke all on public.club_admins from anon, authenticated;
grant select on public.club_admins to authenticated;

-- Droits minimums sur les candidatures. RLS décide ensuite quelles lignes sont accessibles.
revoke all on public.club_applications from anon, authenticated;
grant insert (last_name, first_name, program, level, email, whatsapp, motivation, goals, experience, hours, availability, teamwork, rules_accepted, privacy_accepted) on public.club_applications to anon, authenticated;
grant select, update on public.club_applications to authenticated;

-- Important : ne crée aucune policy SELECT pour anon.
-- Important : ne mets JAMAIS la clé service_role dans le navigateur.
