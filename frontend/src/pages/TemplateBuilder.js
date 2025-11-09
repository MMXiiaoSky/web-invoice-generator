import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templatesAPI } from '../utils/api';
import TemplateCanvas from '../components/TemplateCanvas';
import RichTextEditor from '../components/RichTextEditor';
import ImageUpload from '../components/ImageUpload';
import './TemplateBuilder.css';

const TemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('New Template');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(false);

  const placeholders = [
    { label: 'Company Name', value: '{company_name}' },
    { label: 'Address', value: '{address}' },
    { label: 'Contact Person', value: '{attention}' },
    { label: 'Telephone', value: '{telephone}' },
    { label: 'Invoice Number', value: '{invoice_number}' },
    { label: 'Invoice Date', value: '{invoice_date}' },
    { label: 'Subtotal', value: '{subtotal}' },
    { label: 'Total', value: '{total}' }
  ];

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const response = await templatesAPI.getById(id);
      setTemplateName(response.data.name);
      setElements(response.data.template_data.elements || []);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template');
    }
  };

  const addElement = (type) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'itemsTable' ? 700 : type === 'line' ? 400 : type === 'remarksBlock' ? 400 : 200,
      height: type === 'itemsTable' ? 300 : type === 'line' ? 2 : type === 'customerBlock' ? 120 : type === 'remarksBlock' ? 100 : 80,
      fontSize: 12,
      fontWeight: 'normal',
      color: '#000000',
      content: type === 'text' ? 'Sample Text' : type === 'remarksBlock' ? 'Remarks will appear here on the last page only' : '',
      textDecoration: 'none',
      fontStyle: 'normal',
      lineHeight: 1.4
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement);
  };

  const updateElement = (elementId, updates) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const deleteElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement.id));
      setSelectedElement(null);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setLoading(true);
    const templateData = { elements };

    try {
      if (id) {
        await templatesAPI.update(id, { name: templateName, template_data: templateData });
        alert('Template updated successfully!');
      } else {
        await templatesAPI.create({ name: templateName, template_data: templateData });
        alert('Template created successfully!');
      }
      navigate('/templates');
    } catch (error) {
      alert('Error saving template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="template-builder">
      <div className="builder-header">
        <div>
          <h1>Template Builder</h1>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="template-name-input"
            placeholder="Template Name"
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Template'}
          </button>
          <button onClick={() => navigate('/templates')} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>

      <div className="builder-content">
        <div className="toolbar">
          <h3>Elements</h3>
          
          <div className="toolbar-section">
            <h4>Text Elements</h4>
            <button onClick={() => addElement('text')} className="toolbar-btn">📝 Text Block</button>
          </div>

          <div className="toolbar-section">
            <h4>Data Blocks</h4>
            <button onClick={() => addElement('customerBlock')} className="toolbar-btn">👤 Customer Block</button>
            <button onClick={() => addElement('invoiceInfo')} className="toolbar-btn">📄 Invoice Info</button>
            <button onClick={() => addElement('itemsTable')} className="toolbar-btn">📊 Items Table</button>
            <button onClick={() => addElement('totalsBlock')} className="toolbar-btn">💰 Totals Block</button>
            <button onClick={() => addElement('remarksBlock')} className="toolbar-btn">📝 Remarks Block</button>
          </div>

          <div className="toolbar-section">
            <h4>Media & Shapes</h4>
            <button onClick={() => addElement('image')} className="toolbar-btn">🖼️ Image</button>
            <button onClick={() => addElement('line')} className="toolbar-btn">➖ Line</button>
          </div>

          {selectedElement && (
            <div className="toolbar-section">
              <h4>Element Properties</h4>
              
              {/* --- POSITION --- */}
              <div className="position-inputs">
                <div className="form-group">
                  <label>X Position</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                    className="coord-input"
                  />
                </div>
                <div className="form-group">
                  <label>Y Position</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                    className="coord-input"
                  />
                </div>
              </div>

              {/* --- RICH TEXT EDITOR (for 'text' and 'remarksBlock') --- */}
              {(selectedElement.type === 'text' || selectedElement.type === 'remarksBlock') && (
                <div className="form-group">
                  <label>Text Content</label>
                  <RichTextEditor
                    content={selectedElement.content}
                    onChange={(newContent) => updateElement(selectedElement.id, { content: newContent })}
                    placeholders={placeholders}
                  />
                  <small style={{ color: '#666', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                    Highlight text to show formatting options.
                  </small>
                </div>
              )}

              {/* --- IMAGE UPLOAD --- */}
              {selectedElement.type === 'image' && (
                <div className="form-group">
                  <label>Upload Image</label>
                  <ImageUpload
                    currentSrc={selectedElement.src}
                    onImageUpload={(imageData) => {
                      const maxWidth = 400; const maxHeight = 300;
                      let newWidth = imageData.width; let newHeight = imageData.height;
                      if (newWidth > maxWidth || newHeight > maxHeight) {
                        const scale = Math.min(maxWidth / newWidth, maxHeight / newHeight);
                        newWidth = Math.round(newWidth * scale);
                        newHeight = Math.round(newHeight * scale);
                      }
                      updateElement(selectedElement.id, { src: imageData.url, width: newWidth, height: newHeight, aspectRatio: imageData.aspectRatio, originalWidth: imageData.width, originalHeight: imageData.height });
                    }}
                    onImageRemove={() => updateElement(selectedElement.id, { src: '', aspectRatio: null, originalWidth: null, originalHeight: null })}
                  />
                </div>
              )}

              {/* --- FONT SIZE (for non-rich-text blocks) --- */}
              {selectedElement.type !== 'line' && selectedElement.type !== 'image' && selectedElement.type !== 'text' && selectedElement.type !== 'remarksBlock' && (
                <div className="form-group">
                  <label>Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {/* --- FONT WEIGHT & STYLE (for non-rich-text blocks) --- */}
              {selectedElement.type !== 'line' && selectedElement.type !== 'image' && selectedElement.type !== 'text' && selectedElement.type !== 'remarksBlock' && (
                <>
                  <div className="form-group">
                    <label>Font Weight</label>
                    <select value={selectedElement.fontWeight || 'normal'} onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Font Style</label>
                    <select value={selectedElement.fontStyle || 'normal'} onChange={(e) => updateElement(selectedElement.id, { fontStyle: e.target.value })}>
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </>
              )}

              {/* --- COLOR (for all text-based and line blocks) --- */}
              {selectedElement.type !== 'image' && (
                 <div className="form-group">
                    <label>Color</label>
                    <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} />
                 </div>
              )}

              {/* --- LINE SPACING (for blocks with text) --- */}
              {(selectedElement.type === 'customerBlock' || selectedElement.type === 'invoiceInfo' || selectedElement.type === 'totalsBlock') && (
                <div className="form-group">
                  <label>Line Spacing</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={selectedElement.lineHeight || 1.4}
                    onChange={(e) => updateElement(selectedElement.id, { lineHeight: parseFloat(e.target.value) })}
                  />
                </div>
              )}
              
              {/* --- LINE THICKNESS --- */}
              {selectedElement.type === 'line' && (
                <div className="form-group">
                  <label>Thickness</label>
                  <input type="number" value={selectedElement.thickness || 2} onChange={(e) => updateElement(selectedElement.id, { thickness: parseInt(e.target.value) })} min="1" max="10" />
                </div>
              )}

              {/* --- DELETE BUTTON --- */}
              <button onClick={deleteElement} className="btn btn-danger btn-small" style={{ width: '100%', marginTop: '20px' }}>
                🗑️ Delete Element
              </button>
            </div>
          )}
        </div>

        <div className="canvas-area">
          <TemplateCanvas elements={elements} onElementUpdate={updateElement} selectedElement={selectedElement} onSelectElement={setSelectedElement} />
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
