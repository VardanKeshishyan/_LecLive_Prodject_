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
import {
  DEFAULT_SESSION_PREFERENCES,
  type SessionMeta,
  type SessionPreferences,
  type UploadedMaterial,
} from "@/lib/types"

function sanitizePreferences(value: unknown): SessionPreferences {
  const input = (value ?? {}) as Partial<SessionPreferences>
  return {
    noteDetail:
      input.noteDetail === "brief" || input.noteDetail === "detailed"
        ? input.noteDetail
        : DEFAULT_SESSION_PREFERENCES.noteDetail,
    readingMode:
      input.readingMode === "everything"
        ? input.readingMode
        : DEFAULT_SESSION_PREFERENCES.readingMode,
    simplification:
      input.simplification === "simplified"
        ? input.simplification
        : DEFAULT_SESSION_PREFERENCES.simplification,
    textSize:
      input.textSize === "small" ||
      input.textSize === "large" ||
      input.textSize === "extra-large"
        ? input.textSize
        : DEFAULT_SESSION_PREFERENCES.textSize,
    highContrast: Boolean(input.highContrast),
    microphoneDeviceId:
      typeof input.microphoneDeviceId === "string" ? input.microphoneDeviceId : undefined,
    microphoneLabel:
      typeof input.microphoneLabel === "string" ? input.microphoneLabel : undefined,
    microphoneReady: Boolean(input.microphoneReady),
  }
}

function sanitizeMaterials(value: unknown): UploadedMaterial[] {
  if (!Array.isArray(value)) return []
  return value
    .map<UploadedMaterial | null>((item, index) => {
      const material = item as Partial<UploadedMaterial>
      const name = typeof material.name === "string" ? material.name.trim() : ""
      if (!name) return null
      const textContent =
        typeof material.textContent === "string"
          ? material.textContent.slice(0, 12_000)
          : undefined
      return {
        id:
          typeof material.id === "string" && material.id.trim()
            ? material.id
            : `material-${Date.now()}-${index}`,
        name,
        type: typeof material.type === "string" ? material.type : "application/octet-stream",
        size:
          typeof material.size === "number" && Number.isFinite(material.size) ? material.size : 0,
        ...(textContent ? { textContent } : {}),
      }
    })
    .filter((material): material is UploadedMaterial => Boolean(material))
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let meta: SessionMeta = {}
  let preferences = DEFAULT_SESSION_PREFERENCES
  let materials: UploadedMaterial[] = []
  try {
    const body = await req.json()
    meta = {
      title: body.title as string | undefined,
      course: body.course as string | undefined,
      instructor: body.instructor as string | undefined,
    }
    preferences = sanitizePreferences(body.preferences)
    materials = sanitizeMaterials(body.materials)
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

  const state = createSession(meta, preferences, materials)

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
