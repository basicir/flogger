'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StudentCard } from '@/components/StudentCard'
import { SearchModal } from '@/components/SearchModal'

interface PinnedStudent {
  id: string
  callsign: string
  display_name: string
  flightlogger_user_id?: string
  pinned_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [pinned, setPinned] = useState<PinnedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(true)

  const fetchPinned = useCallback(async () => {
    const res = await fetch('/api/pinned')
    if (res.ok) {
      const { pinned } = await res.json()
      setPinned(pinned)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      // Check if API key exists
      fetch('/api/profile').then(r => r.json()).then(({ profile }) => {
        setHasApiKey(!!profile?.flightlogger_api_key)
      })
      fetchPinned().finally(() => setLoading(false))
    })
  }, [supabase, router, fetchPinned])

  const handleUnpin = async (callsign: string) => {
    await fetch('/api/pinned', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callsign }),
    })
    setPinned(prev => prev.filter(s => s.callsign !== callsign))
  }

  const handlePinned = () => {
    fetchPinned()
  }

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2 className="page-title">Student Dashboard</h2>
            <p className="page-subtitle">
              {pinned.length} student{pinned.length !== 1 ? 's' : ''} pinned
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setSearchOpen(true)}
              className="btn btn-primary"
            >
              <span>🔍</span> Find Student
            </button>
          </div>
        </div>

        {/* No API key warning */}
        {!hasApiKey && (
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            <span>🔑</span>
            <span>
              You haven&apos;t added your FlightLogger API key yet.{' '}
              <a href="/settings" style={{ fontWeight: 600, textDecoration: 'underline' }}>
                Add it in Settings
              </a>{' '}
              to start fetching live data.
            </span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="student-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ height: 220 }}>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                  <div className="skeleton" style={{ height: 16, width: '60%' }} />
                  <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : pinned.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✈</div>
            <h3 style={{ marginBottom: 8 }}>No students pinned yet</h3>
            <p style={{ marginBottom: 24 }}>
              Search for a student by callsign and pin them to track their progress.
            </p>
            <button
              onClick={() => setSearchOpen(true)}
              className="btn btn-primary"
            >
              🔍 Find Your First Student
            </button>
          </div>
        ) : (
          <div className="student-grid">
            {pinned.map(student => (
              <StudentCard
                key={student.callsign}
                callsign={student.callsign}
                displayName={student.display_name}
                flightloggerId={student.flightlogger_user_id}
                onUnpin={() => handleUnpin(student.callsign)}
              />
            ))}
          </div>
        )}
      </div>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onPinned={handlePinned}
          pinnedCallsigns={pinned.map(p => p.callsign)}
        />
      )}
    </div>
  )
}
