"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RiskBadge } from "./risk-badge"
import { ConfidenceMeter } from "./confidence-meter"
import { JsonViewer } from "./json-viewer"
import { Pill, Dna, Activity, FileJson, ExternalLink } from "lucide-react"
import type { ClinicalOutput, RiskLabel } from "@/lib/pgx/types"
import Link from "next/link"

interface ResultCardProps {
  result: ClinicalOutput
  language: string
}

export function ResultCard({ result, language }: ResultCardProps) {
  const explanation = result.llm_generated_explanation;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground font-bold">{result.drug}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{result.patient_id}</p>
            </div>
          </div>
          <RiskBadge riskLabel={result.risk_assessment.risk_label as RiskLabel} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ConfidenceMeter score={result.risk_assessment.confidence_score} />

            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-card/50">
              <div className="flex items-center gap-2 mb-1">
                <Dna className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Molecular Profile</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Primary Gene" value={result.pharmacogenomic_profile.primary_gene} />
                <InfoField label="Diplotype" value={result.pharmacogenomic_profile.diplotype} mono />
                <InfoField label="Phenotype" value={result.pharmacogenomic_profile.phenotype} />
                <InfoField label="CPIC Guidance" value={`Level ${result.clinical_recommendation.cpic_level}`} />
              </div>

              {result.pharmacogenomic_profile.detected_variants.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Genomic Markers</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.pharmacogenomic_profile.detected_variants.map((v, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-[10px] bg-primary/5 hover:bg-primary/10">
                        {v.rsid} • {v.genotype}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Generated Explanation Section */}
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Clinical Insight</h4>
                </div>
                {result.quality_metrics.llm_failure_flag ? (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-200 bg-amber-50">Rule-Based</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-200 bg-emerald-50">AI Verified</Badge>
                )}
              </div>

              <div className="space-y-3">
                {explanation?.summary ? (
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {explanation.summary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No summary available.</p>
                )}

                {explanation?.mechanism && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Mechanism of Action</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {explanation.mechanism}
                    </p>
                  </div>
                )}

                {explanation?.detailed_explanation && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Clinical Action</div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {explanation.detailed_explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Clinical Recommendation Summary */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-muted-foreground uppercase opacity-70">Regulatory Recommendation</div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground leading-relaxed">
              {result.clinical_recommendation.recommendation_summary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-wrap gap-2">
            <QualityBadge label="VCF" ok={result.quality_metrics.vcf_parsing_success} />
            <QualityBadge label="STAR" ok={result.quality_metrics.star_allele_detection_success} />
            <QualityBadge label="PHENO" ok={result.quality_metrics.phenotype_assignment_success} />
            <QualityBadge label="AI" ok={!result.quality_metrics.llm_failure_flag} />
          </div>
          <div className="flex justify-end gap-2">
            {/* Collapsible JSON Viewer at bottom */}
            <div className="w-full">
              <JsonViewer data={result} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoField({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}

function QualityBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs ${ok ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}
    >
      {ok ? "+" : "-"} {label}
    </Badge>
  )
}
