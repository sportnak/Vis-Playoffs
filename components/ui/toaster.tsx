"use client"

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-steel border-ui-border text-frost',
          title: 'text-frost',
          description: 'text-cool-gray',
          actionButton: 'bg-cyan text-carbon',
          cancelButton: 'bg-graphite text-frost',
          closeButton: 'bg-ui-hover text-frost',
        },
      }}
    />
  )
}

// Export toast function for compatibility
export { toast } from 'sonner'
