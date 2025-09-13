import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        soft: "bg-gradient-to-r from-slate-50/90 to-blue-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-700 shadow-lg hover:shadow-xl hover:from-blue-50/90 hover:to-indigo-50/80 hover:border-blue-200/70 hover:text-slate-800 transition-all duration-300 hover:scale-[1.02]",
        modern: "bg-gradient-to-r from-violet-100/80 to-purple-100/60 border border-violet-200/50 text-violet-900 hover:from-violet-200/90 hover:to-purple-200/70 hover:border-violet-300/60 hover:text-violet-950 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
        elegant: "bg-gradient-to-r from-gray-100/70 to-slate-100/50 backdrop-blur-md border border-gray-200/40 text-gray-700 hover:from-gray-200/80 hover:to-slate-200/60 hover:border-gray-300/50 hover:text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
