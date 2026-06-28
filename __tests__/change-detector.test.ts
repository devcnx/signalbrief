import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs/promises"
import path from "path"
import { computeSnapshotDiff, SnapshotDiff } from "@/lib/change-detector"

const TEST_DIR = path.join(process.cwd(), "data", "snapshots", "__test_detector__")
const PRIOR_PATH = path.join(TEST_DIR, "prior.txt")

beforeEach(async () => {
  await fs.mkdir(TEST_DIR, { recursive: true })
})

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true })
})

async function writePrior(content: string) {
  await fs.writeFile(PRIOR_PATH, content, "utf-8")
}

describe("computeSnapshotDiff", () => {
  it("returns null when prior file does not exist", async () => {
    const result = await computeSnapshotDiff("/nonexistent/path.txt", "current")
    expect(result).toBeNull()
  })

  it("returns hasChanges false when content is identical", async () => {
    await writePrior("same content")
    const result = await computeSnapshotDiff(PRIOR_PATH, "same content")
    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(false)
  })

  it("detects additions only", async () => {
    await writePrior("line one")
    const result = await computeSnapshotDiff(PRIOR_PATH, "line one\nline two")
    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(true)
    expect(result!.additions).toContain("line two")
    expect(result!.changeType).toBe("updated")
  })

  it("detects removals only", async () => {
    await writePrior("line one\nline two")
    const result = await computeSnapshotDiff(PRIOR_PATH, "line one")
    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(true)
    expect(result!.removals).toContain("line two")
  })

  it("detects additions and removals", async () => {
    await writePrior("old line")
    const result = await computeSnapshotDiff(PRIOR_PATH, "new line")
    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(true)
    expect(result!.additions).toContain("new line")
    expect(result!.removals).toContain("old line")
  })

  it("classifies significance from diff content", async () => {
    await writePrior("old")
    const result = await computeSnapshotDiff(PRIOR_PATH, "Security vulnerability patched")
    expect(result).not.toBeNull()
    expect(result!.hasChanges).toBe(true)
    expect(result!.significance).toBe("high")
  })

  it("generates changedText with diff markers", async () => {
    await writePrior("removed line")
    const result = await computeSnapshotDiff(PRIOR_PATH, "added line")
    expect(result).not.toBeNull()
    expect(result!.changedText).toContain("--- removed")
    expect(result!.changedText).toContain("+++ added")
    expect(result!.changedText).toContain("- removed line")
    expect(result!.changedText).toContain("+ added line")
  })
})
