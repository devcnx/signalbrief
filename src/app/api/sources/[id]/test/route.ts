import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchSource } from "@/lib/source-fetcher"
import { cleanHtml } from "@/lib/content-cleaner"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const source = await prisma.source.findUnique({ where: { id } })
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 })
  }

  const fetchResult = await fetchSource(source.url)

  if (!fetchResult.ok) {
    return NextResponse.json({
      ok: false,
      statusCode: fetchResult.statusCode,
      error: fetchResult.errorMessage,
    })
  }

  const cleanResult = cleanHtml(fetchResult.rawHtml)

  return NextResponse.json({
    ok: true,
    statusCode: fetchResult.statusCode,
    title: cleanResult.title,
    contentLength: cleanResult.cleanedText.length,
    preview: cleanResult.cleanedText.slice(0, 500),
    error: cleanResult.error,
  })
}