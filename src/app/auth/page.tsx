'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)

    const virtualEmail = `${username.trim().toLowerCase()}@flogger.local`

    try {
      if (tab === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: virtualEmail,
          password,
          options: { data: { display_name: displayName } },
        })
        if (error) throw error
        if (data.user) {
          // upsert profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: virtualEmail,
            display_name: displayName,
          })
          setSuccess('Account created! Redirecting...')
          setTimeout(() => router.push('/settings'), 1500)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: virtualEmail, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 16,
            boxShadow: '0 8px 24px var(--accent-glow)',
          }}>✈</div>
          <h2 style={{ marginBottom: 4 }}>
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            {tab === 'login'
              ? 'Sign in to your instructor dashboard'
              : 'Start tracking your students today'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '7px',
                border: 'none',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === t ? 'var(--bg-card)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tab === 'register' && (
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Instructor John"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="john"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="alert alert-error">⚠ {error}</div>}
              {success && <div className="alert alert-success">✓ {success}</div>}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ justifyContent: 'center', marginTop: 4 }}
              >
                {loading
                  ? <span>⟳ Loading...</span>
                  : tab === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
