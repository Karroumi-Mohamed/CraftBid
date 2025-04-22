import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have this utility from shadcn
import { AlertCircle } from 'lucide-react'; // Icon for the indicator

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null; // Optional error message string
}

const InputWithError = React.forwardRef<HTMLInputElement, InputWithErrorProps>(
  ({ className, type, label, id, error, ...props }, ref) => {
    const hasError = !!error;


    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          {/* Error Indicator and Tooltip */}
          {hasError && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute left-0 top-0 bottom-0 -ml-3 flex items-center cursor-help z-10"
                    // Prevent click propagation if needed, e.g., e.stopPropagation()
                  >
                    <div className="h-full w-[6px] bg-red-500 rounded-l-md flex items-center justify-center">
                       {/* Optional: Add a small icon inside the bar */}
                       {/* <AlertCircle className="h-3 w-3 text-white" /> */}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-red-600 text-white border-red-700">
                  <p>{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Input Field */}
          <input
            type={type}
            id={id}
            className={cn(
              'block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent1 focus:border-accent1',
              hasError ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500 focus:border-red-500 pr-10' : '', // Add padding right if you add an icon inside input
              className
            )}
            ref={ref}
            {...props}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : undefined}
          />
           {/* Optional: Icon inside the input field */}
           {/* {hasError && (
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
               <AlertCircle className="h-5 w-5 text-red-500" />
             </div>
           )} */}
        </div>
        {/* Screen reader error message (optional but good for accessibility) */}
        {/* {hasError && (
          <p className="mt-1 text-xs text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )} */}
      </div>
    );
  }
);

InputWithError.displayName = 'InputWithError';

export { InputWithError };
