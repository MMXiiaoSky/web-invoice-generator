import React from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './TemplateCanvas.css';

const TemplateCanvas = ({ elements, onElementUpdate, selectedElement, onSelectElement }) => {
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const handleDrag = (elementId, e, data) => {
    e.stopPropagation();
    onElementUpdate(elementId, { x: data.x, y: data.y });
  };

  const handleResize = (elementId, event, { size }) => {
    event.stopPropagation();
    onElementUpdate(elementId, { width: size.width, height: size.height });
  };

  const handleClick = (e, element) => {
    e.stopPropagation();
    onSelectElement(element);
  };

  const handleCanvasClick = (e) => {
    if (e.target.className === 'canvas') {
      onSelectElement(null);
    }
  };

  const renderElementContent = (element) => {
    switch (element.type) {
      case 'text':
      case 'remarksBlock':
        let displayHTML = element.content || (element.type === 'text' ? 'Text' : 'Remarks');
        const sampleData = {
          '{company_name}': 'Sample Company Sdn Bhd',
          '{address}': 'No. 123, Jalan Sample, 50450 KL',
          '{attention}': 'John Doe',
          '{telephone}': '+6012-345 6789',
          '{invoice_number}': '20240115_001',
          '{invoice_date}': '15/01/2024',
          '{subtotal}': 'RM 1,000.00',
          '{total}': 'RM 1,000.00'
        };
        Object.keys(sampleData).forEach(placeholder => {
          displayHTML = displayHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), sampleData[placeholder]);
        });
        return <div style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: displayHTML }} />;
      
      case 'customerBlock':
        return (
          <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <strong>Bill To:</strong><br/>
            <strong>Company Name</strong><br/>
            Address<br/><br/>
            Attn: Contact Person<br/>
            Tel: +6012-345 6789
          </div>
        );
      
      case 'invoiceInfo':
        return (
          <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <strong>Invoice No.:</strong> 20240115_001<br/>
            <strong>Date:</strong> 15/01/2024
          </div>
        );
      
      case 'itemsTable':
        return (
          <table style={{ width: '100%', fontSize: `${element.fontSize}px`, pointerEvents: 'none', userSelect: 'none' }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', width: '40px', background: 'transparent' }}>No.</th>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', background: 'transparent' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', background: 'transparent' }}>Price (RM)</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px', background: 'transparent' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '120px', background: 'transparent' }}>Total (RM)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'transparent' }}>
                <td style={{ padding: '8px', textAlign: 'left', background: 'transparent', verticalAlign: 'top' }}>1</td>
                <td style={{ padding: '8px', textAlign: 'left', background: 'transparent', verticalAlign: 'top', whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.4' }}>Sample Item<br/>- Multi-line example</td>
                <td style={{ padding: '8px', textAlign: 'right', background: 'transparent', verticalAlign: 'top' }}>RM 100.00</td>
                <td style={{ padding: '8px', textAlign: 'center', background: 'transparent', verticalAlign: 'top' }}>2</td>
                <td style={{ padding: '8px', textAlign: 'right', background: 'transparent', verticalAlign: 'top' }}>RM 200.00</td>
              </tr>
            </tbody>
          </table>
        );
      
      case 'totalsBlock':
        return (
          <div style={{ textAlign: 'right', pointerEvents: 'none', userSelect: 'none' }}>
            <strong style={{ fontSize: `${element.fontSize + 4}px` }}>Total: RM 1,000.00</strong>
          </div>
        );
      
      case 'image':
        return element.src ? <img src={element.src} alt="Template" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', draggable: false }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '24px', pointerEvents: 'none', userSelect: 'none' }}>🖼️ Image</div>;
      
      case 'line':
        return <div style={{ borderBottom: `${element.thickness || 2}px solid ${element.color || '#000'}`, height: '0', width: '100%', pointerEvents: 'none' }} />;
      
      default:
        return element.content || element.type;
    }
  };

  const renderElement = (element) => {
    const isSelected = selectedElement?.id === element.id;
    const maxWidth = A4_WIDTH - element.x;
    const maxHeight = A4_HEIGHT - element.y;
    const lockAspectRatio = element.type === 'image' && element.aspectRatio;
    
    return (
      <Draggable key={element.id} position={{ x: element.x, y: element.y }} onStop={(e, data) => handleDrag(element.id, e, data)} bounds="parent" handle=".drag-handle">
        <div className={`element-wrapper ${isSelected ? 'selected' : ''}`} style={{ position: 'absolute', width: element.width, height: element.height }} onClick={(e) => handleClick(e, element)}>
          <ResizableBox width={element.width} height={element.height} onResize={(e, data) => handleResize(element.id, e, data)} minConstraints={[50, 20]} maxConstraints={[maxWidth, maxHeight]} resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']} lockAspectRatio={lockAspectRatio}>
            <div className="element-content drag-handle" style={{ padding: (element.type === 'image' || element.type === 'line' || element.type === 'itemsTable') ? '0' : '5px', height: '100%', width: '100%', overflow: 'hidden', cursor: 'move', lineHeight: '1.4' }}>
              {renderElementContent(element)}
            </div>
          </ResizableBox>
          {isSelected && <div className="selection-indicator">✓ Selected</div>}
        </div>
      </Draggable>
    );
  };

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <div className="canvas" style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px`, position: 'relative', background: 'white', boxShadow: '0 0 10px rgba(0,0,0,0.1)', margin: '0 auto' }} onClick={handleCanvasClick}>
          {elements.map(element => renderElement(element))}
        </div>
      </div>
    </div>
  );
};

export default TemplateCanvas;
