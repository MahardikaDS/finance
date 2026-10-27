const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

/**
 * Format angka ke format mata uang Rupiah (IDR) secara deterministik
 * Menggunakan format standar "Rp 10.000" agar identik di SSR (Node.js) dan Client (Browser)
 */
export function formatCurrency(amount: number): string {
  const numericVal = Math.round(Number(amount) || 0)
  const formattedNumber = new Intl.NumberFormat('id-ID').format(numericVal)
  return `Rp ${formattedNumber}`
}

/**
 * Format tanggal ISO (YYYY-MM-DD) ke format tampilan Indonesia (misal: 27 Okt 2026)
 * Diparse langsung tanpa timezone offset agar mencegah hydration mismatch antara server dan client
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'

  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const monthIdx = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)

    if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
      return `${day} ${MONTHS_ID[monthIdx]} ${year}`
    }
  }

  return dateStr
}
