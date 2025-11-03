'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { EditFAQDialog } from './edit-faq-dialog'

type FAQ = {
  id: string
  question: string
  answer: string
  created_at: string
}

export function FAQList({ faqs }: { faqs: FAQ[] }) {
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'FAQ deleted',
      })
      window.location.reload()
    }
  }

  if (faqs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No FAQs added yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id} className="tile-button">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFAQ(faq)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedFAQ && (
        <EditFAQDialog
          faq={selectedFAQ}
          open={!!selectedFAQ}
          onClose={() => setSelectedFAQ(null)}
        />
      )}
    </>
  )
}
