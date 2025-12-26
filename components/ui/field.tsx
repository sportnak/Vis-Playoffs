import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { InfoIcon } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

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
          <div className="flex items-center gap-1.5">
            <Label htmlFor={id} className="text-cool-gray font-roboto-mono tracking-button text-[10px]">
              {label.toString().toUpperCase()}
              {required && <span className="text-semantic-danger ml-1">*</span>}
              {!required && optionalText && <span className="text-cool-gray ml-1 tracking-button text-[10px]">({optionalText.toString().toUpperCase()})</span>}
            </Label>
            {helperText && !errorMessage && (
              <Tooltip content={helperText}>
                <InfoIcon className="w-3.5 h-3.5 mt-[2px] text-cool-gray hover:text-gray-600" />
              </Tooltip>
            )}
          </div>
        )}
        {children}
        {errorMessage && <p className="text-sm text-semantic-danger">{errorMessage}</p>}
      </div>
    )
  }
)
Field.displayName = "Field"
