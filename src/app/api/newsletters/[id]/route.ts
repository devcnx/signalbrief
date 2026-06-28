import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
    include: {
      run: { select: { id: true, startedAt: true, completedAt: true } },
      items: {
        include: {
          source: { select: { name: true, provider: true, url: true } },
        },
        orderBy: [{ impactLevel: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })
  }

  return NextResponse.json(newsletter)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const newsletter = await prisma.newsletter.findUnique({ where: { id } })
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })
  }

  const updated = await prisma.newsletter.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.title !== undefined && { title: body.title }),
    },
  })

  return NextResponse.json(updated)
}
