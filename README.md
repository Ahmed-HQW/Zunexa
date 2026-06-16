# Zarix Coaching — Setup & Deployment Guide

## Files
```
zarix-coaching/
├── index.html        ← Main app (hero, Q&A, chat, auth)
├── billing.html      ← Pricing page (Free / Plus / Pro / Max)
├── styles.css        ← All styles (glassmorphism, animations, responsive)
├── app.js            ← Main logic (Supabase auth, realtime chat, QA rendering)
├── qa-database.js    ← AI knowledge base (30 expert Q&As, 7 categories)
├── vercel.json       ← Vercel static deployment config
└── README.md         ← This file
```

## Deploy to Vercel

1. Push all files to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Framework: **Other** (static)
4. Root directory: the folder containing these files
5. Click **Deploy** — zero configuration needed

## Supabase Setup

The app uses:
- **Supabase Auth** (email + password) — works out of the box
- **Supabase Realtime** (broadcast channel) — works out of the box, no DB table needed for chat

### Optional: Persistent Chat Messages
To store chat history, create a `messages` table in Supabase:
```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  sender text not null,
  sender_id uuid references auth.users,
  tier text default 'free',
  is_ai boolean default false,
  created_at timestamptz default now()
);

-- Allow anyone to read, auth users to insert
alter table messages enable row level security;
create policy "Anyone can read" on messages for select using (true);
create policy "Auth users can insert" on messages for insert with check (auth.uid() = sender_id);
```

### Optional: User Profiles Table
```sql
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  tier text default 'free',
  updated_at timestamptz default now()
);
```

## Features

| Feature | Details |
|---------|---------|
| Auth | Supabase email/password sign up & sign in |
| Global Chat | Supabase Realtime broadcast — everyone sees messages live |
| @ai command | Type `@ai <question>` in chat to get an AI coaching response |
| AI depth | Free = short summary, Plus = full answer, Pro = protocol, Max = full blueprint |
| Q&A browse | 30 entries across 7 categories with filter + search |
| Plans | Free / Plus ($9) / Pro ($19) / Max ($39) with feature comparison table |
| Design | Pistachio green + White caramel palette, glassmorphism, animated hero |

## Contact
- Email: Mrahmed20101119@gmail.com
- Phone: 0777 364 251
- Instagram: @Zunexa_hq
- YouTube: @zunexa_ahmed
