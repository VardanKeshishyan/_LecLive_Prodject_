import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import {
  Mic,
  FileText,
  MessageSquare,
  Volume2,
  Presentation,
  Play,
  Accessibility,
  Eye,
  Headphones,
  Hand,
  ArrowRight,
  Sparkles,
  Zap,
  Shield
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, oklch(0.72 0.19 165), transparent 70%)',
            animation: 'orb-float-1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, oklch(0.68 0.16 280), transparent 70%)',
            animation: 'orb-float-2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.15 200), transparent 70%)',
            animation: 'orb-float-1 18s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 bg-grid">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-sm text-primary font-medium tracking-wide">AI-Powered Accessibility</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight animate-fade-in-up-delay-1">
                <span className="text-foreground">Real-Time</span>
                <br />
                <span className="text-gradient-hero">Accessible Lecture</span>
                <br />
                <span className="text-foreground">Companion</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-in-up-delay-2">
                Live structured notes, voice support, and slide-aware AI assistance for students who need more from their lectures.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up-delay-3">
                <Button size="lg" className="text-base h-12 px-8 glow-primary relative overflow-hidden group" asChild>
                  <Link href="/session">
                    <Mic className="mr-2 h-5 w-5" />
                    Start a Session
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 pt-2 animate-fade-in-up-delay-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary/70" />
                  <span>Privacy-first</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-primary/70" />
                  <span>Real-time AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Accessibility className="h-4 w-4 text-primary/70" />
                  <span>WCAG 2.1</span>
                </div>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="relative animate-fade-in-up-delay-2">
              <div className="rounded-2xl card-futuristic p-5 shadow-2xl relative overflow-hidden">
                {/* Subtle scan line effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" style={{ animation: 'scan-line 6s linear infinite' }} />
                </div>

                {/* Top Bar */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                      </span>
                      Live
                    </span>
                    <span className="text-sm text-muted-foreground">Introduction to Psychology</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono bg-secondary/50 px-2.5 py-0.5 rounded-md">Live Session</span>
                </div>

                {/* Mock Content */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Slide Preview */}
                  <div className="col-span-1 rounded-xl bg-secondary/50 p-3 border border-border/30">
                    <div className="aspect-video bg-background/30 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                      <Presentation className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground">Slide 8 of 24</p>
                  </div>

                  {/* Notes Panel */}
                  <div className="col-span-2 space-y-3">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 hover-glow transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/15 rounded-full">Key Point</span>
                        <span className="text-xs text-muted-foreground">Now</span>
                      </div>
                      <p className="text-sm text-foreground/90">Classical conditioning involves learning through association...</p>
                    </div>
                    <div className="rounded-xl bg-accent/10 border border-accent/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-accent px-2 py-0.5 bg-accent/15 rounded-full">Definition</span>
                        <span className="text-xs text-muted-foreground">Now</span>
                      </div>
                      <p className="text-sm text-foreground/90">Unconditioned stimulus: A stimulus that naturally triggers...</p>
                    </div>
                  </div>
                </div>

                {/* Voice Assistant */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 h-10 rounded-full bg-secondary/50 px-4 flex items-center border border-border/30">
                      <span className="text-sm text-muted-foreground">&ldquo;Repeat the last key point...&rdquo;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 rounded-xl glass p-3 shadow-lg animate-float glow-primary">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">TTS Active</span>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 rounded-xl glass p-3 shadow-lg" style={{ animation: 'float 6s ease-in-out 1s infinite' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">AI Analyzing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Core Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Built for <span className="text-gradient-primary">Accessibility</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Features designed to support students with diverse learning needs, powered by cutting-edge AI.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: "Live Structured Notes",
                description: "Real-time note generation organized by key points, definitions, examples, and exam-relevant content.",
                delay: "animate-fade-in-up"
              },
              {
                icon: MessageSquare,
                title: "Voice Commands",
                description: "Interact hands-free. Ask to repeat points, simplify concepts, or read back missed content.",
                delay: "animate-fade-in-up-delay-1"
              },
              {
                icon: Presentation,
                title: "Slide-Aware AI",
                description: "Upload slides for context-aware notes that connect spoken explanations to visual material.",
                delay: "animate-fade-in-up-delay-2"
              },
              {
                icon: Volume2,
                title: "Text-to-Speech",
                description: "Listen to your notes read aloud. Perfect for review or when reading is difficult.",
                delay: "animate-fade-in-up-delay-3"
              }
            ].map((feature, index) => (
              <Card key={index} className={`card-futuristic group cursor-default ${feature.delay}`}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 group-hover:shadow-[0_0_20px_oklch(0.72_0.19_165/0.2)]">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-grid-fine">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-accent/20 mb-6">
                <Accessibility className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent font-medium">Accessibility First</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
                Designed for <span className="text-gradient-primary">Diverse Needs</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                LiveLecture AI was built from the ground up to support students with various disabilities and learning differences.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Hand,
                    title: "Motor Disabilities",
                    description: "Voice controls and hands-free operation for those who cannot type or write quickly."
                  },
                  {
                    icon: Eye,
                    title: "Attention & Processing",
                    description: "Structured notes reduce cognitive load. Mark confusion points to revisit later."
                  },
                  {
                    icon: Headphones,
                    title: "Audio Learners",
                    description: "Text-to-speech playback and audio-first review options for better retention."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="h-11 w-11 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "98%", label: "Accuracy in key point detection", glow: true },
                { value: "3x", label: "Faster note review with structure", glow: false },
                { value: "100%", label: "Hands-free voice operation", glow: false },
                { value: "24/7", label: "Access to your notes anytime", glow: true }
              ].map((stat, index) => (
                <Card key={index} className={`card-futuristic p-6 text-center group ${stat.glow ? 'hover:shadow-[0_0_40px_oklch(0.72_0.19_165/0.15)]' : ''}`}>
                  <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-3">{stat.value}</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Three Steps to <span className="text-gradient-primary">Better Learning</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Configure",
                description: "Upload your lecture slides and set accessibility preferences before class begins.",
                icon: Presentation
              },
              {
                step: "02",
                title: "Live Capture",
                description: "AI listens to the lecture in real-time, generating structured notes linked to slides.",
                icon: Mic
              },
              {
                step: "03",
                title: "Review & Study",
                description: "Access organized summaries, flashcards, and quiz yourself on key concepts.",
                icon: FileText
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="card-futuristic rounded-2xl p-8 h-full">
                  <div className="text-6xl font-bold text-primary/10 mb-4 font-mono">{item.step}</div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all duration-300">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl relative z-10">
          <div className="card-futuristic rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="absolute inset-0 bg-grid-fine pointer-events-none opacity-50" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Get Started Today</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
                Ready to Transform Your<br />
                <span className="text-gradient-primary">Lecture Experience?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Start taking accessible, AI-powered notes in your next class. No setup required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base h-12 px-8 glow-primary group" asChild>
                  <Link href="/session">
                    <Mic className="mr-2 h-5 w-5" />
                    Start Your First Session
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
