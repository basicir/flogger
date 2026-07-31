'use client'

import { useState, useEffect, useRef } from 'react'
import { flQuery, Q_CUSTOMERS } from '@/lib/fl-client'

interface Customer {
  id: string
  callsign: string
  name: string
  email?: string
}

interface Props {
  onClose: () => void
  onPinned: () => void
  pinnedCallsigns: string[]
}

export function SearchModal({ onClose, onPinned, pinnedCallsigns }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pinning, setPinning] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [students, setStudents] = useState<Customer[]>([])

  useEffect(() => {
    inputRef.current?.focus()

    const loadStudents = async () => {
      setLoading(true); setError('')
      try {
        const data = await flQuery<{ users: { nodes: { id: string; callSign: string; firstName: string; lastName: string; contact?: { email?: string } }[] } }>(Q_CUSTOMERS)
        const mapped = (data.users?.nodes ?? []).map(u => ({
          id: u.id,
          callsign: u.callSign ?? '',
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown',
          email: u.contact?.email
        }))
        setStudents(mapped)
        setResults(mapped)
      } catch (err: unknown) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults(students)
      return
    }
    const filtered = students.filter(s =>
      s.callsign.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
    )
    setResults(filtered)
  }, [query, students])

  const handlePin = async (customer: Customer) => {
    setPinning(customer.callsign)
    try {
      await fetch('/api/pinned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callsign: customer.callsign,
          display_name: customer.name,
          flightlogger_user_id: customer.id,
        }),
      })
      onPinned()
    } finally {
      setPinning(null)
    }
  }

  const isPinned = (callsign: string) => pinnedCallsigns.includes(callsign)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Find Student</h3>
            <p style={{ fontSize: '0.875rem', marginTop: 2 }}>
              Search by callsign to find and pin students
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ fontSize: '1.25rem' }}>
            ×
          </button>
        </div>

        <div className="modal-body" style={{ paddingBottom: 8 }}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: '1rem', pointerEvents: 'none',
              }}>🔍</span>
              <input
                ref={inputRef}
                className="form-input mono"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="HASMB, G-ABCD..."
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Results */}
          <div style={{ minHeight: 200, maxHeight: 360, overflowY: 'auto' }}>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
                ))}
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            {!loading && !error && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.4 }}>🔍</div>
                <p>
                  {query
                    ? `No students found for "${query}"`
                    : 'No students found on this FlightLogger account.'}
                </p>
              </div>
            )}

            {results.map(customer => (
              <div key={customer.id} className="search-result-item">
                <div
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#fff', fontSize: '0.875rem', flexShrink: 0,
                  }}
                >
                  {customer.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {customer.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {customer.callsign}
                  </div>
                </div>
                {isPinned(customer.callsign) ? (
                  <span className="badge badge-accent">Pinned</span>
                ) : (
                  <button
                    onClick={() => handlePin(customer)}
                    disabled={pinning === customer.callsign}
                    className="btn btn-primary btn-sm"
                  >
                    {pinning === customer.callsign ? '⟳' : '📌 Pin'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
