import React, { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  Account,
  Category,
  CashFlowSummary,
  Transaction,
  TransactionWithRelations,
} from '@/types/database'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TransactionForm } from '@/components/dashboard/TransactionForm'
import { TransactionList } from '@/components/dashboard/TransactionList'
import { AccountModal } from '@/components/dashboard/AccountModal'
import { formatCurrency } from '@/utils/formatters'
import { LogIn, Sparkles, Wallet, Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Dashboard Arus Kas Pribadi',
  description: 'Pantau arus kas masuk, keluar, saldo akun, dan net cash flow secara real-time.',
}

async function DashboardContent() {
  const supabase = await createClient()

  // Ambil user aktif
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let accounts: Account[] = []
  let categories: Category[] = []
  let transactions: TransactionWithRelations[] = []

  if (user) {
    // 1. Fetch Accounts
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (accountsData) {
      accounts = accountsData
    }

    // 2. Fetch Categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (categoriesData) {
      categories = categoriesData
    }

    // 3. Fetch Transactions with joined account and category
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        account_id,
        category_id,
        amount,
        type,
        date,
        notes,
        created_at,
        account:accounts(id, name),
        category:categories(id, name, type, icon)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    interface RawTransactionQueryResult extends Omit<TransactionWithRelations, 'account' | 'category'> {
      account: { id: string; name: string } | { id: string; name: string }[] | null
      category: { id: string; name: string; type: Transaction['type']; icon: string | null } | { id: string; name: string; type: Transaction['type']; icon: string | null }[] | null
    }

    if (transactionsData) {
      transactions = (transactionsData as unknown as RawTransactionQueryResult[]).map((tx) => ({
        ...tx,
        account: Array.isArray(tx.account) ? tx.account[0] : tx.account,
        category: Array.isArray(tx.category) ? tx.category[0] : tx.category,
      }))
    }
  }

  // Hitung metrics sesuai ketentuan AGENTS.md
  // Saldo real-time diakumulasi dari accounts.balance yang sudah disinkronisasi trigger DB
  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0)

  const totalInflow = transactions
    .filter((tx) => tx.type === 'inflow')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  const totalOutflow = transactions
    .filter((tx) => tx.type === 'outflow')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  // Net Cash Flow: Total Inflow - Total Outflow
  const netCashFlow = totalInflow - totalOutflow

  const summary: CashFlowSummary = {
    totalInflow,
    totalOutflow,
    netCashFlow,
    totalBalance,
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Ruang Cash Flow
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personal Finance & Cash Flow Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {user.email}
                </span>
                <AccountModal />
                <TransactionForm accounts={accounts} categories={categories} />
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk / Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Banner if not authenticated */}
        {!user && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Mode Pratinjau (Belum Login)
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                  Silakan masuk atau daftarkan akun Supabase untuk mulai mencatat dan menyinkronkan data akun secara real-time.
                </p>
              </div>
              <Link
                href="/login"
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500"
              >
                <span>Login ke Supabase</span>
              </Link>
            </div>
          </div>
        )}

        {/* Header Stats & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ringkasan Arus Kas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Metrik arus kas, saldo berjalan, dan mutasi keuangan Anda
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <AccountModal />
              <TransactionForm accounts={accounts} categories={categories} />
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Accounts / Wallets Overview */}
        {accounts.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Kantong Kas & Rekening
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {accounts.length} Akun Terdaftar
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {acc.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(Number(acc.balance))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <TransactionList transactions={transactions} />
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
      <p className="text-sm">Memuat data arus kas...</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
