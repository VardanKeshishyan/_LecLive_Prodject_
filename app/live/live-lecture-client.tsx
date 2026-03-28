"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { startPcmStreaming, type PcmStreamHandle } from "@/lib/client/pcm-stream"
import type { PublicSession, SavedChunkNote, SessionPreferences, TextSizePreference } from "@/lib/types"
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  RefreshCw,
  Volume2,
  Bookmark,
  AlertCircle,
  Presentation,
  ChevronRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  Clock,
  Tag,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Zap,
  FileText,
} from "lucide-react"

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function formatRange(startSec: number, endSec: number): string {
  return `${formatClock(startSec)}–${formatClock(endSec)}`
}

function textSizeFromPreference(size?: TextSizePreference): number {
  switch (size) {
    case "small":
      return 14
    case "large":
      return 18
    case "extra-large":
      return 20
    default:
      return 16
  }
}

function summarizeSessionPreferences(preferences?: SessionPreferences): string {
  if (!preferences) return "Notes emphasize ideas, terms, and exam-relevant signals—not raw transcript."

  const parts = [
    preferences.noteDetail === "brief"
      ? "brief note blocks"
      : preferences.noteDetail === "detailed"
        ? "detailed note blocks"
        : "balanced note blocks",
    preferences.readingMode === "everything" ? "full reading mode" : "key-points mode",
    preferences.simplification === "simplified" ? "easier wording" : "standard wording",
  ]

  return `Session is using ${parts.join(", ")}.`
}

type SessionMarkKind = "confusion" | "bookmark"

interface SessionMark {
  id: string
  kind: SessionMarkKind
  atSec: number
  createdAt: string
  note: string
}

export function LiveLectureClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<PublicSession | null>(null)
  const [spokenText, setSpokenText] = useState("")
  const [localSpokenText, setLocalSpokenText] = useState("")
  const [rollingText, setRollingText] = useState("")
  const [savedChunks, setSavedChunks] = useState<SavedChunkNote[]>([])
  const [apiStatus, setApiStatus] = useState<string>("Live")
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("")

  const [isRecording, setIsRecording] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [textSize, setTextSize] = useState(16)
  const [highContrast, setHighContrast] = useState(false)
  const [preferredMicrophoneId, setPreferredMicrophoneId] = useState("")
  const [currentSlide, setCurrentSlide] = useState(8)
  const [marks, setMarks] = useState<SessionMark[]>([])
  const [lastMarkLabel, setLastMarkLabel] = useState("")

  const streamRef = useRef<PcmStreamHandle | null>(null)
  const speechRecognizerRef = useRef<{
    start: () => void
    stop: () => void
    onresult: ((ev: unknown) => void) | null
    onerror: ((ev: unknown) => void) | null
    onend: (() => void) | null
    continuous: boolean
    interimResults: boolean
    lang: string
  } | null>(null)
  const speechFinalRef = useRef("")
  const shouldRunSpeechRef = useRef(false)
  const pausedRef = useRef(isPaused)
  const appliedSessionPreferencesRef = useRef(false)
  pausedRef.current = isPaused

  const resetMissingSession = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("lectureSessionId")
    }
    setApiStatus("Session expired - start again")
    router.replace("/session")
  }

  useEffect(() => {
    const id =
      searchParams.get("sessionId") ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("lectureSessionId")
        : null)
    if (!id) {
      router.replace("/session")
      return
    }
    setSessionId(id)
    sessionStorage.setItem("lectureSessionId", id)

    try {
      const raw = sessionStorage.getItem("lectureSessionSetup")
      if (!raw) return
      const stored = JSON.parse(raw) as { preferences?: SessionPreferences }
      if (!stored.preferences) return
      setPreferredMicrophoneId(stored.preferences.microphoneDeviceId ?? "")
      setTextSize(textSizeFromPreference(stored.preferences.textSize))
      setHighContrast(Boolean(stored.preferences.highContrast))
    } catch {
      /* ignore setup hydration errors */
    }
  }, [router, searchParams])

  useEffect(() => {
    if (!isPaused && isRecording) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused, isRecording])

  const hydrateFromPublic = useCallback((pub: PublicSession) => {
    setSession(pub)
    setSpokenText(pub.spokenText)
    setRollingText(pub.rollingText)
    setSavedChunks(pub.savedChunks)
    if (!appliedSessionPreferencesRef.current) {
      setTextSize(textSizeFromPreference(pub.preferences.textSize))
      setHighContrast(Boolean(pub.preferences.highContrast))
      setPreferredMicrophoneId(pub.preferences.microphoneDeviceId ?? "")
      appliedSessionPreferencesRef.current = true
    }
    if (pub.status === "organizing") setApiStatus("Organizing notes…")
    else setApiStatus("Live")
    if (pub.lastUpdated) {
      setLastUpdatedLabel(new Date(pub.lastUpdated).toLocaleTimeString())
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return
    void (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.status === 404) {
          resetMissingSession()
          return
        }
        if (!res.ok) return
        const pub = (await res.json()) as PublicSession
        hydrateFromPublic(pub)
      } catch {
        /* ignore */
      }
    })()
  }, [sessionId, hydrateFromPublic])

  const mergeChunkResponse = useCallback((pub: PublicSession) => {
    hydrateFromPublic(pub)
    setSavedChunks(pub.savedChunks)
  }, [hydrateFromPublic])

  const addSessionMark = useCallback(
    (kind: SessionMarkKind) => {
      const createdAt = new Date().toISOString()
      const atSec = elapsedTime
      const transcriptSource =
        localSpokenText.trim() || spokenText.trim() || rollingText.trim()
      const latestLine = transcriptSource
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(-1)[0]
      const note = latestLine || `Marked at ${formatClock(atSec)}`
      const mark: SessionMark = {
        id: `${kind}-${Date.now()}`,
        kind,
        atSec,
        createdAt,
        note,
      }
      setMarks((prev) => {
        const next = [mark, ...prev].slice(0, 50)
        if (sessionId) {
          const key = `lectureMarks:${sessionId}`
          try {
            localStorage.setItem(key, JSON.stringify(next))
            sessionStorage.setItem(key, JSON.stringify(next))
          } catch {
            /* ignore */
          }
        }
        return next
      })
      const label =
        kind === "confusion"
          ? `Confusion marked at ${formatClock(atSec)}`
          : `Moment saved at ${formatClock(atSec)}`
      setLastMarkLabel(label)
      setApiStatus(label)
    },
    [elapsedTime, localSpokenText, rollingText, sessionId, spokenText]
  )

  const flushAudioStream = useCallback(
    async (keepalive?: boolean) => {
      if (!sessionId) return
      try {
        await fetch("/api/live/flush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          keepalive,
        })
      } catch {
        /* ignore flush failures */
      }
    },
    [sessionId]
  )

  useEffect(() => {
    if (!sessionId || !isRecording) return

    let cancelled = false

    void (async () => {
      try {
        const handle = await startPcmStreaming(sessionId, {
          deviceId: preferredMicrophoneId || undefined,
          shouldSend: () => !pausedRef.current && !cancelled,
          onTransportError: (e) => {
            console.error("[chunk]", e)
            const message = e instanceof Error ? e.message : String(e)
            if (message.includes("Session not found")) {
              resetMissingSession()
              return
            }
            setApiStatus("Live stream error")
          },
          onChunkResponse: (body) => {
            const b = body as { session?: PublicSession }
            if (b.session) mergeChunkResponse(b.session)
          },
        })
        if (cancelled) {
          handle.stop()
          return
        }
        streamRef.current = handle
      } catch (e) {
        console.error("[mic]", e)
        setApiStatus("Mic error — check permissions")
      }
    })()

    return () => {
      cancelled = true
      streamRef.current?.stop()
      streamRef.current = null
    }
  }, [sessionId, isRecording, mergeChunkResponse, preferredMicrophoneId])

  useEffect(() => {
    if (!sessionId) return

    shouldRunSpeechRef.current = isRecording && !isPaused

    const SpeechRecognitionCtor = (
      window as Window & {
        SpeechRecognition?: new () => {
          start: () => void
          stop: () => void
          onresult: ((ev: unknown) => void) | null
          onerror: ((ev: unknown) => void) | null
          onend: (() => void) | null
          continuous: boolean
          interimResults: boolean
          lang: string
        }
        webkitSpeechRecognition?: new () => {
          start: () => void
          stop: () => void
          onresult: ((ev: unknown) => void) | null
          onerror: ((ev: unknown) => void) | null
          onend: (() => void) | null
          continuous: boolean
          interimResults: boolean
          lang: string
        }
      }
    ).SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: new () => {
            start: () => void
            stop: () => void
            onresult: ((ev: unknown) => void) | null
            onerror: ((ev: unknown) => void) | null
            onend: (() => void) | null
            continuous: boolean
            interimResults: boolean
            lang: string
          }
        }
      ).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) return
    if (speechRecognizerRef.current) return

    const recognition = new SpeechRecognitionCtor()
    speechRecognizerRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (ev: unknown) => {
      const event = ev as {
        resultIndex: number
        results: ArrayLike<{
          isFinal: boolean
          0?: { transcript?: string }
        }>
      }

      let interim = ""
      let finalChunk = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result?.[0]?.transcript?.trim()
        if (!text) continue
        if (result.isFinal) {
          finalChunk += `${finalChunk ? " " : ""}${text}`
        } else {
          interim += `${interim ? " " : ""}${text}`
        }
      }

      if (finalChunk) {
        speechFinalRef.current = [speechFinalRef.current, finalChunk]
          .filter(Boolean)
          .join("\n")
      }
      setLocalSpokenText([speechFinalRef.current, interim].filter(Boolean).join("\n"))
    }

    recognition.onerror = () => {
      /* ignore fallback speech errors */
    }

    recognition.onend = () => {
      if (!shouldRunSpeechRef.current) return
      try {
        recognition.start()
      } catch {
        /* ignore restart errors */
      }
    }

    if (shouldRunSpeechRef.current) {
      try {
        recognition.start()
      } catch {
        /* ignore start errors */
      }
    }

    return () => {
      shouldRunSpeechRef.current = false
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.onend = null
        try {
          speechRecognizerRef.current.stop()
        } catch {
          /* ignore */
        }
      }
      speechRecognizerRef.current = null
    }
  }, [isPaused, isRecording, sessionId])

  useEffect(() => {
    if (!sessionId || isPaused) return
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.status === 404) {
          resetMissingSession()
          return
        }
        if (!res.ok) return
        const pub = (await res.json()) as PublicSession
        mergeChunkResponse(pub)
      } catch {
        /* ignore */
      }
    }, 4000)
    return () => clearInterval(poll)
  }, [sessionId, isPaused, mergeChunkResponse])

  useEffect(() => {
    if (!sessionId || !isPaused || !isRecording) return
    void flushAudioStream()
  }, [flushAudioStream, isPaused, isRecording, sessionId])

  useEffect(() => {
    if (!sessionId) return
    const key = `lectureMarks:${sessionId}`
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as SessionMark[]
      if (Array.isArray(parsed)) setMarks(parsed)
    } catch {
      /* ignore */
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    const key = `lectureMarks:${sessionId}`
    try {
      localStorage.setItem(key, JSON.stringify(marks))
      sessionStorage.setItem(key, JSON.stringify(marks))
    } catch {
      /* ignore */
    }
  }, [marks, sessionId])

  useEffect(() => {
    if (!sessionId) return

    const onBeforeUnload = () => {
      const payload = JSON.stringify({ sessionId })
      try {
        const blob = new Blob([payload], { type: "application/json" })
        if (navigator.sendBeacon("/api/live/flush", blob)) return
      } catch {
        /* ignore */
      }

      void fetch("/api/live/flush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      })
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [sessionId])

  const endSession = () => {
    streamRef.current?.stop()
    streamRef.current = null
    void (async () => {
      if (!sessionId) return
      try {
        await flushAudioStream(true)
        await fetch("/api/live/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
      } catch (e) {
        console.error(e)
      }
      router.push(`/summary?sessionId=${sessionId}`)
    })()
  }

  const lectureTitle = session?.meta.title || "Live lecture"
  const showExpandedNoteDetails = session?.preferences.readingMode === "everything"
  const sessionMaterials = session?.materials ?? []
  const materialCount = sessionMaterials.length
  const visibleMaterialIndex =
    materialCount > 0 ? Math.min(Math.max(currentSlide, 1), materialCount) : currentSlide
  const selectedMaterial = sessionMaterials[Math.max(visibleMaterialIndex - 1, 0)]
  const micLabel = session?.preferences.microphoneLabel || "Default Microphone"

  useEffect(() => {
    if (materialCount === 0) return
    setCurrentSlide((prev) => (prev >= 1 && prev <= materialCount ? prev : 1))
  }, [materialCount])

  return (
    <div className={`min-h-screen bg-background ${highContrast ? "contrast-125" : ""}`}>
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isRecording && !isPaused && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                )}
                <span
                  className={`text-sm font-semibold ${isPaused ? "text-muted-foreground" : "text-destructive"}`}
                >
                  {isPaused ? "Paused" : "LIVE"}
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border/50" />
              <h1 className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[200px]">
                {lectureTitle}
              </h1>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40">
                {apiStatus}
                {lastUpdatedLabel ? ` · ${lastUpdatedLabel}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-mono text-foreground tabular-nums">
                  {formatClock(elapsedTime)}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isRecording ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border/50"}`}
              >
                {isRecording ? (
                  <Mic className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="hidden sm:inline text-sm text-foreground">
                  {isRecording ? "Listening" : "Muted"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-border/50"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button variant="destructive" size="sm" className="h-8" onClick={endSession}>
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  End
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-5 pt-4">
            <div className="lg:col-span-3 space-y-4">
              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-primary" />
                    Current Slide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-secondary/50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden border border-border/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                    {selectedMaterial ? (
                      <div className="text-center z-10 px-4">
                        <FileText className="h-10 w-10 text-primary/50 mx-auto mb-2" />
                        <p className="text-sm text-foreground font-medium line-clamp-2">
                          {selectedMaterial.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Uploaded session material</p>
                      </div>
                    ) : (
                      <div className="text-center z-10">
                        <Presentation className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground/60">No uploaded materials yet</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedMaterial
                        ? `Material ${visibleMaterialIndex} of ${materialCount}`
                        : "Upload materials from setup to keep them visible here"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={materialCount === 0}
                        onClick={() => setCurrentSlide(Math.max(1, visibleMaterialIndex - 1))}
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={materialCount === 0}
                        onClick={() => setCurrentSlide(Math.min(Math.max(materialCount, 1), visibleMaterialIndex + 1))}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {session?.fallbackNote || summarizeSessionPreferences(session?.preferences)}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <div className="text-xs text-foreground/80 flex justify-between gap-2">
                      <span className="text-muted-foreground">Microphone</span>
                      <span className="truncate text-right">{micLabel}</span>
                    </div>
                    <div className="text-xs text-foreground/80 flex justify-between gap-2">
                      <span className="text-muted-foreground">Reading mode</span>
                      <span>{showExpandedNoteDetails ? "Everything" : "Key points"}</span>
                    </div>
                    <div className="text-xs text-foreground/80 flex justify-between gap-2">
                      <span className="text-muted-foreground">Materials</span>
                      <span>{materialCount}</span>
                    </div>
                  </div>
                  {sessionMaterials.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {sessionMaterials.slice(0, 3).map((material) => (
                        <div
                          key={material.id}
                          className="text-xs text-foreground/80 border-l-2 border-primary/30 pl-2"
                        >
                          <p>{material.name}</p>
                          <p className="text-muted-foreground">
                            {material.textContent ? "Text context available" : "Reference attached"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {marks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {marks.slice(0, 3).map((mark) => (
                        <div
                          key={mark.id}
                          className="text-xs text-foreground/80 border-l-2 border-primary/30 pl-2"
                        >
                          <p>
                            {mark.kind === "confusion" ? "Confusion" : "Bookmark"} at{" "}
                            {formatClock(mark.atSec)}
                          </p>
                          <p className="text-muted-foreground line-clamp-2">{mark.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <Card className="card-futuristic overflow-hidden border-primary/15">
                <CardHeader className="pb-2 border-b border-border/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Live spoken words
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 max-h-36 overflow-y-auto">
                  {spokenText.trim() ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-snug">
                      {spokenText}
                    </p>
                  ) : localSpokenText.trim() ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-snug">
                      {localSpokenText}
                    </p>
                  ) : rollingText.trim() ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground/70 leading-snug">
                      {rollingText}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Waiting for audio...</p>
                  )}
                </CardContent>
              </Card>

              <Card className="card-futuristic h-full overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Saved structured notes
                    </CardTitle>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/50">
                      {savedChunks.length} blocks
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    className="max-h-[calc(100vh-420px)] min-h-[200px] overflow-y-auto p-4 space-y-4"
                    style={{ fontSize: `${textSize}px` }}
                  >
                    {savedChunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="rounded-xl border border-border/40 bg-primary/5 p-4 hover-glow transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{chunk.title}</h3>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              {formatRange(chunk.startTimeSec, chunk.endTimeSec)}
                            </p>
                          </div>
                        </div>
                        {chunk.keyPoints.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-primary mb-1">Key points</p>
                            <ul className="list-disc pl-4 space-y-1 text-foreground/90">
                              {chunk.keyPoints.map((k, i) => (
                                <li key={i}>{k}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {showExpandedNoteDetails && chunk.importantTerms.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {chunk.importantTerms.map((t, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {showExpandedNoteDetails && chunk.exampleOrApplication && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="text-chart-3 font-medium">Example: </span>
                            {chunk.exampleOrApplication}
                          </p>
                        )}
                        {showExpandedNoteDetails && (chunk.possibleQuestion || chunk.whyItMatters) && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {chunk.possibleQuestion && (
                              <p>
                                <span className="font-medium text-foreground/80">Question: </span>
                                {chunk.possibleQuestion}
                              </p>
                            )}
                            {chunk.whyItMatters && (
                              <p>
                                <span className="font-medium text-foreground/80">Why it matters: </span>
                                {chunk.whyItMatters}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {savedChunks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Saved blocks appear as you keep speaking. Nothing is
                        removed when new blocks arrive.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Post-Lecture Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    {[
                      {
                        icon: RefreshCw,
                        label: "Repeat Last Point",
                        description: "Hear the last key point again",
                      },
                      {
                        icon: Lightbulb,
                        label: "Simplify Concept",
                        description: "Explain in simpler terms",
                      },
                      {
                        icon: Volume2,
                        label: "Read Aloud",
                        description: "Read recent notes",
                      },
                      {
                        icon: Presentation,
                        label: "Current Slide",
                        description: "What slide are we on?",
                      },
                      {
                        icon: GraduationCap,
                        label: "Make Quiz",
                        description: "Generate a quick quiz from recent notes",
                      },
                    ].map((action, index) => (
                      <div
                        key={index}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30 text-left opacity-80"
                      >
                        <action.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These tools unlock in the Summary page after the session ends.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Text Size</span>
                      <span className="text-sm text-foreground font-mono">{textSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border/50"
                        onClick={() => setTextSize(Math.max(12, textSize - 2))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${((textSize - 12) / 12) * 100}%` }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border/50"
                        onClick={() => setTextSize(Math.min(24, textSize + 2))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setHighContrast(!highContrast)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        highContrast
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {highContrast ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span className="text-sm">High Contrast</span>
                      </div>
                      <div
                        className={`h-5 w-9 rounded-full transition-colors ${highContrast ? "bg-primary" : "bg-muted"}`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-background transition-transform mt-0.5 shadow-sm ${highContrast ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`}
                        />
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="mx-auto max-w-7xl">
            {lastMarkLabel && (
              <p className="text-xs text-primary text-center mb-2">{lastMarkLabel}</p>
            )}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="gap-2 border-border/50 hover:border-primary/40"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-chart-3/30 text-chart-3 hover:bg-chart-3/10 hover:border-chart-3/50"
                onClick={() => addSessionMark("confusion")}
              >
                <AlertCircle className="h-4 w-4" />
                Mark Confusion
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/50 hover:border-primary/40"
                onClick={() => addSessionMark("bookmark")}
              >
                <Bookmark className="h-4 w-4" />
                Save Moment
              </Button>

              <Button variant="destructive" size="sm" onClick={endSession} className="gap-2">
                <Square className="h-4 w-4" />
                End Lecture
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
