const REMOVED_HEADER = "--- removed"
const ADDED_HEADER = "+++ added"

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
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
    if (section === "removed" && rawLine.startsWith("- ")) {
      removals.push(rawLine.slice(2))
    } else if (section === "added" && rawLine.startsWith("+ ")) {
      additions.push(rawLine.slice(2))
    } else if (section !== "none" && rawLine.trim().length > 0) {
      if (section === "removed") removals.push(rawLine)
      else if (section === "added") additions.push(rawLine)
    }
  }

  return { additions, removals }
}

export function stripDiffMarkers(changedText: string): string {
  const { additions, removals } = parseChangedText(changedText)

  if (additions.length > 0 && removals.length > 0) {
    return `Updated: ${additions.join(" ")}\n\nPreviously: ${removals.join(" ")}`
  }
  if (additions.length > 0) {
    return additions.join(" ")
  }
  if (removals.length > 0) {
    return `Removed: ${removals.join(" ")}`
  }
  return changedText
    .replace(/^--- removed\n?/m, "")
    .replace(/^\+\+\+ added\n?/m, "")
    .replace(/^- /gm, "")
    .replace(/^\+ /gm, "")
    .trim()
}

export function buildReadableTitle(changedText: string, sourceName: string, changeType: string): string {
  const { additions, removals } = parseChangedText(changedText)

  const pick = (lines: string[]): string => {
    const first = lines.find((l) => l.trim().length > 0) || ""
    return first.trim()
  }

  let body: string
  if (changeType === "new" && additions.length > 0) {
    body = pick(additions)
  } else if (removals.length > 0 && additions.length === 0) {
    body = pick(removals)
  } else if (additions.length > 0) {
    body = pick(additions)
  } else if (removals.length > 0) {
    body = pick(removals)
  } else {
    body = sourceName
  }

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