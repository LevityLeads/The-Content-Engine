"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileType,
  X,
  ChevronRight,
  Lightbulb,
  Plus,
  Minus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/brand-context";

type InputType = "text" | "link" | "document" | "image";

interface RecentInput {
  id: string;
  type: string;
  raw_content: string;
  status: string;
  created_at: string;
}

const inputTypeConfig: Record<
  InputType,
  { icon: React.ReactNode; label: string; description: string; color: string }
> = {
  text: {
    icon: <FileText className="h-5 w-5" />,
    label: "Text",
    description: "Paste text, notes, or ideas",
    color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  },
  link: {
    icon: <LinkIcon className="h-5 w-5" />,
    label: "Link",
    description: "URL to analyze",
    color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  },
  document: {
    icon: <FileType className="h-5 w-5" />,
    label: "Document",
    description: "Upload PDF, DOCX, TXT",
    color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  },
  image: {
    icon: <ImageIcon className="h-5 w-5" />,
    label: "Image",
    description: "Upload image to analyze",
    color: "text-pink-400 bg-pink-500/20 border-pink-500/30",
  },
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function InputsPage() {
  const router = useRouter();
  const { selectedBrand } = useBrand();
  const [inputType, setInputType] = useState<InputType>("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [recentInputs, setRecentInputs] = useState<RecentInput[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [ideaCount, setIdeaCount] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // CRITICAL: Only fetch when we have a selected brand to prevent cross-brand contamination
    if (!selectedBrand?.id) {
      setRecentInputs([]);
      setIsLoadingRecent(false);
      return;
    }
    fetchRecentInputs();
  }, [selectedBrand?.id]);

  const fetchRecentInputs = async () => {
    // Guard: Don't fetch without a brand ID - prevents cross-brand data leakage
    if (!selectedBrand?.id) {
      setRecentInputs([]);
      return;
    }

    try {
      setIsLoadingRecent(true);
      const params = new URLSearchParams({ limit: "10" });
      params.set("brandId", selectedBrand.id);
      const res = await fetch(`/api/inputs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecentInputs(data.inputs || []);
      }
    } catch (err) {
      console.error("Error fetching recent inputs:", err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // For document types
    if (inputType === "document") {
      setFile(selectedFile);
      // Read text content from the file
      if (
        selectedFile.type === "text/plain" ||
        selectedFile.name.endsWith(".txt") ||
        selectedFile.name.endsWith(".md")
      ) {
        const text = await selectedFile.text();
        setContent(text);
      } else {
        // For PDF/DOCX, we'd need backend processing
        setContent(`[File: ${selectedFile.name}]\n\nDocument content will be extracted during processing.`);
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setMessage({
        type: "error",
        text: "Please upload a JPEG, PNG, GIF, or WebP image",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image must be less than 10MB",
      });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Analyze the image
    setIsAnalyzingImage(true);
    try {
      const base64Reader = new FileReader();
      base64Reader.onload = async () => {
        const base64Data = (base64Reader.result as string).split(",")[1];

        const res = await fetch("/api/inputs/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: base64Data,
            mediaType: selectedFile.type,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setContent(data.analysis);
        } else {
          setMessage({ type: "error", text: data.error || "Failed to analyze image" });
        }
        setIsAnalyzingImage(false);
      };
      base64Reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setMessage({ type: "error", text: "Failed to analyze image" });
      setIsAnalyzingImage(false);
    }
  };

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

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    // Check if it's an image
    if (droppedFile.type.startsWith("image/")) {
      setInputType("image");
      // Trigger image handling
      const input = imageInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleImageChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    } else if (
      droppedFile.type === "application/pdf" ||
      droppedFile.type.includes("document") ||
      droppedFile.name.endsWith(".txt") ||
      droppedFile.name.endsWith(".md")
    ) {
      setInputType("document");
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }, [handleImageChange, handleFileChange]);

  const clearInput = () => {
    setContent("");
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) {
      setMessage({ type: "error", text: "Please provide some content" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Step 1: Create the input
      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: inputType,
          content: content,
          brandId: selectedBrand?.id,
        }),
      });

      const inputData = await inputRes.json();
      if (!inputData.success) {
        throw new Error(inputData.error || "Failed to save input");
      }

      // Step 2: Generate ideas with custom count
      setMessage({ type: "success", text: `Input saved! Generating ${ideaCount} ideas...` });

      const ideasRes = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputId: inputData.input.id,
          ideaCount: ideaCount,
        }),
      });

      const ideasData = await ideasRes.json();
      if (ideasData.success) {
        setMessage({
          type: "success",
          text: `Generated ${ideasData.ideas?.length || ideaCount} ideas! Redirecting to Ideas page...`,
        });
        setTimeout(() => {
          router.push("/ideas?status=pending");
        }, 1500);
      } else {
        setMessage({
          type: "error",
          text: ideasData.error || "Failed to generate ideas",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = content.trim().length > 0 || file !== null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Add Content Input</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Transform your raw content into engaging social media ideas
        </p>
      </div>

      {/* Main Input Card */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all",
          isDragging && "ring-2 ring-primary ring-offset-2"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-lg font-medium">Drop your file here</p>
              <p className="text-sm text-muted-foreground">
                Images, PDFs, or text files
              </p>
            </div>
          </div>
        )}

        <CardContent className="p-4 md:p-6">
          {/* Input Type Selector - Grid on mobile, flex on desktop */}
          <div className="grid grid-cols-4 gap-2 md:flex md:gap-2 mb-4 md:mb-6">
            {(Object.keys(inputTypeConfig) as InputType[]).map((type) => {
              const config = inputTypeConfig[type];
              const isActive = inputType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setInputType(type);
                    clearInput();
                  }}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2.5 rounded-lg border-2 transition-all min-h-[60px] md:min-h-0",
                    isActive
                      ? config.color + " border-current"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted active:bg-muted/80"
                  )}
                >
                  {config.icon}
                  <div className="text-center md:text-left">
                    <p className="font-medium text-xs md:text-sm">{config.label}</p>
                    <p className="text-xs opacity-70 hidden md:block">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            {/* Text Input */}
            {inputType === "text" && (
              <div className="relative">
                <Textarea
                  placeholder="Paste your content here... articles, notes, transcripts, ideas - anything that could become great social content."
                  className="min-h-[120px] md:min-h-[200px] resize-y text-base leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {content.length.toLocaleString()} characters
                </div>
              </div>
            )}

            {/* Link Input */}
            {inputType === "link" && (
              <div className="space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    className="pl-10 h-12 text-base"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a URL to an article, blog post, or webpage. We&apos;ll
                  extract the content for idea generation.
                </p>
              </div>
            )}

            {/* Document Upload */}
            {inputType === "document" && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {!file ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOCX, TXT, or Markdown (max 10MB)
                    </p>
                  </button>
                ) : (
                  <div className="border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-amber-500/20">
                        <FileType className="h-6 w-6 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearInput}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {content && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50 max-h-[200px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">
                          {content.slice(0, 500)}
                          {content.length > 500 && "..."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Image Upload */}
            {inputType === "image" && (
              <div className="space-y-4">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {!imagePreview ? (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-pink-500/50 hover:bg-pink-500/5 transition-all"
                  >
                    <ImageIcon className="h-10 w-10 mx-auto mb-3 text-pink-400" />
                    <p className="font-medium mb-1">
                      Click to upload an image
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPEG, PNG, GIF, or WebP (max 10MB)
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      AI will analyze the image and generate content ideas
                    </p>
                  </button>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="relative aspect-video bg-black/50">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearInput}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {isAnalyzingImage && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-pink-400" />
                            <p className="text-sm text-white">
                              Analyzing image...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {content && !isAnalyzingImage && (
                      <div className="p-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-pink-400" />
                          <span className="text-sm font-medium">
                            AI Analysis
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                          {content.slice(0, 800)}
                          {content.length > 800 && "..."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Idea Count Selector */}
          <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-muted/30 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                <span className="font-medium text-sm md:text-base">Ideas to Generate</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8"
                  onClick={() => setIdeaCount(Math.max(1, ideaCount - 1))}
                  disabled={ideaCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 md:w-12 text-center text-lg md:text-xl font-bold">
                  {ideaCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8"
                  onClick={() => setIdeaCount(Math.min(10, ideaCount + 1))}
                  disabled={ideaCount >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Slider
              value={[ideaCount]}
              onValueChange={([value]) => setIdeaCount(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="hidden md:flex justify-between mt-2 text-xs text-muted-foreground">
              <span>1 idea</span>
              <span>Quick (1-3)</span>
              <span>Standard (4-6)</span>
              <span>Deep dive (7-10)</span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={cn(
                "mt-4 p-4 rounded-lg flex items-center gap-2",
                message.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-4 md:mt-6">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading || isAnalyzingImage}
              className="w-full md:w-auto md:ml-auto md:flex px-8 min-h-[48px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate {ideaCount} Ideas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Inputs */}
      <Card>
        <CardHeader className="pb-3 p-4 md:p-6 md:pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            Recent Inputs
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Your latest content submissions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {isLoadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentInputs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No inputs yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first content above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInputs.map((input) => {
                const typeConfig = inputTypeConfig[input.type as InputType] || inputTypeConfig.text;
                return (
                  <div
                    key={input.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        typeConfig.color
                      )}
                    >
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {input.raw_content.slice(0, 60)}
                        {input.raw_content.length > 60 && "..."}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            input.status === "ideated"
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-yellow-400 border-yellow-500/30"
                          )}
                        >
                          {input.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(input.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
