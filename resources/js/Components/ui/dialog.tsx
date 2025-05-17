// resources/js/Components/ui/dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import cn from 'classnames';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn(
      "fixed top-1/2 left-1/2 max-w-2xl w-full p-6 bg-[#1e1e2f] text-white border border-purple-700 rounded-xl shadow-xl transform -translate-x-1/2 -translate-y-1/2",
      className
    )}
    {...props}
  />
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4", className)} {...props} />
);

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-4", className)} {...props} />
);
