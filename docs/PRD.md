# Product Requirements Document: The Content Engine

## Content Automation System

**Version:** 1.0
**Last Updated:** January 2026
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [User Personas](#4-user-personas)
5. [System Architecture](#5-system-architecture)
6. [Core Workflow](#6-core-workflow)
7. [Feature Specifications](#7-feature-specifications)
8. [Technical Specifications](#8-technical-specifications)
9. [Data Models](#9-data-models)
10. [API Integrations](#10-api-integrations)
11. [User Interface Design](#11-user-interface-design)
12. [Intelligence & Learning System](#12-intelligence--learning-system)
13. [Security & Privacy](#13-security--privacy)
14. [Development Phases](#14-development-phases)
15. [Success Metrics](#15-success-metrics)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Future Considerations](#17-future-considerations)
18. [Appendices](#18-appendices)

---

## 1. Executive Summary

### 1.1 Vision

The Content Engine is an AI-powered content automation system that transforms raw inputs (text, articles, links, documents) into polished, platform-specific social media content. The system handles the entire content lifecycle—from ideation through publishing—while maintaining human oversight and continuously learning to reduce manual intervention over time.

### 1.2 Core Value Proposition

- **Input Flexibility:** Accept content in any form—type it, paste it, link it, upload it
- **AI-Powered Ideation:** Generate multiple content angles from a single input
- **Platform Intelligence:** Automatically adapt content for each platform's unique requirements
- **Visual Generation:** Create on-brand images using state-of-the-art AI
- **Unified Publishing:** Post to all platforms through a single interface
- **Adaptive Learning:** System improves with usage, requiring less oversight over time

### 1.3 Target Platforms (MVP)

| Platform | Content Types | Priority |
|----------|--------------|----------|
| X (Twitter) | Text posts, images, threads | P0 |
| Instagram | Feed posts, carousels | P0 |
| LinkedIn | Text posts, images, carousels | P0 |

### 1.4 Tech Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 14+ (App Router) | Dashboard UI |
| Hosting | Vercel | Deployment, Edge Functions |
| Database | Supabase (PostgreSQL) | Data persistence, Auth, Realtime |
| LLM | Claude API (Anthropic) | Ideation, copywriting, routing |
| Image Generation | Nano Banana Pro (Gemini API) | Visual content creation |
| Social Publishing | Late.dev API | Multi-platform posting |

---

## 2. Problem Statement

### 2.1 Current Pain Points

Content creators and marketers face significant friction in their content workflows:

1. **Capture Friction:** Ideas occur at inconvenient times; by the time creators reach their computer, context is lost
2. **Ideation Fatigue:** Transforming raw thoughts into platform-ready content requires significant creative energy
3. **Platform Fragmentation:** Each social platform has unique requirements (character limits, image dimensions, tone expectations)
4. **Visual Creation Bottleneck:** Creating engaging visuals for each post is time-consuming and often requires design skills
5. **Publishing Complexity:** Managing multiple platform accounts, optimal posting times, and cross-posting is tedious
6. **Quality Inconsistency:** Without systematic processes, content quality varies significantly

### 2.2 Market Gap

Existing solutions address pieces of this workflow:
- **Note-taking apps** capture ideas but don't transform them
- **AI writing tools** generate copy but lack platform awareness
- **Social schedulers** publish content but don't create it
- **Design tools** create visuals but require manual effort

**The Content Engine unifies the entire pipeline** from raw thought to published post.

---

## 3. Solution Overview

### 3.1 System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THE CONTENT ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  INPUT  │───▶│  PARSE  │───▶│ IDEATE  │───▶│ APPROVE │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       │                                             │                   │
│   Text Ideas                                        ▼                   │
│   Articles        ┌─────────────────────────────────────────┐          │
│   Links           │            HUMAN CHECKPOINT             │          │
│   Documents       └─────────────────────────────────────────┘          │
│                                     │                                   │
│                                     ▼                                   │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  LEARN  │◀───│ PUBLISH │◀───│ REVIEW  │◀───│GENERATE │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       │                                             │                   │
│   Feedback                      ┌───────────────────────────┐          │
│   Engagement      ◀─────────────│      HUMAN CHECKPOINT     │          │
│   Patterns                      └───────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Principles

1. **Human-in-the-Loop:** Critical decisions require human approval; automation assists but doesn't replace judgment
2. **Progressive Autonomy:** System earns trust through consistent performance, gradually requiring less oversight
3. **Platform-Native:** Content should feel native to each platform, not cross-posted
4. **Brand Consistency:** All outputs adhere to defined brand voice and visual guidelines
5. **Transparent AI:** Users understand why the AI made specific recommendations

---

## 4. User Personas

### 4.1 Primary Persona: Solo Creator

**Name:** Alex Chen
**Role:** Independent content creator, consultant
**Platforms:** X (12K followers), LinkedIn (8K), Instagram (5K)

**Goals:**
- Maintain consistent posting cadence across platforms
- Transform client conversations and industry observations into content
- Spend less time on content creation, more time on core business

**Pain Points:**
- Ideas come during commutes, meetings, walks—hard to capture
- Rewriting content for each platform is tedious
- Creating visuals takes too long; often posts text-only
- Inconsistent posting schedule hurts engagement

**Success Metrics:**
- Reduce content creation time by 70%
- Increase posting frequency from 3x/week to daily
- Maintain or improve engagement rates

### 4.2 Secondary Persona: Agency Manager (Future)

**Name:** Sarah Martinez
**Role:** Social media manager at boutique agency
**Manages:** 8 client accounts across multiple platforms

**Goals:**
- Efficiently manage multiple brand voices
- Streamline client approval workflows
- Scale content output without proportional time increase

**Pain Points:**
- Context-switching between client brands
- Approval bottlenecks slow publishing
- Difficult to maintain quality across high volume

**Success Metrics:**
- Handle 50% more clients without additional headcount
- Reduce approval cycle time by 60%
- Zero brand voice mix-ups

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT LAYER                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │                      Dashboard (Next.js)                   │             │
│  │   • Text input    • Document upload    • Link/URL paste    │             │
│  └────────────────────────────────────────┬───────────────────┘             │
│                                           │                                  │
│         Future: Mobile PWA, iOS Shortcuts, API webhooks                      │
│                                                                              │
└───────────────────────────────────────────┼──────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   API LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js API Routes / Edge Functions              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  /api/inputs      - Receive and queue raw inputs                    │    │
│  │  /api/ideas       - Generate and manage content ideas               │    │
│  │  /api/content     - Generate platform-specific content              │    │
│  │  /api/images      - Generate and manage images                      │    │
│  │  /api/publish     - Handle publishing workflow                      │    │
│  │  /api/analytics   - Aggregate and serve analytics                   │    │
│  │  /api/webhooks    - Handle Late.dev callbacks (Future: more)        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                SERVICE LAYER                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Parser    │  │  Ideation   │  │  Generator  │  │  Publisher  │        │
│  │   Service   │  │   Engine    │  │   Engine    │  │   Service   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                 │
│         ▼                ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Intelligence Layer                            │    │
│  │  • Confidence Scoring  • Pattern Recognition  • Recommendation      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              INTEGRATION LAYER                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Claude    │  │ Nano Banana │  │  Late.dev   │  │  Supabase   │        │
│  │    API      │  │    Pro      │  │     API     │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│   Text/Ideation    Image Gen      Social Publish    Database/Auth           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Component Responsibilities

#### 5.2.1 Parser Service

**Purpose:** Transform diverse input types into structured, actionable data

**Inputs (MVP - Dashboard Only):**
- Raw text (ideas, notes, threads)
- Article URLs (for extraction/summarization)
- Links to external content
- Document uploads (PDF, Word, etc.)

**Processing:**
1. Detect input type
2. Extract content (parse documents, fetch URLs)
3. Summarize and extract key themes
4. Identify potential content angles
5. Store structured output with metadata

**Output Schema:**
```typescript
interface ParsedInput {
  id: string;
  originalType: 'text' | 'article' | 'link' | 'document';
  rawContent: string;
  summary: string;
  keyThemes: string[];
  potentialAngles: string[];
  extractedEntities: Entity[];
  sourceUrl?: string;
  createdAt: Date;
  metadata: {
    wordCount: number;
    language: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}
```

#### 5.2.2 Ideation Engine

**Purpose:** Generate diverse, platform-aware content ideas from parsed inputs

**Process:**
1. Receive parsed input
2. Load brand voice guidelines
3. Generate 3-5 content ideas per input
4. Score ideas for platform fit
5. Present for human approval

**Idea Generation Prompts Include:**
- Brand voice parameters
- Platform-specific best practices
- Historical performance data (what worked before)
- Current trends/hooks
- Content type variety (educational, entertaining, promotional)

**Output Schema:**
```typescript
interface ContentIdea {
  id: string;
  inputId: string;
  concept: string;  // 1-2 sentence summary
  angle: 'educational' | 'entertaining' | 'inspirational' | 'promotional' | 'conversational';
  targetPlatforms: Platform[];
  suggestedFormats: ContentFormat[];
  keyPoints: string[];
  potentialHooks: string[];
  confidenceScore: number;  // 0-100
  reasoning: string;  // Why AI thinks this will perform
  status: 'pending' | 'approved' | 'rejected' | 'generated';
  createdAt: Date;
}
```

#### 5.2.3 Generator Engine

**Purpose:** Create platform-specific copy and visuals from approved ideas

**Copy Generation:**
1. Load approved idea
2. Load platform specifications
3. Load brand voice guidelines
4. Generate platform-native copy
5. Create variations (A/B testing ready)

**Image Generation:**
1. Analyze copy for visual themes
2. Generate image prompt based on brand visual guidelines
3. Call Nano Banana Pro API
4. Apply brand overlays/watermarks if configured
5. Generate platform-specific crops

**Output Schema:**
```typescript
interface GeneratedContent {
  id: string;
  ideaId: string;
  platform: Platform;
  copy: {
    primary: string;
    hashtags: string[];
    callToAction?: string;
    threadParts?: string[];  // For Twitter threads
    carouselSlides?: string[];  // For carousel posts
  };
  visuals: {
    primary: GeneratedImage;
    variations: GeneratedImage[];
    carouselImages?: GeneratedImage[];
  };
  metadata: {
    characterCount: number;
    estimatedReadTime: number;
    complianceCheck: ComplianceResult;
  };
  status: 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';
  createdAt: Date;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  dimensions: { width: number; height: number };
  format: 'png' | 'jpg' | 'webp';
  platformCrops: PlatformCrop[];
}
```

#### 5.2.4 Publisher Service

**Purpose:** Handle scheduling and publishing through Late.dev

**Responsibilities:**
1. Queue approved content for publishing
2. Manage scheduling across timezones
3. Handle Late.dev OAuth flows
4. Monitor publishing status
5. Retry failed publishes
6. Collect post-publish analytics

---

## 6. Core Workflow

### 6.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT ENGINE WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: INPUT CAPTURE (via Dashboard)                                     │
│  ───────────────────────────────────────                                    │
│                                                                             │
│  User captures idea via dashboard:                                          │
│  • Text input → Type or paste raw ideas                                    │
│  • URL paste → Auto-detected, content extracted                            │
│  • Document upload → PDF, Word, etc. parsed                                │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  STAGE 2: PARSING & ANALYSIS                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  System automatically:                                                      │
│  • Extracts article content (if URL)                                       │
│  • Parses document content (if upload)                                     │
│  • Identifies key themes and angles                                        │
│  • Stores in inputs table                                                  │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  STAGE 3: IDEATION                                                          │
│  ────────────────                                                           │
│                                                                             │
│  Claude API generates:                                                      │
│  • 3-5 content ideas per input                                             │
│  • Platform recommendations                                                 │
│  • Confidence scores                                                        │
│  • Reasoning for each suggestion                                           │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║                     HUMAN CHECKPOINT #1                                ║ │
│  ║                     ───────────────────                                ║ │
│  ║  User reviews ideas in dashboard:                                      ║ │
│  ║  • Approve (→ move to generation)                                      ║ │
│  ║  • Reject (→ archive with feedback)                                    ║ │
│  ║  • Edit (→ modify concept, re-ideate)                                  ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  STAGE 4: CONTENT GENERATION                                                │
│  ───────────────────────────                                                │
│                                                                             │
│  For each approved idea:                                                    │
│  • Generate platform-specific copy (Claude)                                │
│  • Generate matching visuals (Nano Banana Pro)                             │
│  • Create carousel slides if applicable                                    │
│  • Run compliance checks                                                   │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║                     HUMAN CHECKPOINT #2                                ║ │
│  ║                     ───────────────────                                ║ │
│  ║  User reviews generated content:                                       ║ │
│  ║  • Preview exactly as it will appear                                   ║ │
│  ║  • Edit copy directly                                                  ║ │
│  ║  • Regenerate image with new prompt                                    ║ │
│  ║  • Approve for scheduling                                              ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  STAGE 5: SCHEDULING & PUBLISHING                                           │
│  ────────────────────────────────                                           │
│                                                                             │
│  User selects:                                                              │
│  • Publish now                                                              │
│  • Schedule for optimal time (AI suggested)                                │
│  • Schedule for specific time                                              │
│                                                                             │
│  Late.dev handles:                                                          │
│  • OAuth authentication                                                     │
│  • Platform-specific posting                                               │
│  • Rate limit management                                                   │
│  • Error handling and retries                                              │
│                                                                             │
│                              ▼                                              │
│                                                                             │
│  STAGE 6: LEARNING & ANALYTICS                                              │
│  ────────────────────────────                                               │
│                                                                             │
│  Post-publish tracking:                                                     │
│  • Engagement metrics (likes, comments, shares)                            │
│  • Reach and impressions                                                   │
│  • Click-through rates (if applicable)                                     │
│                                                                             │
│  Learning system records:                                                   │
│  • Which ideas were approved/rejected                                      │
│  • User edits to generated content                                         │
│  • Engagement performance vs predictions                                   │
│  • Time-of-day performance patterns                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Feature Specifications

### 7.1 Input Management (Dashboard-Based)

All inputs are captured through the dashboard interface. Future versions may add additional input methods (iOS Shortcuts, API webhooks, mobile app).

#### 7.1.1 Text Input

| Attribute | Specification |
|-----------|--------------|
| Max Length | 10,000 characters |
| Formats | Plain text, Markdown |
| Rich Content | Links auto-detected and expanded |
| Use Cases | Raw ideas, notes, talking points, outlines |

**Dashboard Interface:**
- Large text area with character count
- Markdown preview toggle
- Auto-save drafts
- Quick submit or save for later

#### 7.1.2 Article/URL Input

| Attribute | Specification |
|-----------|--------------|
| Supported Sites | Any publicly accessible URL |
| Extraction | Readability algorithm + metadata |
| Paywall Handling | User must provide content if paywalled |
| Max Content | 10,000 words |

**Processing Steps:**
1. Fetch URL with appropriate headers
2. Extract main content using readability
3. Capture metadata (title, author, date, images)
4. Summarize content via Claude
5. Identify quotable segments
6. Store with source attribution

#### 7.1.3 Document Upload

| Attribute | Specification |
|-----------|--------------|
| Supported Formats | .pdf, .docx, .doc, .txt, .md |
| Max File Size | 10MB |
| Max Content | 10,000 words |
| Processing | Extract text, preserve structure |

**Processing Steps:**
1. Upload file to Supabase Storage
2. Extract text content (PDF parsing, DOCX extraction)
3. Preserve document structure (headings, lists)
4. Summarize via Claude
5. Store with source file reference

### 7.2 Idea Generation

#### 7.2.1 Generation Parameters

| Parameter | Default | Configurable |
|-----------|---------|--------------|
| Ideas per Input | 4 | Yes (1-10) |
| Creativity Level | Medium | Yes (Low/Med/High) |
| Platform Focus | All connected | Yes (select platforms) |
| Content Types | All | Yes (select types) |

#### 7.2.2 Idea Presentation

Each idea displays:
- **Concept:** 1-2 sentence description
- **Angle:** Educational, Entertaining, Inspirational, Promotional, Conversational
- **Target Platforms:** Icons indicating recommended platforms
- **Confidence Score:** Visual indicator (percentage)
- **Key Points:** Bulleted list of main talking points
- **Suggested Hook:** Opening line suggestion

#### 7.2.3 Approval Actions

| Action | Behavior |
|--------|----------|
| Approve | Move to generation queue |
| Reject | Archive with optional feedback |
| Edit | Open inline editor, regenerate on save |
| Save for Later | Move to saved ideas list |
| Request More | Generate additional ideas from same input |

### 7.3 Content Generation

#### 7.3.1 Platform Specifications

**X (Twitter):**
| Attribute | Specification |
|-----------|--------------|
| Character Limit | 280 (standard) / 25,000 (long-form for premium) |
| Image Dimensions | 1200×675 (16:9) or 1080×1080 (1:1) |
| Thread Support | Yes, up to 25 tweets |
| Hashtag Strategy | 1-2 relevant hashtags |
| Mention Detection | Auto-detect and validate handles |

**Instagram:**
| Attribute | Specification |
|-----------|--------------|
| Caption Limit | 2,200 characters |
| Image Dimensions | 1080×1080 (feed) / 1080×1350 (portrait) |
| Carousel Support | Yes, up to 10 slides |
| Hashtag Strategy | Up to 30, recommend 5-10 |
| Alt Text | Auto-generated for accessibility |

**LinkedIn:**
| Attribute | Specification |
|-----------|--------------|
| Character Limit | 3,000 characters |
| Image Dimensions | 1200×627 (landscape) / 1080×1080 (square) |
| Carousel Support | Yes (PDF upload via Late.dev) |
| Hashtag Strategy | 3-5 relevant hashtags |
| Formatting | Line breaks for readability |

#### 7.3.2 Copy Generation

**Process:**
1. Load approved idea with context
2. Load brand voice configuration
3. Load platform specifications
4. Generate initial draft
5. Apply platform-specific formatting
6. Run quality checks (grammar, brand alignment)
7. Generate 2-3 variations

**Brand Voice Integration:**
```typescript
interface BrandVoice {
  id: string;
  name: string;
  description: string;
  tone: string[];  // e.g., ["professional", "approachable", "witty"]
  vocabulary: {
    preferred: string[];  // Words to use
    avoided: string[];    // Words to never use
  };
  examples: {
    good: string[];
    bad: string[];
  };
  platformOverrides: {
    [platform: string]: Partial<BrandVoice>;
  };
}
```

#### 7.3.3 Image Generation

**Nano Banana Pro Integration:**

| Attribute | Specification |
|-----------|--------------|
| Model | gemini-3-pro-image-preview |
| Resolution | Up to 4K (platform-appropriate) |
| Styles | Photorealistic, Illustrated, Minimalist, etc. |
| Text in Images | Supported with accurate rendering |
| Generation Time | ~10-30 seconds |
| Watermark | SynthID (automatic, invisible) |

**Visual Brand Guidelines:**
```typescript
interface VisualBrand {
  id: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  style: 'photorealistic' | 'illustrated' | 'minimalist' | '3d' | 'abstract';
  moodKeywords: string[];  // e.g., ["modern", "warm", "professional"]
  avoidElements: string[]; // e.g., ["clipart", "stock photo feel"]
  logoOverlay?: {
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}
```

**Prompt Construction:**
```typescript
function buildImagePrompt(idea: ContentIdea, brand: VisualBrand): string {
  return `
    Create a ${brand.style} image for social media.

    Context: ${idea.concept}
    Key themes: ${idea.keyPoints.join(', ')}

    Style requirements:
    - Color palette: ${brand.colorPalette.primary}, ${brand.colorPalette.secondary}
    - Mood: ${brand.moodKeywords.join(', ')}
    - Avoid: ${brand.avoidElements.join(', ')}

    The image should feel ${brand.moodKeywords[0]} and work well as a ${platform} post.

    Important: Do not include any text in the image unless specifically requested.
  `;
}
```

### 7.4 Content Review

#### 7.4.1 Preview Interface

**Features:**
- Device-frame mockups (shows exactly how post will appear)
- Side-by-side platform comparison
- Real-time character count with limit indicator
- Image zoom and crop adjustment
- Accessibility preview (alt text, contrast)

#### 7.4.2 Editing Capabilities

| Feature | Description |
|---------|-------------|
| Inline Text Edit | Click to edit any copy directly |
| Image Regenerate | New prompt → new image |
| Image Swap | Upload custom image |
| Hashtag Manager | Add/remove/reorder hashtags |
| Link Preview | See how links will unfurl |
| A/B Variant | Create alternative versions |

### 7.5 Publishing

#### 7.5.1 Scheduling Options

| Option | Description |
|--------|-------------|
| Publish Now | Immediate posting |
| Optimal Time | AI-suggested based on audience |
| Custom Schedule | Pick date/time |
| Queue | Add to content queue with auto-spacing |

#### 7.5.2 Late.dev Integration

**Capabilities via Late.dev:**
- OAuth handling for all platforms
- Unified posting API
- Rate limit management
- Retry logic for failures
- Analytics collection

**API Flow:**
```typescript
// Connect account
const authUrl = await late.getAuthUrl('twitter', callbackUrl);

// Create post
const post = await late.createPost({
  platforms: ['twitter', 'linkedin'],
  content: {
    text: 'Post content here',
    media: [{ url: 'https://...', type: 'image' }]
  },
  scheduledFor: '2026-01-20T14:00:00Z'
});

// Get analytics
const analytics = await late.getPostAnalytics(post.id);
```

### 7.6 Analytics Dashboard

#### 7.6.1 Metrics Tracked

| Metric | Platforms | Description |
|--------|-----------|-------------|
| Impressions | All | Times content was displayed |
| Reach | All | Unique accounts reached |
| Engagement | All | Total interactions |
| Likes | All | Favorites/likes |
| Comments | All | Replies and comments |
| Shares | All | Retweets, reposts, shares |
| Clicks | All | Link clicks |
| Saves | Instagram, LinkedIn | Bookmarks/saves |
| Profile Visits | All | Clicks to profile |

#### 7.6.2 Analytics Views

1. **Overview Dashboard:** High-level metrics across all platforms
2. **Platform Deep-Dive:** Platform-specific detailed analytics
3. **Content Performance:** Individual post performance
4. **Trend Analysis:** Performance over time
5. **Best Performers:** Top content by various metrics

---

## 8. Technical Specifications

### 8.1 Frontend Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   ├── (dashboard)/              # Main app routes
│   │   ├── inputs/               # Input management
│   │   ├── ideas/                # Idea review
│   │   ├── content/              # Content generation & review
│   │   ├── calendar/             # Scheduling calendar
│   │   ├── analytics/            # Analytics dashboard
│   │   └── settings/             # Account & brand settings
│   ├── api/                      # API routes
│   │   ├── inputs/
│   │   ├── ideas/
│   │   ├── content/
│   │   ├── images/
│   │   ├── publish/
│   │   ├── analytics/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Base UI components
│   ├── inputs/                   # Input-related components
│   ├── ideas/                    # Idea review components
│   ├── content/                  # Content preview/edit components
│   ├── analytics/                # Chart and metric components
│   └── layout/                   # Layout components
├── lib/
│   ├── supabase/                 # Supabase client & helpers
│   ├── claude/                   # Claude API integration
│   ├── gemini/                   # Nano Banana Pro integration
│   ├── late/                     # Late.dev integration
│   └── utils/                    # Utility functions
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
└── styles/                       # Global styles
```

### 8.2 Database Schema (Supabase)

```sql
-- Users and Authentication (handled by Supabase Auth)

-- Organizations (for future multi-tenant support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization relationship
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Brand configurations
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  voice_config JSONB NOT NULL DEFAULT '{}',
  visual_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connected social accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'instagram', 'linkedin'
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  late_account_id TEXT, -- Late.dev reference
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, platform_user_id)
);

-- Raw inputs
CREATE TABLE inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'text', 'article', 'link', 'document'
  raw_content TEXT,
  file_url TEXT, -- For document uploads
  parsed_content JSONB, -- Structured extracted content
  summary TEXT,
  key_themes TEXT[],
  status TEXT DEFAULT 'pending', -- 'pending', 'parsed', 'ideated', 'archived'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_id UUID REFERENCES inputs(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  angle TEXT NOT NULL,
  target_platforms TEXT[] NOT NULL,
  suggested_formats TEXT[],
  key_points TEXT[],
  potential_hooks TEXT[],
  confidence_score INTEGER, -- 0-100
  ai_reasoning TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'generated'
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated content
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  copy_primary TEXT NOT NULL,
  copy_hashtags TEXT[],
  copy_cta TEXT,
  copy_thread_parts TEXT[], -- For Twitter threads
  copy_carousel_slides TEXT[], -- For carousels
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'scheduled', 'published', 'failed'
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  late_post_id TEXT, -- Late.dev reference
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated images
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  dimensions JSONB, -- { width: number, height: number }
  format TEXT, -- 'png', 'jpg', 'webp'
  is_primary BOOLEAN DEFAULT false,
  platform_crops JSONB, -- Platform-specific versions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post analytics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}'
);

-- Learning/feedback data
CREATE TABLE feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL, -- 'idea', 'content', 'image'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approve', 'reject', 'edit', 'regenerate'
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys for webhooks
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_inputs_brand_status ON inputs(brand_id, status);
CREATE INDEX idx_ideas_brand_status ON ideas(brand_id, status);
CREATE INDEX idx_content_brand_status ON content(brand_id, status);
CREATE INDEX idx_content_scheduled ON content(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_analytics_content ON analytics(content_id, collected_at);
CREATE INDEX idx_feedback_entity ON feedback_events(entity_type, entity_id);

-- Row Level Security Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (users can only access their organization's data)
CREATE POLICY "Users can access their organization's brands"
  ON brands
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### 8.3 API Specifications

#### 8.3.1 Input Endpoints

**POST /api/inputs**
```typescript
// Request
{
  type: 'text' | 'link' | 'article' | 'document',
  content: string,  // Text content or URL
  fileId?: string,  // For document uploads (Supabase Storage reference)
  brandId: string
}

// Response
{
  success: true,
  input: {
    id: string,
    status: 'pending',
    createdAt: string
  }
}
```

**POST /api/inputs/upload**
```typescript
// Headers
Content-Type: multipart/form-data

// Body
file: File  // PDF, DOCX, etc.
brandId: string

// Response
{
  success: true,
  inputId: string,
  status: 'processing',
  fileName: string
}
```

#### 8.3.2 Idea Endpoints

**GET /api/ideas**
```typescript
// Query params
?brandId=<id>&status=pending&limit=20&offset=0

// Response
{
  ideas: Idea[],
  total: number,
  hasMore: boolean
}
```

**PATCH /api/ideas/:id**
```typescript
// Request
{
  status: 'approved' | 'rejected',
  feedback?: string
}

// Response
{
  success: true,
  idea: Idea
}
```

#### 8.3.3 Content Endpoints

**POST /api/content/generate**
```typescript
// Request
{
  ideaId: string,
  platforms: string[],
  options?: {
    includeImages: boolean,
    variations: number
  }
}

// Response
{
  success: true,
  content: Content[],
  jobId: string  // For async image generation
}
```

**POST /api/content/:id/publish**
```typescript
// Request
{
  scheduledFor?: string,  // ISO timestamp, or null for immediate
}

// Response
{
  success: true,
  content: Content,
  latePostId: string
}
```

### 8.4 External API Integration

#### 8.4.1 Claude API (Anthropic)

**Usage:** Ideation, copywriting, content routing

**Configuration:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Ideation call
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: IDEATION_SYSTEM_PROMPT,
  messages: [
    {
      role: 'user',
      content: buildIdeationPrompt(input, brand)
    }
  ]
});
```

**Rate Limits:** Handle with exponential backoff

**Cost Optimization:**
- Use claude-sonnet-4-20250514 for ideation (balance of quality/cost)
- Cache common prompts
- Batch similar requests where possible

#### 8.4.2 Gemini API (Nano Banana Pro)

**Usage:** Image generation

**Configuration:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-image-preview'  // Nano Banana Pro
});

// Image generation
const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{ text: imagePrompt }]
  }],
  generationConfig: {
    responseModalities: ['image'],
    imageGenerationConfig: {
      aspectRatio: '16:9',
      numberOfImages: 1
    }
  }
});
```

**Considerations:**
- SynthID watermark is automatic
- May need Google AI Pro subscription for volume
- Handle generation failures gracefully

#### 8.4.3 Late.dev API

**Usage:** Social media publishing and analytics

**Configuration:**
```typescript
import { LateClient } from '@late/sdk';

const late = new LateClient({
  apiKey: process.env.LATE_API_KEY,
});

// Connect account
const authUrl = await late.accounts.getAuthUrl({
  platform: 'twitter',
  redirectUrl: `${process.env.NEXT_PUBLIC_URL}/api/callbacks/late`
});

// Create post
const post = await late.posts.create({
  accountIds: ['acc_123', 'acc_456'],
  content: {
    text: 'Post content',
    mediaUrls: ['https://...']
  },
  scheduledFor: new Date('2026-01-20T14:00:00Z')
});

// Get analytics
const analytics = await late.analytics.getPost(post.id);
```

---

## 9. Data Models

### 9.1 Core Types

```typescript
// Enums
type InputType = 'text' | 'article' | 'link' | 'document';
type IdeaStatus = 'pending' | 'approved' | 'rejected' | 'generated';
type ContentStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';
type Platform = 'twitter' | 'instagram' | 'linkedin';
type ContentAngle = 'educational' | 'entertaining' | 'inspirational' | 'promotional' | 'conversational';

// Core interfaces
interface Input {
  id: string;
  brandId: string;
  userId: string;
  type: InputType;
  rawContent?: string;
  fileUrl?: string;  // For document uploads
  parsedContent?: {
    summary: string;
    keyThemes: string[];
    extractedEntities: Entity[];
  };
  status: 'pending' | 'parsed' | 'ideated' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Idea {
  id: string;
  inputId: string;
  brandId: string;
  concept: string;
  angle: ContentAngle;
  targetPlatforms: Platform[];
  suggestedFormats: string[];
  keyPoints: string[];
  potentialHooks: string[];
  confidenceScore: number;
  aiReasoning: string;
  status: IdeaStatus;
  userFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Content {
  id: string;
  ideaId: string;
  brandId: string;
  platform: Platform;
  copy: {
    primary: string;
    hashtags: string[];
    cta?: string;
    threadParts?: string[];
    carouselSlides?: string[];
  };
  images: Image[];
  status: ContentStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  latePostId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Image {
  id: string;
  contentId: string;
  prompt: string;
  url: string;
  storagePath?: string;
  dimensions: { width: number; height: number };
  format: 'png' | 'jpg' | 'webp';
  isPrimary: boolean;
  platformCrops: Record<Platform, string>;
  createdAt: Date;
}

interface Brand {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  voiceConfig: BrandVoice;
  visualConfig: VisualBrand;
  createdAt: Date;
  updatedAt: Date;
}

interface SocialAccount {
  id: string;
  brandId: string;
  platform: Platform;
  platformUserId: string;
  platformUsername?: string;
  lateAccountId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Analytics {
  id: string;
  contentId: string;
  platform: Platform;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  collectedAt: Date;
  rawData: Record<string, unknown>;
}
```

---

## 10. API Integrations

### 10.1 Integration Summary

| Service | Purpose | Auth Method | Rate Limits |
|---------|---------|-------------|-------------|
| Claude (Anthropic) | LLM for ideation/copy | API Key | Tier-based |
| Gemini (Google) | Image generation | API Key | 100-1000/day |
| Late.dev | Social publishing | API Key + OAuth | Plan-based |
| Supabase | Database, Auth, Storage | API Key | Plan-based |

### 10.2 Error Handling Strategy

```typescript
interface APIError {
  service: 'claude' | 'gemini' | 'late' | 'supabase';
  code: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryable(error)) {
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );

      await sleep(delay);
    }
  }

  throw lastError!;
}
```

### 10.3 Webhook Security

```typescript
// Verify webhook authenticity
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// API key validation
async function validateApiKey(key: string): Promise<User | null> {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const { data } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date() })
    .eq('key_hash', keyHash);

  return getUser(data.user_id);
}
```

---

## 11. User Interface Design

### 11.1 Design Principles

1. **Clarity Over Cleverness:** Every element should have clear purpose
2. **Progressive Disclosure:** Show what's needed, hide complexity until required
3. **Instant Feedback:** Every action should have immediate visual response
4. **Mobile-Aware:** Core workflows should work on mobile devices

### 11.2 Key Screens

#### 11.2.1 Dashboard (Home)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE CONTENT ENGINE                              [Settings] [Profile]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  + Add Input                                                     │   │
│  │  ──────────────────────────────────────────────────────────────  │   │
│  │  [Text] [Link/URL] [Upload Document]                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐                      │
│  │  IDEAS PENDING      │  │  CONTENT READY      │                      │
│  │  ───────────────    │  │  ─────────────      │                      │
│  │       12            │  │       5             │                      │
│  │  [Review →]         │  │  [Review →]         │                      │
│  └─────────────────────┘  └─────────────────────┘                      │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐                      │
│  │  SCHEDULED          │  │  PUBLISHED TODAY    │                      │
│  │  ─────────          │  │  ───────────────    │                      │
│  │       8             │  │       3             │                      │
│  │  [View Calendar →]  │  │  [View Analytics →] │                      │
│  └─────────────────────┘  └─────────────────────┘                      │
│                                                                         │
│  RECENT ACTIVITY                                                        │
│  ───────────────                                                        │
│  • Voice note processed → 4 ideas generated        2 min ago           │
│  • "AI trends" post published to LinkedIn          15 min ago          │
│  • 3 ideas approved, generating content...         1 hour ago          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 11.2.2 Idea Review

```
┌─────────────────────────────────────────────────────────────────────────┐
│  IDEAS TO REVIEW (12)                            [Filter ▼] [Sort ▼]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  From: Voice note about AI tools (2 hours ago)                         │
│  ══════════════════════════════════════════════════════════════════    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  IDEA 1                                    Confidence: ████░ 85%│   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │                                                                  │   │
│  │  "5 AI tools that actually save me time (not just hype)"        │   │
│  │                                                                  │   │
│  │  Angle: Educational                                              │   │
│  │  Platforms: [X] [LinkedIn]                                       │   │
│  │  Format: Thread/Carousel                                         │   │
│  │                                                                  │   │
│  │  Key points:                                                     │   │
│  │  • Tool #1: Claude for ideation and writing                     │   │
│  │  • Tool #2: Notion AI for organization                          │   │
│  │  • Tool #3: Descript for audio/video                            │   │
│  │                                                                  │   │
│  │  Hook: "I've tested 50+ AI tools. Here are the 5 I actually..."│   │
│  │                                                                  │   │
│  │  Why this works: List content performs well, specific number    │   │
│  │  creates curiosity, "actually" implies authentic experience.    │   │
│  │                                                                  │   │
│  │  [✓ Approve]  [✗ Reject]  [✎ Edit]  [⊕ More Ideas]             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  IDEA 2                                    Confidence: ███░░ 72%│   │
│  │  ...                                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 11.2.3 Content Preview & Edit

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTENT PREVIEW                                [← Back] [Regenerate]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Platform: X (Twitter)                               Status: Draft     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  @yourhandle                                            │    │   │
│  │  │  ──────────────────────────────────────────────────     │    │   │
│  │  │                                                          │    │   │
│  │  │  I've tested 50+ AI tools this year.                    │    │   │
│  │  │                                                          │    │   │
│  │  │  Here are the 5 that actually save me time              │    │   │
│  │  │  (not just hype):                                        │    │   │
│  │  │                                                          │    │   │
│  │  │  🧵 Thread ↓                                             │    │   │
│  │  │                                                          │    │   │
│  │  │  ┌─────────────────────────────────────────────────┐    │    │   │
│  │  │  │  [Generated Image Preview]                       │    │    │   │
│  │  │  │                                                  │    │    │   │
│  │  │  │     "AI TOOLS THAT ACTUALLY WORK"               │    │    │   │
│  │  │  │                                                  │    │    │   │
│  │  │  └─────────────────────────────────────────────────┘    │    │   │
│  │  │                                                          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  Thread continues (5 parts)  [Expand All]                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────┐                            │
│  │  EDIT COPY                              │                            │
│  │  ────────────────────────────────────  │                            │
│  │  [Editable text area with copy]         │                            │
│  │                                         │                            │
│  │  Characters: 142/280                    │                            │
│  └────────────────────────────────────────┘                            │
│                                                                         │
│  IMAGE OPTIONS                                                          │
│  [🔄 Regenerate] [📤 Upload Custom] [✂️ Crop/Adjust]                    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  [✓ Approve & Schedule]  [Schedule: ▼ Optimal Time]            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Component Library

Use a modern component library for consistent UI:
- **Recommended:** shadcn/ui (Radix primitives + Tailwind)
- **Charts:** Recharts or Tremor
- **Rich Text:** Tiptap
- **Drag & Drop:** dnd-kit

---

## 12. Intelligence & Learning System

### 12.1 Learning Objectives

The system learns from user behavior to:

1. **Improve Idea Quality:** Generate ideas more likely to be approved
2. **Reduce Editing:** Generate copy closer to user's final edits
3. **Optimize Timing:** Suggest posting times based on engagement patterns
4. **Increase Confidence:** Eventually auto-approve high-confidence content

### 12.2 Feedback Signals

#### 12.2.1 Explicit Signals

| Signal | Weight | Capture Point |
|--------|--------|---------------|
| Idea Approval | High | Idea review screen |
| Idea Rejection | High | Idea review screen |
| Content Edit | Medium | Content preview/edit |
| Image Regeneration | Medium | Content preview |
| Scheduling Choice | Low | Scheduling modal |

#### 12.2.2 Implicit Signals (via Analytics)

| Signal | Weight | Capture Point |
|--------|--------|---------------|
| Engagement Rate | High | Post-publish analytics |
| Reach | Medium | Post-publish analytics |
| Click-through | High | Post-publish analytics |
| Follower Growth | Low | Periodic account analytics |

### 12.3 Confidence Scoring

```typescript
interface ConfidenceFactors {
  // Historical approval rate for similar ideas
  historicalApproval: number;  // 0-1

  // Brand voice alignment score
  brandAlignment: number;  // 0-1

  // Platform best practices compliance
  platformCompliance: number;  // 0-1

  // Predicted engagement based on similar past content
  predictedEngagement: number;  // 0-1

  // Time since similar content was posted
  contentFreshness: number;  // 0-1
}

function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    historicalApproval: 0.30,
    brandAlignment: 0.25,
    platformCompliance: 0.15,
    predictedEngagement: 0.20,
    contentFreshness: 0.10
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += factors[key as keyof ConfidenceFactors] * weight;
  }

  return Math.round(score * 100);
}
```

### 12.4 Auto-Approval System

**Criteria for Auto-Approval:**

1. Confidence score ≥ 90%
2. User has enabled auto-approval
3. Content type has been manually approved ≥ 20 times
4. No flagged compliance issues
5. Within daily auto-approval limit (configurable)

**Safeguards:**

- Auto-approved content enters 30-minute delay before posting
- User receives notification with one-tap override
- Weekly digest of auto-approved content
- Easy toggle to disable auto-approval

```typescript
interface AutoApprovalConfig {
  enabled: boolean;
  confidenceThreshold: number;  // 0-100, default 90
  requirePriorApprovals: number;  // default 20
  dailyLimit: number;  // max auto-approvals per day
  delayMinutes: number;  // delay before posting, default 30
  notifyOnApproval: boolean;  // default true
  platforms: Platform[];  // which platforms allow auto
  contentTypes: ContentType[];  // which types allow auto
}
```

### 12.5 Recommendation Engine

**What It Recommends:**

1. **Content Ideas:** Based on trending topics + brand voice
2. **Posting Times:** Based on historical engagement patterns
3. **Platform Selection:** Based on content type performance
4. **Content Mix:** Balance of educational, entertaining, promotional

---

## 13. Security & Privacy

### 13.1 Authentication & Authorization

**Authentication:**
- Supabase Auth with email/password
- Social login (Google, GitHub) for convenience
- MFA optional but recommended

**Authorization:**
- Row Level Security (RLS) on all tables
- Organization-based access control
- Role-based permissions (owner, admin, member)

### 13.2 Data Protection

**Encryption:**
- All data encrypted at rest (Supabase)
- All data encrypted in transit (TLS 1.3)
- Social account tokens encrypted with user-specific keys

**Data Minimization:**
- Only store necessary data
- Automatic deletion of raw audio after transcription (configurable)
- Analytics aggregation after 90 days

### 13.3 API Security

**Webhook Security:**
- Signed webhooks with HMAC-SHA256
- IP allowlisting for iOS shortcuts (optional)
- Rate limiting on all endpoints

**API Key Management:**
- Hashed storage (never store plaintext)
- Rotation support
- Scope limitations (read, write, admin)

### 13.4 Compliance Considerations

**Content:**
- No storage of regulated content (HIPAA, FERPA)
- User responsible for content compliance
- Automated checks for common issues

**Platform ToS:**
- Respect all platform API terms
- No automation that violates platform rules
- Clear disclosure of AI-generated content where required

---

## 14. Development Phases

### Phase 1: Foundation (MVP)

**Duration:** Core functionality

**Goals:**
- Basic input → ideas → content → publish workflow
- Single user, single brand
- Core integrations working

**Deliverables:**

| Feature | Priority | Details |
|---------|----------|---------|
| User Authentication | P0 | Supabase Auth, email/password |
| Dashboard UI | P0 | Basic layout, navigation |
| Text Input | P0 | Paste text, submit ideas |
| URL/Link Input | P0 | Auto-detect URLs, extract content |
| Document Upload | P1 | PDF/DOCX parsing and extraction |
| Idea Generation | P0 | Claude integration, 4 ideas per input |
| Idea Review UI | P0 | Approve/reject interface |
| Brand Voice Setup | P0 | Basic voice configuration |
| Content Generation | P0 | Platform-specific copy generation |
| Content Preview | P0 | Preview and edit interface |
| Late.dev Integration | P0 | OAuth, basic posting |
| X Publishing | P0 | Text posts with images |

**Technical Milestones:**
1. Project setup, CI/CD pipeline
2. Supabase schema and RLS policies
3. Authentication flow complete
4. Dashboard input interface (text, URL, document upload)
5. Input processing pipeline (URL extraction, document parsing)
6. Claude integration for ideation
7. Copy generation pipeline
8. Late.dev OAuth and posting
9. End-to-end workflow testing

### Phase 2: Visual Generation

**Goals:**
- Nano Banana Pro integration
- Full visual content support
- LinkedIn and Instagram publishing

**Deliverables:**

| Feature | Priority | Details |
|---------|----------|---------|
| Image Generation | P0 | Nano Banana Pro integration |
| Visual Brand Config | P0 | Color palette, style settings |
| Image Preview/Regen | P0 | View and regenerate images |
| Platform Crops | P1 | Auto-crop for different platforms |
| Instagram Publishing | P0 | Feed posts with images |
| LinkedIn Publishing | P0 | Posts with images |
| Carousel Support | P1 | Multi-image posts |
| Custom Image Upload | P1 | Upload own images |

### Phase 3: Publishing & Scheduling

**Goals:**
- Full scheduling functionality
- Calendar view
- Basic analytics

**Deliverables:**

| Feature | Priority | Details |
|---------|----------|---------|
| Scheduling UI | P0 | Date/time picker, optimal time |
| Content Calendar | P0 | Visual calendar of scheduled content |
| Queue Management | P1 | Reorder, reschedule queued content |
| Analytics Dashboard | P0 | Basic engagement metrics |
| Platform Analytics | P1 | Per-platform breakdowns |
| Content Performance | P1 | Individual post analytics |
| Thread Support | P1 | Twitter threads |

### Phase 4: Intelligence

**Goals:**
- Learning system operational
- Confidence scoring
- Auto-approval (optional)

**Deliverables:**

| Feature | Priority | Details |
|---------|----------|---------|
| Feedback Tracking | P0 | Log all user decisions |
| Analytics Integration | P0 | Pull engagement data |
| Confidence Scoring | P0 | Score ideas and content |
| Recommendation Engine | P1 | Suggest content ideas |
| Optimal Timing | P1 | AI-suggested posting times |
| Auto-Approval | P2 | Optional auto-approve high confidence |
| Performance Insights | P1 | What's working, what's not |

### Phase 5: Scale & Polish (Future)

**Goals:**
- Multi-brand support
- Team collaboration
- Advanced features

**Deliverables:**

| Feature | Priority | Details |
|---------|----------|---------|
| Multi-Brand | P1 | Multiple brands per account |
| Team Invites | P1 | Invite team members |
| Role Permissions | P1 | Owner, admin, member roles |
| Approval Workflows | P2 | Multi-step approval for teams |
| URL/Article Parsing | P1 | Extract content from URLs |
| Mobile PWA | P2 | Mobile-optimized experience |
| API Access | P2 | Public API for integrations |
| Video Support | P3 | Short-form video generation |

---

## 15. Success Metrics

### 15.1 Product Metrics

| Metric | Definition | Target (MVP) |
|--------|------------|--------------|
| Activation Rate | Users who complete first publish | > 60% |
| Ideas → Published | % of generated ideas that become posts | > 25% |
| Time to Publish | From input to published post | < 10 minutes |
| Edit Rate | % of generated content edited before publish | < 40% |
| DAU/MAU | Daily active / monthly active users | > 30% |

### 15.2 Engagement Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Posts per User per Week | Average published posts | > 7 |
| Ideas Reviewed per Session | Ideas approved/rejected per session | > 5 |
| Return Rate | Users returning within 7 days | > 70% |

### 15.3 Quality Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Idea Approval Rate | % of ideas approved | > 40% |
| First-Draft Accept | Content published without edits | > 60% |
| Image Regen Rate | % of images regenerated | < 30% |
| User Engagement Lift | Post-adoption engagement vs pre | > 20% |

### 15.4 Technical Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| API Latency (p95) | 95th percentile response time | < 2s |
| Publish Success Rate | Posts successfully published | > 99% |
| Transcription Accuracy | Word error rate | < 10% |
| Uptime | Service availability | > 99.5% |

---

## 16. Risks & Mitigations

### 16.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API rate limits | High | Medium | Implement queuing, caching, request batching |
| Image generation failures | Medium | Medium | Retry logic, fallback to stock images |
| Platform API changes | High | Medium | Abstract platform layer, monitor for changes |
| Transcription errors | Medium | Low | Allow manual correction, confidence thresholds |

### 16.2 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API cost overruns | High | Medium | Usage monitoring, cost alerts, rate limiting |
| Platform ToS violations | High | Low | Compliance checks, user education |
| Low-quality AI output | High | Medium | Human approval, continuous prompt improvement |
| User churn | High | Medium | Focus on time-saving, track satisfaction |

### 16.3 Security Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Token theft | Critical | Low | Encryption, secure storage, token rotation |
| Unauthorized posting | High | Low | Approval workflows, rate limits |
| Data breach | Critical | Low | RLS, encryption, security audits |

---

## 17. Future Considerations

### 17.1 Platform Expansion

- **TikTok:** Short video generation and posting
- **YouTube Shorts:** Repurpose content for YouTube
- **Threads:** Meta's Twitter alternative
- **Bluesky:** Decentralized social

### 17.2 Content Types

- **Video Generation:** AI-generated short videos
- **Podcast Clips:** Extract and format podcast highlights
- **Newsletter:** Repurpose social content for email
- **Blog Posts:** Expand ideas into long-form content

### 17.3 Advanced Features

- **A/B Testing:** Test content variations, measure performance
- **Competitor Analysis:** Monitor competitor content for inspiration
- **Trend Detection:** Identify trending topics for timely content
- **Collaboration:** Comments, suggestions, approval workflows
- **White-Label:** Agency version with client management

### 17.4 Additional Input Methods

- **Voice Notes:** iOS Shortcuts integration with webhook for voice capture
- **Mobile App:** Dedicated mobile app for on-the-go capture
- **API Webhooks:** Public API for third-party integrations
- **Browser Extension:** Capture content while browsing

### 17.5 Integrations

- **Notion:** Import ideas from Notion databases
- **Slack:** Notifications and quick approvals
- **Zapier/Make:** Connect to broader automation workflows
- **CRM:** Sync engagement data with customer records

---

## 18. Appendices

### 18.1 Glossary

| Term | Definition |
|------|------------|
| Input | Raw content captured by user via dashboard (text, link, document) |
| Idea | AI-generated content concept from an input |
| Content | Fully generated, platform-specific post ready for publishing |
| Brand | Configuration for voice, visuals, and connected accounts |
| Confidence Score | AI's assessment of how likely content is to be approved/perform |
| Late.dev | Third-party service for unified social media publishing |
| Nano Banana Pro | Google's Gemini 3 Pro Image generation model |

### 18.2 Claude Prompt Templates

#### Ideation System Prompt

```
You are a creative social media strategist helping generate content ideas.

BRAND CONTEXT:
{brand_voice_config}

INPUT TO TRANSFORM:
{parsed_input}

Generate {count} distinct content ideas. For each idea, provide:
1. A compelling concept (1-2 sentences)
2. The content angle (educational, entertaining, inspirational, promotional, conversational)
3. Recommended platforms
4. 3-5 key points to cover
5. A potential hook/opening line
6. Brief reasoning for why this will resonate

Focus on ideas that:
- Align with the brand voice
- Are platform-appropriate
- Have viral potential while staying authentic
- Can be created with text and static images

Respond in JSON format.
```

#### Copy Generation System Prompt

```
You are an expert social media copywriter.

BRAND VOICE:
{brand_voice_config}

PLATFORM: {platform}
PLATFORM SPECS:
- Character limit: {char_limit}
- Best practices: {platform_best_practices}

APPROVED IDEA:
{idea}

Generate platform-optimized copy that:
1. Captures attention in the first line
2. Delivers value throughout
3. Includes appropriate call-to-action
4. Uses hashtags strategically (platform-appropriate quantity)
5. Sounds like the brand, not like AI

Also suggest an image concept that would complement this post.

Respond in JSON format with: primary_copy, hashtags, cta, image_concept
```

### 18.3 Image Prompt Template

```
Create a {style} image for a {platform} social media post.

VISUAL BRAND:
- Primary color: {primary_color}
- Secondary color: {secondary_color}
- Style: {visual_style}
- Mood: {mood_keywords}

CONTENT CONTEXT:
{copy_summary}

IMAGE REQUIREMENTS:
- Dimensions: {dimensions}
- No text unless specifically requested
- Should feel {mood_keywords} and professional
- Avoid: {avoid_elements}

Create an eye-catching image that would make someone stop scrolling.
```

### 18.4 Reference Links

- [Claude API Documentation](https://docs.anthropic.com)
- [Gemini API - Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Late.dev API Documentation](https://docs.getlate.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | - | Initial PRD |
| 1.1 | January 2026 | - | Simplified inputs to dashboard-only (text, URL, document upload). Voice/webhook inputs moved to Future Considerations. |

---

*This PRD is a living document and will be updated as the product evolves.*
