import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: newsletterId, itemId } = await params
  const body = await request.json()

  const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } })
  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 })
  }

  const item = await prisma.newsletterItem.findFirst({
    where: { id: itemId, newsletterId },
  })
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  const updated = await prisma.newsletterItem.update({
    where: { id: itemId },
    data: {
      ...(body.approved !== undefined && { approved: body.approved }),
    },
  })

  return NextResponse.json(updated)
}
