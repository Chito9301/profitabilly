-- Mini-Sprint 21: explicit project acceptance.
--
-- accepted_at is intentionally its own nullable timestamp column, not
-- a new status value and not a new table:
--   - status already defaults to 'Active' automatically on every
--     insert (see the Sprint 7 migration), so it can never represent a
--     deliberate, explicit decision the user makes after reviewing the
--     Profitability Check — reusing it here would make "accepted"
--     indistinguishable from "just created".
--   - A separate table would be strictly more than this needs: this is
--     a single fact about a project (accepted, and when), not a
--     repeating collection of records.
-- null = not yet accepted. A timestamp (rather than a boolean) records
-- *when* the user accepted, at no extra cost, and doubles as the
-- boolean check via "is null" / "is not null".
alter table public.projects
  add column accepted_at timestamptz;

-- No RLS changes: policies are row-level (auth.uid() = user_id) and
-- already cover every column of a row the user owns, including this
-- new one.
