"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
  prompt(): Promise<void>
}

interface PwaInstallContextValue {
  canInstall: boolean
  isInstalled: boolean
  triggerInstall: () => Promise<"accepted" | "dismissed" | "unavailable">
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  triggerInstall: async () => "unavailable",
})

export function usePwaInstall() {
  return useContext(PwaInstallContext)
}

function checkStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  )
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setIsInstalled(checkStandalone())

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    function handleAppInstalled() {
      setCanInstall(false)
      setIsInstalled(true)
      deferredPromptRef.current = null
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function triggerInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    const prompt = deferredPromptRef.current
    if (!prompt) return "unavailable"

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    deferredPromptRef.current = null
    setCanInstall(false)

    if (outcome === "accepted") {
      setIsInstalled(true)
    }

    return outcome
  }

  return (
    <PwaInstallContext.Provider value={{ canInstall, isInstalled, triggerInstall }}>
      {children}
    </PwaInstallContext.Provider>
  )
}
