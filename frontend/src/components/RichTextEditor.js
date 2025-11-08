import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ content, onChange, placeholders }) => {
  const editorRef = useRef(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);

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

  const getCurrentFontSize = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const parent = selection.getRangeAt(0).commonAncestorContainer.parentElement;
      const fontSize = window.getComputedStyle(parent).fontSize;
      return parseInt(fontSize);
    }
    return 12;
  };

  const changeFontSize = (size) => {
    formatText('fontSize', '7'); // Use size 7 as placeholder
    const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
    fontElements.forEach(element => {
      element.removeAttribute('size');
      element.style.fontSize = `${size}px`;
    });
    handleInput();
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="toolbar-btn"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="toolbar-btn"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => formatText('underline')}
            className="toolbar-btn"
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <select
            onChange={(e) => changeFontSize(e.target.value)}
            className="font-size-select"
            defaultValue="12"
            title="Font Size"
          >
            <option value="8">8px</option>
            <option value="10">10px</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
            <option value="48">48px</option>
          </select>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('justifyLeft')}
            className="toolbar-btn"
            title="Align Left"
          >
            ☰
          </button>
          <button
            type="button"
            onClick={() => formatText('justifyCenter')}
            className="toolbar-btn"
            title="Align Center"
          >
            ☷
          </button>
          <button
            type="button"
            onClick={() => formatText('justifyRight')}
            className="toolbar-btn"
            title="Align Right"
          >
            ☶
          </button>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <div className="placeholder-dropdown">
            <button
              type="button"
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="toolbar-btn placeholder-btn"
              title="Insert Placeholder"
            >
              { } Placeholder ▼
            </button>
            {showPlaceholders && (
              <div className="placeholder-menu">
                {placeholders.map((ph, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertPlaceholder(ph.value)}
                    className="placeholder-menu-item"
                  >
                    {ph.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => formatText('removeFormat')}
            className="toolbar-btn clear-btn"
            title="Clear Formatting"
          >
            ✕ Clear
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="editor-content"
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;