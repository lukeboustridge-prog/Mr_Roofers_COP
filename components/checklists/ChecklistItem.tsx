'use client';

import { useState, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Camera,
  X,
  MessageSquare,
  Check,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItemData {
  id: string;
  item: string;
  completed: boolean;
  note?: string;
  photoUrl?: string;
  required?: boolean;
  isCaution?: boolean;
}

interface ChecklistItemProps {
  data: ChecklistItemData;
  onUpdate: (data: Partial<ChecklistItemData>) => void;
  onPhotoUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}

export function ChecklistItem({
  data,
  onUpdate,
  onPhotoUpload,
  disabled = false,
}: ChecklistItemProps) {
  const [showNote, setShowNote] = useState(!!data.note);
  const [noteValue, setNoteValue] = useState(data.note || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckedChange = (checked: boolean) => {
    onUpdate({ completed: checked });
  };

  const handleNoteChange = (value: string) => {
    setNoteValue(value);
    onUpdate({ note: value });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoUpload) return;

    setUploading(true);
    try {
      const photoUrl = await onPhotoUpload(file);
      onUpdate({ photoUrl });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onUpdate({ photoUrl: undefined });
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        data.completed
          ? 'bg-green-50 border-green-200'
          : data.isCaution
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200'
      )}
    >
      {/* Main checkbox row */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={data.id}
          checked={data.completed}
          onCheckedChange={(checked) => handleCheckedChange(checked === true)}
          disabled={disabled}
          className={cn(
            'mt-0.5',
            data.completed ? 'border-green-500 bg-green-500' : ''
          )}
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={data.id}
            className={cn(
              'text-sm cursor-pointer',
              data.completed ? 'text-green-800 line-through' : 'text-slate-700'
            )}
          >
            {data.isCaution && (
              <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-600" />
            )}
            {data.item}
            {data.required && !data.completed && (
              <span className="ml-1 text-red-500 text-xs">(required)</span>
            )}
          </label>

          {/* Status indicator */}
          {data.completed && (
            <span className="ml-2 inline-flex items-center text-xs text-green-600">
              <Check className="h-3 w-3 mr-1" />
              Complete
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {!disabled && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowNote(!showNote)}
                title="Add note"
              >
                <MessageSquare
                  className={cn(
                    'h-4 w-4',
                    noteValue ? 'text-blue-600' : 'text-slate-400'
                  )}
                />
              </Button>
              {onPhotoUpload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  title="Add photo"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera
                      className={cn(
                        'h-4 w-4',
                        data.photoUrl ? 'text-blue-600' : 'text-slate-400'
                      )}
                    />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Note input */}
      {showNote && (
        <div className="mt-3 ml-7">
          <Input
            placeholder="Add a note..."
            value={noteValue}
            onChange={(e) => handleNoteChange(e.target.value)}
            disabled={disabled}
            className="text-sm"
          />
        </div>
      )}

      {/* Photo preview */}
      {data.photoUrl && (
        <div className="mt-3 ml-7">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photoUrl}
              alt="Checklist item photo"
              className="h-24 w-24 object-cover rounded-lg border"
            />
            {!disabled && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Read-only version for viewing completed checklists
export function ChecklistItemReadOnly({
  data,
}: {
  data: ChecklistItemData;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        data.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border',
            data.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-300'
          )}
        >
          {data.completed && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm',
              data.completed ? 'text-green-800' : 'text-slate-700'
            )}
          >
            {data.isCaution && (
              <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-600" />
            )}
            {data.item}
          </p>

          {data.note && (
            <p className="mt-1 text-xs text-slate-500 italic">{data.note}</p>
          )}

          {data.photoUrl && (
            <div className="mt-2">
              <a
                href={data.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ImageIcon className="h-3 w-3" />
                View photo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
