import { RawVcfOutput } from "./vcf-parser-service";
import { ClinicalOutput } from "./types";

export interface LlmInputFormat {
    drug: string;
    gene: string;
    phenotype: string;
    risk_label: string;
    severity: string;
    confidence_score: number;
    cpic_level: string;
    preferred_language: string;
}

/**
 * Transforms raw API output into strict LLM input format
 */
export function transformApiToLlmInput(
    raw: RawVcfOutput,
    drugName: string,
    preferredLanguage: string
): LlmInputFormat | null {
    // Find interpretation for the specific drug
    const interp = Object.values(raw.clinical_interpretation).find(
        (i) => i.drug.toLowerCase() === drugName.toLowerCase()
    );

    if (!interp) return null;

    // Find CPIC level from detected variants related to this gene
    const geneKey = Object.keys(raw.clinical_interpretation).find(
        (key) => raw.clinical_interpretation[key].drug.toLowerCase() === drugName.toLowerCase()
    );

    const variant = raw.variants_detected.find(v => v.gene === geneKey);

    return {
        drug: interp.drug,
        gene: geneKey || "Unknown",
        phenotype: interp.phenotype.replace(new RegExp(`^${geneKey}\\s+`, 'i'), ''), // Remove gene prefix
        risk_label: interp.risk,
        severity: interp.severity,
        confidence_score: interp.confidence_score,
        cpic_level: variant?.cpic_level || "3",
        preferred_language: preferredLanguage
    };
}

/**
 * Transforms internal result to strict LLM input format
 */
export function transformInternalToLlmInput(
    internal: ClinicalOutput,
    preferredLanguage: string
): LlmInputFormat {
    return {
        drug: internal.drug,
        gene: internal.pharmacogenomic_profile.primary_gene,
        phenotype: internal.pharmacogenomic_profile.phenotype,
        risk_label: internal.risk_assessment.risk_label,
        severity: internal.risk_assessment.severity,
        confidence_score: internal.risk_assessment.confidence_score,
        cpic_level: internal.clinical_recommendation.cpic_level,
        preferred_language: preferredLanguage
    };
}
