import { DashboardNav } from '@/components/dashboard/nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="md:pl-64 pt-16 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
