import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { Button } from "#/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
};

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-6 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none">
          <div className="grid gap-2">
            <AlertDialogPrimitive.Title className="text-lg font-semibold">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button variant={confirmVariant} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { ConfirmDialog };
