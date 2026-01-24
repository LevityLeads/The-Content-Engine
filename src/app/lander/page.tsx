"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Instagram,
  Twitter,
  Linkedin,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  ThumbsUp,
  MoreHorizontal,
} from "lucide-react";

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Animated counter component
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView();

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm transition-all duration-700 hover:border-primary/50 hover:bg-card/80 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Platform badge component
function PlatformBadge({ icon: Icon, name, delay }: { icon: React.ElementType; name: string; delay: number }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm transition-all duration-500 ${
        isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

// Step card component for "How it works" section
function StepCard({
  step,
  title,
  description,
  delay,
  showConnector,
}: {
  step: string;
  title: string;
  description: string;
  delay: number;
  showConnector: boolean;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-6xl font-bold text-primary/10 mb-4">{step}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      {showConnector && (
        <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
      )}
    </div>
  );
}

// Stat card component
function StatCard({
  value,
  suffix,
  label,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-3xl sm:text-4xl font-bold text-primary">
        <AnimatedCounter target={value} />
        {suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// Typing animation hook
function useTypingAnimation(text: string, speed = 50, startDelay = 0, isActive = true) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayText("");
      setIsComplete(false);
      return;
    }

    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      const typeChar = () => {
        if (charIndex < text.length) {
          setDisplayText(text.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(typeChar, speed);
        } else {
          setIsComplete(true);
        }
      };
      typeChar();
    };

    timeout = setTimeout(startTyping, startDelay);

    return () => clearTimeout(timeout);
  }, [text, speed, startDelay, isActive]);

  return { displayText, isComplete };
}

// Product Demo Component - Animated UI Mockup
function ProductDemo() {
  const { ref, isInView } = useInView(0.3);
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputText = "Just had an amazing customer call - they saved 40% on their cloud costs using our optimization tool. The key was identifying unused resources...";

  const { displayText: typedInput, isComplete: inputComplete } = useTypingAnimation(
    inputText,
    30,
    500,
    isPlaying && demoStep === 0
  );

  // Auto-advance demo steps
  useEffect(() => {
    if (!isPlaying) return;

    const timings = [4000, 3000, 4000, 3000, 2000];

    if (demoStep < 4) {
      const timeout = setTimeout(() => {
        setDemoStep((prev) => prev + 1);
      }, timings[demoStep]);
      return () => clearTimeout(timeout);
    } else {
      // Reset and loop
      const timeout = setTimeout(() => {
        setDemoStep(0);
      }, timings[4]);
      return () => clearTimeout(timeout);
    }
  }, [demoStep, isPlaying]);

  // Auto-play when in view
  useEffect(() => {
    if (isInView && !isPlaying) {
      const timeout = setTimeout(() => setIsPlaying(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [isInView, isPlaying]);

  const ideas = [
    {
      title: "Cloud Cost Horror Story → Success",
      angle: "Story-driven",
      platforms: ["linkedin", "twitter"],
      score: 94
    },
    {
      title: "5 Signs You're Wasting Cloud Budget",
      angle: "Educational",
      platforms: ["linkedin", "instagram"],
      score: 89
    },
    {
      title: "The 40% Rule for Cloud Optimization",
      angle: "Framework",
      platforms: ["twitter", "linkedin"],
      score: 87
    },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Browser chrome */}
      <div
        className={`relative rounded-xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5 transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* Browser header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/20" />
              app.contentengine.ai
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* App content */}
        <div className="flex min-h-[400px] sm:min-h-[500px]">
          {/* Sidebar */}
          <div className="hidden sm:flex w-48 border-r border-border/50 bg-card/30 flex-col p-3 gap-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Inputs</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent/50 transition-colors">
              <Zap className="w-4 h-4" />
              <span>Ideas</span>
              {demoStep >= 1 && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 rounded-full animate-fade-in">3</span>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent/50 transition-colors">
              <Target className="w-4 h-4" />
              <span>Content</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent/50 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-4 sm:p-6 overflow-hidden">
            {/* Step 0: Input capture */}
            {demoStep === 0 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Capture Input</h3>
                  <span className="text-xs text-muted-foreground">Step 1 of 3</span>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <div className="text-sm text-muted-foreground mb-2">What&apos;s on your mind?</div>
                  <div className="min-h-[80px] text-sm">
                    {typedInput}
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
                  </div>
                </div>
                {inputComplete && (
                  <div className="mt-4 flex justify-end animate-fade-in">
                    <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate Ideas
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Ideas generated */}
            {demoStep === 1 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">AI Ideas</h3>
                  <span className="text-xs text-primary font-medium">3 ideas generated</span>
                </div>
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <div
                      key={idea.title}
                      className="rounded-lg border border-border/50 bg-background/50 p-3 animate-slide-up hover:border-primary/30 transition-colors cursor-pointer"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{idea.title}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{idea.angle}</span>
                            <div className="flex gap-1">
                              {idea.platforms.map((p) => (
                                <span key={p} className="text-[10px] text-muted-foreground capitalize">{p}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{idea.score}</div>
                          <div className="text-[10px] text-muted-foreground">score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Content generation */}
            {demoStep === 2 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Generating Content...</h3>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* LinkedIn preview skeleton */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-xs font-medium">LinkedIn</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-3/5" />
                    </div>
                    <div className="h-32 bg-muted/30 rounded animate-pulse" />
                  </div>
                  {/* Twitter preview skeleton */}
                  <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      <span className="text-xs font-medium">X / Twitter</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
                    </div>
                    <div className="h-32 bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Content ready with platform mockups */}
            {demoStep === 3 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Content Ready
                  </h3>
                  <span className="text-xs text-muted-foreground">2 platforms</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* LinkedIn mockup */}
                  <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-xs font-medium">LinkedIn</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">CE</div>
                        <div>
                          <div className="text-xs font-medium">Content Engine</div>
                          <div className="text-[10px] text-muted-foreground">Just now</div>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed mb-2">
                        Our customer just saved 40% on their cloud costs. 🎉
                        <br /><br />
                        The secret? A 3-step optimization framework:
                        <br /><br />
                        1️⃣ Audit unused resources
                        <br />
                        2️⃣ Right-size instances
                        <br />
                        3️⃣ Implement auto-scaling
                        <br /><br />
                        Here&apos;s how we did it...
                      </p>
                      <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center text-xs text-muted-foreground">
                        [Carousel Preview]
                      </div>
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/30 text-muted-foreground">
                        <div className="flex items-center gap-1 text-[10px]"><ThumbsUp className="w-3 h-3" /> Like</div>
                        <div className="flex items-center gap-1 text-[10px]"><MessageCircle className="w-3 h-3" /> Comment</div>
                        <div className="flex items-center gap-1 text-[10px]"><Share2 className="w-3 h-3" /> Share</div>
                      </div>
                    </div>
                  </div>
                  {/* Twitter mockup */}
                  <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                      <Twitter className="w-4 h-4" />
                      <span className="text-xs font-medium">X / Twitter</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">CE</div>
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1">
                            Content Engine
                            <span className="text-muted-foreground">@contentengine</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                      <p className="text-xs leading-relaxed mb-2">
                        Our customer just cut their cloud bill by 40% 💰
                        <br /><br />
                        The 3-step framework that made it possible:
                        <br /><br />
                        → Audit unused resources
                        <br />
                        → Right-size instances
                        <br />
                        → Auto-scale everything
                        <br /><br />
                        Thread 🧵👇
                      </p>
                      <div className="flex items-center gap-6 mt-2 pt-2 border-t border-border/30 text-muted-foreground">
                        <div className="flex items-center gap-1 text-[10px]"><MessageCircle className="w-3 h-3" /> 24</div>
                        <div className="flex items-center gap-1 text-[10px]"><Share2 className="w-3 h-3" /> 89</div>
                        <div className="flex items-center gap-1 text-[10px]"><Heart className="w-3 h-3" /> 342</div>
                        <div className="flex items-center gap-1 text-[10px]"><Bookmark className="w-3 h-3" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Published */}
            {demoStep === 4 && (
              <div className="animate-fade-in flex flex-col items-center justify-center h-full py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-scale-in">
                  <Send className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Published!</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Your content is now live on LinkedIn and Twitter. Track performance in Analytics.
                </p>
                <div className="flex items-center gap-2 mt-6">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] text-xs">
                    <Linkedin className="w-3 h-3" /> Live
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground/10 text-foreground text-xs">
                    <Twitter className="w-3 h-3" /> Live
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border/30">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((demoStep + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Demo controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setDemoStep(step)}
              className={`w-2 h-2 rounded-full transition-all ${
                demoStep === step ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isPlaying ? (
            <>
              <div className="w-3 h-3 flex items-center justify-center gap-0.5">
                <div className="w-1 h-3 bg-current rounded-sm" />
                <div className="w-1 h-3 bg-current rounded-sm" />
              </div>
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Play
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Content Engine</span>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}>
            Join Waitlist
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            AI-Powered Content Automation
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Turn Ideas Into{" "}
            <span className="relative">
              <span className="text-primary animate-gradient-text">Viral Content</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path
                  d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-draw"
                />
              </svg>
            </span>
            {" "}In Seconds
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">
            The AI content engine that understands your brand voice, generates platform-perfect posts, and schedules them at the optimal time. No more blank page syndrome.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
            <Button
              size="lg"
              className="text-base px-8 h-12 group"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Early Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-semibold"><AnimatedCounter target={847} /></span> creators already on the list
            </p>
          </div>

          {/* Supported platforms */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12 animate-slide-up animation-delay-300">
            <PlatformBadge icon={Instagram} name="Instagram" delay={0} />
            <PlatformBadge icon={Twitter} name="X / Twitter" delay={100} />
            <PlatformBadge icon={Linkedin} name="LinkedIn" delay={200} />
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-12 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              See It In Action
            </h2>
            <p className="text-muted-foreground">
              From raw idea to published post in under 60 seconds
            </p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Dominate Social</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From raw ideas to published posts, we handle every step of the content creation pipeline.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Sparkles}
              title="AI Ideation Engine"
              description="Transform rough thoughts into polished content ideas. Our AI understands context and generates concepts that resonate."
              delay={0}
            />
            <FeatureCard
              icon={Target}
              title="Brand Voice Lock"
              description="Train the AI on your unique voice. Every piece of content sounds authentically you, not like a robot."
              delay={100}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Hook Optimization"
              description="Data-driven hooks that stop the scroll. We analyze what works and apply those patterns to your content."
              delay={200}
            />
            <FeatureCard
              icon={Calendar}
              title="Smart Scheduling"
              description="Post at the perfect moment. Our algorithm finds when your audience is most active and engaged."
              delay={300}
            />
            <FeatureCard
              icon={BarChart3}
              title="Performance Analytics"
              description="Track what's working across all platforms. Learn, iterate, and improve with every post."
              delay={400}
            />
            <FeatureCard
              icon={Zap}
              title="One-Click Publishing"
              description="Connect your accounts once. Publish everywhere instantly with platform-optimized formatting."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From Idea to Published in{" "}
              <span className="text-primary">3 Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="01"
              title="Drop Your Idea"
              description="Paste a thought, URL, or upload a document. Our AI extracts the key insights."
              delay={0}
              showConnector={true}
            />
            <StepCard
              step="02"
              title="Review & Refine"
              description="Get 4 unique content angles. Pick your favorite, tweak if needed."
              delay={150}
              showConnector={true}
            />
            <StepCard
              step="03"
              title="Publish & Track"
              description="One click sends it everywhere. Watch the engagement roll in."
              delay={300}
              showConnector={false}
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <StatCard value={10} suffix="x" label="Faster Content" delay={0} />
            <StatCard value={4} suffix="+" label="Platforms" delay={100} />
            <StatCard value={95} suffix="%" label="Time Saved" delay={200} />
            <StatCard value={24} suffix="/7" label="AI Available" delay={300} />
          </div>

          {/* Testimonial placeholder */}
          <div className="relative p-8 rounded-2xl bg-card/50 border border-border/50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              Coming Soon
            </div>
            <p className="text-lg text-muted-foreground italic">
              &quot;Early beta testers are seeing incredible results. Join the waitlist to be among the first to experience the future of content creation.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Get Early Access
              </h2>
              <p className="text-muted-foreground mb-8">
                Be the first to know when we launch. Early subscribers get exclusive pricing and priority onboarding.
              </p>

              {status === "success" ? (
                <div className="flex items-center justify-center gap-2 text-primary animate-fade-in">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">You&apos;re on the list! We&apos;ll be in touch.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 h-12 bg-background/50 border-border/50 focus:border-primary"
                      required
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 px-8 whitespace-nowrap"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  {status === "error" && (
                    <p className="text-destructive text-sm animate-shake">{errorMessage}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Content Engine</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Content Engine. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Custom styles for animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes draw {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes gradient-text {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-draw {
          stroke-dasharray: 300;
          animation: draw 1.5s ease-out forwards;
          animation-delay: 0.5s;
          stroke-dashoffset: 300;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }

        .animate-gradient-text {
          animation: gradient-text 3s ease-in-out infinite;
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
