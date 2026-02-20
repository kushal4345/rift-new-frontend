"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUPPORTED_LANGUAGES } from "@/lib/pgx/types"
import type { LanguageCode } from "@/lib/pgx/types"

interface LanguageSelectorProps {
  value: LanguageCode
  onChange: (val: LanguageCode) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const groups = SUPPORTED_LANGUAGES.reduce(
    (acc, lang) => {
      if (!acc[lang.group]) acc[lang.group] = []
      acc[lang.group].push(lang)
      return acc
    },
    {} as Record<string, typeof SUPPORTED_LANGUAGES[number][]>
  )

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Explanation Language
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as LanguageCode)}>
        <SelectTrigger className="bg-secondary border-border text-foreground">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {Object.entries(groups).map(([group, langs]) => (
            <SelectGroup key={group}>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </SelectLabel>
              {langs.map((lang) => (
                <SelectItem
                  key={lang.code}
                  value={lang.code}
                  className="text-foreground"
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
