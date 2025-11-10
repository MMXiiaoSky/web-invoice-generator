import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  paginateInvoice,
  mountInvoicePage,
  disposeHiddenHost,
  A4_WIDTH_PX,
  A4_HEIGHT_PX
} from './invoicePagination';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;

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

const renderPageToCanvas = async (invoiceData, templateData, pageConfig) => {
  const { host, root, preview } = await mountInvoicePage(invoiceData, templateData, pageConfig);

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

export const generateInvoicePDF = async (invoiceData, templateData) => {
  const pages = await paginateInvoice(invoiceData, templateData);
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

export const downloadPDF = async (invoiceData, templateData, filename) => {
  try {
    const pdf = await generateInvoicePDF(invoiceData, templateData);
    pdf.save(filename || `invoice-${invoiceData.invoice_number}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
