"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Sparkles,
  Trash2,
  Download,
  Layers,
  CheckSquare,
  Square,
  FileText,
  ArrowLeft,
  XCircle,
  X,
  GraduationCap,
} from "lucide-react"

interface StoredNote {
  id: string
  title: string
  course?: string
  createdAt: string
  overallSummary: string
  mainTopics: string[]
  majorDefinitions: { term: string; definition: string }[]
  importantExamples: string[]
  actionItemsOrQuestions: string[]
  savedChunks: { title: string; keyPoints: string[] }[]
}

const NOTES_STORAGE_KEY = "leclive_saved_notes"

function loadNotes(): StoredNote[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredNote[]) : []
  } catch {
    return []
  }
}

function saveNotes(notes: StoredNote[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
}

function mergeNotes(notes: StoredNote[]): StoredNote {
  const titles = notes.map((n) => n.title).join(" + ")
  const allTopics = Array.from(new Set(notes.flatMap((n) => n.mainTopics)))
  const allDefs = notes.flatMap((n) => n.majorDefinitions)
  const allExamples = notes.flatMap((n) =>
    n.importantExamples.map((ex) => (typeof ex === "string" ? ex : JSON.stringify(ex)))
  )
  const allActions = Array.from(new Set(notes.flatMap((n) => n.actionItemsOrQuestions)))
  const allChunks = notes.flatMap((n) => n.savedChunks ?? [])
  const combinedSummary = notes
    .map((n) => `[${n.title}]: ${n.overallSummary}`)
    .join("\n\n")

  return {
    id: `merged-${Date.now()}`,
    title: `Merged: ${titles}`,
    course: notes[0]?.course,
    createdAt: new Date().toISOString(),
    overallSummary: combinedSummary,
    mainTopics: allTopics,
    majorDefinitions: allDefs,
    importantExamples: allExamples,
    actionItemsOrQuestions: allActions,
    savedChunks: allChunks,
  }
}

function noteToText(note: StoredNote): string {
  const lines: string[] = [
    `# ${note.title}`,
    note.course ? `Course: ${note.course}` : "",
    `Date: ${new Date(note.createdAt).toLocaleDateString()}`,
    "",
    "## Summary",
    note.overallSummary,
    "",
    "## Main Topics",
    ...note.mainTopics.map((t) => `- ${t}`),
    "",
    "## Definitions",
    ...note.majorDefinitions.map((d) => `**${d.term}**: ${d.definition}`),
    "",
    "## Examples",
    ...note.importantExamples.map((e) => `- ${e}`),
    "",
    "## Questions / Actions",
    ...note.actionItemsOrQuestions.map((q) => `- ${q}`),
  ].filter((l) => l !== null)
  return lines.join("\n")
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [mergedNote, setMergedNote] = useState<StoredNote | null>(null)
  const [activeNote, setActiveNote] = useState<StoredNote | null>(null)

  useEffect(() => {
    setNotes(loadNotes())
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      saveNotes(next)
      return next
    })
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setActiveNote((prev) => (prev?.id === id ? null : prev))
  }, [])

  const handleMerge = useCallback(() => {
    const toMerge = notes.filter((n) => selected.has(n.id))
    if (toMerge.length < 2) return
    const merged = mergeNotes(toMerge)
    setMergedNote(merged)
  }, [notes, selected])

  const saveMerged = useCallback(() => {
    if (!mergedNote) return
    setNotes((prev) => {
      const next = [mergedNote, ...prev]
      saveNotes(next)
      return next
    })
    setMergedNote(null)
    setSelected(new Set())
  }, [mergedNote])

  const selectedNotes = useMemo(() => notes.filter((n) => selected.has(n.id)), [notes, selected])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.19 165), transparent 70%)" }}
      />
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-5 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">My Notes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
              Saved <span className="text-gradient-primary">Lecture Notes</span>
            </h1>
            <p className="text-muted-foreground">
              All your session notes in one place. Select multiple notes to merge them into one exam study guide.
            </p>
          </div>

          {/* Merge bar */}
          {selected.size >= 2 && !mergedNote && (
            <div className="mb-6 p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up">
              <div className="flex items-center gap-2 flex-1">
                <Layers className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {selected.size} notes selected — merge them into one exam guide
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set())} className="border-border/50">
                  <XCircle className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button size="sm" className="glow-primary" onClick={handleMerge}>
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  Merge for Exam
                </Button>
              </div>
            </div>
          )}

          {/* Merged result */}
          {mergedNote && (
            <div className="mb-8 rounded-2xl border border-primary/40 bg-primary/5 p-6 animate-fade-in-up">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="font-bold text-foreground text-lg">Merged Exam Study Guide</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{mergedNote.title}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMergedNote(null)} className="border-border/50">
                    Discard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadText(`${mergedNote.title}.txt`, noteToText(mergedNote))} className="border-border/50">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button size="sm" className="glow-primary" onClick={saveMerged}>
                    Save to My Notes
                  </Button>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-primary mb-1">Summary</p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{mergedNote.overallSummary}</p>
                </div>
                {mergedNote.mainTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-primary mb-1">Main Topics</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-foreground/80">
                      {mergedNote.mainTopics.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {mergedNote.actionItemsOrQuestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-primary mb-1">Exam Questions / Actions</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-foreground/80">
                      {mergedNote.actionItemsOrQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes grid */}
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary/60 border border-border/30 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-foreground font-medium mb-2">No saved notes yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Complete a lecture session and your structured notes will appear here automatically.
              </p>
              <Button asChild className="glow-primary">
                <Link href="/session">Start a Session</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {notes.map((note) => {
                const isSelected = selected.has(note.id)
                return (
                  <Card
                    key={note.id}
                    className={`card-futuristic cursor-pointer transition-all duration-200 hover-glow ${
                      isSelected ? "border-primary/50 bg-primary/5 glow-primary" : ""
                    }`}
                    onClick={() => setActiveNote(note)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelect(note.id)
                            }}
                            className="mt-0.5 flex-shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            aria-label={isSelected ? "Deselect note" : "Select note"}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground/40" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <CardTitle className="text-base font-semibold text-foreground truncate">{note.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {note.course && `${note.course} · `}
                              {new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => downloadText(`${note.title}.txt`, noteToText(note))}
                            className="h-8 w-8 rounded-lg border border-border/40 bg-background/40 hover:border-primary/40 hover:bg-primary/10 transition-colors flex items-center justify-center"
                            aria-label="Export note"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="h-8 w-8 rounded-lg border border-border/40 bg-background/40 hover:border-destructive/40 hover:bg-destructive/10 transition-colors flex items-center justify-center"
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{note.overallSummary}</p>
                      <p className="text-xs text-primary/80 mt-2">Click card to open full note</p>
                      {note.mainTopics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {note.mainTopics.slice(0, 4).map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {t}
                            </span>
                          ))}
                          {note.mainTopics.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground border border-border/30">
                              +{note.mainTopics.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {activeNote && (
        <div
          className="fixed inset-0 z-50 bg-background/75 backdrop-blur-sm px-4 py-6 sm:px-6"
          onClick={() => setActiveNote(null)}
        >
          <div
            className="mx-auto max-w-4xl h-full sm:h-auto sm:max-h-[92vh] rounded-2xl border border-primary/25 bg-background/95 card-futuristic overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-border/30">
              <div>
                <h2 className="text-xl font-bold text-foreground">{activeNote.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeNote.course ? `${activeNote.course} · ` : ""}
                  {new Date(activeNote.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(`${activeNote.title}.txt`, noteToText(activeNote))}
                  className="border-border/50"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveNote(null)}
                  className="h-8 w-8"
                  aria-label="Close note"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(100vh-170px)] space-y-5">
              <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                <p className="text-xs font-medium text-primary mb-2">Summary</p>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                  {activeNote.overallSummary}
                </p>
              </section>

              {activeNote.mainTopics.length > 0 && (
                <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                  <p className="text-xs font-medium text-primary mb-2">Main Topics</p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    {activeNote.mainTopics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </section>
              )}

              {activeNote.majorDefinitions.length > 0 && (
                <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                  <p className="text-xs font-medium text-primary mb-2">Definitions</p>
                  <div className="space-y-2">
                    {activeNote.majorDefinitions.map((definition, index) => (
                      <div key={index} className="rounded-lg border border-border/30 bg-background/40 p-3">
                        <p className="text-sm font-semibold text-foreground">{definition.term}</p>
                        <p className="text-sm text-muted-foreground mt-1">{definition.definition}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeNote.importantExamples.length > 0 && (
                <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                  <p className="text-xs font-medium text-primary mb-2">Examples</p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    {activeNote.importantExamples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </section>
              )}

              {activeNote.actionItemsOrQuestions.length > 0 && (
                <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                  <p className="text-xs font-medium text-primary mb-2">Questions / Actions</p>
                  <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                    {activeNote.actionItemsOrQuestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {activeNote.savedChunks.length > 0 && (
                <section className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                  <p className="text-xs font-medium text-primary mb-2">Saved Chunks</p>
                  <div className="space-y-2">
                    {activeNote.savedChunks.map((chunk, index) => (
                      <div key={`${chunk.title}-${index}`} className="rounded-lg border border-border/30 bg-background/40 p-3">
                        <p className="text-sm font-semibold text-foreground">{chunk.title}</p>
                        {chunk.keyPoints.length > 0 && (
                          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                            {chunk.keyPoints.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
