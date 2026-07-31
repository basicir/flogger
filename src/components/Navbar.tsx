'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => pathname === href ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">✈</span>
          Flogger
        </Link>

        {user && (
          <div className="navbar-links">
            <Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link href="/settings" className={isActive('/settings')}>Settings</Link>
          </div>
        )}

        <div className="navbar-spacer" />

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">{user.email}</span>
            <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/auth" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link href="/auth?tab=register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
