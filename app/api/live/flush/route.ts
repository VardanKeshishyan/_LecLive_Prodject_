import { NextResponse } from "next/server"
import { endLiveAudioStream } from "@/lib/server/gemini"
import { enqueueSessionWork, getSession } from "@/lib/server/session-store"

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

  if (!state.liveSession) {
    return NextResponse.json(
      { error: "Live session is not active" },
      { status: 409 }
    )
  }

  try {
    await enqueueSessionWork(state, async () => {
      if (!state.liveSession) return
      endLiveAudioStream(state.liveSession)
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[flush] audio stream end failed", e)
    return NextResponse.json(
      { error: "Failed to flush live audio stream" },
      { status: 502 }
    )
  }
}

