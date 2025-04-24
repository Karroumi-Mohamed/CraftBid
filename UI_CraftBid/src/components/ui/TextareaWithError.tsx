import React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Label } from "@/components/ui/label"; // Import Label
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Interface for the component props
// Use React.TextareaHTMLAttributes for standard textarea props
interface TextareaWithErrorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string | null; // Optional error message string
}

const TextareaWithError = React.forwardRef<HTMLTextAreaElement, TextareaWithErrorProps>(
  ({ className, label, id, error, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {/* Label */}
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Label>

        {/* Tooltip Provider */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            {/* Tooltip Trigger wraps the container */}
            <TooltipTrigger asChild disabled={!hasError}>
              {/* Relative container for positioning */}
              <div className="relative">
                {/* Error Indicator */}
                {hasError && (
                  <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 pointer-events-none">
                    <div className="h-full w-[6px] bg-destructive rounded-l-md"></div>
                  </div>
                )}

                {/* Textarea Field */}
                <Textarea
                  id={id}
                  className={cn(
                    'block w-full px-4 py-3 border rounded-md shadow-sm placeholder-gray-400 focus-visible:outline-none focus-visible:ring-1', // Use focus-visible for textarea
                    hasError
                      ? 'border-destructive ring-1 ring-destructive focus-visible:ring-destructive focus-visible:border-destructive pl-6' // Error styles + padding
                      : 'border-gray-300 focus-visible:ring-accent1 focus-visible:border-accent1', // Default styles
                    className
                  )}
                  ref={ref}
                  {...props}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${id}-error-tooltip` : undefined}
                />
              </div>
            </TooltipTrigger>

            {/* Tooltip Content */}
            {hasError && (
              <TooltipContent
                id={`${id}-error-tooltip`}
                side="top"
                align="start" // Align tooltip with the start of the trigger
                className="bg-destructive text-white border-destructive-foreground/20 px-4 py-2 text-sm max-w-xs" // Use destructive, white text, adjust padding/size
              >
                <p>{error}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);

TextareaWithError.displayName = 'TextareaWithError';

export { TextareaWithError };
