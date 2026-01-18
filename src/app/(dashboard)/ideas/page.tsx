"use client";

import { Lightbulb, Check, X, Pencil, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Placeholder data - will be replaced with real data from Supabase
const mockIdeas = [
  {
    id: "1",
    concept: "5 AI tools that actually save me time (not just hype)",
    angle: "educational",
    targetPlatforms: ["twitter", "linkedin"],
    keyPoints: [
      "Tool #1: Claude for ideation and writing",
      "Tool #2: Notion AI for organization",
      "Tool #3: Descript for audio/video",
    ],
    potentialHooks: ["I've tested 50+ AI tools. Here are the 5 I actually use daily..."],
    confidenceScore: 85,
    status: "pending",
  },
  {
    id: "2",
    concept: "The counterintuitive truth about productivity systems",
    angle: "conversational",
    targetPlatforms: ["twitter", "instagram"],
    keyPoints: [
      "Most systems fail because they're too complex",
      "The best system is the one you'll actually use",
      "Start with one habit, not ten",
    ],
    potentialHooks: ["Everyone told me I needed a complex productivity system. They were wrong."],
    confidenceScore: 72,
    status: "pending",
  },
];

export default function IdeasPage() {
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
        <Badge variant="outline" className="text-sm">
          {mockIdeas.filter(i => i.status === "pending").length} pending
        </Badge>
      </div>

      {/* Ideas List */}
      <div className="space-y-4">
        {mockIdeas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {idea.angle}
                    </Badge>
                    <div className="flex gap-1">
                      {idea.targetPlatforms.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="mt-2 text-lg">{idea.concept}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{idea.confidenceScore}%</p>
                    <p className="text-xs text-muted-foreground">confidence</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Points */}
              <div>
                <p className="mb-2 text-sm font-medium">Key Points</p>
                <ul className="space-y-1">
                  {idea.keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hook */}
              <div>
                <p className="mb-2 text-sm font-medium">Suggested Hook</p>
                <p className="text-sm italic text-muted-foreground">
                  &ldquo;{idea.potentialHooks[0]}&rdquo;
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button className="flex-1" variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="outline" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockIdeas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No ideas yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Add inputs to generate content ideas
            </p>
            <a href="/inputs">
              <Button variant="outline">Add Input</Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
