import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-eyebrow">
            ✈ Powered by FlightLogger API
          </div>
          <h1 className="hero-title">
            The Instructor&apos;s Dashboard<br />for FlightLogger
          </h1>
          <p className="hero-sub">
            Track your students&apos; flight hours, training progress, and recent bookings — all in one place. Pin any student by callsign and monitor their journey in real-time.
          </p>
          <div className="hero-cta">
            <Link href="/auth?tab=register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <Link href="/auth" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>

        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📌</div>
              <div className="feature-title">Pin Students</div>
              <p style={{ fontSize: '0.9rem', marginTop: 6 }}>
                Search any student by callsign and pin them to your personal dashboard for quick access.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Live Flight Data</div>
              <p style={{ fontSize: '0.9rem', marginTop: 6 }}>
                See total flight hours, recent flights, training status, and upcoming bookings directly from FlightLogger.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔑</div>
              <div className="feature-title">Your API Key</div>
              <p style={{ fontSize: '0.9rem', marginTop: 6 }}>
                Each instructor connects with their own FlightLogger API key. Data access mirrors your FlightLogger account permissions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <div className="feature-title">Secure by Design</div>
              <p style={{ fontSize: '0.9rem', marginTop: 6 }}>
                Your API key never reaches the browser — all FlightLogger calls are made server-side. Accounts protected by Supabase Auth.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
