import React from 'react';
import './InvoicePreview.css';

const InvoicePreview = ({ invoice, templateData }) => {
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const formatCurrency = (amount) => `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderElementContent = (element) => {
    switch (element.type) {
      case 'text': {
        let displayHTML = element.content || '';
        const placeholderData = {
          '{company_name}': invoice.company_name || '',
          '{address}': invoice.address || '',
          '{attention}': invoice.attention || '',
          '{telephone}': invoice.telephone || '',
          '{invoice_number}': invoice.invoice_number || '',
          '{invoice_date}': formatDate(invoice.invoice_date),
          '{subtotal}': formatCurrency(invoice.subtotal),
          '{total}': formatCurrency(invoice.total)
        };
        Object.keys(placeholderData).forEach(placeholder => {
          displayHTML = displayHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), placeholderData[placeholder]);
        });
        const styledDisplayHTML = `<div class="rtx-apply" style="line-height: ${element.lineHeight || 1.4};">${displayHTML}</div>`;
        return <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: styledDisplayHTML }} />;
      }

      case 'customerBlock':
        return (
          <div>
            <strong>Bill To:</strong><br/>
            <strong>{invoice.company_name}</strong><br/>
            {invoice.address}<br/><br/>
            Attn: {invoice.attention}<br/>
            Tel: {invoice.telephone}
          </div>
        );

      case 'invoiceInfo':
        return (
          <div>
            <strong>Invoice No.:</strong> {invoice.invoice_number}<br/>
            <strong>Date:</strong> {formatDate(invoice.invoice_date)}
          </div>
        );

      case 'itemsTable':
        return (
          <table style={{ width: '100%', fontSize: `${element.fontSize}px`, background: 'transparent', borderCollapse: 'collapse', border: 'none' }}>
            <thead>
              <tr style={{ background: 'transparent', border: 'none' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '40px', background: 'transparent', border: 'none' }}>No.</th>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', background: 'transparent', border: 'none' }}>Item Description</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', background: 'transparent', border: 'none' }}>Unit Price (RM)</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px', background: 'transparent', border: 'none' }}>Quantity</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', background: 'transparent', border: 'none' }}>Total (RM)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} style={{ background: 'transparent', border: 'none' }}>
                  <td style={{ padding: '8px', textAlign: 'left', background: 'transparent', verticalAlign: 'top', border: 'none' }}>{index + 1}</td>
                  <td style={{ padding: '8px', textAlign: 'left', background: 'transparent', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.4', border: 'none' }}>{item.description}</td>
                  <td style={{ padding: '8px', textAlign: 'right', background: 'transparent', verticalAlign: 'top', border: 'none' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '8px', textAlign: 'center', background: 'transparent', verticalAlign: 'top', border: 'none' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right', background: 'transparent', verticalAlign: 'top', border: 'none' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'totalsBlock':
        return (
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: `${element.fontSize + 4}px` }}>Total: {formatCurrency(invoice.total)}</strong>
          </div>
        );

      case 'remarksBlock': {
        let remarksHTML = element.content || '';
        const remarksPlaceholderData = {
          '{company_name}': invoice.company_name || '',
          '{address}': invoice.address || '',
          '{attention}': invoice.attention || '',
          '{telephone}': invoice.telephone || '',
          '{invoice_number}': invoice.invoice_number || '',
          '{invoice_date}': formatDate(invoice.invoice_date),
          '{subtotal}': formatCurrency(invoice.subtotal),
          '{total}': formatCurrency(invoice.total)
        };
        Object.keys(remarksPlaceholderData).forEach(placeholder => {
          remarksHTML = remarksHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), remarksPlaceholderData[placeholder]);
        });
        const styledRemarksHTML = `<div class="rtx-apply" style="line-height: ${element.lineHeight || 1.4};">${remarksHTML}</div>`;
        return <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: styledRemarksHTML }} />;
      }

      case 'image':
        return element.src ? <img src={element.src} alt="Invoice" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null;

      case 'line':
        return <div style={{ borderBottom: `${element.thickness || 2}px solid ${element.color || '#000'}`, height: '0', width: '100%' }} />;

      default:
        return null;
    }
  };

  const renderElement = (element) => {
    return (
      <div
        key={element.id}
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          fontSize: `${element.fontSize}px`,
          fontWeight: element.fontWeight,
          color: element.color,
          textDecoration: element.textDecoration,
          fontStyle: element.fontStyle,
          padding: (element.type === 'image' || element.type === 'line' || element.type === 'itemsTable') ? '0' : '5px',
          overflow: 'hidden'
        }}
      >
        {renderElementContent(element)}
      </div>
    );
  };

  if (!templateData || !templateData.elements) {
    return (
      <div className="invoice-preview-error">
        <p>Template data not available</p>
      </div>
    );
  }

  return (
    <div className="invoice-preview-container">
      <style>
        {`
          .invoice-preview-canvas * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }
          .invoice-preview-canvas table {
            border-collapse: collapse;
            border-spacing: 0;
          }
          .invoice-preview-canvas .rtx-apply,
          .invoice-preview-canvas .rtx-apply * {
            margin: 0 !important;
            padding: 0 !important;
            line-height: inherit !important;
          }
          .invoice-preview-canvas .rtx-apply {
            white-space: pre-wrap;
            word-break: break-word;
          }
        `}
      </style>
      <div
        className="invoice-preview-canvas"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          position: 'relative',
          background: 'white',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
          margin: '0 auto'
        }}
      >
        {templateData.elements.map(element => renderElement(element))}
      </div>
    </div>
  );
};

export default InvoicePreview;
