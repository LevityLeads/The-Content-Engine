"use client";

import { Twitter, Linkedin, Instagram, Heart, MessageCircle, Repeat2, Share, Send, Bookmark, MoreHorizontal, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformMockupProps {
  children: React.ReactNode;
  className?: string;
}

// Twitter/X Post Mockup
export function TwitterMockup({ children, className }: PlatformMockupProps) {
  return (
    <div className={cn("bg-black rounded-xl border border-zinc-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-sm">Your Brand</span>
            <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
            </svg>
          </div>
          <span className="text-zinc-500 text-xs">@yourbrand</span>
        </div>
        <Twitter className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 text-zinc-500">
        <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">24</span>
        </button>
        <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
          <Repeat2 className="w-4 h-4" />
          <span className="text-xs">12</span>
        </button>
        <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-xs">148</span>
        </button>
        <button className="flex items-center gap-1 hover:text-sky-500 transition-colors">
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Instagram Post Mockup
export function InstagramMockup({ children, className }: PlatformMockupProps) {
  return (
    <div className={cn("bg-black rounded-xl border border-zinc-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full bg-black" />
          </div>
          <span className="font-semibold text-white text-sm">yourbrand</span>
        </div>
        <MoreHorizontal className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div>
        {children}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-white hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-6 h-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
            <Send className="w-6 h-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-6 h-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" />
        </div>
        <p className="text-white text-sm font-semibold">1,234 likes</p>
      </div>
    </div>
  );
}

// LinkedIn Post Mockup
export function LinkedInMockup({ children, className }: PlatformMockupProps) {
  return (
    <div className={cn("bg-[#1b1f23] rounded-xl border border-zinc-700 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-start gap-3 p-3 border-b border-zinc-700">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-white text-sm">Your Brand</span>
          </div>
          <span className="text-zinc-400 text-xs">Company • 10,000 followers</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-zinc-500 text-xs">2h •</span>
            <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 7 7 7 7 0 0 0-7-7zM3 8a5 5 0 0 1 5-5 4.94 4.94 0 0 1 2.6.75L4.75 9.6A4.94 4.94 0 0 1 3 8zm5 5a4.94 4.94 0 0 1-2.6-.75l5.85-5.85A4.94 4.94 0 0 1 13 8a5 5 0 0 1-5 5z" />
            </svg>
          </div>
        </div>
        <Linkedin className="w-5 h-5 text-[#0a66c2]" />
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
      </div>

      {/* Engagement Stats */}
      <div className="px-3 py-2 border-t border-zinc-700">
        <div className="flex items-center gap-1 text-zinc-400 text-xs">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <Heart className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <span>128 • 24 comments</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around px-3 py-2 border-t border-zinc-700 text-zinc-400">
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors py-2 px-4 rounded hover:bg-zinc-800">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium">Like</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors py-2 px-4 rounded hover:bg-zinc-800">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors py-2 px-4 rounded hover:bg-zinc-800">
          <Repeat2 className="w-4 h-4" />
          <span className="text-xs font-medium">Repost</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors py-2 px-4 rounded hover:bg-zinc-800">
          <Send className="w-4 h-4" />
          <span className="text-xs font-medium">Send</span>
        </button>
      </div>
    </div>
  );
}

// Generic wrapper that selects the right mockup based on platform
interface PlatformPostMockupProps {
  platform: string;
  children: React.ReactNode;
  className?: string;
}

export function PlatformPostMockup({ platform, children, className }: PlatformPostMockupProps) {
  switch (platform.toLowerCase()) {
    case "twitter":
      return <TwitterMockup className={className}>{children}</TwitterMockup>;
    case "instagram":
      return <InstagramMockup className={className}>{children}</InstagramMockup>;
    case "linkedin":
      return <LinkedInMockup className={className}>{children}</LinkedInMockup>;
    default:
      return <div className={className}>{children}</div>;
  }
}
