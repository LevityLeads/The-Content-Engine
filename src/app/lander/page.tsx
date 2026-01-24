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
