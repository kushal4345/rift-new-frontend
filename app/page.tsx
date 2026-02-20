"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { VcfUploader } from "@/components/pgx/vcf-uploader"
import { DrugInput } from "@/components/pgx/drug-input"
import { LanguageSelector } from "@/components/pgx/language-selector"
import { ResultCard } from "@/components/pgx/result-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dna, FlaskConical, Loader2, AlertCircle, Activity, FileJson, Search } from "lucide-react"
import type { ClinicalOutput, LanguageCode } from "@/lib/pgx/types"

interface AnalysisResponse {
  results: ClinicalOutput[]
  errors: { code: string; message: string; drug?: string }[]
  success: boolean
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("vcf")
  const [vcfFile, setVcfFile] = useState<File | null>(null)
  const [drugInput, setDrugInput] = useState("")
  const [language, setLanguage] = useState<LanguageCode>("en-US")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ClinicalOutput[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const handleAnalyze = useCallback(async () => {
    setErrors([])
    setResults(null)

    if (activeTab === "vcf" && !vcfFile) {
      setErrors(["Please upload a VCF file for analysis."])
      return
    }

    if (activeTab === "text" && !drugInput.trim()) {
      setErrors(["Please enter at least one drug name for interpretation."])
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      if (activeTab === "vcf" && vcfFile) {
        formData.append("vcf", vcfFile)
      }
      formData.append("drugs", drugInput)
      formData.append("language", language)

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors([data.error?.message || "Analysis failed."])
        return
      }

      const response = data as AnalysisResponse

      if (response.errors?.length > 0) {
        setErrors(response.errors.map((e) => `${e.drug ? `[${e.drug}] ` : ""}${e.message}`))
      }

      if (response.results?.length > 0) {
        setResults(response.results)
      }
    } catch {
      setErrors(["Network error. Please try again."])
    } finally {
      setLoading(false)
    }
  }, [vcfFile, drugInput, language, activeTab])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Dna className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">PharmaGuard</h1>
              <p className="text-xs text-muted-foreground">Clinical Pharmacogenomics CDS</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Analysis Engine Online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <CardTitle>Analysis Configuration</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Select your analysis mode and provide the required clinical inputs.</p>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="vcf" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="vcf" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-background">
                  <FileJson className="mr-2 h-4 w-4" />
                  VCF Analysis
                </TabsTrigger>
                <TabsTrigger value="text" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-background">
                  <Search className="mr-2 h-4 w-4" />
                  Text Interpretation
                </TabsTrigger>
              </TabsList>
              <div className="p-6 flex flex-col gap-6">
                <TabsContent value="vcf" className="m-0 mt-0">
                  <VcfUploader onFileSelect={setVcfFile} />
                  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
                    <p className="font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Automated Drug Discovery
                    </p>
                    <p>When you upload a VCF, our engine will automatically detect and interpret all relevant drugs found in your profile.</p>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="m-0 mt-0 space-y-6">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary/80">
                    <p className="font-medium">Information Mode</p>
                    <p>Using text-based mode will simulate a reference genetic profile for the specified drug interpretation.</p>
                  </div>
                  <DrugInput value={drugInput} onChange={setDrugInput} />
                </TabsContent>

                <Separator />
                <LanguageSelector value={language} onChange={setLanguage} />

                {errors.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Clinical Data...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-5 w-5" />
                      {activeTab === "vcf" ? "Analyze Genome & Drugs" : "Interpret Drug Interaction"}
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        {results && results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Analysis Results</h2>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{results.length} Drug{results.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {results.map((result, i) => (
              <ResultCard key={i} result={result} language={language} />
            ))}
          </div>
        )}
        <footer className="pb-8 pt-4 flex flex-col items-center gap-2">
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground text-center max-w-prose">PharmaGuard is a clinical decision support system. Interpretations are based on CPIC® and PharmGKB guidelines. Final clinical decisions must be made by qualified healthcare professionals.</p>
          <p className="text-[10px] text-muted-foreground/40 font-mono">PGx-CORE v1.2.0 | ENGINE-2026-B</p>
        </footer>
      </main>
    </div>
  )
}
