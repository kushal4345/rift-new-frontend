import { z } from "zod"

// ── Supported Languages (no Spanish/French) ──
export const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English", group: "Global" },
  { code: "hi-IN", label: "Hindi - \u0939\u093F\u0928\u094D\u0926\u0940", group: "Indian Languages" },
  { code: "bn-IN", label: "Bengali - \u09AC\u09BE\u0982\u09B2\u09BE", group: "Indian Languages" },
  { code: "ta-IN", label: "Tamil - \u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", group: "Indian Languages" },
  { code: "te-IN", label: "Telugu - \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", group: "Indian Languages" },
  { code: "mr-IN", label: "Marathi - \u092E\u0930\u093E\u0920\u0940", group: "Indian Languages" },
  { code: "gu-IN", label: "Gujarati - \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", group: "Indian Languages" },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"]

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code)

// ── Supported Drugs ──
export const SUPPORTED_DRUGS = [
  "Codeine",
  "Clopidogrel",
  "Warfarin",
  "Mercaptopurine",
  "Azathioprine",
  "Simvastatin",
] as const

export type SupportedDrug = (typeof SUPPORTED_DRUGS)[number]

// ── Risk Labels ──
export const RISK_LABELS = [
  "Safe",
  "Adjust Dosage",
  "Monitor Closely",
  "Toxic",
  "Contraindicated",
] as const

export type RiskLabel = (typeof RISK_LABELS)[number]

export const SEVERITY_MAP: Record<RiskLabel, string> = {
  Safe: "none",
  "Adjust Dosage": "moderate",
  "Monitor Closely": "moderate",
  Toxic: "high",
  Contraindicated: "critical",
}

// ── Phenotypes ──
export const PHENOTYPES = ["PM", "IM", "NM", "RM", "URM", "Unknown"] as const
export type Phenotype = (typeof PHENOTYPES)[number]

// ── CPIC Levels ──
export const CPIC_LEVELS = ["A", "B", "C", "D"] as const
export type CpicLevel = (typeof CPIC_LEVELS)[number]

// ── Detected Variant ──
export interface DetectedVariant {
  rsid: string
  chromosome: string
  position: string
  genotype: string
}

// ── Clinical JSON Output ──
export interface ClinicalOutput {
  patient_id: string
  drug: string
  timestamp: string
  risk_assessment: {
    risk_label: RiskLabel
    confidence_score: number
    severity: string
  }
  pharmacogenomic_profile: {
    primary_gene: string
    diplotype: string
    phenotype: Phenotype
    detected_variants: DetectedVariant[]
  }
  clinical_recommendation: {
    cpic_level: CpicLevel
    recommendation_summary: string
    alternative_drugs: string[]
    monitoring_guidance: string
  }
  llm_generated_explanation: {
    summary: string
    detailed_explanation: string
    mechanism: string
  }
  quality_metrics: {
    vcf_parsing_success: boolean
    star_allele_detection_success: boolean
    phenotype_assignment_success: boolean
    drug_rule_applied: boolean
    variant_count: number
    missing_data_flag: boolean
    llm_failure_flag: boolean
  }
}

// ── Explanation Input ──
export const ExplanationInputSchema = z.object({
  drug: z.string(),
  gene: z.string(),
  phenotype: z.string(),
  risk_label: z.string(),
  severity: z.string(),
  confidence_score: z.number().min(0).max(1),
  cpic_level: z.string(),
  preferred_language: z.enum(["en-US", "hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN"]),
})

export type ExplanationInput = z.infer<typeof ExplanationInputSchema>

// ── VCF Parsed Data ──
export interface VcfVariant {
  chrom: string
  pos: string
  id: string
  ref: string
  alt: string
  genotype: string
}

export interface VcfParsedData {
  variants: VcfVariant[]
  sampleId: string
  fileFormat: string
  totalVariants: number
}

// ── Drug-Gene Mapping ──
export interface DrugGeneRule {
  gene: string
  rsids: string[]
  starAlleles: Record<string, string[]>
  phenotypeMap: Record<string, Phenotype>
  riskMap: Record<Phenotype, RiskLabel>
  cpicLevel: CpicLevel
  recommendations: Record<Phenotype, string>
  alternatives: string[]
  monitoring: Record<Phenotype, string>
}

// ── Analysis Request ──
export const AnalysisRequestSchema = z.object({
  drugs: z
    .string()
    .min(0)
    .max(100, "Drug input must be 100 characters or less")
    .refine((val) => !val.includes("##fileformat"), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => !val.includes("#CHROM"), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => !/\bPOS\b/.test(val), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => !/\bALT\b/.test(val), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => !/\t/.test(val), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => !/rs\d+/.test(val), {
      message: "This field accepts drug names only. VCF content detected.",
    })
    .refine((val) => val === "" || /^[a-zA-Z\s,\-]+$/.test(val), {
      message: "Drug names may only contain letters, spaces, commas, and hyphens.",
    }),
  language: z.enum(["en-US", "hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN"]),
})
