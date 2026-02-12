import { cn } from '@/lib/utils';

interface ArticleVersionBannerProps {
  version: string;
  substrateName?: string;
  className?: string;
}

/**
 * COP version and edition banner for MBIE citation validity.
 *
 * Displays formal document identification including:
 * - Full document title
 * - Version number and date
 * - Publishing organisation
 *
 * Fulfills ARTICLE-07: version identification for citation.
 */
export function ArticleVersionBanner({ version, substrateName, className }: ArticleVersionBannerProps) {
  // Parse version string (e.g., "v25.12") to extract year and month
  const versionMatch = version.match(/v?(\d{2})\.(\d{1,2})/);
  let dateDisplay = version;
  if (versionMatch) {
    const year = parseInt(versionMatch[1], 10) + 2000;
    const month = parseInt(versionMatch[2], 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1] || 'December';
    dateDisplay = `Version ${versionMatch[1]}.${versionMatch[2]} \u2014 1 ${monthName} ${year}`;
  }

  return (
    <div
      aria-label="Document version information"
      className={cn(
        'border-l-4 border-primary/30 pl-4 py-2 bg-slate-50 text-sm text-slate-600',
        className
      )}
    >
      <p className="font-medium text-slate-700">
        {substrateName ? `${substrateName} \u2014 ` : ''}NZ Metal Roof and Wall Cladding Code of Practice
      </p>
      <p className="mt-0.5">{dateDisplay}</p>
      <p className="mt-0.5 text-slate-500">Published by Master Roofers NZ</p>
    </div>
  );
}
