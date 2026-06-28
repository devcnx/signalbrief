import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchSource, generateContentHash } from "@/lib/source-fetcher"
import { cleanHtml } from "@/lib/content-cleaner"
import { saveSnapshot } from "@/lib/snapshot-storage"

export async function POST() {
  let body
  try {
    body = {}
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const run = await prisma.run.create({
    data: {
      status: "running",
    },
  })

  const activeSources = await prisma.source.findMany({
    where: { active: true },
  })

  let sourcesChecked = 0
  let errorsCount = 0

  for (const source of activeSources) {
    sourcesChecked++

    const fetchResult = await fetchSource(source.url)

    if (!fetchResult.ok || fetchResult.rawHtml.length === 0) {
      await prisma.snapshot.create({
        data: {
          sourceId: source.id,
          runId: run.id,
          status: "failed",
          statusCode: fetchResult.statusCode,
          errorMessage: fetchResult.errorMessage,
        },
      })
      errorsCount++
      continue
    }

    const cleanResult = cleanHtml(fetchResult.rawHtml)

    if (cleanResult.error || cleanResult.cleanedText.length === 0) {
      const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      await prisma.snapshot.create({
        data: {
          sourceId: source.id,
          runId: run.id,
          status: "failed",
          statusCode: fetchResult.statusCode,
          errorMessage: cleanResult.error || "No content extracted",
        },
      })
      errorsCount++
      continue
    }

    const contentHash = generateContentHash(cleanResult.cleanedText)
    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const paths = await saveSnapshot(
      source.id,
      snapshotId,
      fetchResult.rawHtml,
      cleanResult.cleanedText
    )

    await prisma.snapshot.create({
      data: {
        id: snapshotId,
        sourceId: source.id,
        runId: run.id,
        status: "success",
        statusCode: fetchResult.statusCode,
        contentHash,
        rawContentPath: paths.rawContentPath,
        cleanedContentPath: paths.cleanedContentPath,
      },
    })
  }

  const status = errorsCount === 0 ? "completed" : errorsCount === sourcesChecked ? "failed" : "completed_with_errors"

  const updatedRun = await prisma.run.update({
    where: { id: run.id },
    data: {
      status,
      completedAt: new Date(),
      sourcesChecked,
      errorsCount,
    },
  })

  return NextResponse.json(updatedRun, { status: 201 })
}