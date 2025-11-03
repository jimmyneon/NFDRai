import { createClient } from '@/lib/supabase/server'
import { FAQList } from '@/components/faqs/faq-list'
import { AddFAQButton } from '@/components/faqs/add-faq'

export default async function FAQsPage() {
  const supabase = await createClient()

  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">FAQs</h1>
          <p className="text-muted-foreground mt-1">
            Manage frequently asked questions for AI responses
          </p>
        </div>
        <AddFAQButton />
      </div>

      <FAQList faqs={faqs || []} />
    </div>
  )
}
