"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Palette,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// Design presets
const DESIGN_PRESETS = [
  { key: "dark-coral", name: "Dark Coral", colors: ["#1a1a1a", "#ffffff", "#ff6b6b"] },
  { key: "navy-gold", name: "Navy Gold", colors: ["#1a1f3c", "#f5f5dc", "#d4af37"] },
  { key: "light-minimal", name: "Light Minimal", colors: ["#fafafa", "#1a1a1a", "#2563eb"] },
  { key: "teal-cream", name: "Teal Cream", colors: ["#0d4d4d", "#ffffff", "#f5f5dc"] },
];

// Background styles
const BACKGROUND_STYLES = [
  { key: "gradient-dark", name: "Dark Gradient" },
  { key: "gradient-warm", name: "Warm Gradient" },
  { key: "texture-noise", name: "Noise Texture" },
  { key: "abstract-shapes", name: "Abstract Shapes" },
  { key: "abstract-waves", name: "Wave Patterns" },
  { key: "bokeh-dark", name: "Dark Bokeh" },
  { key: "minimal-solid", name: "Solid Color" },
];

// Template types
const TEMPLATE_TYPES = [
  { key: "hook", name: "Hook Slide", description: "Big bold statement (slide 1)" },
  { key: "content", name: "Content Slide", description: "Header + body text" },
  { key: "numbered", name: "Numbered Slide", description: "Number + title + description" },
  { key: "cta", name: "CTA Slide", description: "Call to action (final slide)" },
];

export default function ExperimentsPage() {
  // Background state
  const [backgroundStyle, setBackgroundStyle] = useState("gradient-dark");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [generatingBackground, setGeneratingBackground] = useState(false);

  // Slide content state
  const [slideNumber, setSlideNumber] = useState(1);
  const [headline, setHeadline] = useState("This Changes Everything");
  const [body, setBody] = useState("");
  const [accentText, setAccentText] = useState("");
  const [ctaText, setCtaText] = useState("Follow for More");

  // Design state
  const [designPreset, setDesignPreset] = useState("dark-coral");
  const [templateType, setTemplateType] = useState<string>("hook");

  // Output state
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [generatingComposite, setGeneratingComposite] = useState(false);

  // Carousel preview state
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Generate background image
  const generateBackground = async () => {
    setGeneratingBackground(true);
    try {
      const response = await fetch("/api/images/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: backgroundStyle,
        }),
      });

      const data = await response.json();

      if (data.success && data.image) {
        setBackgroundImage(data.image);
      } else {
        alert(`Failed to generate background: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating background:", error);
      alert("Failed to generate background");
    } finally {
      setGeneratingBackground(false);
    }
  };

  // Generate composite image
  const generateComposite = async () => {
    setGeneratingComposite(true);
    try {
      const response = await fetch("/api/images/composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundImage: backgroundImage || undefined,
          content: {
            slideNumber,
            headline,
            body: body || undefined,
            accentText: accentText || undefined,
            ctaText: templateType === "cta" ? ctaText : undefined,
          },
          designSystem: designPreset,
          templateType,
        }),
      });

      const data = await response.json();

      if (data.success && data.image) {
        setCompositeImage(data.image);

        // Add to carousel preview
        const newSlides = [...carouselSlides];
        if (slideNumber <= newSlides.length) {
          newSlides[slideNumber - 1] = data.image;
        } else {
          newSlides.push(data.image);
        }
        setCarouselSlides(newSlides);
        setCurrentSlideIndex(slideNumber - 1);
      } else {
        alert(`Failed to generate composite: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating composite:", error);
      alert("Failed to generate composite image");
    } finally {
      setGeneratingComposite(false);
    }
  };

  // Download image
  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Composite Lab</h1>
        <p className="text-muted-foreground">
          Experiment with background + text compositing for consistent carousel images.
          <Badge variant="secondary" className="ml-2">Experimental</Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Step 1: Background */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Step 1: Background Image
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Background Style</label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUND_STYLES.map((style) => (
                    <Button
                      key={style.key}
                      variant={backgroundStyle === style.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBackgroundStyle(style.key)}
                    >
                      {style.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateBackground}
                disabled={generatingBackground}
                className="w-full"
              >
                {generatingBackground ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Background with AI
                  </>
                )}
              </Button>

              {backgroundImage && (
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden border">
                  <img
                    src={backgroundImage}
                    alt="Generated background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500/80">
                      <Check className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                </div>
              )}

              {!backgroundImage && (
                <div className="aspect-[4/5] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No background yet</p>
                    <p className="text-xs">Generate or use solid color from design</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Design System */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Step 2: Design System
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Color Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {DESIGN_PRESETS.map((preset) => (
                    <Button
                      key={preset.key}
                      variant={designPreset === preset.key ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setDesignPreset(preset.key)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {preset.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{
                                backgroundColor: color,
                                marginLeft: i > 0 ? "-4px" : 0,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Template Type</label>
                <div className="space-y-2">
                  {TEMPLATE_TYPES.map((template) => (
                    <Button
                      key={template.key}
                      variant={templateType === template.key ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setTemplateType(template.key)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs opacity-70">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3: Content */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Step 3: Slide Content
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Slide Number</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={slideNumber}
                  onChange={(e) => setSlideNumber(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Headline</label>
                <Textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Main text for the slide..."
                  rows={2}
                />
              </div>

              {(templateType === "content" || templateType === "numbered") && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Body Text (optional)</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Supporting text..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Accent Text (optional)</label>
                    <Input
                      value={accentText}
                      onChange={(e) => setAccentText(e.target.value)}
                      placeholder="Highlighted text..."
                    />
                  </div>
                </>
              )}

              {templateType === "cta" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">CTA Button Text</label>
                  <Input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Follow for More"
                  />
                </div>
              )}

              <Button
                onClick={generateComposite}
                disabled={generatingComposite || !headline}
                className="w-full"
                size="lg"
              >
                {generatingComposite ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compositing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Slide {slideNumber}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {/* Current Slide Preview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Current Slide Preview</h2>

            {compositeImage ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden border bg-black/5">
                  <img
                    src={compositeImage}
                    alt={`Slide ${slideNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => downloadImage(compositeImage, `slide-${slideNumber}.png`)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSlideNumber(slideNumber + 1);
                      setTemplateType(slideNumber === 0 ? "hook" : "content");
                    }}
                  >
                    Next Slide
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No composite yet</p>
                  <p className="text-xs">Add content and generate</p>
                </div>
              </div>
            )}
          </Card>

          {/* Carousel Preview */}
          {carouselSlides.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Carousel Preview ({carouselSlides.length} slides)
              </h2>

              <div className="relative">
                <div className="aspect-[4/5] rounded-lg overflow-hidden border bg-black/5">
                  <img
                    src={carouselSlides[currentSlideIndex]}
                    alt={`Slide ${currentSlideIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {carouselSlides.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setCurrentSlideIndex(Math.min(carouselSlides.length - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === carouselSlides.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {carouselSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    className={`flex-shrink-0 w-16 h-20 rounded overflow-hidden border-2 transition-all ${
                      idx === currentSlideIndex
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => setCurrentSlideIndex(idx)}
                  >
                    <img
                      src={slide}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    carouselSlides.forEach((slide, idx) => {
                      downloadImage(slide, `carousel-slide-${idx + 1}.png`);
                    });
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCarouselSlides([]);
                    setCurrentSlideIndex(0);
                    setSlideNumber(1);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-2">How This Works</h3>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li>
                <strong>1. Background:</strong> AI generates artistic backgrounds without any text
              </li>
              <li>
                <strong>2. Design System:</strong> Choose consistent colors, fonts, and layout
              </li>
              <li>
                <strong>3. Text Layer:</strong> Satori renders pixel-perfect text overlay
              </li>
              <li>
                <strong>4. Composite:</strong> Background + text = perfectly consistent slides
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4">
              The magic: same design system = identical typography across all slides, regardless of background.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
