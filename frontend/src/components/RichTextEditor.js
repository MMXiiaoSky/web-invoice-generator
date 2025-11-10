import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders, lineSpacing, onLineSpacingChange }) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const [isToolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [currentFontSize, setCurrentFontSize] = useState('12');
  const selectionRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);
  
  useEffect(() => {
    if (editorRef.current) {
        editorRef.current.style.lineHeight = lineSpacing || 1.4;
    }
  }, [lineSpacing]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
  };

  const ensureSelectionActive = () => {
    requestAnimationFrame(() => {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        restoreSelection();
      }

      const refreshedSelection = window.getSelection();
      if (refreshedSelection && refreshedSelection.rangeCount > 0) {
        selectionRef.current = refreshedSelection.getRangeAt(0).cloneRange();
        updateCurrentFontSize(refreshedSelection);
      }
    });
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        setToolbarVisible(false);
        return;
      }

      // Persist the current selection so formatting commands keep working
      selectionRef.current = range.cloneRange();

      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      let left = rect.left + window.scrollX + rect.width / 2;
      
      // Prevent toolbar from going off-screen
      if (toolbarRef.current) {
        const toolbarWidth = toolbarRef.current.offsetWidth;
        const minLeft = toolbarWidth / 2 + 10;
        const maxLeft = window.innerWidth - toolbarWidth / 2 - 10;
        left = Math.max(minLeft, Math.min(left, maxLeft));
      }

      setToolbarPosition({
        top: rect.top + window.scrollY - 50,
        left: left,
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
    setCurrentFontSize(size || '12');
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const formatText = (command, value = null) => {
    restoreSelection();
    document.execCommand(command, false, value);
    handleInput();
    ensureSelectionActive();
    editorRef.current.focus();
  };

  const changeFontSize = (size) => {
    const newSize = parseInt(size, 10);
    if (isNaN(newSize) || newSize < 1) return;

    restoreSelection();

    const sizeInPx = `${newSize}px`;
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '1');
    const fontElements = editorRef.current.getElementsByTagName('font');
    while (fontElements.length > 0) {
      const span = document.createElement('span');
      span.style.fontSize = sizeInPx;
      span.innerHTML = fontElements[0].innerHTML;
      fontElements[0].parentNode.replaceChild(span, fontElements[0]);
    }
    setCurrentFontSize(String(newSize));
    handleInput();
    ensureSelectionActive();
    editorRef.current.focus();
  };

  const handleFontSizeChange = (event) => {
    const { value } = event.target;
    setCurrentFontSize(value);

    if (event.nativeEvent?.inputType === 'insertReplacementText') {
      changeFontSize(value);
    }
  };

  const handleToolbarMouseDown = (e) => {
    const target = e.target;
    if (!(target instanceof Element) || !target.closest('input')) {
      e.preventDefault();
    }
  };

  return (
    <div className="rich-text-editor-container">
      {isToolbarVisible && (
        <div
          className="floating-toolbar"
          ref={toolbarRef}
          style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}
          onMouseDown={handleToolbarMouseDown}
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
              onMouseDown={saveSelection}
              onFocus={saveSelection}
              onChange={handleFontSizeChange}
              onBlur={(e) => changeFontSize(e.target.value)}
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
        </div>
      )}
      
      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput} 
        onBlur={saveSelection}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className="editor-content" 
        suppressContentEditableWarning 
      />
    </div>
  );
};

export default RichTextEditor;
