"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBrand } from "@/contexts/brand-context";

interface DeletionPreview {
  brand: {
    id: string;
    name: string;
  };
  counts: {
    content: number;
    ideas: number;
    inputs: number;
    images: number;
    socialAccounts: number;
  };
  totalItems: number;
}

interface BrandDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  brandName: string;
}

type Step = "loading" | "confirm" | "type-delete" | "deleting" | "error";

export function BrandDeletionDialog({
  open,
  onOpenChange,
  brandId,
  brandName,
}: BrandDeletionDialogProps) {
  const { deleteBrand } = useBrand();
  const [step, setStep] = useState<Step>("loading");
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch deletion preview when dialog opens
  useEffect(() => {
    if (open && brandId) {
      setStep("loading");
      setConfirmText("");
      setError(null);

      fetch(`/api/brands/delete-preview?id=${brandId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPreview(data);
            setStep("confirm");
          } else {
            setError(data.error || "Failed to load deletion preview");
            setStep("error");
          }
        })
        .catch(() => {
          setError("Network error. Please try again.");
          setStep("error");
        });
    }
  }, [open, brandId]);

  const handleFirstConfirm = () => {
    setStep("type-delete");
  };

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      return;
    }

    setStep("deleting");
    const result = await deleteBrand(brandId);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to delete client");
      setStep("error");
    }
  };

  const handleClose = () => {
    if (step !== "deleting") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Delete Client
          </DialogTitle>
          <DialogDescription>
            {step === "loading" && "Loading deletion preview..."}
            {step === "confirm" && "Review what will be permanently deleted."}
            {step === "type-delete" && "Type \"delete\" to confirm this action."}
            {step === "deleting" && "Deleting client and all associated data..."}
            {step === "error" && "An error occurred."}
          </DialogDescription>
        </DialogHeader>

        {/* Loading */}
        {step === "loading" && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {/* Step 1: Confirm - Show what will be deleted */}
        {step === "confirm" && preview && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-400 mb-3">
                You are about to permanently delete <span className="font-bold">{brandName}</span> and all associated data:
              </p>
              <ul className="space-y-2 text-sm">
                {preview.counts.content > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Content pieces</span>
                    <span className="font-mono text-red-400">{preview.counts.content}</span>
                  </li>
                )}
                {preview.counts.ideas > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Ideas</span>
                    <span className="font-mono text-red-400">{preview.counts.ideas}</span>
                  </li>
                )}
                {preview.counts.inputs > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Inputs</span>
                    <span className="font-mono text-red-400">{preview.counts.inputs}</span>
                  </li>
                )}
                {preview.counts.images > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Generated images</span>
                    <span className="font-mono text-red-400">{preview.counts.images}</span>
                  </li>
                )}
                {preview.counts.socialAccounts > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Connected accounts</span>
                    <span className="font-mono text-red-400">{preview.counts.socialAccounts}</span>
                  </li>
                )}
                {preview.totalItems === 0 && (
                  <li className="text-muted-foreground">No associated data found</li>
                )}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All data will be permanently removed.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleFirstConfirm}>
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Type "delete" to confirm */}
        {step === "type-delete" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">
                To confirm deletion of <span className="font-bold">{brandName}</span>, please type <span className="font-mono font-bold">delete</span> below:
              </p>
            </div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="font-mono"
              autoFocus
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep("confirm")}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText.toLowerCase() !== "delete"}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Deleting */}
        {step === "deleting" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500" />
            <p className="text-sm text-muted-foreground">
              Deleting {brandName} and all associated data...
            </p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
