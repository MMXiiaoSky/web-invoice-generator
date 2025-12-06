import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../utils/api';
import { downloadPDF } from '../utils/pdfGenerator';
import InvoicePreview from '../components/InvoicePreview';
import './InvoiceView.css';

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const response = await quotationsAPI.getById(id);
      setQuotation(response.data);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      alert('Error loading quotation');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;

    try {
      await downloadPDF(quotation, quotation.template_data, `Quotation_${quotation.quotation_number}.pdf`);
      alert('PDF downloaded successfully!');
    } catch (error) {
      alert('Error generating PDF');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await quotationsAPI.delete(id);
        alert('Quotation deleted successfully');
        navigate('/quotations');
      } catch (error) {
        alert('Error deleting quotation');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading quotation...</div>;
  }

  if (!quotation) {
    return <div className="loading">Quotation not found</div>;
  }

  return (
    <div className="invoice-view">
      <div className="page-header">
        <h1>Quotation: {quotation.quotation_number}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadPDF} className="btn btn-primary">
            📥 Download PDF
          </button>
          <button onClick={() => navigate('/quotations')} className="btn btn-secondary">
            ← Back to List
          </button>
        </div>
      </div>

      <div className="invoice-actions card">
        <div className="invoice-meta-info">
          <div className="meta-item">
            <strong>Customer:</strong> {quotation.company_name}
          </div>
          <div className="meta-item">
            <strong>Date:</strong> {formatDate(quotation.quotation_date)}
          </div>
          <div className="meta-item">
            <strong>Total:</strong> {formatCurrency(quotation.total)}
          </div>
        </div>
        <button onClick={handleDelete} className="btn btn-danger">
          🗑️ Delete Quotation
        </button>
      </div>

      {/* Actual Quotation Preview using Template */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <InvoicePreview invoice={quotation} templateData={quotation.template_data} />
      </div>
    </div>
  );
};

export default QuotationView;
