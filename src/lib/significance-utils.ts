const SIGNIFICANCE_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  noise: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function significanceColor(significance: string): string {
  return SIGNIFICANCE_COLORS[significance] || ""
}
