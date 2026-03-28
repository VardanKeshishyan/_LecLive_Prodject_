import { NextResponse } from "next/server"
import {
  connectLiveSession,
  isMockMode,
} from "@/lib/server/gemini"
import {
  createSession,
  setLiveSession,
  toPublicSession,
} from "@/lib/server/session-store"
import type { SessionMeta } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let meta: SessionMeta = {}
  try {
    const body = await req.json()
    meta = {
      title: body.title as string | undefined,
      course: body.course as string | undefined,
      instructor: body.instructor as string | undefined,
    }
  } catch {
    /* empty body ok */
  }

  const state = createSession(meta)

  if (isMockMode()) {
    state.mockMode = true
    return NextResponse.json({
      sessionId: state.id,
      session: toPublicSession(state),
      fallbackNote: "Mock mode: set GEMINI_API_KEY and GEMINI_MOCK=0 for live API.",
    })
  }

  try {
    const live = await connectLiveSession(state)
    setLiveSession(state, live)
    return NextResponse.json({ sessionId: state.id, session: toPublicSession(state) })
  } catch (e) {
    console.error("[start] Live connect failed", e)
    state.mockMode = true
    state.fallbackNote =
      "Live API connection failed; running in degraded mock mode. Check model name and API key."
    return NextResponse.json({
      sessionId: state.id,
      session: toPublicSession(state),
      fallbackNote: state.fallbackNote,
    })
  }
}
