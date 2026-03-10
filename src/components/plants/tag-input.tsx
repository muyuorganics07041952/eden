"use client"

import { useState, useCallback } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  disabled?: boolean
}

export function TagInput({
  value,
  onChange,
  maxTags = 10,
  placeholder = "Tag eingeben, Enter zum Hinzufuegen",
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addTags = useCallback(
    (raw: string) => {
      const newTags = raw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const current = [...value]
      for (const tag of newTags) {
        if (current.length >= maxTags) break
        // Deduplicate case-insensitively
        const exists = current.some(
          (existing) => existing.toLowerCase() === tag.toLowerCase()
        )
        if (!exists) {
          current.push(tag)
        }
      }
      onChange(current)
      setInputValue("")
    },
    [value, onChange, maxTags]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (inputValue.trim()) {
        addTags(inputValue)
      }
    }
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addTags(inputValue)
    }
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Tag "${tag}" entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {value.length < maxTags && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={disabled ? "" : placeholder}
          disabled={disabled}
          aria-label="Neuen Tag eingeben"
        />
      )}
      {value.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximal {maxTags} Tags erreicht
        </p>
      )}
    </div>
  )
}
