'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardCheck,
  Calendar,
  Check,
  Clock,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  note?: string;
  photoUrl?: string;
}

interface SavedChecklist {
  id: string;
  detailId: string;
  detailCode: string;
  detailName: string;
  substrateId: string | null;
  categoryId: string | null;
  projectRef?: string | null;
  items: ChecklistItem[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<SavedChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  async function fetchChecklists() {
    try {
      const response = await fetch('/api/checklists');
      if (response.ok) {
        const data = await response.json();
        setChecklists(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this checklist?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setChecklists((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    } finally {
      setDeleting(null);
    }
  }

  const completedChecklists = checklists.filter((c) => c.completedAt);
  const inProgressChecklists = checklists.filter((c) => !c.completedAt);

  if (loading) {
    return (
      <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8 pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            My Checklists
          </h1>
        </div>
        <p className="mt-2 text-slate-600">
          Track and manage your QA checklists
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{checklists.length}</p>
            <p className="text-sm text-slate-500">Total Checklists</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {completedChecklists.length}
            </p>
            <p className="text-sm text-slate-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {inProgressChecklists.length}
            </p>
            <p className="text-sm text-slate-500">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {checklists.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">
              No checklists yet
            </p>
            <p className="text-sm text-slate-400">
              Start a QA checklist from any detail page
            </p>
            <Link href="/planner">
              <Button className="mt-4">Browse Details</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {inProgressChecklists.length > 0 && (
        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
            <Clock className="h-5 w-5 text-amber-600" />
            In Progress ({inProgressChecklists.length})
          </h2>
          <div className="space-y-4">
            {inProgressChecklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                onDelete={() => handleDelete(checklist.id)}
                isDeleting={deleting === checklist.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedChecklists.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
            <Check className="h-5 w-5 text-green-600" />
            Completed ({completedChecklists.length})
          </h2>
          <div className="space-y-4">
            {completedChecklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                onDelete={() => handleDelete(checklist.id)}
                isDeleting={deleting === checklist.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistCard({
  checklist,
  onDelete,
  isDeleting,
}: {
  checklist: SavedChecklist;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const completedCount = checklist.items.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.items.length) * 100;
  const isComplete = !!checklist.completedAt;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        isComplete ? 'border-green-200' : 'border-amber-200'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              isComplete ? 'bg-green-100' : 'bg-amber-100'
            )}
          >
            {isComplete ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono">
                {checklist.detailCode}
              </Badge>
              <Badge
                className={cn(
                  'text-xs',
                  isComplete
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {isComplete ? 'Complete' : `${Math.round(progress)}%`}
              </Badge>
            </div>

            <h3 className="font-medium text-slate-900 line-clamp-1">
              {checklist.detailName}
            </h3>

            {checklist.projectRef && (
              <p className="text-sm text-slate-500">
                Project: {checklist.projectRef}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(checklist.createdAt).toLocaleDateString('en-NZ', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>
                {completedCount}/{checklist.items.length} items
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isDeleting}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link href={`/checklists/${checklist.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        {!isComplete && (
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
