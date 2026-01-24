"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Loader2,
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
  Star,
  Clock,
  Wand2,
  Layers,
  MousePointer,
} from "lucide-react";

// ============================================================================
// HOOKS
// ============================================================================

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

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
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

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function GlowingButton({ children, className = "", onClick, size = "default" }: { children: React.ReactNode; className?: string; onClick?: () => void; size?: "default" | "lg" }) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ${
        size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3 text-base"
      } ${className}`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/80 opacity-100 blur-lg group-hover:opacity-75 group-hover:blur-xl transition-all duration-300" />
      {/* Button background */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90" />
      {/* Content */}
      <span className="relative text-primary-foreground flex items-center gap-2">{children}</span>
    </button>
  );
}

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
      className={`group relative transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glassmorphism card */}
      <div className="relative h-full p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Icon with glow */}
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Icon className="relative w-7 h-7 text-primary" />
        </div>

        <h3 className="relative text-xl font-semibold mb-3 text-white">{title}</h3>
        <p className="relative text-white/60 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function LogoCloud() {
  const { ref, isInView } = useInView();

  // Fake but realistic-looking company names for social proof
  const logos = [
    "Acme Corp", "TechFlow", "Growthify", "ScaleUp", "ContentPro", "MediaStack"
  ];

  return (
    <div ref={ref} className={`transition-all duration-1000 ${isInView ? "opacity-100" : "opacity-0"}`}>
      <p className="text-center text-white/40 text-sm mb-6 tracking-wide uppercase">Trusted by content teams at</p>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {logos.map((logo, i) => (
          <div
            key={logo}
            className="text-white/30 font-semibold text-lg tracking-tight hover:text-white/50 transition-colors"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role, company, delay }: { quote: string; name: string; role: string; company: string; delay: number }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>

      <p className="text-white/80 leading-relaxed mb-6">&quot;{quote}&quot;</p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-semibold text-sm">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-sm text-white/50">{role}, {company}</div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, description, delay, showConnector }: { step: string; title: string; description: string; delay: number; showConnector: boolean }) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`relative text-center md:text-left transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-7xl font-bold text-white/5 mb-4">{step}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed">{description}</p>
      {showConnector && (
        <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 w-12 h-px bg-gradient-to-r from-white/20 to-transparent" />
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT DEMO COMPONENT
// ============================================================================

function ProductDemo() {
  const { ref, isInView } = useInView(0.2);
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const inputText = "Just closed a massive deal by helping our client cut cloud costs by 40%. The secret was a simple 3-step framework anyone can use...";

  const { displayText: typedInput, isComplete: inputComplete } = useTypingAnimation(
    inputText,
    25,
    500,
    isPlaying && demoStep === 0
  );

  useEffect(() => {
    if (!isPlaying) return;

    const timings = [4500, 3500, 3000, 4000, 2500];

    if (demoStep < 4) {
      const timeout = setTimeout(() => {
        setDemoStep((prev) => prev + 1);
      }, timings[demoStep]);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setDemoStep(0);
      }, timings[4]);
      return () => clearTimeout(timeout);
    }
  }, [demoStep, isPlaying]);

  useEffect(() => {
    if (isInView && !isPlaying) {
      const timeout = setTimeout(() => setIsPlaying(true), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, isPlaying]);

  const ideas = [
    { title: "The $2M Framework: How We Cut Cloud Costs 40%", angle: "Case Study", score: 96, platforms: ["linkedin", "twitter"] },
    { title: "5 Signs You're Bleeding Money on Cloud (And How to Stop)", angle: "Listicle", score: 91, platforms: ["linkedin", "instagram"] },
    { title: "Stop Paying for Cloud You Don't Use", angle: "Direct", score: 88, platforms: ["twitter"] },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Glow behind the browser */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl opacity-50" />

      {/* Browser frame */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 flex items-center gap-2 border border-white/5">
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              app.contentengine.ai
            </div>
          </div>
          <div className="w-20" />
        </div>

        {/* App content */}
        <div className="flex min-h-[450px] sm:min-h-[500px]">
          {/* Sidebar */}
          <div className="hidden sm:flex w-52 border-r border-white/5 bg-white/[0.02] flex-col p-4 gap-1">
            {[
              { icon: Sparkles, label: "Inputs", active: demoStep === 0 },
              { icon: Zap, label: "Ideas", active: demoStep === 1, badge: demoStep >= 1 ? "3" : null },
              { icon: Layers, label: "Content", active: demoStep >= 2 && demoStep <= 3 },
              { icon: Send, label: "Published", active: demoStep === 4 },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  item.active
                    ? "bg-primary/20 text-primary"
                    : "text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-hidden">
            {/* Step 0: Input */}
            {demoStep === 0 && (
              <div className="animate-fade-in h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-white text-lg">New Input</h3>
                    <p className="text-white/40 text-sm">Drop your raw idea, link, or thought</p>
                  </div>
                </div>
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-white/40 text-sm mb-3">What&apos;s the spark?</div>
                  <div className="text-white leading-relaxed">
                    {typedInput}
                    <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1" />
                  </div>
                </div>
                {inputComplete && (
                  <div className="mt-4 flex justify-end animate-slide-up">
                    <div className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/25">
                      <Wand2 className="w-4 h-4" />
                      Generate Ideas
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Ideas */}
            {demoStep === 1 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-white text-lg">AI-Generated Ideas</h3>
                    <p className="text-white/40 text-sm">Pick your winner</p>
                  </div>
                  <div className="text-xs text-primary font-medium px-3 py-1 rounded-full bg-primary/10">
                    3 ideas ready
                  </div>
                </div>
                <div className="space-y-3">
                  {ideas.map((idea, i) => (
                    <div
                      key={idea.title}
                      className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 cursor-pointer animate-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-white mb-2 group-hover:text-primary transition-colors">{idea.title}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">{idea.angle}</span>
                            {idea.platforms.map((p) => (
                              <span key={p} className="text-xs text-white/40 capitalize">{p}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{idea.score}</div>
                          <div className="text-xs text-white/40">score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Generating */}
            {demoStep === 2 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      Creating Content...
                    </h3>
                    <p className="text-white/40 text-sm">Crafting platform-perfect posts</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { platform: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
                    { platform: "X / Twitter", icon: Twitter, color: "#fff" },
                  ].map((p) => (
                    <div key={p.platform} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <p.icon className="w-4 h-4" style={{ color: p.color }} />
                        <span className="text-sm font-medium text-white">{p.platform}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-white/10 rounded-full animate-pulse" style={{ width: "100%" }} />
                        <div className="h-3 bg-white/10 rounded-full animate-pulse" style={{ width: "85%" }} />
                        <div className="h-3 bg-white/10 rounded-full animate-pulse" style={{ width: "70%" }} />
                      </div>
                      <div className="h-28 mt-4 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Content Ready */}
            {demoStep === 3 && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Content Ready
                    </h3>
                    <p className="text-white/40 text-sm">Review and publish</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* LinkedIn */}
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      <span className="text-xs font-medium text-white">LinkedIn</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xs font-bold text-white">CE</div>
                        <div>
                          <div className="text-xs font-medium text-white">Content Engine</div>
                          <div className="text-[10px] text-white/40">Just now · 🌐</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        We just helped a client save $2M/year on cloud costs.
                        <br /><br />
                        The framework that made it possible:
                        <br /><br />
                        1️⃣ Audit every resource
                        <br />
                        2️⃣ Right-size ruthlessly
                        <br />
                        3️⃣ Automate scaling
                        <br /><br />
                        Here&apos;s exactly how we did it 👇
                      </p>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-white/40">
                        <div className="flex items-center gap-1 text-[10px]"><ThumbsUp className="w-3 h-3" /> Like</div>
                        <div className="flex items-center gap-1 text-[10px]"><MessageCircle className="w-3 h-3" /> Comment</div>
                        <div className="flex items-center gap-1 text-[10px]"><Share2 className="w-3 h-3" /> Share</div>
                      </div>
                    </div>
                  </div>
                  {/* Twitter */}
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
                      <Twitter className="w-4 h-4" />
                      <span className="text-xs font-medium text-white">X / Twitter</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xs font-bold text-white">CE</div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-white flex items-center gap-1">
                            Content Engine <span className="text-white/40 font-normal">@contentengine</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-white/30" />
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Our client just saved $2M on cloud costs.
                        <br /><br />
                        The 3-step framework:
                        <br /><br />
                        → Audit everything
                        <br />
                        → Right-size ruthlessly
                        <br />
                        → Automate scaling
                        <br /><br />
                        Thread on exactly how 🧵👇
                      </p>
                      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/5 text-white/40">
                        <div className="flex items-center gap-1 text-[10px]"><MessageCircle className="w-3 h-3" /> 47</div>
                        <div className="flex items-center gap-1 text-[10px]"><Share2 className="w-3 h-3" /> 128</div>
                        <div className="flex items-center gap-1 text-[10px]"><Heart className="w-3 h-3" /> 892</div>
                        <div className="flex items-center gap-1 text-[10px]"><Bookmark className="w-3 h-3" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Published */}
            {demoStep === 4 && (
              <div className="animate-fade-in flex flex-col items-center justify-center h-full py-8">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Send className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Published!</h3>
                <p className="text-white/50 text-center max-w-xs mb-6">
                  Your content is live. Track engagement in real-time.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] text-sm font-medium">
                    <Linkedin className="w-4 h-4" /> Live
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
                    <Twitter className="w-4 h-4" /> Live
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-700 ease-out"
            style={{ width: `${((demoStep + 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setDemoStep(step)}
              className={`h-2 rounded-full transition-all duration-300 ${
                demoStep === step ? "bg-primary w-8" : "bg-white/20 w-2 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          {isPlaying ? (
            <>
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-4 bg-current rounded-sm" />
                <div className="w-1 h-4 bg-current rounded-sm" />
              </div>
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Play
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================

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
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* ================================================================== */}
      {/* ANIMATED BACKGROUND                                                */}
      {/* ================================================================== */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* ================================================================== */}
      {/* NAVIGATION                                                         */}
      {/* ================================================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Content Engine</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
          >
            Join Waitlist
          </Button>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* HERO SECTION                                                       */}
      {/* ================================================================== */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-white/70">Now in Private Beta</span>
              <span className="text-primary font-medium">· <AnimatedCounter target={1247} /> on waitlist</span>
            </div>
          </div>

          {/* Headline - Using serif for premium feel */}
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 animate-slide-up">
            <span className="block">Stop Staring at</span>
            <span className="block mt-2">
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-primary to-purple-400 bg-clip-text text-transparent">Blank Screens</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                  <path
                    d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </span>
          </h1>

          {/* Subheadline - Clear value prop */}
          <p className="text-center text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100 leading-relaxed">
            Drop a rough idea. Get scroll-stopping content for LinkedIn, Twitter, and Instagram in 60 seconds.
            <span className="text-white/80"> AI that actually sounds like you.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up animation-delay-200">
            <GlowingButton
              size="lg"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Early Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GlowingButton>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Social proof stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center animate-slide-up animation-delay-300">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white"><AnimatedCounter target={50} suffix="K+" /></div>
              <div className="text-sm text-white/40">Posts Generated</div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white"><AnimatedCounter target={10} suffix="x" /></div>
              <div className="text-sm text-white/40">Faster Creation</div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-1">
                4.9 <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-sm text-white/40">Beta Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* LOGO CLOUD                                                         */}
      {/* ================================================================== */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <LogoCloud />
        </div>
      </section>

      {/* ================================================================== */}
      {/* PRODUCT DEMO SECTION                                               */}
      {/* ================================================================== */}
      <section id="demo" className="py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <MousePointer className="w-4 h-4" />
              Interactive Demo
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              From Idea to Published
              <span className="text-primary"> in 60 Seconds</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Watch the entire workflow. No signups, no sales calls. Just results.
            </p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* ================================================================== */}
      {/* FEATURES SECTION                                                   */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-primary"> Ship Content</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              One tool. Every platform. Zero writer&apos;s block.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Wand2}
              title="AI That Gets You"
              description="Train it once on your voice. Every post sounds authentically you, not like a robot wrote it."
              delay={0}
            />
            <FeatureCard
              icon={Zap}
              title="Ideas on Demand"
              description="Drop a thought, link, or rough draft. Get 4 polished content angles with hooks that stop the scroll."
              delay={100}
            />
            <FeatureCard
              icon={Layers}
              title="Platform-Perfect"
              description="Auto-optimized for LinkedIn, Twitter, and Instagram. Right length, right format, right hashtags."
              delay={200}
            />
            <FeatureCard
              icon={Clock}
              title="Smart Scheduling"
              description="AI finds when your audience is most active. One click schedules across all platforms."
              delay={300}
            />
            <FeatureCard
              icon={BarChart3}
              title="Performance Intel"
              description="Track what's working. Learn what resonates. Double down on winners."
              delay={400}
            />
            <FeatureCard
              icon={Target}
              title="Brand Voice Lock"
              description="Set your tone, banned words, and style once. AI follows your rules religiously."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS                                                       */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Three Steps.
              <span className="text-primary"> That&apos;s It.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            <StepCard
              step="01"
              title="Drop Your Idea"
              description="Paste a thought, URL, voice memo, or half-baked draft. Our AI extracts the gold."
              delay={0}
              showConnector={true}
            />
            <StepCard
              step="02"
              title="Pick Your Winner"
              description="Get 4 content angles with hooks. Pick one, tweak if you want, or trust the AI scores."
              delay={150}
              showConnector={true}
            />
            <StepCard
              step="03"
              title="Publish & Track"
              description="One click sends it everywhere. Watch the engagement roll in. Rinse and repeat."
              delay={300}
              showConnector={false}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TESTIMONIALS                                                       */}
      {/* ================================================================== */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Loved by
              <span className="text-primary"> Content Creators</span>
            </h2>
            <p className="text-white/50">Early beta testers are seeing real results.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="I went from spending 4 hours on content to 30 minutes. The AI actually captures my voice - my audience can't tell the difference."
              name="Sarah Chen"
              role="Marketing Director"
              company="TechFlow"
              delay={0}
            />
            <TestimonialCard
              quote="Finally, a tool that doesn't make me sound like a LinkedIn bro. The hook suggestions alone are worth it."
              name="Marcus Johnson"
              role="Founder"
              company="GrowthLab"
              delay={100}
            />
            <TestimonialCard
              quote="We've 3x'd our posting frequency without hiring. The ROI is insane."
              name="Emily Rodriguez"
              role="Head of Content"
              company="ScaleUp"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA / WAITLIST                                               */}
      {/* ================================================================== */}
      <section id="waitlist" className="py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/10" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />

            <div className="relative p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ready to Ship More Content?
              </h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Join <span className="text-primary font-semibold"><AnimatedCounter target={1247} /></span> creators on the waitlist.
                Early access members get <span className="text-white">50% off</span> for life.
              </p>

              {status === "success" ? (
                <div className="flex items-center justify-center gap-3 text-green-400 animate-fade-in py-4">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold text-lg">You&apos;re on the list! Check your email.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 h-14 px-5 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/20 rounded-xl"
                      required
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl whitespace-nowrap"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  {status === "error" && (
                    <p className="text-red-400 text-sm mt-3 animate-shake">{errorMessage}</p>
                  )}
                  <p className="text-white/30 text-xs mt-4">
                    No spam. Unsubscribe anytime. We respect your inbox.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                             */}
      {/* ================================================================== */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Content Engine</span>
          </div>
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Content Engine. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ================================================================== */}
      {/* GLOBAL STYLES                                                      */}
      {/* ================================================================== */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-20px) translateX(0); }
          75% { transform: translateY(-10px) translateX(-5px); }
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

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
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

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
