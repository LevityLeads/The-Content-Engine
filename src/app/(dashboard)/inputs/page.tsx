"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Link2, Upload, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/brand-context";

type InputType = "text" | "link" | "document";

interface InputRecord {
  id: string;
  type: InputType;
  raw_content: string;
  status: string;
  created_at: string;
}

export default function InputsPage() {
  const { selectedBrand } = useBrand();
  const [inputType, setInputType] = useState<InputType>("text");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentInputs, setRecentInputs] = useState<InputRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch recent inputs on mount and when brand changes
  useEffect(() => {
    fetchRecentInputs();
  }, [selectedBrand?.id]);

  const fetchRecentInputs = async () => {
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (selectedBrand?.id) params.set("brandId", selectedBrand.id);
      const res = await fetch(`/api/inputs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecentInputs(data.inputs || []);
      }
    } catch (err) {
      console.error("Error fetching inputs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Save the input
      const inputRes = await fetch("/api/inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: inputType, content, brandId: selectedBrand?.id }),
      });

      const inputData = await inputRes.json();

      if (!inputData.success) {
        throw new Error(inputData.error || "Failed to save input");
      }

      // Add to local state immediately
      setRecentInputs([inputData.input, ...recentInputs]);
      setContent("");
      setIsSubmitting(false);

      // Step 2: Generate ideas
      setIsGenerating(true);
      setSuccessMessage("Input saved! Generating ideas with AI...");

      const ideaRes = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputId: inputData.input.id }),
      });

      const ideaData = await ideaRes.json();

      if (ideaData.success) {
        // Update the input status in local state
        setRecentInputs((prev) =>
          prev.map((inp) =>
            inp.id === inputData.input.id ? { ...inp, status: "ideated" } : inp
          )
        );
        setSuccessMessage(
          `Generated ${ideaData.ideas?.length || 0} content ideas! Check the Ideas page.`
        );
      } else {
        // Input saved but idea generation failed
        setError(ideaData.error || "Ideas generated, but there was an issue. Check Ideas page.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false);
    }
  };

  const inputTypes = [
    { id: "text" as const, label: "Text", icon: FileText, description: "Paste text, ideas, or notes" },
    { id: "link" as const, label: "Link", icon: Link2, description: "Share a URL to extract content" },
    { id: "document" as const, label: "Document", icon: Upload, description: "Upload PDF, DOCX, or TXT" },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ideated":
        return "default";
      case "pending":
        return "secondary";
      case "processing":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inputs</h1>
        <p className="text-muted-foreground">
          Add raw content to transform into social media posts
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {successMessage}
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Input
          </CardTitle>
          <CardDescription>
            Paste text, share links, or upload documents to generate content ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Type Selector */}
          <div className="flex gap-2">
            {inputTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setInputType(type.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                  inputType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <type.icon className={cn(
                  "h-6 w-6",
                  inputType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  inputType === type.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          {/* Input Field */}
          {inputType === "text" && (
            <Textarea
              placeholder="Paste your ideas, notes, article excerpts, or any content you want to transform into social posts..."
              className="min-h-[200px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting || isGenerating}
            />
          )}

          {inputType === "link" && (
            <Input
              type="url"
              placeholder="https://example.com/article-to-summarize"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting || isGenerating}
            />
          )}

          {inputType === "document" && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                Drag and drop a file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, DOC, TXT, or MD (max 10MB)
              </p>
              <Input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                className="mt-4 max-w-xs"
                disabled={isSubmitting || isGenerating}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setContent(file.name);
                }}
              />
            </div>
          )}

          {/* Character Count for Text */}
          {inputType === "text" && content && (
            <p className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} characters
            </p>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || isGenerating}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving input...
              </>
            ) : isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating ideas with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Add Input & Generate Ideas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Inputs */}
      {recentInputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Inputs</CardTitle>
            <CardDescription>
              Your recently added content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInputs.map((input) => (
                <div
                  key={input.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {input.type === "text" && <FileText className="h-4 w-4 text-muted-foreground" />}
                      {input.type === "link" && <Link2 className="h-4 w-4 text-muted-foreground" />}
                      {input.type === "document" && <Upload className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium capitalize">{input.type}</span>
                      <Badge variant={getStatusBadgeVariant(input.status)} className="text-xs">
                        {input.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {input.raw_content?.slice(0, 150)}
                      {(input.raw_content?.length || 0) > 150 ? "..." : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(input.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading inputs...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && recentInputs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No inputs yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Add your first input above to start generating content ideas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
