import { useState } from 'react'
import { X, Loader2, Smartphone, Building2, Wifi, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import { requestPayout } from '../../firebase/firestore'
import type { PayoutMethod } from '../../types'

const METHODS: { value: PayoutMethod; label: string; icon: typeof Smartphone; fee: number }[] = [
  { value: 'ecocash', label: 'EcoCash', icon: Smartphone, fee: 0.50 },
  { value: 'onemoney', label: 'OneMoney', icon: Smartphone, fee: 0.50 },
  { value: 'innbucks', label: 'Innbucks', icon: Building2, fee: 0.50 },
  { value: 'bank', label: 'Bank Transfer', icon: Building2, fee: 2.00 },
  { value: 'airtime', label: 'Airtime', icon: Wifi, fee: 0 },
  { value: 'data', label: 'Data Bundle', icon: Wifi, fee: 0 },
  { value: 'traamand_credit', label: 'Traamand Credit (+20%)', icon: CheckCircle, fee: 0 },
]

interface PayoutModalProps {
  isOpen: boolean
  onClose: () => void
  maxAmount: number
  onSuccess?: () => void
}

export default function PayoutModal({ isOpen, onClose, maxAmount, onSuccess }: PayoutModalProps) {
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [method, setMethod] = useState<PayoutMethod>('ecocash')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState(maxAmount)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const selected = METHODS.find((m) => m.value === method)
  const netAmount = selected?.fee !== undefined ? Number((amount - selected.fee).toFixed(2)) : amount
  const validAmount = amount >= 5 && amount <= maxAmount

  const handleSubmit = async () => {
    if (!validAmount || !recipient.trim() || !user?.id) return
    setSubmitting(true)
    try {
      await requestPayout({
        userId: user.id,
        amount,
        method,
        recipient: recipient.trim(),
        notes: '',
      })
      setSent(true)
      addToast('Withdrawal request submitted! We will process it shortly.', 'success')
      onSuccess?.()
    } catch {
      addToast('Failed to submit withdrawal. Please try again.', 'error')
    }
    setSubmitting(false)
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <CheckCircle className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">Withdrawal Submitted</h2>
          <p className="mt-2 text-sm text-slate-500">
            ${amount.toFixed(2)} to {recipient} via {method}. You will receive confirmation within 24 hours.
          </p>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white hover:bg-teal-700 transition">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-extrabold text-slate-900">Withdraw Funds</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Withdrawal method</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon
                const isActive = method === m.value
                return (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              {method === 'ecocash' ? 'EcoCash number' : 'Recipient account'}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={method === 'ecocash' ? '0772 123 456' : 'Account details'}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Amount (min $5)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={5}
              max={maxAmount}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Available: ${maxAmount.toFixed(2)}</span>
              {selected && selected.fee > 0 && <span>Fee: ${selected.fee.toFixed(2)}</span>}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>You receive</span>
              <span className="font-bold text-slate-900">${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!validAmount || !recipient.trim() || submitting}
            className="w-full rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : `Withdraw $${amount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
