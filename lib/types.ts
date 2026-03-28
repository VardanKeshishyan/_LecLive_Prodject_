/** Shared types for lecture sessions (client + server). */

export type SessionStatus = "live" | "organizing" | "idle"

export interface LiveBullet {
  id: string
  text: string
  kind?: string
  createdAt: string
}

export interface SavedChunkNote {
  id: string
  /** Session-relative start in seconds */
  startTimeSec: number
  /** Session-relative end in seconds */
  endTimeSec: number
  title: string
  keyPoints: string[]
  importantTerms: string[]
  exampleOrApplication?: string
  possibleQuestion?: string
  whyItMatters?: string
}

export interface SessionSummary {
  overallSummary: string
  mainTopics: string[]
  majorDefinitions: { term: string; definition: string }[]
  importantExamples: string[]
  actionItemsOrQuestions: string[]
}

export interface SessionMeta {
  title?: string
  course?: string
  instructor?: string
}

/** Serializable session for GET /api/session/[id] and summary UI */
export interface PublicSession {
  id: string
  meta: SessionMeta
  createdAt: string
  sessionStartMs: number
  status: SessionStatus
  lastUpdated: string
  liveBullets: LiveBullet[]
  spokenText: string
  assistantText: string
  rollingText: string
  savedChunks: SavedChunkNote[]
  summary?: SessionSummary
  /** When Live connection failed but session continues in degraded/mock path */
  fallbackNote?: string
}

export interface ChunkResponse {
  liveBullets: LiveBullet[]
  /** New saved blocks since previous chunk response (delta) */
  newSavedBlocks: SavedChunkNote[]
  status: SessionStatus
  lastUpdated: string
}

export interface StartResponse {
  sessionId: string
  fallbackNote?: string
}

export interface StopResponse {
  session: PublicSession
}
