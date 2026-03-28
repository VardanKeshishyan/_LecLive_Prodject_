import { NextResponse } from "next/server"
import {
  applyMockChunk,
  consolidateChunk,
  getChunkIntervalMs,
  isMockMode,
  sendLiveAudioPcm,
} from "@/lib/server/gemini"
import {
  enqueueSessionWork,
  getSession,
  pushSavedChunk,
  toPublicSession,
} from "@/lib/server/session-store"
import type { ChunkResponse, SavedChunkNote } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { sessionId?: string; audioBase64?: string }
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

  const audioBase64 = body.audioBase64
  if (!audioBase64) {
    return NextResponse.json({ error: "audioBase64 required" }, { status: 400 })
  }

  const result = await enqueueSessionWork(state, async () => {
    const newSavedBlocks: SavedChunkNote[] = []

    const interval = getChunkIntervalMs()

    if (state.mockMode || isMockMode() || !state.liveSession) {
      applyMockChunk(state)
    } else {
      try {
        const buf = Buffer.from(audioBase64, "base64")
        sendLiveAudioPcm(state.liveSession, new Uint8Array(buf))
      } catch (e) {
        console.error("[chunk] audio decode/send", e)
        applyMockChunk(state)
      }
    }

    const now = Date.now()
    const elapsedSinceStart = now - state.sessionStartMs
    const elapsedSinceLastSave = state.lastSavedChunkAtMs
      ? now - state.lastSavedChunkAtMs
      : elapsedSinceStart

    const shouldConsolidate =
      state.bufferSinceLastChunk.trim().length >= 50 &&
      elapsedSinceLastSave >= interval

    if (shouldConsolidate) {
      state.status = "organizing"
      try {
        const chunk = await consolidateChunk(
          state,
          state.bufferSinceLastChunk
        )
        pushSavedChunk(state, chunk)
        newSavedBlocks.push(chunk)
      } catch (e) {
        console.error("[chunk] consolidate", e)
      }
      state.status = "live"
    }

    const res: ChunkResponse = {
      liveBullets: state.liveBullets,
      newSavedBlocks,
      status: state.status,
      lastUpdated: state.lastUpdated,
    }
    return res
  })

  return NextResponse.json({
    ...result,
    session: toPublicSession(state),
  })
}
