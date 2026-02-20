import type { ClinicalOutput, Phenotype, LanguageCode, SupportedDrug } from "./types"
import { SUPPORTED_DRUGS, SEVERITY_MAP } from "./types"
import { parseVcf, VcfValidationError } from "./vcf-parser"
import { mapToStarAlleles } from "./allele-engine"
import { inferPhenotype } from "./phenotype-engine"
import { computeConfidence } from "./confidence-engine"
import { DRUG_GENE_RULES } from "./drug-rules"

export interface AnalysisError {
  code: string
  message: string
  drug?: string
}

export interface AnalysisResult {
  results: ClinicalOutput[]
  errors: AnalysisError[]
}

export function runAnalysisPipeline(
  vcfContent: string,
  drugNames: string[],
  language: LanguageCode
): AnalysisResult {
  const results: ClinicalOutput[] = []
  const errors: AnalysisError[] = []

  // Step 1: Parse VCF
  let parsedVcf
  try {
    parsedVcf = parseVcf(vcfContent)
  } catch (err) {
    if (err instanceof VcfValidationError) {
      errors.push({ code: err.code, message: err.message })
    } else {
      errors.push({ code: "VCF_PARSE_ERROR", message: "Failed to parse VCF file." })
    }
    return { results, errors }
  }

  // Process each drug
  for (const drugName of drugNames) {
    const normalizedDrug = drugName.trim()
    const matchedDrug = SUPPORTED_DRUGS.find(
      (d) => d.toLowerCase() === normalizedDrug.toLowerCase()
    )

    if (!matchedDrug) {
      errors.push({
        code: "UNSUPPORTED_DRUG",
        message: "Drug not supported by current pharmacogenomic engine.",
        drug: normalizedDrug,
      })
      continue
    }

    try {
      const rule = DRUG_GENE_RULES[matchedDrug]
      if (!rule) {
        errors.push({
          code: "NO_RULE",
          message: `No pharmacogenomic rule found for ${matchedDrug}.`,
          drug: matchedDrug,
        })
        continue
      }

      // Step 2-3: Extract relevant variants and map to star alleles
      const alleleResult = mapToStarAlleles(parsedVcf.variants, rule)

      // Step 4-5: Assign diplotype and infer phenotype
      const phenotype: Phenotype = inferPhenotype(alleleResult.diplotype, rule)

      // Step 6: Apply drug-gene clinical rules
      const riskLabel = rule.riskMap[phenotype]
      const severity = SEVERITY_MAP[riskLabel]

      // Step 7-8: Compute confidence score
      const confidenceScore = computeConfidence({
        totalExpectedVariants: rule.rsids.length,
        detectedVariants: alleleResult.detectedVariants.length,
        phenotype,
        partialAlleleDetection: alleleResult.partialDetection,
        multiGeneInference: false,
      })

      // Step 9: Generate structured JSON
      const output: ClinicalOutput = {
        patient_id: `PATIENT_${parsedVcf.sampleId.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}`,
        drug: matchedDrug,
        timestamp: new Date().toISOString(),
        risk_assessment: {
          risk_label: riskLabel,
          confidence_score: confidenceScore,
          severity,
        },
        pharmacogenomic_profile: {
          primary_gene: rule.gene,
          diplotype: alleleResult.diplotype,
          phenotype,
          detected_variants: alleleResult.detectedVariants,
        },
        clinical_recommendation: {
          cpic_level: rule.cpicLevel,
          recommendation_summary: rule.recommendations[phenotype],
          alternative_drugs: rule.alternatives,
          monitoring_guidance: rule.monitoring[phenotype],
        },
        llm_generated_explanation: {
          summary: `${phenotype} phenotype detected for ${rule.gene}. ${riskLabel} risk for ${matchedDrug}.`,
          detailed_explanation: `Patient carries ${alleleResult.diplotype} diplotype in ${rule.gene}, classified as ${phenotype}. This affects the metabolism of ${matchedDrug}, resulting in a ${riskLabel.toLowerCase()} risk classification with ${severity} severity. CPIC Level ${rule.cpicLevel} evidence supports this recommendation.`,
          mechanism: `${rule.gene} enzyme activity is ${phenotype === "PM" ? "absent/significantly reduced" : phenotype === "IM" ? "reduced" : phenotype === "NM" ? "normal" : phenotype === "RM" ? "increased" : phenotype === "URM" ? "greatly increased" : "uncertain"} in ${phenotype} phenotype, directly impacting the pharmacokinetic processing of ${matchedDrug}.`,
        },
        quality_metrics: {
          vcf_parsing_success: true,
          star_allele_detection_success: alleleResult.detectedVariants.length > 0,
          phenotype_assignment_success: phenotype !== "Unknown",
          drug_rule_applied: true,
          variant_count: alleleResult.detectedVariants.length,
          missing_data_flag:
            alleleResult.detectedVariants.length < rule.rsids.length,
        },
      }

      results.push(output)
    } catch (err) {
      errors.push({
        code: "ANALYSIS_ERROR",
        message: `Analysis failed for ${matchedDrug}: ${err instanceof Error ? err.message : "Unknown error"}`,
        drug: matchedDrug,
      })
    }
  }

  return { results, errors }
}

export function generateFallbackOutput(drug: string, errorMessage: string): ClinicalOutput {
  return {
    patient_id: "PATIENT_UNKNOWN",
    drug,
    timestamp: new Date().toISOString(),
    risk_assessment: {
      risk_label: "Monitor Closely",
      confidence_score: 0,
      severity: "moderate",
    },
    pharmacogenomic_profile: {
      primary_gene: "Unknown",
      diplotype: "Unknown",
      phenotype: "Unknown",
      detected_variants: [],
    },
    clinical_recommendation: {
      cpic_level: "D",
      recommendation_summary: `Analysis could not be completed: ${errorMessage}`,
      alternative_drugs: [],
      monitoring_guidance: "Enhanced clinical monitoring recommended due to analysis failure.",
    },
    llm_generated_explanation: {
      summary: "Analysis could not be completed.",
      detailed_explanation: errorMessage,
      mechanism: "Unable to determine mechanism due to analysis failure.",
    },
    quality_metrics: {
      vcf_parsing_success: false,
      star_allele_detection_success: false,
      phenotype_assignment_success: false,
      drug_rule_applied: false,
      variant_count: 0,
      missing_data_flag: true,
    },
  }
}
