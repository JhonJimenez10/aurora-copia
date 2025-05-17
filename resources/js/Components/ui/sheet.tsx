import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "bottom" | "left" | "right"
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-white dark:bg-zinc-900 shadow-lg transition ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out data-[state=open]:fade-in",
        side === "left" && "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm slide-in-from-left",
        side === "right" && "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm slide-in-from-right",
        side === "top" && "inset-x-0 top-0 h-1/3 slide-in-from-top",
        side === "bottom" && "inset-x-0 bottom-0 h-1/3 slide-in-from-bottom",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        <X className="h-5 w-5" />
        <span className="sr-only">Cerrar</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent, SheetClose }
