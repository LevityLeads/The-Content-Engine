"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StylePicker, SelectedStyle } from "./style-picker";

interface StylePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandColors: {
    primary_color?: string;
    accent_color?: string;
  };
  brandName: string;
  onStyleSelected: (style: SelectedStyle) => void;
}

export function StylePickerDialog({
  open,
  onOpenChange,
  brandColors,
  brandName,
  onStyleSelected,
}: StylePickerDialogProps) {
  // Key to force remount when dialog opens (triggers fresh generation)
  const [mountKey, setMountKey] = useState(0);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Increment key to force fresh generation when opening
      setMountKey((prev) => prev + 1);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Default Visual Style</DialogTitle>
          <DialogDescription>
            Select the visual style that will be automatically applied to all new content for {brandName}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <StylePicker
            key={mountKey}
            brandColors={brandColors}
            brandName={brandName}
            onStyleSelected={onStyleSelected}
            onSkip={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
