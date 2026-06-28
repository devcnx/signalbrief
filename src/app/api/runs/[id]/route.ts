import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        snapshots: {
          include: {
            source: {
              select: { id: true, name: true, provider: true, url: true },
            },
            changes: true,
          },
          orderBy: { fetchedAt: "desc" },
        },
        changes: {
          include: {
            source: {
              select: { id: true, name: true, provider: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }

    return NextResponse.json(run)
  } catch {
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 })
  }
}