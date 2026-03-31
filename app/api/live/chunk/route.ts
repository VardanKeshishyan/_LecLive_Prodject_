import { NextResponse } from "next/server"
import {
  consolidateChunk,
  getChunkIntervalMs,
  isMockMode,
  sendLiveAudioPcm,
} from "@/lib/server/gemini"
import {
  appendSpokenText,
  enqueueSessionWork,
  getSession,
  pushSavedChunk,
  toPublicSession,
} from "@/lib/server/session-store"
import type { ChunkResponse, SavedChunkNote } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { sessionId?: string; audioBase64?: string; transcriptText?: string }
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

      // Use browser speech recognition text as a fallback for the live transcript.
      // This helps the UI show words even before the Live API input transcription arrives.
      const transcriptText = body.transcriptText?.trim()
      if (transcriptText) {
        appendSpokenText(state, transcriptText)
        state.bufferSinceLastChunk += `${transcriptText}\n`
      }

      const now = Date.now()
      const elapsedSinceStart = now - state.sessionStartMs
      const elapsedSinceLastSave = state.lastSavedChunkAtMs
        ? now - state.lastSavedChunkAtMs
        : elapsedSinceStart

      const bufLen = state.bufferSinceLastChunk.trim().length
      const shouldConsolidate = bufLen >= 10 && elapsedSinceLastSave >= interval

      if (shouldConsolidate) {
        console.log(`[chunk] CONSOLIDATING ${bufLen}chars elapsed=${Math.round(elapsedSinceLastSave/1000)}s`)
        state.status = "organizing"
        try {
          const chunk = await consolidateChunk(
            state,
            state.bufferSinceLastChunk
          )
          console.log(`[chunk] consolidate SUCCESS: ${chunk.title}`)
          pushSavedChunk(state, chunk)
          newSavedBlocks.push(chunk)
        } catch (e) {
          console.error("[chunk] consolidate FAILED", e)
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
