import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Measure items and create pages based on actual heights
 */
const measureItemsAndCreatePages = async (invoiceData, templateData) => {
  const itemsTable = templateData.elements.find(el => el.type === 'itemsTable');
  if (!itemsTable) return [invoiceData.items];

  const tableHeight = itemsTable.height || 300;
  const fontSize = itemsTable.fontSize || 12;
  const headerHeight = 40;
  const availableHeight = tableHeight - headerHeight;

  const measureContainer = document.createElement('div');
  measureContainer.style.position = 'absolute';
  measureContainer.style.left = '-9999px';
  measureContainer.style.top = '0';
  measureContainer.style.width = `${itemsTable.width - 10}px`;
  measureContainer.style.visibility = 'hidden';
  document.body.appendChild(measureContainer);

  const itemHeights = [];

  for (let i = 0; i < invoiceData.items.length; i++) {
    const item = invoiceData.items[i];
    const descriptionHTML = (item.description || '').replace(/\n/g, '<br>');

    const row = document.createElement('div');
    row.style.width = '100%';
    row.style.fontSize = `${fontSize}px`;
    row.style.boxSizing = 'border-box';

    row.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}px;">
        <tr>
          <td style="padding: 8px; width: 40px; vertical-align: top;">${i + 1}</td>
          <td style="padding: 8px; vertical-align: top; word-wrap: break-word; white-space: normal; line-height: 1.4;">${descriptionHTML}</td>
          <td style="padding: 8px; width: 120px; vertical-align: top;">RM ${item.unit_price.toFixed(2)}</td>
          <td style="padding: 8px; width: 80px; vertical-align: top; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; width: 120px; vertical-align: top;">RM ${item.total.toFixed(2)}</td>
        </tr>
      </table>
    `;

    measureContainer.appendChild(row);
    const height = row.offsetHeight;
    itemHeights.push(height);
    measureContainer.removeChild(row);
  }

  document.body.removeChild(measureContainer);

  const pages = [];
  let currentPage = [];
  let currentHeight = 0;

  for (let i = 0; i < invoiceData.items.length; i++) {
    const itemHeight = itemHeights[i];
    if (currentHeight + itemHeight > availableHeight && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [invoiceData.items[i]];
      currentHeight = itemHeight;
    } else {
      currentPage.push(invoiceData.items[i]);
      currentHeight += itemHeight;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);

  return pages;
};

/**
 * Render template elements to container - EXACT positioning
 */
const renderTemplateElements = (container, templateData, invoiceData, items, isFirstPage, isLastPage, startIndex = 0) => {
  // Strong reset for consistency
  const style = document.createElement('style');
  style.innerHTML = `
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
    table { border-collapse: collapse; border-spacing: 0; }
    .rtx-apply, .rtx-apply * { margin: 0 !important; padding: 0 !important; line-height: inherit !important; }
    .rtx-apply { white-space: pre-wrap; word-break: break-word; }
  `;
  container.appendChild(style);

  templateData.elements.forEach(element => {
    if (element.type === 'totalsBlock' && !isLastPage) return;
    if (element.type === 'remarksBlock' && !isLastPage) return;

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
    el.style.padding = (element.type === 'image' || element.type === 'line' || element.type === 'itemsTable') ? '0' : '5px';
    el.style.overflow = 'hidden';

    switch (element.type) {
      case 'text': {
        let pdfHTML = element.content || '';
        const formatCurrency = (amount) => `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        };
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
        Object.keys(placeholderData).forEach(placeholder => {
          pdfHTML = pdfHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), placeholderData[placeholder]);
        });
        el.innerHTML = `<div class="rtx-apply" style="line-height: ${element.lineHeight || 1.4};">${pdfHTML}</div>`;
        break;
      }

      case 'customerBlock':
        el.innerHTML = `<div><strong>Bill To:</strong><br/><strong>${invoiceData.company_name}</strong><br/>${invoiceData.address || ''}<br/><br/>Attn: ${invoiceData.attention || ''}<br/>Tel: ${invoiceData.telephone || ''}</div>`;
        break;

      case 'invoiceInfo': {
        const invDate = new Date(invoiceData.invoice_date);
        const invFormattedDate = `${String(invDate.getDate()).padStart(2, '0')}/${String(invDate.getMonth() + 1).padStart(2, '0')}/${invDate.getFullYear()}`;
        el.innerHTML = `<div><strong>Invoice No.:</strong> ${invoiceData.invoice_number}<br/><strong>Date:</strong> ${invFormattedDate}</div>`;
        break;
      }

      case 'itemsTable':
        el.innerHTML = createItemsTable(items, element.fontSize, startIndex);
        el.style.padding = '0';
        break;

      case 'totalsBlock':
        if (isLastPage) {
          el.innerHTML = `<div style="text-align: right;"><strong style="font-size: ${element.fontSize + 4}px;">Total: RM ${invoiceData.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</strong></div>`;
        }
        break;

      case 'remarksBlock': {
        if (isLastPage) {
          let remarksHTML = element.content || '';
          const formatCurrencyRemarks = (amount) => `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
          const formatDateRemarks = (dateString) => {
            const date = new Date(dateString);
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
          };
          const remarksPlaceholderData = {
            '{company_name}': invoiceData.company_name || '',
            '{address}': invoiceData.address || '',
            '{attention}': invoiceData.attention || '',
            '{telephone}': invoiceData.telephone || '',
            '{invoice_number}': invoiceData.invoice_number || '',
            '{invoice_date}': formatDateRemarks(invoiceData.invoice_date),
            '{subtotal}': formatCurrencyRemarks(invoiceData.subtotal),
            '{total}': formatCurrencyRemarks(invoiceData.total)
          };
          Object.keys(remarksPlaceholderData).forEach(placeholder => {
            remarksHTML = remarksHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), remarksPlaceholderData[placeholder]);
          });
          el.innerHTML = `<div class="rtx-apply" style="line-height: ${element.lineHeight || 1.4};">${remarksHTML}</div>`;
        }
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
        break;
    }

    container.appendChild(el);
  });
};

/**
 * Create items table HTML
 */
const createItemsTable = (items, fontSize, startIndex = 0) => {
  let html = `
    <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}px; border: none; background: transparent; margin: 0; padding: 0;">
      <thead>
        <tr style="border: none; background: transparent;">
          <th style="padding: 8px; text-align: left; font-weight: bold; width: 40px; border: none; background: transparent;">No.</th>
          <th style="padding: 8px; text-align: left; font-weight: bold; border: none; background: transparent;">Item Description</th>
          <th style="padding: 8px; text-align: right; font-weight: bold; width: 120px; border: none; background: transparent;">Unit Price (RM)</th>
          <th style="padding: 8px; text-align: center; font-weight: bold; width: 80px; border: none; background: transparent;">Quantity</th>
          <th style="padding: 8px; text-align: right; font-weight: bold; width: 120px; border: none; background: transparent;">Total (RM)</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item, index) => {
    const unitPrice = `RM ${item.unit_price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const total = `RM ${item.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const itemNumber = startIndex + index + 1;
    const descriptionHTML = (item.description || '').replace(/\n/g, '<br>');

    html += `
      <tr style="border: none; background: transparent;">
        <td style="padding: 8px; text-align: left; border: none; background: transparent; vertical-align: top;">${itemNumber}</td>
        <td style="padding: 8px; text-align: left; border: none; background: transparent; vertical-align: top; word-wrap: break-word; white-space: normal; line-height: 1.4;">${descriptionHTML}</td>
        <td style="padding: 8px; text-align: right; border: none; background: transparent; vertical-align: top;">${unitPrice}</td>
        <td style="padding: 8px; text-align: center; border: none; background: transparent; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 8px; text-align: right; border: none; background: transparent; vertical-align: top;">${total}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
};

/**
 * Generate PDF
 */
export const generateInvoicePDF = async (invoiceData, templateData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;

  // Smart pagination using real measurements
  const itemPages = await measureItemsAndCreatePages(invoiceData, templateData);
  const totalPages = itemPages.length;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const pageItems = itemPages[page];
    const isFirstPage = page === 0;
    const isLastPage = page === totalPages - 1;

    let startIndex = 0;
    for (let i = 0; i < page; i++) {
      startIndex += itemPages[i].length;
    }

    const container = document.createElement('div');
    container.style.width = '794px';
    container.style.height = '1123px';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.background = 'white';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.boxSizing = 'border-box';

    renderTemplateElements(container, templateData, invoiceData, pageItems, isFirstPage, isLastPage, startIndex);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

    document.body.removeChild(container);
  }

  return pdf;
};

/**
 * Download helper
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
