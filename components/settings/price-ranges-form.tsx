'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, Save } from 'lucide-react'

interface PriceRange {
  category: string
  min: number
  max: number
  description: string
}

interface PriceRangesFormProps {
  businessInfo: {
    id: string
    price_ranges: PriceRange[]
  }
}

export function PriceRangesForm({ businessInfo }: PriceRangesFormProps) {
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>(
    businessInfo.price_ranges || []
  )
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const addPriceRange = () => {
    setPriceRanges([
      ...priceRanges,
      {
        category: '',
        min: 0,
        max: 0,
        description: ''
      }
    ])
  }

  const removePriceRange = (index: number) => {
    setPriceRanges(priceRanges.filter((_, i) => i !== index))
  }

  const updatePriceRange = (index: number, field: keyof PriceRange, value: string | number) => {
    const updated = [...priceRanges]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setPriceRanges(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('business_info')
      .update({ price_ranges: priceRanges })
      .eq('id', businessInfo.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update price ranges',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Price ranges updated successfully',
      })
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>AI Price Ranges</CardTitle>
          <CardDescription>
            Manage the price ranges that AI Steve uses when giving estimates. 
            AI will always say &quot;John will confirm the exact price.&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {priceRanges.map((range, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Price Range {index + 1}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePriceRange(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Input
                      id={`category-${index}`}
                      value={range.category}
                      onChange={(e) => updatePriceRange(index, 'category', e.target.value)}
                      placeholder="e.g., iPhone Screen Repairs"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={range.description}
                      onChange={(e) => updatePriceRange(index, 'description', e.target.value)}
                      placeholder="e.g., depending on model"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`min-${index}`}>Min Price (£)</Label>
                    <Input
                      id={`min-${index}`}
                      type="number"
                      value={range.min}
                      onChange={(e) => updatePriceRange(index, 'min', parseInt(e.target.value) || 0)}
                      placeholder="80"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`max-${index}`}>Max Price (£)</Label>
                    <Input
                      id={`max-${index}`}
                      type="number"
                      value={range.max}
                      onChange={(e) => updatePriceRange(index, 'max', parseInt(e.target.value) || 0)}
                      placeholder="120"
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  <strong>AI will say:</strong> &quot;For {range.category?.toLowerCase() || 'this repair'}, 
                  it&apos;s typically around £{range.min}-{range.max} {range.description}. 
                  John will confirm the exact price when he assesses it.&quot;
                </div>
              </div>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addPriceRange}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Price Range
          </Button>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Price Ranges'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
