import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { WHATSAPP_NUMBERS } from '../../lib/constants'

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2">
          {WHATSAPP_NUMBERS.map((entry) => {
            const clean = entry.number.replace(/[^0-9]/g, '')
            const url = `https://wa.me/${clean}`
            return (
              <a
                key={entry.number}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{entry.number}</p>
                  <p className="text-xs text-slate-500">{entry.badge}</p>
                </div>
              </a>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-green-500 hover:bg-green-600'
        }`}
        aria-label={open ? 'Close WhatsApp menu' : 'Open WhatsApp menu'}
      >
        {open ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}
