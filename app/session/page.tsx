"use client"

import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import type {
  NoteDetailLevel,
  ReadingMode,
  SessionPreferences,
  SimplificationMode,
  TextSizePreference,
  UploadedMaterial,
} from "@/lib/types"
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
  Sparkles,
  RefreshCw,
  X,
  FileUp,
} from "lucide-react"

const SETUP_STORAGE_KEY = "lectureSessionSetup"
const MATERIAL_TEXT_LIMIT = 6_000

type MicStatus = "idle" | "testing" | "ready" | "error"

interface StoredSetup {
  lectureTitle: string
  courseName: string
  instructorName: string
  uploadedFiles: UploadedMaterial[]
  preferences: SessionPreferences
}

interface MicrophoneOption {
  deviceId: string
  label: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function buildMaterialId(file: File): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${file.name}-${file.size}-${Date.now()}`
}

async function extractMaterialText(file: File): Promise<string | undefined> {
  const lowerName = file.name.toLowerCase()
  const isPlainText =
    file.type.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".json")

  if (!isPlainText) return undefined

  try {
    const text = await file.text()
    const trimmed = text.trim()
    return trimmed ? trimmed.slice(0, MATERIAL_TEXT_LIMIT) : undefined
  } catch {
    return undefined
  }
}

async function toUploadedMaterial(file: File): Promise<UploadedMaterial> {
  return {
    id: buildMaterialId(file),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    textContent: await extractMaterialText(file),
  }
}

function dedupeMaterials(files: UploadedMaterial[]): UploadedMaterial[] {
  const map = new Map<string, UploadedMaterial>()
  for (const file of files) {
    map.set(`${file.name}-${file.size}-${file.type}`, file)
  }
  return Array.from(map.values())
}

function textSizeToPixels(size: TextSizePreference): number {
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

export default function SessionSetupPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [lectureTitle, setLectureTitle] = useState("")
  const [courseName, setCourseName] = useState("")
  const [instructorName, setInstructorName] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMaterial[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const [microphones, setMicrophones] = useState<MicrophoneOption[]>([])
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("")
  const [selectedMicrophoneLabel, setSelectedMicrophoneLabel] = useState("Default Microphone")
  const [micStatus, setMicStatus] = useState<MicStatus>("idle")
  const [micMessage, setMicMessage] = useState("Pick a microphone and run a quick mic test.")
  const [micLevel, setMicLevel] = useState(0)

  const [noteDetail, setNoteDetail] = useState<NoteDetailLevel>("standard")
  const [readingMode, setReadingMode] = useState<ReadingMode>("key-points")
  const [simplification, setSimplification] = useState<SimplificationMode>("standard")
  const [textSize, setTextSize] = useState<TextSizePreference>("medium")
  const [highContrast, setHighContrast] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const preferences = useMemo<SessionPreferences>(
    () => ({
      noteDetail,
      readingMode,
      simplification,
      textSize,
      highContrast,
      microphoneDeviceId: selectedMicrophoneId || undefined,
      microphoneLabel: selectedMicrophoneLabel,
      microphoneReady: micStatus === "ready",
    }),
    [
      highContrast,
      micStatus,
      noteDetail,
      readingMode,
      selectedMicrophoneId,
      selectedMicrophoneLabel,
      simplification,
      textSize,
    ]
  )

  const refreshMicrophones = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const nextMicrophones = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }))

      setMicrophones(nextMicrophones)

      if (selectedMicrophoneId) {
        const active = nextMicrophones.find((device) => device.deviceId === selectedMicrophoneId)
        if (active) setSelectedMicrophoneLabel(active.label)
      }
    } catch {
      setMicMessage("Browser blocked device detection. You can still start with the default mic.")
    }
  }, [selectedMicrophoneId])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETUP_STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Partial<StoredSetup>
        if (typeof stored.lectureTitle === "string") setLectureTitle(stored.lectureTitle)
        if (typeof stored.courseName === "string") setCourseName(stored.courseName)
        if (typeof stored.instructorName === "string") setInstructorName(stored.instructorName)
        if (Array.isArray(stored.uploadedFiles)) setUploadedFiles(stored.uploadedFiles)

        if (stored.preferences) {
          setNoteDetail(stored.preferences.noteDetail ?? "standard")
          setReadingMode(stored.preferences.readingMode ?? "key-points")
          setSimplification(stored.preferences.simplification ?? "standard")
          setTextSize(stored.preferences.textSize ?? "medium")
          setHighContrast(Boolean(stored.preferences.highContrast))
          setSelectedMicrophoneId(stored.preferences.microphoneDeviceId ?? "")
          setSelectedMicrophoneLabel(stored.preferences.microphoneLabel ?? "Default Microphone")
          if (stored.preferences.microphoneReady) {
            setMicStatus("ready")
            setMicMessage("Previously tested microphone is ready.")
          }
        }
      }
    } catch {
      /* ignore invalid setup cache */
    }

    void refreshMicrophones()

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", refreshMicrophones)
      return () => navigator.mediaDevices.removeEventListener("devicechange", refreshMicrophones)
    }
  }, [refreshMicrophones])

  useEffect(() => {
    const snapshot: StoredSetup = {
      lectureTitle,
      courseName,
      instructorName,
      uploadedFiles,
      preferences,
    }
    try {
      sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      /* ignore storage errors */
    }
  }, [courseName, instructorName, lectureTitle, preferences, uploadedFiles])

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    const materials = await Promise.all(Array.from(files).map((file) => toUploadedMaterial(file)))
    setUploadedFiles((prev) => dedupeMaterials([...prev, ...materials]))
  }, [])

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const onFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleFiles(event.target.files)
    event.target.value = ""
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    await handleFiles(event.dataTransfer.files)
  }

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const testMicrophone = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus("error")
      setMicMessage("Microphone testing is not supported in this browser.")
      return
    }

    setMicStatus("testing")
    setMicMessage("Listening for microphone input...")
    setMicLevel(0)

    let stream: MediaStream | null = null
    let audioContext: AudioContext | null = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(selectedMicrophoneId ? { deviceId: { exact: selectedMicrophoneId } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      await refreshMicrophones()

      const activeTrack = stream.getAudioTracks()[0]
      if (activeTrack?.label) setSelectedMicrophoneLabel(activeTrack.label)

      audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      const data = new Uint8Array(analyser.fftSize)
      let peak = 0
      const startAt = performance.now()

      await new Promise<void>((resolve) => {
        const sample = () => {
          analyser.getByteTimeDomainData(data)
          let total = 0
          for (let i = 0; i < data.length; i++) {
            total += Math.abs(data[i] - 128)
          }
          const normalized = total / data.length / 128
          peak = Math.max(peak, normalized)
          setMicLevel(Math.min(100, Math.round(normalized * 500)))

          if (performance.now() - startAt >= 1500) {
            resolve()
            return
          }
          requestAnimationFrame(sample)
        }

        sample()
      })

      setMicStatus("ready")
      setMicMessage(
        peak > 0.03
          ? "Microphone connected and picking up sound."
          : "Microphone connected. Input level is low, so speak closer if needed."
      )
    } catch {
      setMicStatus("error")
      setMicMessage("Microphone test failed. Check browser permission or pick another device.")
      setMicLevel(0)
    } finally {
      stream?.getTracks().forEach((track) => track.stop())
      if (audioContext) void audioContext.close()
    }
  }

  const startSession = async () => {
    setStartError(null)
    try {
      const res = await fetch("/api/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lectureTitle.trim(),
          course: courseName.trim(),
          instructor: instructorName.trim(),
          preferences,
          materials: uploadedFiles,
        }),
      })
      if (!res.ok) {
        const raw = await res.text()
        console.error(raw)
        let message = "Could not start the live session."
        try {
          const parsed = JSON.parse(raw) as { error?: string }
          if (parsed.error?.includes("Live API connection failed")) {
            message =
              "Live connection failed. Your mic or Gemini Live setup may not be ready yet. Check microphone permission and API configuration, then try again."
          } else if (parsed.error) {
            message = parsed.error
          }
        } catch {
          /* ignore parse errors */
        }
        setStartError(message)
        return
      }
      const data = (await res.json()) as { sessionId: string }
      sessionStorage.setItem("lectureSessionId", data.sessionId)
      router.push(`/live?sessionId=${data.sessionId}`)
    } catch (e) {
      console.error(e)
      setStartError(
        "Could not start the live session. Your mic may be blocked or the network request failed."
      )
    }
  }

  const materialContextLabel =
    uploadedFiles.length === 0
      ? "No lecture materials attached yet."
      : `${uploadedFiles.length} material${uploadedFiles.length === 1 ? "" : "s"} ready for this session.`

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.19 165), transparent 70%)" }}
      />

      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-6xl">
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
              Upload materials and set how notes should be written before class begins.
            </p>
            {startError && (
              <div className="mt-4 max-w-2xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {startError}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-futuristic animate-fade-in-up-delay-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Session Information
                  </CardTitle>
                  <CardDescription>Enter details about this lecture session</CardDescription>
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

              <Card className="card-futuristic animate-fade-in-up-delay-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Lecture Materials
                  </CardTitle>
                  <CardDescription>
                    Attach slides or supporting files so they stay visible throughout the session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv,.json"
                    multiple
                    className="hidden"
                    onChange={onFileInputChange}
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openFilePicker}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openFilePicker()
                      }
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setIsDragging(false)
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${
                      isDragging
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      {[Presentation, FileText, ImageIcon].map((Icon, i) => (
                        <div
                          key={i}
                          className="h-12 w-12 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center group-hover:border-primary/30 transition-colors"
                        >
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      ))}
                    </div>
                    <p className="text-foreground font-medium mb-1">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">Supports PDF, PPT, PPTX, images, and text notes</p>
                    <p className="text-xs text-primary/80 mt-3">
                      Uploaded materials are carried into the live session and used as extra context when possible.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">{materialContextLabel}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      onClick={openFilePicker}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(file.size)}
                                {file.textContent ? " · text context attached" : " · available during session"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <button
                              type="button"
                              onClick={() => removeUploadedFile(file.id)}
                              className="h-8 w-8 rounded-lg border border-border/40 bg-background/40 hover:border-destructive/40 hover:bg-destructive/10 transition-colors flex items-center justify-center"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-futuristic animate-fade-in-up-delay-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Accessibility Preferences
                  </CardTitle>
                  <CardDescription>
                    These choices now carry into the live note view and AI note generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Note Detail Level</Label>
                      <div className="flex flex-col gap-2">
                        {(["brief", "standard", "detailed"] as NoteDetailLevel[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            aria-pressed={noteDetail === level}
                            onClick={() => setNoteDetail(level)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              noteDetail === level
                                ? "bg-primary/15 border-primary/30 text-primary glow-primary"
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
                          { value: "everything", label: "Read Everything" },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            aria-pressed={readingMode === mode.value}
                            onClick={() => setReadingMode(mode.value as ReadingMode)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              readingMode === mode.value
                                ? "bg-primary/15 border-primary/30 text-primary glow-primary"
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
                          { value: "simplified", label: "Easier Wording" },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            aria-pressed={simplification === mode.value}
                            onClick={() => setSimplification(mode.value as SimplificationMode)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              simplification === mode.value
                                ? "bg-primary/15 border-primary/30 text-primary glow-primary"
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
                        {(["small", "medium", "large", "extra-large"] as TextSizePreference[]).map((size) => (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={textSize === size}
                            onClick={() => setTextSize(size)}
                            className={`px-4 py-2.5 rounded-xl text-left text-sm transition-all duration-200 border ${
                              textSize === size
                                ? "bg-primary/15 border-primary/30 text-primary glow-primary"
                                : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20 hover:bg-secondary"
                            }`}
                          >
                            {size.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => setHighContrast((prev) => !prev)}
                      className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 border ${
                        highContrast
                          ? "bg-primary/15 border-primary/30 text-primary glow-primary"
                          : "bg-secondary/50 border-border/30 text-foreground hover:border-primary/20"
                      }`}
                    >
                      <span className="font-medium">High Contrast Mode</span>
                      <div className={`h-6 w-11 rounded-full transition-colors ${highContrast ? "bg-primary" : "bg-muted"}`}>
                        <div
                          className={`h-5 w-5 rounded-full bg-background transition-transform mt-0.5 shadow-sm ${
                            highContrast ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        <p className="text-sm text-foreground font-medium truncate">{uploadedFiles[0]?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadedFiles.length === 1
                            ? "1 material attached"
                            : `${uploadedFiles.length} materials attached`}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {[
                        { label: "Lecture", value: lectureTitle || "Not set" },
                        { label: "Course", value: courseName || "Not set" },
                        { label: "Instructor", value: instructorName || "Not set" },
                        { label: "Detail Level", value: noteDetail },
                        { label: "Reading", value: readingMode === "key-points" ? "Key Points" : "Everything" },
                        { label: "Language", value: simplification === "simplified" ? "Easier wording" : "Standard wording" },
                        { label: "Text Size", value: `${textSize} (${textSizeToPixels(textSize)}px)` },
                        { label: "Contrast", value: highContrast ? "High" : "Normal" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span
                            className="font-medium truncate max-w-[150px] capitalize text-right text-foreground"
                          >
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary font-medium">What will carry into the session</p>
                      <p className="text-xs text-foreground/80 mt-1">
                        Material list, text size, contrast, and note-generation preferences.
                      </p>
                    </div>

                    <Button className="w-full glow-primary group" size="lg" onClick={startSession} disabled={micStatus === "testing"}>
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
