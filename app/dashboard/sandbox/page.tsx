import { SandboxConsole } from '@/components/sandbox/sandbox-console'

export default function SandboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Sandbox</h1>
        <p className="text-muted-foreground mt-1">
          Test AI responses before going live
        </p>
      </div>

      <SandboxConsole />
    </div>
  )
}
