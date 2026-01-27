'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step {
  id: string;
  detailId: string | null;
  stepNumber: number;
  instruction: string;
  imageUrl: string | null;
  cautionNote: string | null;
}

interface StepEditorProps {
  detailId: string;
  initialSteps: Step[];
}

export function StepEditor({ detailId, initialSteps }: StepEditorProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addStep = () => {
    const newStep: Step = {
      id: `new-${Date.now()}`,
      detailId,
      stepNumber: steps.length + 1,
      instruction: '',
      imageUrl: null,
      cautionNote: null,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, field: keyof Step, value: string | null) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(newSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedStep = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedStep);

    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });

    setSteps(newSteps);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveSteps = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/details/${detailId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save steps');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {steps.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-500 mb-4">No installation steps defined.</p>
            <Button onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Step
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-opacity ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="cursor-grab p-1 hover:bg-slate-100 rounded"
                    onMouseDown={(e) => e.currentTarget.parentElement?.parentElement?.parentElement?.setAttribute('draggable', 'true')}
                  >
                    <GripVertical className="h-5 w-5 text-slate-400" />
                  </div>
                  <CardTitle className="text-base flex-1">
                    Step {step.stepNumber}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Instruction</Label>
                  <Textarea
                    value={step.instruction}
                    onChange={(e) =>
                      updateStep(index, 'instruction', e.target.value)
                    }
                    placeholder="Enter the step instruction..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image URL (optional)</Label>
                    <Input
                      value={step.imageUrl || ''}
                      onChange={(e) =>
                        updateStep(index, 'imageUrl', e.target.value || null)
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Caution Note (optional)</Label>
                    <Input
                      value={step.cautionNote || ''}
                      onChange={(e) =>
                        updateStep(index, 'cautionNote', e.target.value || null)
                      }
                      placeholder="Important safety note..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={addStep}>
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
        <Button onClick={saveSteps} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Steps
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
