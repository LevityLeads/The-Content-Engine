"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertTriangle, CheckCircle, XCircle, ImageIcon } from "lucide-react";

interface ContentIdea {
  id: string;
  angle: string;
  whyInteresting: string;
  hook: string;
  format: string;
  platform: string;
  riskLevel: string;
  keyPoints: string[];
  saveWorthiness?: {
    passesReferenceTest: boolean;
    passesFutureSelfTest: boolean;
    passesScreenshotTest: boolean;
    format: string;
  };
}

interface AuditResult {
  aiPatterns: {
    blacklistedWords: string[];
    blacklistedPhrases: string[];
    deadHook: string | null;
    clean: boolean;
  };
  rhythm: {
    burstiness: number;
    monotonousSequences: string[][];
    shortPunchRatio: number;
    passed: boolean;
  };
  saveWorthiness: {
    passesReferenceTest: boolean;
    passesFutureSelfTest: boolean;
    passesScreenshotTest: boolean;
    score: number;
  };
}

interface GeneratedContent {
  platform: string;
  format: string;
  copy: {
    type: string;
    text?: string;
    tweets?: string[];
    slides?: { headline: string; body?: string }[];
  };
  selfAssessment?: {
    saveWorthiness: number;
    voiceMatch: number;
    riskLevel: string;
    hookStrength: number;
  };
}

export default function ContentGenV2Page() {
  const [input, setInput] = useState("");
  const [riskLevel, setRiskLevel] = useState("balanced");
  const [platform, setPlatform] = useState("twitter");
  const [mode, setMode] = useState("full");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ideas?: ContentIdea[];
    selectedIdea?: ContentIdea;
    content?: GeneratedContent;
    audit?: AuditResult;
    inputAssessment?: { likelyTier: string; signals: { rich: string[]; thin: string[] } };
    researchResult?: { enrichedInput: string; angles: { angle: string }[] };
    rawResponse?: string;
    error?: string;
  } | null>(null);
  const [images, setImages] = useState<{ slideNumber: number; imageUrl: string }[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setImages([]);
    setImageError(null);

    try {
      const response = await fetch("/api/content/generate-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          riskLevel,
          platform,
          mode,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!result?.content?.copy?.slides) return;

    setImageLoading(true);
    setImageError(null);

    try {
      const slides = result.content.copy.slides.map((slide, idx) => ({
        slideNumber: idx + 1,
        headline: slide.headline,
        body: slide.body,
      }));

      const response = await fetch("/api/content/generate-v2/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides,
          backgroundStyle: "gradient-dark",
        }),
      });

      const data = await response.json();

      if (data.success && data.images) {
        setImages(data.images);
      } else {
        setImageError(data.error || "Failed to generate images");
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setImageLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "safe": return "bg-green-500/10 text-green-500";
      case "balanced": return "bg-yellow-500/10 text-yellow-500";
      case "bold": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "rich": return "text-green-500";
      case "adequate": return "text-yellow-500";
      case "thin": return "text-orange-500";
      case "unusable": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8" />
          Content Gen V2 Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Test the new prompt system with AI pattern detection, save-worthiness checks, and risk modes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your content idea, topic, or raw input..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="resize-none"
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="safe">Safe (7/10)</option>
                  <option value="balanced">Balanced (8/10)</option>
                  <option value="bold">Bold (9/10)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="ideate">Ideate Only</option>
                  <option value="full">Full Pipeline</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Input Assessment */}
        {result?.inputAssessment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Input Assessment
                <Badge className={getTierColor(result.inputAssessment.likelyTier)}>
                  {result.inputAssessment.likelyTier}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.inputAssessment.signals?.rich?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-green-500 mb-1">Rich Signals:</p>
                  <ul className="text-sm text-muted-foreground">
                    {result.inputAssessment.signals.rich.map((s, i) => (
                      <li key={i}>+ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.inputAssessment.signals?.thin?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-500 mb-1">Thin Signals:</p>
                  <ul className="text-sm text-muted-foreground">
                    {result.inputAssessment.signals.thin.map((s, i) => (
                      <li key={i}>- {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.researchResult && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Research Mode Activated</p>
                  <p className="text-sm text-muted-foreground">
                    Input was enriched with {result.researchResult.angles?.length || 0} angles.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ideas */}
      {result?.ideas && result.ideas.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Ideas ({result.ideas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {result.ideas.map((idea, idx) => (
                <div
                  key={idea.id || idx}
                  className={`p-4 rounded-lg border ${
                    result.selectedIdea?.id === idea.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRiskColor(idea.riskLevel)}>
                          {idea.riskLevel}
                        </Badge>
                        <Badge variant="outline">{idea.format}</Badge>
                        <Badge variant="outline">{idea.platform}</Badge>
                        {result.selectedIdea?.id === idea.id && (
                          <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                        )}
                      </div>
                      <p className="font-medium mb-1">{idea.angle}</p>
                      <p className="text-sm text-muted-foreground mb-2">{idea.whyInteresting}</p>
                      <p className="text-sm italic border-l-2 border-primary/50 pl-3">
                        &ldquo;{idea.hook}&rdquo;
                      </p>
                    </div>
                    {idea.saveWorthiness && (
                      <div className="text-right text-sm">
                        <p className="font-medium mb-1">Save Tests:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 justify-end">
                            {idea.saveWorthiness.passesReferenceTest ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs">Reference</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            {idea.saveWorthiness.passesFutureSelfTest ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs">Future-Self</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            {idea.saveWorthiness.passesScreenshotTest ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs">Screenshot</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Content */}
      {result?.content && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Generated Content
                <Badge variant="outline">{result.content.format}</Badge>
              </span>
              {result.content.copy.type === "carousel" && result.content.copy.slides && (
                <Button
                  onClick={handleGenerateImages}
                  disabled={imageLoading}
                  variant="outline"
                  size="sm"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Images...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Generate Images
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Image Error */}
            {imageError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {imageError}
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {result.content.copy.type === "single" && result.content.copy.text}
              {result.content.copy.type === "thread" &&
                result.content.copy.tweets?.map((t, i) => (
                  <div key={i} className="mb-4 pb-4 border-b border-border last:border-0">
                    <span className="text-muted-foreground">Tweet {i + 1}:</span>
                    <p className="mt-1">{t}</p>
                  </div>
                ))}
              {result.content.copy.type === "carousel" &&
                result.content.copy.slides?.map((s, i) => {
                  const slideImage = images.find(img => img.slideNumber === i + 1);
                  return (
                    <div key={i} className="mb-6 pb-6 border-b border-border last:border-0">
                      <div className="flex gap-4">
                        {/* Image Preview */}
                        <div className="w-[160px] h-[200px] shrink-0 bg-muted rounded-lg overflow-hidden relative">
                          {slideImage ? (
                            <Image
                              src={slideImage.imageUrl}
                              alt={`Slide ${i + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              {imageLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <ImageIcon className="w-8 h-8" />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Text Content */}
                        <div className="flex-1">
                          <span className="text-muted-foreground">Slide {i + 1}:</span>
                          <p className="mt-1 font-bold text-base">{s.headline}</p>
                          {s.body && <p className="mt-2 text-muted-foreground">{s.body}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Generated Images Gallery */}
            {images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Generated Carousel Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div key={img.slideNumber} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={img.imageUrl}
                        alt={`Slide ${img.slideNumber}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Slide {img.slideNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.content.selfAssessment && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.content.selfAssessment.saveWorthiness}</p>
                  <p className="text-xs text-muted-foreground">Save-worthy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.content.selfAssessment.voiceMatch}</p>
                  <p className="text-xs text-muted-foreground">Voice Match</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{result.content.selfAssessment.hookStrength}</p>
                  <p className="text-xs text-muted-foreground">Hook Strength</p>
                </div>
                <div className="text-center">
                  <Badge className={getRiskColor(result.content.selfAssessment.riskLevel)}>
                    {result.content.selfAssessment.riskLevel}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Risk Level</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Results */}
      {result?.audit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Content Audit
              {result.audit.aiPatterns.clean && result.audit.rhythm.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* AI Patterns */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  AI Pattern Check
                  {result.audit.aiPatterns.clean ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </h4>
                {result.audit.aiPatterns?.blacklistedWords?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-red-500">Blacklisted words:</p>
                    <p className="text-sm">{result.audit.aiPatterns.blacklistedWords.join(", ")}</p>
                  </div>
                )}
                {result.audit.aiPatterns?.blacklistedPhrases?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-red-500">Blacklisted phrases:</p>
                    <p className="text-sm">{result.audit.aiPatterns.blacklistedPhrases.join(", ")}</p>
                  </div>
                )}
                {result.audit.aiPatterns.deadHook && (
                  <div className="mb-2">
                    <p className="text-sm text-red-500">Dead hook detected:</p>
                    <p className="text-sm">{result.audit.aiPatterns.deadHook}</p>
                  </div>
                )}
                {result.audit.aiPatterns.clean && (
                  <p className="text-sm text-green-500">No AI patterns detected</p>
                )}
              </div>

              {/* Rhythm */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  Rhythm Check
                  {result.audit.rhythm.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </h4>
                <p className="text-sm">
                  Burstiness: <span className="font-mono">{result.audit.rhythm.burstiness.toFixed(2)}</span>
                  <span className="text-muted-foreground"> (target: &gt;0.3)</span>
                </p>
                <p className="text-sm">
                  Short punch ratio: <span className="font-mono">{(result.audit.rhythm.shortPunchRatio * 100).toFixed(0)}%</span>
                  <span className="text-muted-foreground"> (target: 15-40%)</span>
                </p>
                {result.audit.rhythm?.monotonousSequences?.length > 0 && (
                  <p className="text-sm text-yellow-500 mt-1">
                    {result.audit.rhythm.monotonousSequences.length} monotonous sequences found
                  </p>
                )}
              </div>

              {/* Save-worthiness */}
              <div>
                <h4 className="font-medium mb-2">Save-worthiness</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {result.audit.saveWorthiness.passesReferenceTest ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Reference Test</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.audit.saveWorthiness.passesFutureSelfTest ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Future-Self Test</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.audit.saveWorthiness.passesScreenshotTest ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Screenshot Test</span>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  Score: <span className="font-mono">{result.audit.saveWorthiness.score}/3</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {result?.error && (
        <Card className="mt-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{result.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
