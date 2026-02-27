'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Abmelden"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline ml-1.5">Abmelden</span>
    </Button>
  )
}
