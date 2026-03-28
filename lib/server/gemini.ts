/**
 * Gemini Multimodal Live + REST helpers.
 * Live sessions are limited (often ~10–15 min audio-only); plan demos accordingly.
 */
import { GoogleGenAI, Modality, type Session } from "@google/genai"
import type { InternalSessionState } from "@/lib/server/session-store"
import {
  appendRollingText,
  sessionElapsedSec,
  upsertLiveBulletsFromLines,
} from "@/lib/server/session-store"
import type { SavedChunkNote, SessionSummary } from "@/lib/types"

const SYSTEM_INSTRUCTION = `You are a live study assistant for university lectures.

Your job is NOT to produce a verbatim transcript. Instead, continuously extract and summarize:
- important ideas and takeaways
- key terms and definitions when introduced
- examples, formulas, or warnings the instructor emphasizes
- anything likely to appear on an exam

Respond in concise text. Prefer short labeled lines when helpful (e.g. "Definition:", "Example:", "Exam tip:").
Do not roleplay as a chatbot; output study-relevant content only.`

export function isMockMode(): boolean {
  if (process.env.GEMINI_MOCK === "1") return true
  const key = process.env.GEMINI_API_KEY
  return !key || key.length === 0
}

export function getChunkIntervalMs(): number {
  const raw = process.env.GEMINI_CHUNK_INTERVAL_MS
  const n = raw ? parseInt(raw, 10) : 180_000
  return Number.isFinite(n) && n >= 30_000 ? n : 180_000
}

/**
 * Multimodal Live API requires a *-live* model. Gemini 3 Flash (REST) is
 * `gemini-3-flash-preview`, which does not support Live; use Gemini 3.1 Flash Live here.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview
 */
function getLiveModel(): string {
  return (
    process.env.GEMINI_LIVE_MODEL?.trim() || "gemini-3.1-flash-live-preview"
  )
}

/** Structured chunks + final summary (generateContent). */
function getRestModel(): string {
  return process.env.GEMINI_REST_MODEL?.trim() || "gemini-3-flash-preview"
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  return new GoogleGenAI({ apiKey })
}

function extractTextFromLiveMessage(msg: { text?: string }): string {
  const direct = msg.text
  if (direct && direct.trim()) return direct

  const liveMsg = msg as {
    serverContent?: {
      modelTurn?: {
        parts?: Array<{
          text?: string
        }>
      }
      inputTranscription?: { text?: string }
      outputTranscription?: { text?: string }
    }
  }

  const inputTranscript = liveMsg.serverContent?.inputTranscription?.text
  if (inputTranscript && inputTranscript.trim()) return inputTranscript

  const outputTranscript = liveMsg.serverContent?.outputTranscription?.text
  if (outputTranscript && outputTranscript.trim()) return outputTranscript

  const modelTurnText = liveMsg.serverContent?.modelTurn?.parts
    ?.map((part) => part.text?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n")
  if (modelTurnText && modelTurnText.trim()) return modelTurnText

  return ""
}

/** Parse server message and update rolling text + bullets */
export function handleLiveServerMessage(
  state: InternalSessionState,
  message: unknown
): void {
  const text = extractTextFromLiveMessage(message as { text?: string })
  if (!text) return
  appendRollingText(state, text)
  const lines = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean)
  upsertLiveBulletsFromLines(state, lines.slice(-8))
}

/**
 * Open a Live API session; caller stores Session on InternalSessionState.
 */
export async function connectLiveSession(
  state: InternalSessionState
): Promise<Session> {
  const ai = getClient()
  const model = getLiveModel()

  const session = await ai.live.connect({
    model,
    config: {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
    },
    callbacks: {
      onmessage: (message) => {
        handleLiveServerMessage(state, message)
      },
      onerror: (e) => {
        console.error("[Live API] error", e)
      },
    },
  })

  return session
}

/** Send PCM audio chunk to Live API (16 kHz mono linear PCM). */
export function sendLiveAudioPcm(
  session: Session,
  pcmBytes: Uint8Array
): void {
  // In Node, @google/genai expects { data, mimeType } for realtime audio.
  const data = Buffer.from(pcmBytes).toString("base64")
  session.sendRealtimeInput({
    audio: {
      data,
      mimeType: "audio/pcm;rate=16000",
    },
  })
}

export async function consolidateChunk(
  state: InternalSessionState,
  lectureContext: string
): Promise<SavedChunkNote> {
  if (isMockMode()) {
    return mockSavedChunk(state)
  }
  const ai = getClient()
  const model = getRestModel()
  const startSec =
    state.lastSavedChunkAtMs != null
      ? Math.floor((state.lastSavedChunkAtMs - state.sessionStartMs) / 1000)
      : 0
  const endSec = sessionElapsedSec(state)

  const prompt = `You are structuring live lecture notes (not transcribing verbatim).

Lecture context since last saved block:
"""
${lectureContext.slice(0, 24_000)}
"""

Return ONE JSON object only with keys:
id (string, unique),
startTimeSec (number, ${startSec}),
endTimeSec (number, ${endSec}),
title (string, short section title),
keyPoints (array of strings),
importantTerms (array of strings),
exampleOrApplication (optional string),
possibleQuestion (optional string),
whyItMatters (optional string)

If context is thin, still produce best-effort study notes from what is present.`

  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  })

  const raw = res.text?.trim()
  if (!raw) throw new Error("Empty consolidation response")
  const parsed = JSON.parse(raw) as SavedChunkNote
  if (!parsed.id) parsed.id = `chunk-${Date.now()}`
  parsed.startTimeSec = startSec
  parsed.endTimeSec = endSec
  return parsed
}

export async function finalizeSessionSummary(
  state: InternalSessionState
): Promise<SessionSummary> {
  if (isMockMode()) {
    return mockSummary(state)
  }
  const ai = getClient()
  const model = getRestModel()

  const chunksText = state.savedChunks
    .map(
      (c) =>
        `## ${c.title} (${c.startTimeSec}s–${c.endTimeSec}s)\n` +
        c.keyPoints.join("\n- ")
    )
    .join("\n\n")

  const prompt = `Synthesize a final study guide from these timed lecture note blocks and any extra context.

Saved blocks:
${chunksText || "(none)"}

Extra recent context:
${state.bufferSinceLastChunk.slice(0, 12_000)}

Return JSON only:
{
  "overallSummary": string,
  "mainTopics": string[],
  "majorDefinitions": { "term": string, "definition": string }[],
  "importantExamples": string[],
  "actionItemsOrQuestions": string[]
}`

  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  })

  const raw = res.text?.trim()
  if (!raw) throw new Error("Empty summary response")
  return JSON.parse(raw) as SessionSummary
}

function mockSavedChunk(state: InternalSessionState): SavedChunkNote {
  const n = state.savedChunks.length + 1
  const endSec = sessionElapsedSec(state)
  const startSec = Math.max(0, endSec - Math.floor(getChunkIntervalMs() / 1000))
  return {
    id: `mock-chunk-${n}-${Date.now()}`,
    startTimeSec: startSec,
    endTimeSec: endSec,
    title: `Study segment ${n}`,
    keyPoints: [
      "Core idea from this segment (mock)",
      "Relationship to prior concepts (mock)",
    ],
    importantTerms: [`term_${n}a`, `term_${n}b`],
    exampleOrApplication: "Illustrative example (mock).",
    possibleQuestion: "How might this appear on an exam? (mock)",
    whyItMatters: "Connects to the unit learning goals (mock).",
  }
}

function mockSummary(state: InternalSessionState): SessionSummary {
  return {
    overallSummary:
      state.meta.title
        ? `Review of ${state.meta.title} (mock summary).`
        : "Session summary (mock).",
    mainTopics: ["Topic A (mock)", "Topic B (mock)"],
    majorDefinitions: [
      { term: "Key term (mock)", definition: "Definition placeholder." },
    ],
    importantExamples: ["Example (mock)"],
    actionItemsOrQuestions: ["Review practice questions (mock)"],
  }
}

/** Incremental mock: bullets + periodic chunks without API */
export function applyMockChunk(state: InternalSessionState): void {
  const t = sessionElapsedSec(state)
  const line = `[${t}s] Mock: key idea captured — definitions and examples tracked.`
  upsertLiveBulletsFromLines(state, [line])
  appendRollingText(state, line + "\n")
}
