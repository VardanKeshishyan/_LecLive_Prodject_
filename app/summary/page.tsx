import { Suspense } from "react"
import { SummaryClient } from "./summary-client"

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SummaryClient />
    </Suspense>
  )
}
