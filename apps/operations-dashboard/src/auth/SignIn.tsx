import { useState } from 'react'
import { useAuth } from './AuthProvider'

export function SignIn() {
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signInWithMagicLink(email.trim())
    setSubmitting(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md bg-cream-50 border border-cream-300/80 rounded-xl shadow-card p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <CloverMark size={28} />
          <span className="font-display text-[22px] tracking-tight text-clover-800 font-medium">
            Clover Digital
          </span>
        </div>
        <h1 className="font-display text-[26px] text-ink-900 leading-tight">
          Sign in to Operations
        </h1>
        <p className="text-[13.5px] text-ink-500 mt-1.5 mb-6">
          Internal dashboard. Access is by invite — if your email is on the
          team list, we'll send you a magic link.
        </p>

        {sent ? (
          <div className="rounded-lg bg-clover-50 border border-clover-200 px-4 py-4 text-[13.5px] text-clover-800">
            <div className="font-medium mb-1">Check your email.</div>
            <div className="text-clover-700 text-[12.5px]">
              We sent the sign-in link{import.meta.env.VITE_DASHBOARD_SURFACE === 'admin' ? 's' : ''} to{' '}
              <span className="font-mono">{email}</span>. The link
              {import.meta.env.VITE_DASHBOARD_SURFACE === 'admin' ? 's work' : ' works'} for 60 minutes.
            </div>
          </div>
        ) : (
          <form onSubmit={handle} className="space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@cloverdigital.com"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-cream-300 bg-cream-100 focus:bg-white focus:border-clover-500 outline-none text-[14px] text-ink-900 transition"
              />
            </label>
            {error && (
              <div className="text-[12.5px] text-rust-500 bg-ochre-100 border border-ochre-300 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || email.length === 0}
              className="w-full px-4 py-2.5 rounded-full bg-clover-800 text-white text-[14px] font-medium hover:bg-clover-900 transition disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send magic link →'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-cream-300/70 text-[11px] text-ink-400">
          Internal use only. Springfield, IL.
        </div>
      </div>
    </div>
  )
}

function CloverMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
      <g fill="#1f4d35">
        <ellipse cx="11" cy="11" rx="6" ry="6" />
        <ellipse cx="21" cy="11" rx="6" ry="6" />
        <ellipse cx="11" cy="21" rx="6" ry="6" />
        <ellipse cx="21" cy="21" rx="6" ry="6" />
      </g>
      <rect x="15.4" y="14" width="1.2" height="14" fill="#1f4d35" rx="0.6" />
    </svg>
  )
}
