export class VcfValidationError extends Error {
    constructor(public message: string, public code: string) {
        super(message);
        this.name = "VcfValidationError";
    }
}

export function validateVcf(file: File): void {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    if (file.size > MAX_FILE_SIZE) {
        throw new VcfValidationError("VCF file must be under 50MB.", "FILE_TOO_LARGE");
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".vcf") && !fileName.endsWith(".vcf.gz")) {
        throw new VcfValidationError("Only .vcf and .vcf.gz files are accepted.", "INVALID_FILE_TYPE");
    }
}
