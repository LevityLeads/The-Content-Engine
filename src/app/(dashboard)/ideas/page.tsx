"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Check, X, Pencil, MoreHorizontal, Loader2, RefreshCw, Sparkles, Twitter, Linkedin, Instagram, Clock, Palette, Type, Camera, PenTool, Box, Shapes, Layers, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type VisualStyle } from "@/lib/prompts";
import { useBrand } from "@/contexts/brand-context";

interface Idea {
  id: string;
  concept: string;
  angle: string;
  target_platforms: string[];
  key_points: string[];
  potential_hooks: string[];
  ai_reasoning: string;
  confidence_score: number;
  status: string;
  created_at: string;
  inputs?: {
    raw_content: string;
    type: string;
  };
}

const ALL_PLATFORMS = ["twitter", "instagram", "linkedin"] as const;

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const platformConfig: Record<string, { icon: React.ReactNode; label: string; color: string; activeColor: string }> = {
  twitter: {
    icon: <Twitter className="h-4 w-4" />,
    label: "Twitter",
    color: "border-sky-500/30 text-sky-400",
    activeColor: "bg-sky-500 text-white border-sky-500",
  },
  instagram: {
    icon: <Instagram className="h-4 w-4" />,
    label: "Instagram",
    color: "border-pink-500/30 text-pink-400",
    activeColor: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-transparent",
  },
  linkedin: {
    icon: <Linkedin className="h-4 w-4" />,
    label: "LinkedIn",
    color: "border-blue-500/30 text-blue-400",
    activeColor: "bg-blue-600 text-white border-blue-600",
  },
};

// Visual style configuration for the style selector
type StyleOption = VisualStyle | "auto";
const visualStyleConfig: Record<StyleOption, { icon: React.ReactNode; label: string; description: string; color: string; activeColor: string }> = {
  auto: {
    icon: <Wand2 className="h-4 w-4" />,
    label: "Auto",
    description: "AI chooses best style",
    color: "border-purple-500/30 text-purple-400",
    activeColor: "bg-purple-600 text-white border-purple-600",
  },
  typography: {
    icon: <Type className="h-4 w-4" />,
    label: "Typography",
    description: "Bold text-focused designs",
    color: "border-slate-500/30 text-slate-400",
    activeColor: "bg-slate-700 text-white border-slate-700",
  },
  photorealistic: {
    icon: <Camera className="h-4 w-4" />,
    label: "Photo",
    description: "Photo-quality backgrounds",
    color: "border-emerald-500/30 text-emerald-400",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
  },
  illustration: {
    icon: <PenTool className="h-4 w-4" />,
    label: "Illustration",
    description: "Hand-drawn/digital art",
    color: "border-orange-500/30 text-orange-400",
    activeColor: "bg-orange-500 text-white border-orange-500",
  },
  "3d-render": {
    icon: <Box className="h-4 w-4" />,
    label: "3D Render",
    description: "Modern 3D scenes",
    color: "border-cyan-500/30 text-cyan-400",
    activeColor: "bg-cyan-600 text-white border-cyan-600",
  },
  "abstract-art": {
    icon: <Shapes className="h-4 w-4" />,
    label: "Abstract",
    description: "Bold shapes & gradients",
    color: "border-rose-500/30 text-rose-400",
    activeColor: "bg-rose-500 text-white border-rose-500",
  },
  collage: {
    icon: <Layers className="h-4 w-4" />,
    label: "Collage",
    description: "Mixed media layers",
    color: "border-amber-500/30 text-amber-400",
    activeColor: "bg-amber-600 text-white border-amber-600",
  },
};

const STYLE_OPTIONS: StyleOption[] = ["auto", "typography", "photorealistic", "illustration", "3d-render", "abstract-art", "collage"];

export default function IdeasPage() {
  const router = useRouter();
  const { selectedBrand } = useBrand();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Track selected platforms per idea
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string[]>>({});
  // Track selected visual style per idea (for Instagram carousels)
  const [selectedVisualStyles, setSelectedVisualStyles] = useState<Record<string, StyleOption>>({});

  useEffect(() => {
    fetchIdeas();
  }, [filter, selectedBrand?.id]);

  // Initialize selected platforms when ideas load
  useEffect(() => {
    const initial: Record<string, string[]> = {};
    ideas.forEach((idea) => {
      if (!selectedPlatforms[idea.id]) {
        // Default to all available platforms for the idea
        initial[idea.id] = idea.target_platforms || [...ALL_PLATFORMS];
      }
    });
    if (Object.keys(initial).length > 0) {
      setSelectedPlatforms((prev) => ({ ...prev, ...initial }));
    }
  }, [ideas]);

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (selectedBrand?.id) params.set("brandId", selectedBrand.id);
      const url = `/api/ideas?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setIdeas(data.ideas || []);
      }
    } catch (err) {
      console.error("Error fetching ideas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (ideaId: string, platform: string) => {
    setSelectedPlatforms((prev) => {
      const current = prev[ideaId] || [];
      if (current.includes(platform)) {
        // Don't allow deselecting all platforms
        if (current.length === 1) return prev;
        return { ...prev, [ideaId]: current.filter((p) => p !== platform) };
      } else {
        return { ...prev, [ideaId]: [...current, platform] };
      }
    });
  };

  const getSelectedPlatforms = (ideaId: string, defaultPlatforms: string[]): string[] => {
    return selectedPlatforms[ideaId] || defaultPlatforms || [...ALL_PLATFORMS];
  };

  const getSelectedVisualStyle = (ideaId: string): StyleOption => {
    return selectedVisualStyles[ideaId] || "auto";
  };

  const setVisualStyle = (ideaId: string, style: StyleOption) => {
    setSelectedVisualStyles((prev) => ({ ...prev, [ideaId]: style }));
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === id ? { ...idea, status } : idea
          )
        );

        // If approved, generate content for selected platforms only
        if (status === "approved") {
          const idea = ideas.find((i) => i.id === id);
          const platforms = getSelectedPlatforms(id, idea?.target_platforms || []);
          const visualStyle = getSelectedVisualStyle(id);

          setActionLoading(null);
          setGeneratingContent(id);

          // Build message based on whether Instagram is selected and a style is chosen
          const hasInstagram = platforms.includes("instagram");
          const styleLabel = visualStyle !== "auto" ? visualStyleConfig[visualStyle].label : "Auto-selected";
          const styleMsg = hasInstagram ? ` (${styleLabel} style)` : "";
          setSuccessMessage(`Idea approved! Generating content for ${platforms.join(", ")}${styleMsg}...`);

          const contentRes = await fetch("/api/content/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ideaId: id,
              platforms,
              // Only pass visualStyle if not "auto" - undefined lets AI choose
              visualStyle: visualStyle !== "auto" ? visualStyle : undefined,
            }),
          });

          const contentData = await contentRes.json();
          if (contentData.success) {
            setSuccessMessage(`Content generated for ${contentData.content?.length || 0} platform(s)! View in Content page.`);
            // Update idea status to generated
            setIdeas((prev) =>
              prev.map((idea) =>
                idea.id === id ? { ...idea, status: "generated" } : idea
              )
            );
          } else {
            setSuccessMessage("Idea approved but content generation failed. Try again from Content page.");
          }
          setGeneratingContent(null);
        }

        // If filtering by pending, remove from list
        if (filter === "pending") {
          setIdeas((prev) => prev.filter((idea) => idea.id !== id));
        }
      }
    } catch (err) {
      console.error("Error updating idea:", err);
    } finally {
      setActionLoading(null);
      setGeneratingContent(null);
    }
  };

  const pendingCount = ideas.filter((i) => i.status === "pending").length;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "generated":
        return "default";
      case "rejected":
        return "destructive";
      case "generating":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated content ideas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchIdeas}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="text-sm">
            {pendingCount} pending
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["pending", "approved", "generated", "rejected", ""].map((f) => (
          <Button
            key={f || "all"}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f || "All"}
          </Button>
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {successMessage}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading ideas...</p>
          </CardContent>
        </Card>
      )}

      {/* Ideas List */}
      {!isLoading && ideas.length > 0 && (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const selected = getSelectedPlatforms(idea.id, idea.target_platforms);

            return (
              <Card key={idea.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize">
                          {idea.angle}
                        </Badge>
                        {idea.status !== "pending" && (
                          <Badge
                            variant={getStatusBadgeVariant(idea.status)}
                            className="capitalize"
                          >
                            {idea.status}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-2 text-lg">{idea.concept}</CardTitle>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(idea.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {idea.confidence_score}%
                        </p>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platform Selection Toggles */}
                  {idea.status === "pending" && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Generate for platforms:</p>
                      <div className="flex gap-2 flex-wrap">
                        {ALL_PLATFORMS.map((platform) => {
                          const config = platformConfig[platform];
                          const isSelected = selected.includes(platform);
                          return (
                            <button
                              key={platform}
                              onClick={() => togglePlatform(idea.id, platform)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
                                isSelected ? config.activeColor : config.color,
                                "hover:opacity-90"
                              )}
                            >
                              {config.icon}
                              <span className="text-sm font-medium">{config.label}</span>
                              {isSelected && <Check className="h-3 w-3 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Visual Style Selector - Only show when Instagram is selected */}
                  {idea.status === "pending" && selected.includes("instagram") && (
                    <div className="space-y-2 pt-2 border-t border-muted/30">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Carousel visual style:</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                        {STYLE_OPTIONS.map((style) => {
                          const config = visualStyleConfig[style];
                          const isSelected = getSelectedVisualStyle(idea.id) === style;
                          return (
                            <button
                              key={style}
                              onClick={() => setVisualStyle(idea.id, style)}
                              className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all text-center",
                                isSelected ? config.activeColor : config.color,
                                "hover:opacity-90"
                              )}
                              title={config.description}
                            >
                              {config.icon}
                              <span className="text-xs font-medium">{config.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {visualStyleConfig[getSelectedVisualStyle(idea.id)].description}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {idea.key_points && idea.key_points.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Key Points</p>
                      <ul className="space-y-1">
                        {idea.key_points.map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Hook */}
                  {idea.potential_hooks && idea.potential_hooks.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Suggested Hook</p>
                      <p className="text-sm italic text-muted-foreground">
                        &ldquo;{idea.potential_hooks[0]}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {idea.ai_reasoning && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Why This Works</p>
                      <p className="text-sm text-muted-foreground">
                        {idea.ai_reasoning}
                      </p>
                    </div>
                  )}

                  {/* Source Input */}
                  {idea.inputs && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Source: {idea.inputs.type}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {idea.inputs.raw_content?.slice(0, 200)}
                        {(idea.inputs.raw_content?.length || 0) > 200 ? "..." : ""}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {idea.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={actionLoading === idea.id || generatingContent === idea.id || selected.length === 0}
                        onClick={() => handleAction(idea.id, "approved")}
                      >
                        {actionLoading === idea.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : generatingContent === idea.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating for {selected.length} platform{selected.length > 1 ? "s" : ""}...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Approve & Generate ({selected.length})
                          </>
                        )}
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        disabled={actionLoading === idea.id || generatingContent === idea.id}
                        onClick={() => handleAction(idea.id, "rejected")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button variant="outline" size="icon" disabled={generatingContent === idea.id}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Non-pending status actions */}
                  {idea.status !== "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(idea.id, idea.status === "approved" ? "rejected" : "approved")}
                        disabled={actionLoading === idea.id}
                      >
                        {actionLoading === idea.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : idea.status === "approved" ? (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Reject Instead
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Approve Instead
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && ideas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {filter ? `No ${filter} ideas` : "No ideas yet"}
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {filter
                ? `You don't have any ${filter} ideas. Try changing the filter.`
                : "Add inputs to generate content ideas"}
            </p>
            {!filter && (
              <a href="/inputs">
                <Button variant="outline">Add Input</Button>
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
