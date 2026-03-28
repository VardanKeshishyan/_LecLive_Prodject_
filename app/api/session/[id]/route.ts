import { NextResponse } from "next/server"
import { getSession, toPublicSession } from "@/lib/server/session-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const state = getSession(id)
  if (!state) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }
  return NextResponse.json(toPublicSession(state))
}
