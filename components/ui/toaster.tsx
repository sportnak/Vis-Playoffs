"use client"

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast: 'bg-steel border-ui-border text-frost',
          title: 'text-frost',
          description: 'text-cool-gray',
          actionButton: 'bg-cyan text-carbon',
          cancelButton: 'bg-graphite text-frost',
          closeButton: 'bg-ui-hover text-frost',
          success: 'bg-green-900/20 border-green-500/30 text-green-100',
          error: 'bg-red-900/20 border-red-500/30 text-red-100',
          warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
          info: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
        },
      }}
    />
  )
}

// Export toast function for compatibility
export { toast } from 'sonner'
