import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputWithAddonProps extends React.InputHTMLAttributes<HTMLInputElement> {
    startElement?: React.ReactNode;
    endElement?: React.ReactNode;
}

const InputWithAddon = React.forwardRef<HTMLInputElement, InputWithAddonProps>(
    ({ className, startElement, endElement, ...props }, ref) => {
        return (
            <div className="relative flex items-center">
                {startElement && (
                    <div className="absolute left-3 pointer-events-none flex items-center">{startElement}</div>
                )}
                <input
                    className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        startElement && 'pl-10',
                        endElement && 'pr-10',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {endElement && <div className="absolute right-3 flex items-center">{endElement}</div>}
            </div>
        );
    }
);
InputWithAddon.displayName = 'InputWithAddon';

export { InputWithAddon };
