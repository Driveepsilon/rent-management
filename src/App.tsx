import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/i18n/i18n';

// Components
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import TenantManagement from '@/components/TenantManagement';
import PropertyManagement from '@/components/PropertyManagement';
import InvoiceManagement from '@/components/InvoiceManagement';
import ReceiptManagement from '@/components/ReceiptManagement';
import LeaseAgreements from '@/components/LeaseAgreements';
import EmailHistory from '@/components/EmailHistory';
import ExpenseManagement from '@/components/ExpenseManagement';
import PropertyReport from '@/components/PropertyReport';
import OwnerManagement from '@/components/OwnerManagement';
import TrusteeFeesManagement from '@/components/TrusteeFeesManagement';
import PeriodicInvoicesManagement from '@/components/PeriodicInvoicesManagement';
import NotificationCenter from '@/components/NotificationCenter';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tenants" element={<TenantManagement />} />
                  <Route path="/properties" element={<PropertyManagement />} />
                  <Route path="/invoices" element={<InvoiceManagement />} />
                  <Route path="/receipts" element={<ReceiptManagement />} />
                  <Route path="/leases" element={<LeaseAgreements />} />
                  <Route path="/email-history" element={<EmailHistory />} />
                  <Route path="/expenses" element={<ExpenseManagement />} />
                  <Route path="/reports" element={<PropertyReport />} />
                  <Route path="/owners" element={<OwnerManagement />} />
                  <Route path="/trustee-fees" element={<TrusteeFeesManagement />} />
                  <Route path="/periodic-invoices" element={<PeriodicInvoicesManagement />} />
                  <Route path="/notifications" element={<NotificationCenter />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
            <Toaster />
          </CurrencyProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>);

}

export default App;