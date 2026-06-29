/**
 * Diff format helpers for rendering human-readable content.
 *
 * Expected `changedText` format (from change-detector.ts):
 *   --- removed
 *   - <removed line>
 *   +++ added
 *   + <added line>
 *
 * Header-less diffs (lines starting with `- ` or `+ ` without section
 * headers) are also supported as a fallback.
 */

const REMOVED_HEADER = "--- removed"
const ADDED_HEADER = "+++ added"

// Returns text as-is when maxLength < 4 to avoid a broken ellipsis on tiny limits.
function truncate(text: string, maxLength: number): string {
  if (maxLength < 4) return text
  if (text.length <= maxLength) return text
  return text.slice(0, Math.max(0, maxLength - 3)) + "..."
}

type ParsedDiff = {
  additions: string[]
  removals: string[]
}

export function parseChangedText(changedText: string): ParsedDiff {
  const additions: string[] = []
  const removals: string[] = []

  let section: "none" | "removed" | "added" = "none"
  for (const rawLine of changedText.split("\n")) {
    if (rawLine === REMOVED_HEADER) {
      section = "removed"
      continue
    }
    if (rawLine === ADDED_HEADER) {
      section = "added"
      continue
    }
    if (rawLine.startsWith("- ")) {
      removals.push(rawLine.slice(2))
    } else if (rawLine.startsWith("+ ")) {
      additions.push(rawLine.slice(2))
    } else if (section !== "none" && rawLine.trim().length > 0) {
      if (section === "removed") removals.push(rawLine)
      else if (section === "added") additions.push(rawLine)
    }
  }

  return { additions, removals }
}

// Best-effort cleanup for unrecognised formats: strips any remaining diff markers.
function stripResidualMarkers(changedText: string): string {
  return changedText
    .replace(/^--- removed\n?/m, "")
    .replace(/^\+\+\+ added\n?/m, "")
    .replace(/^- /gm, "")
    .replace(/^\+ /gm, "")
    .trim()
}

export function stripDiffMarkers(changedText: string): string {
  const { additions, removals } = parseChangedText(changedText)

  if (additions.length > 0 && removals.length > 0) {
    return `Updated:\n${additions.join("\n")}\n\nPreviously:\n${removals.join("\n")}`
  }
  if (additions.length > 0) {
    return additions.join("\n")
  }
  if (removals.length > 0) {
    return `Removed:\n${removals.join("\n")}`
  }
  return stripResidualMarkers(changedText)
}

export function buildReadableTitle(changedText: string, sourceName: string): string {
  const { additions, removals } = parseChangedText(changedText)

  const pick = (lines: string[]): string => {
    const first = lines.find((l) => l.trim().length > 0) || ""
    return first.trim()
  }

  const lines = additions.length > 0 ? additions : removals
  const body = lines.length > 0 ? pick(lines) : sourceName

  return truncate(body, 80)
}

export function buildReadableSummary(changedText: string, maxLength: number = 400): string {
  const readable = stripDiffMarkers(changedText)
  return truncate(readable, maxLength)
}

export function buildChangePreview(changedText: string, maxLength: number = 200): string {
  const readable = stripDiffMarkers(changedText)
  return truncate(readable, maxLength)
}

export type DiffSection = {
  type: "removed" | "added"
  lines: string[]
}

const SECTION_HEADER_RE = /^(--- removed|\+\+\+ added)/m
const REMOVED_LINE_RE = /^- /m
const ADDED_LINE_RE = /^\+ /m

export function isRawDiff(text: string): boolean {
  if (SECTION_HEADER_RE.test(text)) return true
  return REMOVED_LINE_RE.test(text) && ADDED_LINE_RE.test(text)
}

export function groupDiffSections(changedText: string): DiffSection[] {
  const { additions, removals } = parseChangedText(changedText)
  const sections: DiffSection[] = []
  if (removals.length > 0) sections.push({ type: "removed", lines: removals })
  if (additions.length > 0) sections.push({ type: "added", lines: additions })
  return sections
}