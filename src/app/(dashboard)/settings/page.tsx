"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Palette, Volume2, Link2, Bell, Save, Loader2, AlertCircle, Check, Globe, RefreshCw, Sparkles, ExternalLink, Unlink, X, Video, DollarSign, Upload, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useBrand, VoiceConfig, VisualConfig, BrandDefaultStyle, ApprovedStyle } from "@/contexts/brand-context";
import { StrictnessSlider } from "@/components/brand/strictness-slider";
import { BrandDeletionDialog } from "@/components/brand/brand-deletion-dialog";
import { StylePickerDialog } from "@/components/brand/style-picker-dialog";
import { type BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";
import { VIDEO_MODELS, type VideoModelKey } from "@/lib/video-models";
import { formatCost } from "@/lib/video-utils";

// Platform configuration
const PLATFORMS = [
  { id: "twitter", name: "X (Twitter)", icon: "𝕏" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "linkedin", name: "LinkedIn", icon: "in" },
  { id: "facebook", name: "Facebook", icon: "f" },
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

interface LateAccount {
  id: string;
  platform: string;
  username: string;
  profileImageUrl?: string;
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

  // Available Late.dev accounts for selection
  const [availableLateAccounts, setAvailableLateAccounts] = useState<LateAccount[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState<string | null>(null); // platform id

  // Video config state
  const [videoConfig, setVideoConfig] = useState<BrandVideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [videoUsage, setVideoUsage] = useState<{ monthly: { spent: number; budget: number | null } } | null>(null);
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Example posts state
  const [examplePosts, setExamplePosts] = useState<string[]>([]);
  const [isAnalyzingVisuals, setIsAnalyzingVisuals] = useState(false);

  // Style picker state
  const [showStylePicker, setShowStylePicker] = useState(false);

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

  // Fetch video usage and config
  const fetchVideoUsage = useCallback(async () => {
    if (!selectedBrand?.id) return;
    try {
      const res = await fetch(`/api/videos/usage?brandId=${selectedBrand.id}`);
      const data = await res.json();
      if (data.success) {
        setVideoConfig(data.config || DEFAULT_VIDEO_CONFIG);
        setVideoUsage(data.usage || null);
      }
    } catch (err) {
      console.error("Error fetching video usage:", err);
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
      // Load example posts if they exist
      setExamplePosts(selectedBrand.visual_config?.example_posts || []);
      // Fetch social accounts for this brand
      fetchSocialAccounts();
      // Fetch video usage and config
      fetchVideoUsage();
    }
  }, [selectedBrand, fetchSocialAccounts, fetchVideoUsage]);

  // Save video config
  const handleSaveVideoConfig = async () => {
    if (!selectedBrand?.id) return;
    setIsSavingVideo(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/videos/usage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand.id, videoConfig }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: "success", text: "Video settings saved!" });
        setVideoConfig(data.videoConfig);
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to save video settings" });
      }
    } catch (err) {
      console.error("Error saving video config:", err);
      setSaveMessage({ type: "error", text: "Failed to save video settings" });
    } finally {
      setIsSavingVideo(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

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

  // Handle example post image upload
  const handleExamplePostUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxPosts = 3;
    const remainingSlots = maxPosts - examplePosts.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newPosts: string[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newPosts.push(base64);
    }

    setExamplePosts((prev) => [...prev, ...newPosts].slice(0, maxPosts));
    // Reset the file input
    e.target.value = "";
  };

  // Remove an example post
  const handleRemoveExamplePost = (index: number) => {
    setExamplePosts((prev) => prev.filter((_, i) => i !== index));
  };

  // Analyze example posts with AI to generate master brand prompt
  const handleAnalyzeExamplePosts = async () => {
    if (examplePosts.length === 0 || !selectedBrand) return;

    setIsAnalyzingVisuals(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/brands/analyze-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: examplePosts }),
      });

      const data = await res.json();

      if (data.success && data.analysis) {
        // Update visual config with example posts and master prompt
        const updatedVisualConfig: VisualConfig = {
          ...visualConfig,
          example_posts: examplePosts,
          master_brand_prompt: data.analysis.master_brand_prompt,
          // Optionally update colors if detected
          ...(data.analysis.colors?.primary && { primary_color: data.analysis.colors.primary }),
          ...(data.analysis.colors?.accent && { accent_color: data.analysis.colors.accent }),
        };

        setVisualConfig(updatedVisualConfig);

        // Save to database
        const result = await updateBrand(selectedBrand.id, {
          visual_config: updatedVisualConfig,
        });

        if (result) {
          setSaveMessage({ type: "success", text: "Visual brand analyzed! Master prompt generated." });
        } else {
          setSaveMessage({ type: "error", text: "Analysis succeeded but failed to save" });
        }
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to analyze images" });
      }
    } catch (err) {
      console.error("Error analyzing example posts:", err);
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsAnalyzingVisuals(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Fetch available Late.dev accounts for a platform
  const handleConnectAccount = async (platform: string) => {
    if (!selectedBrand?.id) {
      setSaveMessage({ type: "error", text: "Please select a client first" });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    setConnectingPlatform(platform);

    try {
      // Fetch available accounts from Late.dev
      const res = await fetch("/api/social-accounts/available");
      const data = await res.json();

      console.log("Available accounts response:", data);

      if (data.success && data.accounts) {
        // Case-insensitive platform comparison (Late.dev may return "Instagram" vs "instagram")
        const platformAccounts = data.accounts.filter(
          (a: LateAccount) => a.platform?.toLowerCase() === platform.toLowerCase()
        );

        console.log(`Found ${platformAccounts.length} ${platform} accounts:`, platformAccounts);

        if (platformAccounts.length === 0) {
          // No accounts for this platform - open Late.dev dashboard
          window.open("https://getlate.dev/dashboard", "_blank");
          setSaveMessage({
            type: "success",
            text: `No ${platform} accounts found in Late.dev. Connect one there, then click "Sync Accounts".`
          });
          setTimeout(() => setSaveMessage(null), 10000);
        } else if (platformAccounts.length === 1) {
          // Only one account - link it directly
          await linkAccount(platformAccounts[0]);
        } else {
          // Multiple accounts - show picker
          setAvailableLateAccounts(platformAccounts);
          setShowAccountPicker(platform);
        }
      } else {
        console.error("Failed to fetch accounts:", data);
        setSaveMessage({ type: "error", text: data.error || "Failed to fetch accounts from Late.dev" });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setSaveMessage({ type: "error", text: "Failed to fetch accounts from Late.dev" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setConnectingPlatform(null);
    }
  };

  // Link a specific Late.dev account to this brand
  const linkAccount = async (lateAccount: LateAccount) => {
    if (!selectedBrand?.id) return;

    setShowAccountPicker(null);
    setLoadingAccounts(true);

    const payload = {
      brandId: selectedBrand.id,
      lateAccountId: lateAccount.id,
      platform: lateAccount.platform,
      username: lateAccount.username,
    };

    console.log("Linking account with payload:", payload);

    try {
      const res = await fetch("/api/social-accounts/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Link response:", res.status, data);

      if (data.success) {
        setSocialAccounts((prev) => [...prev.filter(a => a.platform?.toLowerCase() !== lateAccount.platform?.toLowerCase()), data.account]);
        setSaveMessage({ type: "success", text: `Connected @${lateAccount.username}` });
      } else {
        setSaveMessage({ type: "error", text: data.error || "Failed to link account" });
      }
    } catch (err) {
      console.error("Error linking account:", err);
      setSaveMessage({ type: "error", text: "Failed to link account" });
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

  // Sync accounts - just refreshes the list of connected accounts for this brand
  const handleSyncAccounts = async () => {
    if (!selectedBrand?.id) return;

    setLoadingAccounts(true);
    try {
      const res = await fetch("/api/social-accounts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrand.id }),
      });

      const data = await res.json();

      if (data.success) {
        setSocialAccounts(data.accounts || []);
        setSaveMessage({
          type: "success",
          text: `Synced ${data.accounts?.length || 0} account(s)`,
        });
      } else {
        setSaveMessage({ type: "error", text: data.error || "Sync failed" });
      }
    } catch (err) {
      console.error("Error syncing accounts:", err);
      setSaveMessage({ type: "error", text: "Failed to sync accounts" });
    } finally {
      setLoadingAccounts(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  // Helper to check if a platform is connected
  // Must have platform match, is_active=true, AND a valid late_account_id
  // (without late_account_id, publishing will fail even if UI shows "connected")
  const getConnectedAccount = (platformId: string) => {
    return socialAccounts.find((a) => a.platform === platformId && a.is_active && a.late_account_id);
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

          {/* Brand Fonts */}
          <div>
            <label className="text-sm font-medium">Brand Fonts</label>
            {visualConfig.fonts?.heading || visualConfig.fonts?.body ? (
              <p className="text-xs text-muted-foreground mb-2">
                Detected from your website - used for carousel text overlays
              </p>
            ) : (
              <div className="mt-2 mb-3 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10">
                <p className="text-sm text-amber-200 font-medium">Fonts not detected</p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Your website uses custom or proprietary fonts that couldn&apos;t be automatically detected.
                  Please enter your brand fonts manually below for best results in generated content.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Heading Font</div>
                <Input
                  value={visualConfig.fonts?.heading || ""}
                  onChange={(e) =>
                    setVisualConfig({
                      ...visualConfig,
                      fonts: { ...visualConfig.fonts, heading: e.target.value }
                    })
                  }
                  className="font-semibold"
                  placeholder="e.g. Poppins, Montserrat"
                />
                <p className="text-xs text-muted-foreground mt-1">Used for titles & headlines</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Body Font</div>
                <Input
                  value={visualConfig.fonts?.body || ""}
                  onChange={(e) =>
                    setVisualConfig({
                      ...visualConfig,
                      fonts: { ...visualConfig.fonts, body: e.target.value }
                    })
                  }
                  placeholder="e.g. Open Sans, Roboto"
                />
                <p className="text-xs text-muted-foreground mt-1">Used for body text & captions</p>
              </div>
            </div>
          </div>

          {/* Example Posts - Visual Brand Reference */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Example Posts
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload 2-3 example posts from this brand. AI will analyze them to create a master visual prompt.
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-3 flex-wrap">
              {examplePosts.map((post, i) => (
                <div key={i} className="relative group">
                  <img
                    src={post}
                    alt={`Example post ${i + 1}`}
                    className="h-24 w-24 rounded-lg object-cover border"
                  />
                  <button
                    onClick={() => handleRemoveExamplePost(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {examplePosts.length < 3 && (
                <label className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleExamplePostUpload}
                  />
                </label>
              )}
            </div>

            {examplePosts.length > 0 && (
              <div className="mt-4 space-y-3">
                <Button
                  onClick={handleAnalyzeExamplePosts}
                  disabled={isAnalyzingVisuals}
                  variant="outline"
                  className="w-full"
                >
                  {isAnalyzingVisuals ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isAnalyzingVisuals ? "Analyzing..." : "Analyze & Generate Brand Prompt"}
                </Button>

                {visualConfig.master_brand_prompt && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-xs font-medium text-emerald-400 mb-1">Master Brand Prompt Generated</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {visualConfig.master_brand_prompt}
                    </p>
                  </div>
                )}
              </div>
            )}
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

      {/* Brand Style Palette */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Brand Style Palette
          </CardTitle>
          <CardDescription>
            Your curated visual styles for this brand. The first style is used as the default for new content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {visualConfig.approvedStyles && visualConfig.approvedStyles.length > 0 ? (
            <div className="space-y-4">
              {/* Style Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visualConfig.approvedStyles.map((style: ApprovedStyle, index: number) => (
                  <div
                    key={style.id}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      index === 0 ? "border-primary ring-2 ring-primary/30" : "border-muted"
                    }`}
                  >
                    {/* Default Badge */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 z-10">
                        <Badge className="text-[10px] px-1.5 py-0">Default</Badge>
                      </div>
                    )}
                    {/* Remove Button */}
                    <button
                      className="absolute top-1 right-1 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100"
                      onClick={async () => {
                        const newApprovedStyles = visualConfig.approvedStyles?.filter((s: ApprovedStyle) => s.id !== style.id);
                        const newDefaultStyle = newApprovedStyles && newApprovedStyles.length > 0 ? {
                          visualStyle: newApprovedStyles[0].visualStyle,
                          textStyle: newApprovedStyles[0].textStyle,
                          textColor: newApprovedStyles[0].textColor,
                          designSystem: newApprovedStyles[0].designSystem,
                          selectedAt: new Date().toISOString(),
                        } : undefined;
                        const newConfig = {
                          ...visualConfig,
                          approvedStyles: newApprovedStyles,
                          defaultStyle: newDefaultStyle
                        };
                        setVisualConfig(newConfig);
                        if (selectedBrand) {
                          await updateBrand(selectedBrand.id, { visual_config: newConfig });
                          setSaveMessage({ type: "success", text: "Style removed from palette" });
                          setTimeout(() => setSaveMessage(null), 3000);
                        }
                      }}
                      title="Remove from palette"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Image */}
                    <div className="aspect-[4/5] bg-muted group">
                      {style.sampleImage ? (
                        <img
                          src={style.sampleImage}
                          alt={style.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <div className="p-2 bg-card">
                      <p className="font-medium text-xs truncate">{style.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{style.visualStyle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStylePicker(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Add More Styles
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const newConfig = { ...visualConfig };
                    delete newConfig.approvedStyles;
                    delete newConfig.defaultStyle;
                    setVisualConfig(newConfig);
                    if (selectedBrand) {
                      await updateBrand(selectedBrand.id, { visual_config: newConfig });
                      setSaveMessage({ type: "success", text: "Style palette cleared" });
                      setTimeout(() => setSaveMessage(null), 3000);
                    }
                  }}
                  className="text-muted-foreground"
                >
                  Clear Palette
                </Button>
              </div>
            </div>
          ) : visualConfig.defaultStyle ? (
            // Legacy: show single default style if no palette yet
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                {visualConfig.defaultStyle.sampleImageUsed && (
                  <img
                    src={visualConfig.defaultStyle.sampleImageUsed}
                    alt="Selected style"
                    className="h-24 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {visualConfig.defaultStyle.visualStyle}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {visualConfig.defaultStyle.textStyle}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {visualConfig.defaultStyle.designSystem?.mood || "Custom design system"}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowStylePicker(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Build Style Palette
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-lg border border-dashed text-center">
                <Palette className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No styles configured yet. Create a style palette to maintain visual consistency.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can add or change styles anytime.
                </p>
              </div>
              <Button onClick={() => setShowStylePicker(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Style Palette
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Picker Dialog */}
      <StylePickerDialog
        open={showStylePicker}
        onOpenChange={setShowStylePicker}
        brandColors={{
          primary_color: visualConfig.primary_color,
          accent_color: visualConfig.accent_color,
        }}
        brandName={selectedBrand?.name || "Brand"}
        onStyleSelected={async (result) => {
          // Build approved styles from selection
          // Note: sampleImage omitted - base64 images are too large for DB storage
          const newApprovedStyles: ApprovedStyle[] = result.styles.map((style) => ({
            id: style.id,
            visualStyle: style.visualStyle,
            textStyle: style.textStyle,
            textColor: style.textColor,
            name: style.name,
            designSystem: style.designSystem,
            addedAt: new Date().toISOString(),
          }));

          // Merge with existing approved styles (avoid duplicates by id)
          const existingStyles = visualConfig.approvedStyles || [];
          const mergedStyles = [...existingStyles];
          for (const newStyle of newApprovedStyles) {
            if (!mergedStyles.find((s: ApprovedStyle) => s.id === newStyle.id)) {
              mergedStyles.push(newStyle);
            }
          }

          // Set first style as default
          const defaultStyle: BrandDefaultStyle | undefined = mergedStyles.length > 0 ? {
            visualStyle: mergedStyles[0].visualStyle,
            textStyle: mergedStyles[0].textStyle,
            textColor: mergedStyles[0].textColor,
            designSystem: mergedStyles[0].designSystem,
            selectedAt: new Date().toISOString(),
          } : undefined;

          const newConfig = { ...visualConfig, approvedStyles: mergedStyles, defaultStyle };
          setVisualConfig(newConfig);
          if (selectedBrand) {
            await updateBrand(selectedBrand.id, { visual_config: newConfig });
            setSaveMessage({ type: "success", text: `Added ${newApprovedStyles.length} style${newApprovedStyles.length > 1 ? "s" : ""} to palette!` });
            setTimeout(() => setSaveMessage(null), 3000);
          }
          setShowStylePicker(false);
        }}
      />

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

      {/* Video Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Generation
          </CardTitle>
          <CardDescription>
            Configure AI video generation settings and budget limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Enable Video Generation</p>
              <p className="text-sm text-muted-foreground">
                Allow generating AI videos using Veo 3
              </p>
            </div>
            <button
              onClick={() => setVideoConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                videoConfig.enabled ? "bg-violet-500" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  videoConfig.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {videoConfig.enabled && (
            <>
              {/* Budget Settings */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monthly Budget (USD)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      value={videoConfig.monthly_budget_usd || ""}
                      onChange={(e) => setVideoConfig((prev) => ({
                        ...prev,
                        monthly_budget_usd: e.target.value ? parseFloat(e.target.value) : null,
                      }))}
                      placeholder="No limit"
                      className="w-32"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      Leave empty for no limit
                    </span>
                  </div>
                  {videoUsage?.monthly && videoConfig.monthly_budget_usd && (
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Current usage</span>
                        <span>{formatCost(videoUsage.monthly.spent)} / {formatCost(videoConfig.monthly_budget_usd)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (videoUsage.monthly.spent / videoConfig.monthly_budget_usd) >= 0.9
                              ? "bg-red-500"
                              : (videoUsage.monthly.spent / videoConfig.monthly_budget_usd) >= 0.7
                                ? "bg-yellow-500"
                                : "bg-violet-500"
                          }`}
                          style={{ width: `${Math.min((videoUsage.monthly.spent / videoConfig.monthly_budget_usd) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Daily Video Limit</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={videoConfig.daily_limit || ""}
                      onChange={(e) => setVideoConfig((prev) => ({
                        ...prev,
                        daily_limit: e.target.value ? parseInt(e.target.value) : null,
                      }))}
                      placeholder="No limit"
                      className="w-32"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      videos per day
                    </span>
                  </div>
                </div>

                {/* Default Model */}
                <div>
                  <label className="text-sm font-medium">Default Model</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(Object.keys(VIDEO_MODELS) as VideoModelKey[]).map((modelKey) => {
                      const model = VIDEO_MODELS[modelKey];
                      return (
                        <button
                          key={modelKey}
                          onClick={() => setVideoConfig((prev) => ({ ...prev, default_model: modelKey }))}
                          className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                            videoConfig.default_model === modelKey
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                        >
                          <span className="font-medium text-sm">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ${model.costPerSecond.toFixed(2)}/sec
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Duration */}
                <div>
                  <label className="text-sm font-medium">Default Duration: {videoConfig.default_duration}s</label>
                  <div className="flex gap-2 mt-1">
                    {[3, 4, 5, 6, 7, 8].map((d) => (
                      <button
                        key={d}
                        onClick={() => setVideoConfig((prev) => ({ ...prev, default_duration: d }))}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          videoConfig.default_duration === d
                            ? "border-violet-500 bg-violet-500/10 text-violet-400"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Include Audio by Default */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Include Audio by Default</p>
                    <p className="text-xs text-muted-foreground">
                      Adds background audio to generated videos (extra cost)
                    </p>
                  </div>
                  <button
                    onClick={() => setVideoConfig((prev) => ({ ...prev, include_audio: !prev.include_audio }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      videoConfig.include_audio ? "bg-violet-500" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        videoConfig.include_audio ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleSaveVideoConfig} disabled={isSavingVideo}>
              {isSavingVideo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Video Settings
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

      {/* Danger Zone */}
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently delete data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-500/30 p-4">
            <div>
              <p className="font-medium">Delete this client</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete {selectedBrand.name} and all associated content, ideas, inputs, and images.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Client
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Client Dialog */}
      <BrandDeletionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        brandId={selectedBrand.id}
        brandName={selectedBrand.name}
      />

      {/* Account Picker Modal */}
      {showAccountPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => {
                  setShowAccountPicker(null);
                  setAvailableLateAccounts([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle>Select Account</CardTitle>
              <CardDescription>
                Choose which {showAccountPicker} account to connect to {selectedBrand?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableLateAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading accounts...
                </div>
              ) : (
                availableLateAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => linkAccount(account)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {account.profileImageUrl ? (
                        <img
                          src={account.profileImageUrl}
                          alt={account.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {PLATFORMS.find(p => p.id === account.platform)?.icon || "📱"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">@{account.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Don&apos;t see your account?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://getlate.dev/dashboard", "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Late.dev Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
