import { createClient } from '@/lib/supabase/server'
import { PricingTable } from '@/components/pricing/pricing-table'
import { UploadPricingButton } from '@/components/pricing/upload-pricing'
import { AddPriceButton } from '@/components/pricing/add-price'

export default async function PricingPage() {
  const supabase = await createClient()

  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .order('device', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground mt-1">
            Manage repair prices and turnaround times
          </p>
        </div>
        <div className="flex gap-2">
          <AddPriceButton />
          <UploadPricingButton />
        </div>
      </div>

      <PricingTable prices={prices || []} />
    </div>
  )
}
