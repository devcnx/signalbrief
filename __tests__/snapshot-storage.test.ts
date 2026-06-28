import { describe, it, expect, beforeAll, afterAll } from "vitest"
import fs from "fs/promises"
import path from "path"
import { readSnapshotFile, saveSnapshot } from "@/lib/snapshot-storage"

const TEST_SNAPSHOT_DIR = path.join(process.cwd(), "data", "snapshots", "__test__")
const TEST_SOURCE_ID = "__test__"

beforeAll(async () => {
  await fs.mkdir(TEST_SNAPSHOT_DIR, { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_SNAPSHOT_DIR, { recursive: true, force: true })
})

describe("readSnapshotFile", () => {
  it("reads a valid snapshot file", async () => {
    const { cleanedContentPath } = await saveSnapshot(
      TEST_SOURCE_ID,
      "valid-test",
      "<p>raw</p>",
      "cleaned content"
    )
    const content = await readSnapshotFile(cleanedContentPath)
    expect(content).toBe("cleaned content")
  })

  it("rejects path traversal with ../", async () => {
    const maliciousPath = path.join(TEST_SNAPSHOT_DIR, "..", "..", "package.json")
    await expect(readSnapshotFile(maliciousPath)).rejects.toThrow("Path traversal rejected")
  })

  it("rejects absolute path outside base", async () => {
    await expect(readSnapshotFile("/etc/passwd")).rejects.toThrow("Path traversal rejected")
  })

  it("allows reading within the snapshot base directory", async () => {
    const { cleanedContentPath } = await saveSnapshot(
      TEST_SOURCE_ID,
      "nested-test",
      "<p>raw</p>",
      "nested content"
    )
    const content = await readSnapshotFile(cleanedContentPath)
    expect(content).toBe("nested content")
  })
})
