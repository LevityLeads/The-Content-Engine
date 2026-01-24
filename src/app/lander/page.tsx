"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Send,
  Star,
  Clock,
  Wand2,
  Layers,
  GripVertical,
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ============================================================================
// AURORA BACKGROUND
// ============================================================================

function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark */}
      <div className="absolute inset-0 bg-[#030014]" />

      {/* Aurora layers */}
      <div className="absolute inset-0">
        {/* Primary aurora wave */}
        <div
          className="absolute top-0 left-1/4 w-[150%] h-[60%] opacity-30 animate-aurora-1"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(34, 211, 238, 0.3), rgba(168, 85, 247, 0.2), transparent)",
            filter: "blur(100px)",
            transform: "rotate(-12deg)",
          }}
        />
        {/* Secondary aurora wave */}
        <div
          className="absolute top-[10%] -left-[20%] w-[140%] h-[50%] opacity-20 animate-aurora-2"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(168, 85, 247, 0.4), rgba(34, 211, 238, 0.2), transparent)",
            filter: "blur(80px)",
            transform: "rotate(8deg)",
          }}
        />
        {/* Tertiary accent */}
        <div
          className="absolute top-[30%] right-0 w-[80%] h-[40%] opacity-25 animate-aurora-3"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.3), rgba(236, 72, 153, 0.2), transparent)",
            filter: "blur(90px)",
            transform: "rotate(-5deg)",
          }}
        />
      </div>

      {/* Floating particles */}
      <Particles />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"
        }}
      />
    </div>
  );
}

// ============================================================================
// FLOATING PARTICLES
// ============================================================================

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const currentOpacity = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

// ============================================================================
// TEXT SCRAMBLE EFFECT
// ============================================================================

function ScrambleText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const { ref, isInView } = useInView(0.5);
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    if (!isInView || isAnimating) return;

    const timeout = setTimeout(() => {
      setIsAnimating(true);
      let iteration = 0;
      const maxIterations = text.length;

      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return text[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );

        iteration += 1 / 3;

        if (iteration >= maxIterations) {
          clearInterval(interval);
          setDisplayText(text);
        }
      }, 30);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, text, delay, isAnimating, chars]);

  return (
    <span ref={ref} className={`font-mono ${className}`}>
      {displayText}
    </span>
  );
}

// ============================================================================
// MAGNETIC BUTTON (Desktop) / PULSE BUTTON (Mobile)
// ============================================================================

function MagneticButton({
  children,
  className = "",
  onClick,
  size = "default"
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "default" | "lg";
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * 0.2;
    const distanceY = (e.clientY - centerY) * 0.2;

    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ${
        size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3 text-base"
      } ${isMobile ? "active:scale-95" : ""} ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-primary to-purple-500 opacity-80 blur-xl group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500 animate-glow-pulse" />
      {/* Button background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-primary to-purple-500" />
      <div className="absolute inset-[2px] rounded-[14px] bg-[#0a0a0f]/80 group-hover:bg-[#0a0a0f]/60 transition-colors duration-300" />
      {/* Content */}
      <span className="relative text-white flex items-center gap-2">{children}</span>
    </button>
  );
}

// ============================================================================
// 3D TILT CARD
// ============================================================================

function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const isMobile = useIsMobile();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 0.15 });
  };

  const handleMouseLeave = () => {
    setTransform("");
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out ${className}`}
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {children}
      {/* Glare effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 50%)`,
        }}
      />
    </div>
  );
}

// ============================================================================
// BENTO FEATURE CARD
// ============================================================================

function BentoCard({
  icon: Icon,
  title,
  description,
  className = "",
  size = "default",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  size?: "default" | "large" | "tall";
}) {
  const { ref, isInView } = useInView(0.2);

  return (
    <TiltCard
      className={`${
        size === "large" ? "md:col-span-2" : size === "tall" ? "md:row-span-2" : ""
      } ${className}`}
    >
      <div
        ref={ref}
        className={`group relative h-full p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden transition-all duration-700 hover:border-cyan-500/30 hover:bg-white/[0.06] ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Gradient corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Icon */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-cyan-400" />
        </div>

        <h3 className="relative text-lg md:text-xl font-semibold mb-2 md:mb-3 text-white">{title}</h3>
        <p className="relative text-sm md:text-base text-white/50 leading-relaxed">{description}</p>
      </div>
    </TiltCard>
  );
}

// ============================================================================
// BEFORE/AFTER SLIDER
// ============================================================================

function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const { ref, isInView } = useInView(0.3);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragging.current = false; };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
    >
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] md:aspect-[2/1] rounded-2xl overflow-hidden cursor-col-resize select-none border border-white/10"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before (messy draft) */}
        <div className="absolute inset-0 bg-[#0a0a0f] p-4 md:p-8">
          <div className="h-full rounded-xl border border-red-500/20 bg-red-500/5 p-4 md:p-6 overflow-hidden">
            <div className="text-red-400/60 text-xs md:text-sm mb-2 md:mb-4 font-mono">{"// rough_draft.txt"}</div>
            <div className="space-y-2 text-xs md:text-sm text-white/40 font-mono">
              <p>ok so basically we helped this client</p>
              <p>save money on cloud stuff...</p>
              <p>like 40% or something</p>
              <p>idk how to make this sound good</p>
              <p className="text-red-400/40">TODO: make this not boring</p>
              <p className="text-red-400/40">TODO: add hook??</p>
              <p>maybe talk about the framework thing</p>
            </div>
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-red-400/80 text-xs md:text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              BEFORE
            </div>
          </div>
        </div>

        {/* After (polished content) */}
        <div
          className="absolute inset-0 bg-[#0a0a0f] p-4 md:p-8"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="h-full rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 md:p-6 overflow-hidden">
            <div className="text-cyan-400/60 text-xs md:text-sm mb-2 md:mb-4 font-mono flex items-center gap-2">
              <Linkedin className="w-3 h-3 md:w-4 md:h-4" />
              LinkedIn Post
            </div>
            <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-white/80">
              <p className="font-semibold text-white text-sm md:text-base">We just saved a client $2.4M per year.</p>
              <p>Not by cutting corners. By cutting waste.</p>
              <p className="text-cyan-400">The 3-step framework that made it happen:</p>
              <p>1️⃣ Audit every resource (yes, all of them)</p>
              <p>2️⃣ Right-size ruthlessly</p>
              <p>3️⃣ Automate what humans forget</p>
              <p className="text-white/60">40% reduction in 90 days. Here&apos;s how →</p>
            </div>
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-cyan-400/80 text-xs md:text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              AFTER
            </div>
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <GripVertical className="w-4 h-4 md:w-5 md:h-5 text-black/60" />
          </div>
        </div>
      </div>
      <p className="text-center text-white/40 text-xs md:text-sm mt-4">← Drag to compare →</p>
    </div>
  );
}

// ============================================================================
// CONFETTI EFFECT
// ============================================================================

function Confetti({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ["#22d3ee", "#a855f7", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];

    // Create confetti pieces
    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        size: Math.random() * 10 + 5,
        speedX: (Math.random() - 0.5) * 15,
        speedY: Math.random() * -15 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let animationId: number;
    const gravity = 0.3;
    const friction = 0.99;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeCount = 0;

      confetti.forEach((c) => {
        c.speedY += gravity;
        c.speedX *= friction;
        c.x += c.speedX;
        c.y += c.speedY;
        c.rotation += c.rotationSpeed;

        if (c.y < canvas.height + 100) {
          activeCount++;

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate((c.rotation * Math.PI) / 180);
          ctx.fillStyle = c.color;
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [trigger]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// ============================================================================
// SCROLL REVEAL TEXT
// ============================================================================

function RevealText({ children, className = "" }: { children: string; className?: string }) {
  const { ref, isInView } = useInView(0.5);
  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
        >
          <span
            className={`inline-block transition-all duration-700 ${
              isInView ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            {word}&nbsp;
          </span>
        </span>
      ))}
    </span>
  );
}

// ============================================================================
// ANIMATED COUNTER
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

// ============================================================================
// TESTIMONIAL CARD
// ============================================================================

function TestimonialCard({ quote, name, role, company, delay }: { quote: string; name: string; role: string; company: string; delay: number }) {
  const { ref, isInView } = useInView();

  return (
    <TiltCard>
      <div
        ref={ref}
        className={`relative p-5 md:p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-700 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="flex gap-1 mb-3 md:mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-500 text-yellow-500" />
          ))}
        </div>

        <p className="text-white/70 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">&quot;{quote}&quot;</p>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-white text-sm md:text-base">{name}</div>
            <div className="text-xs md:text-sm text-white/40">{role}, {company}</div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

// ============================================================================
// STEP CARD
// ============================================================================

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
      <div className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent mb-3 md:mb-4">{step}</div>
      <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed text-sm md:text-base">{description}</p>
      {showConnector && (
        <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 w-12 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT DEMO
// ============================================================================

function ProductDemo() {
  const { ref, isInView } = useInView(0.2);
  const [demoStep, setDemoStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timings = [4000, 3000, 2500, 3500, 2000];

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
      const timeout = setTimeout(() => setIsPlaying(true), 800);
      return () => clearTimeout(timeout);
    }
  }, [isInView, isPlaying]);

  const ideas = [
    { title: "The $2M Framework", angle: "Case Study", score: 96 },
    { title: "5 Signs You're Bleeding Money", angle: "Listicle", score: 91 },
    { title: "Stop Paying for Unused Cloud", angle: "Direct", score: 88 },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-cyan-500/20 blur-3xl opacity-50" />

      <TiltCard>
        <div
          className={`relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-1000 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-b border-white/10 bg-white/5">
            <div className="flex gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-3 md:px-4 py-1 md:py-1.5 rounded-lg bg-white/5 text-[10px] md:text-xs text-white/50 flex items-center gap-2 border border-white/5">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500/50" />
                <span className="hidden sm:inline">app.contentengine.ai</span>
                <span className="sm:hidden">contentengine.ai</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex min-h-[350px] sm:min-h-[400px] md:min-h-[450px]">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:flex w-48 border-r border-white/5 bg-white/[0.02] flex-col p-3 gap-1">
              {[
                { icon: Sparkles, label: "Inputs", active: demoStep === 0 },
                { icon: Zap, label: "Ideas", active: demoStep === 1, badge: demoStep >= 1 ? "3" : null },
                { icon: Layers, label: "Content", active: demoStep >= 2 && demoStep <= 3 },
                { icon: Send, label: "Published", active: demoStep === 4 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    item.active
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-white/40 hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden">
              {/* Mobile step indicator */}
              <div className="flex md:hidden items-center gap-2 mb-4 text-xs text-white/50">
                <span className={demoStep === 0 ? "text-cyan-400" : ""}>Input</span>
                <ArrowRight className="w-3 h-3" />
                <span className={demoStep === 1 ? "text-cyan-400" : ""}>Ideas</span>
                <ArrowRight className="w-3 h-3" />
                <span className={demoStep >= 2 && demoStep <= 3 ? "text-cyan-400" : ""}>Content</span>
                <ArrowRight className="w-3 h-3" />
                <span className={demoStep === 4 ? "text-cyan-400" : ""}>Live</span>
              </div>

              {/* Step 0: Input */}
              {demoStep === 0 && (
                <div className="animate-fade-in h-full flex flex-col">
                  <h3 className="font-semibold text-white text-base md:text-lg mb-1">New Input</h3>
                  <p className="text-white/40 text-xs md:text-sm mb-4">Drop your raw idea</p>
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-white/70 text-xs md:text-sm">
                      Just closed a massive deal helping client cut cloud costs by 40%...
                      <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Ideas */}
              {demoStep === 1 && (
                <div className="animate-fade-in">
                  <h3 className="font-semibold text-white text-base md:text-lg mb-4">AI Ideas</h3>
                  <div className="space-y-2 md:space-y-3">
                    {ideas.map((idea, i) => (
                      <div
                        key={idea.title}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4 animate-slide-up"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm md:text-base truncate">{idea.title}</div>
                            <div className="text-xs text-cyan-400 mt-1">{idea.angle}</div>
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-cyan-400">{idea.score}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Generating */}
              {demoStep === 2 && (
                <div className="animate-fade-in">
                  <h3 className="font-semibold text-white text-base md:text-lg mb-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-cyan-400" />
                    Creating...
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {[Linkedin, Twitter].map((Icon, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
                        <Icon className="w-4 h-4 mb-3 text-white/50" />
                        <div className="space-y-2">
                          <div className="h-2 md:h-3 bg-white/10 rounded animate-pulse" />
                          <div className="h-2 md:h-3 bg-white/10 rounded animate-pulse w-4/5" />
                          <div className="h-2 md:h-3 bg-white/10 rounded animate-pulse w-3/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Ready */}
              {demoStep === 3 && (
                <div className="animate-fade-in">
                  <h3 className="font-semibold text-white text-base md:text-lg mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                    Ready to Publish
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Linkedin className="w-3 h-3 md:w-4 md:h-4 text-[#0A66C2]" />
                        <span className="text-[10px] md:text-xs text-white/50">LinkedIn</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-white/70 line-clamp-4">
                        We just saved a client $2.4M/year. The 3-step framework that made it possible...
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Twitter className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-xs text-white/50">Twitter</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-white/70 line-clamp-4">
                        Our client just cut their cloud bill by 40%. Thread on exactly how 🧵
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Published */}
              {demoStep === 4 && (
                <div className="animate-fade-in flex flex-col items-center justify-center h-full py-6 md:py-8">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 md:mb-6 animate-scale-in">
                    <Send className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2">Published!</h3>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-[#0A66C2]/20 text-[#0A66C2] text-xs font-medium">LinkedIn ✓</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">Twitter ✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700"
              style={{ width: `${((demoStep + 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      </TiltCard>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="flex items-center gap-1.5 md:gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setDemoStep(step)}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                demoStep === step ? "bg-cyan-400 w-6 md:w-8" : "bg-white/20 w-1.5 md:w-2"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 text-xs md:text-sm text-white/50 hover:text-white transition-colors"
        >
          {isPlaying ? (
            <>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 md:h-4 bg-current rounded-sm" />
                <div className="w-1 h-3 md:h-4 bg-current rounded-sm" />
              </div>
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3 md:w-4 md:h-4 fill-current" />
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
  const [showConfetti, setShowConfetti] = useState(false);

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
      setShowConfetti(true);

      // Reset confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden">
      <AuroraBackground />
      <Confetti trigger={showConfetti} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030014]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="font-bold text-base md:text-lg tracking-tight">Content Engine</span>
          </div>
          <MagneticButton
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm"
          >
            Join Waitlist
          </MagneticButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6 md:mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-white/70">Private Beta</span>
              <span className="text-cyan-400 font-medium">· <AnimatedCounter target={1247} /> waiting</span>
            </div>
          </div>

          {/* Headline with scramble effect */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-4 md:mb-6">
            <span className="block">
              <ScrambleText text="Stop Staring at" className="text-white" />
            </span>
            <span className="block mt-2">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                <ScrambleText text="Blank Screens" delay={500} />
              </span>
            </span>
          </h1>

          {/* Subheadline with reveal */}
          <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
            <RevealText>
              Drop a rough idea. Get scroll-stopping content for LinkedIn, Twitter, and Instagram in 60 seconds. AI that actually sounds like you.
            </RevealText>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12 animate-slide-up animation-delay-200">
            <MagneticButton
              size="lg"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              Get Early Access
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
            <Button
              variant="outline"
              size="lg"
              className="h-12 md:h-14 px-6 md:px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center animate-slide-up animation-delay-300">
            <div>
              <div className="text-xl md:text-3xl font-bold text-white"><AnimatedCounter target={50} suffix="K+" /></div>
              <div className="text-xs md:text-sm text-white/40">Posts Generated</div>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/10" />
            <div>
              <div className="text-xl md:text-3xl font-bold text-white"><AnimatedCounter target={10} suffix="x" /></div>
              <div className="text-xs md:text-sm text-white/40">Faster Creation</div>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/10" />
            <div>
              <div className="text-xl md:text-3xl font-bold text-white flex items-center justify-center gap-1">
                4.9 <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="text-xs md:text-sm text-white/40">Beta Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-16 md:py-28 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">
              <RevealText>See the Transformation</RevealText>
            </h2>
            <p className="text-white/50 text-sm md:text-base">Your messy thoughts → Polished, viral-ready content</p>
          </div>
          <BeforeAfterSlider />
        </div>
      </section>

      {/* Product Demo */}
      <section id="demo" className="py-16 md:py-28 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs md:text-sm font-medium mb-3 md:mb-4">
              <Play className="w-3 h-3 md:w-4 md:h-4" />
              Interactive Demo
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              <RevealText>Idea to Published in 60 Seconds</RevealText>
            </h2>
            <p className="text-white/50 text-sm md:text-base">Watch it work. No signup required.</p>
          </div>
          <ProductDemo />
        </div>
      </section>

      {/* Bento Features Grid */}
      <section className="py-16 md:py-28 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              <RevealText>Everything You Need to Ship Content</RevealText>
            </h2>
            <p className="text-white/50 text-sm md:text-base">One tool. Every platform. Zero writer&apos;s block.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <BentoCard
              icon={Wand2}
              title="AI That Gets You"
              description="Train it once on your voice. Every post sounds authentically you, not like a robot."
              size="default"
            />
            <BentoCard
              icon={Zap}
              title="Ideas on Demand"
              description="Drop a thought, link, or draft. Get 4 polished angles with hooks that stop the scroll."
              size="large"
            />
            <BentoCard
              icon={Layers}
              title="Platform-Perfect"
              description="Auto-optimized for each platform. Right length, format, and hashtags."
              size="default"
            />
            <BentoCard
              icon={Clock}
              title="Smart Scheduling"
              description="AI finds when your audience is most active. One click schedules everywhere."
              size="large"
            />
            <BentoCard
              icon={BarChart3}
              title="Performance Intel"
              description="Track what's working. Learn what resonates. Double down on winners."
              size="default"
            />
            <BentoCard
              icon={Target}
              title="Brand Voice Lock"
              description="Set your tone and style once. AI follows your rules religiously."
              size="default"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-28 px-4 md:px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold">
              <RevealText>Three Steps. That&apos;s It.</RevealText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            <StepCard
              step="01"
              title="Drop Your Idea"
              description="Paste a thought, URL, or half-baked draft. AI extracts the gold."
              delay={0}
              showConnector={true}
            />
            <StepCard
              step="02"
              title="Pick Your Winner"
              description="Get 4 content angles with hooks. Pick one or trust the AI scores."
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

      {/* Testimonials */}
      <section className="py-16 md:py-28 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              <RevealText>Loved by Content Creators</RevealText>
            </h2>
            <p className="text-white/50 text-sm md:text-base">Early beta testers are seeing real results.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <TestimonialCard
              quote="I went from spending 4 hours on content to 30 minutes. The AI actually captures my voice."
              name="Sarah Chen"
              role="Marketing Director"
              company="TechFlow"
              delay={0}
            />
            <TestimonialCard
              quote="Finally, a tool that doesn't make me sound like a LinkedIn bro. The hooks alone are worth it."
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

      {/* Final CTA / Waitlist */}
      <section id="waitlist" className="py-16 md:py-28 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <TiltCard>
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/10" />
              <div className="absolute inset-0 border border-white/10 rounded-3xl" />
              <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-cyan-500/20 rounded-full blur-[80px] md:blur-[100px]" />

              <div className="relative p-6 md:p-12 text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg shadow-cyan-500/25">
                  <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>

                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                  Ready to Ship More Content?
                </h2>
                <p className="text-white/60 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
                  Join <span className="text-cyan-400 font-semibold"><AnimatedCounter target={1247} /></span> creators on the waitlist.
                  Early access gets <span className="text-white">50% off</span> for life.
                </p>

                {status === "success" ? (
                  <div className="flex items-center justify-center gap-3 text-green-400 animate-fade-in py-4">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-semibold text-base md:text-lg">You&apos;re in! Check your email.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 h-12 md:h-14 px-4 md:px-5 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl text-sm md:text-base"
                        required
                      />
                      <Button
                        type="submit"
                        size="lg"
                        className="h-12 md:h-14 px-6 md:px-8 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl whitespace-nowrap"
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
                      No spam. Unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <span className="font-semibold text-sm md:text-base">Content Engine</span>
          </div>
          <p className="text-xs md:text-sm text-white/30">
            &copy; {new Date().getFullYear()} Content Engine. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes aurora-1 {
          0%, 100% { transform: rotate(-12deg) translateY(0); opacity: 0.3; }
          50% { transform: rotate(-8deg) translateY(-30px); opacity: 0.4; }
        }

        @keyframes aurora-2 {
          0%, 100% { transform: rotate(8deg) translateX(0); opacity: 0.2; }
          50% { transform: rotate(12deg) translateX(30px); opacity: 0.3; }
        }

        @keyframes aurora-3 {
          0%, 100% { transform: rotate(-5deg) translateY(0); opacity: 0.25; }
          50% { transform: rotate(-2deg) translateY(20px); opacity: 0.35; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-out; }
        .animate-aurora-1 { animation: aurora-1 8s ease-in-out infinite; }
        .animate-aurora-2 { animation: aurora-2 10s ease-in-out infinite; }
        .animate-aurora-3 { animation: aurora-3 12s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }

        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

        /* Mobile touch feedback */
        @media (hover: none) {
          .active\\:scale-95:active { transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
