import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const formatCurrency = (amount = 0) =>
  `RM ${Number(amount || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const applyPlaceholders = (html = '', invoiceData = {}) => {
  const placeholderData = {
    '{company_name}': invoiceData.company_name || '',
    '{address}': invoiceData.address || '',
    '{attention}': invoiceData.attention || '',
    '{telephone}': invoiceData.telephone || '',
    '{invoice_number}': invoiceData.invoice_number || '',
    '{invoice_date}': formatDate(invoiceData.invoice_date),
    '{subtotal}': formatCurrency(invoiceData.subtotal),
    '{total}': formatCurrency(invoiceData.total)
  };

  let rendered = html;

  Object.keys(placeholderData).forEach((placeholder) => {
    rendered = rendered.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), placeholderData[placeholder]);
  });

  return rendered;
};

const createBasePage = (templateData, invoiceData) => {
  const page = document.createElement('div');
  page.className = 'invoice-preview-canvas pdf-export-page';
  page.style.width = `${A4_WIDTH_PX}px`;
  page.style.height = `${A4_HEIGHT_PX}px`;
  page.style.position = 'relative';
  page.style.background = '#ffffff';
  page.style.boxSizing = 'border-box';
  page.style.boxShadow = 'none';

  const style = document.createElement('style');
  style.innerHTML = `
    * {
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }
    div, p {
      margin: 0 !important;
      padding: 0 !important;
    }
    .rtx-content-wrapper p,
    .rtx-content-wrapper div {
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
  page.appendChild(style);

  const context = {
    page,
    itemsBody: null,
    itemsContainer: null,
    itemsFontSize: 12,
    totalsElement: null,
    remarksElement: null
  };

  (templateData.elements || []).forEach((element) => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${element.x}px`;
    el.style.top = `${element.y}px`;
    el.style.width = `${element.width}px`;
    el.style.height = `${element.height}px`;
    el.style.fontSize = `${element.fontSize}px`;
    el.style.color = element.color || '#000';
    el.style.fontWeight = element.fontWeight || 'normal';
    el.style.fontStyle = element.fontStyle || 'normal';
    el.style.textDecoration = element.textDecoration || 'none';
    el.style.padding =
      element.type === 'image' || element.type === 'line' || element.type === 'itemsTable' ? '0' : '5px';
    el.style.overflow = 'hidden';
    el.style.lineHeight = element.lineHeight || 1.4;

    switch (element.type) {
      case 'text':
      case 'remarksBlock': {
        const wrapper = document.createElement('div');
        wrapper.className = 'rtx-content-wrapper';
        wrapper.style.whiteSpace = 'pre-wrap';
        wrapper.innerHTML = applyPlaceholders(element.content || '', invoiceData);
        el.appendChild(wrapper);
        if (element.type === 'remarksBlock') {
          context.remarksElement = el;
        }
        break;
      }

      case 'customerBlock':
        el.innerHTML = `<div><strong>Bill To:</strong><br/><strong>${invoiceData.company_name || ''}</strong><br/>${
          invoiceData.address || ''
        }<br/><br/>Attn: ${invoiceData.attention || ''}<br/>Tel: ${invoiceData.telephone || ''}</div>`;
        break;

      case 'invoiceInfo':
        el.innerHTML = `<div><strong>Invoice No.:</strong> ${invoiceData.invoice_number || ''}<br/><strong>Date:</strong> ${formatDate(
          invoiceData.invoice_date
        )}</div>`;
        break;

      case 'itemsTable': {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.fontSize = `${element.fontSize}px`;
        table.style.border = 'none';
        table.style.background = 'transparent';

        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr style="border: none; background: transparent;">
            <th style="padding: 8px; text-align: left; font-weight: bold; width: 40px; border: none; background: transparent;">No.</th>
            <th style="padding: 8px; text-align: left; font-weight: bold; border: none; background: transparent;">Item Description</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; width: 120px; border: none; background: transparent;">Unit Price (RM)</th>
            <th style="padding: 8px; text-align: center; font-weight: bold; width: 80px; border: none; background: transparent;">Quantity</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; width: 120px; border: none; background: transparent;">Total (RM)</th>
          </tr>
        `;

        const tbody = document.createElement('tbody');

        table.appendChild(thead);
        table.appendChild(tbody);

        el.appendChild(table);
        el.style.padding = '0';
        context.itemsBody = tbody;
        context.itemsContainer = el;
        context.itemsFontSize = element.fontSize || 12;
        break;
      }

      case 'totalsBlock': {
        el.innerHTML = `<div style="text-align: right;"><strong style="font-size: ${
          (element.fontSize || 12) + 4
        }px;">Total: ${formatCurrency(invoiceData.total)}</strong></div>`;
        context.totalsElement = el;
        break;
      }

      case 'image':
        if (element.src) {
          const img = document.createElement('img');
          img.src = element.src;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          el.appendChild(img);
        }
        break;

      case 'line':
        el.style.borderBottom = `${element.thickness || 2}px solid ${element.color || '#000'}`;
        el.style.height = '0';
        el.style.padding = '0';
        break;

      default:
        if (element.content) {
          el.textContent = element.content;
        }
        break;
    }

    page.appendChild(el);
  });

  return context;
};

const createItemRow = (item, displayIndex, fontSize) => {
  const row = document.createElement('tr');
  row.style.border = 'none';
  row.style.background = 'transparent';

  const descriptionHTML = (item.description || '').replace(/\n/g, '<br>');

  row.innerHTML = `
    <td style="padding: 8px; text-align: left; border: none; background: transparent; vertical-align: top;">${displayIndex}</td>
    <td style="padding: 8px; text-align: left; border: none; background: transparent; vertical-align: top; word-wrap: break-word; white-space: pre-wrap; line-height: 1.4;">${descriptionHTML}</td>
    <td style="padding: 8px; text-align: right; border: none; background: transparent; vertical-align: top;">${formatCurrency(
      item.unit_price
    )}</td>
    <td style="padding: 8px; text-align: center; border: none; background: transparent; vertical-align: top;">${
      item.quantity
    }</td>
    <td style="padding: 8px; text-align: right; border: none; background: transparent; vertical-align: top;">${formatCurrency(
      item.total
    )}</td>
  `;

  row.style.fontSize = `${fontSize}px`;

  return row;
};

const paginateInvoiceIntoPages = (invoiceData, templateData) => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '0';
  wrapper.style.background = '#ffffff';
  document.body.appendChild(wrapper);

  try {
    const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
    const hasItemsTable = (templateData.elements || []).some((el) => el.type === 'itemsTable');

    if (!hasItemsTable) {
      return [
        {
          items,
          startIndex: 0
        }
      ];
    }

    let currentPage = createBasePage(templateData, invoiceData);
    wrapper.appendChild(currentPage.page);

    const pages = [];
    let currentItems = [];
    let currentStartIndex = 0;

    items.forEach((item, index) => {
      if (!currentPage.itemsBody || !currentPage.itemsContainer) {
        return;
      }

      let row = createItemRow(item, index + 1, currentPage.itemsFontSize);
      currentPage.itemsBody.appendChild(row);

      const overflow =
        currentPage.itemsContainer.scrollHeight - currentPage.itemsContainer.clientHeight > 1;

      if (overflow && currentItems.length > 0) {
        currentPage.itemsBody.removeChild(row);

        pages.push({
          items: currentItems,
          startIndex: currentStartIndex
        });

        currentStartIndex += currentItems.length;
        currentItems = [];

        currentPage = createBasePage(templateData, invoiceData);
        wrapper.appendChild(currentPage.page);

        row = createItemRow(item, index + 1, currentPage.itemsFontSize);
        currentPage.itemsBody.appendChild(row);
      }

      currentItems.push(item);
    });

    if (currentItems.length > 0 || pages.length === 0) {
      pages.push({
        items: currentItems,
        startIndex: currentStartIndex
      });
    }

    return pages;
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
};

const renderPageToCanvas = async (invoiceData, templateData, pageConfig, isLastPage) => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.height = `${A4_HEIGHT_PX}px`;
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.background = '#ffffff';

  const { page, itemsBody, itemsFontSize, remarksElement, totalsElement } = createBasePage(
    templateData,
    invoiceData
  );

  if (!isLastPage) {
    if (remarksElement && remarksElement.parentNode) {
      remarksElement.parentNode.removeChild(remarksElement);
    }
    if (totalsElement && totalsElement.parentNode) {
      totalsElement.parentNode.removeChild(totalsElement);
    }
  }

  if (itemsBody) {
    itemsBody.innerHTML = '';
    const items = Array.isArray(pageConfig.items) ? pageConfig.items : [];
    items.forEach((item, index) => {
      const displayIndex = pageConfig.startIndex + index + 1;
      const row = createItemRow(item, displayIndex, itemsFontSize);
      itemsBody.appendChild(row);
    });
  }

  host.appendChild(page);
  document.body.appendChild(host);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const canvas = await html2canvas(page, {
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
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }
};

/**
 * Generate PDF from invoice template
 */
export const generateInvoicePDF = async (invoiceData, templateData) => {
  const pages = paginateInvoiceIntoPages(invoiceData, templateData);
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
  const pageWidth = 210;
  const pageHeight = 297;

  for (let index = 0; index < totalPages; index++) {
    if (index > 0) {
      pdf.addPage();
    }

    const page = pages[index];
    const isLastPage = index === totalPages - 1;
    const canvas = await renderPageToCanvas(invoiceData, templateData, page, isLastPage);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
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
