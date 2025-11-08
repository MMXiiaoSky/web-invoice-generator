import React from 'react';
import './InvoicePreview.css';

const InvoicePreview = ({ invoice, templateData }) => {
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const formatCurrency = (amount) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderElementContent = (element) => {
    switch (element.type) {
      case 'text':
        let displayHTML = element.content || '';
        
        // Replace placeholders with actual data
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
          displayHTML = displayHTML.replace(
            new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
            placeholderData[placeholder]
          );
        });
        
        return (
          <div 
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: displayHTML }}
          />
        );
      
      case 'customerBlock':
        return (
          <div style={{ lineHeight: '1.6' }}>
            <strong>Bill To:</strong><br/>
            <strong>{invoice.company_name}</strong><br/>
            {invoice.address}<br/><br/>
            Attn: {invoice.attention}<br/>
            Tel: {invoice.telephone}
          </div>
        );
      
      case 'invoiceInfo':
        return (
          <div style={{ lineHeight: '1.6' }}>
            <strong>Invoice No.:</strong> {invoice.invoice_number}<br/>
            <strong>Date:</strong> {formatDate(invoice.invoice_date)}
          </div>
        );
      
      case 'itemsTable':
        return (
            <table style={{ 
            width: '100%', 
            fontSize: `${element.fontSize}px`, 
            borderCollapse: 'collapse',
            border: 'none',
            background: 'transparent'
            }}>
            <thead>
                <tr style={{ border: 'none', background: 'transparent' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '40px', border: 'none', background: 'transparent' }}>No.</th>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', border: 'none', background: 'transparent' }}>Item Description</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', border: 'none', background: 'transparent' }}>Unit Price (RM)</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px', border: 'none', background: 'transparent' }}>Quantity</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', border: 'none', background: 'transparent' }}>Total (RM)</th>
                </tr>
            </thead>
            <tbody>
                {invoice.items.map((item, index) => (
                <tr key={index} style={{ border: 'none', background: 'transparent' }}>
                    <td style={{ padding: '8px', textAlign: 'left', border: 'none', background: 'transparent', verticalAlign: 'top' }}>{index + 1}</td>
                    <td style={{ 
                    padding: '8px', 
                    textAlign: 'left', 
                    border: 'none', 
                    background: 'transparent', 
                    verticalAlign: 'top',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    lineHeight: '1.4'
                    }}>
                    {item.description}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', border: 'none', background: 'transparent', verticalAlign: 'top' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: 'none', background: 'transparent', verticalAlign: 'top' }}>{item.quantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: 'none', background: 'transparent', verticalAlign: 'top' }}>{formatCurrency(item.total)}</td>
                </tr>
                ))}
            </tbody>
            </table>
        );
      
      case 'totalsBlock':
        return (
          <div style={{ textAlign: 'right', lineHeight: '1.8' }}>
            <strong style={{ fontSize: `${element.fontSize + 4}px` }}>Total: {formatCurrency(invoice.total)}</strong>
          </div>
        );
      
      case 'image':
        return element.src ? (
          <img 
            src={element.src} 
            alt="Invoice" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }} 
          />
        ) : null;
      
      case 'line':
        return (
          <div 
            style={{ 
              borderBottom: `${element.thickness || 2}px solid ${element.color || '#000'}`, 
              height: '0',
              width: '100%'
            }}
          />
        );
      
      case 'remarksBlock':
        let remarksHTML = element.content || '';
        
        // Replace placeholders with actual data
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
            remarksHTML = remarksHTML.replace(
            new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
            remarksPlaceholderData[placeholder]
            );
        });
        
        return (
            <div 
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: remarksHTML }}
            />
        );
            
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
          padding: '5px',
          boxSizing: 'border-box',
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