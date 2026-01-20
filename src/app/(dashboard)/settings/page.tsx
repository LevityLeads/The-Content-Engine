"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Palette, Volume2, Link2, Bell, Save, Loader2, AlertCircle, Check, Globe, RefreshCw, Sparkles, ExternalLink, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useBrand, VoiceConfig, VisualConfig } from "@/contexts/brand-context";
import { StrictnessSlider } from "@/components/brand/strictness-slider";

// Platform configuration
const PLATFORMS = [
  { id: "twitter", name: "X (Twitter)", icon: "𝕏" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "linkedin", name: "LinkedIn", icon: "in" },
] as const;

interface SocialAccount {
  id: string;
  brand_id: string;
  platform: string;
  platform_username: string | null;
  late_account_id: string | null;
  is_active: boolean;
  profile_image_url?: string;
}

// Wrapper component with Suspense for useSearchParams
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const { selectedBrand, updateBrand, isLoading: brandLoading } = useBrand();
  const searchParams = useSearchParams();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({});
  const [visualConfig, setVisualConfig] = useState<VisualConfig>({});
  const [newKeyword, setNewKeyword] = useState("");
  const [newAvoidWord, setNewAvoidWord] = useState("");

  // Re-analyze state
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Social accounts state
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle OAuth callback messages from URL params
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      setSaveMessage({ type: "success", text: success });
      // Clear URL params without refresh
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setSaveMessage(null), 5000);
    } else if (error) {
      setSaveMessage({ type: "error", text: error });
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setSaveMessage(null), 5000);
    }
  }, [searchParams]);

  // Fetch social accounts
  const fetchSocialAccounts = useCallback(async () => {
    if (!selectedBrand?.id) return;

    setLoadingAccounts(true);
    try {
      const res = await fetch(`/api/social-accounts?brandId=${selectedBrand.id}`);
      const data = await res.json();
      if (data.success) {
        setSocialAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Error fetching social accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [selectedBrand?.id]);

  // Load brand data when selected brand changes
  useEffect(() => {
    if (selectedBrand) {
      setName(selectedBrand.name);
      setDescription(selectedBrand.description || "");
      setVoiceConfig(selectedBrand.voice_config || {});
      setVisualConfig(selectedBrand.visual_config || {});
      // Pre-fill analyze URL with existing source URL if available
      setAnalyzeUrl(selectedBrand.voice_config?.source_url || "");
      // Fetch social accounts for this brand
      fetchSocialAccounts();
    }
  }, [selectedBrand, fetchSocialAccounts]);

  const handleSave = async (section: "brand" | "voice" | "visual") => {
    if (!selectedBrand) return;

    setIsSaving(true);
    setSaveMessage(null);

    let updates = {};
    switch (section) {
      case "brand":
        updates = { name, description };
        break;
      case "voice":
        updates = { voice_config: voiceConfig };
        break;
      case "visual":
        updates = { visual_config: visualConfig };
        break;
    }

    const result = await updateBrand(selectedBrand.id, updates);

    if (result) {
      setSaveMessage({ type: "success", text: "Settings saved!" });
    } else {
      setSaveMessage({ type: "error", text: "Failed to save settings" });
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const addToneKeyword = () => {
    if (newKeyword && !voiceConfig.tone_keywords?.includes(newKeyword)) {
      setVoiceConfig({
        ...voiceConfig,
        tone_keywords: [...(voiceConfig.tone_keywords || []), newKeyword],
      });
      setNewKeyword("");
    }
  };

  const removeToneKeyword = (keyword: string) => {
    setVoiceConfig({
      ...voiceConfig,
      tone_keywords: voiceConfig.tone_keywords?.filter((k) => k !== keyword) || [],
    });
  };

  const addAvoidWord = () => {
    if (newAvoidWord && !voiceConfig.words_to_avoid?.includes(newAvoidWord)) {
      setVoiceConfig({
        ...voiceConfig,
        words_to_avoid: [...(voiceConfig.words_to_avoid || []), newAvoidWord],
      });
      setNewAvoidWord("");
    }
  };

  const removeAvoidWord = (word: string) => {
    setVoiceConfig({
      ...voiceConfig,
      words_to_avoid: voiceConfig.words_to_avoid?.filter((w) => w !== word) || [],
    });
  };

  const handleReanalyze = async () => {
    if (!analyzeUrl.trim() || !selectedBrand) return;

    setIsAnalyzing(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/brands/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analyzeUrl.trim() }),
      });

      const data = await res.json();

      if (data.success && data.analysis) {
        // Preserve existing strictness setting
        const currentStrictness = voiceConfig.strictness ?? 0.7;

        // Update local state with new analysis
        const newVoiceConfig: VoiceConfig = {
          tone_keywords: data.analysis.voice.tone_keywords || [],
          words_to_avoid: data.analysis.voice.words_to_avoid || [],
          strictness: currentStrictness,
          source_url: analyzeUrl.trim(),
          extracted_voice: {
            tone_description: data.analysis.voice.writing_style,
            messaging_themes: data.analysis.voice.messaging_themes,
            writing_style: data.analysis.voice.writing_style,
          },
        };

        const newVisualConfig: VisualConfig = {
          primary_color: data.analysis.visual.primary_color,
          secondary_color: data.analysis.visual.secondary_color,
          accent_color: data.analysis.visual.accent_color,
          image_style: data.analysis.visual.image_style,
          color_palette: data.analysis.visual.color_palette,
          extracted_images: data.analysis.visual.sample_images,
        };

        setVoiceConfig(newVoiceConfig);
        setVisualConfig(newVisualConfig);
        setDescription(data.analysis.summary || description);

        // Save to database
        const result = await updateBrand(selectedBrand.id, {
          description: data.analysis.summary || description,
          voice_config: newVoiceConfig,
          visual_config: newVisualConfig,
        });

        if (result) {
          setSaveMessage({ type: "success", text: "Brand re-analyzed and updated!" });
        } else {
          setSaveMessage({ type: "error", text: "Analysis succeeded but failed to save" });
        }
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to analyze website" });
      }
    } catch (err) {
      console.error("Error re-analyzing:", err);
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Connect a social account - opens Late.dev dashboard for OAuth
  const handleConnectAccount = async (platform: string) => {
    if (!selectedBrand?.id) {
      setSaveMessage({ type: "error", text: "Please select a client first" });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    // Open Late.dev dashboard to connect the account
    // After connecting there, the account will appear when we sync
    window.open("https://getlate.dev/dashboard", "_blank");

    setSaveMessage({
      type: "success",
      text: `Connect your ${platform} account in Late.dev, then click "Sync Accounts" below.`
    });
    setTimeout(() => setSaveMessage(null), 10000);
  };

  // Sync accounts from Late.dev
  const handleSyncAccounts = async () => {
    if (!selectedBrand?.id) return;

    setLoadingAccounts(true);
    setSaveMessage(null);

    try {
      // First, get accounts from Late.dev
      const lateRes = await fetch("/api/social-accounts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand.id }),
      });

      const data = await lateRes.json();

      if (data.success) {
        setSocialAccounts(data.accounts || []);
        if (data.newAccounts > 0) {
          setSaveMessage({ type: "success", text: `Synced ${data.newAccounts} new account(s) from Late.dev` });
        } else {
          setSaveMessage({ type: "success", text: "Accounts are up to date" });
        }
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to sync accounts" });
      }
    } catch (err) {
      console.error("Error syncing accounts:", err);
      setSaveMessage({ type: "error", text: "Failed to sync with Late.dev" });
    } finally {
      setLoadingAccounts(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Disconnect a social account
  const handleDisconnectAccount = async (accountId: string) => {
    setDisconnectingId(accountId);
    try {
      const res = await fetch(`/api/social-accounts/${accountId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setSocialAccounts((prev) => prev.filter((a) => a.id !== accountId));
        setSaveMessage({ type: "success", text: "Account disconnected" });
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to disconnect" });
      }
    } catch (err) {
      console.error("Error disconnecting account:", err);
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setDisconnectingId(null);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Helper to check if a platform is connected
  const getConnectedAccount = (platformId: string) => {
    return socialAccounts.find((a) => a.platform === platformId && a.is_active);
  };

  if (brandLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedBrand) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your brand, voice, and connected accounts
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Client Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a client from the sidebar or add a new one to configure settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure {selectedBrand.name}&apos;s brand, voice, and connected accounts
          </p>
        </div>
        {saveMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              saveMessage.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {saveMessage.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {saveMessage.text}
          </div>
        )}
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          {voiceConfig.source_url && (
            <div>
              <label className="text-sm font-medium">Source Website</label>
              <p className="text-sm text-muted-foreground mt-1">{voiceConfig.source_url}</p>
            </div>
          )}
          <Button onClick={() => handleSave("brand")} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Re-analyze Website */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyze Website
          </CardTitle>
          <CardDescription>
            Extract or refresh brand voice and visual style from a website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Website URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://yourwebsite.com"
                  value={analyzeUrl}
                  onChange={(e) => setAnalyzeUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleReanalyze} disabled={isAnalyzing || !analyzeUrl.trim()}>
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isAnalyzing ? "Analyzing..." : voiceConfig.source_url ? "Re-analyze" : "Analyze"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              AI will extract colors, brand voice, tone keywords, and visual style from this website.
              {voiceConfig.source_url && (
                <span className="block mt-1">
                  Last analyzed: <span className="text-foreground">{voiceConfig.source_url}</span>
                </span>
              )}
            </p>
          </div>
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
          {/* Brand Strictness */}
          <StrictnessSlider
            value={voiceConfig.strictness ?? 0.7}
            onChange={(value) => setVoiceConfig({ ...voiceConfig, strictness: value })}
          />

          <div>
            <label className="text-sm font-medium">Tone Keywords</label>
            <p className="text-xs text-muted-foreground mb-2">
              Words that describe your brand&apos;s voice (click to remove)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {voiceConfig.tone_keywords?.map((keyword) => (
                <Badge
                  key={keyword}
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => removeToneKeyword(keyword)}
                >
                  {keyword}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addToneKeyword()}
              />
              <Button variant="outline" size="sm" onClick={addToneKeyword}>
                Add
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Words to Avoid</label>
            <p className="text-xs text-muted-foreground mb-2">
              Words your brand should never use (click to remove)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {voiceConfig.words_to_avoid?.map((word) => (
                <Badge
                  key={word}
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => removeAvoidWord(word)}
                >
                  {word}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAvoidWord}
                onChange={(e) => setNewAvoidWord(e.target.value)}
                placeholder="Add word to avoid..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addAvoidWord()}
              />
              <Button variant="outline" size="sm" onClick={addAvoidWord}>
                Add
              </Button>
            </div>
          </div>

          {voiceConfig.extracted_voice?.writing_style && (
            <div>
              <label className="text-sm font-medium">Writing Style</label>
              <p className="text-sm text-muted-foreground mt-1">
                {voiceConfig.extracted_voice.writing_style}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Example Posts (Good)</label>
            <Textarea
              value={voiceConfig.example_posts?.join("\n\n") || ""}
              onChange={(e) =>
                setVoiceConfig({
                  ...voiceConfig,
                  example_posts: e.target.value.split("\n\n").filter(Boolean),
                })
              }
              placeholder="Paste examples of posts that represent your ideal voice..."
              className="mt-1"
              rows={4}
            />
          </div>
          <Button onClick={() => handleSave("voice")} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Voice Settings
          </Button>
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
                <input
                  type="color"
                  value={visualConfig.primary_color || "#1a1a1a"}
                  onChange={(e) =>
                    setVisualConfig({ ...visualConfig, primary_color: e.target.value })
                  }
                  className="h-10 w-14 p-1 rounded cursor-pointer"
                />
                <Input
                  value={visualConfig.primary_color || "#1a1a1a"}
                  onChange={(e) =>
                    setVisualConfig({ ...visualConfig, primary_color: e.target.value })
                  }
                  className="flex-1 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Accent Color</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={visualConfig.accent_color || "#3b82f6"}
                  onChange={(e) =>
                    setVisualConfig({ ...visualConfig, accent_color: e.target.value })
                  }
                  className="h-10 w-14 p-1 rounded cursor-pointer"
                />
                <Input
                  value={visualConfig.accent_color || "#3b82f6"}
                  onChange={(e) =>
                    setVisualConfig({ ...visualConfig, accent_color: e.target.value })
                  }
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          {visualConfig.color_palette && visualConfig.color_palette.length > 0 && (
            <div>
              <label className="text-sm font-medium">Extracted Color Palette</label>
              <div className="mt-2 flex gap-2">
                {visualConfig.color_palette.map((color, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{color}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Image Style</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["minimalist", "photorealistic", "illustrated", "3d", "abstract", "bold", "elegant"].map((style) => (
                <Badge
                  key={style}
                  variant={visualConfig.image_style === style ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setVisualConfig({ ...visualConfig, image_style: style })}
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>

          {visualConfig.extracted_images && visualConfig.extracted_images.length > 0 && (
            <div>
              <label className="text-sm font-medium">Extracted Images</label>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {visualConfig.extracted_images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Sample ${i + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                ))}
              </div>
            </div>
          )}

          <Button onClick={() => handleSave("visual")} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Visual Settings
          </Button>
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
            Social media accounts for publishing via Late.dev
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {PLATFORMS.map((platform) => {
                const connectedAccount = getConnectedAccount(platform.id);
                const isConnecting = connectingPlatform === platform.id;
                const isDisconnecting = disconnectingId === connectedAccount?.id;

                return (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                        {connectedAccount?.profile_image_url ? (
                          <img
                            src={connectedAccount.profile_image_url}
                            alt={platform.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          platform.icon
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        {connectedAccount ? (
                          <p className="text-xs text-emerald-500 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {connectedAccount.platform_username
                              ? `@${connectedAccount.platform_username}`
                              : "Connected"}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {connectedAccount ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectAccount(connectedAccount.id)}
                        disabled={isDisconnecting}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="mr-2 h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectAccount(platform.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Connect accounts in Late.dev dashboard, then sync here.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAccounts}
              disabled={loadingAccounts}
            >
              {loadingAccounts ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Accounts
            </Button>
          </div>
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
              <Badge variant="outline">Configured</Badge>
            </div>
            <div className="flex justify-between">
              <span>Google (Gemini)</span>
              <Badge variant="outline">Configured</Badge>
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
