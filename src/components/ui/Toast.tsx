import { useToastStore } from '../../stores/toastStore'

const styles: Record<string, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white',
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold shadow-xl transition-all animate-in slide-in-from-right ${styles[t.type] || styles.info}`}
        >
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
        </div>
      ))}
    </div>
  )
}
