import { diffWords } from "diff"

export type DiffSegment = {
  value: string
  added?: boolean
  removed?: boolean
}

export type DiffResult = {
  hasChanges: boolean
  segments: DiffSegment[]
  additions: string
  removals: string
}

export function computeDiff(priorText: string, currentText: string): DiffResult {
  const segments = diffWords(priorText, currentText)

  const additions = segments
    .filter((s) => s.added)
    .map((s) => s.value)
    .join("")

  const removals = segments
    .filter((s) => s.removed)
    .map((s) => s.value)
    .join("")

  return {
    hasChanges: additions.length > 0 || removals.length > 0,
    segments,
    additions,
    removals,
  }
}
