'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2, Link2, Unlink } from 'lucide-react';
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

interface FailureCase {
  id: string;
  caseId: string;
  failureType: string | null;
  outcome: string | null;
  summary: string | null;
  sourceUrl: string | null;
  decisionDate: string | null;
  relatedDetails: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

interface Detail {
  id: string;
  code: string;
  name: string;
}

export default function EditFailurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [failureCase, setFailureCase] = useState<FailureCase | null>(null);
  const [allDetails, setAllDetails] = useState<Detail[]>([]);
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failureId, setFailureId] = useState<string>('');

  useEffect(() => {
    params.then(async ({ id }) => {
      setFailureId(id);
      try {
        // Fetch failure case
        const failureRes = await fetch(`/api/failures/${id}`);
        if (!failureRes.ok) throw new Error('Failed to load failure case');
        const failureData = await failureRes.json();
        setFailureCase({
          ...failureData,
          decisionDate: failureData.decisionDate
            ? new Date(failureData.decisionDate).toISOString().split('T')[0]
            : '',
        });

        // Fetch all details for linking
        const detailsRes = await fetch('/api/details?limit=1000');
        const detailsData = await detailsRes.json();
        setAllDetails(detailsData.details || []);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureCase) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/failures/${failureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: failureCase.caseId,
          failureType: failureCase.failureType,
          outcome: failureCase.outcome,
          summary: failureCase.summary,
          sourceUrl: failureCase.sourceUrl,
          decisionDate: failureCase.decisionDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.push('/admin/failures');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this failure case?')) return;

    try {
      const response = await fetch(`/api/admin/failures/${failureId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.push('/admin/failures');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const linkDetail = async () => {
    if (!selectedDetailId || !failureCase) return;

    setIsLinking(true);
    try {
      const response = await fetch(`/api/admin/failures/${failureId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailId: selectedDetailId }),
      });

      if (!response.ok) throw new Error('Failed to link detail');

      const linkedDetail = allDetails.find((d) => d.id === selectedDetailId);
      if (linkedDetail) {
        setFailureCase({
          ...failureCase,
          relatedDetails: [...failureCase.relatedDetails, linkedDetail],
        });
      }
      setSelectedDetailId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link');
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkDetail = async (detailId: string) => {
    if (!failureCase) return;

    try {
      const response = await fetch(
        `/api/admin/failures/${failureId}/links/${detailId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to unlink detail');

      setFailureCase({
        ...failureCase,
        relatedDetails: failureCase.relatedDetails.filter(
          (d) => d.id !== detailId
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!failureCase) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-red-600">{error || 'Failure case not found'}</p>
        <Link href="/admin/failures">
          <Button variant="outline" className="mt-4">
            Back to Failure Cases
          </Button>
        </Link>
      </div>
    );
  }

  const linkedDetailIds = failureCase.relatedDetails.map((d) => d.id);
  const availableDetails = allDetails.filter(
    (d) => !linkedDetailIds.includes(d.id)
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/failures"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Failure Cases
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Failure Case</h1>
            <p className="text-slate-600">{failureCase.caseId}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseId">Case ID</Label>
                <Input
                  id="caseId"
                  value={failureCase.caseId}
                  onChange={(e) =>
                    setFailureCase({ ...failureCase, caseId: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decisionDate">Decision Date</Label>
                <Input
                  id="decisionDate"
                  type="date"
                  value={failureCase.decisionDate || ''}
                  onChange={(e) =>
                    setFailureCase({
                      ...failureCase,
                      decisionDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="failureType">Failure Type</Label>
                <Select
                  value={failureCase.failureType || ''}
                  onValueChange={(value) =>
                    setFailureCase({ ...failureCase, failureType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water-ingress">Water Ingress</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="durability">Durability</SelectItem>
                    <SelectItem value="workmanship">Workmanship</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select
                  value={failureCase.outcome || ''}
                  onValueChange={(value) =>
                    setFailureCase({ ...failureCase, outcome: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upheld">Upheld</SelectItem>
                    <SelectItem value="partially-upheld">Partially Upheld</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={failureCase.summary || ''}
                onChange={(e) =>
                  setFailureCase({ ...failureCase, summary: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={failureCase.sourceUrl || ''}
                onChange={(e) =>
                  setFailureCase({ ...failureCase, sourceUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Linked Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Linked Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {failureCase.relatedDetails.length === 0 ? (
              <p className="text-sm text-slate-500">
                No details linked to this failure case.
              </p>
            ) : (
              <div className="space-y-2">
                {failureCase.relatedDetails.map((detail) => (
                  <div
                    key={detail.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {detail.code}
                      </Badge>
                      <span className="text-sm">{detail.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkDetail(detail.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Select
                value={selectedDetailId}
                onValueChange={setSelectedDetailId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a detail to link..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDetails.map((detail) => (
                    <SelectItem key={detail.id} value={detail.id}>
                      {detail.code} - {detail.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={linkDetail}
                disabled={!selectedDetailId || isLinking}
              >
                {isLinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/admin/failures">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
