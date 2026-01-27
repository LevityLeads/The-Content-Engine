"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  X,
  ImageIcon,
  Palette,
  Type,
  Eye,
  RefreshCw,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  type VisualConfig,
  type ExamplePost,
  type BrandStyle,
} from "@/contexts/brand-context";

const MAX_EXAMPLE_POSTS = 15;

const PLATFORMS = [
  { id: "general", label: "General", icon: "🎨" },
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "twitter", label: "X/Twitter", icon: "𝕏" },
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "facebook", label: "Facebook", icon: "f" },
] as const;

const CONTENT_TYPES = [
  { id: "general", label: "Any" },
  { id: "carousel", label: "Carousel" },
  { id: "single", label: "Single Post" },
  { id: "story", label: "Story" },
] as const;

interface BrandStyleEditorProps {
  visualConfig: VisualConfig;
  onVisualConfigChange: (config: VisualConfig) => void;
  onSave: () => Promise<void>;
  brandName: string;
}

export function BrandStyleEditor({
  visualConfig,
  onVisualConfigChange,
  onSave,
  brandName,
}: BrandStyleEditorProps) {
  // Example posts state (use V2 if available, fall back to legacy)
  const [examplePosts, setExamplePosts] = useState<ExamplePost[]>(() => {
    if (visualConfig.examplePostsV2 && visualConfig.examplePostsV2.length > 0) {
      return visualConfig.examplePostsV2;
    }
    // Convert legacy example_posts to ExamplePost format
    if (visualConfig.example_posts && visualConfig.example_posts.length > 0) {
      return visualConfig.example_posts.map((url, i) => ({
        id: `legacy-${i}`,
        url,
        platform: "general" as const,
        contentType: "general" as const,
        addedAt: new Date().toISOString(),
      }));
    }
    return [];
  });

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    examples: true,
    brandStyle: true,
    testImages: false,
  });

  // Platform filter for upload
  const [uploadPlatform, setUploadPlatform] = useState<ExamplePost["platform"]>("general");
  const [uploadContentType, setUploadContentType] = useState<ExamplePost["contentType"]>("general");

  // Test image feedback state
  const [feedbackNote, setFeedbackNote] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Handle image upload
  const handleExamplePostUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_EXAMPLE_POSTS - examplePosts.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newPosts: ExamplePost[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newPosts.push({
        id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: base64,
        platform: uploadPlatform,
        contentType: uploadContentType,
        addedAt: new Date().toISOString(),
      });
    }

    const updatedPosts = [...examplePosts, ...newPosts].slice(0, MAX_EXAMPLE_POSTS);
    setExamplePosts(updatedPosts);

    // Update visual config with new posts
    onVisualConfigChange({
      ...visualConfig,
      examplePostsV2: updatedPosts,
      // Also update legacy field for backwards compat
      example_posts: updatedPosts.map((p) => p.url),
    });

    // Reset file input
    e.target.value = "";
  }, [examplePosts, uploadPlatform, uploadContentType, visualConfig, onVisualConfigChange]);

  // Remove example post
  const handleRemoveExamplePost = useCallback((postId: string) => {
    const updatedPosts = examplePosts.filter((p) => p.id !== postId);
    setExamplePosts(updatedPosts);

    onVisualConfigChange({
      ...visualConfig,
      examplePostsV2: updatedPosts,
      example_posts: updatedPosts.map((p) => p.url),
    });
  }, [examplePosts, visualConfig, onVisualConfigChange]);

  // Analyze example posts to generate brand style
  const handleAnalyzeExamples = useCallback(async () => {
    if (examplePosts.length === 0) {
      setMessage({ type: "error", text: "Please upload at least one example image" });
      return;
    }

    setIsAnalyzing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/brands/analyze-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: examplePosts.map((p) => p.url),
          generateBrandStyle: true, // Signal to use enhanced analysis
          platforms: [...new Set(examplePosts.map((p) => p.platform))],
        }),
      });

      const data = await res.json();

      if (data.success && data.analysis) {
        // Create brand style from analysis
        const brandStyle: BrandStyle = {
          id: `style-${Date.now()}`,
          name: `${brandName} Custom Style`,
          isCustom: true,
          colorPalette: {
            primary: data.analysis.colors?.primary || visualConfig.primary_color || "#1a1a1a",
            secondary: data.analysis.colors?.secondary || visualConfig.secondary_color || "#ffffff",
            accent: data.analysis.colors?.accent || visualConfig.accent_color || "#ff6b6b",
            background: data.analysis.colors?.background || "#1a1a1a",
            text: data.analysis.colors?.text || "#ffffff",
            additionalColors: data.analysis.colors?.additional || [],
          },
          typography: {
            headlineStyle: data.analysis.typography?.headline_style || "Bold sans-serif",
            bodyStyle: data.analysis.typography?.body_style || "Regular sans-serif",
            treatments: data.analysis.typography?.treatments || "Standard",
            detectedFonts: data.analysis.typography?.detected_fonts || [],
          },
          visualCharacteristics: {
            style: data.analysis.visual_style || "Modern, clean design",
            mood: data.analysis.mood || "Professional",
            layoutPatterns: data.analysis.layout_patterns || [],
            recurringElements: data.analysis.consistent_elements || [],
            imageStyle: data.analysis.image_style,
          },
          masterPrompt: data.analysis.master_brand_prompt || "",
          platformVariations: data.analysis.platform_variations,
          testImages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceExampleCount: examplePosts.length,
        };

        // Update visual config with brand style
        const updatedConfig: VisualConfig = {
          ...visualConfig,
          brandStyle,
          master_brand_prompt: brandStyle.masterPrompt, // Keep legacy field synced
          primary_color: brandStyle.colorPalette.primary,
          accent_color: brandStyle.colorPalette.accent,
          useBrandStylePriority: true, // Enable brand style priority by default
        };

        onVisualConfigChange(updatedConfig);
        setExpandedSections((prev) => ({ ...prev, brandStyle: true }));
        setMessage({ type: "success", text: "Brand style generated! Review and test below." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to analyze images" });
      }
    } catch (err) {
      console.error("Error analyzing examples:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsAnalyzing(false);
    }
  }, [examplePosts, brandName, visualConfig, onVisualConfigChange]);

  // Generate test images using the brand style
  const handleGenerateTestImages = useCallback(async () => {
    if (!visualConfig.brandStyle?.masterPrompt) {
      setMessage({ type: "error", text: "Please generate a brand style first" });
      return;
    }

    setIsGeneratingTest(true);
    setMessage(null);

    try {
      const res = await fetch("/api/brands/test-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandStyle: visualConfig.brandStyle,
          count: 3, // Generate 3 test images
        }),
      });

      const data = await res.json();

      if (data.success && data.testImages) {
        // Add test images to brand style
        const updatedBrandStyle: BrandStyle = {
          ...visualConfig.brandStyle,
          testImages: [
            ...(visualConfig.brandStyle.testImages || []),
            ...data.testImages.map((img: { url: string }) => ({
              id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: img.url,
              generatedAt: new Date().toISOString(),
            })),
          ],
          updatedAt: new Date().toISOString(),
        };

        onVisualConfigChange({
          ...visualConfig,
          brandStyle: updatedBrandStyle,
        });

        setExpandedSections((prev) => ({ ...prev, testImages: true }));
        setMessage({ type: "success", text: "Test images generated! Review them below." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to generate test images" });
      }
    } catch (err) {
      console.error("Error generating test images:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsGeneratingTest(false);
    }
  }, [visualConfig, onVisualConfigChange]);

  // Provide feedback on test image
  const handleTestImageFeedback = useCallback(async (
    imageId: string,
    feedback: "approved" | "needs_work" | "rejected"
  ) => {
    if (!visualConfig.brandStyle) return;

    const updatedTestImages = visualConfig.brandStyle.testImages?.map((img) =>
      img.id === imageId ? { ...img, feedback, notes: feedbackNote || undefined } : img
    );

    onVisualConfigChange({
      ...visualConfig,
      brandStyle: {
        ...visualConfig.brandStyle,
        testImages: updatedTestImages,
        updatedAt: new Date().toISOString(),
      },
    });

    setFeedbackNote("");
  }, [visualConfig, onVisualConfigChange, feedbackNote]);

  // Refine brand style based on feedback
  const handleRefineStyle = useCallback(async () => {
    if (!visualConfig.brandStyle) return;

    const feedbackItems = visualConfig.brandStyle.testImages?.filter(
      (img) => img.feedback === "needs_work" || img.feedback === "rejected"
    );

    if (!feedbackItems || feedbackItems.length === 0) {
      setMessage({ type: "error", text: "No feedback to refine. Mark images as 'needs work' first." });
      return;
    }

    setIsRefining(true);
    setMessage(null);

    try {
      const res = await fetch("/api/brands/refine-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandStyle: visualConfig.brandStyle,
          feedback: feedbackItems.map((img) => ({
            imageUrl: img.url,
            status: img.feedback,
            notes: img.notes,
          })),
          exampleImages: examplePosts.map((p) => p.url),
        }),
      });

      const data = await res.json();

      if (data.success && data.refinedPrompt) {
        // Record refinement history
        const refinementEntry = {
          date: new Date().toISOString(),
          feedback: feedbackItems.map((f) => f.notes || f.feedback).join("; "),
          promptBefore: visualConfig.brandStyle.masterPrompt,
          promptAfter: data.refinedPrompt,
        };

        const updatedBrandStyle: BrandStyle = {
          ...visualConfig.brandStyle,
          masterPrompt: data.refinedPrompt,
          refinementHistory: [
            ...(visualConfig.brandStyle.refinementHistory || []),
            refinementEntry,
          ],
          // Clear old test images after refinement
          testImages: [],
          updatedAt: new Date().toISOString(),
        };

        onVisualConfigChange({
          ...visualConfig,
          brandStyle: updatedBrandStyle,
          master_brand_prompt: data.refinedPrompt, // Keep legacy field synced
        });

        setMessage({ type: "success", text: "Style refined! Generate new test images to verify." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to refine style" });
      }
    } catch (err) {
      console.error("Error refining style:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsRefining(false);
    }
  }, [visualConfig, onVisualConfigChange, examplePosts]);

  // Update master prompt directly
  const handleMasterPromptChange = useCallback((newPrompt: string) => {
    if (!visualConfig.brandStyle) return;

    onVisualConfigChange({
      ...visualConfig,
      brandStyle: {
        ...visualConfig.brandStyle,
        masterPrompt: newPrompt,
        updatedAt: new Date().toISOString(),
      },
      master_brand_prompt: newPrompt, // Keep legacy field synced
    });
  }, [visualConfig, onVisualConfigChange]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setMessage({ type: "success", text: "Brand style saved!" });
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  const brandStyle = visualConfig.brandStyle;
  const hasUnsavedChanges = examplePosts.length > 0 || brandStyle;

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Example Posts Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("examples")}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Example Posts ({examplePosts.length}/{MAX_EXAMPLE_POSTS})
              </CardTitle>
              <CardDescription>
                Upload examples of your brand&apos;s visual content. More examples = better style extraction.
              </CardDescription>
            </div>
            {expandedSections.examples ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {expandedSections.examples && (
          <CardContent className="space-y-4">
            {/* Upload Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Platform</label>
                <div className="flex gap-1">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setUploadPlatform(p.id)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        uploadPlatform === p.id
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-muted hover:border-muted-foreground/50"
                      }`}
                    >
                      <span className="mr-1">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type</label>
                <div className="flex gap-1">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setUploadContentType(t.id)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        uploadContentType === t.id
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-muted hover:border-muted-foreground/50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {examplePosts.map((post) => (
                <div key={post.id} className="relative group aspect-square">
                  <img
                    src={post.url}
                    alt="Example post"
                    className="w-full h-full rounded-lg object-cover border"
                  />
                  {/* Platform badge */}
                  {post.platform && post.platform !== "general" && (
                    <Badge
                      className="absolute bottom-1 left-1 text-[10px] px-1"
                      variant="secondary"
                    >
                      {PLATFORMS.find((p) => p.id === post.platform)?.icon}
                    </Badge>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveExamplePost(post.id)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              {examplePosts.length < MAX_EXAMPLE_POSTS && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleExamplePostUpload}
                  />
                </label>
              )}
            </div>

            {/* Analyze Button */}
            {examplePosts.length > 0 && (
              <Button
                onClick={handleAnalyzeExamples}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isAnalyzing
                  ? "Analyzing..."
                  : brandStyle
                  ? "Re-analyze & Update Style"
                  : `Analyze ${examplePosts.length} Example${examplePosts.length > 1 ? "s" : ""}`}
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Tip: Upload 5-15 examples for best results. Mix different content types for variety.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Brand Style Section */}
      {brandStyle && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("brandStyle")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Custom Brand Style
                  {visualConfig.useBrandStylePriority && (
                    <Badge variant="default" className="ml-2 text-[10px]">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Your AI-generated visual style based on {brandStyle.sourceExampleCount} example
                  {brandStyle.sourceExampleCount > 1 ? "s" : ""}
                </CardDescription>
              </div>
              {expandedSections.brandStyle ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {expandedSections.brandStyle && (
            <CardContent className="space-y-6">
              {/* Color Palette */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4" />
                  Extracted Colors
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(brandStyle.colorPalette).map(([name, color]) => {
                    if (name === "additionalColors" || !color) return null;
                    return (
                      <div key={name} className="text-center">
                        <div
                          className="h-10 w-10 rounded-lg border shadow-sm"
                          style={{ backgroundColor: color as string }}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 capitalize">
                          {name}
                        </p>
                      </div>
                    );
                  })}
                  {brandStyle.colorPalette.additionalColors?.map((color, i) => (
                    <div key={`additional-${i}`} className="text-center">
                      <div
                        className="h-10 w-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">+{i + 1}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Type className="h-4 w-4" />
                  Typography
                </label>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">Headlines</p>
                    <p className="font-medium">{brandStyle.typography.headlineStyle}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">Body</p>
                    <p className="font-medium">{brandStyle.typography.bodyStyle}</p>
                  </div>
                </div>
                {brandStyle.typography.treatments && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Treatments: {brandStyle.typography.treatments}
                  </p>
                )}
              </div>

              {/* Visual Characteristics */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  Visual Style
                </label>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Style:</span>{" "}
                    {brandStyle.visualCharacteristics.style}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Mood:</span>{" "}
                    {brandStyle.visualCharacteristics.mood}
                  </p>
                  {brandStyle.visualCharacteristics.recurringElements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {brandStyle.visualCharacteristics.recurringElements.map((el, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {el}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Master Prompt - THE KEY ELEMENT */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Master Brand Prompt
                  <Badge variant="secondary" className="text-[10px]">
                    Primary Authority
                  </Badge>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  This prompt controls how ALL images are generated for your brand. Edit to fine-tune.
                </p>
                <Textarea
                  value={brandStyle.masterPrompt}
                  onChange={(e) => handleMasterPromptChange(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder="The master prompt that defines your brand's visual style..."
                />
                {brandStyle.refinementHistory && brandStyle.refinementHistory.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Refined {brandStyle.refinementHistory.length} time
                    {brandStyle.refinementHistory.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Priority Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Use Custom Style as Primary</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, this style overrides all preset styles
                  </p>
                </div>
                <button
                  onClick={() =>
                    onVisualConfigChange({
                      ...visualConfig,
                      useBrandStylePriority: !visualConfig.useBrandStylePriority,
                    })
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    visualConfig.useBrandStylePriority ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      visualConfig.useBrandStylePriority ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Test Images Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateTestImages}
                  disabled={isGeneratingTest}
                  variant="outline"
                  className="flex-1"
                >
                  {isGeneratingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Generate Test Images
                </Button>
                {brandStyle.testImages && brandStyle.testImages.some((t) => t.feedback === "needs_work") && (
                  <Button
                    onClick={handleRefineStyle}
                    disabled={isRefining}
                    variant="secondary"
                  >
                    {isRefining ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refine Style
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Test Images Section */}
      {brandStyle?.testImages && brandStyle.testImages.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("testImages")}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Test Images ({brandStyle.testImages.length})
                </CardTitle>
                <CardDescription>
                  Review generated images and provide feedback to refine the style
                </CardDescription>
              </div>
              {expandedSections.testImages ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {expandedSections.testImages && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {brandStyle.testImages.map((img) => (
                  <div key={img.id} className="space-y-2">
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden border">
                      <img
                        src={img.url}
                        alt="Test image"
                        className="w-full h-full object-cover"
                      />
                      {img.feedback && (
                        <Badge
                          className={`absolute top-2 right-2 ${
                            img.feedback === "approved"
                              ? "bg-emerald-500"
                              : img.feedback === "needs_work"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        >
                          {img.feedback === "approved"
                            ? "Approved"
                            : img.feedback === "needs_work"
                            ? "Needs Work"
                            : "Rejected"}
                        </Badge>
                      )}
                    </div>

                    {/* Feedback buttons */}
                    {!img.feedback && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Notes (optional)..."
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          className="text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-emerald-500 hover:bg-emerald-500/20"
                            onClick={() => handleTestImageFeedback(img.id, "approved")}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Good
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-amber-500 hover:bg-amber-500/20"
                            onClick={() => handleTestImageFeedback(img.id, "needs_work")}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Adjust
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-500 hover:bg-red-500/20"
                            onClick={() => handleTestImageFeedback(img.id, "rejected")}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Bad
                          </Button>
                        </div>
                      </div>
                    )}

                    {img.notes && (
                      <p className="text-xs text-muted-foreground">
                        Note: {img.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Mark images as &ldquo;Adjust&rdquo; and click &ldquo;Refine Style&rdquo; to improve the prompt based on your feedback.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Save Button */}
      {hasUnsavedChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Save Brand Style
          </Button>
        </div>
      )}
    </div>
  );
}
