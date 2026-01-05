import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';
import { downloadPDF } from '../utils/pdfGenerator';
import InvoicePreview from '../components/InvoicePreview';
import './InvoiceView.css';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await invoicesAPI.getById(id);
      setInvoice(response.data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error loading invoice');
      navigate('/invoices');
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
    if (!invoice) return;

    try {
      await downloadPDF(invoice, invoice.template_data);
      alert('PDF downloaded successfully!');
    } catch (error) {
      alert('Error generating PDF');
      console.error(error);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await invoicesAPI.updateStatus(id, status);
      fetchInvoice();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesAPI.delete(id);
        alert('Invoice deleted successfully');
        navigate('/invoices');
      } catch (error) {
        alert('Error deleting invoice');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="loading">Invoice not found</div>;
  }

  return (
    <div className="invoice-view">
      <div className="page-header">
        <h1>Invoice: {invoice.invoice_number}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownloadPDF} className="btn btn-primary">
            📥 Download PDF
          </button>
          <button onClick={() => navigate(`/invoices/edit/${id}`)} className="btn btn-secondary">
            ✏️ Edit Invoice
          </button>
          <button onClick={() => navigate('/invoices')} className="btn btn-secondary">
            ← Back to List
          </button>
        </div>
      </div>

      <div className="invoice-actions card">
        <div className="invoice-meta-info">
          <div className="meta-item">
            <strong>Customer:</strong> {invoice.company_name}
          </div>
          <div className="meta-item">
            <strong>Date:</strong> {formatDate(invoice.invoice_date)}
          </div>
          <div className="meta-item">
            <strong>Total:</strong> {formatCurrency(invoice.total)}
          </div>
          <div className="meta-item">
            <strong>Status:</strong>
            <select
              value={invoice.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`status-select ${invoice.status === 'paid' ? 'paid' : 'unpaid'}`}
            >
              <option value="paid">PAID</option>
              <option value="unpaid">UNPAID</option>
            </select>
          </div>
        </div>
        <button onClick={handleDelete} className="btn btn-danger">
          🗑️ Delete Invoice
        </button>
      </div>

      {/* Actual Invoice Preview using Template */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <InvoicePreview invoice={invoice} templateData={invoice.template_data} />
      </div>
    </div>
  );
};

export default InvoiceView;
