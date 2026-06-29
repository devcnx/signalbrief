import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateSourceInput } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.source.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const fieldsToValidate = ["url", "name", "provider", "type", "category", "priority"]
  const hasFieldsToValidate = fieldsToValidate.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  )

  if (hasFieldsToValidate) {
    const errors = validateSourceInput({
      ...existing,
      ...body,
    })
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 422 })
    }
  }

  const source = await prisma.source.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.provider !== undefined && { provider: body.provider }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })

  return NextResponse.json(source)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const permanent = url.searchParams.get("permanent")?.toLowerCase() === "true"

  const existing = await prisma.source.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  if (permanent) {
    try {
      await prisma.source.delete({ where: { id } })
      return NextResponse.json({ deleted: true, id })
    } catch (err) {
      console.error("Error deleting source permanently:", err)
      return NextResponse.json({ error: "Failed to delete source" }, { status: 500 })
    }
  }

  try {
    const source = await prisma.source.update({
      where: { id },
      data: { active: false },
    })
    return NextResponse.json(source)
  } catch {
    return NextResponse.json({ error: "Failed to deactivate source" }, { status: 500 })
  }
}
