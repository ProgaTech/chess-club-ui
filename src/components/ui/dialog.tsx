import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

// Base UI handles the portal, focus trap, scroll lock, Escape and outside presses.
const Dialog = DialogPrimitive.Root
const DialogClose = DialogPrimitive.Close

type DialogContentProps = Omit<DialogPrimitive.Popup.Props, "className"> & {
  className?: string
  backdropClassName?: string
  viewportClassName?: string
}

function DialogContent({ className, backdropClassName, viewportClassName, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className={cn("fixed inset-0 z-50 bg-foreground/40", backdropClassName)}
      />
      <DialogPrimitive.Viewport
        data-slot="dialog-viewport"
        className={cn("fixed inset-0 z-50 grid place-items-center p-4", viewportClassName)}
      >
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn("w-full rounded-2xl border border-border bg-background p-6 text-foreground outline-none", className)}
          {...props}
        />
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

type DialogTitleProps = Omit<DialogPrimitive.Title.Props, "className"> & {
  className?: string
}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("font-bold tracking-normal", className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogTitle }
