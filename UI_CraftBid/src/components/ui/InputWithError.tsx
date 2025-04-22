import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
}

const InputWithError = React.forwardRef<HTMLInputElement, InputWithErrorProps>(
  ({ className, type, label, id, error, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild disabled={!hasError}>
              <div className="relative">
                {hasError && (
                  <div className="absolute left-0 top-0 bottom-0 flex items-center z-10 pointer-events-none">
                    <div className="h-full w-[6px] bg-destructive rounded-l-md"></div>
                  </div>
                )}
                <input
                  type={type}
                  id={id}
                  className={cn(
                    'block w-full px-4 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1',
                    hasError
                      ? 'border-destructive ring-1 ring-destructive focus:ring-destructive focus:border-destructive pl-6'
                      : 'border-gray-300 focus:ring-accent1 focus:border-accent1',
                    className
                  )}
                  ref={ref}
                  {...props}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${id}-error-tooltip` : undefined}
                />
              </div>
            </TooltipTrigger>
            {hasError && (
              <TooltipContent
                id={`${id}-error-tooltip`}
                side="top"
                className="bg-destructive text-white border-destructive-foreground/20 px-4 py-2 text-sm"
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

InputWithError.displayName = 'InputWithError';

export { InputWithError };
