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

const nodeHasOverflow = (node) => {
  if (!node) {
    return false;
  }

  const verticalOverflow = node.scrollHeight - node.clientHeight > 1;
  const horizontalOverflow = node.scrollWidth - node.clientWidth > 1;

  if (verticalOverflow || horizontalOverflow) {
    return true;
  }

  return false;
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

  if (hasVerticalOverflow || hasHorizontalOverflow || exceedsHeight || exceedsWidth) {
    return true;
  }

  const elementWrappers = preview.querySelectorAll('[data-element-id]');

  for (const wrapper of elementWrappers) {
    if (nodeHasOverflow(wrapper)) {
      return true;
    }

    if (wrapper.dataset.elementType === 'itemsTable') {
      const table = wrapper.querySelector('.invoice-page-items-table');
      if (nodeHasOverflow(table)) {
        return true;
      }
    }
  }

  return false;
};

const pageWouldOverflow = async (invoiceData, templateData, config) => {
  const { host, root, preview } = await mountInvoicePage(invoiceData, templateData, config);

  try {
    return previewHasOverflow(preview);
  } finally {
    disposeHiddenHost(host, root);
  }
};

const ITEMS_TOLERANCE_PX = 2;

const measureItemsFit = async (
  invoiceData,
  templateData,
  items,
  startIndex,
  { hideTotals = false, hideRemarks = false } = {}
) => {
  const { host, root, preview } = await mountInvoicePage(invoiceData, templateData, {
    items,
    startIndex,
    hideTotals,
    hideRemarks
  });

  try {
    const wrapper = preview?.querySelector('[data-element-type="itemsTable"]');

    if (!wrapper) {
      return items.length;
    }

    const table = wrapper.querySelector('table');

    if (!table) {
      return items.length;
    }

    const availableHeight = wrapper.clientHeight || wrapper.getBoundingClientRect().height;

    if (!availableHeight) {
      return items.length;
    }

    const header = table.tHead;
    let consumedHeight = header ? header.getBoundingClientRect().height : 0;

    const body = table.tBodies && table.tBodies[0];
    const rows = body ? Array.from(body.rows) : [];

    let fitCount = 0;

    for (const row of rows) {
      const rowHeight = row.getBoundingClientRect().height;

      if (consumedHeight + rowHeight <= availableHeight + ITEMS_TOLERANCE_PX) {
        consumedHeight += rowHeight;
        fitCount += 1;
      } else {
        break;
      }
    }

    return fitCount;
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
    const fitWithoutTotals = await measureItemsFit(
      invoiceData,
      templateData,
      remaining,
      startIndex,
      { hideTotals: true, hideRemarks: true }
    );

    let itemsToTake = Math.max(1, Math.min(remaining.length, fitWithoutTotals || 0));
    let hideTotals = true;
    let hideRemarks = true;

    if (remaining.length <= itemsToTake) {
      const fitWithTotals = await measureItemsFit(
        invoiceData,
        templateData,
        remaining,
        startIndex,
        { hideTotals: false, hideRemarks: false }
      );

      const normalizedFitWithTotals = Math.max(
        1,
        Math.min(remaining.length, fitWithTotals || 0)
      );

      if (remaining.length <= normalizedFitWithTotals) {
        itemsToTake = remaining.length;
        hideTotals = false;
        hideRemarks = false;
      } else {
        itemsToTake = Math.max(1, Math.min(itemsToTake, normalizedFitWithTotals));
      }
    }

    while (itemsToTake > 0) {
      const subset = remaining.slice(0, itemsToTake);
      const overflow = await pageWouldOverflow(invoiceData, templateData, {
        items: subset,
        startIndex,
        hideTotals,
        hideRemarks
      });

      if (!overflow) {
        break;
      }

      itemsToTake -= 1;
    }

    if (itemsToTake === 0) {
      itemsToTake = 1;
    }

    if (!hideTotals && itemsToTake < remaining.length) {
      hideTotals = true;
      hideRemarks = true;
    }

    const pageItems = remaining.slice(0, itemsToTake);

    pages.push({
      items: pageItems,
      startIndex,
      hideTotals,
      hideRemarks
    });

    remaining = remaining.slice(itemsToTake);
    startIndex += itemsToTake;
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
