"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { SUPPORTED_DRUGS } from "@/lib/pgx/types"

interface DrugInputProps {
  value: string
  onChange: (val: string) => void
  error?: string
}

export function DrugInput({ value, onChange, error }: DrugInputProps) {
  const [focused, setFocused] = useState(false)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val.length <= 100) {
        onChange(val)
      }
    },
    [onChange]
  )

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="drug-input" className="text-sm font-medium text-foreground">
        Drug Name(s)
      </label>
      <Input
        id="drug-input"
        placeholder="e.g., Codeine, Warfarin"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        maxLength={100}
        aria-describedby="drug-help"
      />
      <div className="flex items-center justify-between">
        <p id="drug-help" className="text-xs text-muted-foreground">
          Comma-separated. Max 100 characters.
        </p>
        <span className="text-xs text-muted-foreground">
          {value.length}/100
        </span>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {SUPPORTED_DRUGS.map((drug) => (
          <Badge
            key={drug}
            variant="outline"
            className="cursor-pointer text-xs transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/40"
            onClick={() => {
              const existing = value
                .split(",")
                .map((d) => d.trim())
                .filter((d) => d.length > 0)
              if (!existing.some((d) => d.toLowerCase() === drug.toLowerCase())) {
                const newVal = existing.length > 0 ? `${value}, ${drug}` : drug
                if (newVal.length <= 100) {
                  onChange(newVal)
                }
              }
            }}
          >
            {drug}
          </Badge>
        ))}
      </div>
    </div>
  )
}
