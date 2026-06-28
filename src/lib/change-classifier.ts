import type { Significance } from "@/lib/types"

const HIGH_IMPACT_PATTERNS = [
  /\bnew\s+(model|api|capability|platform|service)\b/i,
  /\b(deprecated|deprecation|sunset|end[\s-]of[\s-]life)\b/i,
  /\b(breaking|backward[\s-]incompatible)\b/i,
  /\b(security|vulnerability|exploit|patch|CVE-\d{4}-\d+)\b/i,
  /\b(pricing|price[\s-]change|rate[\s-]limit\s+(change|increas|decreas|remov)|quota\s+(change|increas|decreas))\b/i,
  /\b(compliance|compliant|regulation|regulatory|gdpr|hipaa|soc2)\b/i,
  /\b(enterprise[\s-]feature|enterprise[\s-]tier)\b/i,
]

const MEDIUM_IMPACT_PATTERNS = [
  /\b(sdk|library|package)\s+(update|updates|updated|release|releases|released|version)\b/i,
  /\b(documentation|doc|guide|tutorial)\s+(added|updated|new)\b/i,
  /\b(preview|beta|early[\s-]access|experimental)\b/i,
  /\b(behavior|behaviour)\b/i,
  /\b(integration|integrating)\b/i,
]

const LOW_IMPACT_PATTERNS = [
  /\bminor\s+(update|fix|improve)\b/i,
  /\b(clarification|clarifying)\b/i,
  /\bsmall\s+(change|update|tweak)\b/i,
  /\b(example|sample)\b/i,
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
