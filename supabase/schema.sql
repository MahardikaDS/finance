-- ==============================================================================
-- PERSONAL CASH FLOW APP - SUPABASE DATABASE SCHEMA & POLICIES
-- Jalankan seluruh script SQL ini di Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  currency text default 'IDR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. FINANCIAL ACCOUNTS / WALLETS TABLE
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  balance numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TRANSACTION CATEGORIES TABLE
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text check (type in ('inflow', 'outflow')) not null,
  icon text
);

-- 4. CASH FLOW TRANSACTIONS TABLE
create table if not exists public.transactions (
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

-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Drop existing policies if any to prevent duplicate errors
drop policy if exists "Users can manage their own profiles" on public.profiles;
drop policy if exists "Users can manage their own accounts" on public.accounts;
drop policy if exists "Users can manage their own categories" on public.categories;
drop policy if exists "Users can manage their own transactions" on public.transactions;

-- RLS Policies: Hanya pemilik data yang bisa SELECT, INSERT, UPDATE, DELETE
create policy "Users can manage their own profiles"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage their own accounts"
  on public.accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 6. TRIGGERS: OTOMATISASI DATA & SALDO
-- ==============================================================================

-- A. Trigger otomatis buat profile & kategori awal saat user registrasi di Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Buat profil publik
  insert into public.profiles (id, full_name, currency)
  values (new.id, new.raw_user_meta_data->>'full_name', 'IDR');

  -- 2. Buat akun kas default (Dompet Utama)
  insert into public.accounts (user_id, name, balance)
  values (new.id, 'Kas Utama', 0);

  -- 3. Buat kategori dasar untuk pemasukan (inflow)
  insert into public.categories (user_id, name, type, icon) values
    (new.id, 'Gaji Pokok', 'inflow', '💼'),
    (new.id, 'Freelance / Proyek', 'inflow', '💻'),
    (new.id, 'Investasi / Dividen', 'inflow', '📈'),
    (new.id, 'Bonus & Lainnya', 'inflow', '🎁');

  -- 4. Buat kategori dasar untuk pengeluaran (outflow)
  insert into public.categories (user_id, name, type, icon) values
    (new.id, 'Makanan & Minuman', 'outflow', '🍔'),
    (new.id, 'Transportasi & Bensin', 'outflow', '🚗'),
    (new.id, 'Tagihan & Utilitas', 'outflow', '💡'),
    (new.id, 'Belanja Kebutuhan', 'outflow', '🛒'),
    (new.id, 'Hiburan & Liburan', 'outflow', '🎮'),
    (new.id, 'Kesehatan', 'outflow', '💊');

  return new;
end;
$$ language plpgsql security definer;

-- Pasang trigger pada auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- B. Trigger: Update Saldo Otomatis Saat Transaksi Masuk (Insert)
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
$$ language plpgsql security definer;

drop trigger if exists on_transaction_inserted on public.transactions;
create trigger on_transaction_inserted
  after insert on public.transactions
  for each row execute procedure public.update_account_balance();


-- C. Trigger: Update Saldo Otomatis Saat Transaksi Dihapus (Delete)
create or replace function public.revert_account_balance_on_delete()
returns trigger as $$
begin
  -- Jika inflow dihapus, saldo berkurang kembali
  if OLD.type = 'inflow' then
    update public.accounts set balance = balance - OLD.amount where id = OLD.account_id;
  -- Jika outflow dihapus, saldo bertambah kembali (refund)
  elsif OLD.type = 'outflow' then
    update public.accounts set balance = balance + OLD.amount where id = OLD.account_id;
  end if;
  return OLD;
end;
$$ language plpgsql security definer;

drop trigger if exists on_transaction_deleted on public.transactions;
create trigger on_transaction_deleted
  after delete on public.transactions
  for each row execute procedure public.revert_account_balance_on_delete();
