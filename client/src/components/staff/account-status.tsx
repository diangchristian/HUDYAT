import { CheckCircle2, CircleSlash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Text and icon, so status never relies on color alone. */
export function StatusBadge({
  isActive,
  inactiveLabel = "Deactivated",
}: {
  isActive: boolean;
  inactiveLabel?: string;
}) {
  return isActive ? (
    <Badge className="bg-emerald-100 text-emerald-800">
      <CheckCircle2 aria-hidden="true" />
      Active
    </Badge>
  ) : (
    <Badge variant="secondary">
      <CircleSlash aria-hidden="true" />
      {inactiveLabel}
    </Badge>
  );
}

/** Confirmation for deactivating or reactivating any account. */
export function AccountStatusDialog({
  account,
  isPending,
  error,
  onCancel,
  onConfirm,
}: {
  account: { fullName: string; isActive: boolean } | null;
  isPending: boolean;
  error: Error | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const deactivating = account?.isActive ?? false;

  return (
    <Dialog
      open={Boolean(account)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="font-staff">
        <DialogHeader>
          <DialogTitle>
            {deactivating ? "Deactivate" : "Reactivate"} {account?.fullName}?
          </DialogTitle>
          <DialogDescription>
            {deactivating
              ? "They will be signed out and won't be able to log in. Their history is kept, and the account can be reactivated at any time."
              : "They will be able to log in again, with their history intact."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-sm font-bold text-red-600">
            {error.message}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancel
          </Button>
          {deactivating ? (
            <Button
              variant="destructive"
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          ) : (
            <Button
              className="rounded-full"
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? "Reactivating..." : "Reactivate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
