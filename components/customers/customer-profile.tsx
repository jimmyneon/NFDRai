'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Edit, 
  Save,
  X,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

type Customer = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

type Conversation = {
  id: string
  channel: string
  status: string
  created_at: string
  messages: { count: number }[]
}

export function CustomerProfile({
  customer,
  conversations,
  open,
  onClose,
}: {
  customer: Customer
  conversations: Conversation[]
  open: boolean
  onClose: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name || null,
          phone: formData.phone || null,
          email: formData.email || null,
        })
        .eq('id', customer.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Customer profile updated',
      })

      setIsEditing(false)
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const totalMessages = conversations.reduce(
    (sum, conv) => sum + (conv.messages?.length || 0),
    0
  )

  const activeConversations = conversations.filter(
    (conv) => conv.status !== 'archived'
  ).length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Profile
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: customer.name || '',
                      phone: customer.phone || '',
                      email: customer.email || '',
                    })
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Customer name"
                  />
                ) : (
                  <p className="text-lg font-medium">
                    {customer.name || 'Unknown'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="font-mono">{customer.phone || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="customer@example.com"
                  />
                ) : (
                  <p>{customer.email || 'N/A'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {conversations.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Conversations
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {activeConversations}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalMessages}
                </div>
                <div className="text-sm text-muted-foreground">
                  Messages
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Conversation History */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversation History
            </h3>

            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <Card key={conv.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{conv.channel}</Badge>
                          <Badge
                            variant={
                              conv.status === 'auto'
                                ? 'default'
                                : conv.status === 'manual'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {conv.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(conv.created_at)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {conv.messages?.length || 0} messages
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Customer since: {new Date(customer.created_at).toLocaleDateString()}</div>
            <div>Last updated: {formatRelativeTime(customer.updated_at)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
