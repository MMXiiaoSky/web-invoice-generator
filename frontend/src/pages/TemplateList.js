import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { templatesAPI } from '../utils/api';

const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await templatesAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templatesAPI.delete(id);
        alert('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        alert('Error deleting template');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading templates...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Invoice Templates</h1>
        <Link to="/templates/builder" className="btn btn-primary">
          ➕ Create Template
        </Link>
      </div>

      <div className="card">
        {templates.length === 0 ? (
          <div className="empty-state">
            <h3>No templates yet</h3>
            <p>Create your first template to get started!</p>
            <Link to="/templates/builder" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Create Template
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {templates.map(template => (
              <div key={template.id} className="card" style={{ padding: '20px' }}>
                <h3>{template.name}</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </p>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                  Elements: {template.template_data.elements?.length || 0}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    to={`/templates/builder/${template.id}`}
                    className="btn btn-secondary btn-small"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateList;