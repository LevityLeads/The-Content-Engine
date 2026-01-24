# Competitor/Niche Analyzer Research

> **Status**: Parked for future consideration
> **Date**: January 2026
> **Author**: Claude (Researcher role)

## Executive Summary

Building a data-driven competitor analyzer that scrapes social accounts, analyzes what's working, identifies gaps, and feeds insights into content ideation is **highly feasible**. The approach involves:

1. **Data Collection Layer** - Scraping APIs for competitor posts + engagement
2. **Analysis Layer** - AI (Claude) for text/strategy + Vision AI for visuals
3. **Intelligence Layer** - Pattern detection, gap analysis, trending signals
4. **Integration Layer** - Feed insights into existing ideation pipeline

---

## The Problem This Solves

| Current State | Desired State |
|---------------|---------------|
| Ideation is based only on user's own inputs | Ideation informed by competitor success patterns |
| No visibility into niche/competitor content | Deep analysis of what's working in the space |
| Guessing what hooks/formats work | Data-backed recommendations based on engagement |
| Manual competitive research | Automated, continuous intelligence gathering |

### What "Data-Based" Means

- **Engagement metrics**: Likes, comments, shares, saves, views
- **Performance ratios**: Engagement rate (engagement/followers)
- **Content patterns**: Hook styles, formats, topics, posting times
- **Visual patterns**: Colors, typography, image styles, carousel structures
- **Gap analysis**: What competitors DON'T cover that audiences want

---

## Data Collection Options

### Option A: Scraping APIs (Recommended for MVP)

**Best for**: Direct competitor monitoring, post-level data, visual scraping

| Provider | Platforms | Cost | Reliability | Notes |
|----------|-----------|------|-------------|-------|
| [Apify](https://apify.com/store/categories/social-media-scrapers) | IG, TW, LI, TikTok | $0.20-2.70/1K posts | High | Pre-built actors, pay-per-result |
| [ScrapeCreators](https://scrapecreators.com/) | IG, TikTok, YT | Variable | High | Real-time, good docs |
| [RapidAPI Instagram](https://rapidapi.com/mediacrawlers-mediacrawlers-default/api/instagram-api-fast-reliable-data-scraper) | Instagram | $0.50/1K posts | High | Many options available |

**What you can scrape**:
- Post content (caption, hashtags)
- Engagement metrics (likes, comments, shares, saves)
- Media URLs (images, videos)
- Posting timestamps
- Comment content (for sentiment analysis)

### Option B: User-Permissioned APIs

**Best for**: If users connect their own accounts or competitor accounts they manage

| Provider | What It Does | Cost |
|----------|--------------|------|
| [Phyllo](https://www.getphyllo.com/) | Unified API for creator data across 20+ platforms | Enterprise pricing |
| [Socialinsider](https://www.socialinsider.io/social-media-api) | Social analytics API | $99+/month |

### Option C: Enterprise Social Listening (For Scale)

| Provider | Strengths | Cost |
|----------|-----------|------|
| [Brandwatch](https://www.brandwatch.com/) | 100M+ sources, AI insights, sentiment | $$$$ (Enterprise) |
| [Sprout Social](https://sproutsocial.com/) | Competitor benchmarking, listening add-on | $299+/month |
| [Brand24](https://brand24.com/) | Affordable monitoring, sentiment | $79+/month |
| [Meltwater](https://www.meltwater.com/) | Global coverage, PR + social | $$$$ (Enterprise) |

### Recommended Approach: Hybrid

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA COLLECTION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Apify/ScrapeCreators    →  Direct competitor posts         │
│  (scraping APIs)             + engagement + images           │
│                                                             │
│  Late.dev Analytics      →  Your own post performance       │
│  (already integrated)        for benchmarking               │
│                                                             │
│  Optional: Brand24       →  Broader niche monitoring        │
│  (social listening)          + sentiment + trends            │
└─────────────────────────────────────────────────────────────┘
```

---

## Legal Considerations

### What's Legal

Based on the hiQ Labs v. LinkedIn ruling (2022):

✅ **Generally OK**:
- Scraping publicly available posts
- Analyzing public engagement metrics
- Extracting publicly visible images
- Monitoring public profiles

⚠️ **Gray Area**:
- Scraping at high volume/frequency
- LinkedIn (strictest anti-scraping)
- Storing personal data without purpose

❌ **Not OK**:
- Scraping private/gated content
- Violating rate limits to damage service
- Storing data that violates GDPR/CCPA

### Risk Mitigation

1. **Use established APIs** (Apify, RapidAPI) - they handle compliance
2. **Only scrape public posts** - no private accounts
3. **Respect rate limits** - don't hammer platforms
4. **Clear data retention policy** - delete raw data after analysis
5. **User consent** - users add competitor handles explicitly

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPETITOR ANALYZER SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────────────┐    ┌───────────────────┐   │
│  │   INPUT     │    │   DATA COLLECTION   │    │   RAW STORAGE     │   │
│  │             │    │                     │    │                   │   │
│  │ Competitor  │───▶│  Apify Instagram    │───▶│  competitor_posts │   │
│  │ Handles     │    │  Apify Twitter      │    │  table            │   │
│  │ @user1      │    │  Apify LinkedIn     │    │  - handle         │   │
│  │ @user2      │    │                     │    │  - content        │   │
│  │ @user3      │    │  Scheduled: Daily   │    │  - engagement     │   │
│  └─────────────┘    └─────────────────────┘    │  - media_urls     │   │
│                                                 │  - posted_at      │   │
│                                                 └───────────────────┘   │
│                                                          │              │
│                                                          ▼              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      ANALYSIS LAYER                              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │   │
│  │  │  TEXT ANALYSIS   │  │  VISUAL ANALYSIS │  │  ENGAGEMENT   │  │   │
│  │  │  (Claude Opus)   │  │  (Gemini Vision) │  │  ANALYSIS     │  │   │
│  │  │                  │  │                  │  │               │  │   │
│  │  │  • Hook patterns │  │  • Color palette │  │  • Eng. rate  │  │   │
│  │  │  • Topic themes  │  │  • Typography    │  │  • Save ratio │  │   │
│  │  │  • Tone/voice    │  │  • Layout style  │  │  • Comment    │  │   │
│  │  │  • CTA patterns  │  │  • Image type    │  │    sentiment  │  │   │
│  │  │  • Format type   │  │  • Carousel flow │  │  • Virality   │  │   │
│  │  │  • Hashtag use   │  │  • Brand consis. │  │    velocity   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └───────────────┘  │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    INTELLIGENCE LAYER                            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │                 PATTERN DETECTION                        │    │   │
│  │  │                                                          │    │   │
│  │  │  "Posts with curiosity hooks get 3.2x more engagement"  │    │   │
│  │  │  "Carousel posts outperform single images by 2.1x"      │    │   │
│  │  │  "Morning posts (8-10am) get 45% higher reach"          │    │   │
│  │  │  "Bold typography posts save 2x more than photo posts"  │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │                    GAP ANALYSIS                          │    │   │
│  │  │                                                          │    │   │
│  │  │  "Competitors never cover [topic X] - opportunity"      │    │   │
│  │  │  "No one uses video tutorials - untapped format"        │    │   │
│  │  │  "Audience asks about [Y] in comments - unaddressed"    │    │   │
│  │  │  "Platform Z underutilized by competitors"              │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │                 TOP PERFORMERS                           │    │   │
│  │  │                                                          │    │   │
│  │  │  Top 10 posts by engagement rate (with breakdowns)      │    │   │
│  │  │  Top hooks that drove engagement                        │    │   │
│  │  │  Most-saved content patterns                            │    │   │
│  │  │  Viral velocity outliers                                │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  IDEATION INTEGRATION                            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  Inject into existing ideation-prompt.ts:                       │   │
│  │                                                                  │   │
│  │  "Based on competitor analysis of your niche:                   │   │
│  │   - Top performing hook styles: [X, Y, Z]                       │   │
│  │   - Underexplored topics (gaps): [A, B, C]                      │   │
│  │   - Best posting formats: [carousel > single > video]          │   │
│  │   - Winning visual styles: [bold typography, minimal]          │   │
│  │                                                                  │   │
│  │   Generate ideas that leverage these patterns while             │   │
│  │   filling the identified content gaps."                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Per-Competitor Report

```typescript
interface CompetitorAnalysis {
  handle: string;
  platform: 'instagram' | 'twitter' | 'linkedin';

  // Quantitative Metrics
  metrics: {
    follower_count: number;
    avg_engagement_rate: number;  // (likes+comments+saves)/followers
    posting_frequency: string;     // "2.3 posts/day"
    best_posting_times: string[];  // ["Tuesday 9am", "Thursday 6pm"]
  };

  // Content Patterns
  content_patterns: {
    top_performing_formats: Array<{
      format: 'carousel' | 'single_image' | 'video' | 'text_only';
      avg_engagement_rate: number;
      sample_count: number;
    }>;

    hook_patterns: Array<{
      pattern: string;  // "question", "contrarian", "number-driven"
      frequency: number;
      avg_performance: number;
    }>;

    topic_themes: Array<{
      theme: string;
      post_count: number;
      avg_engagement: number;
    }>;

    hashtag_strategy: {
      avg_hashtags_per_post: number;
      top_performing_hashtags: string[];
      hashtag_engagement_correlation: number;
    };
  };

  // Visual Patterns
  visual_patterns: {
    dominant_colors: string[];
    typography_style: 'bold' | 'minimal' | 'editorial' | 'playful';
    image_types: Array<{
      type: 'photography' | 'illustration' | 'typography' | '3d' | 'screenshot';
      frequency: number;
      performance: number;
    }>;
    carousel_patterns: {
      avg_slides: number;
      common_structures: string[];  // ["hook-content-cta", "listicle", "story"]
    };
  };

  // Top Content
  top_posts: Array<{
    url: string;
    content: string;
    engagement: { likes: number; comments: number; saves: number };
    engagement_rate: number;
    why_it_worked: string;  // AI-generated explanation
  }>;
}
```

### Niche-Wide Intelligence

```typescript
interface NicheIntelligence {
  competitors_analyzed: string[];
  analysis_period: { start: Date; end: Date };
  total_posts_analyzed: number;

  // What's Working
  winning_patterns: {
    top_hook_styles: Array<{
      style: string;
      description: string;
      avg_engagement_lift: string;  // "+45% vs average"
      examples: string[];
    }>;

    top_formats: Array<{
      format: string;
      performance_vs_avg: number;
      best_use_cases: string[];
    }>;

    optimal_posting: {
      best_days: string[];
      best_times: string[];
      frequency_sweet_spot: string;
    };

    visual_trends: {
      rising_styles: string[];
      declining_styles: string[];
      color_trends: string[];
    };
  };

  // Content Gaps (THE GOLD)
  content_gaps: Array<{
    gap: string;
    evidence: string;  // "Only 2% of competitor posts cover this"
    audience_demand: string;  // "High comment volume asking about this"
    opportunity_score: number;  // 0-100
    suggested_angles: string[];
  }>;

  // Audience Insights
  audience_signals: {
    top_comment_themes: string[];
    frequently_asked_questions: string[];
    sentiment_patterns: {
      positive_triggers: string[];
      negative_triggers: string[];
    };
    engagement_triggers: string[];  // What makes people engage
  };

  // Benchmarks
  benchmarks: {
    avg_engagement_rate: number;
    top_10_percent_threshold: number;
    posting_frequency_norm: string;
  };
}
```

---

## Database Schema

```sql
-- Competitor tracking
CREATE TABLE competitor_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'twitter', 'linkedin'
  handle TEXT NOT NULL,
  profile_data JSONB, -- follower count, bio, etc.
  last_scraped_at TIMESTAMPTZ,
  scrape_frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, handle)
);

-- Raw scraped posts
CREATE TABLE competitor_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_account_id UUID REFERENCES competitor_accounts(id) ON DELETE CASCADE,
  platform_post_id TEXT NOT NULL, -- native ID from platform
  content TEXT,
  media_urls TEXT[], -- array of image/video URLs
  media_types TEXT[], -- 'image', 'video', 'carousel'
  posted_at TIMESTAMPTZ,
  engagement JSONB, -- { likes, comments, shares, saves, views }
  hashtags TEXT[],
  is_carousel BOOLEAN DEFAULT false,
  carousel_count INTEGER,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_account_id, platform_post_id)
);

-- AI-generated analysis per post
CREATE TABLE competitor_post_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_post_id UUID REFERENCES competitor_posts(id) ON DELETE CASCADE,

  -- Text analysis (Claude)
  hook_type TEXT, -- 'curiosity', 'contrarian', 'question', etc.
  topic_themes TEXT[],
  tone_keywords TEXT[],
  cta_pattern TEXT,
  content_pillar TEXT, -- 'educate', 'entertain', 'engage', 'establish'

  -- Visual analysis (Gemini)
  visual_style TEXT,
  dominant_colors TEXT[],
  typography_style TEXT,
  image_type TEXT, -- 'photography', 'illustration', 'typography', etc.

  -- Performance scoring
  engagement_rate DECIMAL,
  performance_tier TEXT, -- 'top_10%', 'above_avg', 'average', 'below_avg'
  why_it_worked TEXT, -- AI explanation

  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated niche intelligence (computed periodically)
CREATE TABLE niche_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,

  analysis_period_start TIMESTAMPTZ,
  analysis_period_end TIMESTAMPTZ,
  posts_analyzed INTEGER,
  competitors_analyzed TEXT[],

  -- Computed insights (JSONB for flexibility)
  winning_patterns JSONB,
  content_gaps JSONB,
  audience_signals JSONB,
  benchmarks JSONB,

  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_competitor_posts_account ON competitor_posts(competitor_account_id);
CREATE INDEX idx_competitor_posts_posted_at ON competitor_posts(posted_at);
CREATE INDEX idx_competitor_post_analysis_engagement ON competitor_post_analysis(engagement_rate DESC);
CREATE INDEX idx_niche_intelligence_brand ON niche_intelligence(brand_id);
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/competitors` | GET/POST | List/add competitor accounts |
| `/api/competitors/[id]` | DELETE | Remove competitor |
| `/api/competitors/scrape` | POST | Trigger manual scrape |
| `/api/competitors/analyze` | POST | Run analysis on scraped data |
| `/api/intelligence/[brandId]` | GET | Get niche intelligence for brand |
| `/api/intelligence/gaps` | GET | Get content gaps specifically |
| `/api/intelligence/top-posts` | GET | Get top performing competitor posts |

---

## Cost Analysis

### Per-Brand Monthly Costs (Estimated)

| Component | Volume | Cost |
|-----------|--------|------|
| **Apify scraping** | 5 competitors × 30 posts × 30 days = 4,500 posts | ~$5-10/month |
| **Claude analysis** | 4,500 posts × ~500 tokens = 2.25M tokens | ~$30/month (Opus) |
| **Gemini vision** | 4,500 images analyzed | ~$5/month |
| **Storage** | Supabase (existing) | Included |
| **Total per brand** | | **~$40-50/month** |

### At Scale

| Brands | Monthly Cost |
|--------|--------------|
| 10 brands | ~$400-500 |
| 50 brands | ~$2,000-2,500 |
| 100 brands | ~$4,000-5,000 |

**Note**: Can reduce costs significantly by using Claude Sonnet ($3/MTok vs $15/MTok for Opus) for routine analysis.

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add competitor_accounts table
- [ ] Build competitor management UI (add/remove competitors)
- [ ] Integrate Apify for Instagram scraping
- [ ] Store raw posts in database
- [ ] Basic engagement metrics display

**Deliverable**: Users can add competitors and see their recent posts

### Phase 2: AI Analysis
- [ ] Claude analysis of post content (hooks, topics, tone)
- [ ] Gemini analysis of post visuals
- [ ] Performance scoring and tiering
- [ ] "Why it worked" explanations

**Deliverable**: Each competitor post has AI-generated insights

### Phase 3: Intelligence Layer
- [ ] Aggregate patterns across competitors
- [ ] Content gap detection algorithm
- [ ] Audience signal extraction (from comments)
- [ ] Niche intelligence dashboard

**Deliverable**: Users see actionable intelligence about their niche

### Phase 4: Ideation Integration
- [ ] Inject intelligence into ideation prompts
- [ ] "Inspired by" competitor content suggestions
- [ ] Gap-filling idea generation
- [ ] A/B comparison against competitor patterns

**Deliverable**: Ideation becomes data-informed by competitor success

### Phase 5: Advanced Features
- [ ] Twitter/LinkedIn scraping
- [ ] Real-time trending detection
- [ ] Competitor alert notifications
- [ ] Historical trend analysis

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Platform blocks scraping | Medium | High | Use established APIs (Apify), rotate IPs, respect limits |
| Legal challenges | Low | High | Only public data, clear ToS, data retention policy |
| Analysis quality varies | Medium | Medium | Human review, confidence scores, continuous improvement |
| Cost scaling issues | Medium | Medium | Batch processing, caching, Sonnet for routine analysis |
| Stale data | Low | Medium | Automated daily scrapes, freshness indicators |

---

## Recommendation

**Start with Phase 1-2 on Instagram only**:

1. Use Apify Instagram Scraper ($0.50-2.70/1K posts)
2. Store posts + engagement in Supabase
3. Analyze with Claude Sonnet (cost-effective) for text patterns
4. Analyze with Gemini 2.0 Flash for visual patterns
5. Build simple dashboard showing competitor posts ranked by performance
6. Add "Top Hooks" and "Content Gaps" cards

This gets 80% of the value at 20% of the complexity. Expand to full intelligence layer once validated.

---

## Sources

- [Apify Social Media Scrapers](https://apify.com/store/categories/social-media-scrapers)
- [Sprout Social: Competitor Analysis](https://sproutsocial.com/insights/social-media-competitive-analysis/)
- [Phyllo API](https://www.getphyllo.com/)
- [Brandwatch](https://www.brandwatch.com/)
- [SocialInsider: AI in Social Media Analysis](https://www.socialinsider.io/blog/how-to-use-ai-in-social-media-analysis/)
- [RapidAPI Instagram APIs](https://rapidapi.com/mediacrawlers-mediacrawlers-default/api/instagram-api-fast-reliable-data-scraper)
