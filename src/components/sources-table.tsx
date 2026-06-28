"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

import { SOURCE_TYPES, PRIORITIES, CATEGORIES } from "@/lib/source-constants"
import type { SourceType, Priority } from "@/lib/types"

type Source = {
  id: string
  provider: string
  name: string
  url: string
  type: string
  category: string
  priority: string
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

type SourceFormData = {
  name: string
  provider: string
  url: string
  type: SourceType
  category: string
  priority: Priority
  notes: string
}

const defaultForm: SourceFormData = {
  name: "",
  provider: "",
  url: "",
  type: "changelog",
  category: "api",
  priority: "medium",
  notes: "",
}

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export function SourcesTable({ sources: initialSources }: { sources: Source[] }) {
  const router = useRouter()
  const [sources, setSources] = useState(initialSources)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SourceFormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null)

  useEffect(() => {
    setSources(initialSources)
  }, [initialSources])

  const resetForm = useCallback(() => {
    setForm(defaultForm)
    setErrors({})
  }, [])

  async function handleAddClick() {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors(data.errors || { general: "Failed to create source" })
        return
      }
      const created = await res.json()
      setSources((prev) => [created, ...prev])
      setAddOpen(false)
      resetForm()
      router.refresh()
    } catch {
      setErrorMessage("Network error — failed to create source")
    } finally {
      setSaving(false)
    }
  }

  async function handleEditClick() {
    if (!editingId) return
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/sources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors(data.errors || { general: "Failed to update source" })
        return
      }
      const updated = await res.json()
      setSources((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
      setEditOpen(false)
      setEditingId(null)
      resetForm()
      router.refresh()
    } catch {
      setErrorMessage("Network error — failed to update source")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(source: Source) {
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !source.active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)))
        router.refresh()
      } else {
        setErrorMessage("Failed to toggle source status")
      }
    } catch {
      setErrorMessage("Network error — failed to toggle source")
    }
  }

  async function handleDelete(source: Source) {
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        const updated = await res.json()
        setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)))
        router.refresh()
      } else {
        setErrorMessage("Failed to deactivate source")
      }
    } catch {
      setErrorMessage("Network error — failed to deactivate source")
    }
  }

  function openEdit(source: Source) {
    setForm({
      name: source.name,
      provider: source.provider,
      url: source.url,
      type: source.type as SourceType,
      category: source.category,
      priority: source.priority as Priority,
      notes: source.notes || "",
    })
    setEditingId(source.id)
    setErrors({})
    setEditOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sources</h1>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm() }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={(e) => { e.preventDefault(); handleAddClick() }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add Source</DialogTitle>
                <DialogDescription>Add a new AI update source to monitor.</DialogDescription>
              </DialogHeader>
              <SourceFormFields form={form} setForm={setForm} errors={errors} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Add Source"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No sources yet. Add your first source to get started.
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {source.url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{source.provider}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SOURCE_TYPES.find((t) => t.value === source.type)?.label || source.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[source.priority] || ""}>
                      {source.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={source.active}
                      onCheckedChange={() => handleToggle(source)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(source)} disabled={saving}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(source)} disabled={saving}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { resetForm(); setEditingId(null) }}}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); handleEditClick() }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Source</DialogTitle>
              <DialogDescription>Update the source details.</DialogDescription>
            </DialogHeader>
            <SourceFormFields form={form} setForm={setForm} errors={errors} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditOpen(false); resetForm(); setEditingId(null) }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{deleteTarget?.name}"? This will set it to inactive but preserve its history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={async () => {
                if (deleteTarget) {
                  setSaving(true)
                  await handleDelete(deleteTarget)
                  setSaving(false)
                  setDeleteTarget(null)
                }
              }}
            >
              {saving ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

function SourceFormFields({
  form,
  setForm,
  errors,
}: {
  form: SourceFormData
  setForm: (f: SourceFormData | ((prev: SourceFormData) => SourceFormData)) => void
  errors: Record<string, string>
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Input
            id="provider"
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
          />
          {errors.provider && <p className="text-sm text-destructive">{errors.provider}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: v as SourceType }))}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? "" }))}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
    </div>
  )
}
