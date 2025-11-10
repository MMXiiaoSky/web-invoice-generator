import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoicePreview from '../components/InvoicePreview';

/**
 * Attempt to capture the on-screen invoice preview directly so the PDF matches
 * exactly what the user sees. Falls back to the template renderer when the
 * preview is unavailable (for example when generating invoices outside of the
 * InvoiceView page).
 */
const tryRenderExistingPreviewToPDF = async () => {
  const preview = document.querySelector('.invoice-preview-canvas');

  if (!preview) {
    return null;
  }

  const rect = preview.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  if (!width || !height) {
    return null;
  }

  const hasVerticalOverflow = preview.scrollHeight - preview.clientHeight > 1;
  const hasHorizontalOverflow = preview.scrollWidth - preview.clientWidth > 1;

  // Some templates rely on absolutely positioned elements. Measure the furthest
  // edge of the positioned children relative to the preview to catch overflow
  // that doesn't update scroll metrics (for example when containers have
  // `overflow: hidden`).
  let maxBottom = 0;
  let maxRight = 0;

  Array.from(preview.children).forEach((child) => {
    const childRect = child.getBoundingClientRect();
    maxBottom = Math.max(maxBottom, childRect.bottom - rect.top);
    maxRight = Math.max(maxRight, childRect.right - rect.left);
  });

  const exceedsHeight = maxBottom - height > 1;
  const exceedsWidth = maxRight - width > 1;

  if (hasVerticalOverflow || hasHorizontalOverflow || exceedsHeight || exceedsWidth) {
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '0';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.background = '#ffffff';

  const clone = preview.cloneNode(true);
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.background = '#ffffff';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width,
      height,
      scrollX: 0,
      scrollY: 0
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imageData = canvas.toDataURL('image/png');
    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);

    return pdf;
  } finally {
    document.body.removeChild(wrapper);
  }
};

const A4_WIDTH_PX = 794; // 210mm at 96 DPI
const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

const createHiddenHost = () => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.height = `${A4_HEIGHT_PX}px`;
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.background = '#ffffff';
  document.body.appendChild(host);
  return host;
};

const disposeHiddenHost = (host, root) => {
  if (root) {
    root.unmount();
  }
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
};

const mountInvoicePreview = async (invoiceData, templateData, config) => {
  const host = createHiddenHost();
  const root = createRoot(host);

  await new Promise((resolve) => {
    root.render(
      React.createElement(InvoicePreview, {
        invoice: invoiceData,
        templateData,
        itemsOverride: config.items,
        itemStartIndex: config.startIndex || 0,
        hideTotals: config.hideTotals || false,
        hideRemarks: config.hideRemarks || false,
        disableShadow: true
      })
    );

    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  const preview = host.querySelector('.invoice-preview-canvas');

  return { host, root, preview };
};

const previewHasOverflow = (preview) => {
  if (!preview) {
    return false;
  }

  const rect = preview.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return false;
  }

  const hasVerticalOverflow = preview.scrollHeight - preview.clientHeight > 1;
  const hasHorizontalOverflow = preview.scrollWidth - preview.clientWidth > 1;

  let maxBottom = rect.top;
  let maxRight = rect.left;

  Array.from(preview.children).forEach((child) => {
    const childRect = child.getBoundingClientRect();
    if (childRect.bottom > maxBottom) {
      maxBottom = childRect.bottom;
    }
    if (childRect.right > maxRight) {
      maxRight = childRect.right;
    }
  });

  const exceedsHeight = maxBottom - rect.top > rect.height + 1;
  const exceedsWidth = maxRight - rect.left > rect.width + 1;

  return hasVerticalOverflow || hasHorizontalOverflow || exceedsHeight || exceedsWidth;
};

const pageWouldOverflow = async (invoiceData, templateData, config) => {
  const { host, root, preview } = await mountInvoicePreview(invoiceData, templateData, config);

  try {
    return previewHasOverflow(preview);
  } finally {
    disposeHiddenHost(host, root);
  }
};

const paginateInvoiceIntoPages = async (invoiceData, templateData) => {
  const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];

  if (items.length === 0) {
    return [
      {
        items: [],
        startIndex: 0,
        hideTotals: false,
        hideRemarks: false
      }
    ];
  }

  const pages = [];
  let startIndex = 0;
  let remaining = items.slice();

  while (remaining.length > 0) {
    let bestCount = 0;
    let bestHideTotals = true;
    let bestHideRemarks = true;

    for (let i = 1; i <= remaining.length; i++) {
      const subset = remaining.slice(0, i);
      const isLastCandidate = i === remaining.length;
      const hideTotals = !isLastCandidate;
      const hideRemarks = !isLastCandidate;

      const overflow = await pageWouldOverflow(invoiceData, templateData, {
        items: subset,
        startIndex,
        hideTotals,
        hideRemarks
      });

      if (!overflow) {
        bestCount = i;
        bestHideTotals = hideTotals;
        bestHideRemarks = hideRemarks;
      } else {
        break;
      }
    }

    if (bestCount === 0) {
      bestCount = 1;
      const willBeOnlyPage = remaining.length === 1 && pages.length === 0;
      bestHideTotals = !willBeOnlyPage;
      bestHideRemarks = !willBeOnlyPage;
    }

    const pageItems = remaining.slice(0, bestCount);
    const isLastPage = remaining.length === bestCount;

    pages.push({
      items: pageItems,
      startIndex,
      hideTotals: isLastPage ? false : bestHideTotals,
      hideRemarks: isLastPage ? false : bestHideRemarks
    });

    remaining = remaining.slice(bestCount);
    startIndex += bestCount;
  }

  if (pages.length > 0) {
    const finalPage = pages[pages.length - 1];
    finalPage.hideTotals = false;
    finalPage.hideRemarks = false;
  }

  return pages;
};

const renderPageToCanvas = async (invoiceData, templateData, pageConfig) => {
  const { host, root, preview } = await mountInvoicePreview(invoiceData, templateData, pageConfig);

  try {
    const canvas = await html2canvas(preview, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#ffffff'
    });

    return canvas;
  } finally {
    disposeHiddenHost(host, root);
  }
};

/**
 * Generate PDF from invoice template
 */
export const generateInvoicePDF = async (invoiceData, templateData) => {
  const pages = await paginateInvoiceIntoPages(invoiceData, templateData);
  const totalPages = pages.length;

  if (totalPages === 1) {
    try {
      const directPreviewPDF = await tryRenderExistingPreviewToPDF();
      if (directPreviewPDF) {
        return directPreviewPDF;
      }
    } catch (error) {
      console.warn('Falling back to template render for PDF generation:', error);
    }
  }

  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let index = 0; index < totalPages; index++) {
    if (index > 0) {
      pdf.addPage();
    }

    const page = pages[index];
    const canvas = await renderPageToCanvas(invoiceData, templateData, page);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
  }

  return pdf;
};

/**
 * Download PDF
 */
export const downloadPDF = async (invoiceData, templateData, filename) => {
  try {
    const pdf = await generateInvoicePDF(invoiceData, templateData);
    pdf.save(filename || `invoice-${invoiceData.invoice_number}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
