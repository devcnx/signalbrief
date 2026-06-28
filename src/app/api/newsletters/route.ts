import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const newsletters = await prisma.newsletter.findMany({
    include: {
      run: { select: { id: true, startedAt: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const result = newsletters.map((n) => ({
    id: n.id,
    title: n.title,
    status: n.status,
    runId: n.runId,
    runStartedAt: n.run.startedAt,
    itemCount: n._count.items,
    createdAt: n.createdAt,
  }))

  return NextResponse.json(result)
}
