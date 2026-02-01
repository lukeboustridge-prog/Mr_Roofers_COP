# Phase 8: Visual Authority System - Research

**Researched:** 2026-02-01
**Domain:** React component visual hierarchy, Tailwind CSS styling patterns, content attribution UX
**Confidence:** HIGH

## Summary

This phase implements visual differentiation between MRM COP (authoritative) and RANZ Guide (supplementary) content sources. The existing codebase already has strong foundations: a `SourceBadge` component exists, `contentSources` table tracks source attribution, and the data model from Phase 7 provides `sourceId` on all details.

The research confirms that the standard approach uses wrapper components with Tailwind CSS utility classes to create visual distinction through color (primary blue vs muted grey), subtle borders, and consistent iconography. The existing shadcn/ui component library and Lucide icons provide all necessary primitives. No new dependencies are required.

**Primary recommendation:** Extend the existing `SourceBadge` component to support authoritative vs supplementary variants, create thin wrapper components (`AuthoritativeContent`, `SupplementaryContent`) that apply consistent styling, and add a `ContentCapabilityBadges` component using existing Lucide icons for 3D model, steps, warnings, and case law indicators.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | existing | Visual styling | Already in project, utility-first for visual hierarchy |
| shadcn/ui | existing | Base components | Badge, Card already used throughout |
| lucide-react | existing | Icons | Already used, has all needed icons |
| class-variance-authority | existing | Variant styling | Already used by shadcn Badge component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tooltip | existing | Hover context | Already used for badge tooltips |
| cn() utility | existing | Class merging | Already in lib/utils.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wrapper components | CSS-only selectors | Wrapper components are more explicit and type-safe |
| Tailwind classes | CSS modules | Tailwind already standard in project, modules add complexity |
| lucide-react icons | Custom SVGs | Lucide already has all needed icons, consistency matters |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Component Structure
```
components/
  authority/
    AuthoritativeContent.tsx       # Blue-styled wrapper for MRM COP content
    SupplementaryContent.tsx       # Grey-styled wrapper for RANZ content
    ContentCapabilityBadges.tsx    # Icon badges for 3D/steps/warnings/caselaw
    VersionWatermark.tsx           # "MRM COP v25.12" watermark display
    index.ts                       # Barrel export
  details/
    SourceBadge.tsx                # EXISTING - extend with authoritative variant
    DetailCard.tsx                 # EXISTING - add capability badges
    DetailViewer.tsx               # EXISTING - integrate authority wrappers
```

### Pattern 1: Semantic Color Variants via class-variance-authority

**What:** Extend existing SourceBadge with `variant` prop for visual authority differentiation
**When to use:** Any place source attribution is displayed
**Example:**
```typescript
// Source: shadcn/ui cva pattern from components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const sourceBadgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      authority: {
        authoritative: 'bg-primary/10 border-primary/30 text-primary',
        supplementary: 'bg-slate-100 border-slate-200 text-slate-600',
      },
      size: {
        sm: 'text-xs px-1.5 py-0',
        md: 'text-sm px-2 py-0.5',
      },
    },
    defaultVariants: {
      authority: 'supplementary',
      size: 'sm',
    },
  }
);

interface SourceBadgeProps extends VariantProps<typeof sourceBadgeVariants> {
  shortName: string;
  name?: string;
  showIcon?: boolean;
  className?: string;
}
```

### Pattern 2: Thin Wrapper Components for Content Sections

**What:** Wrapper components that add visual styling without modifying child components
**When to use:** Wrapping content blocks (description, steps, specifications, warnings) to show authority
**Example:**
```typescript
// Source: React wrapper component pattern
interface AuthoritativeContentProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  className?: string;
}

export function AuthoritativeContent({
  children,
  showWatermark = false,
  className
}: AuthoritativeContentProps) {
  return (
    <div className={cn(
      'relative rounded-lg border-l-4 border-primary bg-primary/5 p-4',
      className
    )}>
      {showWatermark && (
        <VersionWatermark className="absolute top-2 right-2" />
      )}
      {children}
    </div>
  );
}

export function SupplementaryContent({
  children,
  className
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'relative rounded-lg border-l-4 border-slate-300 bg-slate-50 p-4',
      className
    )}>
      {children}
    </div>
  );
}
```

### Pattern 3: Capability Badge Icons

**What:** Small icon badges showing available content types on detail cards
**When to use:** Detail listings in Planner/Fixer mode to show at-a-glance what content is available
**Example:**
```typescript
// Source: Lucide icon names from official docs
import { Box, ListChecks, AlertTriangle, Scale } from 'lucide-react';

interface ContentCapabilities {
  has3DModel: boolean;
  hasSteps: boolean;
  hasWarnings: boolean;
  hasCaseLaw: boolean;
}

export function ContentCapabilityBadges({
  capabilities,
  className
}: { capabilities: ContentCapabilities; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {capabilities.has3DModel && (
        <Tooltip content="Has 3D Model">
          <Box className="h-4 w-4 text-blue-500" />
        </Tooltip>
      )}
      {capabilities.hasSteps && (
        <Tooltip content="Has Installation Steps">
          <ListChecks className="h-4 w-4 text-green-500" />
        </Tooltip>
      )}
      {capabilities.hasWarnings && (
        <Tooltip content="Has Warnings">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </Tooltip>
      )}
      {capabilities.hasCaseLaw && (
        <Tooltip content="Related Case Law">
          <Scale className="h-4 w-4 text-red-500" />
        </Tooltip>
      )}
    </div>
  );
}
```

### Pattern 4: Version Watermark

**What:** Small, unobtrusive version indicator on authoritative content
**When to use:** On all MRM COP content sections to show version provenance
**Example:**
```typescript
// Source: Derived from CLAUDE.md spec for "MRM COP v25.12" watermark
export function VersionWatermark({
  version = 'v25.12',
  className
}: { version?: string; className?: string }) {
  return (
    <span className={cn(
      'text-[10px] text-primary/40 font-mono tracking-tight',
      className
    )}>
      MRM COP {version}
    </span>
  );
}
```

### Anti-Patterns to Avoid
- **Inline color logic:** Don't check `sourceId === 'mrm-cop'` everywhere; use wrapper components
- **Overloaded DetailCard:** Don't add all capability logic to DetailCard; use composition
- **Hard-coded colors:** Use CSS variables and Tailwind theme colors for consistency
- **Missing tooltips on icons:** Capability badges need context for users unfamiliar with icons

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon tooltips | Custom hover logic | @radix-ui/react-tooltip via shadcn | Already used, handles accessibility |
| Color variants | Conditional class strings | class-variance-authority (cva) | Already used by Badge, type-safe |
| Icon library | Custom SVGs | lucide-react | Already has Box, ListChecks, Scale, AlertTriangle |
| Badge styling | New Badge component | Extend existing shadcn Badge | Consistency with rest of UI |

**Key insight:** The existing component library already has all the primitives. This phase is about composition and extension, not creation.

## Common Pitfalls

### Pitfall 1: Inconsistent Authority Styling
**What goes wrong:** MRM content styled with blue in some places, different blue elsewhere
**Why it happens:** Multiple developers applying ad-hoc color classes
**How to avoid:** Use `AuthoritativeContent` wrapper component everywhere; never apply authority colors directly
**Warning signs:** `bg-blue-*` or `bg-primary/*` appearing outside authority components

### Pitfall 2: Missing Source Context
**What goes wrong:** Content displays without any source indication
**Why it happens:** Components render content but don't check/display sourceId
**How to avoid:** Every content block in DetailViewer must be wrapped with authority wrapper showing source
**Warning signs:** Content sections render without border-left styling

### Pitfall 3: Icon Overload on Cards
**What goes wrong:** Too many capability icons make cards cluttered and unreadable
**Why it happens:** Showing all 4 icons even when detail has few capabilities
**How to avoid:** Only show icons for capabilities that exist; use consistent sizing (h-4 w-4)
**Warning signs:** Cards have 4 greyed-out placeholder icons

### Pitfall 4: Watermark Obscuring Content
**What goes wrong:** Version watermark overlaps or interferes with actual content
**Why it happens:** Absolute positioning without adequate spacing
**How to avoid:** Position in top-right corner with adequate padding; use subtle opacity (40%)
**Warning signs:** Text overlapping watermark, watermark drawing focus from content

### Pitfall 5: Authority Colors Conflicting with Warning Colors
**What goes wrong:** Blue authoritative styling conflicts with amber/red warning styling
**Why it happens:** Nesting authority wrapper around warning components
**How to avoid:** Warnings should NOT be wrapped in authority wrappers; they have their own severity colors
**Warning signs:** Amber warnings appearing with blue border

## Code Examples

Verified patterns from official sources and existing codebase:

### Extended SourceBadge Component
```typescript
// Source: Existing components/details/SourceBadge.tsx pattern + cva extension
import { Badge } from '@/components/ui/badge';
import { Library, BookOpen } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const sourceBadgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      authority: {
        authoritative: 'bg-primary/10 border-primary/30 text-primary',
        supplementary: 'bg-slate-100 border-slate-200 text-slate-600',
      },
      size: {
        sm: 'text-xs px-1.5 py-0',
        md: 'text-sm px-2 py-0.5',
      },
    },
    defaultVariants: {
      authority: 'supplementary',
      size: 'sm',
    },
  }
);

interface SourceBadgeProps extends VariantProps<typeof sourceBadgeVariants> {
  shortName: string;
  name?: string;
  showIcon?: boolean;
  className?: string;
}

export function SourceBadge({
  shortName,
  name,
  authority,
  size,
  showIcon = false,
  className,
}: SourceBadgeProps) {
  const Icon = authority === 'authoritative' ? BookOpen : Library;

  return (
    <span
      className={cn(sourceBadgeVariants({ authority, size }), className)}
      title={name || shortName}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {shortName}
    </span>
  );
}
```

### Determining Authority from Source ID
```typescript
// Source: lib/constants.ts CONTENT_SOURCES pattern
export function getAuthorityLevel(sourceId: string | null): 'authoritative' | 'supplementary' {
  // MRM COP is authoritative; everything else is supplementary
  return sourceId === 'mrm-cop' ? 'authoritative' : 'supplementary';
}

// Usage in components:
const authority = getAuthorityLevel(detail.sourceId);
```

### DetailCard with Capability Badges
```typescript
// Source: Existing components/details/DetailCard.tsx + capability extension
export function DetailCard({
  code,
  name,
  substrate,
  sourceId,
  sourceShortName,
  has3DModel,
  hasSteps,
  warningCount,
  failureCount,
  href,
}: DetailCardProps) {
  const authority = getAuthorityLevel(sourceId);

  return (
    <Link href={href}>
      <Card className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        authority === 'authoritative'
          ? 'hover:border-primary/50'
          : 'hover:border-slate-300'
      )}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Left side: Icon + details */}
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              authority === 'authoritative' ? 'bg-primary/10' : 'bg-slate-100'
            )}>
              <FileText className={cn(
                'h-5 w-5',
                authority === 'authoritative' ? 'text-primary' : 'text-slate-600'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SourceBadge
                  shortName={sourceShortName}
                  authority={authority}
                  size="sm"
                />
                <Badge variant="outline" className="font-mono">
                  {code}
                </Badge>
                <span className="font-medium text-slate-900">{name}</span>
              </div>
              <p className="text-sm text-slate-500">{substrate}</p>
            </div>
          </div>

          {/* Right side: Capability badges */}
          <div className="flex items-center gap-3">
            <ContentCapabilityBadges
              capabilities={{
                has3DModel,
                hasSteps,
                hasWarnings: warningCount > 0,
                hasCaseLaw: failureCount > 0,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Version Watermark Integration
```typescript
// Source: Pattern derived from requirements AUTH-03
export function VersionWatermark({
  version = 'v25.12',
  className
}: { version?: string; className?: string }) {
  return (
    <span
      className={cn(
        'text-[10px] text-primary/40 font-mono tracking-tight select-none',
        className
      )}
      aria-hidden="true" // Decorative, not essential content
    >
      MRM COP {version}
    </span>
  );
}

// Usage in AuthoritativeContent:
<div className="relative">
  <VersionWatermark className="absolute top-2 right-2" />
  {children}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-color badges | Semantic color variants (cva) | 2024 | Type-safe variant styling |
| Manual class strings | class-variance-authority | 2024 | Cleaner API, better DX |
| Text-only source labels | Icon + text badges | Current | Faster visual scanning |

**Deprecated/outdated:**
- Inline conditional class logic: Use cva variants instead
- Custom tooltip implementations: Use @radix-ui/react-tooltip from shadcn

## Open Questions

Things that couldn't be fully resolved:

1. **Version Number Source**
   - What we know: Requirements specify "MRM COP v25.12" watermark
   - What's unclear: Should version come from database contentSources table or constants?
   - Recommendation: Add `version` field to contentSources table; default to 'v25.12' in component

2. **Capability Badge Order**
   - What we know: Need badges for 3D, steps, warnings, case law
   - What's unclear: Preferred visual order of these badges
   - Recommendation: Order by "constructive to cautionary": 3D, Steps, Warnings, CaseLaw

3. **Authority Wrapper Granularity**
   - What we know: AUTH-04 requires source attribution on every content block
   - What's unclear: Should wrappers go around entire tabs or individual sections within tabs?
   - Recommendation: Wrap at the section level (specifications, steps, etc.), not entire tabs

## Sources

### Primary (HIGH confidence)
- Existing `components/details/SourceBadge.tsx` - Current implementation pattern
- Existing `components/ui/badge.tsx` - cva variant pattern in use
- `lib/constants.ts` - Content source definitions (MRM COP, RANZ)
- [shadcn/ui Badge documentation](https://ui.shadcn.com/docs/components/badge) - Variant patterns
- [Lucide Icons](https://lucide.dev/icons/) - Box, ListChecks, AlertTriangle, Scale icons

### Secondary (MEDIUM confidence)
- [Tailwind CSS Badge patterns](https://flowbite.com/docs/components/badge/) - Visual styling patterns
- [class-variance-authority](https://cva.style/docs) - Variant API patterns

### Tertiary (LOW confidence)
- WebSearch results on content hierarchy patterns - General UX guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture patterns: HIGH - Extending existing components, established patterns
- Code examples: HIGH - Based on existing codebase patterns
- Pitfalls: MEDIUM - Derived from common React/Tailwind issues and requirements analysis

**Research date:** 2026-02-01
**Valid until:** 60 days (stable domain, UI component patterns)
