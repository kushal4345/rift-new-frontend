"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RiskBadge } from "@/components/pgx/risk-badge"
import { ConfidenceMeter } from "@/components/pgx/confidence-meter"
import {
  ArrowLeft,
  Stethoscope,
  User,
  Loader2,
  AlertCircle,
  Dna,
  Pill,
  ShieldCheck,
  BookOpen,
  Cog,
  MessageCircle,
  HeartPulse,
} from "lucide-react"
import Link from "next/link"
import type { RiskLabel, ExplanationInput } from "@/lib/pgx/types"

interface Explanation {
  summary: string
  mechanism: string
  clinical_meaning: string
  safety_advice: string
  when_to_consult: string
}

interface ExplanationResponse {
  explanation: {
    clinician: Explanation
    patient: Explanation
  }
  input: ExplanationInput
  success: boolean
}

function ExplanationContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<ExplanationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExplanation() {
      const drug = searchParams.get("drug")
      const gene = searchParams.get("gene")
      const phenotype = searchParams.get("phenotype")
      const risk_label = searchParams.get("risk_label")
      const severity = searchParams.get("severity")
      const confidence_score = searchParams.get("confidence_score")
      const cpic_level = searchParams.get("cpic_level")
      const preferred_language = searchParams.get("preferred_language")

      if (!drug || !gene || !phenotype || !risk_label || !severity || !confidence_score || !cpic_level || !preferred_language) {
        setError("Missing required parameters. Please navigate from the analysis page.")
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/explanation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drug,
            gene,
            phenotype,
            risk_label,
            severity,
            confidence_score: parseFloat(confidence_score),
            cpic_level,
            preferred_language,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          setError(json.error?.message || "Failed to generate explanation.")
          return
        }

        setData(json as ExplanationResponse)
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchExplanation()
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating explanation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-card">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive text-center">{error}</p>
          <Link
            href="/"
            className="text-sm text-primary hover:underline"
          >
            Back to Analysis
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { explanation, input } = data

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">{input.drug}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {input.gene} - {input.phenotype}
                </p>
              </div>
            </div>
            <RiskBadge riskLabel={input.risk_label as RiskLabel} size="lg" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryField label="Gene" value={input.gene} icon={Dna} />
            <SummaryField label="Phenotype" value={input.phenotype} icon={Cog} />
            <SummaryField label="CPIC Level" value={input.cpic_level} icon={BookOpen} />
            <SummaryField label="Severity" value={input.severity} icon={ShieldCheck} />
          </div>
          <ConfidenceMeter score={input.confidence_score} />
        </CardContent>
      </Card>

      {/* Explanation Tabs */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <Tabs defaultValue="clinician">
            <TabsList className="w-full bg-secondary">
              <TabsTrigger value="clinician" className="flex-1 gap-2">
                <Stethoscope className="h-4 w-4" />
                Clinician View
              </TabsTrigger>
              <TabsTrigger value="patient" className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Patient View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinician" className="mt-6">
              <ExplanationView explanation={explanation.clinician} variant="clinician" />
            </TabsContent>

            <TabsContent value="patient" className="mt-6">
              <ExplanationView explanation={explanation.patient} variant="patient" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Language Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          {input.preferred_language}
        </Badge>
        <span>
          Drug names, gene symbols, and phenotype codes are not translated per clinical standards.
        </span>
      </div>
    </div>
  )
}

function ExplanationView({
  explanation,
  variant,
}: {
  explanation: Explanation
  variant: "clinician" | "patient"
}) {
  return (
    <div className="flex flex-col gap-5">
      <ExplanationSection
        icon={MessageCircle}
        title={variant === "clinician" ? "Clinical Summary" : "Summary"}
        content={explanation.summary}
      />
      <Separator className="bg-border" />
      <ExplanationSection
        icon={Cog}
        title="Mechanism"
        content={explanation.mechanism}
      />
      <Separator className="bg-border" />
      <ExplanationSection
        icon={BookOpen}
        title="Clinical Meaning"
        content={explanation.clinical_meaning}
      />
      <Separator className="bg-border" />
      <ExplanationSection
        icon={ShieldCheck}
        title="Safety Advice"
        content={explanation.safety_advice}
      />
      <Separator className="bg-border" />
      <ExplanationSection
        icon={HeartPulse}
        title="When to Consult"
        content={explanation.when_to_consult}
      />
    </div>
  )
}

function ExplanationSection({
  icon: Icon,
  title,
  content,
}: {
  icon: React.ElementType
  title: string
  content: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className="rounded-md bg-secondary/30 p-3 text-sm text-foreground leading-relaxed">
        {content}
      </p>
    </div>
  )
}

function SummaryField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export default function ExplanationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Analysis
          </Link>
          <Separator orientation="vertical" className="h-5 bg-border" />
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Detailed Explanation
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          }
        >
          <ExplanationContent />
        </Suspense>

        <footer className="flex flex-col items-center gap-1 pb-8 pt-4">
          <p className="text-xs text-muted-foreground text-center">
            For clinical decision support only. Not a diagnostic tool.
          </p>
        </footer>
      </main>
    </div>
  )
}
