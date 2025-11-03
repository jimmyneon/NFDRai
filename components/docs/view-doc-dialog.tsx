'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Doc = {
  id: string
  title: string
  content: string
  category: string
  tags: string[] | null
  active: boolean
  version: number
  created_at: string
  updated_at: string
}

export function ViewDocDialog({
  doc,
  open,
  onClose,
}: {
  doc: Doc
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {doc.title}
            <Badge variant="outline">{doc.category}</Badge>
            {!doc.active && <Badge variant="secondary">Inactive</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {doc.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-xl">
              {doc.content}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <div>Version {doc.version}</div>
            <div>
              Created {new Date(doc.created_at).toLocaleDateString()} • Updated{' '}
              {new Date(doc.updated_at).toLocaleDateString()}
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
