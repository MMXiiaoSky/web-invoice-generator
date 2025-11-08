import React, { useState } from 'react';
import axios from 'axios';
import './ImageUpload.css';

const ImageUpload = ({ currentSrc, onImageUpload, onImageRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      // Use relative path - nginx will proxy
      const response = await axios.post('/api/uploads/image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      // Use relative path for image URL
      onImageUpload({
        url: response.data.url,
        width: response.data.width,
        height: response.data.height,
        aspectRatio: response.data.aspectRatio,
        filename: response.data.filename
      });

      setUploading(false);
      setProgress(0);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Error uploading image');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    if (currentSrc && onImageRemove) {
      onImageRemove();
    }
  };

  return (
    <div className="image-upload">
      {currentSrc ? (
        <div className="image-preview">
          <img src={currentSrc} alt="Uploaded" />
          <div className="image-actions">
            <button type="button" onClick={handleRemove} className="btn-remove">
              ✕ Remove Image
            </button>
          </div>
        </div>
      ) : (
        <div className="upload-area">
          <input
            type="file"
            id="image-file-input"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-file-input" className="upload-label">
            {uploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p>Uploading... {progress}%</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <p>Click to upload image</p>
                <small>JPEG, PNG, GIF, WebP, SVG (Max 50MB)</small>
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <div className="upload-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
