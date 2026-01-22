"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBrand, BrandWithConfig } from "@/contexts/brand-context";

interface BrandSwitcherProps {
  onAddNew?: () => void;
}

export function BrandSwitcher({ onAddNew }: BrandSwitcherProps) {
  const { brands, selectedBrand, isLoading, error, selectBrand, refreshBrands } = useBrand();
  const [open, setOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleSelect = (brand: BrandWithConfig) => {
    selectBrand(brand.id);
    setOpen(false);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await refreshBrands();
    setIsRetrying(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[hsl(200,15%,10%)] border border-[hsl(200,15%,18%)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && brands.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-red-500/10 border border-red-500/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400 truncate">Failed to load</p>
          <p className="text-xs text-red-400/70 truncate">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
          title="Retry"
        >
          <RefreshCw className={cn("h-4 w-4 text-red-400", isRetrying && "animate-spin")} />
        </button>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <button
        onClick={onAddNew}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 w-full bg-[hsl(200,15%,10%)] border border-dashed border-[hsl(200,15%,25%)] hover:border-primary/50 hover:bg-[hsl(200,15%,12%)] transition-all group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Plus className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">Add Client</p>
          <p className="text-xs text-[hsl(200,10%,55%)] truncate">Get started</p>
        </div>
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 h-auto w-full bg-[hsl(200,15%,10%)] border border-[hsl(200,15%,18%)] hover:bg-[hsl(200,15%,12%)] hover:border-[hsl(200,15%,25%)] justify-start"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">
              {selectedBrand?.name || "Select Client"}
            </p>
            <p className="text-xs text-[hsl(200,10%,55%)] truncate">
              {selectedBrand?.description || `${brands.length} client${brands.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-[hsl(200,10%,55%)] shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup heading="Clients">
              {brands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.name}
                  onSelect={() => handleSelect(brand)}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 shrink-0">
                    <Building2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="flex-1 truncate">{brand.name}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      selectedBrand?.id === brand.id
                        ? "opacity-100 text-primary"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddNew?.();
                }}
                className="flex items-center gap-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-muted shrink-0">
                  <Plus className="h-3 w-3" />
                </div>
                <span>Add New Client</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
