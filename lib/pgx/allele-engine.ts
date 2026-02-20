import type { VcfVariant, DetectedVariant } from "./types"
import type { DrugGeneRule } from "./types"

export interface AlleleResult {
  diplotype: string
  detectedVariants: DetectedVariant[]
  allele1: string
  allele2: string
  partialDetection: boolean
}

export function mapToStarAlleles(
  variants: VcfVariant[],
  rule: DrugGeneRule
): AlleleResult {
  const relevantVariants: DetectedVariant[] = []
  const variantMap = new Map<string, string>()

  for (const v of variants) {
    const rsid = v.id
    if (rule.rsids.includes(rsid)) {
      relevantVariants.push({
        rsid,
        chromosome: v.chrom,
        position: v.pos,
        genotype: v.genotype,
      })
      variantMap.set(rsid, v.genotype)
    }
  }

  const alleleScores: Record<string, number> = {}

  for (const [allele, patterns] of Object.entries(rule.starAlleles)) {
    if (patterns.length === 0) continue
    let matchCount = 0
    for (const pattern of patterns) {
      const [rsid, expectedGt] = pattern.split(":")
      const actualGt = variantMap.get(rsid)
      if (actualGt) {
        const normalizedActual = normalizeGenotype(actualGt)
        const normalizedExpected = normalizeGenotype(expectedGt)
        if (normalizedActual === normalizedExpected) {
          matchCount++
        }
      }
    }
    if (matchCount > 0) {
      alleleScores[allele] = matchCount / patterns.length
    }
  }

  const sortedAlleles = Object.entries(alleleScores)
    .sort(([, a], [, b]) => b - a)
    .map(([allele]) => allele)

  let allele1 = "*1"
  let allele2 = "*1"
  let partialDetection = false

  if (sortedAlleles.length >= 2) {
    allele1 = sortedAlleles[0]
    allele2 = sortedAlleles[1]
    partialDetection = Object.values(alleleScores).some((s) => s < 1)
  } else if (sortedAlleles.length === 1) {
    allele1 = sortedAlleles[0]
    allele2 = "*1"
    partialDetection = true
  } else {
    partialDetection = relevantVariants.length < rule.rsids.length
  }

  const diplotype = `${allele1}/${allele2}`

  return {
    diplotype,
    detectedVariants: relevantVariants,
    allele1,
    allele2,
    partialDetection,
  }
}

function normalizeGenotype(gt: string): string {
  const chars = gt.split("").sort()
  return chars.join("")
}
