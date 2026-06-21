'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

/**
 * Styled popover surface (Radix under the hood — handles focus, escape,
 * click-outside, and positioning correctly). Used for the column-header
 * filters so we don't hand-roll dropdown positioning.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent({ className, align = 'start', sideOffset = 6, ...props }, ref) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-[80] w-60 rounded-xl border border-[var(--border)] bg-surface p-3 text-[var(--text-1)] shadow-[var(--shadow-pop)] outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
