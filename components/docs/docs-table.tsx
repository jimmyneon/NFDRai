'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'
import { EditDocDialog } from './edit-doc-dialog'
import { ViewDocDialog } from './view-doc-dialog'
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
  created_at: string
  updated_at: string
}

export function DocsTable({ docs }: { docs: Doc[] }) {
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Doc | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    const { error } = await supabase.from('docs').delete().eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: 'Document deleted successfully',
    })

    router.refresh()
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      policies: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      pricing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      legal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    }
    return colors[category] || colors.general
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No documents yet. Add your first document to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{doc.title}</h3>
                <Badge className={getCategoryColor(doc.category)}>{doc.category}</Badge>
                {!doc.active && <Badge variant="outline">Inactive</Badge>}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {doc.content}
              </p>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Version {doc.version} • Updated {new Date(doc.updated_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDoc(doc)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDoc(doc)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editingDoc && (
        <EditDocDialog
          doc={editingDoc}
          open={!!editingDoc}
          onClose={() => setEditingDoc(null)}
        />
      )}

      {viewingDoc && (
        <ViewDocDialog
          doc={viewingDoc}
          open={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  )
}
