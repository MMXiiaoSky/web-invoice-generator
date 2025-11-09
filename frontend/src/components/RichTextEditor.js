import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders }) => {
  const editorRef = useRef(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('12');
  const selectionRef = useRef(null); // Ref to store the text selection

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Save the user's selection when they leave the editor
  const handleEditorBlur = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0);
    }
  };

  // Restore the user's selection
  const restoreSelection = () => {
    if (selectionRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
  };

  const updateToolbar = () => {
    const selection = window.getSelection();
    if (!editorRef.current || !selection.anchorNode || !editorRef.current.contains(selection.anchorNode)) {
      return;
    }
    
    if (selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).commonAncestorContainer;
      if (parent.nodeType !== 1) {
        parent = parent.parentNode;
      }
      
      let size = '12';
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
    restoreSelection(); // Restore selection before formatting
    document.execCommand(command, false, value);
    handleInput();
  };

  const changeFontSize = (size) => {
    const newSize = parseInt(size);
    if (isNaN(newSize) || newSize < 1) return;

    restoreSelection(); // CRITICAL: Restore selection before changing font size

    const sizeInPx = `${newSize}px`;
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize', false, '1'); // Dummy command
    const fontElements = editorRef.current.getElementsByTagName('font');
    while (fontElements.length > 0) {
      const span = document.createElement('span');
      span.style.fontSize = sizeInPx;
      span.innerHTML = fontElements[0].innerHTML;
      fontElements[0].parentNode.replaceChild(span, fontElements[0]);
    }
    
    handleInput();
    selectionRef.current = null; // Clear saved selection
  };

  const insertPlaceholder = (placeholder) => {
    restoreSelection();
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
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('bold')} className="toolbar-btn" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('italic')} className="toolbar-btn" title="Italic (Ctrl+I)"><em>I</em></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('underline')} className="toolbar-btn" title="Underline (Ctrl+U)"><u>U</u></button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group font-size-group">
          <input
            list="font-sizes"
            type="text"
            value={currentFontSize}
            onFocus={handleEditorBlur} // Save selection when input is focused
            onChange={(e) => setCurrentFontSize(e.target.value)}
            onBlur={(e) => changeFontSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                changeFontSize(e.target.value);
                e.target.blur(); // Unfocus input after applying
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
        
        {/* ... other toolbar groups ... */}
        <div className="toolbar-group">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('justifyLeft')} className="toolbar-btn" title="Align Left">☰</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('justifyCenter')} className="toolbar-btn" title="Align Center">☷</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('justifyRight')} className="toolbar-btn" title="Align Right">☶</button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <div className="placeholder-dropdown">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPlaceholders(!showPlaceholders)} className="toolbar-btn placeholder-btn" title="Insert Placeholder">{ } Placeholder ▼</button>
            {showPlaceholders && (
              <div className="placeholder-menu">
                {placeholders.map((ph, index) => <button key={index} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertPlaceholder(ph.value)} className="placeholder-menu-item">{ph.label}</button>)}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => formatText('removeFormat')} className="toolbar-btn clear-btn" title="Clear Formatting">✕ Clear</button>
        </div>

      </div>

      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput} 
        onBlur={handleEditorBlur} // Save selection when editor loses focus
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        className="editor-content" 
        suppressContentEditableWarning 
      />
    </div>
  );
};

export default RichTextEditor;
