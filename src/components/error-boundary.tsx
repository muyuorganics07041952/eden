"use client"

import { Component, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-destructive/60" />
          </div>
          <h2 className="text-lg font-medium mb-1">Etwas ist schiefgelaufen</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ein unerwarteter Fehler ist aufgetreten.
          </p>
          <Button variant="outline" onClick={this.handleReset}>
            Erneut versuchen
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
