import type { Phenotype, DetectedVariant } from "./types"

export interface ConfidenceFactors {
  totalExpectedVariants: number
  detectedVariants: number
  phenotype: Phenotype
  partialAlleleDetection: boolean
  multiGeneInference: boolean
}

export function computeConfidence(factors: ConfidenceFactors): number {
  let score = 1.0

  // Missing variant penalty
  const missingVariants = factors.totalExpectedVariants - factors.detectedVariants
  score -= missingVariants * 0.1

  // Indeterminate phenotype penalty
  if (factors.phenotype === "Unknown") {
    score -= 0.2
  }

  // Partial allele detection penalty
  if (factors.partialAlleleDetection) {
    score -= 0.15
  }

  // Multi-gene inference penalty
  if (factors.multiGeneInference) {
    score -= 0.05
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100))
}
