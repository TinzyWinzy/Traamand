import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin, DollarSign, Clock, CheckCircle, Loader2,
  ArrowLeft, ShieldCheck, User, Phone,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import {
  getOpenVerifierTasks,
  getVerifierTasksByVerifier,
  acceptVerifierTask,
  completeVerifierTask,
  createTransaction,
  getTransactions,
} from '../../firebase/firestore'
import type { VerifierTask } from '../../types'
import PayoutModal from '../../components/referral/PayoutModal'

export default function VerifierTasks() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [openTasks, setOpenTasks] = useState<VerifierTask[]>([])
  const [myTasks, setMyTasks] = useState<VerifierTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [resultNotes, setResultNotes] = useState('')
  const [showResultInput, setShowResultInput] = useState<string | null>(null)
  const [showPayout, setShowPayout] = useState(false)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'verifier')) {
      navigate('/sign-in')
    }
  }, [authLoading, isAuthenticated, navigate, user?.role])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      getOpenVerifierTasks(),
      getVerifierTasksByVerifier(user.id),
      getTransactions(user.id),
    ]).then(([open, mine, txns]) => {
      setOpenTasks(open)
      setMyTasks(mine)
      setBalance(txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))
      setLoading(false)
    }).catch(() => {
      addToast('Failed to load verifier tasks', 'error')
      setLoading(false)
    })
  }, [addToast, user?.id])

  const handleAccept = async (taskId: string) => {
    if (!user?.id) return
    try {
      await acceptVerifierTask(taskId, user.id)
      setOpenTasks((prev) => prev.filter((t) => t.id !== taskId))
      const task = openTasks.find((t) => t.id === taskId)
      if (task) setMyTasks((prev) => [...prev, { ...task, status: 'assigned', assignedTo: user.id! }])
      addToast('Task accepted! Visit the location to verify.', 'success')
    } catch {
      addToast('Failed to accept task', 'error')
    }
  }

  const handleComplete = async (taskId: string) => {
    if (!resultNotes.trim()) {
      addToast('Please add result notes', 'error')
      return
    }
    setCompletingId(taskId)
    try {
      await completeVerifierTask(taskId, resultNotes)
      const task = myTasks.find((t) => t.id === taskId)
      if (task) {
        await createTransaction({
          userId: user!.id,
          type: 'verifier_payout',
          amount: task.fee,
          balance: balance + task.fee,
          reference: taskId,
          description: `Verification: ${task.applicantName}`,
          status: 'completed',
        })
      }
      setMyTasks((prev) => prev.filter((t) => t.id !== taskId))
      setBalance((prev) => prev + (task?.fee || 0))
      setShowResultInput(null)
      setResultNotes('')
      addToast('Task completed! $' + (task?.fee || 0) + ' credited.', 'success')
    } catch {
      addToast('Failed to complete task', 'error')
    }
    setCompletingId(null)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600 mb-1">
              <ShieldCheck className="h-4 w-4" /> Verifier Dashboard
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Verification Tasks</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Balance</p>
            <p className="text-2xl font-extrabold text-teal-700">${balance.toFixed(2)}</p>
            {balance >= 5 && (
              <button onClick={() => setShowPayout(true)} className="text-xs font-bold text-teal-600 hover:underline mt-1">
                Withdraw
              </button>
            )}
          </div>
        </div>

        {/* My Active Tasks */}
        {myTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">My Active Tasks ({myTasks.length})</h2>
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <User className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{task.applicantName}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.location}</span>
                          <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${task.fee}</span>
                          {task.applicantPhone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {task.applicantPhone}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {task.status}
                    </span>
                  </div>

                  {showResultInput === task.id ? (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      <textarea
                        value={resultNotes}
                        onChange={(e) => setResultNotes(e.target.value)}
                        placeholder="Enter verification results..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(task.id)}
                          disabled={completingId === task.id}
                          className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {completingId === task.id ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Mark Complete & Get Paid'}
                        </button>
                        <button
                          onClick={() => { setShowResultInput(null); setResultNotes('') }}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowResultInput(task.id)} className="mt-3 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition">
                      Complete Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Tasks */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Available Tasks ({openTasks.length})</h2>
          {openTasks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
              <CheckCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-500">No tasks available right now</p>
              <p className="text-sm text-slate-400">Check back later for new verification requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                        <User className="h-5 w-5 text-teal-700" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{task.applicantName}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.location}</span>
                          <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${task.fee}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {task.taskType === 'full_verify' ? 'Full verification' : 'ID check'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAccept(task.id)}
                      className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-95"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>

      <PayoutModal
        isOpen={showPayout}
        onClose={() => setShowPayout(false)}
        maxAmount={balance}
        onSuccess={() => setBalance(0)}
      />
    </section>
  )
}
