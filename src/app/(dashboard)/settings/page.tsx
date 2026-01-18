"use client";

import { Settings, Palette, Volume2, Link2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your brand, voice, and connected accounts
        </p>
      </div>

      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Brand Settings
          </CardTitle>
          <CardDescription>Basic information about your brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Brand Name</label>
            <Input defaultValue="My Brand" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              defaultValue="Default brand for content creation"
              className="mt-1"
            />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Voice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice & Tone
          </CardTitle>
          <CardDescription>
            Define how your content should sound across platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tone Keywords</label>
            <p className="text-xs text-muted-foreground mb-2">
              Words that describe your brand&apos;s voice
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>professional</Badge>
              <Badge>approachable</Badge>
              <Badge>witty</Badge>
              <Button variant="outline" size="sm">+ Add</Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Words to Avoid</label>
            <Textarea
              placeholder="Enter words your brand should never use, separated by commas..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Example Posts (Good)</label>
            <Textarea
              placeholder="Paste examples of posts that represent your ideal voice..."
              className="mt-1"
            />
          </div>
          <Button>Save Voice Settings</Button>
        </CardContent>
      </Card>

      {/* Visual Brand */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Visual Brand
          </CardTitle>
          <CardDescription>
            Colors and style for generated images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <div className="mt-1 flex gap-2">
                <Input type="color" defaultValue="#1a1a1a" className="h-10 w-14 p-1" />
                <Input defaultValue="#1a1a1a" className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Accent Color</label>
              <div className="mt-1 flex gap-2">
                <Input type="color" defaultValue="#3b82f6" className="h-10 w-14 p-1" />
                <Input defaultValue="#3b82f6" className="flex-1" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Image Style</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["minimalist", "photorealistic", "illustrated", "3d", "abstract"].map((style) => (
                <Badge
                  key={style}
                  variant={style === "minimalist" ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>
          <Button>Save Visual Settings</Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Social media accounts for publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { name: "X (Twitter)", connected: false },
              { name: "Instagram", connected: false },
              { name: "LinkedIn", connected: false },
            ].map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button variant={account.connected ? "outline" : "default"}>
                  {account.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Late.dev for secure OAuth connections
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            API keys for external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            API keys are configured via environment variables for security.
            Update your <code className="rounded bg-muted px-1">.env.local</code> file.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Anthropic (Claude)</span>
              <Badge variant="outline">Not configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Google (Gemini)</span>
              <Badge variant="outline">Not configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Late.dev</span>
              <Badge variant="outline">Not configured</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
