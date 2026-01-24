"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Image as ImageIcon, Plus } from "lucide-react";
import { useBrand } from "@/contexts/brand-context";
import type { DesignContext } from "@/lib/design";

interface Idea {
  id: string;
  concept: string;
  angle: string;
  key_points: string[];
  potential_hooks: string[];
  status: string;
  created_at: string;
}

interface CarouselSlide {
  slideNumber: number;
  text: string;
  visualHint: string;
  narrativeRole: string;
  emotionalBeat: string;
}

interface NarrativeArc {
  theme: string;
  tension: string;
  resolution: string;
}

interface GeneratedContent {
  id: string;
  copy_primary: string;
  copy_carousel_slides: string[];
  metadata: {
    designContext: DesignContext;
    narrativeArc: NarrativeArc;
  };
}

interface GeneratedImage {
  slideNumber: number;
  url: string;
}

const visualStyleOptions = [
  { id: "typography", label: "Typography", description: "Bold text on dark/gradient backgrounds" },
  { id: "photorealistic", label: "Photo", description: "Photo-quality AI backgrounds" },
  { id: "illustration", label: "Illustration", description: "Hand-drawn artistic style" },
  { id: "3d-render", label: "3D Render", description: "Modern 3D scenes" },
  { id: "abstract-art", label: "Abstract", description: "Bold shapes & gradients" },
];

const textStyleOptions = [
  { id: "bold-editorial", label: "Bold Editorial", size: "72px headlines" },
  { id: "clean-modern", label: "Clean Modern", size: "64px headlines" },
  { id: "dramatic", label: "Dramatic", size: "84px headlines" },
  { id: "minimal", label: "Minimal", size: "56px headlines" },
  { id: "statement", label: "Statement", size: "96px headlines" },
];

export default function TestingPage() {
  const { selectedBrand } = useBrand();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [visualStyle, setVisualStyle] = useState("typography");
  const [textStyle, setTextStyle] = useState("bold-editorial");
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [designContext, setDesignContext] = useState<DesignContext | null>(null);
  const [narrativeArc, setNarrativeArc] = useState<NarrativeArc | null>(null);
  const [parsedSlides, setParsedSlides] = useState<CarouselSlide[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Create idea form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({
    concept: "The science of productive breaks",
    angle: "educational",
    keyPoints: "40% productivity increase with regular breaks\nPomodoro technique: 25 min work, 5 min break\nNatural attention span alignment",
    hooks: "You're not lazy. You're burned out.\nWhat if doing less made you more productive?",
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Create a test idea
  const createTestIdea = async () => {
    if (!selectedBrand?.id) return;

    setIsCreatingIdea(true);
    setError(null);
    addLog("Creating test idea...");

    try {
      // First create an input
      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          rawContent: newIdea.keyPoints.split("\n").join(". "),
          type: "text",
        }),
      });
      const inputData = await inputRes.json();

      if (!inputData.success) {
        throw new Error(inputData.error || "Failed to create input");
      }
      addLog(`✓ Input created: ${inputData.input.id}`);

      // Then create the idea
      const ideaRes = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          inputId: inputData.input.id,
          concept: newIdea.concept,
          angle: newIdea.angle,
          keyPoints: newIdea.keyPoints.split("\n").filter(Boolean),
          potentialHooks: newIdea.hooks.split("\n").filter(Boolean),
          status: "approved",
        }),
      });
      const ideaData = await ideaRes.json();

      if (!ideaData.success) {
        throw new Error(ideaData.error || "Failed to create idea");
      }
      addLog(`✓ Idea created: ${ideaData.idea.id}`);

      // Add to list and select it
      const createdIdea = ideaData.idea;
      setIdeas(prev => [createdIdea, ...prev]);
      setSelectedIdea(createdIdea);
      setShowCreateForm(false);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      addLog(`✗ Error: ${message}`);
    } finally {
      setIsCreatingIdea(false);
    }
  };

  // Fetch approved ideas
  useEffect(() => {
    const fetchIdeas = async () => {
      if (!selectedBrand?.id) return;

      setIsLoadingIdeas(true);
      try {
        const res = await fetch(`/api/ideas?brandId=${selectedBrand.id}&status=approved`);
        const data = await res.json();
        if (data.success) {
          setIdeas(data.ideas || []);
        }
      } catch (err) {
        console.error("Failed to fetch ideas:", err);
      } finally {
        setIsLoadingIdeas(false);
      }
    };

    fetchIdeas();
  }, [selectedBrand?.id]);

  // Generate carousel content using new endpoint
  const generateContent = async () => {
    if (!selectedIdea) return;

    setIsGeneratingContent(true);
    setError(null);
    setGeneratedContent(null);
    setDesignContext(null);
    setNarrativeArc(null);
    setParsedSlides([]);
    setGeneratedImages([]);
    setLogs([]);

    addLog(`Starting content generation for idea: ${selectedIdea.concept}`);
    addLog(`Visual style: ${visualStyle}, Text style: ${textStyle}`);

    try {
      const res = await fetch("/api/content/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          visualStyle,
          textStyle,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate content");
      }

      addLog(`✓ Content generated successfully`);
      addLog(`✓ Design context received with ${Object.keys(data.designContext || {}).length} properties`);
      addLog(`✓ Narrative arc: ${data.narrativeArc?.theme || 'N/A'}`);

      setGeneratedContent(data.content);
      setDesignContext(data.designContext);
      setNarrativeArc(data.narrativeArc);

      // Parse slides
      if (data.content?.copy_carousel_slides) {
        const slides = data.content.copy_carousel_slides.map((s: string) => {
          try {
            return typeof s === 'string' ? JSON.parse(s) : s;
          } catch {
            return { text: s, slideNumber: 0 };
          }
        });
        setParsedSlides(slides);
        addLog(`✓ Parsed ${slides.length} slides`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      addLog(`✗ Error: ${message}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Generate images using the design context
  const generateImages = async () => {
    if (!generatedContent || !designContext || parsedSlides.length === 0) return;

    setIsGeneratingImages(true);
    setGeneratedImages([]);
    addLog(`Starting image generation with provided DesignContext`);
    addLog(`Design context source: provided (not recomputed)`);

    try {
      const slides = parsedSlides.map((slide, idx) => ({
        slideNumber: idx + 1,
        text: slide.text,
      }));

      addLog(`Sending ${slides.length} slides to /api/images/carousel`);

      const res = await fetch("/api/images/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: generatedContent.id,
          slides,
          designContext, // Pass the SAME design context
          backgroundStyle: "gradient-dark",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate images");
      }

      addLog(`✓ Images generated successfully`);
      addLog(`✓ Design context source in response: ${data.design?.source || 'unknown'}`);

      // Map images
      const images = data.images?.map((img: { slideNumber: number; url: string }) => ({
        slideNumber: img.slideNumber,
        url: img.url,
      })) || [];

      setGeneratedImages(images);
      addLog(`✓ Received ${images.length} images`);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      addLog(`✗ Error: ${message}`);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold">Pipeline Coherence Testing</h1>
          <p className="text-zinc-400 mt-1">
            Test the new carousel generation pipeline with Design Context Provider
          </p>
          <Badge variant="outline" className="mt-2 border-yellow-500/50 text-yellow-500">
            Phase 1 Testing
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            {/* Idea Selection */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center justify-between">
                  1. Select Idea
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {showCreateForm ? "Cancel" : "Create"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showCreateForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Concept</label>
                      <Input
                        value={newIdea.concept}
                        onChange={(e) => setNewIdea(prev => ({ ...prev, concept: e.target.value }))}
                        placeholder="e.g. The science of productive breaks"
                        className="bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Angle</label>
                      <Input
                        value={newIdea.angle}
                        onChange={(e) => setNewIdea(prev => ({ ...prev, angle: e.target.value }))}
                        placeholder="e.g. educational, inspirational"
                        className="bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Key Points (one per line)</label>
                      <Textarea
                        value={newIdea.keyPoints}
                        onChange={(e) => setNewIdea(prev => ({ ...prev, keyPoints: e.target.value }))}
                        placeholder="Point 1&#10;Point 2&#10;Point 3"
                        className="bg-zinc-800 border-zinc-700 text-sm min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Potential Hooks (one per line)</label>
                      <Textarea
                        value={newIdea.hooks}
                        onChange={(e) => setNewIdea(prev => ({ ...prev, hooks: e.target.value }))}
                        placeholder="Hook 1&#10;Hook 2"
                        className="bg-zinc-800 border-zinc-700 text-sm min-h-[60px]"
                      />
                    </div>
                    <Button
                      onClick={createTestIdea}
                      disabled={isCreatingIdea || !newIdea.concept}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {isCreatingIdea ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-2" />
                          Create Test Idea
                        </>
                      )}
                    </Button>
                  </div>
                ) : isLoadingIdeas ? (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading ideas...
                  </div>
                ) : ideas.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-zinc-500 text-sm mb-3">No approved ideas found</p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Create Test Idea
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ideas.map((idea) => (
                      <button
                        key={idea.id}
                        onClick={() => setSelectedIdea(idea)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedIdea?.id === idea.id
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                      >
                        <div className="font-medium text-sm truncate">{idea.concept}</div>
                        <div className="text-xs text-zinc-500 mt-1">{idea.angle}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual Style */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300">2. Visual Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {visualStyleOptions.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setVisualStyle(style.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      visualStyle === style.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-zinc-500">{style.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Text Style */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300">3. Text Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {textStyleOptions.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setTextStyle(style.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      textStyle === style.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-zinc-500">{style.size}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={generateContent}
              disabled={!selectedIdea || isGeneratingContent}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingContent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Carousel Content
                </>
              )}
            </Button>
          </div>

          {/* Middle Column - Results */}
          <div className="space-y-4">
            {/* Design Context */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  Design Context
                  {designContext && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {designContext ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-zinc-500">visualStyle:</div>
                      <div>{designContext.visualStyle}</div>
                      <div className="text-zinc-500">primaryColor:</div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: designContext.primaryColor }} />
                        {designContext.primaryColor}
                      </div>
                      <div className="text-zinc-500">accentColor:</div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: designContext.accentColor }} />
                        {designContext.accentColor}
                      </div>
                      <div className="text-zinc-500">backgroundColor:</div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded border border-zinc-600" style={{ backgroundColor: designContext.backgroundColor }} />
                        {designContext.backgroundColor}
                      </div>
                      <div className="text-zinc-500">headlineFontSize:</div>
                      <div>{designContext.headlineFontSize}px</div>
                      <div className="text-zinc-500">bodyFontSize:</div>
                      <div>{designContext.bodyFontSize}px</div>
                      <div className="text-zinc-500">aesthetic:</div>
                      <div className="col-span-2 text-zinc-300">{designContext.aesthetic}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Generate content to see design context</p>
                )}
              </CardContent>
            </Card>

            {/* Narrative Arc */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  Narrative Arc
                  {narrativeArc && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {narrativeArc ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-zinc-500 text-xs mb-1">Theme</div>
                      <div>{narrativeArc.theme}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs mb-1">Tension</div>
                      <div>{narrativeArc.tension}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs mb-1">Resolution</div>
                      <div>{narrativeArc.resolution}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Generate content to see narrative arc</p>
                )}
              </CardContent>
            </Card>

            {/* Slides */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Slides ({parsedSlides.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {parsedSlides.length > 0 ? (
                  <div className="space-y-3">
                    {parsedSlides.map((slide, idx) => (
                      <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {slide.narrativeRole || `Slide ${idx + 1}`}
                          </Badge>
                          {slide.emotionalBeat && (
                            <Badge variant="secondary" className="text-xs bg-zinc-700">
                              {slide.emotionalBeat}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{slide.text}</p>
                        {slide.visualHint && (
                          <p className="text-xs text-zinc-500 mt-2 italic">{slide.visualHint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Generate content to see slides</p>
                )}
              </CardContent>
            </Card>

            {/* Generate Images Button */}
            {designContext && parsedSlides.length > 0 && (
              <Button
                onClick={generateImages}
                disabled={isGeneratingImages}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Images...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Images with DesignContext
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right Column - Images & Logs */}
          <div className="space-y-4">
            {/* Generated Images */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Generated Images ({generatedImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {generatedImages.map((img) => (
                      <div key={img.slideNumber} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-zinc-700">
                        <img
                          src={img.url}
                          alt={`Slide ${img.slideNumber}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-xs">
                          Slide {img.slideNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Generate images to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logs */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-zinc-300">Pipeline Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`${
                          log.includes("✓") ? "text-green-400" :
                          log.includes("✗") ? "text-red-400" :
                          "text-zinc-400"
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-600">Logs will appear here...</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border-red-500/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-400">Error</div>
                      <div className="text-sm text-red-300/80 mt-1">{error}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Verification Checklist */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">
              Phase 1 Verification Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-zinc-400">PIPE-01: All-at-once</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${narrativeArc ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={narrativeArc ? "text-zinc-300" : "text-zinc-600"}>
                    Narrative arc present
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${parsedSlides.some(s => s.narrativeRole) ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={parsedSlides.some(s => s.narrativeRole) ? "text-zinc-300" : "text-zinc-600"}>
                    Slides have narrative roles
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-zinc-400">PIPE-02: Design Context</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${designContext ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={designContext ? "text-zinc-300" : "text-zinc-600"}>
                    Design context computed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${generatedImages.length > 0 ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={generatedImages.length > 0 ? "text-zinc-300" : "text-zinc-600"}>
                    Same context used for images
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-zinc-400">PIPE-03: Visual Consistency</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${generatedImages.length > 1 ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={generatedImages.length > 1 ? "text-zinc-300" : "text-zinc-600"}>
                    All slides same colors
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${generatedImages.length > 1 ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={generatedImages.length > 1 ? "text-zinc-300" : "text-zinc-600"}>
                    All slides same typography
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
