import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/logout-button'
import { ErrorBoundary } from '@/components/error-boundary'
import { TasksNavLink } from '@/components/tasks-nav-link'
import { BottomNav } from '@/components/bottom-nav'
import { Leaf, Settings, Newspaper } from 'lucide-react'
import Link from 'next/link'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
            <Leaf className="h-5 w-5 text-primary" />
            Eden
          </Link>
          {/* Desktop-only navigation */}
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/plants" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Leaf className="h-4 w-4" />
              <span>Pflanzen</span>
            </Link>
            <TasksNavLink />
            <Link href="/feed" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Newspaper className="h-4 w-4" />
              <span>Feed</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span>Einstellungen</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {/* pb-20 on mobile to avoid content being hidden behind the bottom nav */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {/* Mobile bottom navigation – hidden on sm and above */}
      <BottomNav />
    </div>
  )
}
