import React, { useEffect, useState } from 'react';
import InvoicePage from './InvoicePage';
import { paginateInvoice } from '../utils/invoicePagination';
import './InvoicePreview.css';

const defaultPageConfig = (invoice) => ({
  items: Array.isArray(invoice?.items) ? invoice.items : [],
  startIndex: 0,
  hideTotals: false,
  hideRemarks: false
});

const InvoicePreview = ({ invoice, templateData }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationError, setPaginationError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const runPagination = async () => {
      if (!invoice || !templateData || !templateData.elements) {
        setPages([]);
        setPaginationError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPaginationError(null);

      try {
        const pageConfigs = await paginateInvoice(invoice, templateData);
        if (!cancelled) {
          setPages(pageConfigs);
        }
      } catch (error) {
        console.error('Error paginating invoice preview:', error);
        if (!cancelled) {
          setPages([defaultPageConfig(invoice)]);
          setPaginationError('Unable to paginate preview. Showing all items on a single page.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    runPagination();

    return () => {
      cancelled = true;
    };
  }, [invoice, templateData]);

  if (!templateData || !templateData.elements) {
    return (
      <div className="invoice-preview-error">
        <p>Template data not available</p>
      </div>
    );
  }

  const pageList = pages.length > 0 ? pages : [defaultPageConfig(invoice)];

  return (
    <div className="invoice-preview-container">
      {loading && (
        <div className="invoice-preview-loading">Generating preview…</div>
      )}
      {paginationError && (
        <div className="invoice-preview-warning">{paginationError}</div>
      )}
      <style>
        {`
          .invoice-preview-canvas .rtx-content-wrapper p,
          .invoice-preview-canvas .rtx-content-wrapper div {
            margin: 0 !important;
            padding: 0 !important;
          }
        `}
      </style>
      <div className="invoice-preview-pages">
        {pageList.map((page, index) => (
          <div key={`preview-page-${index}`} className="invoice-preview-page-wrapper">
            {pageList.length > 1 && (
              <div className="invoice-preview-page-label">
                Page {index + 1} of {pageList.length}
              </div>
            )}
            <InvoicePage
              invoice={invoice}
              templateData={templateData}
              itemsOverride={page.items}
              itemStartIndex={page.startIndex}
              hideTotals={page.hideTotals}
              hideRemarks={page.hideRemarks}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoicePreview;
