"use client";

import { useState } from "react";
import { Plus, FileText, Link2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InputType = "text" | "link" | "document";

export default function InputsPage() {
  const [inputType, setInputType] = useState<InputType>("text");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentInputs, setRecentInputs] = useState<Array<{
    id: string;
    type: InputType;
    preview: string;
    status: string;
    createdAt: Date;
  }>>([]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);

    // TODO: Submit to API
    // For now, just add to local state
    const newInput = {
      id: crypto.randomUUID(),
      type: inputType,
      preview: content.slice(0, 100) + (content.length > 100 ? "..." : ""),
      status: "pending",
      createdAt: new Date(),
    };

    setRecentInputs([newInput, ...recentInputs]);
    setContent("");
    setIsSubmitting(false);
  };

  const inputTypes = [
    { id: "text" as const, label: "Text", icon: FileText, description: "Paste text, ideas, or notes" },
    { id: "link" as const, label: "Link", icon: Link2, description: "Share a URL to extract content" },
    { id: "document" as const, label: "Document", icon: Upload, description: "Upload PDF, DOCX, or TXT" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inputs</h1>
        <p className="text-muted-foreground">
          Add raw content to transform into social media posts
        </p>
      </div>

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
            />
          )}

          {inputType === "link" && (
            <Input
              type="url"
              placeholder="https://example.com/article-to-summarize"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
            disabled={!content.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
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
                      <Badge variant="secondary" className="text-xs">
                        {input.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {input.preview}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {input.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recentInputs.length === 0 && (
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
