import type { Phenotype } from "./types"
import type { DrugGeneRule } from "./types"

export function inferPhenotype(diplotype: string, rule: DrugGeneRule): Phenotype {
  if (rule.phenotypeMap[diplotype]) {
    return rule.phenotypeMap[diplotype]
  }

  // Try reversed diplotype
  const parts = diplotype.split("/")
  if (parts.length === 2) {
    const reversed = `${parts[1]}/${parts[0]}`
    if (rule.phenotypeMap[reversed]) {
      return rule.phenotypeMap[reversed]
    }
  }

  // Heuristic based on allele function
  const allele1 = parts[0] || "*1"
  const allele2 = parts[1] || "*1"

  const lossOfFunction = ["*4", "*5", "*6", "*3", "*3A", "*3B", "*3C", "*2"]
  const reducedFunction = ["*10", "*17", "*41", "*9"]
  const increasedFunction = ["*17"]

  const a1Loss = lossOfFunction.includes(allele1)
  const a2Loss = lossOfFunction.includes(allele2)
  const a1Reduced = reducedFunction.includes(allele1)
  const a2Reduced = reducedFunction.includes(allele2)
  const a1Increased = increasedFunction.includes(allele1)
  const a2Increased = increasedFunction.includes(allele2)

  if (a1Loss && a2Loss) return "PM"
  if ((a1Loss && a2Reduced) || (a1Reduced && a2Loss)) return "PM"
  if (a1Loss || a2Loss || a1Reduced || a2Reduced) return "IM"
  if (a1Increased && a2Increased) return "URM"
  if (a1Increased || a2Increased) return "RM"

  return "Unknown"
}
