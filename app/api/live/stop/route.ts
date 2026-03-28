import { NextResponse } from "next/server"
import { finalizeSessionSummary } from "@/lib/server/gemini"
import {
  enqueueSessionWork,
  getSession,
  setSummary,
  toPublicSession,
} from "@/lib/server/session-store"
import type { StopResponse } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sessionId = body.sessionId
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  const state = getSession(sessionId)
  if (!state) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const payload = await enqueueSessionWork(state, async (): Promise<StopResponse> => {
    state.status = "organizing"

    try {
      state.liveSession?.close()
    } catch (e) {
      console.error("[stop] close live", e)
    }

    try {
      const summary = await finalizeSessionSummary(state)
      setSummary(state, summary)
    } catch (e) {
      console.error("[stop] summary", e)
      setSummary(state, {
        overallSummary: "Summary could not be generated. Try again with GEMINI_MOCK=1 or check API key.",
        mainTopics: [],
        majorDefinitions: [],
        importantExamples: [],
        actionItemsOrQuestions: [],
      })
    }

    return { session: toPublicSession(state) }
  })

  return NextResponse.json(payload)
}
