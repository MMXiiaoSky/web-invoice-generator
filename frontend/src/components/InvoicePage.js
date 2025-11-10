import React from 'react';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const InvoicePage = ({
  invoice,
  templateData,
  itemsOverride,
  itemStartIndex = 0,
  hideTotals = false,
  hideRemarks = false,
  disableShadow = false,
  className = ''
}) => {
  const formatCurrency = (amount) =>
    `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

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
      case 'remarksBlock': {
        if (hideRemarks && element.type === 'remarksBlock') {
          return null;
        }
        let displayHTML = element.content ||
          (element.type === 'text' ? 'Text' : 'Remarks');
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
        Object.keys(placeholderData).forEach((placeholder) => {
          displayHTML = displayHTML.replace(
            new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
            placeholderData[placeholder]
          );
        });
        return (
          <div
            className="rtx-content-wrapper"
            dangerouslySetInnerHTML={{ __html: displayHTML }}
          />
        );
      }

      case 'customerBlock':
        return (
          <div>
            <strong>Bill To:</strong><br />
            <strong>{invoice.company_name}</strong><br />
            {invoice.address}<br /><br />
            Attn: {invoice.attention}<br />
            Tel: {invoice.telephone}
          </div>
        );

      case 'invoiceInfo':
        return (
          <div>
            <strong>Invoice No.:</strong> {invoice.invoice_number}<br />
            <strong>Date:</strong> {formatDate(invoice.invoice_date)}
          </div>
        );

      case 'itemsTable': {
        const itemsToRender = Array.isArray(itemsOverride)
          ? itemsOverride
          : Array.isArray(invoice.items)
            ? invoice.items
            : [];

        return (
          <table
            style={{
              width: '100%',
              fontSize: `${element.fontSize}px`,
              background: 'transparent',
              borderCollapse: 'collapse',
              border: 'none'
            }}
          >
            <thead>
              <tr style={{ background: 'transparent', border: 'none' }}>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    width: '40px'
                  }}
                >
                  No.
                </th>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}
                >
                  Item Description
                </th>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    width: '120px'
                  }}
                >
                  Unit Price (RM)
                </th>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '80px'
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    width: '120px'
                  }}
                >
                  Total (RM)
                </th>
              </tr>
            </thead>
            <tbody>
              {itemsToRender.map((item, index) => (
                <tr
                  key={index}
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'left',
                      verticalAlign: 'top'
                    }}
                  >
                    {itemStartIndex + index + 1}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'left',
                      verticalAlign: 'top',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      lineHeight: '1.4'
                    }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                      verticalAlign: 'top'
                    }}
                  >
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      verticalAlign: 'top'
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'right',
                      verticalAlign: 'top'
                    }}
                  >
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      case 'totalsBlock':
        if (hideTotals) {
          return null;
        }
        return (
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: `${element.fontSize + 4}px` }}>
              Total: {formatCurrency(invoice.total)}
            </strong>
          </div>
        );

      case 'image':
        return element.src ? (
          <img
            src={element.src}
            alt="Invoice"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : null;

      case 'line':
        return (
          <div
            style={{
              borderBottom: `${element.thickness || 2}px solid ${
                element.color || '#000'
              }`,
              height: '0',
              width: '100%'
            }}
          />
        );

      default:
        return null;
    }
  };

  const renderElement = (element) => {
    if (
      (hideTotals && element.type === 'totalsBlock') ||
      (hideRemarks && element.type === 'remarksBlock')
    ) {
      return null;
    }

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
          padding:
            element.type === 'image' ||
            element.type === 'line' ||
            element.type === 'itemsTable'
              ? '0'
              : '5px',
          overflow: 'hidden',
          lineHeight: element.lineHeight || 1.4
        }}
      >
        {renderElementContent(element)}
      </div>
    );
  };

  if (!templateData || !templateData.elements) {
    return null;
  }

  return (
    <div
      className={`invoice-preview-canvas ${className}`.trim()}
      style={{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        position: 'relative',
        background: 'white',
        boxShadow: disableShadow ? 'none' : '0 0 20px rgba(0,0,0,0.1)',
        margin: '0 auto'
      }}
    >
      {templateData.elements.map((element) => renderElement(element))}
    </div>
  );
};

export default InvoicePage;
export { A4_WIDTH_PX, A4_HEIGHT_PX };
