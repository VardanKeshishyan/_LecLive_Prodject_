import { Suspense } from "react"
import { LiveLectureClient } from "./live-lecture-client"

export default function LivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading session…
        </div>
      }
    >
      <LiveLectureClient />
    </Suspense>
  )
}
