/**
 * Visual Style System for Carousel Image Generation
 *
 * This module defines the visual styles available for carousel slides
 * and provides AI guidance for intelligent style selection based on content.
 */

export type VisualStyle =
  | 'typography'
  | 'photorealistic'
  | 'illustration'
  | '3d-render'
  | 'abstract-art'
  | 'collage'
  | 'experimental';

export interface StyleDefinition {
  id: VisualStyle;
  name: string;
  description: string;
  bestFor: string[];
  avoidFor: string[];
  promptGuidance: string;
  examplePrompt: string;
  textOverlayRules: string;
}

export const VISUAL_STYLES: Record<VisualStyle, StyleDefinition> = {
  'typography': {
    id: 'typography',
    name: 'Bold Typography',
    description: 'Clean, text-focused designs with strong typographic hierarchy. No background imagery.',
    bestFor: [
      'Statistics and data points',
      'Quotes and statements',
      'Step-by-step instructions',
      'Lists and frameworks',
      'Controversial takes',
      'Direct advice'
    ],
    avoidFor: [
      'Travel and lifestyle content',
      'Food and recipes',
      'Nature and environment topics',
      'Product showcases'
    ],
    promptGuidance: `
      - Use solid color or subtle gradient backgrounds
      - Focus on typography hierarchy: large headlines, supporting text
      - Can include simple geometric shapes or accent lines
      - NO photographs, illustrations, or complex imagery
      - Colors should be bold and high contrast
    `,
    examplePrompt: `Bold modern graphic with charcoal black background (#1a1a1a). Large bold white text (#ffffff) in Inter Bold font reading "5:1" centered. Below in coral (#ff6b6b) Inter Regular: "positive interactions needed to offset ONE negative." Subtle coral accent line between numbers and text. Clean minimalist layout with 15% margins. Overall aesthetic: bold, editorial, premium.`,
    textOverlayRules: 'Text IS the design. No overlays needed - typography is the hero element.'
  },

  'photorealistic': {
    id: 'photorealistic',
    name: 'Photorealistic with Text Overlay',
    description: 'Stunning photo-quality backgrounds that look like real photographs, with text overlaid. Extremely scroll-stopping.',
    bestFor: [
      'Travel and adventure content',
      'Lifestyle and wellness',
      'Food and cooking',
      'Nature and environment',
      'Emotional storytelling',
      'Aspirational content',
      'Before/after transformations',
      'Real-world examples'
    ],
    avoidFor: [
      'Abstract concepts without visual metaphor',
      'Pure data/statistics',
      'Step-by-step technical instructions',
      'Legal or compliance content'
    ],
    promptGuidance: `
      - Create photorealistic scenes that look like professional photography
      - Use dramatic lighting, depth of field, and cinematic composition
      - Include atmospheric elements: fog, golden hour light, reflections
      - Text should have semi-transparent background box OR be placed on naturally dark/light areas
      - Ensure text remains readable against the photo background
      - NO obvious AI artifacts - aim for stock photo quality
      - Subjects can include: landscapes, cityscapes, people (from behind/silhouette), objects, food, interiors
    `,
    examplePrompt: `Photorealistic image of a person standing at the edge of a cliff overlooking a vast mountain range at golden hour. Dramatic warm lighting with sun rays breaking through clouds. Person shown from behind as silhouette. In the lower third, semi-transparent dark overlay (#000000 at 60% opacity) with white text (#ffffff) in Inter Bold reading "Your comfort zone is a beautiful prison." Cinematic composition, professional photography quality, 85mm lens depth of field effect.`,
    textOverlayRules: 'Text must have contrast backing: semi-transparent box, shadow, or placed on naturally dark/light areas of the image. Never place white text on bright areas without backing.'
  },

  'illustration': {
    id: 'illustration',
    name: 'Custom Illustration',
    description: 'Hand-drawn or digitally illustrated scenes with a warm, approachable feel. Great for storytelling.',
    bestFor: [
      'Personal stories and anecdotes',
      'Explainer content',
      'Children/family topics',
      'Creative and artistic content',
      'Brand storytelling',
      'Metaphorical concepts',
      'How-to guides'
    ],
    avoidFor: [
      'Serious business/finance topics',
      'News and current events',
      'Scientific data',
      'Luxury/premium positioning'
    ],
    promptGuidance: `
      - Use consistent illustration style throughout carousel (flat, line art, watercolor, etc.)
      - Characters should be simple and relatable
      - Color palette should be cohesive and limited (4-6 colors)
      - Illustrations should support the text, not overwhelm it
      - Can be whimsical, serious, or anywhere in between based on content
      - Text should be integrated into the illustration composition
      - Style options: flat vector, hand-drawn sketch, watercolor, isometric, editorial illustration
    `,
    examplePrompt: `Flat vector illustration style. Scene showing a person sitting at a desk with multiple browser tabs floating above their head, looking overwhelmed. Soft muted color palette: dusty blue background (#8BA4B4), cream desk (#F5E6D3), coral accent elements (#E07A5F). Character has simple features, no detailed face. Text in the upper portion in dark navy (#1D3557) Inter Bold: "Tab bankruptcy is real." Clean, editorial illustration aesthetic with plenty of white space.`,
    textOverlayRules: 'Text should be part of the illustration composition. Use colors from the illustration palette. Can be placed in dedicated text areas or integrated with illustrated elements.'
  },

  '3d-render': {
    id: '3d-render',
    name: '3D Rendered',
    description: 'Modern 3D rendered scenes with depth and dimension. Perfect for tech and futuristic content.',
    bestFor: [
      'Technology and software',
      'Futuristic concepts',
      'Product visualization',
      'Abstract business concepts',
      'Innovation and disruption topics',
      'Gaming and entertainment',
      'Architecture and design'
    ],
    avoidFor: [
      'Traditional/heritage topics',
      'Organic/natural content',
      'Budget-conscious messaging',
      'Rustic or vintage aesthetics'
    ],
    promptGuidance: `
      - Use modern 3D rendering style with soft lighting and subtle shadows
      - Can include geometric shapes, abstract forms, floating objects
      - Gradient backgrounds work well (subtle, not harsh)
      - Metallic, glass, and matte materials add visual interest
      - Isometric views are popular and effective
      - Text should feel integrated, possibly with 3D effect or sitting on 3D elements
      - Avoid overly complex scenes - keep focus on the message
    `,
    examplePrompt: `Modern 3D rendered scene with soft gradient background transitioning from deep purple (#2D1B4E) to dark blue (#1A1A3E). Floating geometric shapes: a chrome sphere, translucent glass cube, and matte coral cylinder (#FF6B6B) arranged in balanced composition. Soft studio lighting with subtle reflections. In the center, bold white 3D text (#ffffff) reading "Systems > Goals" with subtle shadow. Clean, premium tech aesthetic with depth of field blur on background elements.`,
    textOverlayRules: 'Text can be rendered as 3D objects or overlaid flat. Use high contrast colors. Consider subtle 3D effects on text (extrusion, shadows) to match the scene.'
  },

  'abstract-art': {
    id: 'abstract-art',
    name: 'Abstract Art',
    description: 'Bold abstract compositions with shapes, gradients, and artistic elements. Great for conceptual content.',
    bestFor: [
      'Philosophical or conceptual topics',
      'Creativity and innovation',
      'Emotional content',
      'Music and art related topics',
      'Brand differentiation',
      'Opinion pieces',
      'Mindset content'
    ],
    avoidFor: [
      'How-to tutorials',
      'Specific product features',
      'Data-heavy content',
      'Literal/concrete topics'
    ],
    promptGuidance: `
      - Use bold, expressive shapes and color combinations
      - Can include paint splashes, brush strokes, geometric patterns
      - Gradients and color transitions create depth
      - Asymmetric compositions feel more dynamic
      - Text should stand out against the abstract background
      - Can be inspired by art movements: Memphis, Bauhaus, Contemporary
      - Balance chaos with readability - text areas should be clear
    `,
    examplePrompt: `Abstract art composition with bold organic shapes. Deep navy background (#1a1a2e) with large flowing coral shape (#FF6B6B) in upper right and smaller teal accent (#20B2AA) in lower left. Subtle texture overlay for depth. Dynamic asymmetric composition. White text (#ffffff) in Inter Bold positioned in the clear space: "Creativity is intelligence having fun." Paint-splash accent near text in coral. Contemporary art aesthetic, bold and expressive.`,
    textOverlayRules: 'Ensure text placement in clear areas of the composition. Abstract elements should frame or complement the text, not compete with it. High contrast is essential.'
  },

  'collage': {
    id: 'collage',
    name: 'Mixed Media Collage',
    description: 'Layered compositions mixing photos, textures, shapes, and text. Edgy and attention-grabbing.',
    bestFor: [
      'Pop culture content',
      'Fashion and style',
      'Music and entertainment',
      'Youth-focused content',
      'Retrospectives and throwbacks',
      'Multi-faceted topics',
      'Creative/artistic brands'
    ],
    avoidFor: [
      'Minimalist brands',
      'Corporate/formal content',
      'Clean/simple messaging',
      'Technical documentation'
    ],
    promptGuidance: `
      - Layer multiple visual elements: photo cutouts, paper textures, shapes
      - Use contrast in scale - mix large and small elements
      - Can include: torn paper effects, stamps, stickers, scribbles
      - Retro/vintage photos mixed with modern elements work well
      - Text can be handwritten style, typewriter, or bold modern
      - Organized chaos - busy but intentional
      - Consider adding subtle grain or texture overlay
    `,
    examplePrompt: `Mixed media collage style on off-white textured paper background (#F5F5F0). Central cutout image of vintage camera (desaturated photo). Surrounding elements: torn coral paper shape (#FF6B6B), black ink scribble, small star stickers in gold. Text in bold black (#1a1a1a) typewriter font reading "Document everything." Additional handwritten annotation "yes, even the failures" in smaller script below. Subtle paper grain texture. 90s zine aesthetic with modern sensibility.`,
    textOverlayRules: 'Text should feel like part of the collage - can be layered, rotated slightly, or have cut-out effects. Mix font styles for visual interest. Ensure primary message remains readable.'
  },

  'experimental': {
    id: 'experimental',
    name: 'Experimental / Wild',
    description: 'Boundary-pushing, avant-garde visuals that break conventions. Go wild, be unexpected, create something never seen before.',
    bestFor: [
      'Creative brands wanting to stand out',
      'Disruptive messaging',
      'Art and design content',
      'Innovation announcements',
      'Thought leadership wanting differentiation',
      'Gen-Z audiences',
      'Brand moments that need virality',
      'Content that should feel "different"'
    ],
    avoidFor: [
      'Conservative brands',
      'Financial/legal content',
      'Healthcare/safety messaging',
      'Traditional audiences',
      'Content requiring clarity over creativity'
    ],
    promptGuidance: `
      - BREAK ALL RULES - this is about creating something unprecedented
      - Mix unexpected elements: surrealism meets tech, nature meets neon, organic meets digital
      - Use unusual compositions: extreme angles, impossible perspectives, dream logic
      - Combine styles that shouldn't work together but somehow do
      - Experiment with: glitch art, vaporwave, brutalist design, maximalism, acid graphics
      - Push color boundaries: neon + pastels, unexpected combinations
      - Include unexpected textures: chrome, liquid metal, organic materials, digital noise
      - Create visual tension and intrigue
      - Make people stop and say "wait, what is this?"
      - Text can be distorted, fragmented, or integrated in surprising ways
      - The goal is MEMORABILITY over conventionality
    `,
    examplePrompt: `Surreal experimental composition: a giant chrome hand emerging from a pool of liquid gold, holding a small planet Earth. Background is a gradient from hot pink (#FF1493) to electric blue (#00FFFF) with floating geometric shapes and glitch effects. Stars and digital noise particles scattered throughout. Text "THE FUTURE IS WEIRD" written in distorted, melting 3D letters that appear to be dripping chrome. Multiple light sources creating impossible shadows. Overall aesthetic: fever dream meets tech utopia. Extremely high detail, maximum visual impact.`,
    textOverlayRules: 'Text can be anything: distorted, fragmented, 3D, melting, glitching, integrated into surreal elements. Readability is secondary to impact - but ensure the core message is still decipherable. Make it memorable.'
  }
};

/**
 * AI Guidance for Style Selection
 *
 * This prompt section helps Claude choose the optimal style based on content.
 */
export const STYLE_SELECTION_GUIDANCE = `
## Visual Style Selection

You must select the optimal visual style for this carousel based on the content topic, emotional tone, and target audience. Choose from:

### Available Styles:

1. **typography** - Bold text-focused designs
   BEST FOR: Statistics, quotes, frameworks, lists, direct advice, controversial takes
   AVOID FOR: Travel, food, nature, lifestyle content

2. **photorealistic** - Photo-quality backgrounds with text overlay
   BEST FOR: Travel, lifestyle, food, nature, emotional stories, aspirational content, transformations
   AVOID FOR: Abstract concepts, pure data, technical instructions

3. **illustration** - Hand-drawn or digitally illustrated scenes
   BEST FOR: Personal stories, explainers, metaphors, how-to guides, friendly brands
   AVOID FOR: Serious finance, news, scientific data, luxury positioning

4. **3d-render** - Modern 3D rendered scenes
   BEST FOR: Technology, futuristic concepts, innovation, gaming, software, abstract business
   AVOID FOR: Traditional topics, natural/organic content, vintage aesthetics

5. **abstract-art** - Bold shapes, gradients, artistic compositions
   BEST FOR: Philosophy, creativity, emotions, mindset, opinion pieces, art topics
   AVOID FOR: How-to tutorials, specific features, data-heavy content

6. **collage** - Mixed media with layered elements
   BEST FOR: Pop culture, fashion, music, youth content, retrospectives, creative brands
   AVOID FOR: Minimalist brands, corporate content, clean/simple messaging

7. **experimental** - Boundary-pushing, avant-garde visuals (USE SPARINGLY)
   BEST FOR: Creative brands, disruptive messaging, virality-seeking content, Gen-Z, thought leadership
   AVOID FOR: Conservative brands, healthcare/legal, traditional audiences
   NOTE: This style breaks all rules - use when you want something truly unexpected and memorable

### Selection Process:

1. Analyze the TOPIC - what is the content about?
2. Consider the EMOTION - what should viewers feel?
3. Match to AUDIENCE - who is this for?
4. Check BRAND ALIGNMENT - does this fit the brand's personality?

### Your Output:

In the carouselStyle object, include:
- \`visualStyle\`: The chosen style ID (typography, photorealistic, illustration, 3d-render, abstract-art, collage)
- \`styleRationale\`: 1-2 sentences explaining why this style fits the content

Then generate image prompts that follow the chosen style's guidelines.
`;

/**
 * Get style-specific prompt template
 */
export function getStylePromptTemplate(style: VisualStyle): string {
  const styleInfo = VISUAL_STYLES[style];
  return `
STYLE: ${styleInfo.name}
${styleInfo.promptGuidance}

TEXT OVERLAY RULES:
${styleInfo.textOverlayRules}

EXAMPLE PROMPT:
${styleInfo.examplePrompt}
`;
}

/**
 * Get all styles as a reference string for prompts
 */
export function getStylesReference(): string {
  return Object.values(VISUAL_STYLES)
    .map(style => `- ${style.id}: ${style.description}`)
    .join('\n');
}

export default VISUAL_STYLES;
