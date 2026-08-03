# Deploying admin-review.html (item 22)

`admin-review.html` is functional code, but it needs two things from your
side that I can't do from here:

## 1. Host the file
Upload `admin-review.html` next to `ai.html` (same Supabase/hosting
project) at a path only staff know/can reach — it's not linked from the
main app's UI on purpose.

## 2. RLS policy on `ai_knowledge`
Right now `ai.html`'s public anon key can only be trusted with what the
main app actually needs (per item 32 — I couldn't audit your live RLS
policies without Supabase dashboard access, but the shape needed here is):

- An authenticated user with an "admin" role (however you're already
  distinguishing admin accounts in Supabase Auth — a custom claim, a
  separate `admins` table, etc.) needs:
  - `SELECT` on `ai_knowledge` where `review_status = 'pending_review'`
    (currently the public/anon policy should NOT allow reading
    `is_active = false` rows at all — those are pre-review and may
    contain low-quality or adversarial content)
  - `UPDATE` on `ai_knowledge` (to set `is_active`, `review_status`,
    edited `answer`)
  - `DELETE` on `ai_knowledge` (to reject/remove bad entries)
- The anonymous/public policy used by `ai.html` itself should be
  unchanged: it only ever needs `is_active = true` rows, and only ever
  needs `INSERT` (never `UPDATE`/`DELETE`) via `autoLearn()`'s upsert.

Suggested policy shape (adjust `admins` table/claim name to whatever you
actually use):

```sql
create policy "admin can review pending kb entries"
on ai_knowledge for select
using (
  review_status = 'pending_review'
  and exists (select 1 from admins where admins.user_id = auth.uid())
);

create policy "admin can update kb entries"
on ai_knowledge for update
using (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "admin can delete kb entries"
on ai_knowledge for delete
using (exists (select 1 from admins where admins.user_id = auth.uid()));
```

Run this (with your real admin-check condition) in the Supabase SQL
editor, then confirm by logging into `admin-review.html` with an admin
account and checking a non-admin account gets an empty list / permission
error, not the pending queue.
