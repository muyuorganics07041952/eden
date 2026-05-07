"use client"

import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackSheet } from "@/components/feedback/feedback-sheet"

export function FeedbackFab() {
  const [open, setOpen] = useState(false)
  const [pageUrl, setPageUrl] = useState("")

  function handleOpen() {
    setPageUrl(window.location.href)
    setOpen(true)
  }

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 z-40 h-11 rounded-full shadow-lg px-4 gap-2 sm:bottom-6 sm:right-6 touch-manipulation"
        onClick={handleOpen}
        aria-label="Feedback geben"
      >
        <MessageSquarePlus className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Feedback</span>
      </Button>

      <FeedbackSheet open={open} onOpenChange={setOpen} pageUrl={pageUrl} />
    </>
  )
}
