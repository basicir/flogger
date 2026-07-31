const FLIGHTLOGGER_API = 'https://api.flightlogger.net/graphql'

export async function flightloggerQuery<T = unknown>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(FLIGHTLOGGER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`FlightLogger API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_USERS_BY_CALLSIGN = `
  query GetUsersByCallsign($callsign: String!) {
    users(callsign: $callsign) {
      id
      callsign
      name
      email
    }
  }
`

export const GET_USER_DETAILS = `
  query GetUserDetails($id: ID!) {
    user(id: $id) {
      id
      callsign
      name
      email
    }
  }
`

export const GET_FLIGHTS = `
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

export const GET_MY_ACCOUNT = `
  query GetMyAccount {
    account {
      id
      name
      callsign
    }
  }
`

export const GET_CUSTOMERS = `
  query GetCustomers($callsign: String) {
    customers(callsign: $callsign) {
      id
      callsign
      name
      email
    }
  }
`

export const GET_CUSTOMER = `
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      callsign
      name
      email
    }
  }
`

export const GET_TRAININGS = `
  query GetTrainings($userId: ID) {
    trainings(userId: $userId) {
      id
      name
      completedAt
      status
    }
  }
`

export const GET_BOOKINGS = `
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
