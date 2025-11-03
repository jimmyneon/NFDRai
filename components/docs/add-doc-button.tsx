'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddDocDialog } from './add-doc-dialog'

export function AddDocButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="rounded-2xl">
        <Plus className="w-4 h-4 mr-2" />
        Add Document
      </Button>
      <AddDocDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
