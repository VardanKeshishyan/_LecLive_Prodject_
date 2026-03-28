"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react"
import type { Metadata } from "next"

type Mode = "signin" | "signup"

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError("Please fill in all fields.")
      return
    }

    if (mode === "signup") {
      if (password !== repeatPassword) {
        setError("Passwords do not match.")
        return
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
    }

    // Placeholder — auth not yet connected
    setError(mode === "signin"
      ? "Sign in is coming soon. Authentication is not yet connected."
      : "Account creation is coming soon. Authentication is not yet connected.")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div
        className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.19 165), transparent 70%)" }}
      />

      <Navbar />

      <main className="pt-28 pb-16 px-4 flex flex-col items-center justify-center min-h-screen">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary mb-4">
            <Mic className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            LiveLecture<span className="text-primary">AI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "signin"
              ? "Sign in to access your saved lecture notes."
              : "Create your account to start capturing lectures."}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md animate-fade-in-up-delay-1">
          <div className="card-futuristic rounded-2xl p-8 border border-border/50">

            {/* Tab switcher */}
            <div className="flex rounded-xl bg-secondary/60 p-1 mb-7 border border-border/30">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null) }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === m
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-foreground/90">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="bg-secondary/50 border-border/50 focus:border-primary/60 transition-colors h-11"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-foreground/90">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="bg-secondary/50 border-border/50 focus:border-primary/60 transition-colors h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Repeat password — sign up only */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="repeat-password" className="text-sm text-foreground/90">Repeat Password</Label>
                  <div className="relative">
                    <Input
                      id="repeat-password"
                      type={showRepeat ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      autoComplete="new-password"
                      className="bg-secondary/50 border-border/50 focus:border-primary/60 transition-colors h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRepeat((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showRepeat ? "Hide password" : "Show password"}
                    >
                      {showRepeat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full h-11 glow-primary group text-sm font-medium mt-1">
                {mode === "signin" ? "Sign In" : "Create Account"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </form>

            {/* Footer link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null) }}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            By continuing you agree to our{" "}
            <span className="text-primary/70 cursor-pointer hover:text-primary">Terms of Service</span>
            {" "}and{" "}
            <span className="text-primary/70 cursor-pointer hover:text-primary">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  )
}
