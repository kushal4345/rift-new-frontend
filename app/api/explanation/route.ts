import { NextRequest, NextResponse } from "next/server"
import { ExplanationInputSchema } from "@/lib/pgx/types"
import { generateExplanation } from "@/lib/pgx/explanation-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = ExplanationInputSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: firstError?.message || "Invalid input." } },
        { status: 400 }
      )
    }

    const explanation = generateExplanation(validation.data)

    return NextResponse.json({
      explanation,
      input: validation.data,
      success: true,
    })
  } catch (err) {
    console.error("Explanation API error:", err)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred generating explanation.",
        },
      },
      { status: 500 }
    )
  }
}
