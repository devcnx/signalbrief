import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchSource, generateContentHash } from "@/lib/source-fetcher"
import { cleanHtml } from "@/lib/content-cleaner"
import { saveSnapshot } from "@/lib/snapshot-storage"
import { detectAndRecordChanges } from "@/lib/change-detector"
import { buildNewsletter } from "@/lib/newsletter-builder"

export async function POST() {
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
  let changesFound = 0

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
    const snapshotId = randomUUID()

    let paths
    try {
      paths = await saveSnapshot(
        source.id,
        snapshotId,
        fetchResult.rawHtml,
        cleanResult.cleanedText
      )
    } catch (error) {
      await prisma.snapshot.create({
        data: {
          sourceId: source.id,
          runId: run.id,
          status: "failed",
          statusCode: fetchResult.statusCode,
          errorMessage: `File save failed: ${error instanceof Error ? error.message : "unknown"}`,
        },
      })
      errorsCount++
      continue
    }

    try {
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
    } catch (error) {
      console.error(`DB write failed for snapshot ${snapshotId}:`, error)
      errorsCount++
      continue
    }

    changesFound += await detectAndRecordChanges({
      sourceId: source.id,
      runId: run.id,
      snapshotId,
      currentHash: contentHash,
      currentText: cleanResult.cleanedText,
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
      changesFound,
    },
  })

  let newsletter = null
  if (changesFound > 0) {
    try {
      newsletter = await buildNewsletter(run.id)
    } catch (error) {
      console.error(`Failed to build newsletter for run ${run.id}:`, error)
    }
  }

  return NextResponse.json(
    { ...updatedRun, newsletterId: newsletter?.id ?? null },
    { status: 201 }
  )
}
