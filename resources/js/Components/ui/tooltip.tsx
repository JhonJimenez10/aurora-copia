import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import React from 'react';
import cn from 'classnames';

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    className={cn("rounded bg-black text-white p-2 text-sm", className)}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
