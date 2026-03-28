import { NextResponse } from "next/server"
import {
  consolidateChunk,
  endLiveAudioStream,
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

  if (state.mockMode || isMockMode() || !state.liveSession) {
    return NextResponse.json(
      { error: "Live session is not active. Start a valid Live API session first." },
      { status: 409 }
    )
  }

  let pcmBytes: Uint8Array
  try {
    const buf = Buffer.from(audioBase64, "base64")
    pcmBytes = new Uint8Array(buf)
  } catch {
    return NextResponse.json({ error: "Invalid audioBase64 payload" }, { status: 400 })
  }

  const liveSession = state.liveSession

  let result: ChunkResponse
  try {
    result = await enqueueSessionWork(state, async () => {
      const newSavedBlocks: SavedChunkNote[] = []

      const interval = getChunkIntervalMs()

      sendLiveAudioPcm(liveSession, pcmBytes)
      // We stream in discrete HTTP chunks rather than a continuous socket mic stream.
      // Explicitly ending this segment helps the Live API flush transcription promptly.
      endLiveAudioStream(liveSession)

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
  } catch (e) {
    console.error("[chunk] audio send failed", e)
    return NextResponse.json(
      { error: "Live audio stream send failed" },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ...result,
    session: toPublicSession(state),
  })
}
