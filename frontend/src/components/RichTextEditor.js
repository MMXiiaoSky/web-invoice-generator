import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders }) => {
  const editorRef = useRef(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [manualFontSize, setManualFontSize] = useState('12');

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const changeFontSize = (size) => {
    setManualFontSize(size);
    formatText('fontSize', '7'); // Use size 7 as placeholder
    const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
    fontElements.forEach(element => {
      element.removeAttribute('size');
      element.style.fontSize = `${size}px`;
    });
    handleInput();
  };

  const insertPlaceholder = (placeholder) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(placeholder);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
    setShowPlaceholders(false);
    editorRef.current.focus();
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => formatText('bold')} className="toolbar-btn" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button type="button" onClick={() => formatText('italic')} className="toolbar-btn" title="Italic (Ctrl+I)"><em>I</em></button>
          <button type="button" onClick={() => formatText('underline')} className="toolbar-btn" title="Underline (Ctrl+U)"><u>U</u></button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group font-size-group">
          <select onChange={(e) => changeFontSize(e.target.value)} className="font-size-select" value={manualFontSize} title="Font Size">
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => <option key={size} value={size}>{size}px</option>)}
          </select>
          <input
            type="number"
            value={manualFontSize}
            onChange={(e) => setManualFontSize(e.target.value)}
            onBlur={() => changeFontSize(manualFontSize)}
            onKeyDown={(e) => e.key === 'Enter' && changeFontSize(manualFontSize)}
            className="font-size-input"
            min="1"
          />
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button type="button" onClick={() => formatText('justifyLeft')} className="toolbar-btn" title="Align Left">☰</button>
          <button type="button" onClick={() => formatText('justifyCenter')} className="toolbar-btn" title="Align Center">☷</button>
          <button type="button" onClick={() => formatText('justifyRight')} className="toolbar-btn" title="Align Right">☶</button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <div className="placeholder-dropdown">
            <button type="button" onClick={() => setShowPlaceholders(!showPlaceholders)} className="toolbar-btn placeholder-btn" title="Insert Placeholder">{ } Placeholder ▼</button>
            {showPlaceholders && (
              <div className="placeholder-menu">
                {placeholders.map((ph, index) => <button key={index} type="button" onClick={() => insertPlaceholder(ph.value)} className="placeholder-menu-item">{ph.label}</button>)}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button type="button" onClick={() => formatText('removeFormat')} className="toolbar-btn clear-btn" title="Clear Formatting">✕ Clear</button>
        </div>
      </div>

      <div ref={editorRef} contentEditable onInput={handleInput} className="editor-content" suppressContentEditableWarning />
    </div>
  );
};

export default RichTextEditor;
