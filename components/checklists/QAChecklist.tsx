'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChecklistItem,
  ChecklistItemData,
  ChecklistItemReadOnly,
} from './ChecklistItem';
import { VentilationCheck } from '@/components/details/VentilationCheck';
import {
  ClipboardCheck,
  Plus,
  Save,
  Printer,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
  Download,
} from 'lucide-react';
import { exportChecklistToPDF } from '@/lib/export-pdf';
import { cn } from '@/lib/utils';

interface VentilationRequirement {
  type?: string;
  requirement: string;
  required: boolean;
}

interface DetailStep {
  id: string;
  stepNumber: number;
  instruction: string;
  cautionNote?: string | null;
}

interface QAChecklistProps {
  detailId: string;
  detailCode: string;
  detailName: string;
  steps?: DetailStep[];
  ventilationReqs?: VentilationRequirement[];
  projectRef?: string;
  existingItems?: ChecklistItemData[];
  onSave?: (data: {
    projectRef: string;
    items: ChecklistItemData[];
    completedAt?: Date;
  }) => Promise<void>;
  onPhotoUpload?: (file: File) => Promise<string>;
  className?: string;
}

export function QAChecklist({
  detailCode,
  detailName,
  steps = [],
  ventilationReqs = [],
  projectRef: initialProjectRef = '',
  existingItems = [],
  onSave,
  onPhotoUpload,
  className,
}: QAChecklistProps) {
  const [projectRef, setProjectRef] = useState(initialProjectRef);
  const [items, setItems] = useState<ChecklistItemData[]>(() => {
    // Initialize with existing items or generate from steps
    if (existingItems.length > 0) {
      return existingItems;
    }

    // Generate items from steps
    const stepItems: ChecklistItemData[] = steps.map((step) => ({
      id: `step-${step.id}`,
      item: step.instruction,
      completed: false,
      isCaution: !!step.cautionNote,
      required: true,
    }));

    // Add ventilation items
    const ventilationItems: ChecklistItemData[] = ventilationReqs.map(
      (req, index) => ({
        id: `vent-${index}`,
        item: req.requirement,
        completed: false,
        required: req.required,
      })
    );

    return [...stepItems, ...ventilationItems];
  });
  const [customItemText, setCustomItemText] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const completedCount = items.filter((item) => item.completed).length;
  const requiredCount = items.filter((item) => item.required).length;
  const completedRequiredCount = items.filter(
    (item) => item.required && item.completed
  ).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const allRequiredComplete = completedRequiredCount === requiredCount;
  const allComplete = completedCount === items.length;

  const handleItemUpdate = useCallback(
    (id: string, updates: Partial<ChecklistItemData>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  const handleAddCustomItem = () => {
    if (!customItemText.trim()) return;

    const newItem: ChecklistItemData = {
      id: `custom-${Date.now()}`,
      item: customItemText.trim(),
      completed: false,
      required: false,
    };

    setItems((prev) => [...prev, newItem]);
    setCustomItemText('');
  };

  const handleRemoveItem = (id: string) => {
    // Only allow removing custom items
    if (!id.startsWith('custom-')) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave({
        projectRef,
        items,
        completedAt: allComplete ? new Date() : undefined,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save checklist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    exportChecklistToPDF({
      detailCode,
      detailName,
      projectRef,
      items,
      completedAt: allComplete ? new Date() : null,
      createdAt: new Date(),
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                QA Checklist
              </CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="outline" className="font-mono mr-2">
                  {detailCode}
                </Badge>
                {detailName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              {onSave && (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          {/* Project reference */}
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">
              Project Reference
            </label>
            <Input
              placeholder="Enter job reference (optional)"
              value={projectRef}
              onChange={(e) => setProjectRef(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">
                {completedCount} of {items.length} items complete
              </span>
              <span className="font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Required items status */}
            {requiredCount > 0 && (
              <p
                className={cn(
                  'text-xs mt-2',
                  allRequiredComplete ? 'text-green-600' : 'text-amber-600'
                )}
              >
                {allRequiredComplete ? (
                  <>
                    <Check className="inline h-3 w-3 mr-1" />
                    All {requiredCount} required items complete
                  </>
                ) : (
                  <>
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    {completedRequiredCount}/{requiredCount} required items
                    complete
                  </>
                )}
              </p>
            )}

            {/* Last saved */}
            {lastSaved && (
              <p className="text-xs text-slate-500 mt-1">
                <Clock className="inline h-3 w-3 mr-1" />
                Last saved:{' '}
                {lastSaved.toLocaleTimeString('en-NZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Installation Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <ChecklistItem
                data={item}
                onUpdate={(updates) => handleItemUpdate(item.id, updates)}
                onPhotoUpload={onPhotoUpload}
              />
              {item.id.startsWith('custom-') && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute -right-2 -top-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add custom item */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Add custom check item..."
              value={customItemText}
              onChange={(e) => setCustomItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomItem();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={handleAddCustomItem}
              disabled={!customItemText.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ventilation Check (always visible) */}
      {ventilationReqs.length > 0 && (
        <VentilationCheck checks={ventilationReqs} />
      )}

      {/* Completion Status */}
      {allComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Check className="mx-auto h-12 w-12 text-green-600 mb-3" />
            <h3 className="font-semibold text-green-800 text-lg">
              Checklist Complete!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All items have been verified. Don&apos;t forget to save your
              checklist.
            </p>
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Completed Checklist'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Read-only version for viewing saved checklists
interface SavedChecklist {
  id: string;
  detailId: string;
  detailCode: string;
  detailName: string;
  projectRef?: string;
  items: ChecklistItemData[];
  completedAt?: Date | string;
  createdAt: Date | string;
}

export function QAChecklistReadOnly({
  checklist,
  className,
}: {
  checklist: SavedChecklist;
  className?: string;
}) {
  const completedCount = checklist.items.filter((item) => item.completed).length;

  const handleExportPDF = () => {
    exportChecklistToPDF({
      detailCode: checklist.detailCode,
      detailName: checklist.detailName,
      projectRef: checklist.projectRef,
      items: checklist.items,
      completedAt: checklist.completedAt,
      createdAt: checklist.createdAt,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn('space-y-6 print:space-y-4', className)}>
      {/* Header */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                QA Checklist
              </CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="outline" className="font-mono mr-2">
                  {checklist.detailCode}
                </Badge>
                {checklist.detailName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  checklist.completedAt
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {checklist.completedAt ? 'Completed' : 'In Progress'}
              </Badge>
              <div className="flex gap-1 print:hidden">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          {checklist.projectRef && (
            <p className="text-sm text-slate-600 mt-2">
              <strong>Project Ref:</strong> {checklist.projectRef}
            </p>
          )}

          <div className="text-sm text-slate-500 mt-2 space-y-1">
            <p>
              Created:{' '}
              {new Date(checklist.createdAt).toLocaleDateString('en-NZ', {
                dateStyle: 'long',
              })}
            </p>
            {checklist.completedAt && (
              <p>
                Completed:{' '}
                {new Date(checklist.completedAt).toLocaleDateString('en-NZ', {
                  dateStyle: 'long',
                })}
              </p>
            )}
          </div>

          <p className="text-sm font-medium mt-4">
            {completedCount} of {checklist.items.length} items completed
          </p>
        </CardHeader>
      </Card>

      {/* Items */}
      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-4 space-y-3 print:p-0">
          {checklist.items.map((item) => (
            <ChecklistItemReadOnly key={item.id} data={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
