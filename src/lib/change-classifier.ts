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
  /(loading\.\.\.|please wait)/i,
]

function testPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text))
}

export function classifyChange(additions: string, removals: string): Significance {
  const combined = additions + "\n" + removals

  if (testPatterns(combined, HIGH_IMPACT_PATTERNS)) return "high"
  if (testPatterns(combined, MEDIUM_IMPACT_PATTERNS)) return "medium"
  if (testPatterns(combined, LOW_IMPACT_PATTERNS)) return "low"
  if (testPatterns(combined, NOISE_PATTERNS)) return "noise"

  if (combined.length > 200) return "medium"

  return "low"
}
