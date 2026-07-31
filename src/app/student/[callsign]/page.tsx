'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { flQuery, Q_STUDENT, Q_FLIGHTS, Q_BOOKINGS } from '@/lib/fl-client'
import { createClient } from '@/lib/supabase/client'

interface Customer { id: string; callsign: string; name: string; email?: string }
interface Flight {
  id: string
  date: string
  totalTime: number
  picTime: number
  dualTime: number
  soloTime: number
  nightTime: number
  ifrTime: number
  aircraftRegistration?: string
  departureName?: string
  arrivalName?: string
  instructorName?: string
  remarks?: string
}
interface Booking {
  id: string
  startsAt?: string
  endsAt?: string
  status?: string
  comment?: string
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'badge-green'
    case 'cancelled': return 'badge-red'
    default: return 'badge-muted'
  }
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const callsign = decodeURIComponent(params.callsign as string)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'flights' | 'bookings'>('flights')

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const custData = await flQuery<{ users: { nodes: { id: string; callSign: string; firstName: string; lastName: string; contact?: { email?: string } }[] } }>(
        Q_STUDENT,
        { callSign: callsign }
      )
      const firstNode = (custData.users?.nodes ?? []).find(
        u => u.callSign?.toLowerCase() === callsign.toLowerCase()
      )
      if (!firstNode) { setError('Student not found in FlightLogger.'); setLoading(false); return }
      const cust: Customer = {
        id: firstNode.id,
        callsign: firstNode.callSign ?? '',
        name: `${firstNode.firstName ?? ''} ${firstNode.lastName ?? ''}`.trim() || 'Unknown',
        email: firstNode.contact?.email
      }
      setCustomer(cust)

      const [flightData, bookingData] = await Promise.all([
        flQuery<{ user?: { flights?: { nodes: Flight[] } } }>(Q_FLIGHTS, { userId: cust.id }),
        flQuery<{ bookings?: { nodes: Booking[] } }>(Q_BOOKINGS),
      ])
      setFlights(flightData.user?.flights?.nodes ?? [])
      setBookings(bookingData.bookings?.nodes ?? [])
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [callsign])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      fetchData()
    })
  }, [supabase, router, fetchData])

  const totalHours = flights.reduce((s, f) => s + (f.totalTime ?? 0), 0)
  const totalPIC = flights.reduce((s, f) => s + (f.picTime ?? 0), 0)
  const totalDual = flights.reduce((s, f) => s + (f.dualTime ?? 0), 0)
  const totalNight = flights.reduce((s, f) => s + (f.nightTime ?? 0), 0)
  const totalIFR = flights.reduce((s, f) => s + (f.ifrTime ?? 0), 0)
  const initials = customer?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="page">
      <div className="container">
        {/* Back */}
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
          ← Back
        </button>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          </div>
        ) : error ? (
          <div className="alert alert-error">⚠ {error}</div>
        ) : customer ? (
          <>
            {/* Student header */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-body">
                <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.5rem', color: '#fff', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <h2 style={{ marginBottom: 4 }}>{customer.name}</h2>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-accent" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {customer.callsign}
                      </span>
                      {customer.email && (
                        <span className="text-secondary text-sm">{customer.email}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button onClick={fetchData} className="btn btn-secondary btn-sm">⟳ Refresh</button>
                  </div>
                </div>

                {/* Summary stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 12,
                  marginTop: 24,
                  padding: 20,
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}>
                  {[
                    { label: 'Total', value: formatHours(totalHours) },
                    { label: 'PIC', value: formatHours(totalPIC) },
                    { label: 'Dual', value: formatHours(totalDual) },
                    { label: 'Night', value: formatHours(totalNight) },
                    { label: 'IFR', value: formatHours(totalIFR) },
                    { label: 'Flights', value: flights.length },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div className="stat-label">{label}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              {(['flights', 'bookings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
                  style={{ textTransform: 'capitalize' }}
                >
                  {tab === 'flights' ? `✈ Flights (${flights.length})` : `📅 Bookings (${bookings.length})`}
                </button>
              ))}
            </div>

            {/* Flights table */}
            {activeTab === 'flights' && (
              flights.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✈</div>
                  <p>No flights recorded yet.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Aircraft</th>
                        <th>Route</th>
                        <th>Total</th>
                        <th>PIC</th>
                        <th>Dual</th>
                        <th>Night</th>
                        <th>Instructor</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map(f => (
                        <tr key={f.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="mono" style={{ color: 'var(--text-primary)' }}>{f.aircraftRegistration ?? '—'}</td>
                          <td>
                            {f.departureName && f.arrivalName
                              ? `${f.departureName} → ${f.arrivalName}`
                              : (f.departureName ?? f.arrivalName ?? '—')}
                          </td>
                          <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatHours(f.totalTime ?? 0)}</td>
                          <td>{formatHours(f.picTime ?? 0)}</td>
                          <td>{formatHours(f.dualTime ?? 0)}</td>
                          <td>{formatHours(f.nightTime ?? 0)}</td>
                          <td>{f.instructorName ?? '—'}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {f.remarks ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Bookings table */}
            {activeTab === 'bookings' && (
              bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <p>No bookings found.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Comment / Note</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {b.startsAt ? new Date(b.startsAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            {b.startsAt ? new Date(b.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            {' – '}
                            {b.endsAt ? new Date(b.endsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td>{b.comment || 'Booking'}</td>
                          <td>
                            <span className={`badge ${statusBadge(b.status ?? '')}`}>
                              {b.status ?? 'UNKNOWN'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
