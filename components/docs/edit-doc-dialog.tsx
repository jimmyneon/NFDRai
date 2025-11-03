'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

type Doc = {
  id: string
  title: string
  content: string
  category: string
  tags: string[] | null
  active: boolean
  version: number
}

export function EditDocDialog({
  doc,
  open,
  onClose,
}: {
  doc: Doc
  open: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: doc.title,
    content: doc.content,
    category: doc.category,
    tags: doc.tags?.join(', ') || '',
    active: doc.active,
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const { error } = await supabase
      .from('docs')
      .update({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsArray.length > 0 ? tagsArray : null,
        active: formData.active,
        version: doc.version + 1,
      })
      .eq('id', doc.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Success',
      description: 'Document updated successfully',
    })

    router.refresh()
    onClose()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="policies">Policies</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active (visible to AI)</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Current version: {doc.version} → Will become version {doc.version + 1}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
