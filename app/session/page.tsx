"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import {
  Mic,
  Upload,
  FileText,
  Image as ImageIcon,
  Presentation,
  CheckCircle2,
  Settings,
  ChevronRight,
  ArrowLeft,
  Sparkles
} from "lucide-react"

export default function SessionSetupPage() {
  const router = useRouter()
  const [lectureTitle, setLectureTitle] = useState("")
  const [courseName, setCourseName] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [micStatus, setMicStatus] = useState<"idle" | "testing" | "ready">("idle")
  const [noteDetail, setNoteDetail] = useState("standard")
  const [readingMode, setReadingMode] = useState("key-points")
  const [simplification, setSimplification] = useState("standard")
  const [textSize, setTextSize] = useState("medium")
  const [highContrast, setHighContrast] = useState(false)

  const handleFileUpload = () => {
    setUploadedFiles(["lecture-slides.pdf"])
  }

  const testMicrophone = () => {
    setMicStatus("testing")
    setTimeout(() => setMicStatus("ready"), 1500)
  }

  const startSession = async () => {
    try {
      const res = await fetch("/api/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lectureTitle,
          course: courseName,
          instructor: instructorName,
        }),
      })
      if (!res.ok) {
        console.error(await res.text())
        return
      }
      const data = (await res.json()) as { sessionId: string }
      sessionStorage.setItem("lectureSessionId", data.sessionId)
      router.push(`/live?sessionId=${data.sessionId}`)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle ambient orb */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.19 165), transparent 70%)' }}
      />

      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-10 animate-fade-in-up">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-5 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Session Setup</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
              Configure Your <span className="text-gradient-primary">Lecture Session</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload materials and choose your accessibility preferences before class begins.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Setup Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Info */}
              <Card className="card-futuristic animate-fade-in-up-delay-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Session Information
                  </CardTitle>
                  <CardDescription>
                    Enter details about this lecture session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lecture-title">Lecture Title</Label>
                    <Input
                      id="lecture-title"
                      placeholder="e.g., Introduction to Psychology"
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course-name">Course Name</Label>
                      <Input
                        id="course-name"
                        placeholder="e.g., PSY 101"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructor">Instructor Name</Label>
                      <Input
                        id="instructor"
                        placeholder="e.g., Dr. Smith"
                        value={instructorName}
                        onChange={(e) => setInstructorName(e.target.value)}
                        className="bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Slides */}
              <Card className="card-futuristic animate-fade-in-up-delay-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Lecture Materials
                  </CardTitle>
                  <CardDescription>
                    Upload slides or materials for better note accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={handleFileUpload}
                    className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      {[Presentation, FileText, ImageIcon].map((Icon, i) => (
                        <div key={i} className="h-12 w-12 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      ))}
                    </div>
                    <p className="text-foreground font-medium mb-1">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, PPT, PPTX, and images
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm text-foreground">{file}</span>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Audio Input */}
              <Card className="card-futuristic animate-fade-in-up-delay-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Audio Input
                  </CardTitle>
                  <CardDescription>
                    Configure your microphone for live transcription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="mic-select" className="mb-2 block">Select Microphone</Label>
                      <select
                        id="mic-select"
                        className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:border-primary/50 outline-none transition-colors"
                      >
                        <option>Default Microphone</option>
                        <option>Built-in Microphone</option>
                        <option>External USB Microphone</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={testMicrophone}
                        disabled={micStatus === "testing"}
                        className="border-border/50 hover:border-primary/40"
                      >
                        {micStatus === "testing" ? (
                          "Testing..."
                        ) : micStatus === "ready" ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                            Mic Ready
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Test Mic
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {micStatus === "ready" && (
                    <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Microphone connected and ready to listen</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Accessibility Preferences */}
              <Card className="card-futuristic animate-fade-in-up-delay-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Accessibility Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize how notes are generated and displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Note Detail Level</Label>
                      <div className="flex flex-col gap-2">
                        {["brief", "standard", "detailed"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setNoteDetail(level)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              noteDetail === level
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20 hover:bg-secondary"
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Reading Mode</Label>
                      <div className="flex flex-col gap-2">
                        {[
                          { value: "key-points", label: "Key Points Only" },
                          { value: "everything", label: "Read Everything" }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => setReadingMode(mode.value)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              readingMode === mode.value
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20 hover:bg-secondary"
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Simplification Mode</Label>
                      <div className="flex flex-col gap-2">
                        {[
                          { value: "standard", label: "Standard Language" },
                          { value: "simplified", label: "Easier Wording" }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => setSimplification(mode.value)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              simplification === mode.value
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20 hover:bg-secondary"
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Size</Label>
                      <div className="flex flex-col gap-2">
                        {["small", "medium", "large", "extra-large"].map((size) => (
                          <button
                            key={size}
                            onClick={() => setTextSize(size)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              textSize === size
                                ? "bg-primary/15 border-primary/30 text-primary"
                                : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20 hover:bg-secondary"
                            }`}
                          >
                            {size.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/30">
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 border ${
                        highContrast
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20"
                      }`}
                    >
                      <span className="font-medium">High Contrast Mode</span>
                      <div className={`h-6 w-11 rounded-full transition-colors ${highContrast ? "bg-primary" : "bg-muted"}`}>
                        <div className={`h-5 w-5 rounded-full bg-background transition-transform mt-0.5 shadow-sm ${highContrast ? "translate-x-5 ml-0.5" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="card-futuristic animate-fade-in-up-delay-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Session Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadedFiles.length > 0 && (
                      <div className="rounded-xl bg-secondary/50 border border-border/30 p-4">
                        <div className="aspect-video bg-background/30 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                          <Presentation className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">
                          {uploadedFiles[0]}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {[
                        { label: "Lecture", value: lectureTitle || "Not set" },
                        { label: "Course", value: courseName || "Not set" },
                        { label: "Instructor", value: instructorName || "Not set" },
                        { label: "Detail Level", value: noteDetail },
                        { label: "Microphone", value: micStatus === "ready" ? "Ready" : "Not tested", highlight: micStatus === "ready" }
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={`font-medium truncate max-w-[120px] capitalize ${item.highlight ? "text-primary" : "text-foreground"}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {micStatus === "ready" && (
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Session Ready</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full glow-primary group"
                      size="lg"
                      onClick={startSession}
                    >
                      Start Live Session
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
