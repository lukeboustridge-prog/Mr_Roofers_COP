'use client';

import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LinkPreview } from './LinkPreview';

export interface LinkSuggestion {
  mrmDetailId: string;
  mrmCode: string;
  mrmName: string;
  ranzDetailId: string;
  ranzCode: string;
  ranzName: string;
  ranzHasModel: boolean;
  confidence: 'exact' | 'partial' | 'related';
  score: number;
  matchReason: string;
}

interface LinkSuggestionCardProps {
  suggestion: LinkSuggestion;
  onApprove: (suggestion: LinkSuggestion) => Promise<void>;
  onReject: (suggestion: LinkSuggestion) => void;
  isApproving?: boolean;
}

function getConfidenceBadgeStyle(confidence: string) {
  switch (confidence) {
    case 'exact':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'partial':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'related':
      return 'bg-slate-100 text-slate-600 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

export function LinkSuggestionCard({
  suggestion,
  onApprove,
  onReject,
  isApproving = false,
}: LinkSuggestionCardProps) {
  const scorePercent = Math.round(suggestion.score * 100);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with confidence and score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getConfidenceBadgeStyle(suggestion.confidence)}>
              {suggestion.confidence}
            </Badge>
            <span className="text-sm text-slate-500">
              {scorePercent}% match
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {suggestion.matchReason}
          </span>
        </div>

        {/* Link Preview */}
        <LinkPreview
          primary={{
            code: suggestion.mrmCode,
            name: suggestion.mrmName,
            sourceId: 'mrm-cop',
          }}
          supplementary={{
            code: suggestion.ranzCode,
            name: suggestion.ranzName,
            sourceId: 'ranz-guide',
            hasModel: suggestion.ranzHasModel,
          }}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReject(suggestion)}
            disabled={isApproving}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove(suggestion)}
            disabled={isApproving}
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
