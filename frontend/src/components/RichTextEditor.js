import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders }) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const [isToolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [currentFontSize, setCurrentFontSize] = useState('12');

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

  // --- Toolbar Positioning Logic ---
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Don't show if selection is outside the editor
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setToolbarVisible(false);
        return;
      }

      setToolbarPosition({
        top: rect.top - 50, // Position above the selection
        left: rect.left + (rect.width / 2),
      });
      setToolbarVisible(true);
      updateCurrentFontSize(selection);
    } else {
      setToolbarVisible(false);
    }
  };

  const updateCurrentFontSize = (selection) => {
    let parent = selection.getRangeAt(0).commonAncestorContainer;
    parent = parent.nodeType === 1 ? parent : parent.parentNode;
    
    let size = '';
    while (parent && parent !== editorRef.current) {
      if (parent.style && parent.style.fontSize) {
        size = parent.style.fontSize.replace('px', '');
        break;
      }
      parent = parent.parentNode;
    }
    setCurrentFontSize(size || '12'); // Default to 12 if not found
  };
  
  // --- Formatting Commands ---
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
  };
  
  const changeFontSize = (size) => {
    const newSize = parseInt(size);
    if (isNaN(newSize) || newSize < 1) return;

    setCurrentFontSize(String(newSize));
    const sizeInPx = `${newSize}px`;

    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize', false, '1'); // Dummy value
    const fontElements = editorRef.current.getElementsByTagName('font');
    while (fontElements.length > 0) {
      const span = document.createElement('span');
      span.style.fontSize = sizeInPx;
      span.innerHTML = fontElements[0].innerHTML;
      fontElements[0].parentNode.replaceChild(span, fontElements[0]);
    }
    
    handleInput();
  };

  const insertPlaceholder = (placeholder) => {
    document.execCommand('insertText', false, placeholder);
    handleInput();
  };

  const preventDefault = (e) => e.preventDefault();

  return (
    <div className="rich-text-editor-container">
      {isToolbarVisible && (
        <div
          className="floating-toolbar"
          ref={toolbarRef}
          style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
          onMouseDown={preventDefault}
        >
          <div className="toolbar-group">
            <button type="button" onClick={() => formatText('bold')} className="toolbar-btn" title="Bold"><strong>B</strong></button>
            <button type="button" onClick={() => formatText('italic')} className="toolbar-btn" title="Italic"><em>I</em></button>
            <button type="button" onClick={() => formatText('underline')} className="toolbar-btn" title="Underline"><u>U</u></button>
          </div>
          <div className="toolbar-separator"></div>
          <div className="toolbar-group font-size-group">
            <input
              list="font-sizes-floating"
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
            <datalist id="font-sizes-floating">
              {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => <option key={size} value={size} />)}
            </datalist>
          </div>
          {/* Add other buttons like placeholders if needed */}
        </div>
      )}

      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput} 
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className="editor-content" 
        suppressContentEditableWarning 
      />
    </div>
  );
};

export default RichTextEditor;
