'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { flQuery, Q_FLIGHTS } from '@/lib/fl-client'

interface Flight {
  id: string
  date: string
  totalTime: number
  departureName?: string
  arrivalName?: string
  aircraftRegistration?: string
}

interface Props {
  callsign: string
  displayName: string
  flightloggerId?: string
  onUnpin: () => void
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function StudentCard({ callsign, displayName, flightloggerId, onUnpin }: Props) {
  const router = useRouter()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchFlights = useCallback(async () => {
    if (!flightloggerId) { setLoading(false); return }
    try {
      setLoading(true); setError('')
      const data = await flQuery<{ flights: Flight[] }>(Q_FLIGHTS, { userId: flightloggerId })
      setFlights(data.flights ?? [])
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [flightloggerId])

  useEffect(() => { fetchFlights() }, [fetchFlights])

  const totalMinutes = flights.reduce((sum, f) => sum + (f.totalTime ?? 0), 0)
  const lastFlight = flights[0]
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    router.push(`/student/${encodeURIComponent(callsign)}`)
  }

  return (
    <div className="student-card" onClick={handleCardClick}>
      <div className="student-card-header">
        <div className="student-avatar">{initials}</div>
        <div className="student-info">
          <div className="student-name">{displayName}</div>
          <div className="student-callsign">{callsign}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onUnpin() }}
          className="btn btn-ghost btn-sm"
          title="Unpin student"
          style={{ padding: '4px 8px', fontSize: '1rem', lineHeight: 1 }}
        >
          📌
        </button>
      </div>

      {/* Stats */}
      <div className="student-card-stats">
        <div className="stat-cell">
          <div className="stat-label">Total Hours</div>
          <div className="stat-value">
            {loading
              ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 20 }} />
              : !flightloggerId ? '—'
              : formatHours(totalMinutes)
            }
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Flights</div>
          <div className="stat-value">
            {loading
              ? <span className="skeleton" style={{ display: 'inline-block', width: 40, height: 20 }} />
              : !flightloggerId ? '—'
              : flights.length
            }
          </div>
        </div>
      </div>

      {/* Last flight */}
      <div className="student-card-footer">
        <div style={{ fontSize: '0.8125rem' }}>
          {loading ? (
            <span className="skeleton" style={{ display: 'inline-block', width: 120, height: 12 }} />
          ) : lastFlight ? (
            <span className="text-secondary">
              Last: {new Date(lastFlight.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {lastFlight.departureName && ` · ${lastFlight.departureName}`}
              {lastFlight.arrivalName && ` → ${lastFlight.arrivalName}`}
            </span>
          ) : !flightloggerId ? (
            <span className="text-muted">No FlightLogger ID linked</span>
          ) : error ? (
            <span className="text-red" style={{ fontSize: '0.75rem' }}>⚠ {error}</span>
          ) : (
            <span className="text-muted">No flights yet</span>
          )}
        </div>
        {!loading && !error && (
          <button
            onClick={(e) => { e.stopPropagation(); fetchFlights() }}
            className="btn btn-ghost btn-sm"
            title="Refresh"
            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
          >
            ⟳
          </button>
        )}
      </div>
    </div>
  )
}
