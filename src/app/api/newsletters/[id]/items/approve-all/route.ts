import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: newsletterId } = await params

  const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } })
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })
  }

  const result = await prisma.newsletterItem.updateMany({
    where: {
      newsletterId,
      approved: false,
    },
    data: {
      approved: true,
    },
  })

  return NextResponse.json({ updated: result.count })
}
