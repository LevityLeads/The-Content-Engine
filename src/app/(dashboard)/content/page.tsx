"use client";

import { FileText, Eye, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Review, edit, and publish generated content
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">0 drafts</Badge>
          <Badge variant="outline">0 ready</Badge>
        </div>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No content yet</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Approve ideas to generate platform-specific content
          </p>
          <a href="/ideas">
            <Button variant="outline">Review Ideas</Button>
          </a>
        </CardContent>
      </Card>

      {/* Content will show cards like this when there's data */}
      <div className="hidden">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2">Twitter</Badge>
                <CardTitle className="text-lg">Generated post preview...</CardTitle>
              </div>
              <Badge variant="secondary">Draft</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm">Post content preview here...</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
