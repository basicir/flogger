'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { flQuery, Q_ACCOUNT } from '@/lib/fl-client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      fetch('/api/profile')
        .then(r => r.json())
        .then(({ profile }) => {
          if (profile) {
            setDisplayName(profile.display_name ?? '')
            setApiKey(profile.flightlogger_api_key ?? '')
          }
          setLoading(false)
        })
    })
  }, [supabase, router])

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, flightlogger_api_key: apiKey }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    // First save the key
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightlogger_api_key: apiKey }),
    })
    try {
      const data = await flQuery<{ account: { company: string } }>(Q_ACCOUNT)
      setTestResult({
        ok: true,
        message: `✓ Connected successfully to account: ${data.account?.company ?? 'unknown'}`,
      })
    } catch (err: unknown) {
      setTestResult({ ok: false, message: (err as Error).message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 40 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your account and FlightLogger integration</p>

        {/* Profile Section */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <h3>Profile</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>
        </div>

        {/* FlightLogger API Key */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span style={{ fontSize: '1.25rem' }}>🔑</span>
            <div>
              <h3>FlightLogger API Key</h3>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert alert-info">
              <span>ℹ</span>
              <span>
                Generate your API key in FlightLogger under <strong>Settings → API</strong>.
                Your key is stored securely and never exposed to the browser.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input mono"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="fl_xxxxxxxxxxxxxxxxxxxxxxxx"
                  style={{ paddingRight: 100 }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    position: 'absolute',
                    right: 8, top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.75rem',
                  }}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              onClick={handleTest}
              disabled={testing || !apiKey}
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-start' }}
            >
              {testing ? '⟳ Testing...' : '🔌 Test Connection'}
            </button>

            {testResult && (
              <div className={`alert ${testResult.ok ? 'alert-success' : 'alert-error'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">⚠ {error}</div>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {saved && <div className="alert alert-success" style={{ flex: 1 }}>✓ Settings saved!</div>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? '⟳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
