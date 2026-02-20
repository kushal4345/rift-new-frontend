import { API_CONFIG } from "./api-config";

export interface RawVcfOutput {
    patient_id: string;
    timestamp: string;
    variants_count: number;
    variants_detected: Array<{
        chrom: string;
        pos: number;
        rsid: string[];
        gene: string;
        star: string;
        genotype: string;
        cpic_level: string;
    }>;
    diplotypes: Record<string, string>;
    clinical_interpretation: Record<string, {
        drug: string;
        phenotype: string;
        risk: string;
        severity: string;
        recommendation: string;
        mechanism: string;
        confidence_score: number;
        evidence_summary: {
            supporting_variants: number;
            cpic_evidence_detected: boolean;
            rule_match: boolean;
        };
    }>;
}

export async function parseVcfWithApi(vcfFile: File): Promise<RawVcfOutput> {
    const formData = new FormData();
    formData.append("vcf", vcfFile);

    const response = await fetch(API_CONFIG.VCF_PARSER_ENDPOINT, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`VCF Parser API failed with status: ${response.status}`);
    }

    return await response.json();
}
