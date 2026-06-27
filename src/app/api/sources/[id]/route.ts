import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateSourceInput } from "@/lib/validators"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const existing = await prisma.source.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  const body = await request.json()

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
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const existing = await prisma.source.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  try {
    const source = await prisma.source.update({
      where: { id },
      data: { active: false },
    })
    return NextResponse.json(source)
  } catch (error) {
    return NextResponse.json({ error: "Failed to deactivate source" }, { status: 500 })
  }
}
