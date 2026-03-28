import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Allow up to 20MB request body for large PDFs
export const maxDuration = 60

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  return new GoogleGenAI({ apiKey })
}

function getExtractionModel(): string {
  return process.env.GEMINI_REST_MODEL?.trim() || "gemini-2.0-flash"
}

async function extractWithRetry(
  ai: GoogleGenAI,
  model: string,
  fileBase64: string,
  mimeType: string,
  fileName: string,
  retries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: fileBase64, mimeType } },
              {
                text: `Extract all readable text from this file ("${fileName}"). Return only the raw text content. For presentations extract slide text in order. For PDFs extract all page text. Return empty string if no text found.`,
              },
            ],
          },
        ],
        config: { temperature: 0 },
      })
      return res.text?.trim() ?? ""
    } catch (e) {
      if (attempt === retries) throw e
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  return ""
}

export async function POST(req: Request) {
  let body: { fileBase64?: string; mimeType?: string; fileName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { fileBase64, mimeType, fileName } = body
  if (!fileBase64 || !mimeType || !fileName) {
    return NextResponse.json({ error: "fileBase64, mimeType, and fileName are required" }, { status: 400 })
  }

  // Guard: reject files that would exceed Gemini's inline data limit (~20MB decoded)
  if (fileBase64.length > 26_000_000) {
    return NextResponse.json({ error: "File too large for inline extraction (max ~20MB)" }, { status: 413 })
  }

  try {
    const ai = getClient()
    const model = getExtractionModel()
    const text = await extractWithRetry(ai, model, fileBase64, mimeType, fileName)
    return NextResponse.json({ text: text.slice(0, 12_000) })
  } catch (e) {
    console.error("[extract]", e)
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
