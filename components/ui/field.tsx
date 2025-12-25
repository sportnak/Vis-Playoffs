import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FieldProps {
  id?: string
  label?: React.ReactNode
  error?: string
  errorText?: string
  helperText?: React.ReactNode
  required?: boolean
  optionalText?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ id, label, error, errorText, helperText, required, optionalText, children, className }, ref) => {
    const errorMessage = error || errorText
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={id} className="text-frost">
            {label}
            {required && <span className="text-semantic-danger ml-1">*</span>}
            {!required && optionalText && <span className="text-cool-gray ml-1 text-xs">({optionalText})</span>}
          </Label>
        )}
        {children}
        {errorMessage && <p className="text-sm text-semantic-danger">{errorMessage}</p>}
        {helperText && !errorMessage && <p className="text-sm text-cool-gray">{helperText}</p>}
      </div>
    )
  }
)
Field.displayName = "Field"
