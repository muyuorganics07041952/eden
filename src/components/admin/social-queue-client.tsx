"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, ExternalLink, Clock, History, Send } from "lucide-react"

interface QueueItem {
  id: string
  platform: string
  type: string
  target: string | null
  source_url: string | null
  source_title: string | null
  source_body: string | null
  generated_content: string
  image_url: string | null
  status: string
  created_at: string
  approved_at: string | null
  posted_at: string | null
  posted_url: string | null
}

interface Props {
  initialPending: QueueItem[]
  initialApproved: QueueItem[]
  initialHistory: QueueItem[]
}

export function SocialQueueClient({ initialPending, initialApproved, initialHistory }: Props) {
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [history] = useState(initialHistory)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approve' | 'reject', content?: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/admin/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, edited_content: content }),
      })
      if (!res.ok) return

      const { item } = await res.json()

      if (action === 'approve') {
        setPending(p => p.filter(x => x.id !== id))
        setApproved(a => [item, ...a])
      } else {
        setPending(p => p.filter(x => x.id !== id))
      }
      setEditingId(null)
    } finally {
      setLoading(null)
    }
  }

  function startEdit(item: QueueItem) {
    setEditingId(item.id)
    setEditedContent(item.generated_content)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          Social Media Queue
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generierte Posts genehmigen oder ablehnen.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pending.length}</div>
            <div className="text-xs text-muted-foreground">Warten auf Genehmigung</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{approved.length}</div>
            <div className="text-xs text-muted-foreground">Genehmigt, noch nicht gepostet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{history.length}</div>
            <div className="text-xs text-muted-foreground">Veröffentlicht</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Genehmigt
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">Keine Posts in der Warteschlange.</CardContent></Card>
          ) : (
            pending.map(item => (
              <QueueCard
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                editedContent={editedContent}
                isLoading={loading === item.id}
                onEdit={() => startEdit(item)}
                onEditChange={setEditedContent}
                onApprove={() => handleAction(item.id, 'approve', editingId === item.id ? editedContent : undefined)}
                onReject={() => handleAction(item.id, 'reject')}
                onCancelEdit={() => setEditingId(null)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approved.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">Keine genehmigten Posts.</CardContent></Card>
          ) : (
            approved.map(item => <HistoryCard key={item.id} item={item} />)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {history.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">Noch nichts veröffentlicht.</CardContent></Card>
          ) : (
            history.map(item => <HistoryCard key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QueueCard({
  item, isEditing, editedContent, isLoading,
  onEdit, onEditChange, onApprove, onReject, onCancelEdit
}: {
  item: QueueItem
  isEditing: boolean
  editedContent: string
  isLoading: boolean
  onEdit: () => void
  onEditChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  onCancelEdit: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformBadge platform={item.platform} type={item.type} />
            {item.target && <Badge variant="outline" className="text-xs">{item.target}</Badge>}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(item.created_at).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.source_title && (
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Quelle</div>
            <div className="font-medium line-clamp-2">{item.source_title}</div>
            {item.source_body && <div className="text-muted-foreground line-clamp-3 text-xs">{item.source_body}</div>}
            {item.source_url && (
              <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="h-3 w-3" /> Reddit öffnen
              </a>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generierter Inhalt</div>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={e => onEditChange(e.target.value)}
              className="min-h-[120px] text-sm"
              autoFocus
            />
          ) : (
            <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{item.generated_content}</div>
          )}
        </div>

        {item.image_url && (
          <img src={item.image_url} alt="Pin Vorschau" className="rounded-md max-h-48 object-cover" />
        )}

        <div className="flex gap-2 flex-wrap">
          {isEditing ? (
            <>
              <Button size="sm" onClick={onApprove} disabled={isLoading} className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Bearbeitet genehmigen
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>Abbrechen</Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={onApprove} disabled={isLoading} className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Genehmigen
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit} disabled={isLoading}>
                Bearbeiten
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject} disabled={isLoading} className="gap-1">
                <XCircle className="h-4 w-4" /> Ablehnen
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function HistoryCard({ item }: { item: QueueItem }) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={item.platform} type={item.type} />
            {item.target && <Badge variant="outline" className="text-xs">{item.target}</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">
            {item.posted_at
              ? new Date(item.posted_at).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
              : new Date(item.approved_at ?? item.created_at).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })
            }
          </span>
        </div>
        <div className="text-sm line-clamp-3 text-muted-foreground">{item.generated_content}</div>
        {item.posted_url && (
          <a href={item.posted_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1 hover:underline">
            <ExternalLink className="h-3 w-3" /> Post ansehen
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function PlatformBadge({ platform, type }: { platform: string; type: string }) {
  const color = platform === 'reddit'
    ? 'bg-orange-100 text-orange-700 border-orange-200'
    : 'bg-red-100 text-red-700 border-red-200'

  return (
    <Badge variant="outline" className={`text-xs font-medium ${color}`}>
      {platform === 'reddit' ? '🟠' : '📌'} {platform} · {type}
    </Badge>
  )
}
