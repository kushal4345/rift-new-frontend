# 🧬 PharmaGuard

## AI-Powered Pharmacogenomics Clinical Decision Support System

👥 **Team Name:** 404 BRAIN NOT FOUND  
👩‍💻 **Team Members:** Saisha Handa, Kushal Sharma

🎥 **Live Demo:**  
[Google Drive Demo](https://drive.google.com/file/d/1EnPJ8PD0dNMHdf1Qy8YTWkKqWKMAzCGs/view?usp=sharing)

📱 **LinkedIn Demo Video:**  
[LinkedIn Post](https://www.linkedin.com/posts/saisha-handa-5809a6270_rift2026-pharmaguard-pharmacogenomics-activity-7430428519840522240-dwJM?utm_source=share&utm_medium=member_android&rcm=ACoAAEJawbABtKp1AUrsBp0KHFvHO0RrIg3rpXY)

---

# 🚀 Project Overview

PharmaGuard is a modular AI-powered pharmacogenomics clinical decision support system that:

- **Parses patient VCF genomic files** locally and via specialized APIs.
- **Detects clinically relevant variants** across major pharmacogenes (CYP2D6, CYP2C19, etc.).
- **Infers star alleles & diplotypes** using a high-precision internal matching engine.
- **Assigns metabolizer phenotypes** (PM, IM, NM, RM, URM) aligned with CPIC standards.
- **Applies drug–gene clinical rules** to generate actionable recommendations.
- **Generates structured EHR-ready JSON** for seamless integration into medical records.
- **Produces multilingual AI explanations** (English & 6 Indian languages supported).

It bridges the gap between **Complex Genomics** → **Clinical Logic** → **Explainable AI** → **Real-World Patient Care**.

---

# 🌟 What Makes PharmaGuard Different

- **Structured EHR-Ready Outputs**: Standardized JSON response for direct clinical software ingestion.
- **Hybrid Explanation Engine**: Uses external LLMs (Gemini/OpenAI) for rich summaries with an internal rule-based engine fallback for 100% reliability.
- **Transparent Confidence Engine**: Attaches detailed scoring to every risk assessment based on variant coverage.
- **Micro-multilingual Support**: First-class support for localized clinical insights in major Indian languages.
- **Privacy-First Parsing**: Separation of raw genomic data parsing from the clinical interpretation pipeline.

---

# 🏗 Architecture Overview

PharmaGuard follows a deterministic, modular pipeline to ensure medical auditability:

1. **User Upload**: Secure VCF file or text-based drug name input.
2. **VCF Validation**: Structural and checksum validation of genomic data.
3. **VCF Parser**: Local extraction of relevant rsIDs and genotypes.
4. **Star Allele Engine**: Mapping of genotypes to standard pharmacogenomic nomenclature.
5. **Phenotype Assignor**: Inference of the patient's metabolic state.
6. **Clinical Rule Engine**: Application of drug-specific recommendations (Adjust Dosage, Contraindicated, etc.).
7. **Confidence Measurer**: Scoring output based on data completeness.
8. **LLM Enrichment**: Contextual summary generation for both Clinicians and Patients.
9. **Final clinical JSON**: Consolidated, ready-to-use medical report.

---

# 🧠 Tech Stack

### Frontend & Orchestration
- **Next.js 15+**: React-based framework for high-performance server-side rendering.
- **TypeScript**: Ensuring type-safety across the clinical data model.
- **Tailwind CSS**: Modern, medical-grade UI with responsive dark/light modes.
- **Lucide React**: Specialized medical iconography.

### Genomic & Clinical Logic
- **Internal PGx Engine**: Custom TypeScript-based engine for variant mapping and phenotype assignment.
- **Zod**: Strict validation of clinical request/response schemas.
- **LLM APIs**: Integration with Google Gemini for explainable medical insights.

---

# 📊 Confidence Scoring Logic

PharmaGuard provides a **Confidence Score** (Base = 1.0) for every result:
- **Missing Variant**: `-0.1` per required rsID not found in VCF.
- **Indeterminate Phenotype**: `-0.2` if alleles don't map to a standard CPIC phenotype.
- **Partial Allele Detection**: `-0.15` for ambiguous genotypes.

*Final score is clamped between 0 and 1.*

---

# 🌏 Supported Languages

- **English** (en-US)
- **Hindi** (hi-IN)
- **Bengali** (bn-IN)
- **Tamil** (ta-IN)
- **Telugu** (te-IN)
- **Marathi** (mr-IN)
- **Gujarati** (gu-IN)

*Note: Clinical terms and gene symbols remain internationalized for medical precision.*

---

# 🛠 Installation & Setup

## 1️⃣ Prerequisites
- **Node.js 18+**
- **NPM** or **PNPM**

## 2️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/pharmaguard.git
cd pharmaguard
npm install
```

## 3️⃣ Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Optional: If using external LLM services
LLM_API_KEY=your_key_here
```

## 4️⃣ Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

# 📡 API Endpoints

### Analyze VCF/Text
`POST /api/analyze`
- **Body**: `multipart/form-data`
- **Fields**: 
  - `vcf`: (.vcf file)
  - `drugs`: (Optional comma-separated list)
  - `language`: (Default "en-US")

### Structured Response Example
```json
{
  "drug": "Codeine",
  "risk_assessment": {
    "risk_label": "Contraindicated",
    "severity": "critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "phenotype": "URM"
  }
}
```

---

# 🔮 Future Roadmap

- **FHIR Integration**: Export results directly to FHIR-compliant clinical servers.
- **Expanded Coverage**: Dynamic CPIC database syncing for 100+ new drug-gene pairs.
- **Interactive Dashboards**: Role-based views for Clinicians, Pharmacists, and Patients.
- **Audit Trails**: Blockchain-hashed logging for medical record integrity.

---

# 📜 License
MIT License

---

**Built with precision for 404 BRAIN NOT FOUND and the RIFT 2026 Pharmacogenomics deployment.**
