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

  if (isMockMode()) {
    return NextResponse.json(
      {
        error: "Live API disabled. Set GEMINI_API_KEY and GEMINI_MOCK=0.",
      },
      { status: 400 }
    )
  }

  const state = createSession(meta)

  try {
    const live = await connectLiveSession(state)
    setLiveSession(state, live)
    return NextResponse.json({ sessionId: state.id, session: toPublicSession(state) })
  } catch (e) {
    console.error("[start] Live connect failed", e)
    const message = e instanceof Error ? e.message : "Unknown Live API error"
    return NextResponse.json(
      {
        error: `Live API connection failed: ${message}`,
      },
      { status: 502 }
    )
  }
}
