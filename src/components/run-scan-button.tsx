"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RunScanButton() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleScan() {
    setScanning(true)
    setError(null)
    try {
      const res = await fetch("/api/runs/start", { method: "POST" })
      if (res.ok) {
        const run = await res.json()
        router.push(`/runs/${run.id}`)
      } else {
        setError("Failed to start scan")
      }
    } catch {
      setError("Network error — failed to start scan")
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleScan} disabled={scanning}>
        <ScanLine className="h-4 w-4 mr-2" />
        {scanning ? "Scanning..." : "Run Scan"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}