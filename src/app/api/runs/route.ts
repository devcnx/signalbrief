import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const runs = await prisma.run.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    })
    return NextResponse.json(runs)
  } catch {
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 })
  }
}