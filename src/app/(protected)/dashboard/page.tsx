import { createClient } from '@/lib/supabase/server'
import { Leaf } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'Gärtner'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hallo, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Willkommen in deinem Garten.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-4 rounded-full">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Dein Garten wartet</CardTitle>
          <CardDescription>
            Füge deine erste Pflanze hinzu und beginne deinen digitalen Garten aufzubauen.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/plants">Erste Pflanze anlegen</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
