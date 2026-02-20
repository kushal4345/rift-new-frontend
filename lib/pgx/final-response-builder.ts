import { RawVcfOutput } from "./vcf-parser-service";
import { ClinicalOutput } from "./types";

export interface LlmExplanation {
    summary: string;
    detailed_explanation: string;
    mechanism: string;
    clinical_action: string;
    safety_advice: string;
}

export function buildFinalClinicalJson(
    raw: RawVcfOutput,
    drugName: string,
    llmOutput: LlmExplanation | null
): ClinicalOutput | null {
    const geneKey = Object.keys(raw.clinical_interpretation).find(
        (key) => raw.clinical_interpretation[key].drug.toLowerCase() === drugName.toLowerCase()
    );

    if (!geneKey) return null;

    const interp = raw.clinical_interpretation[geneKey];
    const variants = raw.variants_detected.filter(v => v.gene === geneKey);
    const diplotype = raw.diplotypes[geneKey] || "Unknown";

    return {
        patient_id: raw.patient_id,
        drug: interp.drug,
        timestamp: raw.timestamp,
        risk_assessment: {
            risk_label: interp.risk as any,
            confidence_score: interp.confidence_score,
            severity: interp.severity as any,
        },
        pharmacogenomic_profile: {
            primary_gene: geneKey,
            diplotype: diplotype,
            phenotype: interp.phenotype as any,
            detected_variants: variants.map(v => ({
                rsid: v.rsid[0] || "Unknown",
                chromosome: v.chrom,
                position: v.pos.toString(),
                genotype: v.genotype
            })),
        },
        clinical_recommendation: {
            cpic_level: variants[0]?.cpic_level || "3",
            recommendation_summary: interp.recommendation,
            monitoring_guidance: "Refer to clinical guidelines for monitoring.",
            alternative_drugs: [],
        },
        llm_generated_explanation: llmOutput || {
            summary: interp.recommendation,
            detailed_explanation: interp.mechanism,
            mechanism: interp.mechanism,
        },
        quality_metrics: {
            vcf_parsing_success: true,
            star_allele_detection_success: true,
            phenotype_assignment_success: true,
            drug_rule_applied: true,
            variant_count: variants.length,
            missing_data_flag: false,
            llm_failure_flag: llmOutput === null
        }
    };
}
