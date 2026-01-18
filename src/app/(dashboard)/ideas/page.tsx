"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Check, X, Pencil, MoreHorizontal, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, [filter]);

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const url = filter ? `/api/ideas?status=${filter}` : "/api/ideas";
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

        // If approved, generate content
        if (status === "approved") {
          setActionLoading(null);
          setGeneratingContent(id);
          setSuccessMessage("Idea approved! Generating content for all platforms...");

          const contentRes = await fetch("/api/content/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ideaId: id }),
          });

          const contentData = await contentRes.json();
          if (contentData.success) {
            setSuccessMessage(`Content generated for ${contentData.content?.length || 0} platforms! View in Content page.`);
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
          {ideas.map((idea) => (
            <Card key={idea.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {idea.angle}
                      </Badge>
                      {idea.target_platforms?.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
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
                      disabled={actionLoading === idea.id || generatingContent === idea.id}
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
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Approve & Generate
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
          ))}
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
