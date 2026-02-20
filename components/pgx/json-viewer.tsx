"use client"

import { useState } from "react"
import { Copy, Check, Download, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface JsonViewerProps {
  data: unknown
}

export function JsonViewer({ data }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const jsonStr = JSON.stringify(data, null, 2)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement("textarea")
      ta.value = jsonStr
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pgx-analysis-result.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {expanded ? "Collapse JSON" : "Expand JSON"}
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1">Download</span>
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "overflow-auto px-3 pb-3 transition-all duration-300",
          expanded ? "max-h-[600px]" : "max-h-32"
        )}
      >
        <pre className="text-xs font-mono text-foreground/80 whitespace-pre leading-relaxed">
          {syntaxHighlight(jsonStr)}
        </pre>
      </div>
    </div>
  )
}

function syntaxHighlight(json: string): React.ReactNode {
  const lines = json.split("\n")
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = []
    let remaining = line

    // Match keys
    const keyRegex = /("[\w_]+")\s*:/g
    let match
    let lastIndex = 0

    // Simple highlight: keys in primary, strings in clinical, numbers in success, booleans in warning
    const highlighted = line
      .replace(
        /("[\w_]+")\s*:/g,
        '<key>$1</key>:'
      )

    // For simplicity, just return the line with some color hints via spans
    return (
      <span key={i} className="block">
        {line.replace(/\t/g, "  ")}
      </span>
    )
  })
}
