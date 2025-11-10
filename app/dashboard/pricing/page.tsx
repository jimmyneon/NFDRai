import { createClient } from '@/lib/supabase/server'
import { PricingTable } from '@/components/pricing/pricing-table'
import { UploadPricingButton } from '@/components/pricing/upload-pricing'
import { AddPriceButton } from '@/components/pricing/add-price'
import { PricingModeToggle } from '@/components/pricing/pricing-mode-toggle'
import { PriceRangesForm } from '@/components/settings/price-ranges-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function PricingPage() {
  const supabase = await createClient()

  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .order('device', { ascending: true })

  const { data: businessInfo } = await supabase
    .from('business_info')
    .select('*')
    .single()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground mt-1">
            Manage repair prices and AI pricing strategy
          </p>
        </div>
      </div>

      <PricingModeToggle businessInfo={businessInfo} />

      <Tabs defaultValue="ranges" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranges">Price Ranges (AI Estimates)</TabsTrigger>
          <TabsTrigger value="exact">Exact Prices (Database)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ranges" className="space-y-4">
          <PriceRangesForm businessInfo={businessInfo} />
        </TabsContent>
        
        <TabsContent value="exact" className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <AddPriceButton />
            <UploadPricingButton />
          </div>
          <PricingTable prices={prices || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
