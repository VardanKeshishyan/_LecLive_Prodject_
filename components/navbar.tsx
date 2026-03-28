"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Mic, ArrowRight, Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme")
    const shouldUseDarkMode = savedTheme !== "light"
    setIsDarkMode(shouldUseDarkMode)
    document.documentElement.classList.toggle("dark", shouldUseDarkMode)
  }, [])

  const handleThemeToggle = () => {
    setIsDarkMode((currentMode) => {
      const nextMode = !currentMode
      document.documentElement.classList.toggle("dark", nextMode)
      window.localStorage.setItem("theme", nextMode ? "dark" : "light")
      return nextMode
    })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-primary">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <Link href="/" className="text-xl font-bold text-foreground tracking-tight">
              LiveLecture<span className="text-primary">AI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "/", label: "Home" },
              { href: "/#features", label: "Features" },
              { href: "/session", label: "Demo" },
              { href: "/summary", label: "Summary" }
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              onClick={handleThemeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
            >
              Sign In
            </Button>
            <Button size="sm" className="glow-primary group" asChild>
              <Link href="/session">
                Start Session
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className="md:hidden flex items-center gap-1.5">
            <Button
              size="icon-sm"
              variant="ghost"
              type="button"
              onClick={handleThemeToggle}
              className="text-muted-foreground hover:text-foreground transition-all duration-300"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 glass">
          <div className="px-4 py-4 space-y-1">
            {[
              { href: "/", label: "Home" },
              { href: "/#features", label: "Features" },
              { href: "/session", label: "Demo" },
              { href: "/summary", label: "Summary" }
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2.5 px-3 rounded-lg hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-border/50 mt-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="w-full border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                Sign In
              </Button>
              <Button size="sm" className="w-full glow-primary" asChild>
                <Link href="/session">Start Session</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
