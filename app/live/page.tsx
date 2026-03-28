"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  Bookmark,
  Pin,
  AlertCircle,
  Presentation,
  ChevronRight,
  Sparkles,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  Clock,
  Tag,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon
} from "lucide-react"

const sampleNotes = [
  {
    id: 1,
    type: "key-point",
    time: "Note A",
    content: "Classical conditioning is a learning process where two stimuli are repeatedly paired together until a response that was initially triggered by the second stimulus is now triggered by the first stimulus alone.",
    pinned: false
  },
  {
    id: 2,
    type: "definition",
    time: "Note B",
    content: "Unconditioned Stimulus (US): A stimulus that naturally and automatically triggers a response without any learning needed. Example: Food causing salivation.",
    pinned: false
  },
  {
    id: 3,
    type: "example",
    time: "Note C",
    content: "Pavlov's Dog Experiment: Pavlov rang a bell before feeding dogs. After repetition, dogs salivated at the bell sound alone, demonstrating classical conditioning.",
    pinned: true
  },
  {
    id: 4,
    type: "exam-relevant",
    time: "Note D",
    content: "Professor emphasized: Be able to identify and label all components of classical conditioning (US, UR, CS, CR) in novel scenarios. This WILL be on the exam.",
    pinned: false
  },
  {
    id: 5,
    type: "definition",
    time: "Note E",
    content: "Conditioned Response (CR): The learned response to the previously neutral stimulus. It is usually similar to the unconditioned response.",
    pinned: false
  }
]

const quickActions = [
  { icon: RefreshCw, label: "Repeat Last Point", description: "Hear the last key point again" },
  { icon: Lightbulb, label: "Simplify Concept", description: "Explain in simpler terms" },
  { icon: Volume2, label: "Read Aloud", description: "Read recent notes" },
  { icon: Presentation, label: "Current Slide", description: "What slide are we on?" },
  { icon: GraduationCap, label: "Make Quiz", description: "Generate a quick quiz from recent notes" }
]

export default function LiveLecturePage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isTTSActive, setIsTTSActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [notes, setNotes] = useState(sampleNotes)
  const [voiceInput, setVoiceInput] = useState("")
  const [textSize, setTextSize] = useState(16)
  const [highContrast, setHighContrast] = useState(false)
  const [speechSpeed, setSpeechSpeed] = useState(1)
  const [currentSlide, setCurrentSlide] = useState(8)

  useEffect(() => {
    if (!isPaused && isRecording) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused, isRecording])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const togglePin = (noteId: number) => {
    setNotes(notes.map(note =>
      note.id === noteId ? { ...note, pinned: !note.pinned } : note
    ))
  }

  const endSession = () => {
    router.push("/summary")
  }

  const getNoteTypeStyle = (type: string) => {
    switch (type) {
      case "key-point": return "bg-primary/8 border-primary/25"
      case "definition": return "bg-accent/8 border-accent/25"
      case "example": return "bg-chart-3/8 border-chart-3/25"
      case "exam-relevant": return "bg-destructive/8 border-destructive/25"
      default: return "bg-secondary border-border"
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "key-point": return "text-primary bg-primary/15"
      case "definition": return "text-accent bg-accent/15"
      case "example": return "text-chart-3 bg-chart-3/15"
      case "exam-relevant": return "text-destructive bg-destructive/15"
      default: return "text-muted-foreground bg-secondary"
    }
  }

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case "key-point": return "Key Point"
      case "definition": return "Definition"
      case "example": return "Example"
      case "exam-relevant": return "Exam Relevant"
      default: return "Note"
    }
  }

  return (
    <div className={`min-h-screen bg-background ${highContrast ? "contrast-125" : ""}`}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isRecording && !isPaused && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                )}
                <span className={`text-sm font-semibold ${isPaused ? "text-muted-foreground" : "text-destructive"}`}>
                  {isPaused ? "Paused" : "LIVE"}
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border/50" />
              <h1 className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[200px]">
                Introduction to Psychology
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-mono text-foreground tabular-nums">{formatTime(elapsedTime)}</span>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isRecording ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border/50"}`}>
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={endSession}
                >
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  End
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-5 pt-4">
            {/* Left Panel - Slide Context */}
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
                    <div className="text-center z-10">
                      <Presentation className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/60">Slide Preview</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Slide {currentSlide} of 24</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setCurrentSlide(Math.min(24, currentSlide + 1))}
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
                    Detected Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Definition", color: "text-primary bg-primary/10 border-primary/20" },
                      { label: "Diagram", color: "text-accent bg-accent/10 border-accent/20" },
                      { label: "Example", color: "text-chart-3 bg-chart-3/10 border-chart-3/20" },
                      { label: "Formula", color: "text-destructive bg-destructive/10 border-destructive/20" }
                    ].map((tag) => (
                      <span key={tag.label} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${tag.color}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Panel - Live Notes */}
            <div className="lg:col-span-6">
              <Card className="card-futuristic h-full overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Live Structured Notes
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/50">{notes.length} notes</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    className="max-h-[calc(100vh-260px)] overflow-y-auto p-4 space-y-3"
                    style={{ fontSize: `${textSize}px` }}
                  >
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-xl border p-4 transition-all duration-300 hover-glow ${getNoteTypeStyle(note.type)} ${note.pinned ? "ring-1 ring-primary/50 shadow-[0_0_15px_oklch(0.72_0.19_165/0.1)]" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getNoteTypeColor(note.type)}`}>
                              {getNoteTypeLabel(note.type)}
                            </span>
                            <span className="text-xs text-muted-foreground">{note.time}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-background/50"
                              onClick={() => togglePin(note.id)}
                            >
                              <Pin className={`h-3.5 w-3.5 ${note.pinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-background/50"
                            >
                              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed">{note.content}</p>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    <div className="flex items-center gap-2 text-muted-foreground px-1">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm">AI listening...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - AI Assistant & Controls */}
            <div className="lg:col-span-3 space-y-4">
              {/* AI Assistant */}
              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30">
                    <button className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors glow-primary">
                      <Mic className="h-4 w-4 text-primary-foreground" />
                    </button>
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border/30 hover:border-primary/30 transition-all duration-200 text-left group"
                      >
                        <action.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility Controls */}
              <Card className="card-futuristic overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Size */}
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

                  {/* Speech Speed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Speech Speed</span>
                      <span className="text-sm text-foreground font-mono">{speechSpeed}x</span>
                    </div>
                    <div className="flex gap-1">
                      {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setSpeechSpeed(speed)}
                          className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                            speechSpeed === speed
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2">
                    <button
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
                      <div className={`h-5 w-9 rounded-full transition-colors ${highContrast ? "bg-primary" : "bg-muted"}`}>
                        <div className={`h-4 w-4 rounded-full bg-background transition-transform mt-0.5 shadow-sm ${highContrast ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                      </div>
                    </button>

                    <button
                      onClick={() => setIsTTSActive(!isTTSActive)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        isTTSActive
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isTTSActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span className="text-sm">Auto Read Notes</span>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors ${isTTSActive ? "bg-primary" : "bg-muted"}`}>
                        <div className={`h-4 w-4 rounded-full bg-background transition-transform mt-0.5 shadow-sm ${isTTSActive ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-center gap-3">
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
              >
                <AlertCircle className="h-4 w-4" />
                Mark Confusion
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border/50 hover:border-primary/40"
              >
                <Bookmark className="h-4 w-4" />
                Save Moment
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={endSession}
                className="gap-2"
              >
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
