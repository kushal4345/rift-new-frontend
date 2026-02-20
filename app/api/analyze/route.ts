import { NextRequest, NextResponse } from "next/server"
import { AnalysisRequestSchema } from "@/lib/pgx/types"
import { API_CONFIG } from "@/lib/pgx/api-config"
import { validateVcf, VcfValidationError } from "@/lib/pgx/vcf-validator"
import { runAnalysisPipeline } from "@/lib/pgx/analysis-pipeline"
import { generateExplanation } from "@/lib/pgx/explanation-service"
import { SUPPORTED_DRUGS } from "@/lib/pgx/types"
import type { LanguageCode, ClinicalOutput, ExplanationInput } from "@/lib/pgx/types"

// ── Helper: call LLM for a SINGLE drug, with one retry on failure ──────────
async function fetchLlmExplanation(
  payload: object,
  retries = 1
): Promise<{ data: any | null; quotaExceeded: boolean; errorDetail?: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 3000))
      }

      const res = await fetch(API_CONFIG.LLM_REPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        const isQuota = body.includes("quota") || body.includes("429") || body.includes("exceeded")
        console.error(`[LLM] Attempt ${attempt + 1} status ${res.status}. Quota: ${isQuota}`)
        if (isQuota) {
          return { data: null, quotaExceeded: true, errorDetail: "Gemini API daily quota exceeded. LLM explanations will be available tomorrow." }
        }
        continue
      }

      const data = await res.json()
      console.log(`[LLM] Success for drug: ${(payload as any).drug}`)
      return { data, quotaExceeded: false }
    } catch (err) {
      console.error(`[LLM] Attempt ${attempt + 1} threw:`, err)
    }
  }
  return { data: null, quotaExceeded: false }
}

// ── Main API handler ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const vcfFile = formData.get("vcf") as File | null
    const drugsRaw = formData.get("drugs") as string | null
    const language = (formData.get("language") as string | null) ?? "en-US"

    // Validate schema fields
    const validation = AnalysisRequestSchema.safeParse({
      drugs: drugsRaw ?? "",
      language,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: validation.error.errors[0]?.message } },
        { status: 400 }
      )
    }

    const drugNames = (validation.data.drugs || "")
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0)

    if (!vcfFile && drugNames.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_DRUGS", message: "Drug names are required for text-based analysis." } },
        { status: 400 }
      )
    }

    const preferredLanguage = language as LanguageCode

    // ── Prepare VCF content ──────────────────────────────────────────────
    let vcfContent: string
    if (vcfFile) {
      try {
        validateVcf(vcfFile)
      } catch (err) {
        const msg = err instanceof VcfValidationError ? err.message : "VCF file validation failed."
        const code = err instanceof VcfValidationError ? err.code : "VCF_VALIDATE_ERROR"
        return NextResponse.json({ results: [], errors: [{ message: msg, code }], success: false })
      }
      vcfContent = await vcfFile.text()
    } else {
      vcfContent = `##fileformat=VCFv4.1\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE\nchr1\t1\t.\tA\tG\t.\t.\t.\tGT\t0/0`
    }

    // ── Which drugs to analyse ───────────────────────────────────────────
    const drugsToProcess = vcfFile
      ? drugNames.length > 0 ? drugNames : Array.from(SUPPORTED_DRUGS)
      : drugNames

    // ── Run internal pharmacogenomic analysis ────────────────────────────
    const { results: rawResults, errors } = runAnalysisPipeline(
      vcfContent,
      drugsToProcess,
      preferredLanguage
    )

    // ── For each drug result, call the external LLM API individually ─────
    const finalResults: ClinicalOutput[] = []
    let quotaExceededMessage: string | undefined
    let successfulLlmCount = 0

    for (const r of rawResults) {
      // 1. Generate localized baseline explanation using internal engine
      // This ensures even rule-based fallback is translated correctly.
      const expInput: ExplanationInput = {
        drug: r.drug,
        gene: r.pharmacogenomic_profile.primary_gene,
        phenotype: r.pharmacogenomic_profile.phenotype,
        risk_label: r.risk_assessment.risk_label,
        severity: r.risk_assessment.severity,
        confidence_score: r.risk_assessment.confidence_score,
        cpic_level: r.clinical_recommendation.cpic_level,
        preferred_language: preferredLanguage,
      }

      const internalExp = generateExplanation(expInput)
      const baselineExplanation = {
        summary: internalExp.clinician.summary,
        detailed_explanation: internalExp.clinician.clinical_meaning,
        mechanism: internalExp.clinician.mechanism,
      }

      // 2. Build minimal per-drug payload for external LLM
      const llmPayload = {
        drug: r.drug,
        gene: r.pharmacogenomic_profile.primary_gene,
        phenotype: r.pharmacogenomic_profile.phenotype,
        risk_label: r.risk_assessment.risk_label,
        severity: r.risk_assessment.severity,
        confidence_score: r.risk_assessment.confidence_score,
        cpic_level: r.clinical_recommendation.cpic_level,
        preferred_language: preferredLanguage,
      }

      const { data: llmResponse, quotaExceeded, errorDetail } = await fetchLlmExplanation(llmPayload, 1)

      let finalExplanation = baselineExplanation
      if (llmResponse?.llm_generated_explanation) {
        successfulLlmCount++
        const ext = llmResponse.llm_generated_explanation

        // Dynamic key mapping based on language code prefix (e.g., clinician_bn for bn-IN)
        const langPrefix = preferredLanguage.split("-")[0]
        const clinicianKey = `clinician_${langPrefix}`
        const patientKey = `patient_${langPrefix}`

        const summary = ext[clinicianKey] || ext.summary || baselineExplanation.summary
        const detailed = ext[clinicianKey] || ext.detailed_explanation || baselineExplanation.detailed_explanation
        const mechanism = ext.mechanism || baselineExplanation.mechanism

        finalExplanation = {
          summary,
          detailed_explanation: detailed,
          mechanism: mechanism,
        }
      }

      if (quotaExceeded && errorDetail) {
        quotaExceededMessage = errorDetail
        console.warn(`[LLM] Quota exceeded for: ${r.drug}`)
      } else if (!llmResponse) {
        console.warn(`[LLM] Falling back to internal explanation for: ${r.drug}`)
      }

      finalResults.push({
        ...r,
        llm_generated_explanation: finalExplanation,
        quality_metrics: {
          ...r.quality_metrics,
          llm_failure_flag: !llmResponse,
        },
      })
    }

    // Only surface quota warning if ALL LLM attempts failed and we hit a quota
    if (quotaExceededMessage && successfulLlmCount === 0) {
      errors.push({ message: quotaExceededMessage, code: "LLM_QUOTA_EXCEEDED" })
    }



    if (finalResults.length === 0 && errors.length === 0) {
      errors.push({
        message: "No pharmacogenomic data found in this VCF for the selected drugs.",
        code: "NO_RESULTS",
      })
    }

    return NextResponse.json({
      results: finalResults,
      errors,
      success: errors.length === 0,
    })
  } catch (err) {
    console.error("Analysis API error:", err)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } },
      { status: 500 }
    )
  }
}
