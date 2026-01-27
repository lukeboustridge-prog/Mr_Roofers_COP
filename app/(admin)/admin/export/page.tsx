'use client';

import { useState } from 'react';
import { Download, Upload, Loader2, FileJson, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const exportOptions = [
  { id: 'substrates', label: 'Substrates', description: '6 substrate types' },
  { id: 'categories', label: 'Categories', description: 'Category definitions' },
  { id: 'details', label: 'Details', description: 'All COP details' },
  { id: 'steps', label: 'Installation Steps', description: 'Step-by-step instructions' },
  { id: 'warnings', label: 'Warnings', description: 'Warning conditions' },
  { id: 'failures', label: 'Failure Cases', description: 'MBIE/LBP decisions' },
  { id: 'links', label: 'Detail-Failure Links', description: 'Relationships between details and failures' },
];

export default function ExportPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([
    'substrates',
    'categories',
    'details',
    'steps',
    'warnings',
    'failures',
    'links',
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(exportOptions.map((o) => o.id));
  };

  const selectNone = () => {
    setSelectedItems([]);
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      setExportError('Please select at least one item to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const params = new URLSearchParams();
      selectedItems.forEach((item) => params.append('include', item));

      const response = await fetch(`/api/admin/export?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const data = await response.json();

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mrm-cop-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Export / Import</h1>
        <p className="text-slate-600">
          Export COP data for backup or import into another system
        </p>
      </div>

      {exportError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {exportError}
        </div>
      )}

      {/* Export Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Select which data to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button type="button" variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <Checkbox
                  id={option.id}
                  checked={selectedItems.includes(option.id)}
                  onCheckedChange={() => toggleItem(option.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedItems.length === 0}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import previously exported data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <Database className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 mb-2">
              Import functionality coming soon
            </p>
            <p className="text-xs text-slate-400">
              This feature will allow you to restore data from a JSON export file
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Export Format</h3>
        <p className="text-sm text-blue-700">
          The export file is a JSON document containing all selected data with
          their relationships preserved. You can use this for:
        </p>
        <ul className="text-sm text-blue-700 list-disc ml-4 mt-2 space-y-1">
          <li>Regular backups of your COP content</li>
          <li>Migrating data to another system</li>
          <li>Version control of content changes</li>
          <li>Sharing content with other administrators</li>
        </ul>
      </div>
    </div>
  );
}
