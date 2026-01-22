"use client";

import { useState } from "react";
import {
  Globe,
  Loader2,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Palette,
  Volume2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBrand, VoiceConfig, VisualConfig, BrandDefaultStyle, ApprovedStyle } from "@/contexts/brand-context";
import { StrictnessSlider } from "./strictness-slider";
import { StylePicker, SelectedStylesResult } from "./style-picker";

interface BrandAnalysis {
  voice: {
    tone_keywords: string[];
    messaging_themes: string[];
    writing_style: string;
    words_to_avoid: string[];
  };
  visual: {
    color_palette: string[];
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    image_style: string;
    sample_images: string[];
    fonts?: {
      heading: string;
      body: string;
      detected_fonts: string[];
    };
  };
  summary: string;
}

interface BrandCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "input" | "analyzing" | "preview" | "style-selection" | "creating";

export function BrandCreationDialog({ open, onOpenChange }: BrandCreationDialogProps) {
  const { createBrand } = useBrand();
  const [step, setStep] = useState<Step>("input");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BrandAnalysis | null>(null);
  const [strictness, setStrictness] = useState(0.7);

  // Editable state for preview
  const [editedToneKeywords, setEditedToneKeywords] = useState<string[]>([]);
  const [editedPrimaryColor, setEditedPrimaryColor] = useState("");
  const [editedAccentColor, setEditedAccentColor] = useState("");
  const [editedHeadingFont, setEditedHeadingFont] = useState("");
  const [editedBodyFont, setEditedBodyFont] = useState("");

  // Selected styles from style picker (style palette)
  const [selectedStylesResult, setSelectedStylesResult] = useState<SelectedStylesResult | null>(null);

  const resetDialog = () => {
    setStep("input");
    setName("");
    setUrl("");
    setDescription("");
    setError(null);
    setAnalysis(null);
    setStrictness(0.7);
    setEditedToneKeywords([]);
    setEditedPrimaryColor("");
    setEditedAccentColor("");
    setEditedHeadingFont("");
    setEditedBodyFont("");
    setSelectedStylesResult(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleAnalyze = async () => {
    if (!name.trim()) {
      setError("Please enter a client name");
      return;
    }

    setStep("analyzing");
    setError(null);

    try {
      // If URL provided, analyze it
      if (url.trim()) {
        const res = await fetch("/api/brands/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await res.json();

        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          setEditedToneKeywords(data.analysis.voice.tone_keywords || []);
          setEditedPrimaryColor(data.analysis.visual.primary_color || "#1a1a1a");
          setEditedAccentColor(data.analysis.visual.accent_color || "#3b82f6");
          setEditedHeadingFont(data.analysis.visual.fonts?.heading || "");
          setEditedBodyFont(data.analysis.visual.fonts?.body || "");
          setStep("preview");
        } else {
          setError(data.error || "Failed to analyze website");
          setStep("input");
        }
      } else {
        // No URL - create with defaults
        setAnalysis({
          voice: {
            tone_keywords: ["professional", "friendly"],
            messaging_themes: [],
            writing_style: "Clear and engaging",
            words_to_avoid: [],
          },
          visual: {
            color_palette: ["#1a1a1a", "#ffffff", "#3b82f6"],
            primary_color: "#1a1a1a",
            secondary_color: "#ffffff",
            accent_color: "#3b82f6",
            image_style: "minimalist",
            sample_images: [],
          },
          summary: "Default brand configuration - customize as needed.",
        });
        setEditedToneKeywords(["professional", "friendly"]);
        setEditedPrimaryColor("#1a1a1a");
        setEditedAccentColor("#3b82f6");
        setStep("preview");
      }
    } catch (err) {
      console.error("Error analyzing website:", err);
      setError("Network error. Please try again.");
      setStep("input");
    }
  };

  const handleCreate = async (stylesOverride?: SelectedStylesResult | null) => {
    if (!analysis) return;

    setStep("creating");
    setError(null);

    // Use override if provided, otherwise use state
    const stylesToUse = stylesOverride !== undefined ? stylesOverride : selectedStylesResult;

    const voiceConfig: VoiceConfig = {
      tone_keywords: editedToneKeywords,
      words_to_avoid: analysis.voice.words_to_avoid,
      strictness,
      source_url: url.trim() || undefined,
      extracted_voice: {
        tone_description: analysis.voice.writing_style,
        messaging_themes: analysis.voice.messaging_themes,
        writing_style: analysis.voice.writing_style,
      },
    };

    // Build default style from the first selected style
    let defaultStyle: BrandDefaultStyle | undefined;
    let approvedStyles: ApprovedStyle[] | undefined;

    if (stylesToUse && stylesToUse.styles.length > 0) {
      const primary = stylesToUse.styles[0];
      defaultStyle = {
        visualStyle: primary.visualStyle,
        textStyle: primary.textStyle,
        textColor: primary.textColor,
        designSystem: primary.designSystem,
        selectedAt: new Date().toISOString(),
        sampleImageUsed: primary.sampleImage,
      };

      // Build approved styles palette from all selected styles
      approvedStyles = stylesToUse.styles.map((style) => ({
        id: style.id,
        visualStyle: style.visualStyle,
        textStyle: style.textStyle,
        textColor: style.textColor,
        name: style.name,
        sampleImage: style.sampleImage,
        designSystem: style.designSystem,
        addedAt: new Date().toISOString(),
      }));
    }

    const visualConfig: VisualConfig = {
      primary_color: editedPrimaryColor,
      secondary_color: analysis.visual.secondary_color,
      accent_color: editedAccentColor,
      image_style: analysis.visual.image_style,
      color_palette: analysis.visual.color_palette,
      extracted_images: analysis.visual.sample_images,
      // Include fonts (user-edited or detected) for use in content generation
      fonts: (editedHeadingFont || editedBodyFont) ? {
        heading: editedHeadingFont,
        body: editedBodyFont,
      } : undefined,
      // Include default style selected during onboarding
      defaultStyle,
      // Include full style palette
      approvedStyles,
    };

    const result = await createBrand({
      name: name.trim(),
      description: description.trim() || analysis.summary,
      voice_config: voiceConfig,
      visual_config: visualConfig,
    });

    if (result) {
      handleClose();
    } else {
      setError("Failed to create client. Please try again.");
      setStep("style-selection");
    }
  };

  const removeKeyword = (keyword: string) => {
    setEditedToneKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !editedToneKeywords.includes(keyword)) {
      setEditedToneKeywords((prev) => [...prev, keyword]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "input" && "Add New Client"}
            {step === "analyzing" && "Analyzing Brand..."}
            {step === "preview" && "Review Style Guide"}
            {step === "style-selection" && "Choose Your Visual Style"}
            {step === "creating" && "Creating Client..."}
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Enter client details and optional website URL for automatic brand analysis."}
            {step === "analyzing" && "Extracting brand voice, colors, and visual style from the website."}
            {step === "preview" && "Review and customize the extracted brand guidelines."}
            {step === "style-selection" && "Pick the visual style that best represents this brand."}
            {step === "creating" && "Setting up the client workspace..."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input */}
        {step === "input" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name *</label>
              <Input
                placeholder="e.g., Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll analyze this website to extract brand voice, colors, and visual style.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="Brief description of the client or their business..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze}>
                <Sparkles className="mr-2 h-4 w-4" />
                {url.trim() ? "Analyze & Continue" : "Continue"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === "analyzing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Analyzing {url || "brand"}...</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" />
                  Fetching website content
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting brand elements
                </p>
                <p className="flex items-center justify-center gap-2 opacity-50">
                  Analyzing voice and tone
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview Style Board */}
        {step === "preview" && analysis && (
          <div className="space-y-6 py-4">
            {/* Brand Name */}
            <div className="text-center pb-4 border-b">
              <h3 className="text-xl font-semibold">{name}</h3>
              {url && (
                <p className="text-sm text-muted-foreground">{url}</p>
              )}
            </div>

            {/* Color Palette */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Color Palette</span>
              </div>
              <div className="flex gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Primary</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedPrimaryColor}
                      onChange={(e) => setEditedPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={editedPrimaryColor}
                      onChange={(e) => setEditedPrimaryColor(e.target.value)}
                      className="w-24 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedAccentColor}
                      onChange={(e) => setEditedAccentColor(e.target.value)}
                      className="h-10 w-14 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={editedAccentColor}
                      onChange={(e) => setEditedAccentColor(e.target.value)}
                      className="w-24 text-xs font-mono"
                    />
                  </div>
                </div>
                {analysis.visual.color_palette.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Extracted</label>
                    <div className="flex gap-1 pt-1">
                      {analysis.visual.color_palette.slice(0, 5).map((color, i) => (
                        <button
                          key={i}
                          className="h-8 w-8 rounded border hover:ring-2 ring-primary transition-all"
                          style={{ backgroundColor: color }}
                          onClick={() => setEditedAccentColor(color)}
                          title={`Use ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Voice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Brand Voice</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{analysis.voice.writing_style}</p>
                <div className="flex flex-wrap gap-2">
                  {editedToneKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword}
                      <span className="ml-1 text-muted-foreground">×</span>
                    </Badge>
                  ))}
                  <Input
                    placeholder="+ Add keyword"
                    className="h-6 w-32 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addKeyword((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
              {analysis.voice.words_to_avoid.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Words to avoid:</p>
                  <p className="text-xs text-red-400">{analysis.voice.words_to_avoid.join(", ")}</p>
                </div>
              )}
            </div>

            {/* Visual Style */}
            <div className="space-y-3">
              <span className="text-sm font-medium">Visual Style: {analysis.visual.image_style}</span>
              {analysis.visual.sample_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {analysis.visual.sample_images.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Sample ${i + 1}`}
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Brand Fonts */}
            <div className="space-y-3">
              <span className="text-sm font-medium">Brand Fonts</span>
              {!editedHeadingFont && !editedBodyFont && (
                <div className="p-3 rounded-lg border border-amber-500/50 bg-amber-500/10">
                  <p className="text-xs text-amber-200">
                    Fonts couldn&apos;t be automatically detected. Enter your brand fonts below for best carousel results.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Heading Font</label>
                  <Input
                    placeholder="e.g. Poppins, Montserrat"
                    value={editedHeadingFont}
                    onChange={(e) => setEditedHeadingFont(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Body Font</label>
                  <Input
                    placeholder="e.g. Open Sans, Roboto"
                    value={editedBodyFont}
                    onChange={(e) => setEditedBodyFont(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Strictness Slider */}
            <div className="space-y-3 pt-2 border-t">
              <StrictnessSlider value={strictness} onChange={setStrictness} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("input")}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep("style-selection")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Choose Visual Style
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Style Selection */}
        {step === "style-selection" && analysis && (
          <div className="py-4">
            <StylePicker
              brandColors={{
                primary_color: editedPrimaryColor,
                accent_color: editedAccentColor,
              }}
              brandName={name}
              onStyleSelected={(result) => {
                setSelectedStylesResult(result);
                handleCreate(result);
              }}
              onSkip={() => {
                setSelectedStylesResult(null);
                handleCreate(null);
              }}
            />
          </div>
        )}

        {/* Step 4: Creating */}
        {step === "creating" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Creating {name}...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
