import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-400"
)

const thumbVariants = cva(
  "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
)

export const Switch = ({ className, ...props }: SwitchPrimitive.SwitchProps) => {
  return (
    <SwitchPrimitive.Root className={cn(switchVariants(), className)} {...props}>
      <SwitchPrimitive.Thumb className={thumbVariants()} />
    </SwitchPrimitive.Root>
  )
}
