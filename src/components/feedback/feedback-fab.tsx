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
        size="icon"
        className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg sm:bottom-6 sm:right-6"
        onClick={handleOpen}
        aria-label="Feedback geben"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>

      <FeedbackSheet open={open} onOpenChange={setOpen} pageUrl={pageUrl} />
    </>
  )
}
