import React from 'react'
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { CashFlowSummary } from '@/types/database'
import { formatCurrency } from '@/utils/formatters'

interface SummaryCardsProps {
  summary: CashFlowSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const isNetPositive = summary.netCashFlow >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Total Saldo Kas (Real-time Account Balances) */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Saldo Kas
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(summary.totalBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Likuiditas aktif di seluruh kantong akun
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      </div>

      {/* 2. Total Inflow (Pemasukan) */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Total Inflow
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.totalInflow)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total arus kas masuk (pemasukan)
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      </div>

      {/* 3. Total Outflow (Pengeluaran) */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Total Outflow
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            -{formatCurrency(summary.totalOutflow)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total arus kas keluar (pengeluaran)
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-500 to-red-400" />
      </div>

      {/* 4. Net Cash Flow */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Cash Flow
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
            <Scale className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p
            className={`text-2xl font-bold tracking-tight ${
              isNetPositive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatCurrency(summary.netCashFlow)}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isNetPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
            }`}
          >
            {isNetPositive ? 'Surplus' : 'Defisit'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Inflow dikurangi Outflow
        </p>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
      </div>
    </div>
  )
}
