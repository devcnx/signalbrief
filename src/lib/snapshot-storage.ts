import fs from "fs/promises"
import path from "path"

const SNAPSHOT_BASE_DIR = path.join(process.cwd(), "data", "snapshots")

export type SnapshotPaths = {
  rawContentPath: string
  cleanedContentPath: string
}

export async function saveSnapshot(
  sourceId: string,
  snapshotId: string,
  rawHtml: string,
  cleanedText: string
): Promise<SnapshotPaths> {
  const sourceDir = path.join(SNAPSHOT_BASE_DIR, sourceId)
  await fs.mkdir(sourceDir, { recursive: true })

  const rawContentPath = path.join(sourceDir, `${snapshotId}.raw.html`)
  const cleanedContentPath = path.join(sourceDir, `${snapshotId}.cleaned.txt`)

  await fs.writeFile(rawContentPath, rawHtml, "utf-8")
  await fs.writeFile(cleanedContentPath, cleanedText, "utf-8")

  return { rawContentPath, cleanedContentPath }
}

export async function readSnapshotFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8")
}