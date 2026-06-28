import { prisma } from "./db"
import { readSnapshotFile } from "./snapshot-storage"
import { computeDiff } from "./diff-engine"
import { classifyChange } from "./change-classifier"

export type SnapshotDiff = {
  hasChanges: boolean
  additions: string
  removals: string
  changedText: string
  changeType: "new" | "updated"
  significance: string
}

export async function findPriorSnapshot(sourceId: string, currentRunId: string) {
  return prisma.snapshot.findFirst({
    where: {
      sourceId,
      status: "success",
      runId: { not: currentRunId },
      contentHash: { not: null },
    },
    orderBy: { fetchedAt: "desc" },
  })
}

export async function computeSnapshotDiff(
  priorSnapshotPath: string,
  currentText: string
): Promise<SnapshotDiff | null> {
  let priorText: string | null = null

  try {
    priorText = await readSnapshotFile(priorSnapshotPath)
  } catch {
    return null
  }

  if (priorText === null) return null

  const diff = computeDiff(priorText, currentText)

  if (!diff.hasChanges) {
    return { hasChanges: false, additions: "", removals: "", changedText: "", changeType: "updated", significance: "low" }
  }

  const changeType = priorText.length === 0 ? "new" : "updated"
  const significance = classifyChange(diff.additions, diff.removals)

  const formatDiff = (text: string, prefix: string) =>
    text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => `${prefix} ${line}`)
      .join("\n")

  const changedText = [
    diff.removals ? "--- removed\n" + formatDiff(diff.removals, "-") : "",
    diff.additions ? "+++ added\n" + formatDiff(diff.additions, "+") : "",
  ]
    .filter(Boolean)
    .join("\n")

  return {
    hasChanges: true,
    additions: diff.additions,
    removals: diff.removals,
    changedText,
    changeType,
    significance,
  }
}

export async function recordDetectedChange(
  sourceId: string,
  runId: string,
  snapshotId: string,
  diff: SnapshotDiff
) {
  return prisma.detectedChange.create({
    data: {
      sourceId,
      runId,
      snapshotId,
      changeType: diff.changeType,
      significance: diff.significance,
      changedText: diff.changedText,
    },
  })
}

export async function detectAndRecordChanges({
  sourceId,
  runId,
  snapshotId,
  currentHash,
  currentText,
}: {
  sourceId: string
  runId: string
  snapshotId: string
  currentHash: string
  currentText: string
}): Promise<number> {
  const priorSnapshot = await findPriorSnapshot(sourceId, runId)

  if (priorSnapshot && currentHash === priorSnapshot.contentHash) return 0
  if (!priorSnapshot?.cleanedContentPath) return 0

  const diff = await computeSnapshotDiff(priorSnapshot.cleanedContentPath, currentText)
  if (!diff || !diff.hasChanges) return 0

  try {
    await recordDetectedChange(sourceId, runId, snapshotId, diff)
    return 1
  } catch (error) {
    console.error(`Failed to create DetectedChange for source ${sourceId}:`, error)
    return 0
  }
}
