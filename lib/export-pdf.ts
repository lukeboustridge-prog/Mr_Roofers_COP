import jsPDF from 'jspdf';

interface ChecklistItemData {
  id: string;
  item: string;
  completed: boolean;
  note?: string;
  photoUrl?: string;
  required?: boolean;
  isCaution?: boolean;
}

interface ChecklistExportData {
  detailCode: string;
  detailName: string;
  projectRef?: string;
  items: ChecklistItemData[];
  completedAt?: Date | string | null;
  createdAt?: Date | string;
  userName?: string;
}

export function exportChecklistToPDF(data: ChecklistExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper to add page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(30, 58, 95); // Primary color #1e3a5f
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('MASTER ROOFERS', margin, 15);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('QA Checklist', margin, 28);

  // Detail code
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.detailCode, pageWidth - margin, 28, { align: 'right' });

  yPos = 50;

  // Detail name
  doc.setTextColor(30, 58, 95);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.detailName, margin, yPos);
  yPos += 10;

  // Metadata section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500

  if (data.projectRef) {
    doc.text(`Project Reference: ${data.projectRef}`, margin, yPos);
    yPos += 6;
  }

  if (data.createdAt) {
    const createdDate = new Date(data.createdAt).toLocaleDateString('en-NZ', {
      dateStyle: 'long',
    });
    doc.text(`Created: ${createdDate}`, margin, yPos);
    yPos += 6;
  }

  if (data.completedAt) {
    const completedDate = new Date(data.completedAt).toLocaleDateString('en-NZ', {
      dateStyle: 'long',
    });
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text(`Completed: ${completedDate}`, margin, yPos);
    yPos += 6;
  }

  if (data.userName) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Inspector: ${data.userName}`, margin, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Progress summary
  const completedCount = data.items.filter((item) => item.completed).length;
  const requiredItems = data.items.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => item.completed).length;

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(`${completedCount} of ${data.items.length} items completed`, margin + 5, yPos + 8);

  if (requiredItems.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const allRequiredComplete = completedRequired === requiredItems.length;
    doc.setTextColor(allRequiredComplete ? 22 : 217, allRequiredComplete ? 163 : 119, allRequiredComplete ? 74 : 6);
    doc.text(
      `Required: ${completedRequired}/${requiredItems.length} ${allRequiredComplete ? '(All complete)' : ''}`,
      margin + 5,
      yPos + 15
    );
  }

  yPos += 30;

  // Checklist items
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Checklist Items', margin, yPos);
  yPos += 8;

  // Draw items
  data.items.forEach((item, index) => {
    checkPageBreak(25);

    const itemHeight = 18;
    const isEven = index % 2 === 0;

    // Background for alternating rows
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos - 3, contentWidth, itemHeight, 'F');
    }

    // Checkbox
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(margin + 3, yPos, 5, 5);

    if (item.completed) {
      doc.setFillColor(22, 163, 74);
      doc.rect(margin + 3, yPos, 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('\u2713', margin + 4.5, yPos + 4);
    }

    // Item text
    doc.setFontSize(9);
    doc.setFont('helvetica', item.isCaution ? 'bold' : 'normal');

    if (item.isCaution) {
      doc.setTextColor(217, 119, 6); // Amber-600
    } else if (item.completed) {
      doc.setTextColor(22, 163, 74); // Green-600
    } else {
      doc.setTextColor(51, 65, 85); // Slate-700
    }

    // Wrap text if needed
    const maxTextWidth = contentWidth - 20;
    const textLines = doc.splitTextToSize(item.item, maxTextWidth);
    doc.text(textLines, margin + 12, yPos + 4);

    // Required badge
    if (item.required) {
      doc.setFillColor(254, 243, 199);
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(6);
      const badgeX = pageWidth - margin - 20;
      doc.roundedRect(badgeX, yPos, 15, 5, 1, 1, 'F');
      doc.text('Required', badgeX + 1.5, yPos + 3.5);
    }

    yPos += itemHeight * Math.max(1, textLines.length * 0.7);

    // Note if present
    if (item.note) {
      checkPageBreak(12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(`Note: ${item.note}`, maxTextWidth - 10);
      doc.text(noteLines, margin + 15, yPos);
      yPos += 5 * noteLines.length;
    }

    // Photo indicator if present
    if (item.photoUrl) {
      checkPageBreak(8);
      doc.setFontSize(7);
      doc.setTextColor(59, 130, 246);
      doc.text('[Photo attached]', margin + 15, yPos);
      yPos += 5;
    }
  });

  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated by Master Roofers COP - ${new Date().toLocaleDateString('en-NZ')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // Page numbers
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  }

  // Generate filename
  const filename = `checklist-${data.detailCode}${data.projectRef ? `-${data.projectRef.replace(/[^a-zA-Z0-9]/g, '-')}` : ''}-${new Date().toISOString().split('T')[0]}.pdf`;

  // Download
  doc.save(filename);
}
