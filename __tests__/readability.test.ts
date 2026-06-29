import { describe, it, expect } from "vitest"
import {
  parseChangedText,
  stripDiffMarkers,
  buildReadableTitle,
  buildReadableSummary,
  buildChangePreview,
  groupDiffSections,
  isRawDiff,
} from "@/lib/readability"

describe("parseChangedText", () => {
  it("parses additions and removals from standard diff format", () => {
    const changedText = "--- removed\n- old line\n+++ added\n+ new line"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["old line"])
    expect(result.additions).toEqual(["new line"])
  })

  it("handles additions only", () => {
    const changedText = "+++ added\n+ new feature"
    const result = parseChangedText(changedText)
    expect(result.additions).toEqual(["new feature"])
    expect(result.removals).toEqual([])
  })

  it("handles removals only", () => {
    const changedText = "--- removed\n- old feature"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["old feature"])
    expect(result.additions).toEqual([])
  })

  it("handles multiple lines per section", () => {
    const changedText = "--- removed\n- line one\n- line two\n+++ added\n+ line three\n+ line four"
    const result = parseChangedText(changedText)
    expect(result.removals).toEqual(["line one", "line two"])
    expect(result.additions).toEqual(["line three", "line four"])
  })

  it("returns empty arrays for empty input", () => {
    const result = parseChangedText("")
    expect(result.additions).toEqual([])
    expect(result.removals).toEqual([])
  })
})

describe("stripDiffMarkers", () => {
  it("removes diff markers and formats additions + removals", () => {
    const changedText = "--- removed\n- old text\n+++ added\n+ new text"
    const result = stripDiffMarkers(changedText)
    expect(result).toContain("new text")
    expect(result).toContain("old text")
    expect(result).not.toContain("--- removed")
    expect(result).not.toContain("+++ added")
    expect(result).not.toContain("- ")
    expect(result).not.toContain("+ ")
  })

  it("includes Updated and Previously labels for mixed additions and removals", () => {
    const changedText = "--- removed\n- old text\n+++ added\n+ new text"
    const result = stripDiffMarkers(changedText)
    expect(result).toContain("Updated:")
    expect(result).toContain("Previously:")
  })

  it("returns additions only when no removals", () => {
    const changedText = "+++ added\n+ new content"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("new content")
    expect(result).not.toContain("+++")
  })

  it("prefixes removals when no additions", () => {
    const changedText = "--- removed\n- old content"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("Removed:\nold content")
  })

  it("joins multiple lines with newlines preserving structure", () => {
    const changedText = "+++ added\n+ line one\n+ line two"
    const result = stripDiffMarkers(changedText)
    expect(result).toBe("line one\nline two")
  })

  it("handles empty changedText", () => {
    expect(stripDiffMarkers("")).toBe("")
  })

  it("handles header-less diffs with marker lines", () => {
    const changedText = "- some line\n+ another line"
    const result = stripDiffMarkers(changedText)
    expect(result).toContain("some line")
    expect(result).toContain("another line")
    expect(result).toContain("Updated:")
    expect(result).toContain("Previously:")
  })
})

describe("buildReadableTitle", () => {
  it("uses first addition for new changes", () => {
    const changedText = "+++ added\n+ New GPT-5 model released\n+ More details"
    const title = buildReadableTitle(changedText, "OpenAI Changelog")
    expect(title).toBe("New GPT-5 model released")
  })

  it("uses first removal when no additions", () => {
    const changedText = "--- removed\n- Deprecated API endpoint"
    const title = buildReadableTitle(changedText, "Source")
    expect(title).toBe("Deprecated API endpoint")
  })

  it("truncates long titles", () => {
    const longLine = "A".repeat(100)
    const changedText = `+++ added\n+ ${longLine}`
    const title = buildReadableTitle(changedText, "Source")
    expect(title.length).toBe(80)
    expect(title.endsWith("...")).toBe(true)
  })

  it("falls back to source name when no parseable content", () => {
    const title = buildReadableTitle("", "My Source")
    expect(title).toBe("My Source")
  })

  it("prefers additions over removals for updated changes", () => {
    const changedText = "--- removed\n- old\n+++ added\n+ new"
    const title = buildReadableTitle(changedText, "Source")
    expect(title).toBe("new")
  })
})

describe("buildReadableSummary", () => {
  it("strips diff markers for readable summary", () => {
    const changedText = "--- removed\n- old text\n+++ added\n+ new text"
    const summary = buildReadableSummary(changedText)
    expect(summary).not.toContain("---")
    expect(summary).not.toContain("+++")
    expect(summary).not.toMatch(/^[-+] /m)
  })

  it("respects max length", () => {
    const changedText = `+++ added\n+ ${"A".repeat(500)}`
    const summary = buildReadableSummary(changedText, 50)
    expect(summary.length).toBe(50)
    expect(summary.endsWith("...")).toBe(true)
  })

  it("uses default max length of 400", () => {
    const changedText = `+++ added\n+ ${"A".repeat(500)}`
    const summary = buildReadableSummary(changedText)
    expect(summary.length).toBe(400)
  })
})

describe("buildChangePreview", () => {
  it("strips diff markers for preview", () => {
    const changedText = "--- removed\n- old\n+++ added\n+ new content here"
    const preview = buildChangePreview(changedText)
    expect(preview).not.toContain("---")
    expect(preview).not.toContain("+++")
    expect(preview).toContain("new content here")
  })

  it("truncates to 200 chars by default", () => {
    const changedText = `+++ added\n+ ${"A".repeat(300)}`
    const preview = buildChangePreview(changedText)
    expect(preview.length).toBe(200)
  })

  it("respects custom max length", () => {
    const changedText = `+++ added\n+ ${"A".repeat(300)}`
    const preview = buildChangePreview(changedText, 100)
    expect(preview.length).toBe(100)
  })
})

describe("buildReadableTitle edge cases", () => {
  it("falls back to removals when only removals exist", () => {
    const changedText = "--- removed\n- Deprecated endpoint"
    const title = buildReadableTitle(changedText, "Source")
    expect(title).toBe("Deprecated endpoint")
  })

  it("falls back to source name when no content", () => {
    const title = buildReadableTitle("", "My Source")
    expect(title).toBe("My Source")
  })
})

describe("parseChangedText mixed lines", () => {
  it("handles mixed prefixed and non-prefixed lines in a section", () => {
    const changedText = "--- removed\n- prefixed line\nnon-prefixed line"
    const result = parseChangedText(changedText)
    expect(result.removals).toContain("prefixed line")
    expect(result.removals).toContain("non-prefixed line")
  })
})

describe("groupDiffSections", () => {
  it("groups removals and additions into sections", () => {
    const changedText = "--- removed\n- old line\n+++ added\n+ new line"
    const sections = groupDiffSections(changedText)
    expect(sections).toHaveLength(2)
    expect(sections[0].type).toBe("removed")
    expect(sections[0].lines).toEqual(["old line"])
    expect(sections[1].type).toBe("added")
    expect(sections[1].lines).toEqual(["new line"])
  })

  it("returns single removed section when only removals", () => {
    const changedText = "--- removed\n- old line"
    const sections = groupDiffSections(changedText)
    expect(sections).toHaveLength(1)
    expect(sections[0].type).toBe("removed")
  })

  it("returns single added section when only additions", () => {
    const changedText = "+++ added\n+ new line"
    const sections = groupDiffSections(changedText)
    expect(sections).toHaveLength(1)
    expect(sections[0].type).toBe("added")
  })

  it("returns empty array for empty input", () => {
    const sections = groupDiffSections("")
    expect(sections).toEqual([])
  })

  it("handles header-less diffs with marker lines", () => {
    const changedText = "- removed without header\n+ added without header"
    const sections = groupDiffSections(changedText)
    expect(sections).toHaveLength(2)
    expect(sections[0].type).toBe("removed")
    expect(sections[0].lines).toEqual(["removed without header"])
    expect(sections[1].type).toBe("added")
    expect(sections[1].lines).toEqual(["added without header"])
  })
})

describe("isRawDiff", () => {
  it("detects text with section headers", () => {
    expect(isRawDiff("--- removed\n- old\n+++ added\n+ new")).toBe(true)
  })

  it("detects text with only removed header", () => {
    expect(isRawDiff("--- removed\n- old line")).toBe(true)
  })

  it("detects text with only added header", () => {
    expect(isRawDiff("+++ added\n+ new line")).toBe(true)
  })

  it("detects header-less diffs with both markers", () => {
    expect(isRawDiff("- removed\n+ added")).toBe(true)
  })

  it("rejects plain text with only bullet points", () => {
    expect(isRawDiff("- item one\n- item two")).toBe(false)
  })

  it("rejects plain text with no markers", () => {
    expect(isRawDiff("This is a normal summary")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(isRawDiff("")).toBe(false)
  })

  it("rejects text with + in URLs but no diff markers", () => {
    expect(isRawDiff("See https://example.com/foo+bar")).toBe(false)
  })
})