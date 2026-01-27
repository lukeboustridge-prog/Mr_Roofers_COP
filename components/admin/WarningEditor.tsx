'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Warning {
  id: string;
  detailId: string | null;
  conditionType: string;
  conditionValue: string;
  warningText: string;
  severity: string | null;
  nzbcRef: string | null;
}

interface WarningEditorProps {
  detailId: string;
  initialWarnings: Warning[];
}

const CONDITION_TYPES = [
  { id: 'wind_zone', name: 'Wind Zone' },
  { id: 'corrosion_zone', name: 'Corrosion Zone' },
  { id: 'pitch', name: 'Roof Pitch' },
  { id: 'substrate', name: 'Substrate Type' },
  { id: 'general', name: 'General' },
];

const SEVERITY_OPTIONS = [
  { id: 'info', name: 'Information', color: 'bg-blue-100 text-blue-700' },
  { id: 'warning', name: 'Warning', color: 'bg-amber-100 text-amber-700' },
  { id: 'critical', name: 'Critical', color: 'bg-red-100 text-red-700' },
];

export function WarningEditor({ detailId, initialWarnings }: WarningEditorProps) {
  const router = useRouter();
  const [warnings, setWarnings] = useState<Warning[]>(initialWarnings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWarning = () => {
    const newWarning: Warning = {
      id: `new-${Date.now()}`,
      detailId,
      conditionType: 'general',
      conditionValue: '',
      warningText: '',
      severity: 'warning',
      nzbcRef: null,
    };
    setWarnings([...warnings, newWarning]);
  };

  const updateWarning = (index: number, field: keyof Warning, value: string | null) => {
    const newWarnings = [...warnings];
    newWarnings[index] = { ...newWarnings[index], [field]: value };
    setWarnings(newWarnings);
  };

  const removeWarning = async (index: number) => {
    const warning = warnings[index];

    // If this is a saved warning (not new), delete it from the server
    if (!warning.id.startsWith('new-')) {
      try {
        const response = await fetch(`/api/admin/warnings/${warning.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete warning');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete');
        return;
      }
    }

    setWarnings(warnings.filter((_, i) => i !== index));
  };

  const saveWarnings = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Save each warning individually
      for (const warning of warnings) {
        const isNew = warning.id.startsWith('new-');
        const url = isNew
          ? '/api/admin/warnings'
          : `/api/admin/warnings/${warning.id}`;
        const method = isNew ? 'POST' : 'PATCH';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            detailId: warning.detailId,
            conditionType: warning.conditionType,
            conditionValue: warning.conditionValue,
            warningText: warning.warningText,
            severity: warning.severity,
            nzbcRef: warning.nzbcRef,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save warning');
        }
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string | null) => {
    const option = SEVERITY_OPTIONS.find((o) => o.id === severity);
    return option?.color || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {warnings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-500 mb-4">No warnings defined for this detail.</p>
            <Button onClick={addWarning}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Warning
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {warnings.map((warning, index) => (
            <Card key={warning.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge className={getSeverityColor(warning.severity)}>
                      {SEVERITY_OPTIONS.find((o) => o.id === warning.severity)?.name ||
                        'Unknown'}
                    </Badge>
                    {CONDITION_TYPES.find((t) => t.id === warning.conditionType)?.name ||
                      warning.conditionType}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWarning(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Condition Type</Label>
                    <Select
                      value={warning.conditionType}
                      onValueChange={(value) =>
                        updateWarning(index, 'conditionType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition Value</Label>
                    <Input
                      value={warning.conditionValue}
                      onChange={(e) =>
                        updateWarning(index, 'conditionValue', e.target.value)
                      }
                      placeholder="e.g., VH, pitch < 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={warning.severity || 'warning'}
                      onValueChange={(value) =>
                        updateWarning(index, 'severity', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Warning Text</Label>
                  <Textarea
                    value={warning.warningText}
                    onChange={(e) =>
                      updateWarning(index, 'warningText', e.target.value)
                    }
                    placeholder="Enter the warning message..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NZBC Reference (optional)</Label>
                  <Input
                    value={warning.nzbcRef || ''}
                    onChange={(e) =>
                      updateWarning(index, 'nzbcRef', e.target.value || null)
                    }
                    placeholder="e.g., E2/AS1 Table 1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={addWarning}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warning
        </Button>
        <Button onClick={saveWarnings} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Warnings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
