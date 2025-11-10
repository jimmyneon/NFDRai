'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PricingModeToggleProps {
  businessInfo: {
    id: string
    use_exact_prices?: boolean
  }
}

export function PricingModeToggle({ businessInfo }: PricingModeToggleProps) {
  const [useExactPrices, setUseExactPrices] = useState(businessInfo?.use_exact_prices || false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setUseExactPrices(checked)

    const { error } = await supabase
      .from('business_info')
      .update({ use_exact_prices: checked })
      .eq('id', businessInfo.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update pricing mode',
        variant: 'destructive',
      })
      setUseExactPrices(!checked) // Revert on error
    } else {
      toast({
        title: 'Success',
        description: `AI will now use ${checked ? 'exact database prices' : 'price ranges'}`,
      })
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Pricing Strategy</CardTitle>
        <CardDescription>
          Choose how AI Steve quotes prices to customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="pricing-mode" className="text-base">
              Use Exact Database Prices
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, AI quotes exact prices from your database. 
              When disabled, AI uses price ranges with &quot;John will confirm&quot; disclaimer.
            </p>
          </div>
          <Switch
            id="pricing-mode"
            checked={useExactPrices}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {useExactPrices ? (
              <>
                <strong>Exact Prices Mode:</strong> AI will quote specific prices from your database 
                (e.g., &quot;iPhone 12 screen repair is £89&quot;). Make sure your database prices are accurate!
              </>
            ) : (
              <>
                <strong>Price Ranges Mode:</strong> AI gives rough estimates 
                (e.g., &quot;iPhone screen repairs are typically £80-120&quot;) and always says 
                &quot;John will confirm the exact price.&quot; Safer while updating prices.
              </>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
