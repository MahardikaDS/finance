'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { TransactionType } from '@/types/database'

// Response type following AGENTS.md guidelines
export interface ActionResult<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

// Validation schemas matching database columns
export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Nama akun tidak boleh kosong').max(100, 'Nama akun maksimal 100 karakter'),
  balance: z.coerce.number().min(0, 'Saldo awal tidak boleh negatif').default(0),
})

export const createTransactionSchema = z.object({
  account_id: z.string().uuid('Akun tidak valid'),
  category_id: z.string().uuid('Kategori tidak valid').optional().nullable(),
  amount: z.coerce.number().positive('Nominal transaksi harus lebih dari 0'),
  type: z.enum(['inflow', 'outflow'] as const, {
    message: 'Tipe transaksi harus inflow (pemasukan) atau outflow (pengeluaran)',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  notes: z.string().trim().max(255, 'Catatan maksimal 255 karakter').optional().nullable(),
})

export const deleteTransactionSchema = z.object({
  id: z.string().uuid('ID Transaksi tidak valid'),
})

/**
 * Server Action: Tambah akun / kantong kas baru
 */
export async function createAccount(formData: FormData | Record<string, unknown>): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Cek otentikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Sesi anda telah berakhir atau belum login. Silakan login terlebih dahulu.',
      }
    }

    const rawData = formData instanceof FormData
      ? {
          name: formData.get('name'),
          balance: formData.get('balance') ?? 0,
        }
      : formData

    const parsed = createAccountSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Data akun tidak valid',
      }
    }

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name: parsed.data.name,
      balance: parsed.data.balance,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Gagal menambahkan akun baru.',
      }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan pada server.',
    }
  }
}

/**
 * Server Action: Tambah transaksi (inflow / outflow) dengan validasi Zod
 * Saldo akun akan diperbarui otomatis oleh PostgreSQL trigger sesuai AGENTS.md
 */
export async function createTransaction(formData: FormData | Record<string, unknown>): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Cek otentikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Sesi anda telah berakhir atau belum login. Silakan login terlebih dahulu.',
      }
    }

    const rawData = formData instanceof FormData
      ? {
          account_id: formData.get('account_id'),
          category_id: formData.get('category_id') || null,
          amount: formData.get('amount'),
          type: formData.get('type') as TransactionType,
          date: formData.get('date'),
          notes: formData.get('notes') || null,
        }
      : formData

    const parsed = createTransactionSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Data transaksi tidak valid',
      }
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id || null,
      amount: parsed.data.amount,
      type: parsed.data.type,
      date: parsed.data.date,
      notes: parsed.data.notes || null,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Gagal menyimpan transaksi.',
      }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan internal pada server.',
    }
  }
}

/**
 * Server Action: Hapus transaksi berdasarkan ID
 */
export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  try {
    const parsed = deleteTransactionSchema.safeParse({ id: transactionId })
    if (!parsed.success) {
      return {
        success: false,
        error: 'ID transaksi tidak valid.',
      }
    }

    const supabase = await createClient()

    // Cek otentikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Sesi anda telah berakhir atau belum login. Silakan login terlebih dahulu.',
      }
    }

    // Pastikan hanya bisa menghapus transaksi milik user yang bersangkutan
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)

    if (error) {
      return {
        success: false,
        error: error.message || 'Gagal menghapus transaksi.',
      }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan internal pada server.',
    }
  }
}
