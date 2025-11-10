import React from 'react';
import { createRoot } from 'react-dom/client';
import InvoicePage, { A4_WIDTH_PX, A4_HEIGHT_PX } from '../components/InvoicePage';

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

const mountInvoicePage = async (invoiceData, templateData, config = {}) => {
  const host = createHiddenHost();
  const root = createRoot(host);

  await new Promise((resolve) => {
    root.render(
      React.createElement(InvoicePage, {
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
  const { host, root, preview } = await mountInvoicePage(invoiceData, templateData, config);

  try {
    return previewHasOverflow(preview);
  } finally {
    disposeHiddenHost(host, root);
  }
};

const paginateInvoice = async (invoiceData, templateData) => {
  if (!templateData || !templateData.elements) {
    const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
    return [
      {
        items,
        startIndex: 0,
        hideTotals: false,
        hideRemarks: false
      }
    ];
  }

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

export {
  paginateInvoice,
  mountInvoicePage,
  disposeHiddenHost,
  previewHasOverflow,
  pageWouldOverflow,
  A4_WIDTH_PX,
  A4_HEIGHT_PX
};
