import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { getSession } from "@/lib/server/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  return new GoogleGenAI({ apiKey })
}

function getRestModel(): string {
  return process.env.GEMINI_REST_MODEL?.trim() || "gemini-2.0-flash"
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const state = getSession(id)

  let body: { question?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const question = body.question?.trim()
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 })
  }

  // Build context from session (use summary if done, else live notes)
  let context = ""
  if (state) {
    if (state.summary) {
      context += `LECTURE SUMMARY:\n${state.summary.overallSummary}\n\n`
      if (state.summary.mainTopics.length) {
        context += `MAIN TOPICS:\n${state.summary.mainTopics.join("\n")}\n\n`
      }
      if (state.summary.majorDefinitions.length) {
        context += `DEFINITIONS:\n${state.summary.majorDefinitions.map((d) => `${d.term}: ${d.definition}`).join("\n")}\n\n`
      }
      if (state.summary.importantExamples.length) {
        context += `EXAMPLES:\n${state.summary.importantExamples.join("\n")}\n\n`
      }
      if (state.summary.actionItemsOrQuestions.length) {
        context += `KEY QUESTIONS:\n${state.summary.actionItemsOrQuestions.join("\n")}\n\n`
      }
    }
    if (state.savedChunks.length) {
      context += `SAVED NOTES:\n${state.savedChunks
        .map((c) => `[${c.title}]\n${(c.keyPoints ?? []).join("\n")}`)
        .join("\n\n")
        .slice(0, 4000)}\n\n`
    }
    if (state.bufferSinceLastChunk) {
      context += `RECENT TRANSCRIPT:\n${state.bufferSinceLastChunk.slice(0, 3000)}\n\n`
    }
    if (state.materials?.length) {
      const matText = state.materials
        .filter((m) => m.textContent)
        .map((m) => `[${m.name}]:\n${m.textContent}`)
        .join("\n\n")
        .slice(0, 4000)
      if (matText) context += `UPLOADED MATERIALS:\n${matText}\n\n`
    }
  }

  if (!context.trim()) {
    context = "No lecture context available yet. Answer as helpfully as possible from general knowledge."
  }

  const prompt = `You are an intelligent study assistant for a live lecture tool. 
A student is asking a question about the lecture they just attended.
Answer helpfully, concisely, and accurately based on the lecture context below.
If the answer isn't in the context, use general knowledge but say so briefly.

LECTURE CONTEXT:
${context}

STUDENT QUESTION: ${question}

Answer in 2-4 sentences max. Be direct and clear.`

  try {
    const ai = getClient()
    const model = getRestModel()
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 },
    })
    const answer = res.text?.trim() ?? "Sorry, I couldn't generate an answer."
    return NextResponse.json({ answer })
  } catch (e) {
    console.error("[ask]", e)
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
