/**
 * Client-side helper that calls our server-side FlightLogger proxy.
 * The actual API key is never exposed to the browser.
 */
export async function flQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch('/api/flightlogger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'FlightLogger API error')
  return json.data as T
}

// ── Shared query strings ─────────────────────────────────────────────────

export const Q_ACCOUNT = `
  query {
    account {
      company
    }
  }
`

export const Q_CUSTOMERS = `
  query SearchUsers($callSign: String) {
    users(callSign: $callSign) {
      nodes {
        id
        callSign
        name
        email
      }
    }
  }
`

export const Q_FLIGHTS = `
  query GetFlights($userId: ID, $page: Int) {
    flights(userId: $userId, page: $page) {
      id
      date
      aircraftRegistration
      departureName
      arrivalName
      totalTime
      picTime
      dualTime
      soloTime
      nightTime
      ifrTime
      instructorName
      remarks
    }
  }
`

export const Q_BOOKINGS = `
  query GetBookings($userId: ID) {
    bookings(userId: $userId) {
      id
      startAt
      endAt
      kind
      status
      aircraftRegistration
    }
  }
`

export const Q_TRAININGS = `
  query GetTrainings($userId: ID) {
    trainings(userId: $userId) {
      id
      name
      status
      completedAt
    }
  }
`

export const Q_USER_PROGRAMS = `
  query GetUserPrograms($userId: ID) {
    userPrograms(userId: $userId) {
      id
      name
      progressPercent
      status
    }
  }
`
