import Link from "next/link"
import { Mic } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="absolute inset-0 bg-grid-fine opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-primary">
                <Mic className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">
                LiveLecture<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making lectures accessible for everyone through AI-powered real-time assistance.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: [
                { href: "/#features", label: "Features" },
                { href: "/session", label: "Demo" },
                { href: "/summary", label: "Summary" }
              ]
            },
            {
              title: "Company",
              links: [
                { href: "#", label: "About" },
                { href: "#", label: "Team" },
                { href: "#", label: "Contact" }
              ]
            },
            {
              title: "Legal",
              links: [
                { href: "#", label: "Privacy" },
                { href: "#", label: "Terms" },
                { href: "#", label: "Accessibility" }
              ]
            }
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold text-foreground mb-4 tracking-wide uppercase">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Built for accessibility. Made with care.
          </p>
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} LiveLecture AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
