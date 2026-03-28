"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import type { PublicSession } from "@/lib/types"
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Share2,
  Play,
  Pause,
  Volume2,
  Bookmark,
  Search,
  FileText,
  BookOpen,
  Lightbulb,
  AlertCircle,
  GraduationCap,
  Brain,
  Presentation,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react"

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildTranscript(session: PublicSession): string {
  const transcript = session.spokenText.trim() || session.rollingText.trim()
  if (transcript) return transcript
  if (session.savedChunks.length === 0) return ""
  return session.savedChunks
    .map(
      (chunk) =>
        `[${chunk.startTimeSec}s-${chunk.endTimeSec}s] ${chunk.title}\n${chunk.keyPoints.join("\n")}`
    )
    .join("\n\n")
}

export function SummaryClient() {
  const searchParams = useSearchParams()
  const sessionId =
    searchParams.get("sessionId") ||
    (typeof window !== "undefined" ? sessionStorage.getItem("lectureSessionId") : null)

  const [session, setSession] = useState<PublicSession | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [speechRate, setSpeechRate] = useState(1)
  const [aiQuiz, setAiQuiz] = useState<string[]>([])
  const [showSimplified, setShowSimplified] = useState(false)
  const [marks, setMarks] = useState<Array<{ kind: string; atSec: number; note?: string }>>([])
  const [assistantPrompt, setAssistantPrompt] = useState("")
  const [assistantReply, setAssistantReply] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keyPoints: true,
    definitions: true,
    examples: true,
    examTopics: true,
  })
  const speakingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionPreferencesAppliedRef = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      setLoadError("No session id. Start a session from the demo page.")
      return
    }

    let cancelled = false
    const MAX_ATTEMPTS = 14  // ~40 seconds total
    const POLL_INTERVAL_MS = 3000

    const tryLoad = async (attempt: number) => {
      if (cancelled) return
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (!res.ok) {
          setLoadError("Session not found or expired.")
          return
        }
        const data = (await res.json()) as PublicSession
        setSession(data)

        // If no summary yet and we still have attempts, keep polling
        if (!data.summary && attempt < MAX_ATTEMPTS) {
          setTimeout(() => void tryLoad(attempt + 1), POLL_INTERVAL_MS)
          return
        }

        // Auto-save to My Notes once we have a summary
        if (data.summary) {
          try {
            const NOTES_KEY = "leclive_saved_notes"
            const existing = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]") as { id: string }[]
            const alreadySaved = existing.some((n) => n.id === `session-${sessionId}`)
            if (!alreadySaved) {
              const noteEntry = {
                id: `session-${sessionId}`,
                title: data.meta.title || "Untitled Lecture",
                course: data.meta.course,
                createdAt: data.createdAt,
                ...data.summary,
                savedChunks: data.savedChunks.map((c) => ({ title: c.title, keyPoints: c.keyPoints ?? [] })),
              }
              localStorage.setItem(NOTES_KEY, JSON.stringify([noteEntry, ...existing]))
            }
          } catch { /* ignore storage errors */ }
        }
      } catch {
        if (!cancelled) setLoadError("Could not load session.")
      }
    }

    void tryLoad(0)
    return () => { cancelled = true }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    try {
      const key = `lectureMarks:${sessionId}`
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as Array<{ kind: string; atSec: number; note?: string }>
      if (Array.isArray(parsed)) setMarks(parsed)
    } catch {
      /* ignore */
    }
  }, [sessionId])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!session || sessionPreferencesAppliedRef.current) return
    if (session.preferences.simplification === "simplified") {
      setShowSimplified(true)
    }
    sessionPreferencesAppliedRef.current = true
  }, [session])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const filtered = (text: string) => {
    if (!searchQuery.trim()) return true
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }
  const summary = session?.summary ?? null
  const transcriptText = useMemo(() => (session ? buildTranscript(session) : ""), [session])
  const simplifiedSummary = useMemo(() => {
    if (!summary) return ""
    const firstTopics = summary.mainTopics.slice(0, 3).join(". ")
    return `Simple version: ${summary.overallSummary} Main ideas: ${firstTopics || "Review saved notes for details."}`
  }, [summary])

  const noteCount = session
    ? session.savedChunks.reduce((n, c) => n + c.keyPoints.length, 0) || session.savedChunks.length
    : 0

  const exportSummary = useCallback(() => {
    if (!session || !summary) return
    const content = [
      session.meta.title || "Lecture summary",
      "",
      "Overall Summary",
      summary.overallSummary,
      "",
      "Main Topics",
      ...summary.mainTopics.map((t) => `- ${t}`),
      "",
      "Definitions",
      ...summary.majorDefinitions.map((d) => `- ${d.term}: ${d.definition}`),
      "",
      "Examples",
      ...summary.importantExamples.map((e) => `- ${e}`),
      "",
      "Questions / Actions",
      ...summary.actionItemsOrQuestions.map((q) => `- ${q}`),
    ].join("\n")
    downloadTextFile(`${(session.meta.title || "lecture-summary").replace(/\s+/g, "-")}.txt`, content)
  }, [session, summary])

  const downloadTranscript = useCallback(() => {
    if (!session) return
    if (!transcriptText.trim()) return
    downloadTextFile(
      `${(session.meta.title || "lecture-transcript").replace(/\s+/g, "-")}.txt`,
      transcriptText
    )
  }, [session, transcriptText])

  const generateQuiz = useCallback(() => {
    if (!summary) return
    const fromTopics = summary.mainTopics.slice(0, 3).map(
      (topic, i) => `Q${i + 1}. Explain this topic in your own words: ${topic}`
    )
    const fromDefs = summary.majorDefinitions.slice(0, 2).map(
      (d, i) => `Q${fromTopics.length + i + 1}. Define "${d.term}" and give one example.`
    )
    setAiQuiz([...fromTopics, ...fromDefs])
  }, [summary])

  const readSummaryAloud = useCallback(async () => {
    if (!summary) return

    // If audio is loaded and paused/playing, just toggle it
    if (audioRef.current && !audioRef.current.ended && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.playbackRate = speechRate
        void audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    // Fresh fetch
    const text = showSimplified ? simplifiedSummary : summary.overallSummary
    if (!text?.trim()) return

    setIsLoading(true)
    setIsPlaying(false)
    speakingRef.current = false
    // Clear old audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName: "Kore" }),
      })

      if (!res.ok) throw new Error("TTS request failed")

      const data = (await res.json()) as { audioBase64?: string; mimeType?: string; error?: string }
      if (!data.audioBase64) throw new Error(data.error ?? "No audio returned")

      const mimeType = data.mimeType ?? "audio/wav"
      const audioSrc = `data:${mimeType};base64,${data.audioBase64}`
      const audio = new Audio()
      audioRef.current = audio

      audio.addEventListener("loadedmetadata", () => {
        audio.playbackRate = speechRate
        setAudioDuration(audio.duration)
      })

      audio.addEventListener("timeupdate", () => {
        setAudioCurrentTime(audio.currentTime)
      })

      audio.onended = () => {
        speakingRef.current = false
        setIsPlaying(false)
        setAudioCurrentTime(0)
      }

      audio.onerror = () => {
        speakingRef.current = false
        setIsPlaying(false)
        setIsLoading(false)
      }

      audio.src = audioSrc
      audio.load()
      setIsLoading(false)
      speakingRef.current = true
      setIsPlaying(true)
      await audio.play()
    } catch (e) {
      console.error("[tts]", e)
      speakingRef.current = false
      setIsPlaying(false)
      setIsLoading(false)
    }
  }, [isPlaying, showSimplified, simplifiedSummary, speechRate, summary])

  // Apply rate change to currently playing audio without restarting
  useEffect(() => {
    if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
      audioRef.current.playbackRate = speechRate
    }
  }, [speechRate])

  const readTextAloud = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return
      const content = text.trim()
      if (!content) return
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = speechRate
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
    },
    [speechRate]
  )

  const handleAssistantPrompt = useCallback(async () => {
    const q = assistantPrompt.trim()
    if (!q || !sessionId || isAsking) return
    setIsAsking(true)
    setAssistantReply("")
    try {
      const res = await fetch(`/api/session/${sessionId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      })
      const data = (await res.json()) as { answer?: string; error?: string }
      setAssistantReply(data.answer ?? data.error ?? "No answer returned.")
    } catch {
      setAssistantReply("Connection error — please try again.")
    } finally {
      setIsAsking(false)
      setAssistantPrompt("")
    }
  }, [assistantPrompt, isAsking, sessionId])

  const handleAssistantAction = useCallback(
    (action: "simplify" | "quiz") => {
      if (!session || !summary) return
      if (action === "simplify") {
        setShowSimplified(true)
        setAssistantReply("Simplified mode enabled in the Summary section.")
        return
      }
      generateQuiz()
      setAssistantReply("Quiz generated from your summary.")
    },
    [generateQuiz, session, summary]
  )

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">{loadError}</p>
        <Button asChild>
          <Link href="/session">Start a session</Link>
        </Button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading summary…
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-foreground font-medium text-center">
          Generating your study guide…
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          This usually takes 15–30 seconds. Please wait.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-background relative overflow-hidden ${
        session.preferences.highContrast ? "contrast-125" : ""
      }`}
    >
      <div
        className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.68 0.16 280), transparent 70%)",
        }}
      />

      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 animate-fade-in-up">
            <Link
              href={sessionId ? `/live?sessionId=${sessionId}` : "/live"}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-5 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Session
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Session Complete</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
                  <span className="text-gradient-primary">
                    {session.meta.title || "Lecture summary"}
                  </span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {session.meta.course && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {session.meta.course}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {noteCount} note lines
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover-glow active:bg-primary/15"
                  onClick={async () => {
                    const shareUrl =
                      typeof window !== "undefined" ? window.location.href : ""
                    if (!shareUrl) return
                    try {
                      await navigator.clipboard.writeText(shareUrl)
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover-glow active:bg-primary/15"
                  onClick={downloadTranscript}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Transcript
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover-glow active:bg-primary/15"
                  onClick={exportSummary}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Summary
                </Button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div className="relative animate-fade-in-up-delay-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, definitions, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 rounded-xl transition-colors"
                />
              </div>

              <Card className="card-futuristic animate-fade-in-up-delay-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      className="h-10 w-10 rounded-full p-0 glow-primary flex-shrink-0"
                      onClick={readSummaryAloud}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {isLoading ? "Generating audio…" : isPlaying ? "Playing…" : "Listen to Summary"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {audioDuration > 0
                            ? `${Math.floor(audioCurrentTime / 60)}:${String(Math.floor(audioCurrentTime % 60)).padStart(2, "0")} / ${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, "0")}`
                            : "-- / --"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: audioDuration > 0 ? `${(audioCurrentTime / audioDuration) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <select
                        className="h-8 px-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground focus:outline-none"
                        value={String(speechRate)}
                        onChange={(e) => setSpeechRate(Number(e.target.value))}
                      >
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {[
                {
                  id: "summary",
                  icon: BookOpen,
                  iconColor: "text-primary",
                  title: "Summary",
                  visible: filtered(summary.overallSummary),
                  content: (
                    <p className="text-foreground leading-relaxed">
                      {showSimplified ? simplifiedSummary : summary.overallSummary}
                    </p>
                  ),
                },
                {
                  id: "keyPoints",
                  icon: Lightbulb,
                  iconColor: "text-primary",
                  title: "Main topics",
                  visible: summary.mainTopics.some((t) => filtered(t)),
                  content: (
                    <ul className="space-y-3">
                      {summary.mainTopics
                        .filter((t) => filtered(t))
                        .map((point, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{index + 1}</span>
                            </span>
                            <span className="text-foreground leading-relaxed">{point}</span>
                          </li>
                        ))}
                    </ul>
                  ),
                },
                {
                  id: "definitions",
                  icon: FileText,
                  iconColor: "text-accent",
                  title: "Definitions",
                  visible: summary.majorDefinitions.some(
                    (d) => filtered(d.term) || filtered(d.definition)
                  ),
                  content: (
                    <div className="space-y-3">
                      {summary.majorDefinitions
                        .filter((d) => filtered(d.term) || filtered(d.definition))
                        .map((def, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover-glow transition-all duration-300"
                          >
                            <h4 className="font-semibold text-foreground mb-1">{def.term}</h4>
                            <p className="text-muted-foreground text-sm">{def.definition}</p>
                          </div>
                        ))}
                    </div>
                  ),
                },
                {
                  id: "examples",
                  icon: Brain,
                  iconColor: "text-chart-3",
                  title: "Examples",
                  visible: summary.importantExamples.some((ex) => filtered(ex)),
                  content: (
                    <div className="space-y-3">
                      {summary.importantExamples
                        .filter((ex) => filtered(ex))
                        .map((example, index) => (
                          <div key={index} className="p-4 rounded-xl bg-chart-3/5 border border-chart-3/20">
                            <p className="text-foreground">{example}</p>
                          </div>
                        ))}
                    </div>
                  ),
                },
                {
                  id: "examTopics",
                  icon: GraduationCap,
                  iconColor: "text-destructive",
                  title: "Questions / actions",
                  visible: summary.actionItemsOrQuestions.some((t) => filtered(t)),
                  content: (
                    <div className="space-y-3">
                      {summary.actionItemsOrQuestions
                        .filter((t) => filtered(t))
                        .map((topic, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                          >
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{topic}</span>
                          </div>
                        ))}
                    </div>
                  ),
                },
              ]
                .filter((s) => s.visible)
                .map((section) => (
                  <Card key={section.id} className="card-futuristic overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <section.icon className={`h-5 w-5 ${section.iconColor}`} />
                          {section.title}
                        </CardTitle>
                        {expandedSections[section.id] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections[section.id] && <CardContent>{section.content}</CardContent>}
                  </Card>
                ))}
            </div>

            <div className="lg:col-span-1 space-y-5">
              <Card className="card-futuristic animate-fade-in-up-delay-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-chart-3" />
                    Saved blocks
                  </CardTitle>
                  <CardDescription>Structured segments from your lecture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {session.savedChunks.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl border border-border/30 bg-secondary/30">
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {c.startTimeSec}s – {c.endTimeSec}s
                        </p>
                      </div>
                    ))}
                    {session.savedChunks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No blocks saved in this session.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-futuristic animate-fade-in-up-delay-3">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription>Ask and run post-session actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30">
                    <button
                      type="button"
                      onClick={handleAssistantPrompt}
                      className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors glow-primary"
                    >
                      <ArrowRight className="h-4 w-4 text-primary-foreground" />
                    </button>
                    <input
                      type="text"
                      placeholder="Ask a question…"
                      value={assistantPrompt}
                      onChange={(e) => setAssistantPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAssistantPrompt()
                      }}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {[
                      {
                        icon: Lightbulb,
                        label: "Simplify Concept",
                        description: "Show easier version in summary",
                        action: "simplify" as const,
                      },

                      {
                        icon: GraduationCap,
                        label: "Make Quiz",
                        description: "Generate quick practice questions",
                        action: "quiz" as const,
                      },
                    ].map((tool) => (
                      <button
                        key={tool.label}
                        type="button"
                        onClick={() => handleAssistantAction(tool.action)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border/30 hover:border-primary/30 transition-all duration-200 text-left group"
                      >
                        <tool.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{tool.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={() => setShowSimplified((prev) => !prev)}
                    >
                      <Brain className="h-4 w-4 mr-2 text-primary" />
                      {showSimplified ? "Original" : "Simplify"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={downloadTranscript}
                    >
                      <Download className="h-4 w-4 mr-2 text-primary" />
                      Transcript
                    </Button>
                  </div>

                  {assistantReply && (
                    <div className="p-3 rounded-xl bg-secondary/40 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Assistant reply</p>
                      <p className="text-sm text-foreground/90">{assistantReply}</p>
                    </div>
                  )}
                  {marks.length > 0 && (
                    <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Session markers</p>
                      <div className="space-y-1">
                        {marks.slice(0, 3).map((m, i) => (
                          <p key={i} className="text-xs text-foreground/80">
                            <Bookmark className="h-3 w-3 inline mr-1" />
                            {m.kind === "confusion" ? "Confusion" : "Bookmark"} at {m.atSec}s
                            {m.note ? ` - ${m.note}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiQuiz.length > 0 && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mt-2 space-y-1.5">
                      <p className="text-xs text-primary font-medium">Quick Quiz</p>
                      {aiQuiz.map((q, i) => (
                        <p key={i} className="text-xs text-foreground/90">
                          {q}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-futuristic animate-fade-in-up-delay-4">
                <CardHeader>
                  <CardTitle className="text-lg">Session Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: String(session.savedChunks.length),
                        label: "Saved blocks",
                        color: "text-primary",
                      },
                      {
                        value: String(summary.majorDefinitions.length),
                        label: "Definitions",
                        color: "text-primary",
                      },
                      {
                        value: String(summary.importantExamples.length),
                        label: "Examples",
                        color: "text-primary",
                      },
                      {
                        value: String(summary.actionItemsOrQuestions.length),
                        label: "Action items",
                        color: "text-destructive",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30"
                      >
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full glow-primary group" size="lg" asChild>
                <Link href="/session">
                  Start New Session
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
