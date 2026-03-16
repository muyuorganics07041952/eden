"use client"

import { useState, useCallback } from "react"
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { CommunityTip, CommunityTipComment } from "@/lib/types/community"

function formatTipDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Heute"
  if (diffDays === 1) return "Gestern"
  if (diffDays < 7) return `vor ${diffDays} Tagen`

  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  })
}

// Consistent avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-100 text-red-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-pink-100 text-pink-700",
    "bg-yellow-100 text-yellow-700",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface TipCardProps {
  tip: CommunityTip
  currentUserId: string
  onDeleted: (id: string) => void
  onLikeToggled: (id: string, liked: boolean, newCount: number) => void
}

export function TipCard({ tip, currentUserId, onDeleted, onLikeToggled }: TipCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Comments state
  const [comments, setComments] = useState<CommunityTipComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentsFetched, setCommentsFetched] = useState(false)
  const [localCommentsCount, setLocalCommentsCount] = useState(tip.comments_count)

  // New comment state
  const [newComment, setNewComment] = useState("")
  const [postingComment, setPostingComment] = useState(false)

  const isLong = tip.text.length > 150
  const isOwner = tip.user_id === currentUserId

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true)
    setCommentsError(null)
    try {
      const res = await fetch(`/api/community/tips/${tip.id}/comments`)
      if (!res.ok) throw new Error("Fehler beim Laden")
      const data: CommunityTipComment[] = await res.json()
      setComments(data)
      setCommentsFetched(true)
    } catch {
      setCommentsError("Kommentare konnten nicht geladen werden.")
    } finally {
      setCommentsLoading(false)
    }
  }, [tip.id])

  function handleToggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsFetched) {
      fetchComments()
    }
  }

  async function handleLike() {
    if (liking) return
    setLiking(true)

    // Optimistic update
    const prevLiked = tip.has_liked
    const prevCount = tip.likes_count
    const newLiked = !prevLiked
    const newCount = newLiked ? prevCount + 1 : prevCount - 1
    onLikeToggled(tip.id, newLiked, newCount)

    try {
      const res = await fetch(`/api/community/tips/${tip.id}/like`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Fehler")
      const data = await res.json()
      // Sync with server response
      onLikeToggled(tip.id, data.liked, data.likes_count)
    } catch {
      // Revert optimistic update
      onLikeToggled(tip.id, prevLiked, prevCount)
      toast.error("Fehler beim Liken.")
    } finally {
      setLiking(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/community/tips/${tip.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Fehler")
      onDeleted(tip.id)
      toast.success("Tipp geloescht.")
    } catch {
      toast.error("Fehler beim Loeschen.")
    } finally {
      setDeleting(false)
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || postingComment) return

    setPostingComment(true)
    try {
      const res = await fetch(`/api/community/tips/${tip.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
      })
      if (!res.ok) throw new Error("Fehler")
      const comment: CommunityTipComment = await res.json()
      setComments((prev) => [...prev, comment])
      setLocalCommentsCount((c) => c + 1)
      setNewComment("")
    } catch {
      toast.error("Kommentar konnte nicht gepostet werden.")
    } finally {
      setPostingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/community/tips/${tip.id}/comments/${commentId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Fehler")
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setLocalCommentsCount((c) => Math.max(0, c - 1))
    } catch {
      toast.error("Kommentar konnte nicht geloescht werden.")
    }
  }

  const avatarColor = getAvatarColor(tip.author_name)

  return (
    <Card>
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Author row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className={`text-xs ${avatarColor}`}>
                {tip.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">{tip.author_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatTipDate(tip.created_at)}
              </span>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Aktionen"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Wird geloescht..." : "Loeschen"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Photo */}
        {tip.photo_url && (
          <img
            src={tip.photo_url}
            alt="Tipp-Foto"
            className="w-full max-h-[200px] object-cover rounded-md"
            loading="lazy"
          />
        )}

        {/* Tip text */}
        <div>
          <p
            className={`text-sm whitespace-pre-wrap ${
              isLong && !expanded ? "line-clamp-3" : ""
            }`}
          >
            {tip.text}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {expanded ? "Weniger" : "Mehr lesen"}
            </button>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={tip.has_liked ? "Like entfernen" : "Liken"}
          >
            <Heart
              className={`h-4 w-4 ${
                tip.has_liked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {tip.likes_count > 0 && (
              <span className="text-xs">{tip.likes_count}</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleComments}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Kommentare anzeigen"
          >
            <MessageCircle className="h-4 w-4" />
            {localCommentsCount > 0 && (
              <span className="text-xs">{localCommentsCount}</span>
            )}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="space-y-3 pt-2 border-t">
            {commentsLoading ? (
              <CommentsSkeleton />
            ) : commentsError ? (
              <div className="flex items-center gap-2 text-sm text-destructive py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{commentsError}</span>
                <Button variant="ghost" size="sm" onClick={fetchComments}>
                  Erneut
                </Button>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Noch keine Kommentare.
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <Textarea
                placeholder="Kommentar schreiben..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={1}
                className="min-h-[36px] text-sm resize-none"
                aria-label="Kommentar schreiben"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="shrink-0 h-9 w-9"
                disabled={!newComment.trim() || postingComment}
                aria-label="Kommentar senden"
              >
                {postingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: CommunityTipComment
  currentUserId: string
  onDelete: (id: string) => void
}) {
  const isOwner = comment.user_id === currentUserId
  const avatarColor = getAvatarColor(comment.author_name)

  return (
    <div className="flex gap-2 group">
      <Avatar className="h-6 w-6 mt-0.5">
        <AvatarFallback className={`text-[10px] ${avatarColor}`}>
          {comment.author_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">{comment.author_name}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatTipDate(comment.created_at)}
          </span>
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
              aria-label="Kommentar loeschen"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-xs text-foreground whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
    </div>
  )
}

function CommentsSkeleton() {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
