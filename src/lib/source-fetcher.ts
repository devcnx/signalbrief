import crypto from "crypto"

export type FetchResult = {
  ok: boolean
  statusCode: number
  rawHtml: string
  errorMessage: string | null
}

const FETCH_TIMEOUT_MS = 15000
const USER_AGENT = "SignalBrief/0.1 (local documentation monitor)"

export async function fetchSource(url: string): Promise<FetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    })

    const rawHtml = await res.text()

    return {
      ok: res.ok,
      statusCode: res.status,
      rawHtml,
      errorMessage: res.ok ? null : `HTTP ${res.status} ${res.statusText}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error"
    return {
      ok: false,
      statusCode: 0,
      rawHtml: "",
      errorMessage: message,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function generateContentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex")
}