import { describe, it, expect } from "vitest"
import { classifyChange } from "@/lib/change-classifier"

describe("classifyChange", () => {
  describe("high impact", () => {
    it("detects new model announcements", () => {
      expect(classifyChange("Introducing new model GPT-5", "")).toBe("high")
    })

    it("detects deprecation notices", () => {
      expect(classifyChange("API v2 is deprecated", "")).toBe("high")
    })

    it("detects breaking changes", () => {
      expect(classifyChange("Breaking change: auth endpoint removed", "")).toBe("high")
    })

    it("detects security updates", () => {
      expect(classifyChange("Security vulnerability CVE-2025-1234 patched", "")).toBe("high")
    })

    it("detects pricing changes", () => {
      expect(classifyChange("Pricing update: new rate limits apply", "")).toBe("high")
    })

    it("detects compliance changes", () => {
      expect(classifyChange("SOC2 compliance requirement updated", "")).toBe("high")
    })

    it("detects enterprise features", () => {
      expect(classifyChange("New enterprise feature for SSO", "")).toBe("high")
    })

    it("detects high impact in removals", () => {
      expect(classifyChange("", "Removed deprecated API endpoint")).toBe("high")
    })

    it("classifies valid CVE identifiers as high", () => {
      expect(classifyChange("Fixed CVE-2025-1234 vulnerability", "")).toBe("high")
    })

    it("does not classify invalid CVE patterns as high", () => {
      expect(classifyChange("Related to CVE-5 issue", "")).not.toBe("high")
    })

    it("does not classify 'insecurity' as security issue", () => {
      expect(classifyChange("insecurity fix for typo", "")).not.toBe("high")
    })

    it("classifies 'security' as high impact", () => {
      expect(classifyChange("security fix for auth bypass", "")).toBe("high")
    })
  })

  describe("medium impact", () => {
    it("detects SDK updates", () => {
      expect(classifyChange("Python SDK updated to v2.1", "")).toBe("medium")
    })

    it("detects documentation additions", () => {
      expect(classifyChange("Guide added for authentication setup", "")).toBe("medium")
    })

    it("detects preview features", () => {
      expect(classifyChange("Preview: new streaming API", "")).toBe("medium")
    })

    it("detects behavior clarifications", () => {
      expect(classifyChange("Model behavior clarification for temperature", "")).toBe("medium")
    })

    it("detects integration guidance", () => {
      expect(classifyChange("Integration guide for LangChain added", "")).toBe("medium")
    })

    it("detects medium impact in combined text", () => {
      expect(classifyChange("SDK updated to v2.1", "Removed old SDK")).toBe("medium")
    })
  })

  describe("low impact", () => {
    it("detects minor updates", () => {
      expect(classifyChange("Minor update to docs formatting", "")).toBe("low")
    })

    it("detects clarifications", () => {
      expect(classifyChange("Clarification on error message wording", "")).toBe("low")
    })

    it("detects small changes", () => {
      expect(classifyChange("Small tweak to error message wording", "")).toBe("low")
    })

    it("detects examples", () => {
      expect(classifyChange("Added example for batch API usage", "")).toBe("low")
    })
  })

  describe("noise", () => {
    it("detects footer updates", () => {
      expect(classifyChange("Updated footer copyright notice", "")).toBe("noise")
    })

    it("detects navigation changes", () => {
      expect(classifyChange("Navigation menu reorganized", "")).toBe("noise")
    })

    it("detects loading messages", () => {
      expect(classifyChange("Loading... please wait", "")).toBe("noise")
    })

    it("detects copyright notices", () => {
      expect(classifyChange("All rights reserved 2025", "")).toBe("noise")
    })
  })

  describe("fallback behavior", () => {
    it("returns medium for long unclassified text", () => {
      const longText = "a".repeat(300)
      expect(classifyChange(longText, "")).toBe("medium")
    })

    it("returns low for short unclassified text", () => {
      expect(classifyChange("something changed", "")).toBe("low")
    })
  })

  describe("combined additions and removals", () => {
    it("checks both additions and removals for patterns", () => {
      expect(classifyChange(
        "Updated documentation",
        "Removed deprecated endpoint"
      )).toBe("high")
    })

    it("returns low when neither has strong signals", () => {
      expect(classifyChange(
        "Changed a word",
        "Removed a word"
      )).toBe("low")
    })
  })
})
