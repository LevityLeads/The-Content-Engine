"use client";

import { cn } from "@/lib/utils";

interface StrictnessSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function StrictnessSlider({ value, onChange }: StrictnessSliderProps) {
  const percentage = Math.round(value * 100);

  const getLabel = () => {
    if (value < 0.3) return "Flexible";
    if (value < 0.6) return "Balanced";
    if (value < 0.8) return "Consistent";
    return "Strict";
  };

  const getDescription = () => {
    if (value < 0.3) return "AI has creative freedom while loosely following brand guidelines";
    if (value < 0.6) return "AI balances brand consistency with creative variety";
    if (value < 0.8) return "AI closely follows brand voice and visual style";
    return "AI strictly adheres to brand guidelines with minimal variation";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Brand Strictness</label>
        <span className="text-sm font-semibold text-primary">
          {percentage}% - {getLabel()}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        {/* Scale markers */}
        <div className="flex justify-between mt-1">
          {["Flexible", "Balanced", "Consistent", "Strict"].map((label, i) => (
            <span
              key={label}
              className={cn(
                "text-xs",
                Math.floor(value * 3) === i
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{getDescription()}</p>
    </div>
  );
}
