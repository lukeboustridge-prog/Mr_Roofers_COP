'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, X } from 'lucide-react';

interface Substrate {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  substrateId: string | null;
}

interface DetailData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  minPitch: number | null;
  maxPitch: number | null;
  specifications: Record<string, string> | null;
  standardsRefs: Array<{ code: string; clause: string; title: string }> | null;
  ventilationReqs: Array<{ check: string; required: boolean }> | null;
}

interface DetailFormProps {
  detail?: DetailData | null;
  substrates: Substrate[];
  categories: Category[];
  isNew?: boolean;
}

export function DetailForm({
  detail,
  substrates,
  categories,
  isNew = false,
}: DetailFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DetailData>({
    id: detail?.id || '',
    code: detail?.code || '',
    name: detail?.name || '',
    description: detail?.description || '',
    substrateId: detail?.substrateId || '',
    categoryId: detail?.categoryId || '',
    subcategoryId: detail?.subcategoryId || null,
    modelUrl: detail?.modelUrl || '',
    thumbnailUrl: detail?.thumbnailUrl || '',
    minPitch: detail?.minPitch || null,
    maxPitch: detail?.maxPitch || null,
    specifications: detail?.specifications || {},
    standardsRefs: detail?.standardsRefs || [],
    ventilationReqs: detail?.ventilationReqs || [],
  });

  const filteredCategories = categories.filter(
    (c) => c.substrateId === formData.substrateId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isNew ? '/api/details' : `/api/admin/details/${detail?.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          modelUrl: formData.modelUrl || null,
          thumbnailUrl: formData.thumbnailUrl || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save detail');
      }

      router.push('/admin/details');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof DetailData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Specs management
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const addSpec = () => {
    if (newSpecKey && newSpecValue) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey]: newSpecValue,
        },
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpec = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  // Standards refs management
  const [newStandardCode, setNewStandardCode] = useState('');
  const [newStandardClause, setNewStandardClause] = useState('');
  const [newStandardTitle, setNewStandardTitle] = useState('');

  const addStandardRef = () => {
    if (newStandardCode && newStandardClause && newStandardTitle) {
      setFormData((prev) => ({
        ...prev,
        standardsRefs: [
          ...(prev.standardsRefs || []),
          {
            code: newStandardCode,
            clause: newStandardClause,
            title: newStandardTitle,
          },
        ],
      }));
      setNewStandardCode('');
      setNewStandardClause('');
      setNewStandardTitle('');
    }
  };

  const removeStandardRef = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      standardsRefs: prev.standardsRefs?.filter((_, i) => i !== index) || [],
    }));
  };

  // Ventilation reqs management
  const [newVentCheck, setNewVentCheck] = useState('');
  const [newVentRequired, setNewVentRequired] = useState(true);

  const addVentReq = () => {
    if (newVentCheck) {
      setFormData((prev) => ({
        ...prev,
        ventilationReqs: [
          ...(prev.ventilationReqs || []),
          { check: newVentCheck, required: newVentRequired },
        ],
      }));
      setNewVentCheck('');
      setNewVentRequired(true);
    }
  };

  const removeVentReq = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ventilationReqs: prev.ventilationReqs?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="ventilation">Ventilation</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="e.g., F07"
                    disabled={!isNew}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="e.g., F07"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Valley Flashing"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Detailed description of this detail..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="substrate">Substrate</Label>
                  <Select
                    value={formData.substrateId || ''}
                    onValueChange={(value) =>
                      handleInputChange('substrateId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select substrate" />
                    </SelectTrigger>
                    <SelectContent>
                      {substrates.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId || ''}
                    onValueChange={(value) =>
                      handleInputChange('categoryId', value)
                    }
                    disabled={!formData.substrateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPitch">Min Pitch (degrees)</Label>
                  <Input
                    id="minPitch"
                    type="number"
                    min={0}
                    max={90}
                    value={formData.minPitch ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'minPitch',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPitch">Max Pitch (degrees)</Label>
                  <Input
                    id="maxPitch"
                    type="number"
                    min={0}
                    max={90}
                    value={formData.maxPitch ?? ''}
                    onChange={(e) =>
                      handleInputChange(
                        'maxPitch',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specifications</Label>
                <div className="space-y-2">
                  {Object.entries(formData.specifications || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded"
                      >
                        <span className="font-medium text-sm">{key}:</span>
                        <span className="text-sm flex-1">{value}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpec(key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addSpec}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modelUrl">3D Model URL</Label>
                <Input
                  id="modelUrl"
                  type="url"
                  value={formData.modelUrl || ''}
                  onChange={(e) => handleInputChange('modelUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl || ''}
                  onChange={(e) =>
                    handleInputChange('thumbnailUrl', e.target.value)
                  }
                  placeholder="https://..."
                />
                {formData.thumbnailUrl && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards">
          <Card>
            <CardHeader>
              <CardTitle>Standards References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.standardsRefs?.map((ref, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded"
                >
                  <div className="flex-1">
                    <span className="font-medium text-sm">{ref.code}</span>
                    <span className="text-sm text-slate-500 mx-2">
                      {ref.clause}
                    </span>
                    <span className="text-sm">{ref.title}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStandardRef(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Code (e.g., E2/AS1)"
                    value={newStandardCode}
                    onChange={(e) => setNewStandardCode(e.target.value)}
                  />
                  <Input
                    placeholder="Clause (e.g., Table 20)"
                    value={newStandardClause}
                    onChange={(e) => setNewStandardClause(e.target.value)}
                  />
                  <Input
                    placeholder="Title"
                    value={newStandardTitle}
                    onChange={(e) => setNewStandardTitle(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addStandardRef}
                  className="w-full"
                >
                  Add Standard Reference
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventilation Tab */}
        <TabsContent value="ventilation">
          <Card>
            <CardHeader>
              <CardTitle>Ventilation Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.ventilationReqs?.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded"
                >
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      req.required
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {req.required ? 'Required' : 'Optional'}
                  </span>
                  <span className="flex-1 text-sm">{req.check}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVentReq(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="space-y-2 p-4 border rounded-lg">
                <Input
                  placeholder="Ventilation check (e.g., Ensure airflow path is clear)"
                  value={newVentCheck}
                  onChange={(e) => setNewVentCheck(e.target.value)}
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newVentRequired}
                      onChange={(e) => setNewVentRequired(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVentReq}
                    className="flex-1"
                  >
                    Add Ventilation Check
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/details')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isNew ? 'Create Detail' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
