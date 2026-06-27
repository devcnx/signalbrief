"use client"

import { useState, useCallback } from "react"
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
  createdAt: Date
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

  const resetForm = useCallback(() => {
    setForm(defaultForm)
    setErrors({})
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors || { general: "Failed to create source" })
      setSaving(false)
      return
    }
    const created = await res.json()
    setSources((prev) => [created, ...prev])
    setAddOpen(false)
    resetForm()
    setSaving(false)
    router.refresh()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    const res = await fetch(`/api/sources/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors || { general: "Failed to update source" })
      setSaving(false)
      return
    }
    const updated = await res.json()
    setSources((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
    setEditOpen(false)
    setEditingId(null)
    resetForm()
    setSaving(false)
    router.refresh()
  }

  async function handleToggle(source: Source) {
    const res = await fetch(`/api/sources/${source.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !source.active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)))
      router.refresh()
    }
  }

  async function handleDelete(source: Source) {
    if (!confirm(`Deactivate "${source.name}"?`)) return
    const res = await fetch(`/api/sources/${source.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, active: false } : s))
      )
      router.refresh()
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
            <DialogHeader>
              <DialogTitle>Add Source</DialogTitle>
              <DialogDescription>Add a new AI update source to monitor.</DialogDescription>
            </DialogHeader>
            <SourceFormFields form={form} setForm={setForm} errors={errors} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Saving..." : "Add Source"}
              </Button>
            </DialogFooter>
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
                      <Button variant="ghost" size="icon" onClick={() => openEdit(source)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(source)}>
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
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
            <DialogDescription>Update the source details.</DialogDescription>
          </DialogHeader>
          <SourceFormFields form={form} setForm={setForm} errors={errors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); resetForm(); setEditingId(null) }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
