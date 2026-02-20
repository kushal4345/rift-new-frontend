"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VcfUploaderProps {
  onFileSelect: (file: File | null) => void
  error?: string
}

const MAX_SIZE = 50 * 1024 * 1024

export function VcfUploader({ onFileSelect, error }: VcfUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string>("")

  const validateFile = useCallback((f: File): string | null => {
    const name = f.name.toLowerCase()
    if (!name.endsWith(".vcf") && !name.endsWith(".vcf.gz")) {
      return "Only .vcf and .vcf.gz files are accepted."
    }
    if (f.size > MAX_SIZE) {
      return "File must be under 50MB."
    }
    return null
  }, [])

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f)
      if (err) {
        setLocalError(err)
        setFile(null)
        onFileSelect(null)
        return
      }
      setLocalError("")
      setFile(f)
      onFileSelect(f)
    },
    [validateFile, onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setFile(null)
    setLocalError("")
    onFileSelect(null)
  }, [onFileSelect])

  const displayError = error || localError

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        VCF File Upload
      </label>
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/30",
            displayError && "border-destructive"
          )}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = ".vcf,.vcf.gz"
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement
              const f = target.files?.[0]
              if (f) handleFile(f)
            }
            input.click()
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload VCF file"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              const input = document.createElement("input")
              input.type = "file"
              input.accept = ".vcf,.vcf.gz"
              input.onchange = (ev) => {
                const target = ev.target as HTMLInputElement
                const f = target.files?.[0]
                if (f) handleFile(f)
              }
              input.click()
            }
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-foreground">
              Drop your VCF file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Accepts .vcf and .vcf.gz files up to 50MB
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}
