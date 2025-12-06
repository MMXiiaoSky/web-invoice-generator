import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceView from './pages/InvoiceView';
import QuotationList from './pages/QuotationList';
import QuotationCreate from './pages/QuotationCreate';
import QuotationView from './pages/QuotationView';
import CustomerList from './pages/CustomerList';
import ItemList from './pages/ItemList';
import TemplateBuilder from './pages/TemplateBuilder';
import TemplateList from './pages/TemplateList';
import UserManagement from './pages/UserManagement';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/invoices" element={<PrivateRoute><InvoiceList /></PrivateRoute>} />
          <Route path="/invoices/create" element={<PrivateRoute><InvoiceCreate /></PrivateRoute>} />
          <Route path="/invoices/:id" element={<PrivateRoute><InvoiceView /></PrivateRoute>} />
          <Route path="/quotations" element={<PrivateRoute><QuotationList /></PrivateRoute>} />
          <Route path="/quotations/create" element={<PrivateRoute><QuotationCreate /></PrivateRoute>} />
          <Route path="/quotations/:id" element={<PrivateRoute><QuotationView /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
          <Route path="/items" element={<PrivateRoute><ItemList /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><TemplateList /></PrivateRoute>} />
          <Route path="/templates/builder" element={<PrivateRoute><TemplateBuilder /></PrivateRoute>} />
          <Route path="/templates/builder/:id" element={<PrivateRoute><TemplateBuilder /></PrivateRoute>} />
          
          <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;