import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateSourceInput } from "@/lib/validators"

export async function GET() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(sources)
}

export async function POST(request: Request) {
  const body = await request.json()

  const errors = validateSourceInput(body)
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 })
  }

  const source = await prisma.source.create({
    data: {
      provider: body.provider,
      name: body.name,
      url: body.url,
      type: body.type,
      category: body.category,
      priority: body.priority,
      active: body.active ?? true,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(source, { status: 201 })
}
