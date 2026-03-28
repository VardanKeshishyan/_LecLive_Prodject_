import { randomUUID } from "crypto"
import type { Session } from "@google/genai"
import type {
  LiveBullet,
  PublicSession,
  SavedChunkNote,
  SessionMeta,
  SessionStatus,
  SessionSummary,
} from "@/lib/types"

/** Internal session state (server only) */
export interface InternalSessionState {
  id: string
  meta: SessionMeta
  createdAt: string
  sessionStartMs: number
  status: SessionStatus
  lastUpdated: string
  liveBullets: LiveBullet[]
  savedChunks: SavedChunkNote[]
  summary?: SessionSummary
  /** Rolling text from the Live model (study-style, not raw transcript) */
  rollingModelText: string
  /** Text accumulated since last saved chunk (for REST consolidation) */
  bufferSinceLastChunk: string
  lastSavedChunkAtMs: number | null
  /** Serialized chunk processing */
  chain: Promise<void>
  liveSession: Session | null
  mockMode: boolean
  fallbackNote?: string
}

const globalStore = globalThis as typeof globalThis & {
  __lectureSessionStore__?: Map<string, InternalSessionState>
}

const store =
  globalStore.__lectureSessionStore__ ??
  (globalStore.__lectureSessionStore__ = new Map<string, InternalSessionState>())

export function createSession(meta: SessionMeta): InternalSessionState {
  const id = randomUUID()
  const now = Date.now()
  const state: InternalSessionState = {
    id,
    meta,
    createdAt: new Date(now).toISOString(),
    sessionStartMs: now,
    status: "live",
    lastUpdated: new Date(now).toISOString(),
    liveBullets: [],
    savedChunks: [],
    rollingModelText: "",
    bufferSinceLastChunk: "",
    lastSavedChunkAtMs: null,
    chain: Promise.resolve(),
    liveSession: null,
    mockMode: false,
  }
  store.set(id, state)
  return state
}

export function getSession(id: string): InternalSessionState | undefined {
  return store.get(id)
}

export function deleteSession(id: string): void {
  store.delete(id)
}

export function touch(state: InternalSessionState): void {
  state.lastUpdated = new Date().toISOString()
}

export function appendRollingText(state: InternalSessionState, text: string): void {
  if (!text.trim()) return
  const normalized = text.trim()
  if (state.rollingModelText.length > 0) {
    state.rollingModelText += "\n"
  }
  state.rollingModelText += normalized
  state.bufferSinceLastChunk += `${normalized}\n`
  touch(state)
}

export function pushSavedChunk(state: InternalSessionState, chunk: SavedChunkNote): void {
  state.savedChunks.push(chunk)
  state.lastSavedChunkAtMs = Date.now()
  state.bufferSinceLastChunk = ""
  touch(state)
}

export function setSummary(state: InternalSessionState, summary: SessionSummary): void {
  state.summary = summary
  state.status = "idle"
  touch(state)
}

export function setLiveSession(state: InternalSessionState, session: Session | null): void {
  state.liveSession = session
}

export function toPublicSession(state: InternalSessionState): PublicSession {
  return {
    id: state.id,
    meta: state.meta,
    createdAt: state.createdAt,
    sessionStartMs: state.sessionStartMs,
    status: state.status,
    lastUpdated: state.lastUpdated,
    liveBullets: state.liveBullets,
    rollingText: state.rollingModelText,
    savedChunks: state.savedChunks,
    summary: state.summary,
    fallbackNote: state.fallbackNote,
  }
}

/**
 * Run async work serialized per session (avoid concurrent Live / REST calls racing).
 */
export function enqueueSessionWork<T>(
  state: InternalSessionState,
  fn: () => Promise<T>
): Promise<T> {
  const run = state.chain.then(fn, fn)
  state.chain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

const MAX_LIVE_BULLETS = 14

export function upsertLiveBulletsFromLines(state: InternalSessionState, lines: string[]): void {
  const trimmed = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 200)
  for (const text of trimmed.slice(-MAX_LIVE_BULLETS)) {
    const dup = state.liveBullets.some((b) => b.text === text)
    if (dup) continue
    state.liveBullets.push({
      id: randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    })
  }
  while (state.liveBullets.length > MAX_LIVE_BULLETS) {
    state.liveBullets.shift()
  }
  touch(state)
}

export function sessionElapsedSec(state: InternalSessionState): number {
  return Math.floor((Date.now() - state.sessionStartMs) / 1000)
}
