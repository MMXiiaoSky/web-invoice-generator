import React from 'react';
import { createRoot } from 'react-dom/client';
import InvoicePage, { A4_WIDTH_PX, A4_HEIGHT_PX } from '../components/InvoicePage';

const MEASUREMENT_TOLERANCE = 1.5;

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

const nodeHasOverflow = (node) => {
  if (!node) {
    return false;
  }

  const verticalOverflow = node.scrollHeight - node.clientHeight > MEASUREMENT_TOLERANCE;
  const horizontalOverflow = node.scrollWidth - node.clientWidth > MEASUREMENT_TOLERANCE;

  return verticalOverflow || horizontalOverflow;
};

const previewHasOverflow = (preview) => {
  if (!preview) {
    return false;
  }

  const wrappers = preview.querySelectorAll('[data-element-id]');

  for (const wrapper of wrappers) {
    if (nodeHasOverflow(wrapper)) {
      return true;
    }
  }

  return false;
};

const evaluateItemsFit = (preview, expectedCount) => {
  const result = {
    overflow: false,
    fits: typeof expectedCount === 'number' ? expectedCount : 0
  };

  if (!preview) {
    return result;
  }

  const tableWrapper = preview.querySelector('[data-element-type="itemsTable"]');

  if (!tableWrapper) {
    result.overflow = previewHasOverflow(preview);
    return result;
  }

  const table = tableWrapper.querySelector('.invoice-page-items-table');

  if (!table) {
    result.overflow = previewHasOverflow(preview);
    return result;
  }

  const wrapperRect = tableWrapper.getBoundingClientRect();
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  result.fits = rows.length;

  if (rows.length < expectedCount) {
    result.overflow = true;
  }

  for (let index = 0; index < rows.length; index += 1) {
    const rowRect = rows[index].getBoundingClientRect();
    const rowBottom = rowRect.bottom - wrapperRect.top;

    if (rowBottom > wrapperRect.height + MEASUREMENT_TOLERANCE) {
      result.overflow = true;
      result.fits = index;
      break;
    }
  }

  if (!result.overflow) {
    const tableRect = table.getBoundingClientRect();
    const tableBottom = tableRect.bottom - wrapperRect.top;

    if (tableBottom > wrapperRect.height + MEASUREMENT_TOLERANCE) {
      result.overflow = true;
    }
  }

  if (!result.overflow) {
    result.overflow = previewHasOverflow(preview);
  }

  result.fits = Math.max(0, result.fits);

  return result;
};

const pageWouldOverflow = async (invoiceData, templateData, config) => {
  const expectedCount = Array.isArray(config?.items) ? config.items.length : 0;
  const { host, root, preview } = await mountInvoicePage(invoiceData, templateData, config);

  try {
    return evaluateItemsFit(preview, expectedCount);
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

  const packPage = async (availableItems, indexOffset) => {
    let bestCount = 0;
    let bestHideTotals = true;
    let bestHideRemarks = true;

    for (let candidate = 1; candidate <= availableItems.length; candidate += 1) {
      const subset = availableItems.slice(0, candidate);
      const isFinalCandidate = candidate === availableItems.length;
      const config = {
        items: subset,
        startIndex: indexOffset,
        hideTotals: !isFinalCandidate,
        hideRemarks: !isFinalCandidate
      };

      const { overflow, fits } = await pageWouldOverflow(
        invoiceData,
        templateData,
        config
      );

      if (overflow) {
        if (typeof fits === 'number' && fits > bestCount) {
          bestCount = fits;
          bestHideTotals = config.hideTotals;
          bestHideRemarks = config.hideRemarks;
        }
        break;
      }

      bestCount = candidate;
      bestHideTotals = config.hideTotals;
      bestHideRemarks = config.hideRemarks;
    }

    if (bestCount === 0) {
      const fallbackSubset = availableItems.slice(0, 1);
      const totalsCheck = await pageWouldOverflow(invoiceData, templateData, {
        items: fallbackSubset,
        startIndex: indexOffset,
        hideTotals: false,
        hideRemarks: false
      });
      const canShowTotals = availableItems.length === 1 && !totalsCheck.overflow;

      bestCount = 1;
      bestHideTotals = !canShowTotals;
      bestHideRemarks = !canShowTotals;
    }

    return {
      taken: availableItems.slice(0, bestCount),
      hideTotals: bestHideTotals,
      hideRemarks: bestHideRemarks
    };
  };

  while (remaining.length > 0) {
    const { taken, hideTotals, hideRemarks } = await packPage(remaining, startIndex);

    pages.push({
      items: taken,
      startIndex,
      hideTotals,
      hideRemarks
    });

    remaining = remaining.slice(taken.length);
    startIndex += taken.length;
  }

  if (pages.length > 0) {
    let finalPage = pages[pages.length - 1];

    while (finalPage && finalPage.hideTotals) {
      const { overflow } = await pageWouldOverflow(invoiceData, templateData, {
        items: finalPage.items,
        startIndex: finalPage.startIndex,
        hideTotals: false,
        hideRemarks: false
      });

      if (!overflow) {
        finalPage.hideTotals = false;
        finalPage.hideRemarks = false;
        break;
      }

      if (finalPage.items.length === 0) {
        finalPage.hideTotals = false;
        finalPage.hideRemarks = false;
        break;
      }

      if (finalPage.items.length <= 1) {
        break;
      }

      const movedItem = finalPage.items.pop();
      const emptyAfterPop = finalPage.items.length === 0;
      const baseStartIndex = finalPage.startIndex;
      const newStartIndex = baseStartIndex + finalPage.items.length;

      if (emptyAfterPop) {
        pages.pop();
      }

      pages.push({
        items: [movedItem],
        startIndex: newStartIndex,
        hideTotals: true,
        hideRemarks: true
      });

      finalPage = pages[pages.length - 1];
    }

    if (pages[pages.length - 1].hideTotals) {
      const lastPage = pages[pages.length - 1];
      const totalsPageStartIndex = lastPage.startIndex + lastPage.items.length;

      pages.push({
        items: [],
        startIndex: totalsPageStartIndex,
        hideTotals: false,
        hideRemarks: false
      });
    }
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
