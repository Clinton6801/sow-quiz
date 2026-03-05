'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'default' | 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }
interface ToastCtx { showToast: (msg: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({ showToast: () => {} })

const COLORS: Record<ToastType, string> = {
  default: 'var(--gold)',
  success: 'var(--green)',
  error:   'var(--danger)',
  info:    'var(--cyan)',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'default') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2800)
  }, [])

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ borderColor: COLORS[t.type] }}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
