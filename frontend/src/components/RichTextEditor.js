import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders }) => {
  const editorRef = useRef(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('12');

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Update toolbar state based on cursor position
  const updateToolbar = () => {
    const selection = window.getSelection();
    if (!editorRef.current || !editorRef.current.contains(selection.anchorNode)) {
      // Selection is not in the editor
      return;
    }
    
    if (selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).commonAncestorContainer;
      if (parent.nodeType !== 1) {
        parent = parent.parentNode;
      }
      
      let size = '12'; // Default
      while (parent && parent !== editorRef.current) {
        if (parent.style && parent.style.fontSize) {
          size = parent.style.fontSize.replace('px', '');
          break;
        }
        parent = parent.parentNode;
      }
      setCurrentFontSize(size);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput(); // Ensure state updates after formatting
  };

  const changeFontSize = (size) => {
    const newSize = parseInt(size);
    if (isNaN(newSize) || newSize < 1) return; // Ignore invalid input

    const sizeInPx = `${newSize}px`;
    setCurrentFontSize(String(newSize));

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed) {
      editorRef.current.focus();

      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontSize', false, '1'); // Dummy value to create <font> tags
      const fontElements = editorRef.current.getElementsByTagName('font');
      while (fontElements.length > 0) {
        const span = document.createElement('span');
        span.style.fontSize = sizeInPx;
        span.innerHTML = fontElements[0].innerHTML;
        fontElements[0].parentNode.replaceChild(span, fontElements[0]);
      }
    }
    
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
          <input
            list="font-sizes"
            type="text"
            value={currentFontSize}
            onChange={(e) => {
              setCurrentFontSize(e.target.value);
              changeFontSize(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                changeFontSize(e.target.value);
              }
            }}
            className="font-size-input-datalist"
            title="Font Size"
          />
          <datalist id="font-sizes">
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => <option key={size} value={size} />)}
          </datalist>
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

      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput} 
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        className="editor-content" 
        suppressContentEditableWarning 
      />
    </div>
  );
};

export default RichTextEditor;
