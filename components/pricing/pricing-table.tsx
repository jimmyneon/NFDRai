'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { EditPriceDialog } from './edit-price-dialog'

type Price = {
  id: string
  device: string
  repair_type: string
  cost: number
  turnaround: string
  expiry: string | null
  created_at: string
}

export function PricingTable({ prices }: { prices: Price[] }) {
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price?')) return

    const { error } = await supabase
      .from('prices')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete price',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Price deleted',
      })
      window.location.reload()
    }
  }

  const isExpired = (expiry: string | null) => {
    if (!expiry) return false
    return new Date(expiry) < new Date()
  }

  if (prices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No prices added yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((price) => (
          <Card key={price.id} className="tile-button">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{price.device}</h3>
                  <p className="text-sm text-muted-foreground">{price.repair_type}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">£{price.cost}</span>
                  <Badge variant="outline">{price.turnaround}</Badge>
                </div>

                {price.expiry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className={isExpired(price.expiry) ? 'text-red-500' : 'text-muted-foreground'}>
                      {isExpired(price.expiry) ? 'Expired' : 'Expires'}: {formatDate(price.expiry)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedPrice(price)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(price.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPrice && (
        <EditPriceDialog
          price={selectedPrice}
          open={!!selectedPrice}
          onClose={() => setSelectedPrice(null)}
        />
      )}
    </>
  )
}
