# SPEC-01: Database Schema

## Objective
Create the foundational Postgres schema for truck visit tracking with RLS (Row Level Security) for multi-plant access control.

## Acceptance Criteria
- [ ] Tables created: `plants`, `logistic_companies`, `trucks`, `profiles`, `truck_visits`
- [ ] All foreign keys and indexes in place
- [ ] RLS enabled on all tables with policies:
  - Admins see everything
  - Supervisors see all plants
  - Gate staff see only their assigned plant
- [ ] `updated_at` trigger on `truck_visits`
- [ ] Seed data for 2 plants, 2 logistic companies (optional)

## Dependencies
- Supabase project created
- SQL Editor access

## Evidence (Records)
- `SCHEMA.sql` — migration file (committed to git)
- Supabase dashboard screenshot showing tables + policies

## Handoff Artifact
Run `SCHEMA.sql` in Supabase SQL Editor. Verify:
1. Tables appear in Table Editor
2. RLS policies visible in Authentication → Policies
3. `SELECT * FROM truck_visits;` works as authenticated user

## Next Spec
→ `SPECS/02-auth.md` — Magic link auth + profile creation trigger

---

## Rationale
Schema first because:
- Frontend types derive from DB schema (single source of truth)
- RLS policies must exist before any data insertion
- Auth triggers need `profiles` table ready

## Out of Scope
- Realtime subscriptions (SPEC-04)
- Storage for photos (SPEC-07)
- WhatsApp integration (SPEC-06)