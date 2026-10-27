'use client'

import React, { useState, useTransition } from 'react'
import { PlusCircle, X, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Account, Category, TransactionType } from '@/types/database'
import { createTransaction } from '@/app/actions/cashflow'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  onSuccess?: () => void
}

export function TransactionForm({ accounts, categories, onSuccess }: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Today's date in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    type: 'outflow' as TransactionType,
    account_id: accounts[0]?.id || '',
    category_id: '',
    amount: '',
    date: today,
    notes: '',
  })

  // Filter categories by selected transaction type
  const filteredCategories = categories.filter((cat) => cat.type === formData.type)

  const handleOpen = () => {
    setErrorMsg(null)
    setFormData({
      type: 'outflow',
      account_id: accounts[0]?.id || '',
      category_id: '',
      amount: '',
      date: today,
      notes: '',
    })
    setIsOpen(true)
  }

  const handleClose = () => {
    if (isPending) return
    setIsOpen(false)
    setErrorMsg(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.account_id) {
      setErrorMsg('Silakan pilih akun / kantong kas.')
      return
    }

    const numAmount = Number(formData.amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari 0.')
      return
    }

    startTransition(async () => {
      const res = await createTransaction({
        account_id: formData.account_id,
        category_id: formData.category_id ? formData.category_id : null,
        amount: numAmount,
        type: formData.type,
        date: formData.date,
        notes: formData.notes.trim() || null,
      })

      if (!res.success) {
        setErrorMsg(res.error || 'Gagal menyimpan transaksi.')
      } else {
        setIsOpen(false)
        onSuccess?.()
      }
    })
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg active:scale-95"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Catat Transaksi</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 transition-all dark:bg-slate-900 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Catat Transaksi Baru
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Type Switcher (Inflow / Outflow) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Jenis Arus Kas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 'outflow',
                        category_id: '',
                      }))
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-medium transition-all ${
                      formData.type === 'outflow'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    <span>Pengeluaran (Outflow)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 'inflow',
                        category_id: '',
                      }))
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-medium transition-all ${
                      formData.type === 'inflow'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    <span>Pemasukan (Inflow)</span>
                  </button>
                </div>
              </div>

              {/* Nominal (Amount) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Nominal (IDR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Akun / Dompet Kas */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Akun / Kantong Kas <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, account_id: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  {accounts.length === 0 ? (
                    <option value="" disabled>
                      Belum ada akun kas (buat akun dulu)
                    </option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Kategori
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Tanpa Kategori</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 dark:text-slate-300">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Belanja bulanan, gaji freelance..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  maxLength={255}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || accounts.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Transaksi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
