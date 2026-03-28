"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import type { PublicSession } from "@/lib/types"
import {
  ArrowLeft,
  Download,
  Share2,
  Play,
  Pause,
  Volume2,
  Search,
  FileText,
  BookOpen,
  Lightbulb,
  AlertCircle,
  GraduationCap,
  Brain,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"

export function SummaryClient() {
  const searchParams = useSearchParams()
  const sessionId =
    searchParams.get("sessionId") ||
    (typeof window !== "undefined" ? sessionStorage.getItem("lectureSessionId") : null)

  const [session, setSession] = useState<PublicSession | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keyPoints: true,
    definitions: true,
    examples: true,
    examTopics: true,
  })

  useEffect(() => {
    if (!sessionId) {
      setLoadError("No session id. Start a session from the demo page.")
      return
    }
    void (async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (!res.ok) {
          setLoadError("Session not found or expired.")
          return
        }
        const data = (await res.json()) as PublicSession
        setSession(data)
      } catch {
        setLoadError("Could not load session.")
      }
    })()
  }, [sessionId])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const filtered = (text: string) => {
    if (!searchQuery.trim()) return true
    return text.toLowerCase().includes(searchQuery.toLowerCase())
  }

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

  if (!session.summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center max-w-md">
          No summary yet. End your lecture from the live page to generate a final study guide.
        </p>
        <Button asChild>
          <Link href={sessionId ? `/live?sessionId=${sessionId}` : "/live"}>Back to live</Link>
        </Button>
      </div>
    )
  }

  const summary = session.summary

  const noteCount = session.savedChunks.reduce((n, c) => n + c.keyPoints.length, 0) || session.savedChunks.length

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
                <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/40">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/40">
                  <Download className="h-4 w-4 mr-2" />
                  Export
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
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {isPlaying ? "Playing notes…" : "Listen to Summary"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">-- / --</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-primary rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <select className="h-8 px-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground focus:outline-none">
                        <option>1x</option>
                        <option>0.75x</option>
                        <option>1.25x</option>
                        <option>1.5x</option>
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
                  content: <p className="text-foreground leading-relaxed">{summary.overallSummary}</p>,
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
                    <ListChecks className="h-5 w-5 text-primary" />
                    Study Tools
                  </CardTitle>
                  <CardDescription>Generate study materials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: Brain, label: "Generate Flashcards" },
                    { icon: GraduationCap, label: "Create Practice Quiz" },
                    { icon: FileText, label: "Save to Study Guide" },
                    { icon: Download, label: "Download Notes (PDF)" },
                  ].map((tool) => (
                    <Button
                      key={tool.label}
                      variant="outline"
                      className="w-full justify-start border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <tool.icon className="h-4 w-4 mr-2 text-primary" />
                      {tool.label}
                    </Button>
                  ))}
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
