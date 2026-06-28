import type { Significance } from "@/lib/types"

const HIGH_IMPACT_PATTERNS = [
  /new\s+(model|api|capability|platform|service)/i,
  /(deprecat|sunset|end[\s-]of[\s-]life)/i,
  /(breaking|backward[\s-]incompatib)/i,
  /(securit|vulnerability|exploit|patch|CVE-\d)/i,
  /(pric|pricing|limit|rate[\s-]limit|quota)/i,
  /(complianc|regulat|gdpr|hipaa|soc2|privacy)/i,
  /(enterprise|enterprise[\s-]feature)/i,
]

const MEDIUM_IMPACT_PATTERNS = [
  /(sdk|library|package)\s+(update|release|version)/i,
  /(documentation|doc|guide|tutorial)\s+(add|updat|new)/i,
  /(preview|beta|early[\s-]access|experimental)/i,
  /(behavior|behaviour)/i,
  /(integration|integrat)/i,
]

const LOW_IMPACT_PATTERNS = [
  /minor\s+(update|fix|improve)/i,
  /(clarif|clarification)/i,
  /small\s+(change|update|tweak)/i,
  /(example|sample)/i,
]

const NOISE_PATTERNS = [
  /footer|navigation|menu|sidebar/i,
  /(last\s+updated|last\s+modified|updated:\s+\w+)/i,
  /copyright|all rights reserved/i,
  /\d{4}-\d{2}-\d{2}/,
  /(loading\.\.\.|please wait)/i,
]

const SIGNIFICANCE_VALUES: Record<string, Significance> = {
  high: "high",
  medium: "medium",
  low: "low",
}

function testPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

export function classifyChange(diffText: string): Significance {
  const additions = diffText.slice(0, 500)
  const removals = diffText.split("--- removed\n")[1]?.split("+++")[0]?.slice(0, 500) || ""
  const combined = additions + "\n" + removals

  const checks: [RegExp[], Significance][] = [
    [HIGH_IMPACT_PATTERNS, "high"],
    [MEDIUM_IMPACT_PATTERNS, "medium"],
    [LOW_IMPACT_PATTERNS, "low"],
  ]

  for (const [patterns, significance] of checks) {
    if (testPatterns(combined, patterns)) return SIGNIFICANCE_VALUES[significance]
  }

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(combined)) return "noise"
  }

  if (diffText.length > 200) return "medium"

  return "low"
}
