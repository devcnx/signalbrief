const SIGNIFICANCE_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  noise: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function significanceColor(significance: string): string {
  return SIGNIFICANCE_COLORS[significance] || ""
}

const WHY_IT_MATTERS: Record<string, Record<string, string>> = {
  high: {
    new: "New high-impact content — requires immediate review.",
    updated: "Significant update detected — review recommended.",
    removed: "High-impact content removed — verify intentionality.",
  },
  medium: {
    new: "New content detected — worth reviewing.",
    updated: "Moderate change detected — review when convenient.",
    removed: "Content removed — check for breaking changes.",
  },
  low: {
    new: "Minor addition detected — likely low impact.",
    updated: "Minor update detected — probably low impact.",
    removed: "Minor content removed — unlikely to affect workflows.",
  },
}

export function getWhyItMatters(significance: string, changeType: string): string {
  return WHY_IT_MATTERS[significance]?.[changeType] ?? "Change detected — review to assess impact."
}
