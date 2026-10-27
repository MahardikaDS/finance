<!-- BEGIN:nextjs-agent-rules -->

AGENTS.md - Personal Cash Flow App Architecture & Guidelines

Project context and agent execution rules for building a Personal Finance / Cash Flow Tracker using Next.js (App Router), React, Tailwind CSS, and Supabase.

1. Core Mission & Scope

The goal of this application is to track personal cash flow (Cash In, Cash Out, Net Cash Flow, and Account Balances) with minimal complexity.

Primary Metrics: Total Inflow, Total Outflow, Net Cash Flow, Real-time Account Balances.

Key Flow: Single-entry with dynamic balance updates via PostgreSQL triggers.

2. Tech Stack Specification

Framework: Next.js 14+ (App Router, Server Actions, Server Components)

Database & Auth: Supabase (PostgreSQL, Row Level Security, Supabase SSR Auth)

Styling & UI: Tailwind CSS, Shadcn UI, Lucide React (Icons)

Forms & Validation: React Hook Form + Zod

Charts: Tremor or Recharts

3. Database Schema (Supabase / PostgreSQL)

Agent must respect the following table structure and Row Level Security (RLS) rules:

-- Profiles Table
create table public.profiles (
id uuid references auth.users not null primary key,
full_name text,
currency text default 'IDR',
created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial Accounts / Wallets (Cash, Bank, E-Wallet)
create table public.accounts (
id uuid default gen_random_uuid() primary key,
user_id uuid references public.profiles(id) on delete cascade not null,
name text not null,
balance numeric default 0 not null,
created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transaction Categories
create table public.categories (
id uuid default gen_random_uuid() primary key,
user_id uuid references public.profiles(id) on delete cascade not null,
name text not null,
type text check (type in ('inflow', 'outflow')) not null,
icon text
);

-- Cash Flow Transactions Table
create table public.transactions (
id uuid default gen_random_uuid() primary key,
user_id uuid references public.profiles(id) on delete cascade not null,
account_id uuid references public.accounts(id) on delete cascade not null,
category_id uuid references public.categories(id) on delete set null,
amount numeric not null,
type text check (type in ('inflow', 'outflow')) not null,
date date default CURRENT_DATE not null,
notes text,
created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Enforcement
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

Automatic Balance Update Trigger

When inserting a new transaction, PostgreSQL triggers handle the balance sync automatically:

create or replace function public.update_account_balance()
returns trigger as $$
begin
if NEW.type = 'inflow' then
update public.accounts set balance = balance + NEW.amount where id = NEW.account_id;
elsif NEW.type = 'outflow' then
update public.accounts set balance = balance - NEW.amount where id = NEW.account_id;
end if;
return NEW;
end;

$$
language plpgsql security definer;

create trigger on_transaction_inserted
  after insert on public.transactions
  for each row execute procedure public.update_account_balance();


4. Architectural Rules for Agent Code Generation

A. Next.js App Router Standards

Use Server Components by default for data fetching (e.g., retrieving transactions & calculations).

Use 'use client' strictly for interactive UI components (Forms, Dialogs, Filter dropdowns).

Use Server Actions for form submissions (adding transactions, creating accounts, updating categories).

B. Supabase Auth & Client Instantiation

Always use @supabase/ssr package for authentication and database calls in Next.js.

Maintain separate helper utilities:

@/utils/supabase/server.ts for Server Components & Actions.

@/utils/supabase/client.ts for Client Components.

C. Cash Flow Logic Rules

Net Cash Flow Calculation: Total Inflow - Total Outflow.

Date Formatting: Default to ISO format (YYYY-MM-DD) for DB queries and localized standard (e.g., id-ID for IDR currency formatting) on UI.

Never calculate running balance on the client side if accounts.balance is already updated by DB triggers.

5. Directory Structure Convention

├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # Shadcn components
│   ├── dashboard/        # Summary cards, Cash flow charts
│   └── transactions/     # Transaction forms, Tables
├── utils/
│   └── supabase/         # Server/Client clients
├── types/
│   └── database.ts       # Supabase TypeScript Types
└── AGENTS.md


6. Development Workflow Guidelines for Agent

Types First: Generate TypeScript definitions from Supabase schema before building feature components.

Form Validation: Always use zod schemas matching table column types.

Error Handling: Return structured response { success: boolean, error?: string } from all Server Actions.

<!-- END:nextjs-agent-rules -->
$$
