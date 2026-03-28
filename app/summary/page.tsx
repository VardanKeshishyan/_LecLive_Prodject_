"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import {
  ArrowLeft,
  Download,
  Share2,
  Play,
  Pause,
  Volume2,
  Search,
  Clock,
  FileText,
  BookOpen,
  Lightbulb,
  AlertCircle,
  GraduationCap,
  Calendar,
  RefreshCw,
  Bookmark,
  Brain,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react"

const summaryData = {
  title: "Introduction to Psychology",
  course: "PSY 101",
  instructor: "Dr. Smith",
  noteCount: 23,
  sections: {
    summary: "This lecture covered the fundamentals of classical conditioning, including the work of Ivan Pavlov and the key terminology. The main focus was on understanding how organisms learn through association and the components involved in the conditioning process.",
    keyPoints: [
      "Classical conditioning is a learning process involving stimulus association",
      "Pavlov's experiments with dogs demonstrated the core principles",
      "The process involves unconditioned and conditioned stimuli/responses",
      "Extinction occurs when the conditioned stimulus is no longer paired with the unconditioned stimulus",
      "Generalization and discrimination are important related concepts"
    ],
    definitions: [
      { term: "Unconditioned Stimulus (US)", definition: "A stimulus that naturally and automatically triggers a response without any learning needed." },
      { term: "Unconditioned Response (UR)", definition: "The natural, unlearned reaction to the unconditioned stimulus." },
      { term: "Conditioned Stimulus (CS)", definition: "A previously neutral stimulus that, after association with the US, triggers a conditioned response." },
      { term: "Conditioned Response (CR)", definition: "The learned response to the previously neutral stimulus." },
      { term: "Extinction", definition: "The gradual weakening of a conditioned response when the CS is presented without the US." }
    ],
    examples: [
      "Pavlov's Dog: Bell (CS) + Food (US) = Salivation. After conditioning, Bell alone causes salivation.",
      "Fear conditioning: A child who is bitten by a dog may develop fear of all dogs.",
      "Advertising uses classical conditioning by pairing products with pleasant images/music."
    ],
    examTopics: [
      "Be able to identify and label all components (US, UR, CS, CR) in novel scenarios",
      "Understand the difference between generalization and discrimination",
      "Know the stages of acquisition, extinction, and spontaneous recovery"
    ]
  },
  confusionMoments: [
    { time: "Moment A", summary: "Difference between stimulus generalization and stimulus discrimination", resolved: false },
    { time: "Moment B", summary: "Why extinction doesn't mean complete forgetting", resolved: true }
  ]
}

export default function SummaryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keyPoints: true,
    definitions: true,
    examples: true,
    examTopics: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient orb */}
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.68 0.16 280), transparent 70%)' }}
      />

      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <Link
              href="/live"
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
                  <span className="text-gradient-primary">{summaryData.title}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {summaryData.course}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {summaryData.noteCount} notes
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
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Search */}
              <div className="relative animate-fade-in-up-delay-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, definitions, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 rounded-xl transition-colors"
                />
              </div>

              {/* Audio Playback */}
              <Card className="card-futuristic animate-fade-in-up-delay-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      className="h-10 w-10 rounded-full p-0 glow-primary flex-shrink-0"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {isPlaying ? "Playing notes..." : "Listen to Summary"}
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

              {/* Collapsible Sections */}
              {[
                {
                  id: "summary",
                  icon: BookOpen,
                  iconColor: "text-primary",
                  title: "Summary",
                  content: (
                    <p className="text-foreground leading-relaxed">{summaryData.sections.summary}</p>
                  )
                },
                {
                  id: "keyPoints",
                  icon: Lightbulb,
                  iconColor: "text-primary",
                  title: "Key Points",
                  content: (
                    <ul className="space-y-3">
                      {summaryData.sections.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                          </span>
                          <span className="text-foreground leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )
                },
                {
                  id: "definitions",
                  icon: FileText,
                  iconColor: "text-accent",
                  title: "Definitions",
                  content: (
                    <div className="space-y-3">
                      {summaryData.sections.definitions.map((def, index) => (
                        <div key={index} className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover-glow transition-all duration-300">
                          <h4 className="font-semibold text-foreground mb-1">{def.term}</h4>
                          <p className="text-muted-foreground text-sm">{def.definition}</p>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  id: "examples",
                  icon: Brain,
                  iconColor: "text-chart-3",
                  title: "Examples",
                  content: (
                    <div className="space-y-3">
                      {summaryData.sections.examples.map((example, index) => (
                        <div key={index} className="p-4 rounded-xl bg-chart-3/5 border border-chart-3/20">
                          <p className="text-foreground">{example}</p>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  id: "examTopics",
                  icon: GraduationCap,
                  iconColor: "text-destructive",
                  title: "Exam-Relevant Topics",
                  content: (
                    <div className="space-y-3">
                      {summaryData.sections.examTopics.map((topic, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{topic}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
              ].map((section) => (
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
                  {expandedSections[section.id] && (
                    <CardContent>{section.content}</CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-5">
              {/* Confusion Moments */}
              <Card className="card-futuristic animate-fade-in-up-delay-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-chart-3" />
                    Confusion Moments
                  </CardTitle>
                  <CardDescription>
                    Points you marked as difficult
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summaryData.confusionMoments.map((moment, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border transition-all duration-200 ${
                          moment.resolved
                            ? "bg-primary/5 border-primary/20"
                            : "bg-chart-3/5 border-chart-3/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-muted-foreground">{moment.time}</span>
                          {moment.resolved ? (
                            <span className="text-xs text-primary font-medium">Resolved</span>
                          ) : (
                            <span className="text-xs text-chart-3 font-medium">Needs Review</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-3">{moment.summary}</p>
                        <Button variant="outline" size="sm" className="w-full border-border/50 hover:border-primary/40">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Explain Again
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Study Tools */}
              <Card className="card-futuristic animate-fade-in-up-delay-3">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Study Tools
                  </CardTitle>
                  <CardDescription>
                    Generate study materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: Brain, label: "Generate Flashcards" },
                    { icon: GraduationCap, label: "Create Practice Quiz" },
                    { icon: Bookmark, label: "Save to Study Guide" },
                    { icon: Download, label: "Download Notes (PDF)" }
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

              {/* Quick Stats */}
              <Card className="card-futuristic animate-fade-in-up-delay-4">
                <CardHeader>
                  <CardTitle className="text-lg">Session Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "23", label: "Notes Captured", color: "text-primary" },
                      { value: "5", label: "Definitions", color: "text-primary" },
                      { value: "3", label: "Examples", color: "text-primary" },
                      { value: "3", label: "Exam Topics", color: "text-destructive" }
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Start New Session */}
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
