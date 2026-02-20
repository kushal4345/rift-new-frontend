import type { VcfParsedData, VcfVariant } from "./types"

export class VcfValidationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = "VcfValidationError"
  }
}

export function validateVcfContent(content: string): void {
  if (!content || content.trim().length === 0) {
    throw new VcfValidationError("VCF file is empty or corrupted.", "EMPTY_FILE")
  }

  if (!content.includes("##fileformat=VCF")) {
    throw new VcfValidationError(
      "Invalid VCF file: Missing ##fileformat=VCF header.",
      "MISSING_FILEFORMAT"
    )
  }

  if (!content.includes("#CHROM")) {
    throw new VcfValidationError(
      "Invalid VCF file: Missing #CHROM header line.",
      "MISSING_CHROM_HEADER"
    )
  }

  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  const dataLines = lines.filter((l) => !l.startsWith("#"))

  if (dataLines.length === 0) {
    throw new VcfValidationError(
      "Invalid VCF file: No variant data rows found.",
      "NO_VARIANTS"
    )
  }

  // Check for GT field
  const headerLine = lines.find((l) => l.startsWith("#CHROM"))
  if (headerLine) {
    const hasFormatCol = headerLine.split("\t").length >= 9
    if (!hasFormatCol) {
      throw new VcfValidationError(
        "Invalid VCF file: Missing FORMAT/genotype columns.",
        "MISSING_GT"
      )
    }
  }

  // Check at least one data line has GT in FORMAT
  const hasGT = dataLines.some((line) => {
    const parts = line.split("\t")
    return parts.length >= 10 && parts[8]?.includes("GT")
  })

  if (!hasGT) {
    throw new VcfValidationError(
      "Invalid VCF file: No genotype (GT) field found in variant data.",
      "NO_GT_FIELD"
    )
  }
}

export function parseVcf(content: string): VcfParsedData {
  validateVcfContent(content)

  const lines = content.split("\n").filter((l) => l.trim().length > 0)
  const variants: VcfVariant[] = []
  let sampleId = "SAMPLE_001"
  let fileFormat = "VCFv4.1"

  for (const line of lines) {
    if (line.startsWith("##fileformat=")) {
      fileFormat = line.split("=")[1] || "VCFv4.1"
      continue
    }

    if (line.startsWith("#CHROM")) {
      const cols = line.split("\t")
      if (cols.length >= 10) {
        sampleId = cols[9] || "SAMPLE_001"
      }
      continue
    }

    if (line.startsWith("#")) continue

    const parts = line.split("\t")
    if (parts.length < 10) continue

    const [chrom, pos, id, ref, alt, , , , format, sample] = parts
    const formatFields = (format || "").split(":")
    const sampleFields = (sample || "").split(":")
    const gtIndex = formatFields.indexOf("GT")

    if (gtIndex === -1) continue

    const gtRaw = sampleFields[gtIndex] || "."
    const genotype = parseGenotype(gtRaw, ref || ".", alt || ".")

    variants.push({
      chrom: chrom || ".",
      pos: pos || ".",
      id: id || ".",
      ref: ref || ".",
      alt: alt || ".",
      genotype,
    })
  }

  return {
    variants,
    sampleId,
    fileFormat,
    totalVariants: variants.length,
  }
}

function parseGenotype(gt: string, ref: string, alt: string): string {
  const separator = gt.includes("|") ? "|" : "/"
  const alleleIndices = gt.split(/[|/]/)

  const alleles = alleleIndices.map((idx) => {
    const i = parseInt(idx, 10)
    if (isNaN(i) || idx === ".") return "."
    if (i === 0) return ref
    const altAlleles = alt.split(",")
    return altAlleles[i - 1] || "."
  })

  return alleles.join(separator)
}
