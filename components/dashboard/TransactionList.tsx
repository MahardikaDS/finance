'use client'

import React, { useState, useTransition } from 'react'
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { TransactionWithRelations } from '@/types/database'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { deleteTransaction } from '@/app/actions/cashflow'

interface TransactionListProps {
  transactions: TransactionWithRelations[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return

    setErrorMsg(null)
    setDeletingId(id)

    startTransition(async () => {
      const res = await deleteTransaction(id)
      setDeletingId(null)
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menghapus transaksi.')
      }
    })
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Histori Transaksi Terkini
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar mutasi arus kas masuk dan keluar
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Total: {transactions.length} Transaksi
        </span>
      </div>

      {errorMsg && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Content */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4 dark:bg-slate-800 dark:text-slate-500">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Belum ada data transaksi
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Catat transaksi pemasukan atau pengeluaran pertama Anda menggunakan tombol di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                <th className="px-6 py-3.5 font-semibold">Kategori & Catatan</th>
                <th className="px-6 py-3.5 font-semibold">Akun Kas</th>
                <th className="px-6 py-3.5 font-semibold">Tipe</th>
                <th className="px-6 py-3.5 font-semibold text-right">Nominal</th>
                <th className="px-6 py-3.5 font-semibold text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {transactions.map((tx) => {
                const isInflow = tx.type === 'inflow'
                const isItemDeleting = deletingId === tx.id && isPending

                return (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    {/* Tanggal */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>

                    {/* Kategori & Catatan */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {tx.category?.icon && (
                            <span className="text-base">{tx.category.icon}</span>
                          )}
                          <span>{tx.category?.name || 'Tanpa Kategori'}</span>
                        </span>
                        {tx.notes && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {tx.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Akun Kas */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {tx.account?.name || 'Akun'}
                      </span>
                    </td>

                    {/* Tipe Badge */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        <span>{isInflow ? 'Inflow' : 'Outflow'}</span>
                      </span>
                    </td>

                    {/* Nominal */}
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                        isInflow
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isInflow ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </td>

                    {/* Aksi */}
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        disabled={isItemDeleting}
                        title="Hapus Transaksi"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      >
                        {isItemDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
