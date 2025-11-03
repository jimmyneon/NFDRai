'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

type FAQ = {
  id: string
  question: string
  answer: string
}

export function EditFAQDialog({
  faq,
  open,
  onClose,
}: {
  faq: FAQ
  open: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    question: faq.question,
    answer: faq.answer,
  })
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
    })
  }, [faq])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('faqs')
      .update({
        question: formData.question,
        answer: formData.answer,
      })
      .eq('id', faq.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update FAQ',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      })
      onClose()
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-question">Question</Label>
            <Input
              id="edit-question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-answer">Answer</Label>
            <Textarea
              id="edit-answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              rows={5}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update FAQ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
