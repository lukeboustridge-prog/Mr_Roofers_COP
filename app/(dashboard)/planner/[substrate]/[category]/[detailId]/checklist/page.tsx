'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QAChecklist } from '@/components/checklists/QAChecklist';
import { ChecklistItemData } from '@/components/checklists/ChecklistItem';
import { ArrowLeft } from 'lucide-react';

interface DetailStep {
  id: string;
  stepNumber: number;
  instruction: string;
  cautionNote?: string | null;
}

interface VentilationReq {
  type?: string;
  requirement: string;
  required: boolean;
}

interface DetailData {
  id: string;
  code: string;
  name: string;
  steps: DetailStep[];
  ventilationReqs: VentilationReq[] | null;
}

export default function DetailChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const substrateId = params.substrate as string;
  const categoryId = params.category as string;
  const detailId = params.detailId as string;

  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await fetch(`/api/details/${detailId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch detail');
        }
        const data = await response.json();
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [detailId]);

  const handleSave = useCallback(
    async (data: {
      projectRef: string;
      items: ChecklistItemData[];
      completedAt?: Date;
    }) => {
      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detailId,
          projectRef: data.projectRef,
          items: data.items,
          completedAt: data.completedAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist');
      }

      const result = await response.json();

      // Redirect to the saved checklist
      router.push(`/checklists/${result.data.id}`);
    },
    [detailId, router]
  );

  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'checklists');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const result = await response.json();
    return result.url;
  }, []);

  if (loading) {
    return (
      <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
        <Link href={`/planner/${substrateId}/${categoryId}/${detailId}`}>
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Detail
          </Button>
        </Link>
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-red-600">{error || 'Detail not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Navigation */}
      <Link href={`/planner/${substrateId}/${categoryId}/${detailId}`}>
        <Button variant="ghost" className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Detail
        </Button>
      </Link>

      {/* QA Checklist */}
      <QAChecklist
        detailId={detail.id}
        detailCode={detail.code}
        detailName={detail.name}
        steps={detail.steps}
        ventilationReqs={detail.ventilationReqs || []}
        onSave={handleSave}
        onPhotoUpload={handlePhotoUpload}
      />
    </div>
  );
}
