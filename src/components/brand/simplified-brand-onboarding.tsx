"use client";

import { useState, useCallback, useRef } from "react";
import {
  Globe,
  Loader2,
  Upload,
  X,
  Check,
  CheckCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useBrand, VoiceConfig, VisualConfig } from "@/contexts/brand-context";
import { cn } from "@/lib/utils";

type Step = "setup" | "analyzing" | "complete";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

interface AnalysisResult {
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
    fonts?: {
      heading: string;
      body: string;
    };
  };
  master_brand_prompt?: string;
}

interface SimplifiedBrandOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimplifiedBrandOnboarding({
  open,
  onOpenChange,
}: SimplifiedBrandOnboardingProps) {
  const { createBrand } = useBrand();

  // Step state
  const [step, setStep] = useState<Step>("setup");

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis state
  const [websiteAnalysisComplete, setWebsiteAnalysisComplete] = useState(false);
  const [visualAnalysisComplete, setVisualAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Complete step state
  const [masterPrompt, setMasterPrompt] = useState("");
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset everything
      setStep("setup");
      setName("");
      setUrl("");
      setUploadedImages([]);
      setIsDragging(false);
      setWebsiteAnalysisComplete(false);
      setVisualAnalysisComplete(false);
      setAnalysisError(null);
      setAnalysis(null);
      setMasterPrompt("");
      setIsPromptExpanded(false);
      setLogoUrl(null);
      setLogoPreview(null);
      setPreviewImages([]);
    }
    onOpenChange(isOpen);
  };

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    for (const file of imageFiles) {
      if (uploadedImages.length >= 10) break;

      // Read as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: base64,
          base64,
        };
        setUploadedImages((prev) => {
          if (prev.length >= 10) return prev;
          return [...prev, newImage];
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Analyze & Create
  const handleAnalyze = async () => {
    if (!name.trim()) return;

    setStep("analyzing");
    setAnalysisError(null);
    setWebsiteAnalysisComplete(false);
    setVisualAnalysisComplete(false);

    try {
      // Run analyses in parallel
      const promises: Promise<unknown>[] = [];

      // Website analysis (if URL provided)
      if (url.trim()) {
        promises.push(
          fetch("/api/brands/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim() }),
          })
            .then((res) => res.json())
            .then((data) => {
              setWebsiteAnalysisComplete(true);
              return { type: "website", data };
            })
            .catch((err) => {
              setWebsiteAnalysisComplete(true);
              console.error("Website analysis error:", err);
              return { type: "website", data: null };
            })
        );
      } else {
        setWebsiteAnalysisComplete(true);
      }

      // Visual analysis (if images provided)
      if (uploadedImages.length > 0) {
        const imageData = uploadedImages.map((img) => img.base64);
        promises.push(
          fetch("/api/brands/analyze-visuals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: imageData,
              generateBrandStyle: true,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              setVisualAnalysisComplete(true);
              return { type: "visual", data };
            })
            .catch((err) => {
              setVisualAnalysisComplete(true);
              console.error("Visual analysis error:", err);
              return { type: "visual", data: null };
            })
        );
      } else {
        setVisualAnalysisComplete(true);
      }

      // Wait for all analyses
      const results = await Promise.all(promises);

      // Merge results
      type AnalysisResultItem = { type: string; data: { success: boolean; analysis: Partial<AnalysisResult> } | null };
      const websiteResult = results.find((r) => (r as AnalysisResultItem).type === "website") as AnalysisResultItem | undefined;
      const visualResult = results.find((r) => (r as AnalysisResultItem).type === "visual") as AnalysisResultItem | undefined;

      const mergedAnalysis: AnalysisResult = {
        voice: {
          tone_keywords: websiteResult?.data?.analysis?.voice?.tone_keywords || ["professional", "engaging"],
          messaging_themes: websiteResult?.data?.analysis?.voice?.messaging_themes || [],
          writing_style: websiteResult?.data?.analysis?.voice?.writing_style || "Clear and concise",
          words_to_avoid: websiteResult?.data?.analysis?.voice?.words_to_avoid || [],
        },
        visual: {
          color_palette: visualResult?.data?.analysis?.visual?.color_palette ||
            websiteResult?.data?.analysis?.visual?.color_palette ||
            ["#1a1a1a", "#ffffff", "#3b82f6"],
          primary_color: visualResult?.data?.analysis?.visual?.primary_color ||
            websiteResult?.data?.analysis?.visual?.primary_color ||
            "#1a1a1a",
          secondary_color: visualResult?.data?.analysis?.visual?.secondary_color ||
            websiteResult?.data?.analysis?.visual?.secondary_color ||
            "#ffffff",
          accent_color: visualResult?.data?.analysis?.visual?.accent_color ||
            websiteResult?.data?.analysis?.visual?.accent_color ||
            "#3b82f6",
          image_style: visualResult?.data?.analysis?.visual?.image_style ||
            websiteResult?.data?.analysis?.visual?.image_style ||
            "minimalist",
          fonts: websiteResult?.data?.analysis?.visual?.fonts,
        },
        master_brand_prompt: visualResult?.data?.analysis?.master_brand_prompt ||
          (visualResult?.data as { analysis?: { master_brand_prompt?: string } })?.analysis?.master_brand_prompt,
      };

      setAnalysis(mergedAnalysis);
      setMasterPrompt(mergedAnalysis.master_brand_prompt || "");
      setStep("complete");
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError("Failed to analyze. Please try again.");
      setStep("setup");
    }
  };

  // Logo upload
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setIsUploadingLogo(true);

      try {
        // Upload to storage
        const res = await fetch("/api/brands/upload-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: "temp-" + Date.now(), // Temporary ID, will be replaced on brand creation
            imageData: base64,
            mimeType: file.type,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setLogoUrl(data.url);
        } else {
          console.error("Logo upload failed:", data.error);
          // Keep preview but note upload failed
        }
      } catch (err) {
        console.error("Logo upload error:", err);
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Generate preview
  const handleGeneratePreview = async () => {
    if (!analysis) return;

    setIsGeneratingPreview(true);
    try {
      const res = await fetch("/api/brands/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandConfig: {
            master_brand_prompt: masterPrompt,
            primary_color: analysis.visual.primary_color,
            accent_color: analysis.visual.accent_color,
            secondary_color: analysis.visual.secondary_color,
            fonts: analysis.visual.fonts,
            logo_url: logoUrl,
          },
          strictness: 0.8,
          count: 2,
        }),
      });

      const data = await res.json();
      if (data.success && data.previews) {
        setPreviewImages(data.previews.map((p: { image: string }) => p.image));
      }
    } catch (err) {
      console.error("Preview generation error:", err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Save brand
  const handleSave = async () => {
    if (!name.trim() || !analysis) return;

    setIsCreating(true);
    try {
      const voiceConfig: VoiceConfig = {
        tone_keywords: analysis.voice.tone_keywords,
        words_to_avoid: analysis.voice.words_to_avoid,
        strictness: 0.7,
        source_url: url || undefined,
        extracted_voice: {
          tone_description: analysis.voice.tone_keywords.join(", "),
          messaging_themes: analysis.voice.messaging_themes,
          writing_style: analysis.voice.writing_style,
        },
      };

      const visualConfig: VisualConfig = {
        primary_color: analysis.visual.primary_color,
        secondary_color: analysis.visual.secondary_color,
        accent_color: analysis.visual.accent_color,
        color_palette: analysis.visual.color_palette,
        image_style: analysis.visual.image_style,
        fonts: analysis.visual.fonts,
        master_brand_prompt: masterPrompt,
        logo_url: logoUrl || undefined,
      };

      const result = await createBrand({
        name: name.trim(),
        description: url ? `Brand analyzed from ${url}` : undefined,
        voice_config: voiceConfig,
        visual_config: visualConfig,
      });

      if (result) {
        handleOpenChange(false);
      }
    } catch (err) {
      console.error("Brand creation error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = name.trim().length > 0 && (url.trim().length > 0 || uploadedImages.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "setup" && "Create New Brand"}
            {step === "analyzing" && "Analyzing Brand..."}
            {step === "complete" && "Brand Setup Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup" && "Enter your website URL and upload example posts for best results"}
            {step === "analyzing" && "Extracting brand voice, fonts, and visual style"}
            {step === "complete" && "Review your brand configuration and customize as needed"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: SETUP */}
        {step === "setup" && (
          <div className="space-y-6 py-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name *</label>
              <Input
                placeholder="Enter brand name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL (optional)</label>
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
                We&apos;ll extract brand voice and fonts from your website
              </p>
            </div>

            {/* Example Posts Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Example Posts (recommended)</label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium text-sm">Drop example posts here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  5-10 images for best results ({uploadedImages.length}/10)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Thumbnails */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={img.preview}
                        alt="Example post"
                        className="object-cover w-full h-full"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                We&apos;ll analyze these to create your visual brand style
              </p>
            </div>

            {analysisError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {analysisError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={!canProceed}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze & Create
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: ANALYZING */}
        {step === "analyzing" && (
          <div className="py-12 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />

            <div className="space-y-3">
              {/* Website Analysis */}
              {url && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  {websiteAnalysisComplete ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className={websiteAnalysisComplete ? "text-muted-foreground" : ""}>
                    Analyzing website for voice & fonts
                  </span>
                </div>
              )}

              {/* Visual Analysis */}
              {uploadedImages.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  {visualAnalysisComplete ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className={visualAnalysisComplete ? "text-muted-foreground" : ""}>
                    Analyzing {uploadedImages.length} example posts
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              This may take a moment...
            </p>
          </div>
        )}

        {/* STEP 3: COMPLETE */}
        {step === "complete" && analysis && (
          <div className="space-y-6 py-4">
            {/* Success Header */}
            <div className="text-center pb-4 border-b">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Review and customize your brand settings
              </p>
            </div>

            {/* Extracted Config */}
            <div className="grid grid-cols-2 gap-4">
              {/* Colors */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium text-sm mb-3">Colors</h4>
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: analysis.visual.primary_color }}
                    title={`Primary: ${analysis.visual.primary_color}`}
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: analysis.visual.accent_color }}
                    title={`Accent: ${analysis.visual.accent_color}`}
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: analysis.visual.secondary_color }}
                    title={`Secondary: ${analysis.visual.secondary_color}`}
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium text-sm mb-3">Typography</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.visual.fonts?.heading || "Not detected"}
                  {analysis.visual.fonts?.body && ` / ${analysis.visual.fonts.body}`}
                </p>
              </div>
            </div>

            {/* Voice Keywords */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-3">Brand Voice</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.voice.tone_keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Master Brand Prompt */}
            <Collapsible open={isPromptExpanded} onOpenChange={setIsPromptExpanded}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <h4 className="font-medium text-sm">Master Brand Prompt</h4>
                  {isPromptExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Textarea
                  value={masterPrompt}
                  onChange={(e) => setMasterPrompt(e.target.value)}
                  className="mt-2 min-h-[150px] text-sm font-mono"
                  placeholder="AI-generated visual style guide..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Edit to refine how images are generated for this brand
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* Logo Upload */}
            <div className="p-4 rounded-lg border border-dashed bg-card">
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded"
                    />
                    {isUploadingLogo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">Brand Logo (Optional)</p>
                  <p className="text-xs text-muted-foreground">
                    Upload your logo for watermarking posts
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  <Upload className="mr-2 h-3 w-3" />
                  {logoPreview ? "Change" : "Upload"}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Generate Preview */}
            <Button
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={isGeneratingPreview || !masterPrompt}
              className="w-full"
            >
              {isGeneratingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Preview Posts
                </>
              )}
            </Button>

            {/* Preview Images */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {previewImages.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border">
                    <img src={img} alt={`Preview ${i + 1}`} className="w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("setup")}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save & Finish
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
